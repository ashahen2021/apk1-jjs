import React, { useMemo } from "react";
import { C, H, W } from "../lib/theme";
import { ellipsePts, mulberry32, Pt, rectPts, roughPath } from "../lib/rng";

type Paint = { fill?: string; opacity?: number; stroke?: string; strokeWidth?: number };

/** Polygon with a rough, relief-printed edge. */
export const RPoly: React.FC<
  Paint & { pts: Pt[]; seed?: number; amp?: number; step?: number }
> = ({ pts, seed = 1, amp = 2.2, step = 16, fill = C.gold, ...rest }) => {
  const d = useMemo(() => roughPath(pts, seed, amp, step), [JSON.stringify(pts), seed, amp, step]);
  return <path d={d} fill={fill} {...rest} />;
};

export const RRect: React.FC<
  Paint & { x: number; y: number; w: number; h: number; seed?: number; amp?: number; step?: number }
> = ({ x, y, w, h, ...rest }) => <RPoly pts={rectPts(x, y, w, h)} {...rest} />;

export const REllipse: React.FC<
  Paint & { cx: number; cy: number; rx: number; ry?: number; seed?: number; amp?: number; n?: number }
> = ({ cx, cy, rx, ry = rx, n = 22, amp = 1.6, ...rest }) => (
  <RPoly pts={ellipsePts(cx, cy, rx, ry, n)} amp={amp} step={400} {...rest} />
);

/** Dry-brush horizontal strokes (the brick / strata texture of the reference). */
export const Streaks: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  seed?: number;
  count?: number;
  color?: string;
  opacity?: number;
  maxLen?: number;
  thick?: number;
}> = ({ x, y, w, h, seed = 1, count = 60, color = C.sand, opacity = 0.7, maxLen = 120, thick = 4 }) => {
  const d = useMemo(() => {
    const r = mulberry32(seed * 131 + 7);
    let s = "";
    for (let i = 0; i < count; i++) {
      const len = 10 + r() * r() * maxLen;
      const sx = x + r() * (w - len * 0.5);
      const sy = y + r() * h;
      const t = 1 + r() * thick;
      const k = (r() - 0.5) * 2;
      s += `M${sx.toFixed(1)} ${sy.toFixed(1)}l${(len * 0.3).toFixed(1)} ${(k - 0.6).toFixed(1)}l${(len * 0.7).toFixed(1)} ${(0.6 - k).toFixed(1)}l${(-len * 0.4).toFixed(1)} ${t.toFixed(1)}l${(-len * 0.6).toFixed(1)} ${(-0.4).toFixed(1)}Z`;
    }
    return s;
  }, [x, y, w, h, seed, count, maxLen, thick]);
  return <path d={d} fill={color} opacity={opacity} />;
};

/** Stippled dots, denser toward the bottom of the box when `fall` is set. */
export const Stipple: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  seed?: number;
  count?: number;
  color?: string;
  opacity?: number;
  size?: number;
  fall?: boolean;
}> = ({ x, y, w, h, seed = 1, count = 200, color = C.earth, opacity = 0.5, size = 2.2, fall }) => {
  const d = useMemo(() => {
    const r = mulberry32(seed * 977 + 3);
    let s = "";
    for (let i = 0; i < count; i++) {
      const px = x + r() * w;
      const py = y + (fall ? Math.sqrt(r()) : r()) * h;
      const q = 0.6 + r() * size;
      s += `M${px.toFixed(1)} ${py.toFixed(1)}h${q.toFixed(1)}v${(q * 0.8).toFixed(1)}h${(-q).toFixed(1)}Z`;
    }
    return s;
  }, [x, y, w, h, seed, count, size, fall]);
  return <path d={d} fill={color} opacity={opacity} />;
};

/** Sandy ground in the manner of the reference: paper with stroked sand bands. */
export const Ground: React.FC<{
  y: number;
  seed?: number;
  color?: string;
  h?: number;
  x?: number;
  w?: number;
  dense?: number;
}> = ({ y, seed = 1, color = C.sand, h = 520, x = -200, w = W + 400, dense = 1 }) => (
  <g>
    <Streaks x={x} y={y - 6} w={w} h={26} seed={seed} count={Math.round(70 * dense)} color={color} opacity={0.85} maxLen={260} thick={7} />
    <Streaks x={x} y={y + 14} w={w} h={h * 0.35} seed={seed + 1} count={Math.round(90 * dense)} color={color} opacity={0.55} maxLen={200} thick={5} />
    <Streaks x={x} y={y + h * 0.3} w={w} h={h * 0.7} seed={seed + 2} count={Math.round(70 * dense)} color={color} opacity={0.38} maxLen={160} thick={4} />
    <Stipple x={x} y={y} w={w} h={h} seed={seed + 3} count={Math.round(260 * dense)} color={C.gold} opacity={0.35} />
  </g>
);

/** Small label type set on the print (SVG text). */
export const Label: React.FC<{
  x: number;
  y: number;
  text: string;
  size?: number;
  opacity?: number;
  color?: string;
  spacing?: number;
  anchor?: "start" | "middle" | "end";
  weight?: number;
  family?: string;
}> = ({ x, y, text, size = 30, opacity = 1, color = C.ink, spacing = 0.3, anchor = "middle", weight = 500, family = "Josefin Sans" }) => (
  <text
    x={x}
    y={y}
    fontFamily={family}
    fontSize={size}
    fontWeight={weight}
    fill={color}
    opacity={opacity}
    textAnchor={anchor}
    letterSpacing={`${spacing}em`}
    style={{ fontKerning: "normal" }}
  >
    {text}
  </text>
);

/** Thin double rule used with titles. */
export const Rule: React.FC<{ x: number; y: number; w: number; opacity?: number; color?: string; t?: number }> = ({ x, y, w, opacity = 1, color = C.ink, t = 1 }) => (
  <g opacity={opacity}>
    <rect x={x - (w * t) / 2} y={y} width={w * t} height={2} fill={color} />
    <rect x={x - 5} y={y - 4} width={10} height={10} fill={color} transform={`rotate(45 ${x} ${y + 1})`} />
  </g>
);

export const FullBleed: React.FC<{ fill: string; opacity?: number }> = ({ fill, opacity }) => (
  <rect x={-400} y={-400} width={W + 800} height={H + 800} fill={fill} opacity={opacity} />
);
