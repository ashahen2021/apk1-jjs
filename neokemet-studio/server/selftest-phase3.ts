// Phase 3A/3B checks: baselines, timeline and subtitle safety, atomic saving,
// the production intent validator, and narration cache safety.
// No rendering, no network, no paid service.   npm test
process.env.NEOKEMET_NO_PAID = "1"; // belt and braces: nothing here may reach a paid API
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CAPABILITY_IDS, sceneCapabilities, TEMPLATE_CAPABILITIES, VOCABULARY } from "../shared/capabilities.ts";
import { TEMPLATE_IDS } from "../shared/catalog.ts";
import { splitDirection, validateIntent, validateSceneIntent } from "../shared/intent.ts";
import type { Project } from "../shared/schema.ts";
import { buildCues, cueProblems, MIN_VO_TAIL, safeSceneSeconds, sceneSeconds, splitLines, VO_LEAD, VO_TAIL } from "../shared/timing.ts";
import { mixProject, readWav, SR, writeWav } from "./audio.ts";
import { audioIdentity, auditNarration, describeExistingAudio, loadManifest, MANIFEST_FILE, voiceIdentity } from "./audio-manifest.ts";
import { captureBaseline, compareBaseline, readBaseline } from "./baseline.ts";
import { narrateProject } from "./narrate.ts";
import { DEFAULT_SETTINGS, PROJECTS_DIR, type Settings } from "./paths.ts";
import { backupPathOf, freeFileName, type SaveFault, sha256File, staleTempFiles, writeFileAtomic } from "./persist.ts";
import { listProjects, loadProject, parseProject, restoreProjectBackup, writeProjectFile } from "./projects.ts";
import { resolveTimeline, type Timeline } from "./timeline.ts";
import { elevenLabsSynthesize } from "./tts.ts";

let n = 0;
const test = async (name: string, fn: () => unknown) => { await fn(); n++; console.log("PASS  " + name); };
let skipped = 0;
const skip = (name: string, why: string) => { skipped++; console.log("SKIP  " + name + " — " + why); };

// Any attempt to leave this machine during the tests is a failure.
const realFetch = globalThis.fetch;
let outboundCalls = 0;
globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input instanceof Request ? input.url : input);
  if (/^https?:\/\/(127\.0\.0\.1|localhost)(:|\/)/.test(url)) return realFetch(input, init);
  outboundCalls++;
  throw new Error("blocked outbound request during self-test: " + new URL(url).host);
}) as typeof fetch;

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "nk-phase3-"));
const tmp = (name: string) => { const d = path.join(tmpRoot, name); fs.mkdirSync(d, { recursive: true }); return d; };
const FULL = "the-royal-cache-full-documentary";
// The 36-scene film and its voice files are private production data that are not in Git.
// Checks that read it run wherever it is present and are reported as skipped elsewhere.
const hasFull = fs.existsSync(path.join(PROJECTS_DIR, FULL, "project.json"));
const fullTest = (name: string, fn: () => unknown) => hasFull ? test(name, fn) : skip(name, `private project "${FULL}" is not on this computer`);

/** Every file under a folder with its size, modified time and content hash. */
const snapshot = (dir: string): Record<string, string> => {
  const out: Record<string, string> = {};
  const walk = (d: string) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else { const st = fs.statSync(p); out[path.relative(dir, p)] = `${st.size}:${st.mtimeMs}:${sha256File(p)}`; } } };
  walk(dir);
  return out;
};
/** A WAV with 0.2 s of silence, `seconds` of tone, then 0.3 s of silence. */
const tone = (file: string, seconds: number) => {
  const lead = Math.round(0.2 * SR), body = Math.round(seconds * SR), len = lead + body + Math.round(0.3 * SR);
  const L = new Float32Array(len);
  for (let i = lead; i < lead + body; i++) L[i] = Math.sin(i / 14) * 0.5;
  writeWav(file, L, L);
};
const peakBetween = (d: Float32Array, fromSec: number, toSec: number) => { let m = 0; for (let i = Math.round(fromSec * SR); i < Math.min(d.length, Math.round(toSec * SR)); i++) m = Math.max(m, Math.abs(d[i])); return m; };
const quiet = { music: "none", sfx: false } as const;

const projectsBefore = snapshot(PROJECTS_DIR);

