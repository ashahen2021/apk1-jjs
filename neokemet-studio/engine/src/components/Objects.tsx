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

// ---- Construction: stone, sledges, rope, tools, barges --------------------
// Same print language as everything above: rough-edged flat shapes, dry-brush
// streaks, palette colours only. Each piece is drawn around its own base point.

/** Dressed limestone block. Base centre at (x, y). */
export const StoneBlock: React.FC<{ x: number; y: number; w?: number; h?: number; seed?: number; color?: string; shade?: string }> = ({ x, y, w = 120, h = 80, seed = 1, color = C.cream, shade = C.sand }) => (
  <g>
    <RRect x={x - w / 2} y={y - h} w={w} h={h} seed={seed} fill={color} amp={1.6} />
    <RRect x={x + w * 0.22} y={y - h} w={w * 0.28} h={h} seed={seed + 1} fill={shade} amp={1.2} opacity={0.75} />
    <rect x={x - w / 2} y={y - h * 0.16} width={w} height={h * 0.16} fill={C.gold} opacity={0.35} />
    <Streaks x={x - w / 2} y={y - h} w={w} h={h * 0.9} seed={seed + 2} count={Math.max(6, Math.round(w / 12))} color={C.gold} opacity={0.4} maxLen={w * 0.5} thick={2} />
    <path d={`M${x - w / 2} ${y - h}h${w}`} stroke={C.paper} strokeWidth={3} opacity={0.7} />
  </g>
);

/** Twisted rope through the given points, with a little sag between them. */
export const Rope: React.FC<{ pts: [number, number][]; sag?: number; width?: number; color?: string }> = ({ pts, sag = 6, width = 5, color = C.shadow }) => {
  if (pts.length < 2) return null;
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    d += `Q${((ax + bx) / 2).toFixed(1)} ${((ay + by) / 2 + sag).toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
  }
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke={color} strokeWidth={width} />
      <path d={d} stroke={C.sand} strokeWidth={width * 0.45} strokeDasharray={`${width * 0.9} ${width * 1.6}`} opacity={0.75} />
    </g>
  );
};

/**
 * Wooden sledge in side view with an upturned runner, optionally carrying a
 * lashed block. Runner bottom centre at (x, y); `angle` tilts it onto a slope
 * (degrees, negative = climbing to the right). The front is on the right.
 */
export const Sledge: React.FC<{ x: number; y: number; w?: number; angle?: number; seed?: number; block?: { w: number; h: number } | null }> = ({ x, y, w = 220, angle = 0, seed = 1, block = { w: 150, h: 96 } }) => {
  const r = w / 2, t = Math.max(8, w * 0.055);
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(2)})`}>
      <ellipse cx={0} cy={3} rx={r * 1.05} ry={Math.max(4, w * 0.03)} fill={C.shadow} opacity={0.2} />
      {/* runner with the characteristic upturned nose */}
      <path d={`M${-r} 0L${r - t * 2} 0Q${r + t * 0.6} 0 ${r + t * 1.5} ${-t * 2.4}L${r + t * 0.3} ${-t * 2.4}Q${r - t * 0.2} ${-t} ${r - t * 2.2} ${-t}L${-r} ${-t}Z`} fill={C.earth} />
      <path d={`M${-r} ${-t}L${r - t * 2.2} ${-t}`} stroke={C.gold} strokeWidth={2} opacity={0.7} />
      {/* cross-beam ends */}
      {[-0.72, -0.24, 0.24, 0.66].map((k, i) => <rect key={i} x={r * k - t * 0.55} y={-t * 2.05} width={t * 1.1} height={t * 1.1} fill={C.shadow} />)}
      {block && (
        <g>
          <StoneBlock x={-r * 0.08} y={-t * 2.05} w={block.w} h={block.h} seed={seed + 3} />
          {/* lashings over the load */}
          {(w >= 100 ? [-0.3, 0.26] : []).map((k, i) => (
            <path key={i} d={`M${-r * 0.08 + block.w * k} ${-t * 1.2}L${-r * 0.08 + block.w * k} ${-t * 2.05 - block.h - 2}`} stroke={C.shadow} strokeWidth={Math.max(1.2, w * 0.016)} opacity={0.8} />
          ))}
          <path d={`M${-r * 0.08 - block.w / 2 - 2} ${-t * 2.05 - block.h * 0.62}h${block.w + 4}`} stroke={C.shadow} strokeWidth={Math.max(1, w * 0.013)} opacity={0.6} />
        </g>
      )}
    </g>
  );
};

