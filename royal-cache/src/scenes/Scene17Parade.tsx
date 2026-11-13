import React from "react";
import { useSceneFrame } from "../components/AnimatedScene";
import { Camera, Layer } from "../components/Camera";
import { CoffinTop } from "../components/Coffins";
import { Label, REllipse, RPoly, RRect, Rule, Streaks } from "../components/Print";
import { mix, ramp } from "../lib/anim";
import { hash } from "../lib/rng";
import { C } from "../lib/theme";

// the boulevard: cubic bezier, bottom-left → museum forecourt
const P = [[250, 1640], [250, 1180], [800, 1120], [600, 690]] as const;
const bez = (t: number) => {
  const u = 1 - t;
  const b = (i: 0 | 1) => u * u * u * P[0][i] + 3 * u * u * t * P[1][i] + 3 * u * t * t * P[2][i] + t * t * t * P[3][i];
  const d = (i: 0 | 1) => 3 * u * u * (P[1][i] - P[0][i]) + 6 * u * t * (P[2][i] - P[1][i]) + 3 * t * t * (P[3][i] - P[2][i]);
  return { x: b(0), y: b(1), ang: (Math.atan2(d(1), d(0)) * 180) / Math.PI + 90 };
};
const ROAD = `M${P[0][0]} ${P[0][1]}C${P[1][0]} ${P[1][1]} ${P[2][0]} ${P[2][1]} ${P[3][0]} ${P[3][1]}`;

/** Procession vehicle from above: gold carriage bearing one royal coffin. */
const Vehicle: React.FC<{ t: number; seed: number }> = ({ t, seed }) => {
  if (t < -0.05 || t > 1.02) return null;
  const p = bez(Math.max(0, Math.min(1, t)));
  const s = mix(1.15, 0.72, Math.max(0, Math.min(1, t))); // slight recession toward the museum
  return (
    <g transform={`translate(${p.x} ${p.y}) rotate(${p.ang}) scale(${s})`}>
      <rect x={-30} y={-82} width={68} height={170} rx={12} fill={C.night} opacity={0.35} />
      <path d="M-34 -70Q-34 -92 0 -96Q34 -92 34 -70L34 78Q34 88 24 88L-24 88Q-34 88 -34 78Z" fill={C.gold} />
      <path d="M-34 -70Q-34 -92 0 -96Q34 -92 34 -70L34 -58L-34 -58Z" fill={C.shadow} />
      <path d="M-28 -66L0 -86L28 -66L0 -72Z" fill={C.sand} />
      <path d="M-34 -40L-48 -30L-34 -16ZM34 -40L48 -30L34 -16ZM-34 30L-48 40L-34 54ZM34 30L48 40L34 54Z" fill={C.teal} />
      <rect x={-34} y={70} width={68} height={8} fill={C.terra} />
      <rect x={-26} y={-50} width={52} height={114} fill={C.cream} opacity={0.9} />
      <CoffinTop x={0} y={8} h={104} seed={seed} tone={seed % 2 ? "gold" : "teal"} royal />
    </g>
  );
};

