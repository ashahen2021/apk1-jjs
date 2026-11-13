// Reproducible baselines: a compact fingerprint of everything about a project
// that must not drift — scene order, exact frame timings, subtitle cues, the
// inputs handed to the renderer, and the identity of every narration file.
//
// Baselines live in baselines/<slug>.json and are compared by the self-test.
// Capturing reads files only; it never writes inside a project folder.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Project } from "../shared/schema.ts";
import { ROOT } from "./paths.ts";
import { sha256File } from "./persist.ts";
import { loadProject } from "./projects.ts";
import { resolveTimeline } from "./timeline.ts";

export const BASELINE_DIR = path.join(ROOT, "baselines");
const sha = (v: unknown) => crypto.createHash("sha256").update(typeof v === "string" ? v : JSON.stringify(v)).digest("hex");

export type Baseline = {
  schema: 1;
  slug: string;
  projectFileSha256: string;
  title: string; format: string; fps: number; subtitles: boolean; audio: Project["audio"];
  sceneCount: number; totalFrames: number; seconds: number;
  scenes: {
    n: number; id: string; template: string; startFrame: number; durationInFrames: number;
    narrationSec: number; measured: boolean; cueCount: number;
    cuesSha256: string;        // exact subtitle timing and text
    renderInputSha256: string; // exactly what the renderer receives for this scene
    narrationSha256: string;   // the spoken text
    narrationFile: string | null;
  }[];
  /** Every file in narration/, so a moved, renamed, replaced or added file is detected. */
  narrationFiles: { file: string; bytes: number; sha256: string }[];
  warnings: string[];
};

export const captureBaseline = async (dirOrFile: string): Promise<Baseline> => {
  const { project, dir } = loadProject(dirOrFile);
  const tl = await resolveTimeline(project, dir);
  const folder = path.join(dir, "narration");
  const narrationFiles = fs.existsSync(folder)
    ? fs.readdirSync(folder).sort().filter((f) => fs.statSync(path.join(folder, f)).isFile()).map((f) => ({ file: `narration/${f}`, bytes: fs.statSync(path.join(folder, f)).size, sha256: sha256File(path.join(folder, f)) }))
    : [];
  return {
    schema: 1,
    slug: path.basename(dir),
    projectFileSha256: sha256File(path.join(dir, "project.json")),
    title: project.title, format: project.format, fps: project.fps, subtitles: project.subtitles, audio: project.audio,
    sceneCount: tl.scenes.length, totalFrames: tl.totalFrames, seconds: Number(tl.seconds.toFixed(4)),
    scenes: tl.scenes.map((s) => ({
      n: s.index + 1, id: s.scene.id, template: s.scene.template, startFrame: s.startFrame, durationInFrames: s.durationInFrames,
      narrationSec: Number(s.narrationSec.toFixed(4)), measured: !s.estimated, cueCount: s.cues.length,
      cuesSha256: sha(s.cues),
      // Mirrors scenePropsOf() in render.ts: the audio path never affects pixels.
      renderInputSha256: sha({ scene: { ...s.scene, narrationFile: undefined }, format: project.format, fps: project.fps, durationInFrames: s.durationInFrames, cues: s.cues, subtitles: project.subtitles }),
      narrationSha256: sha(s.scene.narration),
      narrationFile: s.scene.narrationFile ?? null,
    })),
    narrationFiles,
    warnings: tl.warnings,
  };
};

export const baselineFile = (slug: string) => path.join(BASELINE_DIR, `${slug}.json`);
export const readBaseline = (slug: string): Baseline | null => (fs.existsSync(baselineFile(slug)) ? JSON.parse(fs.readFileSync(baselineFile(slug), "utf8")) : null);

/** Differences between a recorded baseline and the project as it is now (empty = identical). */
export const compareBaseline = (was: Baseline, now: Baseline): string[] => {
  const out: string[] = [];
  const same = (what: string, a: unknown, b: unknown) => { if (JSON.stringify(a) !== JSON.stringify(b)) out.push(`${what}: was ${JSON.stringify(a)}, now ${JSON.stringify(b)}`); };
  same("project.json sha256", was.projectFileSha256, now.projectFileSha256);
  for (const k of ["title", "format", "fps", "subtitles", "audio", "sceneCount", "totalFrames"] as const) same(k, was[k], now[k]);
  same("scene order", was.scenes.map((s) => s.id), now.scenes.map((s) => s.id));
  for (const [i, a] of was.scenes.entries()) {
    const b = now.scenes[i];
    if (!b) continue;
    for (const k of ["template", "startFrame", "durationInFrames", "measured", "cueCount", "cuesSha256", "renderInputSha256", "narrationSha256", "narrationFile"] as const) same(`scene ${a.n} ${k}`, a[k], b[k]);
    if (Math.abs(a.narrationSec - b.narrationSec) > 0.002) out.push(`scene ${a.n} narrationSec: was ${a.narrationSec}, now ${b.narrationSec}`);
  }
  const index = new Map(now.narrationFiles.map((f) => [f.file, f]));
  for (const f of was.narrationFiles) {
    const g = index.get(f.file);
    if (!g) out.push(`narration file missing (moved, renamed or deleted): ${f.file}`);
    else if (g.sha256 !== f.sha256 || g.bytes !== f.bytes) out.push(`narration file changed (replaced or regenerated): ${f.file}`);
    index.delete(f.file);
  }
  for (const f of index.keys()) out.push(`unexpected new file in narration/: ${f}`);
  same("warnings", was.warnings, now.warnings);
  return out;
};
