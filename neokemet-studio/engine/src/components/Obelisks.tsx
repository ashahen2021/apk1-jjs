import React, { useMemo } from "react";
import { mulberry32 } from "../lib/rng";
import { C } from "../lib/theme";
import { Figure } from "./Figures";
import { RPoly, RRect, Stipple, Streaks } from "./Print";
import { hullLines, ShipHull } from "./Ships";

// Obelisks, from the granite they were cut from to the temple they stood in.
// Same print language as the rest of the library: rough-edged flat shapes,
// dry-brush strokes and stipple, palette colours only. Granite is the palette's
// red (terra) speckled with paper and shadow, so it never reads as limestone.

type P2 = [number, number];
export type ShaftStage = "rough" | "dressed" | "inscribed";

const TOP = 0.68; // width at the shoulder, as a share of the base width
const CAP = 0.9; // height of the pyramidion, as a share of the base width
const shaftOf = (len: number, w: number) => ({ tw: w * TOP, ph: w * CAP, sh: len - w * CAP });

/** The shaft drawn upright around its base centre (0,0); `shade` is the side in shadow. */
const ShaftArt: React.FC<{ id: string; len: number; w: number; stage: ShaftStage; seed: number; glyphs: number; cap: boolean; shade: 1 | -1; color: string }> = ({ id, len, w, stage, seed, glyphs, cap, shade, color }) => {
  const { tw, ph, sh } = shaftOf(len, w);
  const body: P2[] = [[-w / 2, 0], [-tw / 2, -sh], [0, -len], [tw / 2, -sh], [w / 2, 0]];
  const k = shade;
  const dark: P2[] = [[k * w * 0.14, 0], [k * tw * 0.14, -sh], [0, -len], [k * tw / 2, -sh], [k * w / 2, 0]];
  const rough = stage === "rough";
  const rows = Math.max(6, Math.round(sh / (w * 0.3)));
  const done = Math.round(rows * Math.max(0, Math.min(1, glyphs)));
  const colW = tw * 0.24;
  return (
    <g>
      <defs><clipPath id={id}><path d={`M${body.map((p) => p.join(" ")).join("L")}Z`} /></clipPath></defs>
      <RPoly pts={body} seed={seed} fill={color} amp={rough ? 4.2 : 1.4} step={rough ? 22 : 18} />
      <g clipPath={`url(#${id})`}>
        <RPoly pts={dark} seed={seed + 1} fill={C.earth} amp={rough ? 3 : 1.2} opacity={0.55} />
        {/* granite: pale and dark crystals, a little dry brush */}
        <Stipple x={-w / 2} y={-len} w={w} h={len} seed={seed + 2} count={Math.round((len * w) / 190)} color={C.paper} opacity={0.6} size={Math.max(2, w * 0.035)} />
        <Stipple x={-w / 2} y={-len} w={w} h={len} seed={seed + 3} count={Math.round((len * w) / 320)} color={C.shadow} opacity={0.4} size={Math.max(2, w * 0.03)} />
        {rough && <Streaks x={-w / 2} y={-len} w={w} h={len} seed={seed + 4} count={Math.round(len / 14)} color={C.earth} opacity={0.5} maxLen={w * 0.5} thick={3} />}
        {!rough && <path d={`M${-k * w * 0.5} 0L${-k * tw * 0.5} ${-sh}L0 ${-len}`} stroke={C.paper} strokeWidth={Math.max(2, w * 0.05)} fill="none" opacity={0.55} />}
      </g>
      {/* a column of signs between two guide lines, cut from the base upward */}
      {stage === "inscribed" && (
        <g opacity={0.62}>
          {done > 0 && [-1, 1].map((s) => <rect key={s} x={s * colW * 0.74 - w * 0.008} y={-(done * sh) / rows} width={Math.max(1.4, w * 0.016)} height={(done * sh) / rows - w * 0.1} fill={C.shadow} />)}
          {Array.from({ length: done }, (_, i) => {
            const cy = -((i + 0.5) * sh) / rows, u = w * 0.045, c = colW * 0.5;
            // abstract signs: a bar, a sun disc, a reed leaf, a water line, a bird, a loaf
            const sign = [
              <rect key="a" x={-c} y={cy - u * 0.5} width={colW} height={u} fill={C.shadow} />,
              <circle key="b" cx={0} cy={cy} r={u * 1.25} fill={C.shadow} />,
              <path key="c" d={`M0 ${cy + u * 1.6}Q${-c * 0.9} ${cy} 0 ${cy - u * 1.8}Q${c * 0.5} ${cy} 0 ${cy + u * 1.6}Z`} fill={C.shadow} />,
              <path key="d" d={`M${-c} ${cy}l${c * 0.5} ${-u}l${c * 0.5} ${u}l${c * 0.5} ${-u}l${c * 0.5} ${u}`} stroke={C.shadow} strokeWidth={u * 0.8} fill="none" strokeLinejoin="round" />,
              <path key="e" d={`M${-c} ${cy + u}Q${-c * 0.2} ${cy + u * 1.2} ${c * 0.3} ${cy}L${c} ${cy - u * 0.3}L${c * 0.4} ${cy - u * 1.4}Q${-c * 0.4} ${cy - u * 0.4} ${-c} ${cy + u}Z`} fill={C.shadow} />,
              <path key="f" d={`M${-c} ${cy + u * 0.8}Q0 ${cy - u * 2.2} ${c} ${cy + u * 0.8}Z`} fill={C.shadow} />,
            ];
            return <g key={i}>{sign[(i * 3 + seed) % sign.length]}</g>;
          })}
        </g>
      )}
      {/* gilded pyramidion */}
      {cap && (
        <g>
          <path d={`M${-tw / 2} ${-sh}L0 ${-len}L${tw / 2} ${-sh}Z`} fill={C.gold} />
          <path d={`M${-k * tw * 0.5} ${-sh}L0 ${-len}L${-k * tw * 0.12} ${-sh}Z`} fill={C.cream} opacity={0.75} />
          <rect x={-tw / 2} y={-sh - Math.max(2, ph * 0.05)} width={tw} height={Math.max(2, ph * 0.07)} fill={C.earth} />
        </g>
      )}
    </g>
  );
};

