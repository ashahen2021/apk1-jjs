import React, { createContext, useContext } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import type { FormatId } from "../../../shared/catalog.ts";
import { C } from "../lib/theme";

/**
 * Scene clock. All art is authored against a 30 fps timeline:
 *   f = current frame in 30-fps units, D = scene length in 30-fps units.
 * Preset scenes (authored for exactly 300 frames) are time-remapped to fit.
 */
type Clock = { f: number; D: number; preset: boolean };
export const ClockCtx = createContext<Clock>({ f: 0, D: 300, preset: false });
export const useClock = () => {
  const c = useContext(ClockCtx);
  return { f: c.f, D: c.D, p: c.D > 0 ? c.f / c.D : 0 };
};
/** Frame hook used by the Royal Cache presets (0 → 300 over the scene). */
export const useSceneFrame = () => {
  const c = useContext(ClockCtx);
  return c.preset ? (c.f * 300) / c.D : c.f;
};

/**
 * The art is drawn on a 1080 × 1920 design stage whose action sits in the
 * middle band. Other aspect ratios look at a different window of that stage.
 */
export const STAGE_VIEW: Record<FormatId, { x: number; y: number; w: number; h: number }> = {
  "9:16": { x: 0, y: 0, w: 1080, h: 1920 },
  "1:1": { x: 0, y: 300, w: 1080, h: 1080 },
  "16:9": { x: -420, y: 300, w: 1920, h: 1080 },
};

/** Reusable per-shot wrapper: paper stock, one SVG stage, soft ink-in at the cut. */
export const AnimatedScene: React.FC<{ format: FormatId; bg?: string; children: React.ReactNode }> = ({ format, bg = C.paper, children }) => {
  const { f } = useContext(ClockCtx);
  const v = STAGE_VIEW[format];
  const inkIn = interpolate(f, [0, 8], [0.55, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <svg width="100%" height="100%" viewBox={`${v.x} ${v.y} ${v.w} ${v.h}`} preserveAspectRatio="xMidYMid slice" style={{ display: "block", opacity: inkIn }}>
        <rect x={v.x - 600} y={v.y - 600} width={v.w + 1200} height={v.h + 1200} fill={bg} />
        {children}
      </svg>
    </AbsoluteFill>
  );
};
