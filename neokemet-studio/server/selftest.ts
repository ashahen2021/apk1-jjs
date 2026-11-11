// Fast checks that need no rendering: schema, planner, timing, Ollama validation, audio.
//   npm test
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { GENERIC_TEMPLATE_IDS, TEMPLATE_IDS } from "../shared/catalog.ts";
import { planFromScript } from "../shared/planner.ts";
import { buildCues, sceneSeconds, splitLines } from "../shared/timing.ts";
import { readWav, speechSpan, synthMusic, writeWav } from "./audio.ts";
import { generateStoryboard, storyboardJsonSchema, storyboardToScenes, validateStoryboard } from "./ollama.ts";
import { PROJECTS_DIR } from "./paths.ts";
import { listProjects, loadProject, parseProject } from "./projects.ts";
import { resolveTimeline } from "./timeline.ts";

let n = 0;
const test = async (name: string, fn: () => unknown) => { await fn(); n++; console.log("PASS  " + name); };

await test("every bundled project is valid and resolves to a timeline", async () => {
  const all = listProjects();
  assert.ok(all.length >= 2);
  for (const p of all) {
    const { project, dir } = loadProject(path.join(PROJECTS_DIR, p.slug));
    const tl = await resolveTimeline(project, dir);
    assert.equal(tl.scenes.reduce((a, s) => a + s.durationInFrames, 0), tl.totalFrames);
    for (const s of tl.scenes) for (const c of s.cues) assert.ok(c.from >= 0 && c.to <= s.durationInFrames && c.from < c.to, `${p.slug} scene ${s.index + 1} cue out of range`);
  }
});
await test("Royal Cache converts to 18 preset scenes of exactly 180 s", async () => {
  const { project, dir } = loadProject(path.join(PROJECTS_DIR, "royal-cache"));
  const tl = await resolveTimeline(project, dir);
  assert.equal(project.scenes.length, 18);
  assert.equal(tl.totalFrames, 5400);
  assert.ok(tl.scenes.every((s) => !s.estimated && s.narrationSec < 9.2));
});
await test("invalid projects are rejected with a readable message", () => {
  assert.throws(() => parseProject({ title: "x", scenes: [{ id: "a", template: "nope" }] }), /scenes\[0\]\.template/);
  assert.throws(() => parseProject({ title: "x", scenes: [{ id: "a", template: "title" }, { id: "a", template: "title" }] }), /duplicate scene id/);
});
await test("script planner builds a storyboard offline", () => {
  const scenes = planFromScript("Test", "The pharaoh ordered a new temple at Karnak.\n\nThieves robbed the burial chamber and stole the treasure.\n\nPriests carried the coffin in a funeral procession.\n\nThe pyramids of Giza still stand.");
  assert.deepEqual(scenes.map((s) => s.template), ["title", "tomb-interior", "procession", "end-card"]);
  assert.equal(scenes[1].variant, "looted");
  assert.ok(scenes.every((s) => (TEMPLATE_IDS as string[]).includes(s.template)));
  parseProject({ title: "Test", scenes });
});
await test("captions split at natural pauses and keep every word", () => {
  const t = "Evidence from a workers' town nearby suggests the builders were organised labourers who were housed and fed, not slaves.";
  const lines = splitLines(t);
  assert.equal(lines.join(" "), t);
  assert.ok(lines.every((l) => l.length <= 56));
  const cues = buildCues(t, 8, 30, Math.round(sceneSeconds(8) * 30));
  assert.equal(cues.length, lines.length);
  assert.ok(cues.every((c, i) => i === 0 || c.from >= cues[i - 1].from));
});
await test("Ollama storyboard: schema export and answer validation", () => {
  const schema = storyboardJsonSchema() as unknown as { properties: { scenes: unknown } };
  assert.ok(schema.properties.scenes);
  const good = JSON.stringify({ title: "T", scenes: [{ template: "title", narration: "A short opening line here.", label: "T" }, { template: "landscape", narration: "The river ran north to the sea.", environment: "nile-valley" }, { template: "end-card", narration: "And so the story ends here.", label: "T" }] });
  assert.equal(storyboardToScenes(validateStoryboard("```json\n" + good + "\n```")).length, 3);
  assert.throws(() => validateStoryboard(JSON.stringify({ title: "T", scenes: [{ template: "rc-01", narration: "presets are not allowed for AI" }] })), /schema/);
  assert.throws(() => validateStoryboard("not json"), /valid JSON/);
  assert.ok(!(GENERIC_TEMPLATE_IDS as string[]).some((t) => t.startsWith("rc-")));
});
await test("Ollama client: retries once on an invalid answer (mock server)", async () => {
  let calls = 0;
  const good = { title: "Mock", scenes: [{ template: "title", narration: "Opening words for the film.", label: "Mock" }, { template: "characters", narration: "Two priests studied the record.", cast: [{ kind: "priest", action: "read" }] }, { template: "end-card", narration: "The closing words of the film.", label: "Mock" }] };
  const srv = http.createServer((req, res) => { calls++; let b = ""; req.on("data", (d) => (b += d)); req.on("end", () => { assert.ok(JSON.parse(b).format.properties.scenes); res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ message: { content: calls === 1 ? '{"title":"x","scenes":[]}' : JSON.stringify(good) } })); }); });
  await new Promise<void>((r) => srv.listen(0, "127.0.0.1", r));
  const port = (srv.address() as { port: number }).port;
  const sb = await generateStoryboard({ url: `http://127.0.0.1:${port}`, model: "mock", topic: "x", script: "", sceneCount: 3 });
  srv.close();
  assert.equal(calls, 2);
  assert.equal(sb.scenes.length, 3);
  await assert.rejects(generateStoryboard({ url: "http://127.0.0.1:9", model: "m", topic: "x", script: "", sceneCount: 3 }), /Could not reach Ollama/);
});
await test("audio: score is deterministic; WAV round-trips; speech span is measured", () => {
  const a = synthMusic(6, [3], 7), b = synthMusic(6, [3], 7);
  assert.deepEqual(a[0].slice(40000, 40050), b[0].slice(40000, 40050));
  const L = new Float32Array(44100), R = new Float32Array(44100);
  for (let i = 11025; i < 33075; i++) L[i] = R[i] = Math.sin(i / 20) * 0.5;
  const f = path.join(os.tmpdir(), `nk-selftest-${process.pid}.wav`);
  writeWav(f, L, R);
  const span = speechSpan(readWav(f));
  fs.rmSync(f);
  assert.ok(Math.abs(span.start - 0.25) < 0.01 && Math.abs(span.end - 0.75) < 0.01);
});
console.log(`\n${n} checks passed.`);