type ShaftProps = { id: string; len: number; w: number; stage?: ShaftStage; seed?: number; glyphs?: number; cap?: boolean; color?: string };

/** The point of an obelisk whose base centre is at (x, y), leaning `angle` degrees from upright. */
export const obeliskTip = (x: number, y: number, len: number, angle: number, k = 1): P2 => {
  const r = (angle * Math.PI) / 180;
  return [x + Math.sin(r) * len * k, y - Math.cos(r) * len * k];
};

/** An obelisk standing (or leaning) on its base. (x, y) is the centre of the base; `angle` 0 = upright, negative = leaning left. */
export const ObeliskShaft: React.FC<ShaftProps & { x: number; y: number; angle?: number; shade?: 1 | -1 }> = ({ id, x, y, len, w, angle = 0, stage = "dressed", seed = 1, glyphs = 1, cap = false, shade = 1, color = C.terra }) => (
  <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(2)})`}>
    <ShaftArt id={id} len={len} w={w} stage={stage} seed={seed} glyphs={glyphs} cap={cap} shade={shade} color={color} />
  </g>
);

/**
 * An obelisk lying on its side with its underside flat. (x, y) is the bottom
 * corner of the base; the point is `tip` (1 = to the right, −1 = to the left).
 */
export const ObeliskLying: React.FC<ShaftProps & { x: number; y: number; tip?: 1 | -1 }> = ({ id, x, y, len, w, tip = 1, stage = "dressed", seed = 1, glyphs = 1, cap = false, color = C.terra }) => {
  const { tw, sh } = shaftOf(len, w);
  const taper = (Math.atan((w - tw) / 2 / sh) * 180) / Math.PI;
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(tip * (90 + taper)).toFixed(3)}) translate(${(-tip * w) / 2} 0)`}>
      <ShaftArt id={id} len={len} w={w} stage={stage} seed={seed} glyphs={glyphs} cap={cap} shade={tip} color={color} />
    </g>
  );
};
/** Height of a lying obelisk's top surface above its underside, `d` along from the base. */
export const lyingTop = (len: number, w: number, d: number) => {
  const { tw, sh } = shaftOf(len, w);
  return w - (Math.max(0, Math.min(sh, d)) * (w - tw)) / sh;
};

