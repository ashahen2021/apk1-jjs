import React from "react";
import { C } from "../lib/theme";
import { CoffinSide, Tone } from "./Coffins";
import { Figure, GroundShadow, walkPhase } from "./Figures";
import { RRect, Streaks } from "./Print";

/** Small grave goods, each drawn around its own base point (0,0). */
export const Ankh: React.FC<{ c?: string }> = ({ c = C.gold }) => (
  <g>
    <path d="M0 -20Q-9 -20 -8 -11Q-7 -4 0 -2Q7 -4 8 -11Q9 -20 0 -20ZM0 -16Q4 -16 4 -11Q4 -7 0 -6Q-4 -7 -4 -11Q-4 -16 0 -16Z" fill={c} fillRule="evenodd" />
    <path d="M-2.5 -3L2.5 -3L3 20L-3 20ZM-12 1L12 1L12 6L-12 6Z" fill={c} />
  </g>
);
export const Scarab: React.FC<{ c?: string }> = ({ c = C.teal }) => (
  <g>
    <ellipse rx={11} ry={15} fill={c} />
    <path d="M-11 -4L11 -4M0 -3L0 15" stroke={C.shadow} strokeWidth={1.6} opacity={0.6} />
    <ellipse cy={-15} rx={6} ry={4} fill={c} />
  </g>
);
export const Djed: React.FC<{ c?: string }> = ({ c = C.terra }) => <path d="M-4 20L-6 -2L-12 -4L-12 -7L12 -7L12 -4L6 -2L4 20ZM-11 -10L11 -10L11 -13L-11 -13ZM-10 -16L10 -16L10 -19L-10 -19Z" fill={c} />;
export const Vase: React.FC<{ c?: string }> = ({ c = C.gold }) => <path d="M-7 -40L7 -40L5 -32Q18 -20 15 -4Q13 0 0 0Q-13 0 -15 -4Q-18 -20 -5 -32Z" fill={c} />;
export const Chest: React.FC<{ c?: string }> = ({ c = C.gold }) => (
  <g>
    <path d="M-30 -34L30 -34L30 0L-30 0Z" fill={c} />
    <path d="M-34 -44L34 -44L30 -34L-30 -34Z" fill={C.earth} />
    <path d="M-22 -26L-8 -26L-8 -8L-22 -8ZM8 -26L22 -26L22 -8L8 -8Z" fill={C.teal} opacity={0.8} />
  </g>
);
export const Statuette: React.FC<{ c?: string }> = ({ c = C.gold }) => <path d="M-6 0L-8 -34L-5 -40Q-8 -50 0 -52Q8 -50 5 -40L8 -34L6 0Z" fill={c} />;

/** Canopic jar with a simple stopper. Base at (0,0), about 90 tall. */
export const CanopicJar: React.FC<{ c?: string; lid?: string }> = ({ c = C.cream, lid = C.teal }) => (
  <g>
    <path d="M-16 0Q-24 -30 -18 -54L18 -54Q24 -30 16 0Z" fill={c} stroke={C.sand} strokeWidth={2} />
    <path d="M-12 -30L12 -30M-10 -20L10 -20" stroke={C.shadow} strokeWidth={2} opacity={0.5} />
    <path d="M-15 -54Q-17 -76 0 -80Q17 -76 15 -54Z" fill={lid} />
    <rect x={-18} y={-58} width={36} height={6} fill={C.gold} />
  </g>
);

/** Seated statue on a throne block. Base at (0,0), about 300 tall. */
export const SeatedStatue: React.FC<{ c?: string }> = ({ c = C.gold }) => (
  <g>
    <path d="M-90 0L-90 -40L90 -40L90 0Z" fill={C.earth} />
    <path d="M-70 -40L-70 -150L-10 -150L-10 -40Z" fill={C.shadow} opacity={0.8} />
    <path d="M-40 -40L-40 -130L50 -130L60 -40Z" fill={c} />
    <path d="M-44 -130L-48 -230L-30 -250L8 -250L20 -230L12 -130Z" fill={c} />
    <path d="M-38 -246L-42 -292Q-40 -318 -12 -320Q16 -318 16 -292L10 -246Z" fill={C.teal} />
    <path d="M-28 -256Q-30 -300 -12 -304Q8 -300 4 -256Z" fill={C.sand} />
    <path d="M12 -200L60 -196L62 -182L12 -180Z" fill={c} />
    <path d="M-44 -236L12 -236L12 -226L-44 -226Z" fill={C.terra} />
    <Streaks x={-90} y={-320} w={180} h={320} seed={5} count={24} color={C.paper} opacity={0.35} maxLen={50} thick={2} />
  </g>
);