/** Wooden mallet lying on the ground. Base centre at (0,0). */
export const Mallet: React.FC = () => (
  <g>
    <path d="M-34 -6L14 -10L14 -3L-34 -1Z" fill={C.earth} />
    <path d="M10 -24Q30 -28 34 -12Q32 2 12 0Z" fill={C.gold} />
    <path d="M14 -20Q26 -22 29 -12" stroke={C.paper} strokeWidth={2} fill="none" opacity={0.5} />
  </g>
);
/** Copper chisel. Base centre at (0,0). */
export const Chisel: React.FC = () => (
  <g>
    <path d="M-26 -5L4 -7L4 -1L-26 -1Z" fill={C.earth} />
    <path d="M4 -8L30 -5L34 -3L4 0Z" fill={C.terra} />
  </g>
);
/** Water jar, used to wet the track ahead of a sledge. Base centre at (0,0). */
export const WaterJar: React.FC<{ c?: string }> = ({ c = C.terra }) => (
  <g>
    <path d="M-8 -52L8 -52L7 -44Q22 -30 17 -8Q14 0 0 0Q-14 0 -17 -8Q-22 -30 -7 -44Z" fill={c} />
    <rect x={-10} y={-56} width={20} height={6} fill={C.earth} />
    <path d="M-12 -28Q0 -22 12 -28" stroke={C.cream} strokeWidth={3} fill="none" opacity={0.7} />
  </g>
);
/** Woven basket of rubble. Base centre at (0,0). */
export const Basket: React.FC = () => (
  <g>
    <path d="M-26 -30L26 -30L19 0L-19 0Z" fill={C.gold} />
    <path d="M-24 -22L24 -22M-22 -13L22 -13M-20 -5L20 -5" stroke={C.earth} strokeWidth={2.4} opacity={0.75} />
    <path d="M-24 -30Q-12 -44 0 -38Q12 -46 24 -30Z" fill={C.paperDark} />
  </g>
);
/** Coil of spare rope. Centre at (0,0). */
export const RopeCoil: React.FC = () => (
  <g fill="none" stroke={C.shadow}>
    <ellipse cx={0} cy={-8} rx={30} ry={10} strokeWidth={5} />
    <ellipse cx={0} cy={-13} rx={24} ry={8} strokeWidth={4.5} opacity={0.85} />
    <ellipse cx={0} cy={-18} rx={17} ry={6} strokeWidth={4} opacity={0.7} />
    <path d="M26 -6Q44 -2 52 4" strokeWidth={4.5} strokeLinecap="round" />
  </g>
);
/** Stack of roller timbers seen end-on. Base centre at (0,0). */
export const TimberStack: React.FC = () => (
  <g>
    {[[-28, -13], [0, -13], [28, -13], [-14, -36], [14, -36], [0, -59]].map(([cx, cy], i) => (
      <g key={i}>
        <circle cx={cx} cy={cy} r={13} fill={C.earth} />
        <circle cx={cx} cy={cy} r={7} fill="none" stroke={C.gold} strokeWidth={2} opacity={0.7} />
      </g>
    ))}
  </g>
);
/** Long lever on a stone fulcrum. Base centre at (0,0). */
export const Lever: React.FC = () => (
  <g>
    <path d="M-12 0L-6 -16L8 -16L14 0Z" fill={C.paperDark} stroke={C.sand} strokeWidth={1.5} />
    <path d="M-70 -4L74 -40L76 -34L-68 2Z" fill={C.earth} />
  </g>
);

