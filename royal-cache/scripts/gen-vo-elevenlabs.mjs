// Optional: generate the narration with ElevenLabs, one clip per scene, with
// character-level timestamps (used for frame-accurate subtitles).
//
//   ELEVENLABS_API_KEY=... node scripts/gen-vo-elevenlabs.mjs [voiceId] [--only=3,7]
//
// Output: audio/vo/scene-XX.mp3 + audio/vo/scene-XX.json (alignment).
// Then run `npm run cues` to assemble the VO stem, SRT and cue sheet.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.error("Set ELEVENLABS_API_KEY in the environment (never commit it).");
  process.exit(1);
}
const args = process.argv.slice(2);
const voiceId = args.find((a) => !a.startsWith("--")) ?? "HxDbdCNjbOALcQVMdMll"; // Arthur Vale – history for sleep
const only = args.find((a) => a.startsWith("--only="))?.slice(7).split(",").map(Number);
const speed = Number(args.find((a) => a.startsWith("--speed="))?.slice(8) ?? 1);
const script = JSON.parse(fs.readFileSync(path.join(root, "src/data/script.json"), "utf8"));
const outDir = path.join(root, "audio/vo");
fs.mkdirSync(outDir, { recursive: true });

for (let i = 0; i < script.length; i++) {
  const s = script[i];
  if (only && !only.includes(s.id)) continue;
  const text = s.lines.join(" ");
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        previous_text: i > 0 ? script[i - 1].lines.join(" ") : undefined,
        next_text: i < script.length - 1 ? script[i + 1].lines.join(" ") : undefined,
        voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.1, speed },
      }),
    },
  );
  if (!res.ok) {
    console.error(`scene ${s.id}: HTTP ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const json = await res.json();
  const id = String(s.id).padStart(2, "0");
  fs.writeFileSync(path.join(outDir, `scene-${id}.mp3`), Buffer.from(json.audio_base64, "base64"));
  fs.writeFileSync(
    path.join(outDir, `scene-${id}.json`),
    JSON.stringify({ text, alignment: json.alignment }),
  );
  const end = json.alignment?.character_end_times_seconds?.at(-1);
  console.log(`scene ${id}: ${end?.toFixed(2)} s`);
}
