import React, { useMemo } from "react";
import { mulberry32 } from "../lib/rng";
import { C } from "../lib/theme";
import { Figure } from "./Figures";
import { Rope } from "./Objects";
import { RPoly, Streaks } from "./Print";

// Boats and boatyards in the same print language as the rest of the library:
// rough-edged flat shapes, dry-brush grain, palette colours only. A hull is one
// parametric drawing that can be shown at any stage of building, from a bare
// keel to a planked and rigged vessel, so new scenes need no new artwork.

type P2 = [number, number];
export type HullStage = "keel" | "frame" | "half" | "planked";
const STRAKES = 5;

/** Sheer (top) and keel (bottom) lines of a crescent hull. `a` = half length, `H` = depth amidships; bow on the right. */
export const hullLines = (a: number, H: number, n = 28) => {
  const top: P2[] = [], bot: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const u = -1 + (2 * i) / n, au = Math.abs(u);
    const rise = a * 0.2 * Math.pow(au, 2.3) * (u > 0 ? 1.12 : 1);
    const T = H * (0.2 + 0.8 * (1 - Math.pow(au, 3)));
    bot.push([u * a, -rise]);
    top.push([u * a, -rise - T]);
  }
  return { top, bot };
};
const between = (top: P2[], bot: P2[], k: number): P2[] => bot.map((b, i) => [b[0], b[1] + (top[i][1] - b[1]) * k]);
const line = (pts: P2[]) => "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L");
const at = (pts: P2[], u: number): P2 => {
  const t = ((u + 1) / 2) * (pts.length - 1), i = Math.max(0, Math.min(pts.length - 2, Math.floor(t))), k = t - i;
  return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
};

/**
 * A wooden hull in side view. (x, y) is the bottom of the keel amidships.
 * `stage` shows how far the building has gone: keel and end posts, then ribs,
 * then the lower planking, then the finished shell. `stocks` props it up on
 * building stocks that reach down `stocks` units to the ground; `truss` adds
 * the rope truss that ran from end to end over forked posts.
 */
