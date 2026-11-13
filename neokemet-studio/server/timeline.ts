import fs from "node:fs";
import path from "node:path";
import type { Cue, Project, Scene } from "../shared/schema.ts";
import { buildCues, cueProblems, estimateSpeechSec, MIN_VO_TAIL, safeSceneSeconds, VO_LEAD } from "../shared/timing.ts";
import { decodeAudio, speechSpan } from "./audio.ts";

export type TimelineScene = {
  index: number;
  scene: Scene;
  startFrame: number;
  durationInFrames: number;
  narrationSec: number;
  narrationPath: string | null;
  estimated: boolean; // true when no audio exists and the length is a wpm estimate
  cues: Cue[];
};
export type Timeline = { scenes: TimelineScene[]; totalFrames: number; seconds: number; warnings: string[] };

/**
 * Turns a project into exact frame timings. Scene length follows the measured
 * narration (lead + speech + tail) unless a manual duration is set, so picture
 * and voice stay in sync without hand-timing anything.
 */
export const resolveTimeline = async (project: Project, projectDir: string): Promise<Timeline> => {
  const warnings: string[] = [];
  const scenes: TimelineScene[] = [];
  let start = 0;
  for (let i = 0; i < project.scenes.length; i++) {
    const scene = project.scenes[i];
    let narrationPath: string | null = null;
    let narrationSec = 0;
    let estimated = true;
    if (scene.narrationFile) {
      const p = path.resolve(projectDir, scene.narrationFile);
      if (fs.existsSync(p)) {
        const span = speechSpan(await decodeAudio(p));
        narrationPath = p;
        narrationSec = Math.max(0, span.end - span.start);
        estimated = false;
      } else warnings.push(`Scene ${i + 1}: narration file "${scene.narrationFile}" is missing — using an estimate.`);
    }
    if (estimated) narrationSec = estimateSpeechSec(scene.narration);
    const length = safeSceneSeconds(narrationSec, scene.durationSec, !estimated);
    const sec = length.seconds;
    if (length.extended)
      warnings.push(`Scene ${i + 1}: the manual duration (${scene.durationSec} s) is too short for the recorded narration (${narrationSec.toFixed(1)} s). The scene was lengthened to ${sec.toFixed(1)} s so the voice is not cut off. Clear the manual duration, or set it to at least ${(VO_LEAD + narrationSec + MIN_VO_TAIL).toFixed(1)} s.`);
    else if (length.tooShort)
      warnings.push(`Scene ${i + 1}: the estimated narration (${narrationSec.toFixed(1)} s) does not fit the manual duration (${scene.durationSec} s). Subtitles were compressed to fit; once audio is recorded the scene will be lengthened automatically.`);
    else if (scene.durationSec && narrationSec + 0.6 > scene.durationSec) warnings.push(`Scene ${i + 1}: narration (${narrationSec.toFixed(1)} s) is longer than the manual duration (${scene.durationSec} s).`);
    const durationInFrames = Math.max(1, Math.round(sec * project.fps));
    let cues = buildCues(scene.narration, narrationSec, project.fps, durationInFrames);
    // buildCues guarantees displayable cues; this is the last line of defence before rendering.
    const bad = cueProblems(cues, durationInFrames);
    if (bad.length) {
      warnings.push(`Scene ${i + 1}: subtitles were left out because their timing could not be resolved (${bad[0]}).`);
      cues = [];
    }
    scenes.push({ index: i, scene, startFrame: start, durationInFrames, narrationSec, narrationPath, estimated, cues });
    start += durationInFrames;
  }
  const seconds = start / project.fps;
  if (seconds < 20) warnings.push(`Film length is only ${seconds.toFixed(1)} s.`);
  return { scenes, totalFrames: start, seconds, warnings };
};
