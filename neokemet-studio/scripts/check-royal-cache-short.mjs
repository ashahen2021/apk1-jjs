#!/usr/bin/env node
// Zero-dependency, read-only QA for the Royal Cache vertical pilot.
// No paid service, no project writes, no rendering.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const slug = process.argv[2] || "royal-cache-short-2026";
const file = path.join(ROOT, "projects", slug, "project.json");
const allowed = new Set(["royal-pharaohs","tomb-robbery","priests-rewrapping","rc-07","rc-08","rc-15","rc-06","end-card"]);
const errors = [], warnings = [];
if (!fs.existsSync(file)) { console.error("Missing: " + file); process.exit(2); }
const project = JSON.parse(fs.readFileSync(file,"utf8"));
if (project.format !== "9:16") errors.push("Expected 9:16 vertical format.");
if (project.fps !== 30) warnings.push("Pilot was designed at 30 fps.");
if (!String(project.topic || "").includes("YIS3_xrkv4I")) errors.push("The parent YouTube video URL is missing from the project topic.");
if (!Array.isArray(project.scenes) || !project.scenes.length || project.scenes.length > 40) errors.push("Expected 1–40 scenes.");
let words = 0, estimate = 0;
const ids = new Set();
for (const [i,s] of (project.scenes || []).entries()) {
  const n = i + 1;
  if (ids.has(s.id)) errors.push("Duplicate scene ID: " + s.id);
  ids.add(s.id);
  if (!allowed.has(s.template)) warnings.push("Scene " + n + " has an unreviewed template " + s.template);
  const count = String(s.narration || "").trim().split(/\s+/).filter(Boolean).length;
  if (!count) errors.push("Scene " + n + " narration is empty.");
  words += count;
  estimate += (count / 135) * 60 + 1.4;
  if (s.durationSec !== undefined) warnings.push("Scene " + n + " uses a manual duration; check against actual speech.");
  if (s.narrationFile && !fs.existsSync(path.resolve(path.dirname(file), s.narrationFile))) warnings.push("Scene " + n + " narration audio is missing.");
}
if (project.scenes?.at(-1)?.template !== "end-card") errors.push("The closing CTA must use the end-card template.");
if (estimate > 60) warnings.push("Estimated " + estimate.toFixed(1) + "s is longer than the 60s target.");
if (project.subtitles !== true) warnings.push("Subtitles are off; this is optional for Shorts.");
console.log("Royal Cache Short Pilot | " + slug);
console.log((project.scenes || []).length + " scenes, " + words + " words, estimated " + estimate.toFixed(1) + "s, " + project.format);
console.log("Related long documentary: https://www.youtube.com/watch?v=YIS3_xrkv4I");
console.log("Estimate only: run npx tsx server/cli.ts validate " + slug + " after recording to measure audio.");
for (const msg of warnings) console.log("WARN: " + msg);
for (const msg of errors) console.error("ERROR: " + msg);
if (errors.length) process.exit(1);
console.log("PASS: " + warnings.length + " warning(s), no structural errors.");
