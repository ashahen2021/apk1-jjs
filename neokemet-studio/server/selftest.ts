// Fast checks that need no rendering: schema, planner, timing, Ollama validation, audio.
//   npm test
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { GENERIC_TEMPLATE_IDS, TEMPLATE_IDS } from "../shared/catalog.ts";
import { planFromScript, splitScript } from "../shared/planner.ts";
import { parseProductionMarkdown } from "../shared/production.ts";
import { buildCues, sceneSeconds, splitLines } from "../shared/timing.ts";
import { readWav, speechSpan, synthMusic, writeWav } from "./audio.ts";
import { generateStoryboard, storyboardJsonSchema, storyboardToScenes, validateStoryboard } from "./ollama.ts";
import { PROJECTS_DIR } from "./paths.ts";
import { listProjects, loadProject, parseProject, planStoryboard } from "./projects.ts";
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

// ---- long-form scripts: one paragraph = one scene ---------------------------
// A stand-in for a 36-paragraph documentary script: every paragraph has several
// sentences and 45-70 words, joined with messy real-world separators.
const rc = loadProject(path.join(PROJECTS_DIR, "royal-cache")).project.scenes.map((s) => s.narration);
const longParas = Array.from({ length: 36 }, (_, i) => `${rc[i % 18]} ${rc[(i + 7) % 18]} ${rc[(i + 11) % 18]}`);
const seps = ["\n\n", "\r\n\r\n", "\n   \n", "\n\n\n\n", "\n\t\n \n"];
const longScript = "\n\n" + longParas.map((p, i) => (i % 4 === 0 ? p.replace(". ", ".\n") : p) + (i < 35 ? seps[i % seps.length] : "\n\n  ")).join("");

