import React from "react";
import { Composition } from "remotion";
import { FORMATS } from "../../shared/catalog.ts";
import type { SceneRenderProps } from "../../shared/schema.ts";
import { StudioScene } from "./StudioScene";

const defaults: SceneRenderProps = {
  scene: { id: "sample", template: "title", narration: "", environment: "giza-pyramids", label: "NeoKemetAI Animation Studio", sublabel: "Local documentary generator", ambience: "auto" },
  format: "9:16",
  fps: 30,
  durationInFrames: 150,
  cues: [],
  subtitles: true,
};

/** One composition: size, rate and length all come from the props the studio passes in. */
export const RemotionRoot: React.FC = () => (
  <Composition
    id="StudioScene"
    component={StudioScene}
    durationInFrames={150}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={defaults}
    calculateMetadata={({ props }) => ({
      durationInFrames: Math.max(1, Math.round(props.durationInFrames)),
      fps: props.fps,
      width: FORMATS[props.format].width,
      height: FORMATS[props.format].height,
    })}
  />
);
