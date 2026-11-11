import fs from "node:fs";
import path from "node:path";
import type { Cue, Project, Scene } from "../shared/schema.ts";
import { buildCues, estimateSpeechSec, sceneSeconds } from "../shared/timing.ts";
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
    const sec = sceneSeconds(narrationSec, scene.durationSec);
    if (scene.durationSec && narrationSec + 0.6 > scene.durationSec) warnings.push(`Scene ${i + 1}: narration (${narrationSec.toFixed(1)} s) is longer than the manual duration (${scene.durationSec} s).`);
    const durationInFrames = Math.max(1, Math.round(sec * project.fps));
    scenes.push({ index: i, scene, startFrame: start, durationInFrames, narrationSec, narrationPath, estimated, cues: buildCues(scene.narration, narrationSec, project.fps, durationInFrames) });
    start += durationInFrames;
  }
  const seconds = start / project.fps;
  if (seconds < 60 || seconds > 180) warnings.push(`Film length is ${seconds.toFixed(1)} s; the studio is tuned for 60–180 s documentaries.`);
  return { scenes, totalFrames: start, seconds, warnings };
};