/** Square granite pedestal. Top centre at (x, y - h); base centre at (x, y). */
export const Pedestal: React.FC<{ x: number; y: number; w?: number; h?: number; seed?: number }> = ({ x, y, w = 130, h = 44, seed = 1 }) => (
  <g>
    <RRect x={x - w / 2} y={y - h} w={w} h={h} seed={seed} fill={C.earth} amp={1.4} />
    <RRect x={x + w * 0.18} y={y - h} w={w * 0.32} h={h} seed={seed + 1} fill={C.shadow} amp={1.2} opacity={0.3} />
    <Stipple x={x - w / 2} y={y - h} w={w} h={h} seed={seed + 2} count={Math.round((w * h) / 150)} color={C.paper} opacity={0.5} />
    <rect x={x - w / 2 - 6} y={y - 8} width={w + 12} height={8} fill={C.shadow} opacity={0.5} />
    <path d={`M${x - w / 2} ${y - h}h${w}`} stroke={C.paper} strokeWidth={3} opacity={0.6} />
  </g>
);

/** Rounded granite outcrops, the boulder hills of Aswan. Base line at y, from x across w. */
export const GraniteBoulders: React.FC<{ x: number; y: number; w: number; h: number; seed?: number; color?: string; shade?: string; opacity?: number }> = ({ x, y, w, h, seed = 1, color = C.gold, shade = C.earth, opacity }) => {
  const domes = useMemo(() => {
    const r = mulberry32(seed * 91 + 17);
    const n = Math.max(2, Math.round(w / Math.max(90, h * 0.9)));
    return Array.from({ length: n }, (_, i) => {
      const rx = (w / n) * (0.62 + r() * 0.42), ry = h * (0.46 + r() * 0.54), cx = x + ((i + 0.5) * w) / n + (r() - 0.5) * (w / n) * 0.4;
      const arc = (kx: number, ky: number, ox = 0): P2[] => [[cx - rx * kx + ox, y], ...Array.from({ length: 11 }, (_, j) => { const a = Math.PI - (Math.PI * (j + 0.5)) / 11; return [cx + ox + Math.cos(a) * rx * kx, y - Math.sin(a) * ry * ky] as P2; }), [cx + rx * kx + ox, y]];
      return { cx, rx, ry, body: arc(1, 1), dark: arc(0.62, 0.74, rx * 0.34), crack: r() };
    }).sort((a, b) => b.ry - a.ry);
  }, [x, y, w, h, seed]);
  return (
    <g opacity={opacity}>
      {domes.map((d, i) => (
        <g key={i}>
          <RPoly pts={d.body} seed={seed + i} fill={color} amp={2} step={400} />
          <RPoly pts={d.dark} seed={seed + i + 40} fill={shade} amp={2} step={400} opacity={0.45} />
          <Streaks x={d.cx - d.rx * 0.8} y={y - d.ry * 0.8} w={d.rx * 1.3} h={d.ry * 0.7} seed={seed + i + 7} count={Math.round(d.rx / 14)} color={C.paper} opacity={0.4} maxLen={d.rx * 0.5} thick={3} />
          <path d={`M${d.cx - d.rx * (0.3 - d.crack * 0.5)} ${y - d.ry * 0.94}Q${d.cx - d.rx * 0.1} ${y - d.ry * 0.5} ${d.cx - d.rx * (0.36 - d.crack * 0.4)} ${y}`} stroke={C.shadow} strokeWidth={2.4} fill="none" opacity={0.3} />
        </g>
      ))}
    </g>
  );
};

