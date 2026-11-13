// Assembles the narration stem and all cue documents.
//   node scripts/build-cues.mjs
// Inputs (optional): audio/vo/scene-01.mp3|wav … scene-18 (+ scene-XX.json alignment)
// Outputs: public/audio/royal-cache-vo.wav (real VO, or a silent placeholder),
//          src/data/cues.json, audio/royal-cache.srt, audio/cue-sheet.md
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = JSON.parse(fs.readFileSync(path.join(root, "src/data/script.json"), "utf8"));
const voDir = path.join(root, "audio/vo");
const VO_LEAD = 0.55; // narration starts this long after each cut
const MAX_LEN = 9.25; // clips longer than this are gently time-compressed
const WPM = 128; // estimate used only when there is no recorded VO

const probe = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());
const clips = script.map((s) => {
  const id = String(s.id).padStart(2, "0");
  const file = ["mp3", "wav", "m4a"].map((e) => path.join(voDir, `scene-${id}.${e}`)).find((f) => fs.existsSync(f));
  const alignFile = path.join(voDir, `scene-${id}.json`);
  return { file, align: fs.existsSync(alignFile) ? JSON.parse(fs.readFileSync(alignFile, "utf8")).alignment : null };
});
const haveVo = clips.every((c) => c.file);

const cues = [];
const sceneVo = [];
script.forEach((s, i) => {
  const text = s.lines.join(" ");
  const words = text.split(/\s+/).length;
  let dur = haveVo ? probe(clips[i].file) : Math.min(MAX_LEN, (words / WPM) * 60);
  const tempo = dur > MAX_LEN ? dur / MAX_LEN : 1;
  const start = i * 10 + VO_LEAD;
  const al = haveVo ? clips[i].align : null;
  let pos = 0;
  const total = text.length;
  s.lines.forEach((line) => {
    const a = pos, b = pos + line.length; pos = b + 1;
    let t0, t1;
    if (al && al.characters.length === total) { t0 = al.character_start_times_seconds[a]; t1 = al.character_end_times_seconds[b - 1]; }
    else { t0 = (a / total) * dur; t1 = (b / total) * dur; }
    cues.push({ scene: s.id, start: +(start + t0 / tempo).toFixed(3), end: +(start + t1 / tempo).toFixed(3), text: line });
  });
  sceneVo.push({ scene: s.id, title: s.title, start: +start.toFixed(3), end: +(start + dur / tempo).toFixed(3), tempo: +tempo.toFixed(4), words, text });
});
// each subtitle holds until the next one in its scene (or a short tail)
cues.forEach((c, i) => { const n = cues[i + 1]; c.showFrom = +Math.max(c.start - 0.1, (c.scene - 1) * 10 + 0.2).toFixed(3); c.showTo = +(n && n.scene === c.scene ? n.start - 0.1 : Math.min(c.end + 0.45, c.scene * 10 - 0.15)).toFixed(3); });

fs.writeFileSync(path.join(root, "src/data/cues.json"), JSON.stringify({ voAvailable: haveVo, scenes: sceneVo, cues }, null, 1));

// ---- VO stem ------------------------------------------------------------
const voOut = path.join(root, "public/audio/royal-cache-vo.wav");
fs.mkdirSync(path.dirname(voOut), { recursive: true });
if (haveVo) {
  const args = ["-y", "-v", "error"];
  clips.forEach((c) => args.push("-i", c.file));
  const parts = clips.map((c, i) => `[${i}:a]aresample=44100,aformat=channel_layouts=stereo${sceneVo[i].tempo !== 1 ? `,atempo=${sceneVo[i].tempo}` : ""},afade=t=in:d=0.02,adelay=${Math.round(sceneVo[i].start * 1000)}:all=1[a${i}]`);
  const filter = `${parts.join(";")};${clips.map((_, i) => `[a${i}]`).join("")}amix=inputs=${clips.length}:normalize=0,apad=whole_dur=180,atrim=0:180,loudnorm=I=-17:TP=-1.5:LRA=11:linear=true[out]`;
  execFileSync("ffmpeg", [...args, "-filter_complex", filter, "-map", "[out]", "-ar", "44100", "-ac", "2", "-c:a", "pcm_s16le", voOut]);
  console.log("VO stem assembled from", clips.length, "clips");
} else {
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-t", "180", "-c:a", "pcm_s16le", voOut]);
  console.log("No narration clips found – wrote a silent 180 s placeholder VO.");
}

// ---- SRT ----------------------------------------------------------------
const tc = (t, sep = ",") => { const ms = Math.round(t * 1000); const p = (n, l = 2) => String(n).padStart(l, "0"); return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)}${sep}${p(ms % 1000, 3)}`; };
fs.writeFileSync(path.join(root, "audio/royal-cache.srt"), cues.map((c, i) => `${i + 1}\n${tc(c.showFrom)} --> ${tc(c.showTo)}\n${c.text}\n`).join("\n"));

// ---- cue sheet ------------------------------------------------------------
const foleyFile = path.join(root, "audio/foley-cues.json");
const foley = fs.existsSync(foleyFile) ? JSON.parse(fs.readFileSync(foleyFile, "utf8")) : [];
let md = `# THE ROYAL CACHE — audio cue sheet\n\nPicture: 1080×1920, 30 fps, 180.000 s (5,400 frames). All times are from film start.\n\nNarration source: ${haveVo ? "recorded clips in `audio/vo/` (timings below are measured from the audio)" : "NOT RECORDED — timings below are estimates at ~" + WPM + " wpm; `public/audio/royal-cache-vo.wav` is a silent placeholder"}.\n\n## Voiceover (authoritative text — do not paraphrase)\n\n| # | Scene | In | Out | Words | Text |\n|---|---|---|---|---|---|\n`;
sceneVo.forEach((s) => { md += `| ${s.scene} | ${s.title} | ${tc(s.start, ".")} | ${tc(s.end, ".")} | ${s.words} | ${s.text} |\n`; });
md += `\nDirection: solemn, warm documentary read; natural pauses at commas; each line starts ≈${VO_LEAD}s after the cut and must finish before the next cut (10 s scenes).\n\n## Subtitle cues\n\n| In | Out | Scene | Line |\n|---|---|---|---|\n`;
cues.forEach((c) => { md += `| ${tc(c.showFrom, ".")} | ${tc(c.showTo, ".")} | ${c.scene} | ${c.text} |\n`; });
md += `\n## Music (original, synthesised by \`scripts/gen-audio.mjs\`)\n\nSlow modal drone in D with sparse plucked-string phrases; one soft frame-drum note on every cut (00:10, 00:20 …), a slow processional pulse under scenes 6 and 17; resolves to an open D chord in scene 18 and fades from 02:56.5.\n\n## Foley (original, synthesised)\n\n| Time | Cue | Note |\n|---|---|---|\n`;
foley.forEach((f) => { md += `| ${tc(f.t, ".")} | ${f.name} | ${f.note} |\n`; });
fs.writeFileSync(path.join(root, "audio/cue-sheet.md"), md);
console.log("wrote cues.json, royal-cache.srt, cue-sheet.md; voAvailable =", haveVo);
