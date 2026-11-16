import React from "react";
import { mix } from "../lib/anim";
import { C } from "../lib/theme";
import { lineY } from "./Environments";
import { Figure, FigKind, GroundShadow, walkPhase } from "./Figures";
import { Rope, Sledge, WaterJar } from "./Objects";

// Working figures: the original profile figure posed for labour. Every pose is
// the same Figure with arm angles, lean and a held object worked out from the
// hand position, so tools and ropes always sit in the hands.

export type P2 = [number, number];

/** A hand in stage space for a figure standing at (x, y) facing `dir`, with the given lean. */
export const hand = (x: number, y: number, h: number, deg: number, lean: number, dir: 1 | -1 = 1): P2 => {
  const s = h / 100, r = (deg * Math.PI) / 180, l = (lean * Math.PI) / 180;
  const px = Math.sin(r) * 30, py = -76 + Math.cos(r) * 30;
  return [x + dir * (px * Math.cos(l) - py * Math.sin(l)) * s, y + (px * Math.sin(l) + py * Math.cos(l)) * s];
};

/**
 * A loaded sledge and the crew hauling it up the line a→b. The rope runs from
 * the sledge nose through every pair of hands; a man ahead of the sledge wets
 * the track from a jar. `at` is the x of the sledge centre.
 */
export const HaulTeam: React.FC<{ a: P2; b: P2; at: number; n: number; h: number; f: number; sledgeW: number; block: { w: number; h: number }; gap?: number; seed: number; pourer?: boolean }> = ({ a, b, at, n, h, f, sledgeW, block, gap, seed, pourer = true }) => {
  const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  const travel = f * 0.3 * (h / 100);
  const x = at + travel;
  const y = lineY(a, b, x);
  const nose: P2 = [x + sledgeW * 0.56, lineY(a, b, x + sledgeW * 0.56) - sledgeW * 0.1];
  const step = gap ?? h * 0.62;
  const first = x + sledgeW * 0.5 + h * (pourer ? 1.02 : 0.6);
  const LEAN = 21;
  const men = Array.from({ length: n }, (_, i) => {
    const mx = first + i * step;
    return { x: mx, y: lineY(a, b, mx), phase: walkPhase(travel, h) + i * 1.7 };
  });
  const rope: P2[] = [nose, ...men.map((m) => hand(m.x, m.y, h, 72, LEAN))];
  const last = rope[rope.length - 1];
  rope.push([last[0] + h * 0.34, last[1] + h * 0.1]);
  const px = x + sledgeW * 0.5 + h * 0.42, py = lineY(a, b, px);
  const pour = (Math.sin(f * 0.12) + 1) / 2;
  return (
    <g>
      {/* wet track ahead of the runners */}
      {pourer && <path d={`M${x + sledgeW * 0.3} ${lineY(a, b, x + sledgeW * 0.3) - 1}L${px + h * 0.3} ${lineY(a, b, px + h * 0.3) - 1}`} stroke={C.teal} strokeWidth={Math.max(4, h * 0.05)} strokeLinecap="round" opacity={0.55} />}
      <Sledge x={x} y={y} w={sledgeW} angle={ang} seed={seed} block={block} />
      {men.map((m, i) => <GroundShadow key={`s${i}`} x={m.x + 6} y={m.y} w={h * 0.4} />)}
      {/* far arms and bodies first, rope over them, so the hands read as gripping */}
      {men.map((m, i) => <Figure key={i} x={m.x} y={m.y} h={h} kind="bearer" phase={m.phase} lean={LEAN} armF={72} armB={58} />)}
      <Rope pts={rope} sag={h * 0.012} width={Math.max(3, h * 0.035)} />
      {pourer && (
        <g>
          <GroundShadow x={px} y={py} w={h * 0.4} />
          <Figure x={px} y={py} h={h * 0.96} kind="bearer" dir={-1} lean={16} armF={mix(48, 62, pour)} armB={40} />
          <g transform={`translate(${px - h * 0.2} ${py - h * 0.5}) rotate(${mix(-104, -124, pour)}) scale(${h / 250})`}><WaterJar c={C.terra} /></g>
          {[0, 1, 2].map((k) => {
            const t = (f * 0.05 + k / 3) % 1;
            return <circle key={k} cx={px - h * 0.4 - t * h * 0.04} cy={py - h * 0.4 + t * h * 0.38} r={Math.max(2, h * 0.018)} fill={C.teal} opacity={0.85 * (1 - t)} />;
          })}
        </g>
      )}
    </g>
  );
};

