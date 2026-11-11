import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { FormatId } from "../../../shared/catalog.ts";
import type { Cue } from "../../../shared/schema.ts";
import { mulberry32 } from "../lib/rng";
import { C, FONT_LABEL } from "../lib/theme";

const tornClip = (seed: number) => {
  const r = mulberry32(seed);
  const top: string[] = [], bottom: string[] = [];
  for (let i = 0; i <= 26; i++) {
    const x = (i / 26) * 100;
    top.push(`${x.toFixed(2)}% ${(r() * 7).toFixed(2)}%`);
    bottom.unshift(`${x.toFixed(2)}% ${(100 - r() * 7).toFixed(2)}%`);
  }
  return `polygon(${[...top, ...bottom].join(",")})`;
};

const LAYOUT: Record<FormatId, { bottom: number; size: number; maxWidth: number }> = {
  "9:16": { bottom: 400, size: 41, maxWidth: 900 }, // above the bottom 15 % platform zone
  "16:9": { bottom: 64, size: 40, maxWidth: 1300 },
  "1:1": { bottom: 56, size: 38, maxWidth: 940 },
};

/** Burned-in captions on a strip of paper stock, readable over pale and dark art. */
export const Subtitles: React.FC<{ cues: Cue[]; format: FormatId }> = ({ cues, format }) => {
  const frame = useCurrentFrame();
  const idx = cues.findIndex((c) => frame >= c.from && frame < c.to);
  const clip = useMemo(() => tornClip(idx + 5), [idx]);
  if (idx < 0) return null;
  const cue = cues[idx];
  const L = LAYOUT[format];
  const a = interpolate(frame, [cue.from, cue.from + 4, cue.to - 3, cue.to], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", bottom: L.bottom, maxWidth: L.maxWidth, padding: "24px 46px 18px", background: "rgba(250, 240, 220, 0.95)", clipPath: clip, opacity: a, boxShadow: `inset 0 0 0 2px ${C.sand}` }}>
        <span style={{ fontFamily: FONT_LABEL, fontWeight: 500, fontSize: L.size, lineHeight: 1.26, letterSpacing: "0.012em", color: C.ink, textAlign: "center", display: "block", textWrap: "balance" as never }}>
          {cue.text}
        </span>
      </div>
    </AbsoluteFill>
  );
};