/** Granite bedrock texture over a box: red and brown dry brush with crystal stipple. */
export const GraniteTexture: React.FC<{ x: number; y: number; w: number; h: number; seed?: number; dense?: number }> = ({ x, y, w, h, seed = 1, dense = 1 }) => (
  <g>
    <Streaks x={x} y={y} w={w} h={h} seed={seed} count={Math.round((w * h * dense) / 5200)} color={C.terra} opacity={0.3} maxLen={190} thick={4} />
    <Streaks x={x} y={y} w={w} h={h} seed={seed + 1} count={Math.round((w * h * dense) / 6500)} color={C.earth} opacity={0.4} maxLen={150} thick={3} />
    <Streaks x={x} y={y} w={w} h={h} seed={seed + 2} count={Math.round((w * h * dense) / 9000)} color={C.paper} opacity={0.4} maxLen={120} thick={3} />
    <Stipple x={x} y={y} w={w} h={h} seed={seed + 3} count={Math.round((w * h * dense) / 2600)} color={C.shadow} opacity={0.3} size={3} />
  </g>
);

/** Loose dolerite pounding balls. Base centre at (0,0). */
export const Pounders: React.FC<{ n?: number }> = ({ n = 5 }) => (
  <g>
    {[[-26, -11, 11], [0, -12, 12], [27, -10, 10], [-13, -31, 11], [14, -30, 10], [52, -9, 9]].slice(0, n).map(([cx, cy, r], i) => (
      <g key={i}>
        <circle cx={cx} cy={cy} r={r} fill={C.shadow} />
        <path d={`M${cx - r * 0.55} ${cy - r * 0.45}Q${cx} ${cy - r * 0.95} ${cx + r * 0.5} ${cy - r * 0.5}`} stroke={C.teal} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      </g>
    ))}
  </g>
);
/** A flat rubbing stone and a heap of abrasive sand. Base centre at (0,0). */
export const PolishingKit: React.FC = () => (
  <g>
    <path d="M-46 0Q-30 -26 -8 -22Q10 -30 30 0Z" fill={C.sand} />
    <path d="M-30 -8Q-14 -20 4 -14" stroke={C.paper} strokeWidth={3} fill="none" opacity={0.7} />
    <path d="M40 -8Q40 -20 52 -20L80 -20Q92 -20 92 -8L92 0L40 0Z" fill={C.paperDark} stroke={C.earth} strokeWidth={2} />
    <path d="M100 -4Q100 -14 110 -14L128 -14Q138 -14 138 -4L138 0L100 0Z" fill={C.shadow} />
  </g>
);

export const SLEDGE_T = 24; // height of the runner and its cross-beams
export const ROLLER_H = 20; // extra height when the sledge rides on rollers

/**
 * A long timber sledge carrying an obelisk, lashed down. (x, y) is the ground
 * under the middle of the load; the nose of the runner is on the right.
 * `tip` says which way the point of the obelisk faces.
 */
