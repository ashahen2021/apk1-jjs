import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { SceneRenderProps } from "../../shared/schema.ts";
import { AnimatedScene, ClockCtx } from "./components/AnimatedScene";
import { PrintOverlay } from "./components/PrintOverlay";
import { Shorts15CaptionsV3 } from "./components/Shorts15CaptionsV3";
import { Shorts15Captions } from "./components/Shorts15Captions";
import { Subtitles } from "./components/Subtitles";
import { ensureFonts } from "./lib/fonts";
import { C } from "./lib/theme";
import { getSceneBackground, getSceneLightingMode } from "./theme/tombPaintingFlat";
import { seedOf } from "./templates/common";
import { resolveTemplate } from "./templates";

ensureFonts();

/** Renders exactly one scene. Used for previews, per-scene renders and the film. */
export const StudioScene: React.FC<SceneRenderProps> = ({ scene, format, fps, durationInFrames, cues, wordCues = [], subtitles }) => {
  const frame = useCurrentFrame();
  const entry = resolveTemplate(scene.template);
  const shorts15 = scene.template.startsWith("shorts15-");
  const v1TopicShort = scene.template === "v1-topic-short";
  const shorts15V3 = scene.template.startsWith("shorts15-v3-");
  const seed = seedOf(scene.id);
  const captionActive = !!(subtitles && v1TopicShort && wordCues.some(c=>frame>=c.from&&frame<c.to));
  const v1Background = v1TopicShort ? getSceneBackground(getSceneLightingMode(scene)) : (entry.bg ?? C.paper);
  const clock = { f: (frame * 30) / fps, D: (durationInFrames * 30) / fps, preset: !!entry.preset };
  return (
    <AbsoluteFill style={{ backgroundColor: v1Background }}>
      <ClockCtx.Provider value={clock}>
        <AnimatedScene format={format} bg={v1Background}>
          {React.createElement(entry.Component as React.FC<{ scene: typeof scene; seed: number }>, { scene, seed, captionActive })}
        </AnimatedScene>
      </ClockCtx.Provider>
      {!v1TopicShort && <PrintOverlay seed={seed} soft={shorts15} />}
      {subtitles && (shorts15V3 ? <Shorts15CaptionsV3 cues={cues} format={format} /> : (shorts15 || v1TopicShort) ? <Shorts15Captions cues={cues} wordCues={wordCues} format={format} /> : <Subtitles cues={cues} format={format} />)}
    </AbsoluteFill>
  );
};
