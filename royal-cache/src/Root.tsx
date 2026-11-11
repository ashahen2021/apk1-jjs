import React from "react";
import { Composition } from "remotion";
import { defaultFilmProps, RoyalCacheFilm } from "./RoyalCacheFilm";
import { FPS, H, TOTAL_FRAMES, W } from "./lib/theme";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="RoyalCacheFilm"
    component={RoyalCacheFilm}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={W}
    height={H}
    defaultProps={defaultFilmProps}
  />
);
