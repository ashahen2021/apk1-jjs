import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { FORMATS } from "../shared/catalog.ts";
import type { Project, SceneRenderProps } from "../shared/schema.ts";
import { slugify } from "../shared/timing.ts";
import { mixProject } from "./audio.ts";
import { ffmpeg, probe } from "./ff.ts";
import { CACHE_DIR, ENGINE_DIR, ENGINE_ENTRY, ensureDir, loadSettings, OUTPUT_DIR, PUBLIC_DIR, ROOT } from "./paths.ts";
import { resolveTimeline, Timeline, TimelineScene } from "./timeline.ts";

export type Progress = { stage: string; message: string; percent: number; scene?: number };
type OnProgress = (p: Progress) => void;

const sha = (s: string) => crypto.createHash("sha1").update(s).digest("hex");

const walk = (dir: string, out: string[] = []): string[] => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
};

/** Fingerprint of the engine source + shared code: any change invalidates caches. */
export const engineHash = () => {
  const files = [...walk(path.join(ENGINE_DIR, "src")), ...walk(path.join(ROOT, "shared")), ...walk(PUBLIC_DIR)].sort();
  const h = crypto.createHash("sha1");
  for (const f of files) { const st = fs.statSync(f); h.update(`${path.relative(ROOT, f)}|${st.size}|${Math.round(st.mtimeMs)}\n`); }
  return h.digest("hex").slice(0, 12);
};

let bundlePromise: { hash: string; url: Promise<string> } | null = null;
/** Webpack bundle of the engine, built once per engine version and kept on disk. */
export const getBundle = (onProgress?: OnProgress) => {
  const hash = engineHash();
  if (bundlePromise?.hash === hash) return bundlePromise.url;
  const outDir = path.join(CACHE_DIR, `bundle-${hash}`);
  const url = (async () => {
    if (fs.existsSync(path.join(outDir, "index.html"))) return outDir;
    for (const d of fs.existsSync(CACHE_DIR) ? fs.readdirSync(CACHE_DIR) : []) if (d.startsWith("bundle-")) fs.rmSync(path.join(CACHE_DIR, d), { recursive: true, force: true });
    onProgress?.({ stage: "bundle", message: "Preparing the animation engine (first run only)…", percent: 0 });
    const tmp = outDir + ".tmp";
    fs.rmSync(tmp, { recursive: true, force: true });
    await bundle({ entryPoint: ENGINE_ENTRY, publicDir: PUBLIC_DIR, outDir: tmp, onProgress: (p) => onProgress?.({ stage: "bundle", message: `Preparing the animation engine… ${p}%`, percent: p }) });
    fs.renameSync(tmp, outDir);
    return outDir;
  })();
  bundlePromise = { hash, url };
  url.catch(() => { bundlePromise = null; });
  return url;
};

let browser: ReturnType<typeof openBrowser> | null = null;
const getBrowser = () => (browser ??= openBrowser("chrome"));
export const closeBrowser = async () => { if (browser) { const b = await browser; browser = null; await b.close({ silent: true }); } };

const concurrency = () => { const c = loadSettings().renderConcurrency; return c > 0 ? c : Math.max(1, Math.min(8, os.cpus().length)); };

export const scenePropsOf = (project: Project, s: TimelineScene): SceneRenderProps => ({
  scene: { ...s.scene, narrationFile: undefined }, // audio files never affect pixels
  format: project.format,
  fps: project.fps,
  durationInFrames: s.durationInFrames,
  cues: s.cues,
  wordCues: s.wordCues,
  subtitles: project.subtitles,
});

/** Cache key for one scene's pixels. */
export const sceneKey = (props: SceneRenderProps) => sha(JSON.stringify(props) + engineHash()).slice(0, 20);

/** Render one scene to a silent H.264 clip, or reuse the cached clip if nothing changed. */
export const renderSceneClip = async (project: Project, s: TimelineScene, onProgress?: OnProgress): Promise<{ file: string; cached: boolean }> => {
  const inputProps = scenePropsOf(project, s);
  const file = path.join(ensureDir(path.join(CACHE_DIR, "scenes")), `${sceneKey(inputProps)}.mp4`);
  if (fs.existsSync(file)) return { file, cached: true };
  const serveUrl = await getBundle(onProgress);
  const puppeteerInstance = await getBrowser();
  const composition = await selectComposition({ serveUrl, id: "StudioScene", inputProps, puppeteerInstance });
  const tmp = file.replace(/\.mp4$/, ".part.mp4");
  await renderMedia({
    composition, serveUrl, inputProps, puppeteerInstance,
    codec: "h264", crf: 18, pixelFormat: "yuv420p", imageFormat: "jpeg", jpegQuality: 92, muted: true,
    outputLocation: tmp, concurrency: concurrency(), overwrite: true, logLevel: "error",
    onProgress: ({ progress }) => onProgress?.({ stage: "scene", scene: s.index, message: `Rendering scene ${s.index + 1}`, percent: Math.round(progress * 100) }),
  });
  fs.renameSync(tmp, file);
  return { file, cached: false };
};