export const Obelisk: React.FC<{ h?: number }> = ({ h = 520 }) => (
  <g>
    <path d={`M-34 0L-22 ${-h + 46}L0 ${-h}L22 ${-h + 46}L34 0Z`} fill={C.gold} />
    <path d={`M0 ${-h}L22 ${-h + 46}L34 0L8 0Z`} fill={C.earth} opacity={0.8} />
    <path d={`M-22 ${-h + 46}L0 ${-h}L22 ${-h + 46}Z`} fill={C.sand} />
    {Array.from({ length: 9 }, (_, i) => (
      <rect key={i} x={-12} y={-h + 90 + i * ((h - 150) / 9)} width={i % 2 ? 12 : 16} height={(h - 150) / 14} fill={C.shadow} opacity={0.45} />
    ))}
    <path d="M-56 0L56 0L50 22L-50 22Z" fill={C.earth} />
  </g>
);

/** Open papyrus scroll with the gesture of writing (no real text). Centre at (0,0). */
export const PapyrusScroll: React.FC<{ w?: number; h?: number; unroll?: number }> = ({ w = 520, h = 300, unroll = 1 }) => {
  const ww = w * unroll;
  return (
    <g>
      <rect x={-ww / 2} y={-h / 2} width={ww} height={h} fill={C.cream} stroke={C.gold} strokeWidth={4} />
      {Array.from({ length: 8 }, (_, i) => {
        const y = -h / 2 + 40 + i * ((h - 70) / 8);
        const len = Math.max(0, Math.min(ww - 190, (w - 190) * (0.7 + ((i * 37) % 30) / 100)));
        return <path key={i} d={`M${-ww / 2 + 40} ${y}h${len}`} stroke={C.shadow} strokeWidth={4} strokeDasharray="22 7 9 7 30 9" opacity={0.7} />;
      })}
      {unroll > 0.8 && (
        <g transform={`translate(${ww / 2 - 96} 0)`}>
          <rect x={-52} y={-h / 2 + 30} width={104} height={h - 60} fill={C.sand} />
          <path d={`M-30 ${h / 2 - 32}L-24 -10Q0 -50 24 -10L30 ${h / 2 - 32}Z`} fill={C.teal} />
          <circle cx={0} cy={-h / 2 + 62} r={18} fill={C.terra} />
        </g>
      )}
      <rect x={-ww / 2 - 16} y={-h / 2 - 14} width={20} height={h + 28} rx={6} fill={C.earth} />
      <rect x={ww / 2 - 4} y={-h / 2 - 14} width={20} height={h + 28} rx={6} fill={C.earth} />
    </g>
  );
};