/** 02:40 — AN EXTRAORDINARY LEGACY. Cairo, 2021: the Pharaohs' Golden Parade. */
export const Scene17Parade: React.FC = () => {
  const f = useSceneFrame();
  const pull = ramp(f, 0, 96);
  const adv = (f + 6) * 0.00115;
  const leadT = 0.4 + adv;
  const lead = bez(0.4);
  const label = ramp(f, 70, 104);
  return (
    <Camera zoom={mix(3.4, 1, pull)} cx={mix(lead.x, 540, pull)} cy={mix(lead.y, 960, pull)}>
      <Layer depth={1}>
        {/* city blocks, as flat printed shapes */}
        {Array.from({ length: 22 }, (_, i) => {
          const col = i % 4, row = Math.floor(i / 4);
          const x = 40 + col * 262 + (hash(i, 1) - 0.5) * 30;
          const y = 700 + row * 170 + (hash(i, 2) - 0.5) * 24;
          const w = 150 + hash(i, 3) * 70, h = 100 + hash(i, 4) * 46;
          return (
            <g key={i}>
              <RRect x={x} y={y} w={w} h={h} seed={i + 3} fill={[C.paperDark, C.sand, C.paperDark, C.gold][i % 4]} amp={2} opacity={0.9} />
              <Streaks x={x + 8} y={y + 8} w={w - 16} h={h - 16} seed={i + 40} count={9} color={i % 4 === 3 ? C.earth : C.gold} opacity={0.55} maxLen={30} thick={3} />
            </g>
          );
        })}
        {/* boulevard */}
        <path d={ROAD} stroke={C.paper} strokeWidth={268} fill="none" strokeLinecap="round" />
        <path d={ROAD} stroke={C.gold} strokeWidth={240} fill="none" strokeLinecap="butt" />
        <path d={ROAD} stroke={C.shadow} strokeWidth={222} fill="none" strokeLinecap="butt" />
        <path d={ROAD} stroke={C.teal} strokeWidth={222} fill="none" strokeDasharray="3 9" opacity={0.5} />
        <path d={ROAD} stroke={C.sand} strokeWidth={4} fill="none" strokeDasharray="34 30" strokeDashoffset={0} opacity={0.85} />
        {/* lamps along the kerbs */}
        {Array.from({ length: 13 }, (_, i) => {
          const p = bez(i / 12);
          const a = ((p.ang - 90) * Math.PI) / 180;
          const nx = -Math.sin(a), ny = Math.cos(a);
          return [-1, 1].map((sd) => (
            <g key={`${i}${sd}`}>
              <circle cx={p.x + nx * 124 * sd} cy={p.y + ny * 124 * sd} r={20} fill="#F3C877" opacity={0.2 + 0.04 * Math.sin(f * 0.1 + i)} />
              <circle cx={p.x + nx * 124 * sd} cy={p.y + ny * 124 * sd} r={5.5} fill={C.cream} />
            </g>
          ));
        })}
        {/* roundabout with an obelisk, where the route begins */}
        <REllipse cx={250} cy={1600} rx={150} ry={150} seed={5} fill={C.shadow} amp={3} n={30} />
        <REllipse cx={250} cy={1600} rx={84} ry={84} seed={6} fill={C.paperDark} amp={2} />
        <path d="M242 1600L250 1500L258 1600Z" fill={C.earth} />
        {/* museum beyond, in elevation */}
        <RRect x={170} y={640} w={800} h={50} seed={11} fill={C.teal} amp={2} opacity={0.75} />
        <Streaks x={170} y={646} w={800} h={40} seed={12} count={26} color={C.paper} opacity={0.5} maxLen={120} thick={2} />
        <RRect x={250} y={560} w={640} h={92} seed={13} fill={C.sand} amp={1.8} />
        <RRect x={250} y={560} w={640} h={16} seed={14} fill={C.gold} amp={1.2} />
        {Array.from({ length: 16 }, (_, i) => (
          <rect key={i} x={272 + i * 38.6} y={590} width={16} height={62} fill={C.shadow} opacity={0.75} />
        ))}
        <RPoly pts={[[470, 562], [470, 500], [670, 500], [670, 562]]} seed={15} fill={C.paperDark} amp={1.6} />
        <RPoly pts={[[482, 500], [570, 420], [658, 500]]} seed={16} fill={C.teal} amp={1.6} />
        <RPoly pts={[[570, 420], [658, 500], [596, 500]]} seed={17} fill={C.shadow} amp={1.2} opacity={0.6} />
        <Streaks x={482} y={430} w={176} h={70} seed={18} count={14} color={C.paper} opacity={0.5} maxLen={60} thick={2} />
        <rect x={540} y={600} width={60} height={52} fill={C.night} />
        {/* outriders and the procession */}
        {[0.085, 0.055].map((o, k) =>
          [-1, 1].map((sd) => {
            const t = leadT + o;
            if (t > 1) return null;
            const p = bez(t);
            const a = ((p.ang - 90) * Math.PI) / 180;
            return <rect key={`${k}${sd}`} x={p.x - Math.sin(a) * 40 * sd - 5} y={p.y + Math.cos(a) * 40 * sd - 11} width={10} height={22} rx={4} fill={C.cream} transform={`rotate(${p.ang} ${p.x - Math.sin(a) * 40 * sd} ${p.y + Math.cos(a) * 40 * sd})`} />;
          }),
        )}
        {[4, 3, 2, 1, 0].map((i) => (
          <Vehicle key={i} t={leadT - i * 0.185} seed={i + 2} />
        ))}
      </Layer>
      <g opacity={label} transform={`translate(0 ${(1 - label) * 10})`}>
        <Label x={540} y={346} text="2021 — PHARAOHS’ GOLDEN PARADE" size={33} spacing={0.2} weight={600} />
        <Rule x={540} y={374} w={260} t={label} />
      </g>
    </Camera>
  );
};