await test("36 multi-sentence paragraphs become exactly 36 scenes, text intact", () => {
  assert.equal(splitScript(longScript).length, 36);
  const scenes = planStoryboard("The Royal Cache", longScript);
  assert.equal(scenes.length, 36);
  scenes.forEach((s, i) => assert.equal(s.narration, longParas[i], `scene ${i + 1} narration changed`));
  assert.ok(scenes.every((s) => s.durationSec === undefined), "no fixed durations are imposed");
  assert.equal(new Set(scenes.map((s) => s.id)).size, 36);
  assert.equal(scenes[0].template, "title");
  assert.equal(scenes[35].template, "end-card");
});
await test("the complete 36-scene project validates; scene lengths follow the narration", async () => {
  const project = parseProject({ title: "The Royal Cache", script: longScript, scenes: planStoryboard("The Royal Cache", longScript) });
  const tl = await resolveTimeline(project, PROJECTS_DIR);
  const secs = tl.scenes.map((s) => s.durationInFrames / project.fps);
  assert.equal(tl.scenes.length, 36);
  assert.ok(new Set(secs.map((x) => x.toFixed(1))).size > 3, "durations vary from scene to scene");
  assert.ok(Math.min(...secs) > 12 && Math.max(...secs) < 60);
  assert.ok(tl.seconds > 10 * 60 && tl.seconds < 20 * 60, `total ${tl.seconds.toFixed(0)} s`);
  assert.deepEqual(tl.warnings, []);
  for (const s of tl.scenes) { assert.equal(s.cues.map((c) => c.text).join(" "), s.scene.narration); assert.ok(s.cues.every((c) => c.to <= s.durationInFrames)); }
  console.log(`      (${tl.scenes.length} scenes, ${(tl.seconds / 60).toFixed(1)} min estimated, scenes ${Math.min(...secs).toFixed(0)}–${Math.max(...secs).toFixed(0)} s)`);
});
await test("too many paragraphs, or an empty script, fail cleanly with a useful message", () => {
  const tooMany = Array.from({ length: 41 }, (_, i) => `Paragraph ${i + 1}. It has two sentences.`).join("\n\n");
  assert.throws(() => planStoryboard("x", tooMany), /41 paragraphs.*limit is 40 scenes/s);
  assert.throws(() => planStoryboard("x", "  \n\n \n"), /script is empty/);
  assert.equal(planStoryboard("x", Array.from({ length: 40 }, (_, i) => `Paragraph ${i + 1}.`).join("\n\n")).length, 40);
});
await test("a single long paragraph stays one scene", () => {
  const one = Array.from({ length: 30 }, (_, i) => `Sentence number ${i + 1} of a very long paragraph.`).join(" ");
  assert.deepEqual(splitScript(one), [one]);
});
await test("production Markdown imports 36 complete numbered scenes with stage cues intact", () => {
  const scenes = Array.from({ length: 36 }, (_, i) => {
    const no = String(i + 1).padStart(2, "0");
    return [
      i === 0 ? "### Chapter: MISSING KINGS" : i === 18 ? "### Chapter: THE DISCOVERY" : "",
      "**Scene " + no + " — Scene " + no + "** (50 words; ~20s at 150 wpm)",
      "", "**Voiceover**",
      "A complete sentence in scene " + no + ". A second sentence remains in this same scene.",
      "", "**Visual:** Limestone cliffs, a hidden shaft, and slow push-in.",
      "**Sound / transition:** A rope scrapes across stone.", "",
    ].join("\n");
  }).join("\n");
  const parsed = parseProductionMarkdown("# THE ROYAL CACHE\n**Target:** 16:9, 1920 × 1080\n\n## Production scenes\n" + scenes + "\n## Production constraints\n- Not narration", "The Royal Cache");
  assert.equal(parsed.scenes.length, 36);
  assert.equal(parsed.summary.chapters, 2);
  assert.equal(parsed.suggestedFormat, "16:9");
  assert.equal(parsed.scenes[0].production?.sceneTitle, "Scene 01");
  assert.equal(parsed.scenes[35].production?.sourceNumber, 36);
  assert.match(parsed.scenes[0].production?.visual ?? "", /hidden shaft/);
  assert.match(parsed.scenes[0].production?.sound ?? "", /rope scrapes/);
  assert.equal(parsed.scenes[0].narration, "A complete sentence in scene 01. A second sentence remains in this same scene.");
  assert.ok(!parsed.script.includes("Sound / transition"));
  parseProject({ title: "The Royal Cache", scenes: parsed.scenes });
});
await test("production import rejects missing narration and more than 40 scenes", () => {
  assert.throws(() => parseProductionMarkdown("**Scene 01 — Empty**\n\n**Visual:** Rock wall"), /no Voiceover/);
  const overflow = Array.from({ length: 41 }, (_, i) => "**Scene " + String(i + 1).padStart(2, "0") + " — Test**\n\n**Voiceover**\nComplete thought.\n\n**Visual:** Cliff.\n\n**Sound / transition:** Wind.").join("\n\n");
  assert.throws(() => parseProductionMarkdown(overflow), /at most 40/);
});