// ============================================================================
// Phase 3A — baselines
// ============================================================================
await test("every bundled project still matches its recorded baseline exactly", async () => {
  const all = listProjects();
  assert.ok(all.length >= 4);
  for (const p of all) {
    const was = readBaseline(p.slug);
    assert.ok(was, `no baseline recorded for ${p.slug}`);
    const now = await captureBaseline(path.join(PROJECTS_DIR, p.slug));
    let drift = compareBaseline(was, now);
    // Narration that is private (kept out of Git) is absent on a fresh clone. When the whole
    // recorded set is missing, compare everything that does not depend on measuring that audio.
    const dir = path.join(PROJECTS_DIR, p.slug);
    if (was.narrationFiles.length > 0 && was.narrationFiles.every((f) => !fs.existsSync(path.join(dir, f.file)))) {
      console.log(`NOTE  ${p.slug}: private narration is not on this computer; audio-measured fields are not compared`);
      drift = drift.filter((d) => !/^(scene \d+ (startFrame|durationInFrames|measured|cueCount|cuesSha256|renderInputSha256|narrationSec)|totalFrames|warnings|narration file missing)\b/.test(d));
    }
    assert.deepEqual(drift, [], `${p.slug} drifted from its baseline`);
  }
});
await fullTest("Royal Cache documentary: 36 scenes in order, 23,522 frames (784.07 s), every voice measured", async () => {
  const { project, dir } = loadProject(path.join(PROJECTS_DIR, FULL));
  const tl = await resolveTimeline(project, dir);
  assert.deepEqual(project.scenes.map((s) => s.id), Array.from({ length: 36 }, (_, i) => "s" + String(i + 1).padStart(2, "0")));
  assert.equal(tl.totalFrames, 23522);
  assert.equal(project.fps, 30);
  assert.equal(tl.seconds.toFixed(2), "784.07");
  assert.ok(tl.scenes.every((s) => !s.estimated && s.narrationPath));
  assert.ok(project.scenes.every((s) => s.durationSec === undefined), "no manual durations in the reference film");
  assert.deepEqual(tl.warnings, []);
  for (const s of tl.scenes) {
    assert.deepEqual(cueProblems(s.cues, s.durationInFrames), []);
    assert.equal(s.cues.map((c) => c.text).join(" "), s.scene.narration, `scene ${s.index + 1} subtitles lost words`);
    // the voice ends inside its own scene with the full tail
    assert.ok(VO_LEAD + s.narrationSec + VO_TAIL <= s.durationInFrames / project.fps + 1 / project.fps);
  }
  const files = fs.readdirSync(path.join(dir, "narration")).sort();
  assert.equal(files.filter((f) => f.endsWith(".mp3")).length, 36);
  assert.equal(files.filter((f) => f.endsWith(".mp3.txt")).length, 36);
  assert.equal(files.length, 72, "nothing was added to the narration folder");
});

