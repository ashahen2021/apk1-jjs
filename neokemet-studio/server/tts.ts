import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ensureDir, Settings, TOOLS_DIR } from "./paths.ts";

const walk = (dir: string, out: string[] = []): string[] => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
};

/** Locate the Piper executable and voices installed by scripts/setup-piper. */
export const findPiper = (s: Settings) => {
  const exe = s.piperPath && fs.existsSync(s.piperPath) ? s.piperPath : walk(path.join(TOOLS_DIR, "piper")).find((f) => /[\\/]piper(\.exe)?$/.test(f)) ?? null;
  const voices = walk(path.join(TOOLS_DIR, "voices")).filter((f) => f.endsWith(".onnx"));
  const model = s.piperModel && fs.existsSync(s.piperModel) ? s.piperModel : voices[0] ?? null;
  return { exe, model, voices };
};

/** Offline narration with Piper. Writes a 16-bit WAV. */
export const piperSynthesize = (text: string, outWav: string, s: Settings) =>
  new Promise<void>((resolve, reject) => {
    const { exe, model } = findPiper(s);
    if (!exe) return reject(new Error("Piper is not installed. Run scripts\\setup-piper.ps1 (Windows) or scripts/setup-piper.sh, or set the Piper path in Settings."));
    if (!model) return reject(new Error("No Piper voice found. Put a .onnx voice (and its .onnx.json) in tools/voices, or run the setup-piper script."));
    ensureDir(path.dirname(outWav));
    const child = spawn(exe, ["--model", model, "--output_file", outWav, "--length_scale", String(s.piperSpeed), "--sentence_silence", "0.28"], { cwd: path.dirname(exe) });
    let err = "";
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) => reject(new Error(`Could not start Piper (${exe}): ${e.message}`)));
    child.on("close", (code) => (code === 0 && fs.existsSync(outWav) ? resolve() : reject(new Error(`Piper failed (exit ${code}): ${err.split("\n").slice(-4).join(" ")}`))));
    // Piper reads one utterance per line
    child.stdin.end(text.replace(/\s+/g, " ").trim() + "\n");
  });

/**
 * OPTIONAL, PAID CLOUD SERVICE. Off unless the user enables it in Settings and
 * supplies their own key (or ELEVENLABS_API_KEY). Never used during rendering.
 */
export const elevenLabsSynthesize = async (text: string, outMp3: string, s: Settings) => {
  if (!s.elevenlabs.enabled) throw new Error("ElevenLabs is disabled. It is an optional paid cloud service — enable it in Settings if you want to use it.");
  const key = process.env.ELEVENLABS_API_KEY || s.elevenlabs.apiKey;
  if (!key) throw new Error("No ElevenLabs API key. Set ELEVENLABS_API_KEY or enter a key in Settings.");
  if (!s.elevenlabs.voiceId) throw new Error("No ElevenLabs voice id set in Settings.");
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(s.elevenlabs.voiceId)}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({ text, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.55, similarity_boost: 0.8 } }),
  });
  if (!res.ok) throw new Error(`ElevenLabs error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  ensureDir(path.dirname(outMp3));
  fs.writeFileSync(outMp3, Buffer.from(await res.arrayBuffer()));
};