/** Single frame of a scene as PNG (storyboard preview). Cached. */
export const renderScenePreview = async (project: Project, s: TimelineScene, frame: number, scale = 0.5) => {
  const inputProps = scenePropsOf(project, s);
  const fr = Math.max(0, Math.min(s.durationInFrames - 1, Math.round(frame)));
  const file = path.join(ensureDir(path.join(CACHE_DIR, "stills")), `${sceneKey(inputProps)}-${fr}-${scale}.png`);
  if (!fs.existsSync(file)) {
    const serveUrl = await getBundle();
    const puppeteerInstance = await getBrowser();
    const composition = await selectComposition({ serveUrl, id: "StudioScene", inputProps, puppeteerInstance });
    await renderStill({ composition, serveUrl, inputProps, puppeteerInstance, frame: fr, output: file, scale, logLevel: "error" });
  }
  return file;
};

export type RenderReport = { file: string; seconds: number; frames: number; width: number; height: number; fps: number; scenes: number; rendered: number; reused: number; narrated: number; warnings: string[]; tookSec: number };

/**
 * Full export: render (or reuse) every scene, join the clips without
 * re-encoding, mix narration + music + foley, and mux the MP4.
 */
export const renderProject = async (project: Project, projectDir: string, onProgress?: OnProgress, only?: number): Promise<RenderReport> => {
  const t0 = Date.now();
  const tl: Timeline = await resolveTimeline(project, projectDir);
  const picked = only === undefined ? tl.scenes : tl.scenes.filter((s) => s.index === only);
  if (!picked.length) throw new Error(`Scene ${only! + 1} does not exist (the project has ${tl.scenes.length}).`);
  const clips: string[] = [];
  let rendered = 0, reused = 0, done = 0;
  const frames = picked.reduce((a, s) => a + s.durationInFrames, 0);
  for (const s of picked) {
    const before = done;
    const { file, cached } = await renderSceneClip(project, s, (p) => onProgress?.(p.stage === "scene" ? { ...p, message: `${p.message} of ${tl.scenes.length} (${s.scene.template})`, percent: Math.round(((before + (p.percent / 100) * s.durationInFrames) / frames) * 88) } : { ...p, percent: 0 }));
    cached ? reused++ : rendered++;
    done += s.durationInFrames;
    clips.push(file);
    onProgress?.({ stage: "scene", scene: s.index, message: cached ? `Scene ${s.index + 1}: reused cached render` : `Scene ${s.index + 1}: rendered`, percent: Math.round((done / frames) * 88) });
  }
  const work = ensureDir(path.join(CACHE_DIR, "work"));
  const tag = sha(clips.join("|")).slice(0, 10);
  const video = path.join(work, `${tag}-video.mp4`);
  onProgress?.({ stage: "assemble", message: "Joining scenes…", percent: 90 });
  const list = path.join(work, `${tag}.txt`);
  fs.writeFileSync(list, clips.map((c) => `file '${c.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n"));
  await ffmpeg(["-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", video]);

  onProgress?.({ stage: "audio", message: "Mixing narration, music and sound…", percent: 93 });
  // a single-scene export is timed from zero
  const subTl: Timeline = only === undefined ? tl : { ...tl, scenes: picked.map((s) => ({ ...s, startFrame: 0 })), totalFrames: frames };
  const wav = path.join(work, `${tag}-mix.wav`);
  const { narrated, contained } = await mixProject(project, projectDir, subTl, wav);
  const mixWarnings = contained.map((i) => `Scene ${i + 1}: the narration was longer than the scene and was faded out at the scene end so it does not play over the next scene.`);

  onProgress?.({ stage: "mux", message: "Writing MP4…", percent: 97 });
  const name = `${slugify(project.title)}-${project.format.replace(":", "x")}${only === undefined ? "" : `-scene${String(only + 1).padStart(2, "0")}`}.mp4`;
  const out = path.join(ensureDir(OUTPUT_DIR), name);
  await ffmpeg(["-v", "error", "-i", video, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out]);
  fs.rmSync(video, { force: true }); fs.rmSync(wav, { force: true }); fs.rmSync(list, { force: true });
  onProgress?.({ stage: "done", message: `Finished: ${name}`, percent: 100 });
  return { file: out, seconds: frames / project.fps, frames, ...FORMATS[project.format], fps: project.fps, scenes: picked.length, rendered, reused, narrated, warnings: [...tl.warnings, ...mixWarnings], tookSec: (Date.now() - t0) / 1000 };
};

/** Independent check of an exported file. */
export const inspectOutput = async (file: string) => {
  const info = await probe(file);
  const v = info.streams.find((s) => s.codec_type === "video")!;
  const a = info.streams.find((s) => s.codec_type === "audio");
  return { codec: v.codec_name, width: Number(v.width), height: Number(v.height), fps: v.r_frame_rate, frames: Number(v.nb_read_frames), seconds: Number(info.format.duration), audio: a ? `${a.codec_name} ${a.sample_rate} Hz` : "none", bytes: fs.statSync(file).size };
};
