import React from "react";
import { useSceneFrame } from "../../components/AnimatedScene";
import { Dust } from "../../components/Atmosphere";
import { Camera, Layer } from "../../components/Camera";
import { CoffinSide } from "../../components/Coffins";
import { Figure } from "../../components/Figures";
import { RPoly, RRect, Streaks, Stipple } from "../../components/Print";
import { mix, ramp } from "../../lib/anim";
import { C } from "../../lib/theme";

const Ankh: React.FC<{ c: string }> = ({ c }) => (
  <g>
    <path d="M0 -20Q-9 -20 -8 -11Q-7 -4 0 -2Q7 -4 8 -11Q9 -20 0 -20ZM0 -16Q4 -16 4 -11Q4 -7 0 -6Q-4 -7 -4 -11Q-4 -16 0 -16Z" fill={c} fillRule="evenodd" />
    <path d="M-2.5 -3L2.5 -3L3 20L-3 20ZM-12 1L12 1L12 6L-12 6Z" fill={c} />
  </g>
);
const Scarab: React.FC<{ c: string }> = ({ c }) => (
  <g>
    <ellipse rx={11} ry={15} fill={c} />
    <path d="M-11 -4L11 -4M0 -3L0 15" stroke={C.shadow} strokeWidth={1.6} opacity={0.6} />
    <ellipse cy={-15} rx={6} ry={4} fill={c} />
  </g>
);
const Djed: React.FC<{ c: string }> = ({ c }) => <path d="M-4 20L-6 -2L-12 -4L-12 -7L12 -7L12 -4L6 -2L4 20ZM-11 -10L11 -10L11 -13L-11 -13ZM-10 -16L10 -16L10 -19L-10 -19Z" fill={c} />;
const Vase: React.FC<{ c: string }> = ({ c }) => <path d="M-7 -40L7 -40L5 -32Q18 -20 15 -4Q13 0 0 0Q-13 0 -15 -4Q-18 -20 -5 -32Z" fill={c} />;
const Chest: React.FC<{ c: string }> = ({ c }) => (
  <g>
    <path d="M-30 -34L30 -34L30 0L-30 0Z" fill={c} />
    <path d="M-34 -44L34 -44L30 -34L-30 -34Z" fill={C.earth} />
    <path d="M-22 -26L-8 -26L-8 -8L-22 -8ZM8 -26L22 -26L22 -8L8 -8Z" fill={C.teal} opacity={0.8} />
  </g>
);
const Statue: React.FC<{ c: string }> = ({ c }) => <path d="M-6 0L-8 -34L-5 -40Q-8 -50 0 -52Q8 -50 5 -40L8 -34L6 0Z" fill={c} />;

const GOLD = [
  { x: 205, y: 1088, S: Vase, s: 1.5 },
  { x: 880, y: 1088, S: Chest, s: 1.5 },
  { x: 275, y: 1088, S: Statue, s: 1.6 },
  { x: 800, y: 1088, S: Vase, s: 1.2 },
  { x: 340, y: 1088, S: Vase, s: 1.05 },
  { x: 740, y: 1088, S: Statue, s: 1.25 },
];
const AMULETS = [
  { S: Ankh, from: [440, 940], to: [300, 1130], rot: 70 },
  { S: Scarab, from: [500, 944], to: [690, 1150], rot: -40 },
  { S: Djed, from: [560, 940], to: [420, 1166], rot: 104 },
  { S: Ankh, from: [620, 940], to: [850, 1140], rot: -80 },
  { S: Scarab, from: [680, 944], to: [560, 1128], rot: 28 },
];

