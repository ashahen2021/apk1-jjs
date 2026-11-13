// Narration identity: what a recorded narration file was made from.
//
// Before this module the only record was "<audio>.txt", a copy of the spoken
// text. That says nothing about the voice, model or settings, and it is tied to
// the file name (scene position + scene id + provider extension), so reordering
// scenes or switching provider looked like "no audio" and triggered a new,
// possibly paid, generation.
//
// The manifest (narration/manifest.json) is optional and additive:
//   * a project without one behaves exactly as before (stamp files still count);
//   * it never renames, moves or rewrites an audio file;
//   * it lets existing audio be found again by what it says, not where it sits.
import fs from "node:fs";
import path from "node:path";
import type { Project } from "../shared/schema.ts";
import type { Settings } from "./paths.ts";
import { sha256File, sha256Text, writeFileAtomic } from "./persist.ts";
import { ELEVENLABS_MODEL, ELEVENLABS_OUTPUT_FORMAT, ELEVENLABS_VOICE_SETTINGS, findPiper, PIPER_SENTENCE_SILENCE } from "./tts.ts";

export const MANIFEST_FILE = "narration/manifest.json";
export type Provider = "piper" | "elevenlabs";

/** Everything besides the text that changes how the audio sounds. No credentials, no raw voice id. */
export type VoiceIdentity = {
  provider: Provider | "unknown";
  /** Short fingerprint of the voice (ElevenLabs voice id, or Piper voice file name). */
  voiceKey?: string;
  model?: string;
  settings?: Record<string, string | number>;
};

export type ManifestEntry = {
  file: string; // relative to the project folder, forward slashes
  sceneId: string;
  /** sha256 of the normalised narration text; null when the text behind the audio is not known. */
  textSha256: string | null;
  /** sha256 of text + voice identity; null when the voice is not known. */
  identity: string | null;
  origin: "generated" | "legacy-stamp" | "supplied";
  voice: VoiceIdentity;
  bytes: number;
  sha256: string;
  recordedAt: string;
};
export type Manifest = { version: 1; entries: ManifestEntry[] };

/** Whitespace is not spoken: edits that only change spacing or line breaks keep the same audio. */
export const normalizeNarration = (text: string) => text.replace(/\s+/g, " ").trim();
export const textKey = (text: string) => sha256Text(normalizeNarration(text));

export const voiceIdentity = (provider: Provider, s: Settings): VoiceIdentity => {
  if (provider === "elevenlabs")
    return { provider, voiceKey: s.elevenlabs.voiceId ? sha256Text(s.elevenlabs.voiceId).slice(0, 12) : undefined, model: ELEVENLABS_MODEL, settings: { ...ELEVENLABS_VOICE_SETTINGS, output_format: ELEVENLABS_OUTPUT_FORMAT } };
  const { model } = findPiper(s);
  return { provider, voiceKey: model ? path.basename(model) : undefined, settings: { length_scale: s.piperSpeed, sentence_silence: PIPER_SENTENCE_SILENCE } };
};

const stable = (v: unknown): string =>
  v && typeof v === "object" && !Array.isArray(v)
    ? `{${Object.keys(v as object).sort().map((k) => `${JSON.stringify(k)}:${stable((v as Record<string, unknown>)[k])}`).join(",")}}`
    : JSON.stringify(v) ?? "null";

/** The cache identity of a narration clip: the same text in the same voice is the same audio. */
export const audioIdentity = (text: string, voice: VoiceIdentity) => sha256Text(stable({ text: normalizeNarration(text), voice }));

export const loadManifest = (dir: string): Manifest | null => {
  const file = path.join(dir, MANIFEST_FILE);
  if (!fs.existsSync(file)) return null;
  try {
    const m = JSON.parse(fs.readFileSync(file, "utf8"));
    if (m?.version !== 1 || !Array.isArray(m.entries)) return null;
    return m as Manifest;
  } catch { return null; } // an unreadable manifest is ignored; the stamp files still apply
};

export const saveManifest = (dir: string, m: Manifest) =>
  writeFileAtomic(path.join(dir, MANIFEST_FILE), JSON.stringify({ version: 1, entries: [...m.entries].sort((a, b) => a.file.localeCompare(b.file)) }, null, 2) + "\n");

const rel = (p: string) => p.replace(/\\/g, "/");
const stampOf = (abs: string) => { try { return fs.readFileSync(abs + ".txt", "utf8"); } catch { return null; } };

export type AudioState =
  | "no-text"        // the scene has no narration to speak
  | "no-audio"       // text, but no narration file is linked
  | "missing-file"   // a file is linked but is not on disk
  | "verified"       // manifest: these exact bytes were made from this text
  | "stamp-match"    // legacy stamp file equals the current text
  | "text-changed"   // the audio was made from different text than the scene now has
  | "modified"       // manifest: the file's bytes differ from what was recorded
  | "unverified";    // audio exists but nothing records what it says (supplied by hand)

