import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

/** The print pass over every scene: ink wear, dark speckle, multiplied paper grain. */
export const PrintOverlay: React.FC<{ seed?: number }> = ({ seed = 0 }) => {
  const flipX = seed % 2 ? -1 : 1;
  const flipY = seed % 4 >= 2 ? -1 : 1;
  const full: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" };
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Img src={staticFile("textures/distress.png")} style={{ ...full, opacity: 0.6, transform: `scale(${flipX}, ${flipY})` }} />
      <Img src={staticFile("textures/speckle.png")} style={{ ...full, opacity: 0.5, transform: `scale(${-flipX}, ${flipY})` }} />
      <Img src={staticFile("textures/grain.png")} style={{ ...full, mixBlendMode: "multiply", transform: "scale(1.03)" }} />
    </AbsoluteFill>
  );
};
