import fs from "node:fs";
import path from "node:path";
import type { Project } from "../shared/schema.ts";
import { loadSettings } from "./paths.ts";
import { elevenLabsSynthesize, piperSynthesize } from "./tts.ts";

/**
 * Generate narration for every scene that has text (or one scene). Files are
 * written to <project>/narration/ and referenced from the project.
 */
export const narrateProject = async (project: Project, dir: string, provider: "piper" | "elevenlabs", opts: { only?: number; force?: boolean; onProgress?: (m: string, pct: number) => void } = {}) => {
  const settings = loadSettings();
  let made = 0;
  const todo = project.scenes.map((s, i) => ({ s, i })).filter(({ s, i }) => s.narration.trim() && (opts.only === undefined || opts.only === i));
  for (const [n, { s, i }] of todo.entries()) {
    const ext = provider === "piper" ? "wav" : "mp3";
    const rel = `narration/${String(i + 1).padStart(2, "0")}-${s.id}.${ext}`;
    const abs = path.join(dir, rel);
    const stamp = abs + ".txt"; // the text this file was spoken from
    const fresh = fs.existsSync(abs) && fs.existsSync(stamp) && fs.readFileSync(stamp, "utf8") === s.narration;
    opts.onProgress?.(`Narrating scene ${i + 1}…`, Math.round((n / todo.length) * 100));
    if (!fresh || opts.force) {
      if (provider === "piper") await piperSynthesize(s.narration, abs, settings);
      else await elevenLabsSynthesize(s.narration, abs, settings);
      fs.writeFileSync(stamp, s.narration);
      made++;
    }
    s.narrationFile = rel;
  }
  return { made, total: todo.length };
};
