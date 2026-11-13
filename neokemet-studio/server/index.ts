// Local application server. Binds to 127.0.0.1 only: nothing is exposed to the network.
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { CATALOG } from "../shared/catalog.ts";
import { validateIntent } from "../shared/intent.ts";
import { parseProductionMarkdown } from "../shared/production.ts";
import { applySmartTemplates, suggestSmartTemplates } from "../shared/smart-selection.ts";
import type { Project } from "../shared/schema.ts";
import { slugify } from "../shared/timing.ts";
import { narrateProject } from "./narrate.ts";
import { generateStoryboard, ollamaStatus, storyboardToScenes } from "./ollama.ts";
import { DEFAULT_SETTINGS, ensureDir, loadSettings, OUTPUT_DIR, saveSettings, Settings, TRASH_DIR, UI_DIR } from "./paths.ts";
import { freeFileName } from "./persist.ts";
import { listProjects, loadProject, parseProject, planStoryboard, projectDir, saveProject } from "./projects.ts";
import { engineHash, getBundle, inspectOutput, renderProject, renderScenePreview } from "./render.ts";
import { resolveTimeline } from "./timeline.ts";
import { findPiper } from "./tts.ts";

const PORT = Number(process.env.PORT ?? 4173);
const MIME: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".mp4": "video/mp4", ".svg": "image/svg+xml", ".json": "application/json" };

// ---- jobs: one heavy task at a time, with progress the UI can poll ---------
type Job = { id: string; kind: string; status: "queued" | "running" | "done" | "error"; percent: number; message: string; result?: unknown; error?: string };
const jobs = new Map<string, Job>();
let chain: Promise<unknown> = Promise.resolve();
const startJob = (kind: string, run: (update: (message: string, percent: number) => void) => Promise<unknown>) => {
  const job: Job = { id: Math.random().toString(36).slice(2, 10), kind, status: "queued", percent: 0, message: "Waiting…" };
  jobs.set(job.id, job);
  chain = chain.then(async () => {
    job.status = "running";
    try { job.result = await run((message, percent) => { job.message = message; job.percent = percent; }); job.status = "done"; job.percent = 100; }
    catch (e) { job.status = "error"; job.error = e instanceof Error ? e.message : String(e); }
  });
  return job;
};