export const ShipHull: React.FC<{ id: string; x: number; y: number; a?: number; H?: number; stage?: HullStage; seed?: number; angle?: number; stocks?: number; truss?: boolean; color?: string }> = ({ id, x, y, a = 300, H = 100, stage = "planked", seed = 1, angle = 0, stocks = 0, truss = false, color = C.earth }) => {
  const { top, bot } = useMemo(() => hullLines(a, H), [a, H]);
  const upTo = stage === "keel" ? 1 : stage === "frame" ? 1 : stage === "half" ? 3 : STRAKES;
  const shellTop = between(top, bot, upTo / STRAKES);
  const shell: P2[] = [...bot, ...[...shellTop].reverse()];
  const ribs = stage === "frame" || stage === "half";
  const sw = Math.max(2, H * 0.03);
  const stern = at(top, -1), bow = at(top, 1), sternB = at(bot, -1), bowB = at(bot, 1);
  const joints = useMemo(() => {
    const r = mulberry32(seed * 53 + 11);
    let d = "";
    for (let j = 0; j < upTo; j++) {
      const lo = between(top, bot, j / STRAKES), hi = between(top, bot, (j + 1) / STRAKES);
      for (let u = -0.86 + r() * 0.2; u < 0.9; u += 0.28 + r() * 0.2) {
        const p = at(lo, u), q = at(hi, u);
        d += `M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
      }
    }
    return d;
  }, [a, H, seed, upTo]);
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(2)})`}>
      <defs><clipPath id={id}><path d={line(shell) + "Z"} /></clipPath></defs>
      {/* building stocks */}
      {stocks > 0 && (
        <g>
          <rect x={-a * 0.78} y={stocks - 10} width={a * 1.56} height={10} fill={C.earth} />
          {[-0.62, -0.22, 0.22, 0.62].map((u) => {
            const p = at(bot, u);
            return (
              <g key={u}>
                <rect x={p[0] - 7} y={p[1]} width={14} height={stocks - p[1]} fill={C.gold} />
                <path d={`M${p[0] - 30} ${stocks - 8}L${p[0] - 5} ${p[1] + (stocks - p[1]) * 0.35}L${p[0] + 5} ${p[1] + (stocks - p[1]) * 0.35}L${p[0] + 30} ${stocks - 8}`} stroke={C.gold} strokeWidth={6} fill="none" />
                <rect x={p[0] - 15} y={p[1] - 2} width={30} height={8} fill={C.sand} />
              </g>
            );
          })}
        </g>
      )}
      {/* end posts */}
      <path d={`M${sternB[0] + a * 0.06} ${sternB[1] - 2}Q${stern[0] - a * 0.03} ${stern[1]} ${stern[0] - a * 0.05} ${stern[1] - H * 0.62}`} stroke={color} strokeWidth={H * 0.15} fill="none" strokeLinecap="round" />
      <path d={`M${bowB[0] - a * 0.06} ${bowB[1] - 2}Q${bow[0] + a * 0.03} ${bow[1]} ${bow[0] + a * 0.07} ${bow[1] - H * 0.78}`} stroke={color} strokeWidth={H * 0.15} fill="none" strokeLinecap="round" />
      {/* ribs standing above the planking so far */}
      {ribs && (
        <g>
          {Array.from({ length: 11 }, (_, i) => -0.85 + i * 0.17).map((u) => {
            const p = at(shellTop, u), q = at(top, u);
            return <path key={u} d={`M${p[0].toFixed(1)} ${p[1].toFixed(1)}Q${(p[0] + u * H * 0.12).toFixed(1)} ${((p[1] + q[1]) / 2).toFixed(1)} ${(q[0] + u * H * 0.1).toFixed(1)} ${(q[1] - H * 0.06).toFixed(1)}`} stroke={C.gold} strokeWidth={H * 0.075} fill="none" strokeLinecap="round" />;
          })}
          <path d={line(top)} stroke={color} strokeWidth={H * 0.07} fill="none" strokeLinecap="round" />
        </g>
      )}
      {/* planking */}
      <RPoly pts={shell} seed={seed} fill={color} amp={1.6} step={22} />
      <g clipPath={`url(#${id})`}>
        <Streaks x={-a} y={-a * 0.24 - H} w={a * 2} h={a * 0.24 + H} seed={seed + 1} count={Math.round(a / 3)} color={C.gold} opacity={0.4} maxLen={a * 0.5} thick={3} />
        <Streaks x={-a} y={-a * 0.24 - H} w={a * 2} h={a * 0.24 + H} seed={seed + 2} count={Math.round(a / 6)} color={C.shadow} opacity={0.18} maxLen={a * 0.4} thick={2} />
        <path d={line(between(top, bot, 0.5 / STRAKES))} stroke={C.shadow} strokeWidth={(H / STRAKES) * 1.1} fill="none" opacity={0.22} />
      </g>
      {Array.from({ length: upTo - 1 }, (_, j) => <path key={j} d={line(between(top, bot, (j + 1) / STRAKES))} stroke={C.shadow} strokeWidth={sw * 0.7} fill="none" opacity={0.5} />)}
      <path d={joints} stroke={C.shadow} strokeWidth={sw * 0.6} fill="none" opacity={0.45} />
      {stage === "planked" && <path d={line(top)} stroke={C.gold} strokeWidth={H * 0.085} fill="none" strokeLinecap="round" />}
      {/* rope truss over forked posts */}
      {truss && (() => {
        const p1 = at(top, -0.42), p2 = at(top, 0.42), up = H * 0.72;
        return (
          <g>
            {[p1, p2].map((p, i) => <path key={i} d={`M${p[0]} ${p[1]}L${p[0]} ${p[1] - up}M${p[0] - 9} ${p[1] - up - 10}L${p[0]} ${p[1] - up}L${p[0] + 9} ${p[1] - up - 10}`} stroke={C.shadow} strokeWidth={6} fill="none" strokeLinecap="round" />)}
            <Rope pts={[[stern[0] - a * 0.03, stern[1] - H * 0.3], [p1[0], p1[1] - up], [p2[0], p2[1] - up], [bow[0] + a * 0.04, bow[1] - H * 0.4]]} sag={3} width={Math.max(3, H * 0.045)} />
          </g>
        );
      })()}
    </g>
  );
};

/** Mast with a broad square sail between two yards. (x, y) is the mast foot. `angle` leans the mast (for raising it). */
export const MastAndSail: React.FC<{ x: number; y: number; h: number; w: number; f?: number; seed?: number; sail?: boolean; angle?: number }> = ({ x, y, h, w, f = 0, seed = 1, sail = true, angle = 0 }) => {
  const top = -h, yardT = -h * 0.94, yardB = -h * 0.3;
  const belly = Math.sin(f * 0.06) * w * 0.012 + w * 0.03;
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(2)})`}>
      <path d={`M-5 0L-3.5 ${top}L3.5 ${top}L5 0Z`} fill={C.shadow} />
      {sail && (
        <g>
          <path d={`M${-w / 2} ${yardT}L${w / 2} ${yardT}Q${w / 2 + belly} ${(yardT + yardB) / 2} ${w / 2} ${yardB}L${-w / 2} ${yardB}Q${-w / 2 + belly} ${(yardT + yardB) / 2} ${-w / 2} ${yardT}Z`} fill={C.cream} stroke={C.sand} strokeWidth={2} />
          <Streaks x={-w / 2} y={yardT} w={w} h={yardB - yardT} seed={seed} count={Math.round(w / 9)} color={C.sand} opacity={0.6} maxLen={w * 0.4} thick={3} />
          {[-0.3, -0.1, 0.1, 0.3].map((k) => <path key={k} d={`M${w * k} ${yardT}Q${w * k + belly * 0.7} ${(yardT + yardB) / 2} ${w * k} ${yardB}`} stroke={C.gold} strokeWidth={2} fill="none" opacity={0.55} />)}
          <path d={`M${-w / 2} ${yardT + (yardB - yardT) * 0.5}h${w}`} stroke={C.terra} strokeWidth={(yardB - yardT) * 0.07} opacity={0.6} />
        </g>
      )}
      <rect x={-w / 2 - 14} y={yardT - 4} width={w + 28} height={8} fill={C.earth} />
      {sail && <rect x={-w / 2 - 14} y={yardB - 4} width={w + 28} height={8} fill={C.earth} />}
    </g>
  );
};

export type Cargo = "jars" | "timber" | "sacks" | "none";
/**
 * A finished river boat: planked hull, steering oar and helmsman, optional mast
 * and sail, oars, deck crew and cargo. Waterline at (x, y); bow on the right.
 */
export const CargoBoat: React.FC<{ id: string; x: number; y: number; a?: number; f?: number; seed?: number; sail?: boolean; oars?: number; cargo?: Cargo; crew?: number; flip?: boolean; steering?: boolean }> = ({ id, x, y, a = 300, f = 0, seed = 1, sail = true, oars = 0, cargo = "jars", crew = 2, flip, steering = true }) => {
  const H = a * 0.3, draft = H * 0.34;
  const { top } = useMemo(() => hullLines(a, H), [a, H]);
  const deck = (u: number) => at(top, u)[1] + draft;
  const fh = a * 0.3;
  const stern = at(top, -1);
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${flip ? -1 : 1} 1)`}>
      {sail && (
        <g>
          <path d={`M0 ${deck(0) - a * 1.05}L${stern[0] - a * 0.03} ${stern[1] + draft - H * 0.4}M0 ${deck(0) - a * 1.05}L${a * 1.04} ${at(top, 1)[1] + draft - H * 0.5}`} stroke={C.shadow} strokeWidth={2.5} fill="none" opacity={0.7} />
          <MastAndSail x={0} y={deck(0) + 4} h={a * 1.05} w={a * 0.95} f={f} seed={seed + 5} />
        </g>
      )}
      {!sail && <path d={`M${-a * 0.1} ${deck(0) - fh * 0.9}L${a * 0.5} ${deck(0.5) - fh * 0.5}`} stroke={C.shadow} strokeWidth={7} strokeLinecap="round" />}
      {/* cargo on deck */}
      {cargo === "jars" && [0.22, 0.34, 0.46, 0.58].map((u, i) => (
        <path key={u} transform={`translate(${u * a} ${deck(u) + 2}) scale(${a / 330})`} d="M-8 -52L8 -52L7 -44Q22 -30 17 -8Q14 0 0 0Q-14 0 -17 -8Q-22 -30 -7 -44Z" fill={i % 2 ? C.terra : C.gold} />
      ))}
      {cargo === "sacks" && [0.2, 0.33, 0.46, 0.27, 0.4].map((u, i) => <ellipse key={i} cx={u * a} cy={deck(u) - (i > 2 ? a * 0.085 : a * 0.03)} rx={a * 0.075} ry={a * 0.038} fill={i % 2 ? C.sand : C.cream} stroke={C.gold} strokeWidth={1.5} />)}
      {cargo === "timber" && [0, 1, 2].map((i) => <rect key={i} x={-a * 0.5 + i * 12} y={deck(0) - 14 - i * 15} width={a * 1.05 - i * 24} height={13} rx={6} fill={i % 2 ? C.gold : C.earth} stroke={C.shadow} strokeWidth={1} />)}
      {/* crew: helmsman at the stern, the rest along the deck */}
      <Figure x={-a * 0.7} y={deck(-0.7) + 2} h={fh} kind="bearer" armF={-52} armB={-70} lean={-4} />
      {Array.from({ length: Math.max(0, crew - 1) }, (_, i) => {
        const u = cargo === "timber" ? 0.72 - i * 0.12 : -0.34 + i * 0.2 - (i > 1 ? 0.5 : 0);
        return <Figure key={i} x={u * a} y={deck(u) + 2} h={fh * 0.96} kind={i === 0 ? "bearer" : "worker"} armF={i === 0 ? 70 : undefined} dir={i % 2 ? -1 : 1} />;
      })}
      <g transform={`translate(0 ${draft})`}><ShipHull id={id} x={0} y={0} a={a} H={H} seed={seed} /></g>
      {/* steering oar */}
      {steering && <path d={`M${-a * 0.66} ${deck(-0.66) - fh * 0.62}L${-a * 1.02} ${draft + 26}`} stroke={C.shadow} strokeWidth={6} strokeLinecap="round" />}
      {steering && <path d={`M${-a * 1.02} ${draft + 26}l-16 30l24 -8Z`} fill={C.shadow} />}
      {/* oars */}
      {Array.from({ length: oars }, (_, i) => {
        const u = -0.4 + (i * 0.8) / Math.max(1, oars - 1), sw = Math.sin(f * 0.1) * 10;
        return <g key={i}><path d={`M${u * a} ${deck(u) + 6}L${u * a - 46 + sw} ${draft + 22}`} stroke={C.gold} strokeWidth={4} strokeLinecap="round" /><path d={`M${u * a - 46 + sw} ${draft + 22}l-12 14l14 -2Z`} fill={C.gold} /></g>;
      })}
      {/* water over the hull below the waterline */}
      <path d={`M${-a * 1.1} 2Q${-a * 0.5} ${-4 + Math.sin(f * 0.09) * 2} 0 2T${a * 1.1} 2L${a * 1.1} ${draft + 8}L${-a * 1.1} ${draft + 8}Z`} fill={C.shadow} />
      <rect x={-a * 1.08} y={6} width={a * 2.16} height={4} fill={C.paper} opacity={0.6} />
      <path d={`M${a * 0.96} 0q18 -10 34 2M${a * 1.04} 12q16 -8 30 2`} stroke={C.paper} strokeWidth={3} fill="none" opacity={0.7} />
    </g>
  );
};