/** Nile sailing boat. */
export const Boat: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s} ${Math.abs(s)})`}>
    <path d="M-60 0Q-40 18 0 18Q40 18 64 -6L40 2L-44 2Z" fill={C.earth} />
    <path d="M-4 2L-4 -78L2 -78L2 2Z" fill={C.shadow} />
    <path d="M2 -76L50 -20L2 -14Z" fill={C.cream} stroke={C.sand} strokeWidth={2} />
    <rect x={-60} y={22} width={130} height={3} fill={C.paper} opacity={0.6} />
  </g>
);

/** Temple column with a lotus capital. Base centre at (x, y). */
export const Column: React.FC<{ x: number; y: number; h: number; w: number; seed: number }> = ({ x, y, h, w, seed }) => (
  <g>
    <RRect x={x - w / 2} y={y - h} w={w} h={h} seed={seed} fill={C.sand} amp={1.6} />
    <RRect x={x + w * 0.16} y={y - h} w={w * 0.34} h={h} seed={seed + 1} fill={C.gold} amp={1.4} opacity={0.85} />
    <path d={`M${x - w * 0.5} ${y - h}Q${x - w * 0.85} ${y - h - 34} ${x - w * 0.72} ${y - h - 62}L${x + w * 0.72} ${y - h - 62}Q${x + w * 0.85} ${y - h - 34} ${x + w * 0.5} ${y - h}Z`} fill={C.sand} />
    <rect x={x - w * 0.72} y={y - h - 62} width={w * 1.44} height={10} fill={C.teal} />
    <rect x={x - w / 2} y={y - h + 16} width={w} height={8} fill={C.terra} opacity={0.8} />
    <rect x={x - w / 2} y={y - h + 30} width={w} height={5} fill={C.teal} />
    <rect x={x - w * 0.62} y={y - 16} width={w * 1.24} height={16} fill={C.gold} />
    <Streaks x={x - w / 2} y={y - h} w={w} h={h} seed={seed + 2} count={14} color={C.paper} opacity={0.45} maxLen={40} thick={2} />
  </g>
);

/** Market stall with a swaying striped awning. */
export const Stall: React.FC<{ x: number; y: number; w: number; a: string; b: string; seed: number; f: number }> = ({ x, y, w, a, b, seed, f }) => (
  <g>
    <rect x={x + 8} y={y - 250} width={8} height={250} fill={C.earth} />
    <rect x={x + w - 16} y={y - 250} width={8} height={250} fill={C.earth} />
    {Array.from({ length: 6 }, (_, i) => {
      const x0 = x - 14 + ((w + 28) * i) / 6, x1 = x - 14 + ((w + 28) * (i + 1)) / 6;
      const sw = Math.sin(f * 0.07 + i * 0.8 + seed) * 4;
      return <path key={i} d={`M${x0} ${y - 262}L${x1} ${y - 262}L${x1 + 4} ${y - 196 + sw}L${(x0 + x1) / 2 + 2} ${y - 182 + sw}L${x0 + 4} ${y - 196 + sw}Z`} fill={i % 2 ? a : b} />;
    })}
    <RRect x={x - 6} y={y - 96} w={w + 12} h={18} seed={seed} fill={C.earth} amp={1.2} />
    <rect x={x + 6} y={y - 80} width={10} height={80} fill={C.shadow} />
    <rect x={x + w - 16} y={y - 80} width={10} height={80} fill={C.shadow} />
    {Array.from({ length: 4 }, (_, i) => {
      const px = x + 30 + ((w - 60) * i) / 3;
      return i % 2 ? <path key={i} d={`M${px - 9} ${y - 96}L${px - 6} ${y - 126}L${px + 6} ${y - 126}L${px + 9} ${y - 96}Z`} fill={C.gold} /> : <path key={i} d={`M${px - 12} ${y - 96}Q${px - 16} ${y - 120} ${px - 4} ${y - 128}L${px + 4} ${y - 128}Q${px + 16} ${y - 120} ${px + 12} ${y - 96}Z`} fill={C.teal} />;
    })}
  </g>
);

/** A coffin on a stable wooden bier, shouldered by four grounded bearers. */
export const Bier: React.FC<{ cx: number; ground: number; h: number; dist: number; tone?: Tone; seed?: number; f: number }> = ({ cx, ground, h, dist, tone = "gold", seed = 5, f }) => {
  const ph = walkPhase(dist, h);
  const poleY = ground - h * 0.79 + Math.abs(Math.sin(ph)) * 1.2;
  const offs = [-1.42, -1.05, 1.05, 1.42];
  const len = h * 2.5;
  return (
    <g>
      {offs.map((o, i) => <GroundShadow key={i} x={cx + o * h + 10} y={ground} w={h * 0.5} />)}
      {[offs[0], offs[2]].map((o, i) => <Figure key={i} x={cx + o * h + h * 0.14} y={ground - 3} h={h * 0.97} kind="bearer" phase={ph + Math.PI * 0.5 + i} armF={168} opacity={0.72} />)}
      <rect x={cx - h * 1.75} y={poleY - 5} width={h * 3.5} height={7} fill={C.earth} />
      <RRect x={cx - len * 0.52} y={poleY - 16} w={len * 1.04} h={12} seed={seed} fill={C.shadow} amp={1} />
      {Array.from({ length: 9 }, (_, i) => {
        const x0 = cx - len * 0.5 + (len * i) / 9;
        const sw = Math.sin(f * 0.12 + i * 0.9) * 3;
        return <path key={i} d={`M${x0} ${poleY - 5}L${x0 + len / 9} ${poleY - 5}L${x0 + len / 18 + sw} ${poleY + h * 0.14}Z`} fill={i % 2 ? C.terra : C.cream} />;
      })}
      <CoffinSide x={cx} y={poleY - 15} len={len} tone={tone} seed={seed} royal />
      {[offs[1], offs[3]].map((o, i) => <Figure key={i} x={cx + o * h} y={ground} h={h} kind="bearer" phase={ph + i * 0.8} armF={166} />)}
    </g>
  );
};