/** 00:10 — THE LOOTED TOMBS. A painted burial chamber dissolves from whole to broken. */
export const Scene02Looted: React.FC = () => {
  const f = useSceneFrame();
  const broke = ramp(f, 60, 250);
  const crack = ramp(f, 62, 168);
  const lid = ramp(f, 150, 200);
  return (
    <Camera zoom={mix(1.0, 1.07, ramp(f, 0, 300))} cy={900}>
      <Layer depth={0.6}>
        {/* papyrus sheet the chamber is painted on */}
        <RRect x={86} y={318} w={908} h={900} seed={21} fill={C.paperDark} amp={5} step={22} />
        <RRect x={118} y={408} w={844} h={690} seed={22} fill={C.sand} amp={2} />
        <Streaks x={118} y={408} w={844} h={690} seed={23} count={90} color={C.paper} opacity={0.4} maxLen={170} thick={3} />
        {[520, 640, 760, 880, 1000].map((y, i) => (
          <rect key={y} x={118} y={y} width={844} height={2} fill={C.gold} opacity={0.5 - i * 0.03} />
        ))}
        {/* frieze */}
        <rect x={118} y={340} width={844} height={62} fill={C.shadow} />
        {Array.from({ length: 21 }, (_, i) => (
          <path key={i} d={`M${130 + i * 40} 396L${142 + i * 40} 352Q${148 + i * 40} 344 ${154 + i * 40} 352L${166 + i * 40} 396Z`} fill={[C.gold, C.terra, C.sand][i % 3]} />
        ))}
        {/* painted wall figures: a faint row of offering bearers */}
        {Array.from({ length: 5 }, (_, i) => (
          <Figure key={i} x={230 + i * 150} y={820} h={170} kind="priest" silhouette={C.gold} opacity={0.35} armF={50} />
        ))}
        {/* thief's shadow leaving at the edge */}
        <g opacity={(1 - ramp(f, 70, 140)) * 0.4}>
          <Figure x={mix(820, 1060, ramp(f, 0, 140))} y={1092} h={560} kind="villager" silhouette={C.shadow} phase={f * 0.11} lean={8} />
        </g>
        {/* fracture crawling across the stone panel */}
        <path
          d="M196 412L250 498L232 560L330 640L372 742L352 800L470 862L520 842L610 930L716 950L760 1040L842 1096"
          fill="none" stroke={C.shadow} strokeWidth={6} strokeLinejoin="bevel" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - crack}
        />
        <path d="M330 640L420 610L452 548M610 930L668 868L730 872" fill="none" stroke={C.shadow} strokeWidth={3.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ramp(f, 120, 190)} />
        <path
          d="M200 412L254 498L236 560L334 640L376 742L356 800L474 862L524 842L614 930L720 950L764 1040L846 1096"
          fill="none" stroke={C.paper} strokeWidth={2} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - crack} opacity={0.8}
        />
        {/* a fallen chip of the panel */}
        <RPoly pts={[[352, 800], [470, 862], [420, 900], [340, 860]]} seed={5} fill={C.paperDark} opacity={ramp(f, 150, 185)} />
      </Layer>
      <Layer depth={1}>
        {/* floor */}
        <RRect x={100} y={1090} w={880} h={110} seed={25} fill={C.earth} amp={3} />
        <Streaks x={100} y={1096} w={880} h={100} seed={26} count={40} color={C.gold} opacity={0.5} maxLen={150} />
        {/* gold objects vanish one by one, leaving ghost outlines */}
        {GOLD.map((g, i) => {
          const gone = ramp(f, 118 + i * 13, 140 + i * 13);
          return (
            <g key={i} transform={`translate(${g.x} ${g.y}) scale(${g.s})`}>
              <g opacity={gone * 0.55} stroke={C.paper} strokeWidth={1.4} strokeDasharray="4 4"><g.S c="none" /></g>
              <g opacity={1 - gone} transform={`translate(0 ${-gone * 10})`}><g.S c={C.gold} /></g>
            </g>
          );
        })}
        {/* bier and coffin */}
        <path d="M300 1090L300 1052L780 1052L780 1090L760 1090L760 1066L320 1066L320 1090Z" fill={C.shadow} />
        <CoffinSide x={540} y={1052} len={470} tone="gold" royal seed={4} lidShift={lid} />
        <path d="M520 1000L534 1022L524 1036L540 1050" stroke={C.shadow} strokeWidth={3.5} fill="none" opacity={ramp(f, 172, 196)} />
        {/* amulets: ordered row → scattered across the floor */}
        {AMULETS.map((a, i) => {
          const t = ramp(f, 190 + i * 9, 228 + i * 9);
          const hop = Math.sin(t * Math.PI) * 26;
          return (
            <g key={i} transform={`translate(${mix(a.from[0], a.to[0], t)} ${mix(a.from[1], a.to[1], t) - hop}) rotate(${a.rot * t}) scale(${mix(0.9, 1.15, t)})`}>
              <a.S c={i % 2 ? C.teal : C.terra} />
            </g>
          );
        })}
        <Stipple x={120} y={1100} w={840} h={90} seed={31} count={Math.round(120 * broke)} color={C.paperDark} opacity={0.8} size={5} />
        <Dust f={f} x={120} y={420} w={840} h={660} seed={3} count={26} color={C.paper} opacity={0.5 * broke} />
      </Layer>
      {/* the undisturbed colours drain away */}
      <Layer depth={0.6}>
        <rect x={100} y={330} width={880} height={880} fill={C.shadow} opacity={0.12 * broke} />
      </Layer>
    </Camera>
  );
};
