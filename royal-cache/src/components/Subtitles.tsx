import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import cueData from "../data/cues.json";
import { C, FONT_LABEL } from "../lib/theme";
import { mulberry32 } from "../lib/rng";

type Cue = { scene: number; start: number; end: number; text: string; showFrom: number; showTo: number };
const cues = cueData.cues as Cue[];

/** Torn-paper edge for the caption strip. */
const tornClip = (seed: number) => {
  const r = mulberry32(seed);
  const top: string[] = [];
  const bottom: string[] = [];
  const n = 26;
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * 100;
    top.push(`${x.toFixed(2)}% ${(r() * 7).toFixed(2)}%`);
    bottom.unshift(`${x.toFixed(2)}% ${(100 - r() * 7).toFixed(2)}%`);
  }
  return `polygon(${[...top, ...bottom].join(",")})`;
};

/**
 * Burned-in subtitles built from the authoritative script and the cue
 * timings in src/data/cues.json. They sit in the lower-middle safe region
 * (above the bottom 15 % platform zone) on a strip of paper stock, so they
 * stay readable over both pale and dark scenes.
 */
export const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const idx = cues.findIndex((c) => t >= c.showFrom && t < c.showTo);
  const clip = useMemo(() => tornClip(idx + 5), [idx]);
  if (idx < 0) return null;
  const cue = cues[idx];
  const a = interpolate(t, [cue.showFrom, cue.showFrom + 0.12, cue.showTo - 0.1, cue.showTo], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          top: 1418,
          minHeight: 96,
          maxWidth: 900,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 46px 18px",
          background: "rgba(250, 240, 220, 0.95)",
          clipPath: clip,
          opacity: a,
          transform: `translateY(${((1 - a) * 6).toFixed(2)}px)`,
          boxShadow: `inset 0 0 0 2px ${C.sand}`,
        }}
      >
        <span
          style={{
            fontFamily: FONT_LABEL,
            fontWeight: 500,
            fontSize: 41,
            lineHeight: 1.26,
            letterSpacing: "0.012em",
            color: C.ink,
            textAlign: "center",
            textWrap: "balance" as never,
          }}
        >
          {cue.text}
        </span>
      </div>
    </AbsoluteFill>
  );
};
