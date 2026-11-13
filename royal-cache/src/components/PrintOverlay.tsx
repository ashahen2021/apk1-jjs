import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { SCENE_FRAMES } from "../lib/theme";

/**
 * The print pass that sits over every scene: ivory dry-brush wear that
 * knocks holes in the ink, sparse dark speckle, and multiplied paper grain.
 * The wear pattern is mirrored per scene so no two shots share the same plate.
 */
export const PrintOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = Math.floor(frame / SCENE_FRAMES);
  const flipX = scene % 2 ? -1 : 1;
  const flipY = scene % 4 >= 2 ? -1 : 1;
  // very slow grain drift in the closing shot
  const drift = scene === 17 ? (frame - 17 * SCENE_FRAMES) / SCENE_FRAMES : 0;
  const full: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%" };
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Img src={staticFile("textures/distress.png")} style={{ ...full, opacity: 0.6, transform: `scale(${flipX}, ${flipY})` }} />
      <Img src={staticFile("textures/speckle.png")} style={{ ...full, opacity: 0.5, transform: `scale(${-flipX}, ${flipY})` }} />
      <Img
        src={staticFile("textures/grain.png")}
        style={{ ...full, mixBlendMode: "multiply", transform: `scale(1.03) translate(${(drift * 10).toFixed(2)}px, ${(-drift * 14).toFixed(2)}px)` }}
      />
    </AbsoluteFill>
  );
};