export type HeldTool = "mallet" | "adze" | "axe" | "saw" | "chisel" | "pounder" | "polisher";
/** Tools drawn for the hand: grip at (0,0), working end up the shaft (−y). Figure units (a figure is 100 tall). */
const HELD: Record<HeldTool, React.ReactNode> = {
  mallet: <g><path d="M-1.4 4L1.4 4L1.2 -20L-1.2 -20Z" fill={C.earth} /><path d="M-6 -29Q0 -32 6 -29L5 -19L-5 -19Z" fill={C.gold} stroke={C.earth} strokeWidth={0.6} /></g>,
  adze: <g><path d="M-1.3 4L1.3 4L1.6 -24L-1.2 -25Z" fill={C.earth} /><path d="M-1.2 -25L2 -24L13 -18L12 -14L1 -20Z" fill={C.terra} /></g>,
  axe: <g><path d="M-1.3 4L1.3 4L1.3 -27L-1.3 -27Z" fill={C.earth} /><path d="M1 -26L10 -29Q13 -22 10 -15L1 -18Z" fill={C.terra} /></g>,
  saw: <g><path d="M-1.6 5L1.6 5L1.6 -5L-1.6 -5Z" fill={C.earth} /><path d="M-1.2 -5L1.6 -5L2.6 -36L0.4 -37Z" fill={C.terra} /><path d="M2.6 -36L1.6 -5" stroke={C.shadow} strokeWidth={0.9} strokeDasharray="1.2 1.2" /></g>,
  chisel: <g><path d="M-1.2 3L1.2 3L1 -8L-1 -8Z" fill={C.earth} /><path d="M-1 -8L1 -8L1.6 -17L-1.6 -17Z" fill={C.terra} /></g>,
  // dolerite pounding ball, held in both hands
  pounder: <g><circle cx={0} cy={-1} r={6.4} fill={C.shadow} /><path d="M-3.6 -4.2Q-0.5 -6.6 3 -4.6" stroke={C.teal} strokeWidth={1.4} fill="none" strokeLinecap="round" /></g>,
  // flat rubbing stone for dressing a surface
  polisher: <g><path d="M-7 -1.5Q-7 -4.5 -3 -4.5L4 -4.5Q7.5 -4.5 7.5 -1.5L7.5 2L-7 2Z" fill={C.paperDark} stroke={C.earth} strokeWidth={0.9} /></g>,
};
/** Arm swing and tool tilt for each tool: [arm raised, arm struck, tilt raised, tilt struck, strokes per frame]. */
const SWING: Record<HeldTool, [number, number, number, number, number]> = {
  mallet: [128, 74, -24, 78, 0.2],
  adze: [112, 46, 12, 132, 0.17],
  axe: [136, 62, -30, 96, 0.14],
  saw: [74, 52, 140, 140, 0.3],
  chisel: [66, 62, 60, 60, 0.2],
  pounder: [146, 36, 0, 0, 0.17],
  polisher: [62, 34, 0, 0, 0.24],
};
/** Tools worked with both hands: the back arm follows the front one. */
const TWO_HANDED: readonly HeldTool[] = ["saw", "chisel", "pounder", "polisher"];

/**
 * A figure at work with a tool in its front hand. The stroke is a quick blow
 * and a slower lift; `k` offsets the rhythm so a gang does not move in step.
 */
