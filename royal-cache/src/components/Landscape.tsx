import React, { useMemo } from "react";
import { C } from "../lib/theme";
import { mulberry32, Pt, roughPath } from "../lib/rng";
import { RPoly, Streaks } from "./Print";

/**
 * Theban limestone cliff: stepped vertical buttresses with shaded flutes,
 * dry-brushed strata and pale scree fans at the foot. Pure seeded geometry.
 */
export const Cliff: React.FC<{
  id: string;
  x: number;
  baseY: number;
  w: number;
  h: number;
  seed?: number;
  color?: string;
  shade?: string;
  scree?: string;
  peak?: number; // 0..1 position of the summit
  peakiness?: number;
  strata?: boolean;
  opacity?: number;
  screeH?: number;
}> = ({ id, x, baseY, w, h, seed = 1, color = C.gold, shade = C.teal, scree = C.sand, peak = 0.5, peakiness = 0.5, strata = true, opacity, screeH = 0.26 }) => {
  const geo = useMemo(() => {
    const r = mulberry32(seed * 53 + 1);
    const cols: { x0: number; x1: number; top: number }[] = [];
    let cx = x;
    while (cx < x + w) {
      const cw = 36 + r() * 86;
      const u = (cx + cw / 2 - x) / w;
      const bell = Math.exp(-((u - peak) ** 2) / 0.05);
      const edge = Math.min(1, Math.min(u, 1 - u) * 5 + 0.25);
      const k = (1 - peakiness + peakiness * bell) * (0.78 + r() * 0.22) * edge;
      cols.push({ x0: cx, x1: Math.min(x + w, cx + cw), top: baseY - h * k });
      cx += cw;
    }
    const outline: Pt[] = [[x, baseY]];
    cols.forEach((c) => {
      outline.push([c.x0 + 3, c.top + 6], [c.x1 - 3, c.top + (r() - 0.5) * 10]);
    });
    outline.push([x + w, baseY]);
    const body = roughPath(outline, seed, 2.6, 18);
    let shadePath = "";
    cols.forEach((c, i) => {
      const cw = c.x1 - c.x0;
      const sw = cw * (0.18 + r() * 0.24);
      const next = cols[i + 1];
      const bottom = baseY - h * screeH * (0.5 + r() * 0.5);
      if (c.top < bottom - 20) {
        const top = Math.max(c.top, next ? Math.min(next.top, c.top + 40) : c.top) + 4;
        shadePath += roughPath(
          [
            [c.x1 - sw, top + r() * 14],
            [c.x1 - 1, top + r() * 8],
            [c.x1 - 1, bottom],
            [c.x1 - sw * (0.5 + r() * 0.5), bottom - r() * 30],
          ],
          seed + i,
          1.8,
          22,
        );
      }
    });
    // scree fans
    const fan: Pt[] = [[x - 20, baseY + 2]];
    const n = Math.max(4, Math.round(w / 150));
    for (let i = 0; i <= n; i++) {
      const fx = x + (w * i) / n;
      fan.push([fx - w / n / 2, baseY - h * screeH * (0.25 + r() * 0.3)]);
      fan.push([fx, baseY - h * screeH * (0.75 + r() * 0.45)]);
    }
    fan.push([x + w + 20, baseY + 2]);
    const top = Math.min(...cols.map((c) => c.top));
    return { body, shadePath, fan: roughPath(fan, seed + 99, 3, 20), top };
  }, [x, baseY, w, h, seed, peak, peakiness, screeH]);

  return (
    <g opacity={opacity}>
      <defs>
        <clipPath id={id}>
          <path d={geo.body} />
        </clipPath>
      </defs>
      <path d={geo.body} fill={color} />
      <path d={geo.shadePath} fill={shade} opacity={0.88} clipPath={`url(#${id})`} />
      {strata && (
        <g clipPath={`url(#${id})`}>
          <Streaks x={x} y={geo.top} w={w} h={baseY - geo.top} seed={seed + 5} count={Math.round((w * h) / 5200)} color={C.earth} opacity={0.34} maxLen={150} thick={3} />
          <Streaks x={x} y={geo.top} w={w} h={baseY - geo.top} seed={seed + 6} count={Math.round((w * h) / 7000)} color={C.paper} opacity={0.4} maxLen={110} thick={3} />
        </g>
      )}
      <path d={geo.fan} fill={scree} />
      <Streaks x={x} y={baseY - h * screeH} w={w} h={h * screeH} seed={seed + 8} count={Math.round(w / 22)} color={color} opacity={0.45} maxLen={90} thick={3} />
    </g>
  );
};

