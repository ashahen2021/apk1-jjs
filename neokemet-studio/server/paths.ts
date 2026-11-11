import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const ENGINE_DIR = path.join(ROOT, "engine");
export const ENGINE_ENTRY = path.join(ENGINE_DIR, "src", "index.ts");
export const PUBLIC_DIR = path.join(ENGINE_DIR, "public");
export const PROJECTS_DIR = path.join(ROOT, "projects");
export const UI_DIR = path.join(ROOT, "ui");
export const TOOLS_DIR = path.join(ROOT, "tools");
/** Everything generated at run time lives here and is never committed. */
export const WORKSPACE = path.join(ROOT, "workspace");
export const CACHE_DIR = path.join(WORKSPACE, "cache");
export const OUTPUT_DIR = path.join(WORKSPACE, "output");
export const SETTINGS_FILE = path.join(WORKSPACE, "settings.json");

export const ensureDir = (d: string) => { fs.mkdirSync(d, { recursive: true }); return d; };

export type Settings = {
  ollamaUrl: string;
  ollamaModel: string;
  piperPath: string; // empty = auto-detect in tools/piper
  piperModel: string; // empty = first voice in tools/voices
  piperSpeed: number; // length scale: > 1 is slower
  renderConcurrency: number; // 0 = automatic
  elevenlabs: { enabled: boolean; voiceId: string; apiKey: string };
};
export const DEFAULT_SETTINGS: Settings = {
  ollamaUrl: "http://127.0.0.1:11434",
  ollamaModel: "llama3.1",
  piperPath: "",
  piperModel: "",
  piperSpeed: 1.12,
  renderConcurrency: 0,
  elevenlabs: { enabled: false, voiceId: "", apiKey: "" },
};
export const loadSettings = (): Settings => {
  try {
    const s = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
    return { ...DEFAULT_SETTINGS, ...s, elevenlabs: { ...DEFAULT_SETTINGS.elevenlabs, ...(s.elevenlabs ?? {}) } };
  } catch {
    return DEFAULT_SETTINGS;
  }
};
export const saveSettings = (s: Settings) => { ensureDir(WORKSPACE); fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2)); };
