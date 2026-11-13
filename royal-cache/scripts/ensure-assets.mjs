// Generates any missing build-time assets (textures, score, foley, VO stem, cues).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const need = (files, script) => {
  if (files.every((f) => fs.existsSync(path.join(root, f)))) return;
  console.log(`[assets] running ${script}`);
  execFileSync("node", [path.join(root, "scripts", script)], { stdio: "inherit" });
};
need(["public/textures/grain.png", "public/textures/distress.png", "public/textures/speckle.png"], "gen-textures.mjs");
need(["public/audio/music.wav", "public/audio/foley.wav", "audio/foley-cues.json"], "gen-audio.mjs");
need(["public/audio/royal-cache-vo.wav", "src/data/cues.json"], "build-cues.mjs");