export const ObeliskOnSledge: React.FC<ShaftProps & { x: number; y: number; tip?: 1 | -1; rollers?: boolean; roll?: number }> = ({ id, x, y, len, w, tip = -1, rollers = true, roll = 0, stage = "dressed", seed = 1, glyphs = 1, cap = false, color }) => {
  const r = len * 0.54, t = 15, lift = rollers ? ROLLER_H : 0, deck = -lift - SLEDGE_T;
  const n = Math.max(5, Math.round(len / 110));
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
      <ellipse cx={0} cy={3} rx={r * 1.04} ry={7} fill={C.shadow} opacity={0.2} />
      {/* log rollers under the runner */}
      {rollers && Array.from({ length: n }, (_, i) => {
        const cx = -r * 0.92 + (i * r * 1.84) / (n - 1), a = roll / 10 + i;
        return (
          <g key={i}>
            <circle cx={cx} cy={-10} r={10} fill={C.earth} />
            <circle cx={cx} cy={-10} r={5.5} fill="none" stroke={C.gold} strokeWidth={2} opacity={0.75} />
            <path d={`M${cx} ${-10}l${(Math.cos(a) * 9).toFixed(1)} ${(Math.sin(a) * 9).toFixed(1)}`} stroke={C.shadow} strokeWidth={1.6} opacity={0.6} />
          </g>
        );
      })}
      {/* runner with its upturned nose, and the ends of the cross-beams */}
      <path d={`M${-r} ${-lift}L${r - t * 2} ${-lift}Q${r + t * 0.6} ${-lift} ${r + t * 1.6} ${-lift - t * 2.5}L${r + t * 0.4} ${-lift - t * 2.5}Q${r - t * 0.2} ${-lift - t} ${r - t * 2.2} ${-lift - t}L${-r} ${-lift - t}Z`} fill={C.earth} />
      <path d={`M${-r} ${-lift - t}L${r - t * 2.2} ${-lift - t}`} stroke={C.gold} strokeWidth={2.4} opacity={0.7} />
      {Array.from({ length: n }, (_, i) => <rect key={i} x={-r * 0.9 + (i * r * 1.76) / (n - 1) - 6} y={deck} width={12} height={SLEDGE_T - t} fill={C.shadow} />)}
      <ObeliskLying id={id} x={(-tip * len) / 2} y={deck} len={len} w={w} tip={tip} stage={stage} seed={seed} glyphs={glyphs} cap={cap} color={color} />
      {/* lashings round the load */}
      {Array.from({ length: 4 }, (_, i) => {
        const d = len * (0.12 + i * 0.2), px = (-tip * len) / 2 + tip * d;
        return <path key={i} d={`M${px} ${deck + 4}L${px} ${deck - lyingTop(len, w, d) - 2}`} stroke={C.shadow} strokeWidth={Math.max(3, w * 0.05)} opacity={0.8} />;
      })}
    </g>
  );
};

const lineAt = (pts: P2[], u: number): P2 => {
  const t = ((u + 1) / 2) * (pts.length - 1), i = Math.max(0, Math.min(pts.length - 2, Math.floor(t))), k = t - i;
  return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
};
/** Where a tow rope makes fast on the bow of a barge whose waterline centre is (x, y). */
export const bargeBow = (x: number, y: number, a: number): P2 => {
  const H = a * 0.27;
  return [x + a * 1.05, y + H * 0.42 - a * 0.224 - H * 0.72];
};

/**
 * The great obelisk barge: a broad, heavily laden hull with the obelisk lying
 * along its deck on timber baulks, twin steering oars and a deck crew.
 * Waterline centre at (x, y); bow on the right.
 */
