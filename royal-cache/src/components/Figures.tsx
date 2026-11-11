import React from "react";
import { C } from "../lib/theme";

export type FigKind = "priest" | "bearer" | "villager" | "worker" | "brugsch" | "kamal";

const LEG = 44; // unit leg length (figure is 100 units tall)
const SWING = 0.4; // max leg swing in radians

/**
 * Walk phase from distance travelled, so stride length matches leg swing and
 * feet do not slide: one half-cycle (π) per stride.
 */
export const walkPhase = (dist: number, h: number) =>
  (Math.PI * dist) / (2 * LEG * (h / 100) * Math.sin(SWING));

/** World position of a hand for an arm angle (deg from straight down, + = forward). */
export const handPos = (x: number, y: number, h: number, dir: number, deg: number, len = 30) => {
  const s = h / 100;
  const a = (deg * Math.PI) / 180;
  return { x: x + dir * Math.sin(a) * len * s, y: y + (-76 + Math.cos(a) * len) * s };
};

const SKIN = C.earth;

/**
 * Small stylised person in profile. No facial detail by design. Feet stay on
 * the ground line `y`: the body is lowered by exactly the amount the swung
 * legs shorten, so both soles always touch.
 */
export const Figure: React.FC<{
  x: number;
  y: number;
  h?: number;
  kind?: FigKind;
  dir?: 1 | -1;
  phase?: number; // walk phase (radians); omit to stand
  armF?: number; // front arm angle, degrees
  armB?: number; // back arm angle, degrees
  lean?: number; // degrees, forward positive
  robe?: string;
  opacity?: number;
  silhouette?: string; // paint everything in one colour (shadows, night)
}> = ({ x, y, h = 120, kind = "priest", dir = 1, phase, armF, armB, lean = 0, robe, opacity, silhouette }) => {
  const s = h / 100;
  const walking = phase !== undefined;
  const a = walking ? SWING * Math.sin(phase as number) : 0;
  const drop = LEG * (1 - Math.cos(a));
  const sway = walking ? Math.sin(phase as number) * 1.6 : 0;
  const aF = armF ?? (walking ? -a * 40 : 4);
  const aB = armB ?? (walking ? a * 40 : -4);
  const foot = (ang: number) => [Math.sin(ang) * LEG, -LEG + Math.cos(ang) * LEG] as const;
  const [f1x, f1y] = foot(a);
  const [f2x, f2y] = foot(-a);
  const arm = (deg: number) => {
    const r = (deg * Math.PI) / 180;
    return [Math.sin(r) * 30, -76 + Math.cos(r) * 30] as const;
  };
  const [hFx, hFy] = arm(aF);
  const [hBx, hBy] = arm(aB);

  const official = kind === "brugsch" || kind === "kamal";
  const col = (c: string) => silhouette ?? c;
  const robeCol =
    robe ??
    { priest: C.cream, bearer: C.cream, villager: C.earth, worker: C.sand, brugsch: C.shadow, kamal: C.teal }[kind];
  const hem = { priest: -15, bearer: -30, villager: -9, worker: -24, brugsch: -38, kamal: -38 }[kind];
  const legCol = official ? C.shadow : SKIN;
  const sleeve = kind === "priest" || kind === "bearer" ? SKIN : robeCol;
  const top = kind === "bearer" ? -52 : -80;

  return (
    <g transform={`translate(${x.toFixed(2)} ${(y + drop * s).toFixed(2)}) scale(${dir * s} ${s}) rotate(${lean})`} opacity={opacity}>
      {/* back arm */}
      <path d={`M0 -76L${hBx} ${hBy}`} stroke={col(sleeve)} strokeWidth={4.4} strokeLinecap="round" opacity={silhouette ? 1 : 0.82} />
      {/* legs + feet */}
      <path d={`M0 ${-LEG}L${f2x} ${f2y - drop}l4 0`} stroke={col(legCol)} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={silhouette ? 1 : 0.85} />
      <path d={`M0 ${-LEG}L${f1x} ${f1y - drop}l4 0`} stroke={col(legCol)} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* bare torso for bearers */}
      {kind === "bearer" && <path d="M-6.5 -80L6.5 -80L6 -50L-6 -50Z" fill={col(SKIN)} />}
      {/* garment with a soft printed shadow edge */}
      {!silhouette && kind !== "bearer" && (
        <path d={`M-5.5 -80L-8 -50L${-12 + sway} ${hem}L${-6 + sway} ${hem}Z`} fill={kind === "priest" ? C.sand : C.shadow} opacity={kind === "priest" ? 1 : 0.35} />
      )}
      <path d={`M-6.5 ${top}L6.5 ${top}L7 -50L${11 + sway} ${hem}L${-10 + sway} ${hem}L-7 -50Z`} fill={col(robeCol)} />
      {!silhouette && kind === "priest" && (
        <>
          <path d="M-6.5 -80L6.5 -80L6.8 -74L-6.8 -74Z" fill={C.teal} />
          <path d="M-6 -72L-2 -72L7 -50L7 -46L3.5 -46Z" fill={C.teal} />
        </>
      )}
      {!silhouette && kind === "bearer" && <path d="M-7 -52L7 -52L7 -47L-7 -47Z" fill={C.teal} />}
      {!silhouette && kind === "villager" && <path d="M-7 -53L7 -53L7 -50L-7 -50Z" fill={C.shadow} opacity={0.45} />}
      {!silhouette && official && <path d="M-1 -80L3 -80L4 -40L0 -40Z" fill={C.paper} opacity={0.5} />}
      {/* neck + head */}
      <path d="M-2.2 -84L2.2 -84L2.2 -79L-2.2 -79Z" fill={col(SKIN)} />
      <circle cx={0.8} cy={-90} r={7} fill={col(SKIN)} />
      {!silhouette && (kind === "villager" || kind === "worker") && (
        <path d="M-7 -91Q-7 -100 1 -100Q9 -100 8.5 -92Q1 -95 -7 -91Z" fill={C.cream} stroke={C.sand} strokeWidth={0.8} />
      )}
      {!silhouette && official && <path d="M-4.5 -95L-3 -103.5L5.5 -103.5L7 -95Z" fill={C.terra} />}
      {!silhouette && kind === "brugsch" && <path d="M1 -86Q5 -80 8 -86L8 -89L1 -88Z" fill={C.shadow} />}
      {/* front arm */}
      <path d={`M0 -76L${hFx} ${hFy}`} stroke={col(sleeve)} strokeWidth={4.6} strokeLinecap="round" />
    </g>
  );
};