// ---- phase-1 documentary templates -------------------------------------------
await test("documentary templates: catalog, defaults and parameter validation", async () => {
  const { TEMPLATES, TEMPLATE_PARAMS } = await import("../shared/catalog.ts");
  const { defaultParams, paramOf, paramProblems } = await import("../shared/params.ts");
  for (const t of ["royal-pharaohs", "tomb-robbery", "priests-rewrapping"] as const) {
    assert.equal(TEMPLATES[t].group, "Documentary");
    assert.ok(TEMPLATE_PARAMS[t]!.length >= 3);
    // a scene with no params at all is valid and renders from defaults
    const bare = parseProject({ title: "x", scenes: [{ id: "a", template: t }] }).scenes[0];
    assert.equal(bare.params, undefined);
    assert.deepEqual(paramProblems({ template: t, params: defaultParams(t) }), []);
  }
  assert.equal(paramOf({ template: "tomb-robbery" }, "stage"), "looted");
  assert.equal(paramOf<boolean>({ template: "tomb-robbery", params: { showTorch: false } }, "showTorch"), false);
  assert.equal(paramOf({ template: "royal-pharaohs", params: { pose: "flying" } }, "pose"), "seated");
  assert.throws(() => parseProject({ title: "x", scenes: [{ id: "a", template: "royal-pharaohs", params: { pose: "flying" } }] }), /scenes\[0\]\.params\.pose/);
  assert.throws(() => parseProject({ title: "x", scenes: [{ id: "a", template: "tomb-robbery", params: { showTorch: "yes" } }] }), /params\.showTorch/);
  // params survive a save/load round trip
  const saved = JSON.parse(JSON.stringify(loadProject(path.join(PROJECTS_DIR, "demo-template-library")).project));
  assert.deepEqual(parseProject(saved).scenes.map((x) => x.params?.camera), ["slow push in", "pan right", "slow push in"]);
});
await test("production importer maps directions to the documentary templates", async () => {
  const { parseProductionMarkdown } = await import("../shared/production.ts");
  const { matchDocumentaryTemplate } = await import("../shared/documentary.ts");
  const md = [
    ["Opening", "Title over the cliffs.", "A wide view of the Theban cliffs; slow push in."],
    ["The Great Pharaohs", "Among them were famous rulers, including Seti the First and Ramesses the Second.", "Colossal statue of Ramesses in a temple; pan left."],
    ["The Looted Tombs", "Gold vanished, coffins were damaged, and royal mummies were disturbed.", "A looted burial chamber by torchlight, the coffin lid askew."],
    ["Rewrapped", "They repaired damaged burials and rewrapped royal bodies in fresh linen.", "Priests of Amun at a work table with linen bands."],
    ["Names", "Labels recorded names and transfers.", "Priests of Amun attach linen labels and dockets to coffins in the temple."],
    ["The River", "The Nile carried stone north.", "A boat drifts on the Nile at dusk."],
    ["The Plan", "The tomb lay behind a hidden shaft.", "Cutaway of the shaft and corridor, looted long ago."],
    ["Close", "And so the story ends.", "The cliffs at evening."],
  ].map(([t, vo, vis], i) => `**Scene ${String(i + 1).padStart(2, "0")} — ${t}**\n\n**Voiceover**\n\n${vo}\n\n**Visual:** ${vis}\n\n**Sound / transition:** Wind.`).join("\n\n");
  const scenes = parseProject({ title: "T", scenes: parseProductionMarkdown(md, "T").scenes }).scenes;
  assert.deepEqual(scenes.map((x) => x.template), ["title", "royal-pharaohs", "tomb-robbery", "priests-rewrapping", "priests-rewrapping", "landscape", "cutaway", "end-card"]);
  assert.deepEqual(scenes[1].params, { pharaohName: "Ramesses II", pose: "statue close-up", environment: "temple courtyard with columns", camera: "pan left" });
  assert.equal(scenes[2].params?.stage, "damaged");
  assert.equal(scenes[2].params?.environment, "royal burial chamber");
  assert.equal(scenes[2].params?.showTorch, true);
  assert.equal(scenes[3].params?.action, "rewrap mummy");
  assert.equal(scenes[4].params?.action, "record labels");
  assert.equal(scenes[4].params?.environment, "temple chamber");
  assert.equal(scenes[5].params, undefined); // unmatched scenes keep the existing behaviour
  assert.equal(scenes[5].environment, "nile-valley");
  assert.ok(scenes.every((x) => x.production?.visual));
  // weak, narration-only hints do not trigger a template
  assert.equal(matchDocumentaryTemplate({ narration: "Some of Egypt's greatest pharaohs were discovered together in a secret tomb." })?.template ?? null, null);
  assert.equal(matchDocumentaryTemplate({ visual: "A temple at dawn." }), null);
});
console.log(`\n${n} checks passed.`);