// ============================================================================
// Timeline and subtitle safety
// ============================================================================
await test("a manual duration is honoured when the voice fits, and can never truncate recorded narration", () => {
  assert.deepEqual(safeSceneSeconds(6, undefined, true), { seconds: sceneSeconds(6), extended: false, tooShort: false });
  assert.deepEqual(safeSceneSeconds(6, 10, true), { seconds: 10, extended: false, tooShort: false });
  // fits with the minimum tail: still exactly what the editor asked for
  assert.deepEqual(safeSceneSeconds(6, VO_LEAD + 6 + MIN_VO_TAIL, true), { seconds: VO_LEAD + 6 + MIN_VO_TAIL, extended: false, tooShort: false });
  // recorded audio longer than the manual value: lengthened to the natural length
  assert.deepEqual(safeSceneSeconds(6, 3, true), { seconds: VO_LEAD + 6 + VO_TAIL, extended: true, tooShort: true });
  // an estimate is not audio: the manual value stands, but it is reported
  assert.deepEqual(safeSceneSeconds(6, 3, false), { seconds: 3, extended: false, tooShort: true });
  assert.deepEqual(safeSceneSeconds(0, 3, true), { seconds: 3, extended: false, tooShort: false });
});
await test("resolveTimeline lengthens a too-short manual scene and says so; a generous one is untouched", async () => {
  const dir = tmp("timeline");
  tone(path.join(dir, "narration", "a.wav"), 6);
  const make = (durationSec: number) => parseProject({ title: "T", fps: 30, audio: quiet, scenes: [
    { id: "a", template: "landscape", narration: "One two three four five six seven eight nine ten eleven twelve.", narrationFile: "narration/a.wav", durationSec },
    { id: "b", template: "landscape", narration: "" },
  ] });
  const short = await resolveTimeline(make(3), dir);
  assert.equal(short.scenes[0].durationInFrames, Math.round((VO_LEAD + 6 + VO_TAIL) * 30));
  assert.ok(Math.abs(short.scenes[0].narrationSec - 6) < 0.01);
  assert.match(short.warnings.join("\n"), /Scene 1: the manual duration \(3 s\) is too short for the recorded narration.*lengthened/);
  assert.deepEqual(cueProblems(short.scenes[0].cues, short.scenes[0].durationInFrames), []);
  assert.equal(short.scenes[1].startFrame, short.scenes[0].durationInFrames);
  const roomy = await resolveTimeline(make(10), dir);
  assert.equal(roomy.scenes[0].durationInFrames, 300);
  assert.equal(roomy.warnings.filter((w) => /Scene 1/.test(w)).length, 0);
});
await test("an estimated narration never changes a manual duration; its subtitles are compressed, not broken", async () => {
  const long = Array.from({ length: 60 }, (_, i) => `word${i}`).join(" ") + ".";
  const p = parseProject({ title: "T", fps: 30, audio: quiet, scenes: [{ id: "a", template: "landscape", narration: long, durationSec: 4 }, { id: "b", template: "landscape", narration: "Short line here." }] });
  const tl = await resolveTimeline(p, tmp("estimate"));
  assert.equal(tl.scenes[0].durationInFrames, 120);
  assert.ok(tl.scenes[0].estimated);
  assert.match(tl.warnings.join("\n"), /Scene 1: the estimated narration .* does not fit the manual duration \(4 s\)/);
  assert.deepEqual(cueProblems(tl.scenes[0].cues, 120), []);
  assert.equal(tl.scenes[0].cues.map((c) => c.text).join(" "), long);
});
await test("narration cannot leak into the next scene, even from a hand-built unsafe timeline", async () => {
  const dir = tmp("leak");
  tone(path.join(dir, "narration", "a.wav"), 6);
  const p = parseProject({ title: "T", fps: 30, audio: quiet, scenes: [
    { id: "a", template: "landscape", narration: "A long line of narration for the first scene.", narrationFile: "narration/a.wav", durationSec: 3 },
    { id: "b", template: "landscape", narration: "" },
  ] });
  // 1. The resolved timeline keeps the whole voice inside scene 1.
  const tl = await resolveTimeline(p, dir);
  const out1 = path.join(dir, "safe.wav");
  const safe = await mixProject(p, dir, tl, out1);
  const end1 = tl.scenes[0].durationInFrames / 30;
  const a = readWav(out1).ch[0];
  assert.deepEqual(safe.contained, []);
  assert.ok(peakBetween(a, 1, 6) > 0.3, "the voice is present");
  assert.equal(peakBetween(a, VO_LEAD + 6 + 0.01, end1), 0, "silence after the last word, inside scene 1");
  assert.equal(peakBetween(a, end1, end1 + 99), 0, "nothing in scene 2");
  // 2. Force scene 1 back to 3 s (what the old code produced): the voice is held inside the scene.
  const unsafe: Timeline = { ...tl, scenes: [{ ...tl.scenes[0], durationInFrames: 90 }, { ...tl.scenes[1], startFrame: 90 }], totalFrames: 90 + tl.scenes[1].durationInFrames };
  const out2 = path.join(dir, "unsafe.wav");
  const held = await mixProject(p, dir, unsafe, out2);
  const b = readWav(out2).ch[0];
  assert.deepEqual(held.contained, [0]);
  assert.ok(peakBetween(b, 1, 2.9) > 0.3);
  assert.equal(peakBetween(b, 3, 99), 0, "the next scene is free of the previous voice");
  assert.ok(peakBetween(b, 2.999, 3) < 0.05, "faded out, not chopped");
});
await test("subtitle cues are always displayable: invalid timing is detected and resolved", () => {
  const text = "The priests of Amun moved the kings in secret, by night, across the western hills, and hid them in a single tomb.";
  // detection
  assert.match(cueProblems([{ from: 10, to: 10, text: "x" }], 100)[0], /no length/);
  assert.match(cueProblems([{ from: 30, to: 20, text: "x" }], 100)[0], /no length/);
  assert.match(cueProblems([{ from: -1, to: 20, text: "x" }], 100)[0], /before the scene/);
  assert.match(cueProblems([{ from: 0, to: 101, text: "x" }], 100)[0], /after the scene/);
  assert.match(cueProblems([{ from: 0, to: 40, text: "x" }, { from: 30, to: 60, text: "y" }], 100)[0], /overlaps/);
  assert.match(cueProblems([{ from: 0.5, to: 9, text: "x" }], 100)[0], /whole frame/);
  assert.match(cueProblems([{ from: 0, to: 9, text: " " }], 100)[0], /no text/);
  // a normal scene is laid out exactly as before
  const normal = buildCues(text, 8, 30, Math.round(sceneSeconds(8) * 30));
  assert.equal(normal[0].from, Math.round(VO_LEAD * 30) - 2);
  assert.deepEqual(cueProblems(normal, Math.round(sceneSeconds(8) * 30)), []);
  // spoken span far longer than the scene (the old code produced reversed cues here)
  const squeezed = buildCues(text, 20, 30, 90);
  assert.deepEqual(cueProblems(squeezed, 90), []);
  assert.equal(squeezed.map((c) => c.text).join(" "), text);
  // spoken span too short for the number of lines
  const tiny = buildCues(text, 0.02, 30, 300);
  assert.deepEqual(cueProblems(tiny, 300), []);
  assert.equal(tiny.map((c) => c.text).join(" "), text);
  // fewer frames than lines: one cue with everything
  const one = buildCues(text, 5, 30, 2);
  assert.equal(one.length, 1);
  assert.equal(one[0].text, splitLines(text).join(" "));
  assert.deepEqual(cueProblems(one, 2), []);
  // degenerate input
  for (const [sec, frames] of [[0, 100], [-1, 100], [NaN, 100], [5, 0], [5, -3]] as const) assert.deepEqual(buildCues(text, sec, 30, frames), []);
  assert.deepEqual(buildCues("   ", 5, 30, 100), []);
  // sweep: whatever the numbers, cues are valid and no word is lost
  let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < 4000; i++) {
    const words = 1 + Math.floor(rnd() * 90), fps = [24, 25, 30, 60][Math.floor(rnd() * 4)];
    const t = Array.from({ length: words }, (_, k) => (k % 7 === 6 ? "pause," : "word")).join(" ");
    const sec = rnd() * 40, frames = 1 + Math.floor(rnd() * 1500);
    const cues = buildCues(t, sec, fps, frames);
    assert.deepEqual(cueProblems(cues, frames), [], `words=${words} fps=${fps} sec=${sec} frames=${frames}`);
    if (cues.length) assert.equal(cues.map((c) => c.text).join(" "), t);
  }
});

