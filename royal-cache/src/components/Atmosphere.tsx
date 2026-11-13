import React from "react";
import { C, H, W } from "../lib/theme";
import { hash, noise1 } from "../lib/rng";

/** Wind-blown sand: short strokes drifting horizontally in a band. */
export const SandDrift: React.FC<{
  f: number;
  y: number;
  h: number;
  count?: number;
  seed?: number;
  speed?: number;
  color?: string;
  opacity?: number;
}> = ({ f, y, h, count = 40, seed = 1, speed = 1, color = C.gold, opacity = 0.55 }) => {
  const span = W + 300;
  return (
    <g opacity={opacity}>
      {Array.from({ length: count }, (_, i) => {
        const v = (1.4 + hash(i, seed) * 3.2) * speed;
        const x = ((hash(i, seed + 1) * span + f * v) % span) - 150;
        const py = y + hash(i, seed + 2) * h + Math.sin(f * 0.03 + i) * 6;
        const len = 8 + hash(i, seed + 3) * 34;
        const life = 0.35 + 0.65 * Math.abs(Math.sin(f * 0.02 + hash(i, seed + 4) * 6.28));
        return <rect key={i} x={x} y={py} width={len} height={1.6 + hash(i, seed + 5) * 1.8} fill={color} opacity={life} />;
      })}
    </g>
  );
};

/** Dust motes hanging in still air (interiors, torchlight). */
export const Dust: React.FC<{
  f: number;
  x: number;
  y: number;
  w: number;
  h: number;
  count?: number;
  seed?: number;
  color?: string;
  opacity?: number;
}> = ({ f, x, y, w, h, count = 40, seed = 1, color = C.sand, opacity = 0.6 }) => (
  <g opacity={opacity}>
    {Array.from({ length: count }, (_, i) => {
      const px = x + hash(i, seed) * w + noise1(f * 0.012 + i * 3.1, seed) * 26;
      const py = y + ((hash(i, seed + 1) * h - f * (0.1 + hash(i, seed + 2) * 0.22) + h * 10) % h);
      const r = 1.2 + hash(i, seed + 3) * 2.4;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(f * 0.03 + i * 1.7));
      return <rect key={i} x={px} y={py} width={r} height={r} fill={color} opacity={tw} />;
    })}
  </g>
);

/** Tiny birds: two-stroke silhouettes with a slow wing beat. */
export const Birds: React.FC<{
  f: number;
  x: number;
  y: number;
  count?: number;
  seed?: number;
  speed?: number;
  scale?: number;
  color?: string;
  spread?: number;
}> = ({ f, x, y, count = 3, seed = 1, speed = 0.6, scale = 1, color = C.shadow, spread = 120 }) => (
  <g>
    {Array.from({ length: count }, (_, i) => {
      const bx = x + f * speed * (0.85 + hash(i, seed) * 0.3) + (hash(i, seed + 1) - 0.5) * spread * 2;
      const by = y + (hash(i, seed + 2) - 0.5) * spread * 0.7 + Math.sin(f * 0.035 + i * 2) * 7;
      const flap = Math.sin(f * 0.22 + i * 1.9) * 5 * scale;
      const s = (10 + hash(i, seed + 3) * 5) * scale;
      return (
        <path
          key={i}
          d={`M${bx - s} ${by - flap}Q${bx - s * 0.45} ${by - 4 * scale - flap * 0.2} ${bx} ${by}Q${bx + s * 0.45} ${by - 4 * scale - flap * 0.2} ${bx + s} ${by - flap}`}
          stroke={color}
          strokeWidth={2.6 * scale}
          fill="none"
          strokeLinecap="round"
        />
      );
    })}
  </g>
);

/** Warm light pool (torch, lantern, shaft light) with a seeded flicker. */
export const Glow: React.FC<{
  id: string;
  x: number;
  y: number;
  r: number;
  f: number;
  strength?: number;
  color?: string;
}> = ({ id, x, y, r, f, strength = 0.75, color = "#F3C877" }) => {
  const fl = 1 + noise1(f * 0.35, 7) * 0.06 + noise1(f * 0.9, 9) * 0.03;
  return (
    <g>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={color} stopOpacity={strength} />
          <stop offset="0.45" stopColor={color} stopOpacity={strength * 0.38} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r * fl} fill={`url(#${id})`} />
    </g>
  );
};

/** Small flame used on torches and lanterns. */
export const Flame: React.FC<{ x: number; y: number; f: number; s?: number }> = ({ x, y, f, s = 1 }) => {
  const sw = noise1(f * 0.4, 3) * 3 * s;
  const hgt = (16 + noise1(f * 0.6, 5) * 3) * s;
  return (
    <g>
      <path d={`M${x - 5 * s} ${y}Q${x - 7 * s + sw} ${y - hgt * 0.5} ${x + sw} ${y - hgt}Q${x + 7 * s + sw * 0.4} ${y - hgt * 0.45} ${x + 5 * s} ${y}Z`} fill={C.terra} />
      <path d={`M${x - 2.5 * s} ${y}Q${x - 3 * s + sw * 0.5} ${y - hgt * 0.35} ${x + sw * 0.5} ${y - hgt * 0.62}Q${x + 3 * s} ${y - hgt * 0.3} ${x + 2.5 * s} ${y}Z`} fill="#F6D58C" />
    </g>
  );
};

/** Cream haze band. */
export const Haze: React.FC<{ y: number; h: number; opacity?: number; id: string }> = ({ y, h, opacity = 0.7, id }) => (
  <g>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.paper} stopOpacity={0} />
        <stop offset="0.5" stopColor={C.paper} stopOpacity={opacity} />
        <stop offset="1" stopColor={C.paper} stopOpacity={0} />
      </linearGradient>
    </defs>
    <rect x={-300} y={y} width={W + 600} height={h} fill={`url(#${id})`} />
  </g>
);

export const _H = H;