export const ObeliskBarge: React.FC<{ id: string; x: number; y: number; a?: number; f?: number; seed?: number; len?: number; w?: number; crew?: number; load?: boolean }> = ({ id, x, y, a = 380, f = 0, seed = 1, len, w, crew = 3, load = true }) => {
  const H = a * 0.27, draft = H * 0.42;
  const { top } = useMemo(() => hullLines(a, H), [a, H]);
  const deck = (u: number) => lineAt(top, u)[1] + draft;
  const L = len ?? a * 1.5, W = w ?? a * 0.2, fh = a * 0.27, dy = deck(0) - 12;
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
      {/* crew: two helmsmen aft, a lookout forward */}
      <Figure x={-a * 0.84} y={deck(-0.84) + 2} h={fh} kind="bearer" armF={-50} armB={-66} lean={-4} />
      {crew > 1 && <Figure x={-a * 0.72} y={deck(-0.72) + 2} h={fh * 0.96} kind="bearer" armF={-46} armB={-62} lean={-3} opacity={0.8} />}
      {crew > 2 && <Figure x={a * 0.86} y={deck(0.86) + 2} h={fh * 0.96} kind="scribe" armF={84} armB={10} />}
      <g transform={`translate(0 ${draft})`}><ShipHull id={id} x={0} y={0} a={a} H={H} seed={seed} /></g>
      {/* deck baulks, the load and its lashings */}
      {load && (
        <g>
          {Array.from({ length: 6 }, (_, i) => <rect key={i} x={-L * 0.46 + (i * L * 0.92) / 5 - 9} y={dy} width={18} height={12} fill={C.shadow} />)}
          <ObeliskLying id={`${id}o`} x={-L / 2} y={dy} len={L} w={W} seed={seed + 5} />
          {Array.from({ length: 4 }, (_, i) => { const d = L * (0.14 + i * 0.2); return <path key={i} d={`M${-L / 2 + d} ${dy + 8}L${-L / 2 + d} ${dy - lyingTop(L, W, d) - 2}`} stroke={C.shadow} strokeWidth={Math.max(3, W * 0.055)} opacity={0.8} />; })}
        </g>
      )}
      {/* twin steering oars */}
      {[0, 1].map((i) => (
        <g key={i} opacity={i ? 0.75 : 1}>
          <path d={`M${-a * (0.8 - i * 0.12)} ${deck(-0.8) - fh * 0.6}L${-a * (1.08 - i * 0.1)} ${draft + 22}`} stroke={C.shadow} strokeWidth={6} strokeLinecap="round" />
          <path d={`M${-a * (1.08 - i * 0.1)} ${draft + 22}l-15 28l23 -8Z`} fill={C.shadow} />
        </g>
      ))}
      {/* water over the hull below the waterline */}
      <path d={`M${-a * 1.12} 2Q${-a * 0.5} ${-4 + Math.sin(f * 0.09) * 2} 0 2T${a * 1.12} 2L${a * 1.12} ${draft + 10}L${-a * 1.12} ${draft + 10}Z`} fill={C.shadow} />
      <rect x={-a * 1.1} y={6} width={a * 2.2} height={4} fill={C.paper} opacity={0.6} />
      <path d={`M${a * 0.98} 0q18 -10 34 2M${a * 1.06} 12q16 -8 30 2`} stroke={C.paper} strokeWidth={3} fill="none" opacity={0.7} />
    </g>
  );
};

/**
 * A temple pylon: two battered towers with cavetto cornices either side of a
 * gateway, and tall flag masts with pennants. Base centre at (x, y).
 */
