import type { Cue } from "./schema.ts";

export const VO_LEAD = 0.5; // seconds of picture before the voice starts
export const VO_TAIL = 0.9; // breathing room after the last word
export const DEFAULT_WPM = 135;
export const MIN_SCENE_SEC = 3;

export const wordCount = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);
export const estimateSpeechSec = (t: string, wpm = DEFAULT_WPM) => (wordCount(t) / wpm) * 60;

/** Break narration into caption lines of roughly `max` characters at natural pauses. */
export const splitLines = (text: string, max = 44): string[] => {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const phrases = clean.split(/(?<=[,;:.!?—–])\s+/);
  const lines: string[] = [];
  let cur = "";
  const push = () => { if (cur) lines.push(cur); cur = ""; };
  for (const ph of phrases) {
    if (ph.length > max) {
      push();
      // balance a long phrase over the fewest lines, so no line is left with a stub
      const words = ph.split(" ");
      const parts = Math.ceil(ph.length / max);
      const target = ph.length / parts;
      let w = "";
      for (const word of words) {
        if (w && (w.length + 1 + word.length > max || (w.length >= target && lines.length + 1 < 99))) { lines.push(w); w = word; } else w = (w + " " + word).trim();
      }
      cur = w;
    } else if ((cur + " " + ph).trim().length <= max) cur = (cur + " " + ph).trim();
    else { push(); cur = ph; }
  }
  push();
  // avoid a dangling one-word last line
  if (lines.length > 1 && lines[lines.length - 1].split(" ").length === 1 && (lines[lines.length - 2] + " " + lines[lines.length - 1]).length <= max + 12) {
    const last = lines.pop() as string;
    lines[lines.length - 1] += " " + last;
  }
  return lines;
};

/** Scene length in seconds from its narration length (or the manual value). */
export const sceneSeconds = (narrationSec: number, manual?: number) =>
  manual ?? Math.max(MIN_SCENE_SEC, VO_LEAD + narrationSec + VO_TAIL);

/** Subtitle cues in frames, spread over the spoken span in proportion to line length. */
export const buildCues = (text: string, narrationSec: number, fps: number, durationInFrames: number): Cue[] => {
  const lines = splitLines(text);
  if (!lines.length || narrationSec <= 0) return [];
  const total = lines.reduce((a, l) => a + l.length, 0);
  let acc = 0;
  return lines.map((line, i) => {
    const t0 = VO_LEAD + (acc / total) * narrationSec;
    acc += line.length;
    const t1 = i === lines.length - 1 ? VO_LEAD + narrationSec + 0.35 : VO_LEAD + (acc / total) * narrationSec;
    return { from: Math.max(0, Math.round(t0 * fps) - 2), to: Math.min(durationInFrames - 2, Math.round(t1 * fps) - 2), text: line };
  });
};

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "project";
