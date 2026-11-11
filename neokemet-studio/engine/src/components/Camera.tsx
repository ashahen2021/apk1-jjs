import React, { createContext, useContext } from "react";
import { H, W } from "../lib/theme";

type Cam = { x: number; y: number; zoom: number; cx: number; cy: number };
const CamCtx = createContext<Cam>({ x: 0, y: 0, zoom: 1, cx: W / 2, cy: H / 2 });

/**
 * Procedural 2.5-D camera. The camera never moves pixels itself: each <Layer>
 * reads it and applies pan / zoom scaled by its depth, which yields multiplane
 * parallax (depth 0 = infinitely far, 1 = subject plane, >1 = foreground).
 */
export const Camera: React.FC<{
  x?: number;
  y?: number;
  zoom?: number;
  cx?: number;
  cy?: number;
  children: React.ReactNode;
}> = ({ x = 0, y = 0, zoom = 1, cx = W / 2, cy = H / 2, children }) => (
  <CamCtx.Provider value={{ x, y, zoom, cx, cy }}>{children}</CamCtx.Provider>
);

export const Layer: React.FC<{
  depth?: number;
  opacity?: number;
  children: React.ReactNode;
}> = ({ depth = 1, opacity, children }) => {
  const c = useContext(CamCtx);
  const s = 1 + (c.zoom - 1) * depth;
  return (
    <g
      opacity={opacity}
      transform={`translate(${c.cx} ${c.cy}) scale(${s.toFixed(5)}) translate(${(-c.cx - c.x * depth).toFixed(2)} ${(-c.cy - c.y * depth).toFixed(2)})`}
    >
      {children}
    </g>
  );
};
