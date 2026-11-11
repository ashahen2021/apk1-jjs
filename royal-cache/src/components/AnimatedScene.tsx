import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, H, LEAD, W } from "../lib/theme";

/**
 * Local scene frame: 0 is the scene's stated timestamp. Scenes are mounted
 * LEAD frames early (negative values) so they can dissolve over the cut.
 */
export const useSceneFrame = () => useCurrentFrame() - LEAD;

/**
 * One reusable wrapper per shot: paper stock, a single 1080×1920 SVG stage
 * and the cross-dissolve that is centred on the scene's timestamp.
 */
export const AnimatedScene: React.FC<{
  index: number;
  bg?: string;
  children: React.ReactNode;
}> = ({ index, bg = C.paper, children }) => {
  const f = useCurrentFrame();
  const opacity =
    index === 0
      ? 1
      : interpolate(f, [0, LEAD * 2], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  return (
    <AbsoluteFill style={{ opacity }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <rect width={W} height={H} fill={bg} />
        {children}
      </svg>
    </AbsoluteFill>
  );
};