export const Pylon: React.FC<{ id: string; x: number; y: number; w: number; h: number; f?: number; seed?: number; color?: string; flags?: boolean; opacity?: number }> = ({ id, x, y, w, h, f = 0, seed = 1, color = C.sand, flags = true, opacity }) => {
  const gate = w * 0.13, batter = h * 0.1, corn = h * 0.07;
  const tower = (s: 1 | -1): P2[] => [[x + s * (w / 2), y], [x + s * (w / 2 - batter), y - h + corn], [x + s * (gate / 2 + batter * 0.5), y - h + corn], [x + s * (gate / 2), y]];
  const gh = h * 0.58;
  return (
    <g opacity={opacity}>
      <defs><clipPath id={id}><path d={`M${tower(-1).map((p) => p.join(" ")).join("L")}ZM${tower(1).map((p) => p.join(" ")).join("L")}Z`} /></clipPath></defs>
      {/* flag masts behind the towers */}
      {flags && [-0.36, -0.2, 0.2, 0.36].map((k, i) => {
        const mx = x + w * k, top = y - h * 1.2, sw = Math.sin(f * 0.07 + i * 1.3) * h * 0.012;
        return (
          <g key={i}>
            <rect x={mx - 3} y={top} width={6} height={h * 1.2} fill={C.earth} />
            <path d={`M${mx + 3} ${top + 4}L${mx + h * 0.16} ${top + h * 0.03 + sw}L${mx + 3} ${top + h * 0.075}Z`} fill={i % 2 ? C.cream : C.terra} />
          </g>
        );
      })}
      {([-1, 1] as const).map((s) => <RPoly key={s} pts={tower(s)} seed={seed + (s > 0 ? 3 : 0)} fill={color} amp={2} />)}
      <g clipPath={`url(#${id})`}>
        {/* the sunlit and shaded halves, registers of relief, dry brush */}
        <rect x={x + gate / 2} y={y - h} width={w / 2} height={h} fill={C.gold} opacity={0.3} />
        <Streaks x={x - w / 2} y={y - h} w={w} h={h} seed={seed + 1} count={Math.round(w / 5)} color={C.paper} opacity={0.5} maxLen={150} thick={3} />
        <Streaks x={x - w / 2} y={y - h} w={w} h={h} seed={seed + 2} count={Math.round(w / 8)} color={C.gold} opacity={0.45} maxLen={130} thick={3} />
        {[0.3, 0.52, 0.74].map((v) => <rect key={v} x={x - w / 2} y={y - h * v} width={w} height={2.5} fill={C.earth} opacity={0.35} />)}
        {/* large relief figures, only hinted */}
        {[-0.3, 0.3].map((k) => (
          <g key={k} opacity={0.28} transform={`translate(${x + w * k} ${y - h * 0.34}) scale(${k < 0 ? 1 : -1} 1)`}>
            <path d={`M${-h * 0.03} ${h * 0.2}L${-h * 0.035} ${-h * 0.06}L${-h * 0.02} ${-h * 0.11}Q${-h * 0.04} ${-h * 0.17} 0 ${-h * 0.18}Q${h * 0.04} ${-h * 0.17} ${h * 0.02} ${-h * 0.11}L${h * 0.035} ${-h * 0.06}L${h * 0.03} ${h * 0.2}Z`} fill={C.earth} />
            <path d={`M0 ${-h * 0.05}L${h * 0.11} ${-h * 0.12}`} stroke={C.earth} strokeWidth={h * 0.018} strokeLinecap="round" />
          </g>
        ))}
      </g>
      {/* cornices */}
      {([-1, 1] as const).map((s) => {
        const a = x + s * (w / 2 - batter), b = x + s * (gate / 2 + batter * 0.5), lo = Math.min(a, b), wd = Math.abs(a - b);
        return (
          <g key={s}>
            <path d={`M${lo} ${y - h + corn}Q${lo - corn * 0.5} ${y - h + corn * 0.4} ${lo - corn * 0.45} ${y - h}L${lo + wd + corn * 0.45} ${y - h}Q${lo + wd + corn * 0.5} ${y - h + corn * 0.4} ${lo + wd} ${y - h + corn}Z`} fill={color} />
            <rect x={lo - corn * 0.45} y={y - h} width={wd + corn * 0.9} height={Math.max(3, corn * 0.2)} fill={C.teal} />
            <rect x={lo} y={y - h + corn - 3} width={wd} height={5} fill={C.terra} opacity={0.7} />
          </g>
        );
      })}
      {/* gateway between the towers */}
      <RRect x={x - gate * 0.72} y={y - gh} w={gate * 1.44} h={gh} seed={seed + 5} fill={color} amp={1.4} />
      <rect x={x - gate * 0.82} y={y - gh - corn * 0.5} width={gate * 1.64} height={corn * 0.5} fill={color} />
      <rect x={x - gate * 0.82} y={y - gh - corn * 0.5} width={gate * 1.64} height={Math.max(3, corn * 0.16)} fill={C.teal} />
      <rect x={x - gate * 0.34} y={y - gh * 0.78} width={gate * 0.68} height={gh * 0.78} fill={C.shadow} />
      <circle cx={x} cy={y - gh * 0.89} r={gate * 0.1} fill={C.terra} />
      <path d={`M${x - gate * 0.36} ${y - gh * 0.89}Q${x} ${y - gh * 0.82} ${x + gate * 0.36} ${y - gh * 0.89}`} stroke={C.gold} strokeWidth={3} fill="none" />
    </g>
  );
};