export const ToolWorker: React.FC<{ x: number; y: number; h: number; f: number; tool: HeldTool; dir?: 1 | -1; k?: number; kind?: FigKind; lean?: number; shadow?: boolean }> = ({ x, y, h, f, tool, dir = 1, k = 0, kind = "bearer", lean = 9, shadow = true }) => {
  const [a0, a1, t0, t1, speed] = SWING[tool];
  const c = (f * speed + k) % (Math.PI * 2);
  const s = Math.pow((Math.sin(c) + 1) / 2, 2.2); // dwell raised, strike fast
  const armF = mix(a0, a1, s), tilt = mix(t0, t1, s);
  const [hx, hy] = hand(x, y, h, armF, lean, dir);
  return (
    <g>
      {shadow && <GroundShadow x={x + dir * 6} y={y} w={h * 0.4} />}
      <Figure x={x} y={y} h={h} kind={kind} dir={dir} lean={lean} armF={armF} armB={TWO_HANDED.includes(tool) ? armF - 14 : 24} />
      <g transform={`translate(${hx.toFixed(1)} ${hy.toFixed(1)}) scale(${(dir * h) / 100} ${h / 100}) rotate(${tilt.toFixed(1)})`}>{HELD[tool]}</g>
    </g>
  );
};

/**
 * Two (or more) figures walking with a long load on their shoulders: a plank,
 * a log, a mast. The load is drawn by `children` in a box `len` wide whose
 * left end is at (0,0) at shoulder height.
 */
export const Carriers: React.FC<{ x: number; y: number; h: number; f: number; len: number; n?: number; dir?: 1 | -1; speed?: number; children: React.ReactNode }> = ({ x, y, h, f, len, n = 2, dir = 1, speed = 0.5, children }) => {
  const travel = f * speed * (h / 100);
  const x0 = x + dir * travel;
  const bob = Math.abs(Math.sin(walkPhase(travel, h))) * h * 0.012;
  const xs = Array.from({ length: n }, (_, i) => x0 + (n === 1 ? len / 2 : len * 0.14 + (i * len * 0.72) / (n - 1)));
  return (
    <g>
      {xs.map((mx, i) => <GroundShadow key={`s${i}`} x={mx + 6} y={y} w={h * 0.4} />)}
      {xs.map((mx, i) => <Figure key={i} x={mx} y={y} h={h} kind="bearer" dir={dir} phase={walkPhase(travel, h) + i * 1.5} armF={150} armB={-8} lean={3} />)}
      <g transform={`translate(${x0.toFixed(1)} ${(y - h * 0.83 - bob).toFixed(1)})`}>{children}</g>
    </g>
  );
};

/**
 * A gang pulling a rope fixed at `anchor`: they stand in a line from `x`,
 * leaning away from the anchor with both hands on the rope, heaving in time.
 */
export const RopeGang: React.FC<{ anchor: P2; x: number; y: number; h: number; n: number; f: number; gap?: number; dir?: 1 | -1 }> = ({ anchor, x, y, h, n, f, gap, dir = 1 }) => {
  const heave = (Math.sin(f * 0.11) + 1) / 2;
  const lean = mix(-14, -27, heave);
  const step = gap ?? h * 0.55;
  // dir is the way the gang faces (toward the anchor); they lean back from it
  const men = Array.from({ length: n }, (_, i) => ({ x: x - dir * i * step - dir * heave * h * 0.05, y }));
  const pts: P2[] = [anchor, ...men.map((m) => hand(m.x, m.y, h, 64, lean, dir))];
  const last = pts[pts.length - 1];
  pts.push([last[0] - dir * h * 0.3, last[1] + h * 0.16]);
  return (
    <g>
      {men.map((m, i) => <GroundShadow key={`s${i}`} x={m.x - dir * 8} y={m.y} w={h * 0.42} />)}
      {men.map((m, i) => <Figure key={i} x={m.x} y={m.y} h={h} kind="bearer" dir={dir} lean={lean} armF={64} armB={50} />)}
      <Rope pts={pts} sag={h * 0.01} width={Math.max(3, h * 0.032)} />
    </g>
  );
};
