// Verifies a rendered film: container facts, blank-frame scan, audio levels,
// and that subtitle cues stay inside their scenes.
//   node scripts/verify.mjs out/royal-cache.mp4
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const require_ = createRequire(import.meta.url);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = process.argv[2] ?? path.join(root, "out/royal-cache.mp4");
const run = (cmd, args) => execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 28 });
let ok = true;
const check = (name, pass, detail) => { ok &&= pass; console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`); };

const info = JSON.parse(run("ffprobe", ["-v", "error", "-count_frames", "-show_streams", "-show_format", "-of", "json", file]));
const v = info.streams.find((s) => s.codec_type === "video");
const a = info.streams.find((s) => s.codec_type === "audio");
check("video codec is H.264", v.codec_name === "h264", v.codec_name);
check("dimensions 1080×1920 (9:16)", v.width === 1080 && v.height === 1920, `${v.width}×${v.height}`);
check("frame rate 30 fps", v.r_frame_rate === "30/1", v.r_frame_rate);
check("exactly 5,400 frames", Number(v.nb_read_frames) === 5400, v.nb_read_frames);
check("video duration 180 s", Math.abs(Number(v.duration) - 180) < 0.02, `${v.duration} s`);
check("audio stream present", !!a, a ? `${a.codec_name} ${a.sample_rate} Hz, ${Number(a.duration).toFixed(2)} s` : "none");

// blank / frozen-black scan: per-frame luma stats, sampled 3× per second
const stats = run("ffmpeg", ["-v", "error", "-i", file, "-vf", "fps=3,scale=108:192,signalstats,metadata=print:file=-", "-an", "-f", "null", "-"]);
const yavg = [...stats.matchAll(/YAVG=([\d.]+)/g)].map((m) => Number(m[1]));
const ymin = [...stats.matchAll(/YMIN=([\d.]+)/g)].map((m) => Number(m[1]));
const ymax = [...stats.matchAll(/YMAX=([\d.]+)/g)].map((m) => Number(m[1]));
const flat = yavg.filter((_, i) => ymax[i] - ymin[i] < 40).length;
check("no blank frames (every sampled frame has picture contrast)", flat === 0 && yavg.length >= 539, `${yavg.length} samples, ${flat} flat, luma ${Math.min(...yavg).toFixed(0)}–${Math.max(...yavg).toFixed(0)}`);
const err = (args) => { const { spawnSync } = require_("node:child_process"); return spawnSync("ffmpeg", args, { encoding: "utf8", maxBuffer: 1 << 28 }).stderr; };
const black = err(["-v", "info", "-i", file, "-vf", "blackdetect=d=0.05:pix_th=0.08", "-an", "-f", "null", "-"]).match(/black_start/g);
check("no black segments", !black, black ? `${black.length} found` : "");

// audio: overall level and narration presence in every scene
if (a) {
  const vol = err(["-v", "info", "-i", file, "-af", "volumedetect", "-vn", "-f", "null", "-"]);
  const mean = Number(vol.match(/mean_volume: ([-\d.]+)/)?.[1]);
  const max = Number(vol.match(/max_volume: ([-\d.]+)/)?.[1]);
  check("audio is audible and not clipping", mean > -40 && max <= 0, `mean ${mean} dB, peak ${max} dB`);
  // audio sync: narration energy must begin within 0.25 s of each cue-sheet start
  const cuesA = JSON.parse(fs.readFileSync(path.join(root, "src/data/cues.json"), "utf8"));
  if (cuesA.voAvailable) {
    const sil = err(["-v", "info", "-i", path.join(root, "public/audio/royal-cache-vo.wav"), "-af", "silencedetect=n=-38dB:d=0.6", "-f", "null", "-"]);
    const ends = [...sil.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
    const worst = Math.max(...cuesA.scenes.map((s) => Math.min(...ends.map((e) => Math.abs(e - s.start)))));
    check("narration onsets match the cue sheet (audio sync)", worst < 0.3, `worst offset ${worst.toFixed(3)} s over ${cuesA.scenes.length} scenes`);
  }
}
const cues = JSON.parse(fs.readFileSync(path.join(root, "src/data/cues.json"), "utf8"));
check("subtitle cues stay inside their own 10 s scene", cues.cues.every((c) => c.showFrom >= (c.scene - 1) * 10 && c.showTo <= c.scene * 10), `${cues.cues.length} cues`);
check("narration ends before each cut", cues.scenes.every((s) => s.end < s.scene * 10 - 0.3), `latest ends ${Math.max(...cues.scenes.map((s) => s.end - (s.scene - 1) * 10)).toFixed(2)} s into its scene`);
console.log(ok ? "\nAll checks passed." : "\nSome checks FAILED.");
process.exit(ok ? 0 : 1);