const body = (req: http.IncomingMessage, limit = 200e6) =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []; let n = 0;
    req.on("data", (c: Buffer) => { n += c.length; if (n > limit) { reject(new Error("Upload too large")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
const json = (res: http.ServerResponse, data: unknown, code = 200) => { res.writeHead(code, { "content-type": "application/json", "cache-control": "no-store" }); res.end(JSON.stringify(data)); };
const safeName = (n: string) => path.basename(n).replace(/[^A-Za-z0-9._-]+/g, "_").slice(-80);
const publicSettings = (s: Settings) => ({ ...s, elevenlabs: { enabled: s.elevenlabs.enabled, voiceId: s.elevenlabs.voiceId, apiKey: "", hasKey: !!(s.elevenlabs.apiKey || process.env.ELEVENLABS_API_KEY) } });

const sendFile = (req: http.IncomingMessage, res: http.ServerResponse, file: string) => {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return json(res, { error: "Not found" }, 404);
  const size = fs.statSync(file).size;
  const type = MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? "");
  if (range) {
    const start = range[1] ? Number(range[1]) : 0, end = range[2] ? Math.min(size - 1, Number(range[2])) : size - 1;
    res.writeHead(206, { "content-type": type, "content-range": `bytes ${start}-${end}/${size}`, "accept-ranges": "bytes", "content-length": end - start + 1 });
    return void fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { "content-type": type, "content-length": size, "accept-ranges": "bytes", "cache-control": "no-store" });
  fs.createReadStream(file).pipe(res);
};

const handle = async (req: http.IncomingMessage, res: http.ServerResponse) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const p = url.pathname;
  const m = req.method ?? "GET";
  // only the local UI may call the API
  const origin = req.headers.origin;
  if (origin && !/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) return json(res, { error: "Forbidden" }, 403);

  if (m === "GET" && (p === "/" || p === "/index.html")) return sendFile(req, res, path.join(UI_DIR, "index.html"));
  if (m === "GET" && p.startsWith("/ui/")) return sendFile(req, res, path.join(UI_DIR, safeName(p.slice(4))));
  if (m === "GET" && p.startsWith("/output/")) return sendFile(req, res, path.join(OUTPUT_DIR, safeName(decodeURIComponent(p.slice(8)))));

  if (p === "/api/catalog") return json(res, CATALOG);
  if (p === "/api/status") {
    const s = loadSettings();
    const piper = findPiper(s);
    return json(res, { engine: engineHash(), piper: { installed: !!piper.exe, voices: piper.voices.map((v) => path.basename(v)), model: piper.model ? path.basename(piper.model) : null }, ollama: await ollamaStatus(s.ollamaUrl), elevenlabs: { enabled: s.elevenlabs.enabled }, outputDir: OUTPUT_DIR });
  }
  if (p === "/api/settings" && m === "GET") return json(res, publicSettings(loadSettings()));
  if (p === "/api/settings" && m === "PUT") {
    const cur = loadSettings();
    const inc = JSON.parse((await body(req)).toString() || "{}");
    const next: Settings = { ...DEFAULT_SETTINGS, ...cur, ...inc, elevenlabs: { ...cur.elevenlabs, ...(inc.elevenlabs ?? {}) } };
    if (!inc.elevenlabs?.apiKey) next.elevenlabs.apiKey = cur.elevenlabs.apiKey; // blank field keeps the stored key
    if (inc.elevenlabs?.clearKey) next.elevenlabs.apiKey = "";
    delete (next.elevenlabs as Record<string, unknown>).clearKey; delete (next.elevenlabs as Record<string, unknown>).hasKey;
    saveSettings(next);
    return json(res, publicSettings(next));
  }
  if (p === "/api/projects" && m === "GET") return json(res, listProjects());
  if (p === "/api/outputs") return json(res, fs.existsSync(OUTPUT_DIR) ? fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith(".mp4")).map((f) => ({ name: f, bytes: fs.statSync(path.join(OUTPUT_DIR, f)).size, mtime: fs.statSync(path.join(OUTPUT_DIR, f)).mtimeMs })).sort((a, b) => b.mtime - a.mtime) : []);
  if (p === "/api/plan" && m === "POST") {
    const { title, script } = JSON.parse((await body(req)).toString());
    return json(res, { scenes: planStoryboard(String(title ?? ""), String(script ?? "")) });
  }
  // Preview a production Markdown document without modifying the current project.
  if (p === "/api/production/preview" && m === "POST") {
    const input = JSON.parse((await body(req, 750_000)).toString() || "{}");
    const candidate = parseProductionMarkdown(String(input.source ?? ""), String(input.title ?? "Untitled"));
    // Validate every scene against the same project schema used for saving/rendering.
    const validated = parseProject({ title: String(input.title || "Untitled"), scenes: candidate.scenes });
    return json(res, { ...candidate, scenes: validated.scenes });
  }
  // The smart selector is a dry run until a user explicitly approves scene IDs.
  // Neither route writes to disk, starts narration nor renders a video.
  if ((p === "/api/smart-selection/preview" || p === "/api/smart-selection/apply") && m === "POST") {
    const input = JSON.parse((await body(req, 5_000_000)).toString() || "{}");
    const current = parseProject(input.project);
    if (p.endsWith("/preview")) return json(res, suggestSmartTemplates(current));
    const ids: unknown = input.sceneIds;
    if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string"))
      throw new Error("Select valid scene IDs from the preview.");
    const changed = applySmartTemplates(current, ids as string[]);
    return json(res, { ...changed, project: parseProject(changed.project) });
  }
  // Production intent check: a report only. Reads the project sent by the UI; writes nothing.
  if (p === "/api/intent/preview" && m === "POST") {
    const input = JSON.parse((await body(req, 5_000_000)).toString() || "{}");
    return json(res, validateIntent(parseProject(input.project)));
  }
  if (p === "/api/ollama/storyboard" && m === "POST") {
    const { topic, script, sceneCount } = JSON.parse((await body(req)).toString());
    const s = loadSettings();
    const job = startJob("ollama", async (update) => {
      update(`Asking ${s.ollamaModel} for a storyboard…`, 10);
      const sb = await generateStoryboard({ url: s.ollamaUrl, model: s.ollamaModel, topic: String(topic ?? ""), script: String(script ?? ""), sceneCount: Math.max(3, Math.min(24, Number(sceneCount) || 8)) });
      const scenes = storyboardToScenes(sb);
      return { title: sb.title, scenes: parseProject({ title: sb.title, scenes }).scenes };
    });
    return json(res, { job: job.id });
  }
  const jm = /^\/api\/jobs\/(\w+)$/.exec(p);
  if (jm) { const j = jobs.get(jm[1]); return j ? json(res, j) : json(res, { error: "Unknown job" }, 404); }

  const pm = /^\/api\/projects\/([a-z0-9-]+)(?:\/(\w+))?$/.exec(p);
  if (pm) {
    const [, slug, action] = pm;
    const dir = projectDir(slug);
    if (!action && m === "GET") { const { project } = loadProject(dir); return json(res, project); }
    if (!action && m === "PUT") { const { project } = saveProject(slug, JSON.parse((await body(req)).toString())); return json(res, project); }
    if (!action && m === "DELETE") {
      // Never destroy narration: the project folder is moved aside, not erased.
      if (!fs.existsSync(dir)) return json(res, { ok: true });
      const kept = path.join(ensureDir(TRASH_DIR), `${slug}-${new Date().toISOString().replace(/[:.]/g, "-")}`);
      fs.renameSync(dir, kept);
      return json(res, { ok: true, movedTo: kept });
    }
    if (action === "upload" && m === "POST") {
      const kind = url.searchParams.get("kind") === "music" ? "music" : "narration";
      const wanted = safeName(url.searchParams.get("name") ?? "audio.wav");
      if (!/\.(wav|mp3|m4a|ogg|flac)$/i.test(wanted)) throw new Error("Audio must be wav, mp3, m4a, ogg or flac.");
      const data = await body(req);
      const folder = ensureDir(path.join(dir, kind));
      // An upload never replaces audio that is already in the project: the same
      // bytes reuse the existing file, different bytes get a new name.
      const existing = path.join(folder, wanted);
      const same = fs.existsSync(existing) && fs.readFileSync(existing).equals(data);
      const name = same ? wanted : freeFileName(folder, wanted);
      if (!same) fs.writeFileSync(path.join(folder, name), data, { flag: "wx" });
      return json(res, { file: `${kind}/${name}`, reused: same, renamed: name !== wanted });
    }
    // the remaining actions take the project as currently edited in the UI
    const project: Project = parseProject(JSON.parse((await body(req)).toString() || "{}").project);
    ensureDir(dir);
    if (action === "timeline") {
      const tl = await resolveTimeline(project, dir);
      return json(res, { seconds: tl.seconds, totalFrames: tl.totalFrames, warnings: tl.warnings, scenes: tl.scenes.map((s) => ({ seconds: s.durationInFrames / project.fps, frames: s.durationInFrames, narrationSec: s.narrationSec, estimated: s.estimated, cues: s.cues.length })) });
    }
    if (action === "preview") {
      const tl = await resolveTimeline(project, dir);
      const s = tl.scenes[Number(url.searchParams.get("scene") ?? 0)];
      if (!s) throw new Error("No such scene.");
      const at = Math.max(0, Math.min(1, Number(url.searchParams.get("at") ?? 0.6)));
      return sendFile(req, res, await renderScenePreview(project, s, at * (s.durationInFrames - 1), 0.5));
    }
    if (action === "narrate") {
      const provider = url.searchParams.get("provider") === "elevenlabs" ? "elevenlabs" : "piper";
      const only = url.searchParams.has("scene") ? Number(url.searchParams.get("scene")) : undefined;
      const job = startJob("narrate", async (update) => {
        const r = await narrateProject(project, dir, provider, { only, force: url.searchParams.get("force") === "1", onProgress: update });
        saveProject(slug, project);
        return { ...r, project };
      });
      return json(res, { job: job.id });
    }
    if (action === "render") {
      const only = url.searchParams.has("scene") ? Number(url.searchParams.get("scene")) : undefined;
      saveProject(slug, project);
      const job = startJob("render", async (update) => {
        const r = await renderProject(project, dir, (pr) => update(pr.message, pr.percent), only);
        return { ...r, name: path.basename(r.file), info: await inspectOutput(r.file) };
      });
      return json(res, { job: job.id });
    }
  }
  json(res, { error: "Not found" }, 404);
};

const server = http.createServer((req, res) => {
  handle(req, res).catch((e) => { if (!res.headersSent) json(res, { error: e instanceof Error ? e.message : String(e) }, 400); else res.end(); });
});
server.on("error", (e: NodeJS.ErrnoException) => {
  console.error(e.code === "EADDRINUSE" ? `Port ${PORT} is already in use. Close the other NeoKemetAI Studio window, or set PORT to another number.` : e.message);
  process.exit(1);
});
server.listen(PORT, "127.0.0.1", () => {
  const link = `http://127.0.0.1:${PORT}`;
  console.log(`\n  NeoKemetAI Animation Studio is running:  ${link}\n  Keep this window open while you work. Press Ctrl+C to stop.\n`);
  if (!process.env.NO_OPEN) {
    const cmd = process.platform === "win32" ? ["cmd", ["/c", "start", "", link]] : process.platform === "darwin" ? ["open", [link]] : ["xdg-open", [link]];
    try { spawn(cmd[0] as string, cmd[1] as string[], { stdio: "ignore", detached: true }).on("error", () => {}).unref(); } catch { /* open the link by hand */ }
  }
  // warm the engine bundle so the first preview is quick
  getBundle().catch((e) => console.error("Engine bundle failed:", e instanceof Error ? e.message : e));
});