/** Low rolling far ridge. */
export const Ridge: React.FC<{ x: number; y: number; w: number; h: number; seed?: number; color?: string; opacity?: number }> = ({ x, y, w, h, seed = 1, color = C.sand, opacity }) => {
  const pts = useMemo(() => {
    const r = mulberry32(seed * 17 + 5);
    const p: Pt[] = [[x, y]];
    const n = Math.round(w / 90);
    for (let i = 0; i <= n; i++) p.push([x + (w * i) / n, y - h * (0.25 + r() * 0.75) * Math.sin((Math.PI * (i + 0.5)) / (n + 1)) ** 0.6]);
    p.push([x + w, y]);
    return p;
  }, [x, y, w, h, seed]);
  return <RPoly pts={pts} seed={seed} fill={color} opacity={opacity} amp={2} />;
};

/** Mortuary temple of Hatshepsut, reduced to terraces, colonnades and ramps. */
export const HatshepsutTemple: React.FC<{ x: number; y: number; s?: number; opacity?: number }> = ({ x, y, s = 1, opacity }) => {
  const tier = (w: number, top: number, hgt: number, seed: number, cols: number) => (
    <g>
      <RPoly pts={[[-w / 2, top], [w / 2, top], [w / 2, top + hgt], [-w / 2, top + hgt]]} seed={seed} fill={C.sand} amp={1.2} />
      <rect x={-w / 2} y={top} width={w} height={hgt * 0.2} fill={C.paperDark} />
      {Array.from({ length: cols }, (_, i) => {
        const cx = -w / 2 + 10 + ((w - 20) * (i + 0.5)) / cols;
        if (Math.abs(cx) < 24) return null;
        return <rect key={i} x={cx - (w / cols) * 0.27} y={top + hgt * 0.3} width={(w / cols) * 0.54} height={hgt * 0.7} fill={C.shadow} opacity={0.82} />;
      })}
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
      {tier(250, -92, 30, 31, 16)}
      {tier(400, -62, 30, 32, 22)}
      {tier(520, -32, 32, 33, 26)}
      <path d="M-16 -62L16 -62L22 -32L-22 -32Z" fill={C.paperDark} />
      <path d="M-22 -32L22 -32L34 4L-34 4Z" fill={C.paperDark} />
      <path d="M-2 -62L2 -62L3 4L-3 4Z" fill={C.gold} opacity={0.6} />
    </g>
  );
};

