// Run independently: npx tsx server/selftest-v1.ts
// No paid services, narration assets, ffmpeg renders or production edits.
import assert from "node:assert/strict";
import { planFromScript } from "../shared/planner.ts";
import { planV1Short } from "../shared/v1Topics.ts";
import { parseProject } from "./projects.ts";
import { resolveTimeline } from "./timeline.ts";

const film = async (title: string, script: string, length: 15 | 30) => {
  const base = planFromScript(title, script);
  const planned = planV1Short(base, length, title);
  const project = parseProject({ title, format: "9:16", fps: 30, subtitles: true, scenes: planned.scenes });
  const timeline = await resolveTimeline(project, ".");
  assert.equal(timeline.totalFrames, length * 30);
  assert.ok(project.scenes.every(s => s.template === "v1-topic-short"));
  assert.ok(project.scenes.every(s => !!s.params?.shots && String(s.params.shots).split(",").length >= 2));
  assert.ok(project.scenes.every(s => s.narration === base[project.scenes.indexOf(s)].narration));
  assert.equal(project.subtitles, true);
  return planned;
};
const painting = await film("Painting the Dark", [
  "The artists painted tomb walls by oil lamp.",
  "They ground mineral pigments and prepared their colours.",
  "Inside narrow limestone corridors, artists raised the brush.",
  "Their underworld murals guided the dead king.",
].join("\n\n"), 15);
assert.equal(painting.topic, "painting");
assert.ok(painting.coverage >= 0.8);
assert.ok(String(painting.scenes[0].params?.shots).includes("lamp"));
assert.ok(String(painting.scenes[1].params?.shots).includes("pigments"));

const papyrus = await film("Papyrus from Reeds", [
  "They harvested papyrus reeds from the Nile marsh.",
  "Workers stripped each stalk into narrow pith strips.",
  "The strips were cross layered on a flat surface.",
  "A heavy weight pressed and dried the sheet.",
  "Scribes wrote ink onto the finished papyrus.",
].join("\n\n"), 30);
assert.equal(papyrus.topic, "papyrus");
assert.equal(papyrus.coverage, 1);

const stone = await film("Nile Stone Transport", [
  "Workers quarried limestone blocks beside the river.",
  "They hauled the stone blocks up a loading ramp.",
  "Each cargo block was tied with thick ropes.",
  "The sailboat carried the stones along the Nile.",
].join("\n\n"), 15);
assert.equal(stone.topic, "transport");
assert.equal(stone.coverage, 1);
assert.ok(String(stone.scenes[2].params?.shots).includes("ropes"));

const unmatched = planV1Short(planFromScript("Stars", "Stars moved across the skies.\n\nAstronomers watched bright planets."), 15, "Stars");
assert.equal(unmatched.topic, null);
assert.ok(unmatched.warnings.some(w => /must be drawn/i.test(w)));
assert.equal(unmatched.scenes[0].params?.topic, "missing");

const original = planFromScript("Standard", "A king ordered a temple.\n\nWorkers carried the coffin in a funeral procession.\n\nThe story ended.");
assert.deepEqual(original.map(s=>s.template), ["title","procession","end-card"]);
console.log("PASS V1: 15s painting + 30s papyrus + 15s Nile transport + explicit missing art + unchanged standard planner");