/** One sawn board in side view, left end at (x, y) on its lower edge. */
export const Plank: React.FC<{ x: number; y: number; len: number; t?: number; seed?: number; color?: string; angle?: number }> = ({ x, y, len, t = 14, seed = 1, color = C.gold, angle = 0 }) => (
  <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle})`}>
    <rect x={0} y={-t} width={len} height={t} fill={color} />
    <Streaks x={0} y={-t} w={len} h={t * 0.8} seed={seed} count={Math.max(4, Math.round(len / 40))} color={C.earth} opacity={0.5} maxLen={len * 0.4} thick={1.5} />
    <rect x={0} y={-t} width={len} height={Math.max(1.5, t * 0.16)} fill={C.paper} opacity={0.55} />
    <rect x={len - Math.max(3, t * 0.3)} y={-t} width={Math.max(3, t * 0.3)} height={t} fill={C.earth} />
  </g>
);
/** A felled trunk in side view, left end at (x, y) on its lower edge. */
export const Log: React.FC<{ x: number; y: number; len: number; t?: number; seed?: number }> = ({ x, y, len, t = 26, seed = 1 }) => (
  <g>
    <rect x={x} y={y - t} width={len} height={t} rx={t / 2} fill={C.earth} />
    <Streaks x={x + t / 2} y={y - t} w={len - t} h={t * 0.8} seed={seed} count={Math.max(4, Math.round(len / 36))} color={C.shadow} opacity={0.3} maxLen={len * 0.4} thick={2} />
    <ellipse cx={x + len - t * 0.36} cy={y - t / 2} rx={t * 0.36} ry={t / 2} fill={C.gold} />
    <ellipse cx={x + len - t * 0.36} cy={y - t / 2} rx={t * 0.18} ry={t * 0.26} fill="none" stroke={C.earth} strokeWidth={1.6} />
  </g>
);
/** Trunks stacked in side view. Base left at (x, y). */
export const LogPile: React.FC<{ x: number; y: number; len?: number; rows?: number; seed?: number }> = ({ x, y, len = 300, rows = 3, seed = 1 }) => (
  <g>
    {Array.from({ length: rows }, (_, i) => <Log key={i} x={x + i * 16} y={y - i * 25} len={len - i * 30} seed={seed + i} />)}
    <rect x={x - 8} y={y - rows * 25 - 10} width={8} height={rows * 25 + 10} fill={C.shadow} />
  </g>
);
/** Sawn boards stacked with spacers. Base left at (x, y). */
export const PlankStack: React.FC<{ x: number; y: number; len?: number; rows?: number; seed?: number }> = ({ x, y, len = 280, rows = 4, seed = 1 }) => (
  <g>
    {Array.from({ length: rows }, (_, i) => (
      <g key={i}>
        <Plank x={x + (i % 2) * 14} y={y - i * 22} len={len - (i % 2) * 22} t={13} seed={seed + i} color={i % 2 ? C.sand : C.gold} />
        {i < rows - 1 && [0.15, 0.8].map((k) => <rect key={k} x={x + len * k} y={y - i * 22 - 22} width={12} height={9} fill={C.shadow} />)}
      </g>
    ))}
  </g>
);
/** Sawhorse. Top centre at (x, y); `h` down to the ground. */
export const Trestle: React.FC<{ x: number; y: number; h: number }> = ({ x, y, h }) => (
  <g stroke={C.shadow} strokeLinecap="round" fill="none">
    <path d={`M${x - h * 0.34} ${y + h}L${x - 6} ${y + 4}M${x + h * 0.34} ${y + h}L${x + 6} ${y + 4}`} strokeWidth={Math.max(5, h * 0.07)} />
    <path d={`M${x - h * 0.2} ${y + h * 0.6}L${x + h * 0.2} ${y + h * 0.6}`} strokeWidth={Math.max(3, h * 0.045)} />
    <rect x={x - h * 0.2} y={y} width={h * 0.4} height={Math.max(7, h * 0.09)} fill={C.shadow} stroke="none" />
  </g>
);
/** A curved hull rib, cut and waiting. Lower end at (x, y). */
export const RibTimber: React.FC<{ x: number; y: number; h?: number; flip?: boolean }> = ({ x, y, h = 150, flip }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
    <path d={`M0 0Q${h * 0.5} ${-h * 0.25} ${h * 0.42} ${-h}`} stroke={C.gold} strokeWidth={h * 0.085} fill="none" strokeLinecap="round" />
    <path d={`M0 ${-h * 0.03}Q${h * 0.44} ${-h * 0.27} ${h * 0.39} ${-h}`} stroke={C.paper} strokeWidth={1.6} fill="none" opacity={0.6} />
  </g>
);
/** Wood shavings on the ground around (x, y). */
export const Shavings: React.FC<{ x: number; y: number; w?: number; seed?: number }> = ({ x, y, w = 200, seed = 1 }) => {
  const d = useMemo(() => {
    const r = mulberry32(seed * 71 + 9);
    let s = "";
    for (let i = 0; i < Math.round(w / 12); i++) {
      const px = x + (r() - 0.5) * w, py = y + (r() - 0.5) * 18, q = 5 + r() * 6;
      s += `M${px.toFixed(1)} ${py.toFixed(1)}q${q} ${-q} ${q * 1.6} ${-q * 0.2}q${-q * 0.3} ${q * 0.9} ${-q * 0.9} ${q * 0.5}`;
    }
    return s;
  }, [x, y, w, seed]);
  return <path d={d} stroke={C.cream} strokeWidth={3} fill="none" strokeLinecap="round" />;
};
/** Open reed-roofed shelter. Base centre at (x, y). */
export const ReedShed: React.FC<{ x: number; y: number; w?: number; h?: number; seed?: number }> = ({ x, y, w = 280, h = 200, seed = 1 }) => (
  <g>
    {[-0.44, -0.15, 0.15, 0.44].map((k) => <rect key={k} x={x + w * k - 5} y={y - h} width={10} height={h} fill={C.earth} />)}
    <RPoly pts={[[x - w * 0.56, y - h + 6], [x - w * 0.5, y - h - 36], [x + w * 0.5, y - h - 22], [x + w * 0.56, y - h + 14]]} seed={seed} fill={C.gold} amp={2} />
    <Streaks x={x - w * 0.54} y={y - h - 32} w={w * 1.08} h={42} seed={seed + 1} count={Math.round(w / 7)} color={C.earth} opacity={0.55} maxLen={70} thick={3} />
    <Streaks x={x - w * 0.54} y={y - h - 32} w={w * 1.08} h={42} seed={seed + 2} count={Math.round(w / 12)} color={C.paper} opacity={0.5} maxLen={50} thick={2} />
    {Array.from({ length: Math.round(w / 22) }, (_, i) => <rect key={i} x={x - w * 0.52 + i * 22} y={y - h + 8} width={3} height={14 + (i % 3) * 5} fill={C.earth} opacity={0.7} />)}
  </g>
);
/** A clump of papyrus: tall stalks with feathered heads, swaying. Base centre at (x, y). */
export const Reeds: React.FC<{ x: number; y: number; h?: number; n?: number; f?: number; seed?: number; color?: string }> = ({ x, y, h = 220, n = 7, f = 0, seed = 1, color = C.teal }) => {
  const stalks = useMemo(() => {
    const r = mulberry32(seed * 37 + 5);
    return Array.from({ length: n }, (_, i) => ({ dx: (i - (n - 1) / 2) * (h * 0.09) + (r() - 0.5) * 10, hh: h * (0.62 + r() * 0.38), bend: (r() - 0.5) * h * 0.22, ph: r() * 6 }));
  }, [n, h, seed]);
  return (
    <g>
      {stalks.map((s, i) => {
        const sway = Math.sin(f * 0.05 + s.ph) * h * 0.02;
        const tx = x + s.dx + s.bend + sway, ty = y - s.hh;
        return (
          <g key={i}>
            <path d={`M${x + s.dx} ${y}Q${x + s.dx} ${y - s.hh * 0.6} ${tx} ${ty}`} stroke={color} strokeWidth={Math.max(3, h * 0.02)} fill="none" strokeLinecap="round" />
            <path d={[-60, -30, 0, 30, 60].map((d) => `M${tx} ${ty}l${Math.sin((d * Math.PI) / 180) * h * 0.12} ${-Math.cos((d * Math.PI) / 180) * h * 0.12}`).join("")} stroke={i % 2 ? C.gold : color} strokeWidth={Math.max(2, h * 0.012)} strokeLinecap="round" fill="none" />
          </g>
        );
      })}
    </g>
  );
};