export type SceneAudio = {
  index: number; sceneId: string; file: string | null; state: AudioState;
  bytes?: number; sha256?: string;
  /** true / false when the recorded voice is known, null when it cannot be told. */
  voiceMatches: boolean | null;
};

/** Read-only: how each scene's narration audio relates to its current text and voice. */
export const auditNarration = (project: Project, dir: string, voiceNow?: VoiceIdentity): SceneAudio[] => {
  const manifest = loadManifest(dir);
  return project.scenes.map((s, index) => {
    const base = { index, sceneId: s.id, file: s.narrationFile ?? null, voiceMatches: null as boolean | null };
    if (!s.narration.trim()) return { ...base, state: "no-text" as const };
    if (!s.narrationFile) return { ...base, state: "no-audio" as const };
    const abs = path.resolve(dir, s.narrationFile);
    if (!fs.existsSync(abs)) return { ...base, state: "missing-file" as const };
    const bytes = fs.statSync(abs).size, sha256 = sha256File(abs);
    const entry = manifest?.entries.find((e) => e.file === rel(s.narrationFile!));
    if (entry) {
      const voiceMatches = voiceNow && entry.voice.provider !== "unknown" ? stable(entry.voice) === stable(voiceNow) : null;
      if (entry.sha256 !== sha256) return { ...base, bytes, sha256, voiceMatches, state: "modified" as const };
      if (entry.textSha256 === textKey(s.narration)) return { ...base, bytes, sha256, voiceMatches, state: "verified" as const };
      if (entry.textSha256) return { ...base, bytes, sha256, voiceMatches, state: "text-changed" as const };
    }
    const stamp = stampOf(abs);
    if (stamp === null) return { ...base, bytes, sha256, state: "unverified" as const };
    return { ...base, bytes, sha256, state: normalizeNarration(stamp) === normalizeNarration(s.narration) ? "stamp-match" as const : "text-changed" as const };
  });
};

/**
 * A manifest describing the audio a project already has. Pure: reads files,
 * changes nothing. The voice of pre-existing audio cannot be proven after the
 * fact, so it is recorded as "unknown" rather than guessed from today's settings.
 */
export const describeExistingAudio = (project: Project, dir: string, now = new Date()): Manifest => {
  const prior = loadManifest(dir);
  const entries: ManifestEntry[] = [];
  for (const a of auditNarration(project, dir)) {
    if (!a.file || !a.sha256 || a.bytes === undefined) continue;
    const kept = prior?.entries.find((e) => e.file === rel(a.file!) && e.sha256 === a.sha256);
    if (kept) { entries.push(kept); continue; }
    const known = a.state === "stamp-match";
    entries.push({
      file: rel(a.file), sceneId: a.sceneId,
      textSha256: known ? textKey(project.scenes[a.index].narration) : null,
      identity: null, origin: known ? "legacy-stamp" : "supplied", voice: { provider: "unknown" },
      bytes: a.bytes, sha256: a.sha256, recordedAt: now.toISOString(),
    });
  }
  return { version: 1, entries };
};

/**
 * Existing audio that already says `text`, wherever it sits in the project.
 * Checks the manifest first, then legacy stamp files. Returns a path relative
 * to the project folder, or null.
 */
export const findReusableAudio = (dir: string, text: string, voice: VoiceIdentity, ext: string): string | null => {
  const key = textKey(text), wanted = audioIdentity(text, voice);
  const manifest = loadManifest(dir);
  const usable = (e: ManifestEntry) => e.file.toLowerCase().endsWith("." + ext) && fs.existsSync(path.resolve(dir, e.file)) && sha256File(path.resolve(dir, e.file)) === e.sha256;
  // Same text in the same voice is best; same text with an unrecorded voice is still the user's own audio.
  const exact = manifest?.entries.find((e) => e.identity === wanted && usable(e));
  if (exact) return exact.file;
  const sameText = manifest?.entries.find((e) => e.textSha256 === key && e.voice.provider === "unknown" && usable(e));
  if (sameText) return sameText.file;
  const folder = path.join(dir, "narration");
  if (!fs.existsSync(folder)) return null;
  for (const name of fs.readdirSync(folder).sort()) {
    if (!name.toLowerCase().endsWith(`.${ext}.txt`)) continue;
    const audio = path.join(folder, name.slice(0, -4));
    if (fs.existsSync(audio) && normalizeNarration(fs.readFileSync(path.join(folder, name), "utf8")) === normalizeNarration(text)) return rel(path.relative(dir, audio));
  }
  return null;
};

export const recordGenerated = (dir: string, entry: Omit<ManifestEntry, "bytes" | "sha256" | "recordedAt">, now = new Date()) => {
  const abs = path.resolve(dir, entry.file);
  const m = loadManifest(dir) ?? { version: 1 as const, entries: [] };
  const full: ManifestEntry = { ...entry, file: rel(entry.file), bytes: fs.statSync(abs).size, sha256: sha256File(abs), recordedAt: now.toISOString() };
  m.entries = [...m.entries.filter((e) => e.file !== full.file), full];
  saveManifest(dir, m);
  return full;
};