/** Goat in profile with a diagonal-pair walk. */
export const Goat: React.FC<{
  x: number;
  y: number;
  size?: number;
  dir?: 1 | -1;
  phase?: number;
  color?: string;
  headDown?: number; // 0..1
  opacity?: number;
}> = ({ x, y, size = 70, dir = 1, phase, color = C.shadow, headDown = 0, opacity }) => {
  const s = size / 70;
  const a = phase === undefined ? 0 : 0.36 * Math.sin(phase);
  const L = 24;
  const drop = L * (1 - Math.cos(a));
  const leg = (hx: number, ang: number, back: boolean) => {
    const fx = hx + Math.sin(ang) * L;
    const fy = -L + Math.cos(ang) * L - drop;
    const kx = hx + Math.sin(ang) * L * 0.5 + (back ? -1.5 : 1.5);
    return `M${hx} ${-L}L${kx} ${-L / 2 - drop / 2}L${fx} ${fy}`;
  };
  const hd = headDown;
  return (
    <g transform={`translate(${x.toFixed(2)} ${(y + drop * s).toFixed(2)}) scale(${dir * s} ${s})`} opacity={opacity}>
      <path d={leg(-15, -a, true) + leg(15, a, false)} stroke={color} strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.75} />
      <path d={leg(-18, a, true) + leg(12, -a, false)} stroke={color} strokeWidth={3.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M-25 -40Q-27 -24 -20 -22L16 -22Q24 -24 23 -40Q10 -47 -8 -45Q-20 -46 -25 -40Z" fill={color} />
      <path d="M-25 -39Q-31 -44 -30 -49" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />
      <g transform={`rotate(${hd * 62} 19 -38)`}>
        <path d="M14 -40L26 -56L33 -56L37 -47L31 -44L26 -36Z" fill={color} />
        <path d="M27 -56Q24 -66 16 -67" stroke={color} strokeWidth={2.6} fill="none" strokeLinecap="round" />
        <path d="M30 -56Q29 -65 22 -69" stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" />
        <path d="M33 -45L33 -39" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </g>
    </g>
  );
};

/** Ground-contact shadow. */
export const GroundShadow: React.FC<{ x: number; y: number; w: number; opacity?: number; skew?: number }> = ({ x, y, w, opacity = 0.22, skew = 0 }) => (
  <ellipse cx={x + skew} cy={y + 2} rx={w / 2} ry={Math.max(2.5, w * 0.07)} fill={C.shadow} opacity={opacity} />
);