/** Date palm with fronds that sway from the crown. */
export const Palm: React.FC<{ x: number; y: number; h?: number; f: number; seed?: number; lean?: number; color?: string }> = ({ x, y, h = 420, f, seed = 1, lean = 26, color = C.shadow }) => {
  const fronds = useMemo(() => {
    const r = mulberry32(seed * 29 + 3);
    return Array.from({ length: 9 }, (_, i) => {
      const ang = -Math.PI * (0.02 + (i / 8) * 0.96) + (r() - 0.5) * 0.2;
      const len = h * (0.3 + r() * 0.12);
      const droop = len * (0.42 + r() * 0.2);
      const ex = Math.cos(ang) * len;
      const ey = Math.sin(ang) * len * 0.55 + droop * Math.abs(Math.cos(ang)) ** 1.5 + droop * 0.15;
      const mx = Math.cos(ang) * len * 0.5;
      const my = Math.sin(ang) * len * 0.75 - len * 0.12;
      let d = `M0 0Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
      let leaf = "";
      for (let k = 1; k <= 13; k++) {
        const t = k / 14;
        const px = 2 * (1 - t) * t * mx + t * t * ex;
        const py = 2 * (1 - t) * t * my + t * t * ey;
        const ll = len * 0.17 * (1 - t * 0.5) * (0.7 + r() * 0.5);
        const side = Math.cos(ang) >= 0 ? 1 : -1;
        leaf += `M${px.toFixed(1)} ${py.toFixed(1)}l${(side * ll * 0.35).toFixed(1)} ${ll.toFixed(1)}l${(-side * 5).toFixed(1)} ${(-ll * 0.25).toFixed(1)}Z`;
        leaf += `M${px.toFixed(1)} ${py.toFixed(1)}l${(side * ll * 0.5).toFixed(1)} ${(-ll * 0.45).toFixed(1)}l${(-side * 3).toFixed(1)} ${(ll * 0.2).toFixed(1)}Z`;
      }
      return { d, leaf, ph: r() * 6.28, amt: 1.5 + r() * 2.5 };
    });
  }, [seed, h]);
  const topX = x + lean;
  const topY = y - h;
  const sway = Math.sin(f * 0.035 + seed) * 1.2;
  return (
    <g>
      <path d={`M${x - 9} ${y}Q${x + lean * 0.2 - 4} ${y - h * 0.5} ${topX - 5} ${topY}L${topX + 5} ${topY}Q${x + lean * 0.2 + 10} ${y - h * 0.5} ${x + 11} ${y}Z`} fill={C.earth} />
      <Streaks x={Math.min(x, topX) - 12} y={topY} w={Math.abs(lean) + 26} h={h} seed={seed + 3} count={Math.round(h / 9)} color={C.shadow} opacity={0.5} maxLen={16} thick={2} />
      <g transform={`translate(${topX} ${topY}) rotate(${sway})`}>
        {fronds.map((fr, i) => (
          <g key={i} transform={`rotate(${Math.sin(f * 0.045 + fr.ph) * fr.amt})`}>
            <path d={fr.d} stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" />
            <path d={fr.leaf} fill={i % 3 === 0 ? C.teal : color} />
          </g>
        ))}
        <circle r={9} fill={C.earth} />
        <circle cx={-7} cy={7} r={4.5} fill={C.terra} />
        <circle cx={6} cy={8} r={4} fill={C.terra} />
      </g>
    </g>
  );
};

/** Generic distant pyramid (symbol of ancient Egypt only — never the cache site). */
export const Pyramid: React.FC<{ x: number; y: number; w: number; seed?: number; opacity?: number }> = ({ x, y, w, seed = 1, opacity }) => (
  <g opacity={opacity}>
    <RPoly pts={[[x - w / 2, y], [x, y - w * 0.62], [x + w / 2, y]]} seed={seed} fill={C.sand} amp={1.4} />
    <RPoly pts={[[x - w / 2, y], [x, y - w * 0.62], [x - w * 0.22, y]]} seed={seed + 1} fill={C.teal} amp={1.2} opacity={0.7} />
  </g>
);

/** Mud-brick village house. */
export const House: React.FC<{ x: number; y: number; w: number; h: number; seed?: number; color?: string; dome?: boolean }> = ({ x, y, w, h, seed = 1, color = C.gold, dome }) => (
  <g>
    {dome && <path d={`M${x + w * 0.2} ${y - h}Q${x + w * 0.5} ${y - h - w * 0.5} ${x + w * 0.8} ${y - h}Z`} fill={color} />}
    <RPoly pts={[[x, y - h], [x + w, y - h + 4], [x + w, y], [x, y]]} seed={seed} fill={color} amp={2} />
    <RPoly pts={[[x + w * 0.72, y - h + 3], [x + w, y - h + 4], [x + w, y], [x + w * 0.72, y]]} seed={seed + 1} fill={C.earth} opacity={0.75} amp={1.5} />
    <rect x={x + w * 0.16} y={y - h * 0.48} width={w * 0.16} height={h * 0.48} fill={C.shadow} />
    <rect x={x + w * 0.46} y={y - h * 0.74} width={w * 0.1} height={h * 0.14} fill={C.shadow} />
    <rect x={x - 4} y={y - h - 5} width={w + 8} height={7} fill={C.earth} />
    <Streaks x={x} y={y - h} w={w} h={h} seed={seed + 2} count={10} color={C.paper} opacity={0.35} maxLen={50} thick={2} />
  </g>
);