// ============================================================================
// Safe project persistence
// ============================================================================
const demo = (title: string, extra: Record<string, unknown> = {}) => ({ title, scenes: [{ id: "a", template: "title", narration: "Opening." }, { id: "b", template: "end-card", narration: "Closing." }], ...extra });
await test("saving is atomic and keeps the previous version", () => {
  const dir = tmp("save");
  const file = path.join(dir, "project.json");
  const first = writeProjectFile(dir, demo("First"));
  assert.ok(first.written && first.backup === null && !fs.existsSync(backupPathOf(file)));
  const v1 = fs.readFileSync(file, "utf8");
  const second = writeProjectFile(dir, demo("Second"));
  assert.equal(second.backup, backupPathOf(file));
  assert.equal(fs.readFileSync(backupPathOf(file), "utf8"), v1, "the backup is the version that was replaced");
  assert.equal(loadProject(dir).project.title, "Second");
  // saving the same content again touches nothing
  const before = fs.statSync(file).mtimeMs;
  const again = writeProjectFile(dir, demo("Second"));
  assert.equal(again.written, false);
  assert.equal(fs.statSync(file).mtimeMs, before);
  assert.equal(fs.readFileSync(backupPathOf(file), "utf8"), v1, "an identical save does not overwrite the backup");
  assert.deepEqual(fs.readdirSync(dir).sort(), ["project.json", "project.json.bak"]);
});
await test("an interrupted or failed save leaves the project exactly as it was", () => {
  const dir = tmp("interrupted");
  const file = path.join(dir, "project.json");
  writeProjectFile(dir, demo("Good"));
  const good = fs.readFileSync(file);
  for (const fault of ["after-temp-write", "after-backup", "on-rename"] as SaveFault[]) {
    assert.throws(() => writeProjectFile(dir, demo("Half-written"), { fault }), /Could not save project\.json.*previous version was left unchanged/s, fault);
    assert.ok(fs.readFileSync(file).equals(good), `project.json changed after a failure at ${fault}`);
    assert.equal(loadProject(dir).project.title, "Good");
    assert.deepEqual(staleTempFiles(dir, "project.json"), [], `temporary files left after ${fault}`);
  }
  // an invalid project is refused before anything is written
  assert.throws(() => writeProjectFile(dir, { title: "Bad", scenes: [{ id: "a", template: "nope" }] }), /Invalid project/);
  assert.ok(fs.readFileSync(file).equals(good));
  // the generic writer refuses content its verifier rejects
  assert.throws(() => writeFileAtomic(path.join(dir, "x.json"), "{", { verify: (t) => { JSON.parse(t); } }), /Could not save x\.json/);
  assert.ok(!fs.existsSync(path.join(dir, "x.json")));
  // a process killed mid-save leaves only a stray temporary file, which loading ignores
  fs.writeFileSync(path.join(dir, ".project.json.999.deadbeef.tmp"), '{"title":"trunc');
  assert.equal(loadProject(dir).project.title, "Good");
  assert.equal(staleTempFiles(dir, "project.json").length, 1);
});
await test("a damaged project file can be recovered from the previous version", () => {
  const dir = tmp("recover");
  const file = path.join(dir, "project.json");
  writeProjectFile(dir, demo("Version one"));
  writeProjectFile(dir, demo("Version two"));
  fs.writeFileSync(file, '{"title":"Version two","scenes":[{"id":"a","templ'); // simulated torn write by another tool
  assert.throws(() => loadProject(dir), /Could not read .*project\.json.*npm run restore/s);
  const damaged = fs.readFileSync(file);
  const r = restoreProjectBackup(dir);
  assert.equal(r.project.title, "Version one");
  assert.equal(loadProject(dir).project.title, "Version one");
  assert.ok(fs.readFileSync(backupPathOf(file)).equals(damaged), "the file that was replaced is kept, so restoring loses nothing");
  // no backup, or a backup that is not a project: refuse clearly, change nothing
  const empty = tmp("recover-empty");
  writeProjectFile(empty, demo("Only"));
  assert.throws(() => restoreProjectBackup(empty), /No previous version to restore/);
  fs.writeFileSync(backupPathOf(path.join(empty, "project.json")), "not json");
  assert.throws(() => restoreProjectBackup(empty), /backup is not a valid project/);
  assert.equal(loadProject(empty).project.title, "Only");
});
await test("uploads and new takes can never land on an existing file name", () => {
  const dir = tmp("names");
  assert.equal(freeFileName(dir, "23-s23.mp3"), "23-s23.mp3");
  fs.writeFileSync(path.join(dir, "23-s23.mp3"), "one");
  assert.equal(freeFileName(dir, "23-s23.mp3"), "23-s23-2.mp3");
  fs.writeFileSync(path.join(dir, "23-s23-2.mp3"), "two");
  assert.equal(freeFileName(dir, "23-s23.mp3"), "23-s23-3.mp3");
});

