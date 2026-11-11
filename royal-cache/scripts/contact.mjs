// Dev helper: render stills for given frames and tile them into one sheet.
//   node scripts/contact.mjs out/sheet.png 450 750 1050 ...
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const [out, ...frames] = process.argv.slice(2);
const dir = path.join(path.dirname(out), ".stills");
fs.mkdirSync(dir, { recursive: true });
const files = frames.map((fr) => {
  const f = path.join(dir, `f${fr}.png`);
  execFileSync("npx", ["remotion", "still", "src/index.ts", "RoyalCacheFilm", f, `--frame=${fr}`, "--scale=0.4", "--log=error"], { stdio: "inherit" });
  return f;
});
const cols = Math.min(files.length, 5);
const rows = Math.ceil(files.length / cols);
execFileSync("ffmpeg", ["-y", "-v", "error", ...files.flatMap((f) => ["-i", f]), "-filter_complex", `${files.map((_, i) => `[${i}:v]`).join("")}xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % cols) * 432}_${Math.floor(i / cols) * 768}`).join("|")}[v]`, "-map", "[v]", out]);
console.log("sheet", out, `${cols}x${rows}`);
