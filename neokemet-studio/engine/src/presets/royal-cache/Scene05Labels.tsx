import React from "react";
import { spring } from "remotion";
import { useSceneFrame } from "../../components/AnimatedScene";
import { Camera, Layer } from "../../components/Camera";
import { CoffinSide } from "../../components/Coffins";
import { RPoly, RRect, Streaks, Stipple } from "../../components/Print";
import { mix, ramp } from "../../lib/anim";
import { C, FPS } from "../../lib/theme";

/** Papyrus docket: no real text, only the gesture of handwriting. */
const Tag: React.FC<{ x: number; y: number; rot: number; t: number; seed: number; linen?: boolean }> = ({ x, y, rot, t, seed, linen }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={Math.min(1, t * 3)}>
    <path d="M0 0Q-14 -34 -4 -62" stroke={C.earth} strokeWidth={2.5} fill="none" />
    <RRect x={-62} y={0} w={124} h={linen ? 58 : 78} seed={seed} fill={linen ? C.cream : C.paper} amp={1.6} stroke={C.gold} strokeWidth={2} />
    <circle cx={0} cy={11} r={4.5} fill={C.shadow} />
    {[24, 37, 50, 63].slice(0, linen ? 2 : 4).map((yy, i) => (
      <path key={i} d={`M-48 ${yy}q8 -5 16 0t16 0t16 0t16 0${i % 2 ? "" : "t16 0t14 0"}`} stroke={C.shadow} strokeWidth={2.4} fill="none" opacity={0.75} />
    ))}
    {!linen && <circle cx={42} cy={62} r={7} fill={C.terra} />}
  </g>
);

const TombIcon: React.FC<{ x: number; y: number; seed: number; final?: boolean; t: number }> = ({ x, y, seed, final, t }) => (
  <g opacity={t} transform={`translate(${x} ${y}) scale(${mix(0.8, 1, t)})`}>
    <RPoly pts={[[-52, 0], [-18, -52], [8, -40], [30, -64], [56, 0]]} seed={seed} fill={final ? C.gold : C.sand} amp={1.8} />
    <RPoly pts={[[30, -64], [56, 0], [22, 0]]} seed={seed + 1} fill={C.teal} amp={1.2} opacity={0.8} />
    <rect x={-12} y={-26} width={20} height={26} fill={C.shadow} />
    <rect x={-16} y={-30} width={28} height={5} fill={C.earth} />
  </g>
);

const A = [236, 1236], B = [520, 1010], Cc = [836, 1196];
const P1 = `M${A[0]} ${A[1] - 40}Q${A[0] + 60} ${B[1] - 30} ${B[0] - 50} ${B[1] - 10}`;
const P2 = `M${B[0] + 50} ${B[1]}Q${Cc[0] - 40} ${B[1] - 20} ${Cc[0] - 14} ${Cc[1] - 74}`;

/** 00:40 — PRESERVING THEIR NAMES. Dockets attach; a dotted journey links three tombs. */
export const Scene05Labels: React.FC = () => {
  const f = useSceneFrame();
  const sp = (from: number) => spring({ frame: f - from, fps: FPS, config: { damping: 16, stiffness: 90, mass: 0.9 } });
  const t1 = sp(22), t2 = sp(50), t3 = sp(74);
  const d1 = ramp(f, 104, 160), d2 = ramp(f, 166, 226);
  const settle = ramp(f, 0, 240);
  return (
    <Camera zoom={mix(1.06, 1.0, settle)} y={mix(-30, 0, settle)} cy={900}>
      <Layer depth={0.9}>
        {/* two coffins on trestles */}
        {[
          { x: 400, y: 590, tone: "gold" as const, seed: 3 },
          { x: 660, y: 800, tone: "earth" as const, seed: 8 },
        ].map((c, i) => (
          <g key={i}>
            <ellipse cx={c.x} cy={c.y + 44} rx={250} ry={12} fill={C.shadow} opacity={0.14} />
            <path d={`M${c.x - 170} ${c.y + 42}l14 -42l14 42M${c.x + 142} ${c.y + 42}l14 -42l14 42`} stroke={C.shadow} strokeWidth={8} fill="none" strokeLinejoin="round" />
            <CoffinSide x={c.x} y={c.y} len={480} tone={c.tone} seed={c.seed} royal={i === 0} flip={i === 1} />
          </g>
        ))}
        <Tag x={mix(1240, 470, t1)} y={mix(480, 562, t1)} rot={mix(24, -5, t1)} t={t1} seed={3} />
        <Tag x={mix(-160, 600, t2)} y={mix(700, 772, t2)} rot={mix(-22, 4, t2)} t={t2} seed={5} />
        <Tag x={mix(1240, 800, t3)} y={mix(640, 770, t3)} rot={mix(20, -3, t3)} t={t3} seed={7} linen />
      </Layer>
      <Layer depth={1}>
        {/* desert map */}
        <RRect x={96} y={900} w={888} h={430} seed={11} fill={C.paperDark} amp={5} step={24} />
        <Streaks x={110} y={916} w={860} h={400} seed={12} count={70} color={C.sand} opacity={0.6} maxLen={200} thick={4} />
        <Stipple x={110} y={916} w={860} h={400} seed={13} count={260} color={C.gold} opacity={0.5} />
        <path d="M130 1300q60 -26 120 0t120 0t120 0t120 0t120 0t120 0t104 0" stroke={C.teal} strokeWidth={5} fill="none" opacity={0.5} />
        <defs>
          <mask id="s5m1" maskUnits="userSpaceOnUse" x={0} y={800} width={1080} height={600}>
            <path d={P1} stroke="#fff" strokeWidth={30} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - d1} />
          </mask>
          <mask id="s5m2" maskUnits="userSpaceOnUse" x={0} y={800} width={1080} height={600}>
            <path d={P2} stroke="#fff" strokeWidth={30} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - d2} />
          </mask>
        </defs>
        {/* linen strip → travel line */}
        <path d={P1} stroke={C.cream} strokeWidth={mix(16, 0, ramp(f, 120, 200))} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - d1} strokeLinecap="round" />
        <path d={P1} stroke={C.shadow} strokeWidth={6} fill="none" strokeDasharray="2 17" strokeLinecap="round" mask="url(#s5m1)" />
        <path d={P2} stroke={C.shadow} strokeWidth={6} fill="none" strokeDasharray="2 17" strokeLinecap="round" mask="url(#s5m2)" />
        <TombIcon x={A[0]} y={A[1]} seed={3} t={ramp(f, 84, 104)} />
        <TombIcon x={B[0]} y={B[1] + 40} seed={5} t={ramp(f, 140, 162)} />
        <TombIcon x={Cc[0]} y={Cc[1]} seed={7} final t={ramp(f, 204, 228)} />
        {/* final hiding place */}
        <circle cx={Cc[0]} cy={Cc[1] - 30} r={mix(40, 86, ramp(f, 222, 262))} fill="none" stroke={C.terra} strokeWidth={5} strokeDasharray="14 9" opacity={ramp(f, 222, 240)} />
      </Layer>
    </Camera>
  );
};