/** Adze lying on the ground. Base centre at (0,0). */
export const AdzeTool: React.FC = () => (
  <g>
    <path d="M-40 -4L30 -12L31 -6L-40 2Z" fill={C.earth} />
    <path d="M26 -14L34 -12L44 12L36 14L24 -6Z" fill={C.terra} />
  </g>
);
/** Pull saw lying on the ground. Base centre at (0,0). */
export const SawTool: React.FC = () => (
  <g>
    <path d="M-44 -9L-22 -11L-22 -1L-44 -1Z" fill={C.earth} />
    <path d="M-22 -11L44 -8L46 -3L-22 0Z" fill={C.terra} />
    <path d="M-20 1L44 -2" stroke={C.shadow} strokeWidth={2.4} strokeDasharray="3 3" />
  </g>
);

export type ToolSet = "masons" | "haulers" | "quarry" | "shipwrights";
/**
 * A working kit laid out on the ground, left to right from (x, y).
 * `set` picks which pieces appear, so two scenes need not show the same kit.
 */
export const ToolKit: React.FC<{ x: number; y: number; s?: number; set?: ToolSet }> = ({ x, y, s = 1, set = "haulers" }) => {
  const pieces: Record<ToolSet, React.ReactNode[]> = {
    haulers: [<RopeCoil key="a" />, <WaterJar key="b" />, <TimberStack key="c" />, <Lever key="d" />],
    masons: [<Mallet key="a" />, <Chisel key="b" />, <Basket key="c" />, <WaterJar key="d" c={C.gold} />],
    quarry: [<Basket key="a" />, <Mallet key="b" />, <Chisel key="c" />, <Lever key="d" />],
    shipwrights: [<AdzeTool key="a" />, <SawTool key="b" />, <Mallet key="c" />, <RopeCoil key="d" />],
  };
  const offsets: Record<ToolSet, number[]> = { haulers: [0, 92, 178, 310], masons: [0, 86, 160, 236], quarry: [0, 84, 160, 270], shipwrights: [0, 104, 200, 290] };
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {pieces[set].map((p, i) => <g key={i} transform={`translate(${offsets[set][i]} 0)`}>{p}</g>)}
    </g>
  );
};

/** River barge carrying a lashed block, with a steering oar. Waterline centre at (x, y). */
export const StoneBarge: React.FC<{ x: number; y: number; s?: number; seed?: number }> = ({ x, y, s = 1, seed = 1 }) => (
  <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s})`}>
    <path d="M-210 -8Q-190 30 -120 34L130 34Q196 30 232 -30L190 -8Z" fill={C.earth} />
    <path d="M-204 -8L190 -8" stroke={C.gold} strokeWidth={4} opacity={0.7} />
    <path d="M232 -30Q244 -46 238 -62" stroke={C.earth} strokeWidth={9} fill="none" strokeLinecap="round" />
    <path d="M-210 -8Q-226 -26 -220 -44" stroke={C.earth} strokeWidth={9} fill="none" strokeLinecap="round" />
    {/* deck beams, then the load */}
    <rect x={-96} y={-20} width={200} height={12} fill={C.shadow} />
    <StoneBlock x={4} y={-20} w={150} h={84} seed={seed + 2} />
    <path d="M-52 -20L-52 -106M58 -20L58 -106M-72 -74L80 -74" stroke={C.shadow} strokeWidth={3.5} opacity={0.75} />
    {/* steering oar */}
    <path d="M-150 -70L-232 30" stroke={C.shadow} strokeWidth={6} strokeLinecap="round" />
    <path d="M-232 30l-14 26l22 -6Z" fill={C.shadow} />
    <rect x={-230} y={40} width={480} height={4} fill={C.paper} opacity={0.6} />
  </g>
);
