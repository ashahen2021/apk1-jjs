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

/** The least silence that must remain after the last word inside its own scene. */
export const MIN_VO_TAIL = 0.1;

export type SceneLength = {
  seconds: number;
  /** True when a manual duration was too short for recorded narration and was lengthened. */
  extended: boolean;
  /** True when the narration (measured or estimated) does not fit the manual duration. */
  tooShort: boolean;
};

/**
 * Scene length that can never cut recorded narration short.
 *
 * A manual duration is honoured exactly whenever the voice ends inside the scene
 * (lead + speech + MIN_VO_TAIL). When recorded audio would run past the end, the
 * scene is lengthened to the natural narration-following length instead of
 * truncating the voice or letting it spill into the next scene. An estimate is
 * not audio, so an estimated narration never changes a manual duration.
 */
export const safeSceneSeconds = (narrationSec: number, manual: number | undefined, measured: boolean): SceneLength => {
  const natural = sceneSeconds(narrationSec);
  if (manual === undefined) return { seconds: natural, extended: false, tooShort: false };
  const tooShort = narrationSec > 0 && VO_LEAD + narrationSec + MIN_VO_TAIL > manual;
  if (tooShort && measured) return { seconds: natural, extended: true, tooShort: true };
  return { seconds: manual, extended: false, tooShort };
};

/** Problems with a scene's cues, as readable messages (empty = every cue is displayable). */
export const cueProblems = (cues: Cue[], durationInFrames: number): string[] => {
  const out: string[] = [];
  cues.forEach((c, i) => {
    const n = i + 1;
    if (!Number.isFinite(c.from) || !Number.isFinite(c.to) || !Number.isInteger(c.from) || !Number.isInteger(c.to)) out.push(`cue ${n}: timing is not a whole frame number`);
    else if (c.from < 0) out.push(`cue ${n}: starts before the scene (frame ${c.from})`);
    else if (c.to > durationInFrames) out.push(`cue ${n}: ends after the scene (frame ${c.to} of ${durationInFrames})`);
    else if (c.to <= c.from) out.push(`cue ${n}: has no length (frames ${c.from}–${c.to})`);
    else if (i > 0 && c.from < cues[i - 1].to) out.push(`cue ${n}: overlaps the previous cue`);
    if (!c.text.trim()) out.push(`cue ${n}: has no text`);
  });
  return out;
};

/** Lay lines out over [first, last] frames in proportion to their length, at least one frame each. */
const spreadCues = (lines: string[], first: number, last: number): Cue[] => {
  const span = last - first;
  const total = lines.reduce((a, l) => a + l.length, 0);
  let acc = 0, prev = first;
  return lines.map((line, i) => {
    acc += line.length;
    const from = prev;
    const ideal = i === lines.length - 1 ? last : first + Math.round((acc / total) * span);
    // leave at least one frame for this cue and one for every cue still to come
    const to = Math.max(from + 1, Math.min(ideal, last - (lines.length - 1 - i)));
    prev = to;
    return { from, to, text: line };
  });
};

/**
 * Subtitle cues in frames, spread over the spoken span in proportion to line length.
 *
 * The result is always displayable: every cue lies inside the scene, has a
 * length of at least one frame, and does not overlap its neighbours. When the
 * usual layout cannot satisfy that (the spoken span is longer than the scene, or
 * too short for the number of lines), the lines are re-spread over the room that
 * is available rather than emitted with reversed or empty timings.
 */
export const buildCues = (text: string, narrationSec: number, fps: number, durationInFrames: number): Cue[] => {
  const lines = splitLines(text);
  if (!lines.length || !(narrationSec > 0) || !(durationInFrames > 0)) return [];
  const total = lines.reduce((a, l) => a + l.length, 0);
  let acc = 0;
  const cues = lines.map((line, i) => {
    const t0 = VO_LEAD + (acc / total) * narrationSec;
    acc += line.length;
    const t1 = i === lines.length - 1 ? VO_LEAD + narrationSec + 0.35 : VO_LEAD + (acc / total) * narrationSec;
    return { from: Math.max(0, Math.round(t0 * fps) - 2), to: Math.min(durationInFrames - 2, Math.round(t1 * fps) - 2), text: line };
  });
  if (!cueProblems(cues, durationInFrames).length) return cues;
  // Safe fallback: keep the lead-in when there is room for it, then share out what is left.
  const last = Math.max(1, durationInFrames - 2);
  const lead = Math.max(0, Math.round(VO_LEAD * fps) - 2);
  const first = last - lead >= lines.length ? lead : 0;
  if (last - first >= lines.length) return spreadCues(lines, first, last);
  // Fewer frames than lines: one cue carrying the whole text is the only honest option.
  return [{ from: 0, to: Math.max(1, durationInFrames), text: lines.join(" ") }];
};

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "project";