// ============================================================================
// Production Intent Validator
// ============================================================================
await test("capability vocabulary is small, complete and safe to match with", () => {
  assert.ok(CAPABILITY_IDS.length >= 20 && CAPABILITY_IDS.length <= 60, `vocabulary has ${CAPABILITY_IDS.length} terms`);
  for (const id of CAPABILITY_IDS) { assert.ok(!VOCABULARY[id].cue.global && !VOCABULARY[id].cue.sticky, `${id}: a stateful cue would give random results`); assert.ok(VOCABULARY[id].label); }
  for (const t of TEMPLATE_IDS) {
    const caps = TEMPLATE_CAPABILITIES[t];
    assert.ok(caps, `template ${t} declares no capabilities`);
    for (const c of [...caps.core, ...(caps.also ?? [])]) assert.ok(c in VOCABULARY, `${t} lists unknown capability ${c}`);
  }
  // scene fields extend what a generic template shows
  assert.ok(sceneCapabilities({ template: "landscape", environment: "nile-valley" }).core.has("nile"));
  assert.ok(sceneCapabilities({ template: "characters", cast: [{ kind: "scribe", action: "read" }] }).all.has("scribes"));
  assert.ok(sceneCapabilities({ template: "artifact", prop: "papyrus" }).core.has("papyrus"));
  assert.ok(!sceneCapabilities({ template: "artifact", prop: "papyrus" }).all.has("coffin"));
  assert.ok(sceneCapabilities({ template: "priests-rewrapping", params: { action: "record labels" } }).core.has("papyrus"));
});
await test("the three outcomes are distinct: validated match, unsupported direction, requires human review", () => {
  const scene = (template: string, visual: string | null, extra: Record<string, unknown> = {}) =>
    parseProject({ title: "T", scenes: [{ id: "a", template, narration: "Text.", ...extra, ...(visual === null ? {} : { production: { sourceNumber: 1, sceneTitle: "Shot", chapter: "", visual, sound: "" } }) }] }).scenes[0];
  const check = (template: string, visual: string | null, extra?: Record<string, unknown>) => validateSceneIntent(scene(template, visual, extra), 0);

  const ok = check("rc-07", "Accurate Theban escarpment and Hatshepsut temple illustration; no Giza pyramids.");
  assert.equal(ok.status, "validated");
  assert.deepEqual(ok.unsupported, []);
  assert.deepEqual(ok.conflicts, []);

  const bad = check("coffin-chamber", "Modern Cairo at night with orderly vehicles.");
  assert.equal(bad.status, "unsupported");
  assert.deepEqual(bad.unsupported, ["modern-city", "parade"]);
  assert.equal(bad.alternatives[0].template, "rc-17");
  assert.match(bad.message, /does not show: modern city streets.*Closest existing template: "RC 17.*Nothing was changed/s);

  const vague = check("tomb-interior", "Name-by-name reveal; simple timeline folds into stacked boxes.");
  assert.equal(vague.status, "review");
  assert.match(vague.message, /cannot be judged automatically/);

  // supported pieces, but not what the template is for → a person decides
  const offSubject = check("tomb-robbery", "A coffin under a single lamp.", { params: { stage: "intact", showTorch: true } });
  assert.equal(offSubject.status, "review");
  assert.deepEqual(offSubject.unsupported, []);
  assert.match(offSubject.reviewReasons[0], /mainly about/);
  // bespoke animation is never auto-validated
  assert.equal(check("map", "A map whose route dissolves into sand.").status, "review");

  // "no X" is a constraint: satisfied when the template lacks X, a conflict when it shows X
  const split = splitDirection("Theban cliffs; no Giza pyramids.");
  assert.ok(split.wanted.includes("theban cliffs") && !split.wanted.includes("giza"));
  assert.equal(split.ruledOut.trim(), "giza pyramids");
  const conflict = check("landscape", "Open desert at dawn; no Giza pyramids.", { environment: "giza-pyramids" });
  assert.equal(conflict.status, "unsupported");
  assert.deepEqual(conflict.conflicts, ["pyramids"]);
  assert.equal(check("landscape", "Open desert at dawn; no Giza pyramids.", { environment: "open-desert" }).status, "validated");

  // a scene without production notes is simply not checked
  const none = check("landscape", null, { environment: "open-desert" });
  assert.equal(none.status, "no-direction");
  assert.deepEqual(none.alternatives, []);
});
await fullTest("Royal Cache scenes 23, 30 and 31 are flagged with a concrete, actionable alternative", () => {
  const { project } = loadProject(path.join(PROJECTS_DIR, FULL));
  const before = JSON.stringify(project);
  const report = validateIntent(project);
  assert.equal(JSON.stringify(project), before, "validation must never modify the project");
  assert.deepEqual(validateIntent(project), report, "validation is deterministic");
  const s = (no: number) => report.scenes[no - 1];

  // 23: a plain cutaway is asked to show workers hauling coffins by rope
  assert.equal(s(23).template, "cutaway");
  assert.equal(s(23).status, "unsupported");
  assert.deepEqual(s(23).unsupported, ["workers-1881", "hoist-by-rope"]);
  assert.deepEqual(s(23).supported, ["rock-cutaway", "coffin", "rope"]);
  assert.equal(s(23).alternatives[0].template, "rc-16");
  assert.deepEqual(s(23).alternatives[0].stillMissing, []);
  assert.ok(s(23).soundNotPerformed.includes("rope or pulley") && s(23).soundNotPerformed.includes("breathing"));

  // 30: an ancient coffin chamber is asked to show modern Cairo and vehicles
  assert.equal(s(30).template, "coffin-chamber");
  assert.equal(s(30).status, "unsupported");
  assert.deepEqual(s(30).unsupported, ["modern-city", "parade"]);
  assert.deepEqual(s(30).supported, []);
  assert.equal(s(30).alternatives[0].template, "rc-17");

  // 31: the TT320 cutaway is asked for a route map ending at a museum
  assert.equal(s(31).template, "rc-08");
  assert.equal(s(31).status, "unsupported");
  assert.deepEqual(s(31).unsupported, ["route-map", "museum"]);
  assert.ok(s(31).alternatives.some((a) => a.template === "map"));
  assert.ok(s(31).alternatives.every((a) => a.stillMissing.includes("museum")), "no template shows a museum interior: said plainly, not hidden");

  assert.equal(report.summary.total, 36);
  assert.equal(report.summary.validated + report.summary.unsupported + report.summary.review + report.summary["no-direction"], 36);
  assert.ok(report.summary.validated >= 3 && report.summary.unsupported >= 3 && report.summary.review >= 3, "all three outcomes occur in the real film");
  assert.ok(report.scenes.every((x) => x.message.length > 20));
  // the scenes whose preset was chosen for exactly this direction validate
  for (const no of [10, 17, 20]) assert.equal(s(no).status, "validated", `scene ${no}`);
});
await test("projects without production notes are unaffected by the validator", () => {
  for (const slug of ["royal-cache", "demo-great-pyramid", "demo-template-library"]) {
    const { project } = loadProject(path.join(PROJECTS_DIR, slug));
    const r = validateIntent(project);
    assert.equal(r.summary["no-direction"], project.scenes.length, slug);
    assert.ok(r.scenes.every((x) => !x.unsupported.length && !x.alternatives.length));
  }
});
await test("the Production Match Check is wired into the UI and server as a read-only report", async () => {
  const { Script } = await import("node:vm");
  const root = path.join(PROJECTS_DIR, "..");
  const app = fs.readFileSync(path.join(root, "ui", "app.js"), "utf8");
  const html = fs.readFileSync(path.join(root, "ui", "index.html"), "utf8");
  const server = fs.readFileSync(path.join(root, "server", "index.ts"), "utf8");
  new Script(app, { filename: "app.js" });
  for (const id of ["btnCheckIntent", "intentState", "intentResults"]) { assert.match(html, new RegExp('id="' + id + '"')); assert.ok(app.includes(id), "unwired UI control: " + id); }
  assert.ok(app.includes("/api/intent/preview") && server.includes('"/api/intent/preview"'));
  const fn = app.slice(app.indexOf("const checkProductionIntent"), app.indexOf("// ---------- Smart Template Selection"));
  assert.ok(!/project\s*=|\.template\s*=|markDirty|touch\(|save\(/.test(fn), "the check must not edit or save the project");
});

// ============================================================================
// Audio reuse and cache safety
// ============================================================================
const withVoice = (over: Partial<Settings["elevenlabs"]>): Settings => ({ ...DEFAULT_SETTINGS, elevenlabs: { enabled: true, voiceId: "voice-AAA", apiKey: "sk-secret-key", ...over } });
await test("narration identity covers text, voice, model and settings — and nothing private", () => {
  const v = voiceIdentity("elevenlabs", withVoice({}));
  const id = audioIdentity("Hello there.", v);
  assert.equal(audioIdentity("  Hello   there.\n", v), id, "spacing is not spoken");
  assert.notEqual(audioIdentity("Hello there!", v), id, "text");
  assert.notEqual(audioIdentity("Hello there.", voiceIdentity("elevenlabs", withVoice({ voiceId: "voice-BBB" }))), id, "voice");
  assert.notEqual(audioIdentity("Hello there.", { ...v, model: "another-model" }), id, "model");
  assert.notEqual(audioIdentity("Hello there.", { ...v, settings: { ...v.settings, stability: 0.9 } }), id, "generation settings");
  assert.notEqual(audioIdentity("Hello there.", voiceIdentity("piper", DEFAULT_SETTINGS)), id, "provider");
  assert.notEqual(audioIdentity("Hello there.", voiceIdentity("piper", { ...DEFAULT_SETTINGS, piperSpeed: 1.3 })), audioIdentity("Hello there.", voiceIdentity("piper", DEFAULT_SETTINGS)), "piper speed");
  const text = JSON.stringify(v);
  assert.ok(!text.includes("voice-AAA") && !text.includes("sk-secret-key"), "no raw voice id or key in the identity");
});
await fullTest("existing narration is recognised as-is: no regeneration, no file touched, no manifest required", async () => {
  // the 36-scene film: every clip matches its legacy text stamp
  const full = loadProject(path.join(PROJECTS_DIR, FULL));
  assert.equal(loadManifest(full.dir), null, "the reference project has no manifest and needs none");
  const audit = auditNarration(full.project, full.dir);
  assert.ok(audit.every((a) => a.state === "stamp-match"), "all 36 clips match the text they were spoken from");
  let calls = 0;
  const never = async () => { calls++; throw new Error("the self-test must not generate narration for an existing project"); };
  const copy = structuredClone(full.project);
  const r = await narrateProject(copy, full.dir, "elevenlabs", { settings: withVoice({}), synthesize: never });
  assert.deepEqual({ made: r.made, reused: r.reused, total: r.total, kept: r.keptUnverified }, { made: 0, reused: 0, total: 36, kept: [] });
  assert.deepEqual(copy.scenes.map((s) => s.narrationFile), full.project.scenes.map((s) => s.narrationFile));
  // a described manifest covers all 36 files and matches the baseline hashes — and is not written
  const described = describeExistingAudio(full.project, full.dir);
  const base = readBaseline(FULL)!;
  assert.equal(described.entries.length, 36);
  for (const e of described.entries) { assert.equal(e.origin, "legacy-stamp"); assert.equal(e.voice.provider, "unknown"); assert.equal(e.sha256, base.narrationFiles.find((f) => f.file === e.file)?.sha256); }
  assert.ok(!fs.existsSync(path.join(full.dir, MANIFEST_FILE)));
  // the 18-scene short: hand-supplied audio with no stamps is kept, never replaced
  const short = loadProject(path.join(PROJECTS_DIR, "royal-cache"));
  assert.ok(auditNarration(short.project, short.dir).every((a) => a.state === "unverified"));
  const r2 = await narrateProject(structuredClone(short.project), short.dir, "elevenlabs", { settings: withVoice({}), synthesize: never });
  assert.equal(r2.made, 0);
  assert.equal(r2.keptUnverified.length, 18);
  // the Piper demo
  const demoP = loadProject(path.join(PROJECTS_DIR, "demo-great-pyramid"));
  assert.equal((await narrateProject(structuredClone(demoP.project), demoP.dir, "piper", { settings: DEFAULT_SETTINGS, synthesize: never })).made, 0);
  assert.equal(calls, 0);
});
await test("narration is reused across reordering, renumbering and spacing edits; old takes are never overwritten", async () => {
  const dir = tmp("narrate");
  let calls = 0;
  const fake = async (text: string, out: string) => { calls++; fs.writeFileSync(out, `take ${calls}: ${text}`); };
  const opts = { settings: DEFAULT_SETTINGS, synthesize: fake };
  const p: Project = parseProject({ title: "N", scenes: [
    { id: "a", template: "title", narration: "First line." }, { id: "b", template: "landscape", narration: "Second line." }, { id: "c", template: "end-card", narration: "Third line." },
  ] });
  const r1 = await narrateProject(p, dir, "piper", opts);
  assert.deepEqual([r1.made, calls], [3, 3]);
  assert.deepEqual(p.scenes.map((s) => s.narrationFile), ["narration/01-a.wav", "narration/02-b.wav", "narration/03-c.wav"]);
  assert.equal(loadManifest(dir)!.entries.length, 3);
  assert.equal(fs.readFileSync(path.join(dir, "narration/02-b.wav.txt"), "utf8"), "Second line.", "legacy stamp still written for older versions");
  const takes = snapshot(path.join(dir, "narration"));
  const unchanged = () => { const now = snapshot(path.join(dir, "narration")); for (const [f, v] of Object.entries(takes)) if (!f.includes("manifest")) assert.equal(now[f], v, `${f} was modified`); };

  // again: nothing to do
  assert.equal((await narrateProject(p, dir, "piper", opts)).made, 0);
  // spacing-only edit: same audio
  p.scenes[1].narration = "Second   line.\n";
  assert.equal((await narrateProject(p, dir, "piper", opts)).made, 0);
  p.scenes[1].narration = "Second line.";
  // move the last scene to the front: positions (and so conventional file names) all change
  p.scenes.unshift(p.scenes.pop()!);
  const moved = await narrateProject(p, dir, "piper", opts);
  assert.equal(moved.made, 0, "reordering must not regenerate");
  assert.deepEqual(p.scenes.map((s) => s.narrationFile), ["narration/03-c.wav", "narration/01-a.wav", "narration/02-b.wav"]);
  // unlink a scene entirely: its audio is found again by what it says
  delete p.scenes[2].narrationFile;
  const found = await narrateProject(p, dir, "piper", opts);
  assert.deepEqual([found.made, found.reused, p.scenes[2].narrationFile], [0, 1, "narration/02-b.wav"]);
  // the same, for a legacy project with stamps but no manifest
  fs.rmSync(path.join(dir, MANIFEST_FILE));
  delete p.scenes[0].narrationFile;
  const legacy = await narrateProject(p, dir, "piper", opts);
  assert.deepEqual([legacy.made, legacy.reused, p.scenes[0].narrationFile], [0, 1, "narration/03-c.wav"]);
  assert.equal(calls, 3);
  unchanged();

  // a real text change: exactly one new take, in a new file; the old take stays
  p.scenes[1].narration = "First line, rewritten.";
  const edited = await narrateProject(p, dir, "piper", opts);
  assert.deepEqual([edited.made, calls], [1, 4]);
  assert.notEqual(p.scenes[1].narrationFile, "narration/01-a.wav");
  assert.ok(fs.existsSync(path.join(dir, "narration/01-a.wav")));
  unchanged();
  // force: new takes for everything, still nothing overwritten
  const forced = await narrateProject(p, dir, "piper", { ...opts, force: true });
  assert.equal(forced.made, 3);
  unchanged();
  assert.equal(new Set(p.scenes.map((s) => s.narrationFile)).size, 3);

  // a different voice does not silently regenerate; it is reported
  const slower = await narrateProject(p, dir, "piper", { ...opts, settings: { ...DEFAULT_SETTINGS, piperSpeed: 1.4 } });
  assert.equal(slower.made, 0);
  assert.deepEqual(slower.voiceDiffers, [1, 2, 3]);

  // a failed generation leaves no partial file and does not relink the scene
  const linked = p.scenes[0].narrationFile;
  p.scenes[0].narration = "Third line, rewritten.";
  const filesBefore = fs.readdirSync(path.join(dir, "narration")).sort();
  await assert.rejects(narrateProject(p, dir, "piper", { ...opts, synthesize: async (_t, out) => { fs.writeFileSync(out, "partial"); throw new Error("provider went away"); } }), /provider went away/);
  assert.equal(p.scenes[0].narrationFile, linked);
  assert.deepEqual(fs.readdirSync(path.join(dir, "narration")).sort(), filesBefore);
  unchanged();
});
await test("paid narration is blocked outright when NEOKEMET_NO_PAID=1, before any request", async () => {
  const before = outboundCalls;
  await assert.rejects(elevenLabsSynthesize("Hello.", path.join(tmp("paid"), "x.mp3"), withVoice({})), /Paid services are blocked.*No request was sent/);
  assert.equal(outboundCalls, before);
  assert.ok(!fs.existsSync(path.join(tmpRoot, "paid", "x.mp3")));
});

// ============================================================================
// Nothing above may have touched a bundled project
// ============================================================================
await test("no bundled project file was created, moved, renamed, replaced or rewritten by any check", () => {
  assert.deepEqual(snapshot(PROJECTS_DIR), projectsBefore);
  assert.equal(outboundCalls, 0, "no outbound network request was attempted");
});

fs.rmSync(tmpRoot, { recursive: true, force: true });
console.log(`\n${n} checks passed${skipped ? `, ${skipped} skipped (private production data not present)` : ""}.`);
