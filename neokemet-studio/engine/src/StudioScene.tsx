import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { SceneRenderProps } from "../../shared/schema.ts";
import { AnimatedScene, ClockCtx } from "./components/AnimatedScene";
import { PrintOverlay } from "./components/PrintOverlay";
import { Subtitles } from "./components/Subtitles";
import { ensureFonts } from "./lib/fonts";
import { C } from "./lib/theme";
import { seedOf } from "./templates/common";
import { resolveTemplate } from "./templates";

ensureFonts();

/** Renders exactly one scene. Used for previews, per-scene renders and the film. */
export const StudioScene: React.FC<SceneRenderProps> = ({ scene, format, fps, durationInFrames, cues, subtitles }) => {
  const frame = useCurrentFrame();
  const entry = resolveTemplate(scene.template);
  const seed = seedOf(scene.id);
  const clock = { f: (frame * 30) / fps, D: (durationInFrames * 30) / fps, preset: !!entry.preset };
  return (
    <AbsoluteFill style={{ backgroundColor: entry.bg ?? C.paper }}>
      <ClockCtx.Provider value={clock}>
        <AnimatedScene format={format} bg={entry.bg}>
          {React.createElement(entry.Component as React.FC<{ scene: typeof scene; seed: number }>, { scene, seed })}
        </AnimatedScene>
      </ClockCtx.Provider>
      <PrintOverlay seed={seed} />
      {subtitles && <Subtitles cues={cues} format={format} />}
    </AbsoluteFill>
  );
};
