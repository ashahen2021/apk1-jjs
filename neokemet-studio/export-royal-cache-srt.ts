/**
 * NeoKemetAI Animation Studio — audio-timed YouTube caption / chapter exporter.
 * Put this file in the neokemet-studio folder (beside package.json), then run:
 *   npx tsx .\export-royal-cache-srt.ts the-royal-cache-full-documentary
 *
 * Uses the SAME resolveTimeline() and subtitles cues as the Remotion export.
 * Does not modify any project, original audio, or movie. No cloud/API calls.
 */
import fs from "node:fs";
import path from "node:path";
import { loadProject, projectDir } from "./server/projects.ts";
import { resolveTimeline } from "./server/timeline.ts";

const slug = process.argv[2] || "the-royal-cache-full-documentary";
const dir = projectDir(slug);
if (!fs.existsSync(path.join(dir, "project.json"))) {
  console.error(`Project not found: ${dir}`);
  console.error("Use the exact folder name of your film under neokemet-studio/projects/.");
  process.exit(1);
}
const { project } = loadProject(dir);
const timeline = await resolveTimeline(project, dir);
const missing = timeline.scenes.filter((s) => s.estimated && s.scene.narration.trim());
if (missing.length) {
  console.error("Missing/unreadable narration audio in scenes: " + missing.map(s => s.index + 1).join(", "));
  console.error("Generate or link all voice files first; refusing to create an out-of-sync SRT.");
  process.exit(1);
}

function srtTime(seconds: number): string {
  const msTotal = Math.max(0, Math.round(seconds * 1000));
  const hh = Math.floor(msTotal / 3600000);
  const mm = Math.floor((msTotal % 3600000) / 60000);
  const ss = Math.floor((msTotal % 60000) / 1000);
  const ms = msTotal % 1000;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}
function chapterTime(seconds: number): string {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  return (h ? h + ":" + String(Math.floor((s % 3600) / 60)).padStart(2, "0") : String(Math.floor(s / 60)).padStart(2, "0")) + ":" + String(s % 60).padStart(2, "0");
}

const lines: string[] = [];
let cueIndex = 0;
for (const scene of timeline.scenes) {
  for (const cue of scene.cues) {
    const start = (scene.startFrame + cue.from) / project.fps;
    const end = (scene.startFrame + cue.to) / project.fps;
    if (end <= start || !cue.text.trim()) continue;
    cueIndex++;
    lines.push(`${cueIndex}\n${srtTime(start)} --> ${srtTime(end)}\n${cue.text.trim()}\n`);
  }
}

const chapterRows: string[] = [];
let lastChapter = "";
for (const scene of timeline.scenes) {
  const chapter = (scene.scene.production?.chapter || "").trim();
  if (chapter && chapter !== lastChapter) {
    chapterRows.push(`${chapterTime(scene.startFrame / project.fps)} ${chapter}`);
    lastChapter = chapter;
  }
}
if (!chapterRows.length) chapterRows.push("00:00 THE ROYAL CACHE");

const out = path.join(dir, "youtube");
fs.mkdirSync(out, { recursive: true });
const srtPath = path.join(out, "The_Royal_Cache_EN_audio_timed.srt");
const chapterPath = path.join(out, "YouTube_chapters_audio_timed.txt");
fs.writeFileSync(srtPath, lines.join("\n") + "\n", "utf8");
fs.writeFileSync(chapterPath, chapterRows.join("\n") + "\n", "utf8");
console.log("Done. Audio-based scene/subtitle timing exported:");
console.log(`SRT: ${srtPath} (${cueIndex} caption cues)`);
console.log(`YouTube chapters: ${chapterPath} (${chapterRows.length} chapters)`);
console.log(`Film timeline: ${chapterTime(timeline.seconds)}; ${timeline.scenes.length} scenes`);
console.log("NOTE: Word/phrase timing within each audio clip is proportional, not forced-aligned.");
console.log("Spot-check captions against the final MP4 before upload.");
