import React from "react";
import { spring } from "remotion";
import { useClock } from "../components/AnimatedScene";
import { Dust, Glow } from "../components/Atmosphere";
import { Camera, Layer } from "../components/Camera";
import { CoffinSide, CoffinTop } from "../components/Coffins";
import { Backdrop, cameraMove, GROUND } from "../components/Environments";
import { Ankh, CanopicJar, Chest, Djed, Obelisk, PapyrusScroll, Scarab, SeatedStatue, Statuette, Vase } from "../components/Objects";
import { Label, RPoly, RRect, Streaks, Stipple } from "../components/Print";
import { mix, pulse, ramp } from "../lib/anim";
import { C } from "../lib/theme";
import { Caption, TemplateProps, TitleBlock } from "./common";

/** One object presented on paper with a soft glow and a slow push. */
export const ArtifactTemplate: React.FC<TemplateProps> = ({ scene, seed }) => {
  const { f, D, p } = useClock();
  const prop = scene.prop ?? "coffin";
  const rise = ramp(f, 0, 40);
  const float = Math.sin(f * 0.035) * 5;
  return (
    <Camera zoom={mix(1.0, 1.1, p)} cy={900}>
      <Layer depth={0.5}>
        <RRect x={150} y={470} w={780} h={800} seed={seed} fill={C.paperDark} amp={5} step={24} opacity={0.75} />
        <Streaks x={150} y={470} w={780} h={800} seed={seed + 1} count={70} color={C.sand} opacity={0.5} maxLen={220} thick={4} />
      </Layer>
      <Layer depth={1}>
        <Glow id={`art${seed}`} x={540} y={860} r={520} f={f} strength={0.5 * rise} />
        <ellipse cx={540} cy={1250} rx={250} ry={22} fill={C.shadow} opacity={0.16} />
        <g opacity={rise} transform={`translate(0 ${(1 - rise) * 30 + float})`}>
          {prop === "coffin" && <CoffinTop x={540} y={860} h={720} seed={seed} tone="gold" royal />}
          {prop === "papyrus" && <g transform="translate(540 860)"><PapyrusScroll w={660} h={380} unroll={ramp(f, 10, 70)} /></g>}
          {prop === "canopic-jars" && [0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(${285 + i * 170} 1230) scale(3)`}><CanopicJar lid={[C.teal, C.gold, C.earth, C.shadow][i]} /></g>
          ))}
          {prop === "amulets" && (
            <>
              <g transform="translate(330 860) scale(7)"><Ankh c={C.gold} /></g>
              <g transform="translate(560 900) scale(7)"><Scarab c={C.teal} /></g>
              <g transform="translate(770 860) scale(7)"><Djed c={C.terra} /></g>
            </>
          )}
          {prop === "statue" && <g transform="translate(540 1240) scale(2.1)"><SeatedStatue /></g>}
          {prop === "obelisk" && <g transform="translate(540 1240) scale(1.35)"><Obelisk /></g>}
          {prop === "chest" && (
            <>
              <g transform="translate(540 1240) scale(5.4)"><Chest /></g>
              <g transform="translate(250 1240) scale(4)"><Vase /></g>
              <g transform="translate(830 1240) scale(3.4)"><Statuette /></g>
            </>
          )}
        </g>
        <Dust f={f} x={160} y={480} w={760} h={760} seed={seed} count={24} color={C.gold} opacity={0.5} />
      </Layer>
      <Caption label={scene.label} sub={scene.sublabel} t={pulse(f, 20, 50, D - 30, D - 6)} />
    </Camera>
  );
};

const GOODS = [
  { x: 150, S: Vase, s: 1.6 }, { x: 930, S: Chest, s: 1.6 }, { x: 240, S: Statuette, s: 1.7 },
  { x: 840, S: Vase, s: 1.3 }, { x: 60, S: Chest, s: 1.2 }, { x: 1010, S: Statuette, s: 1.3 },
];
const SCATTER = [
  { S: Ankh, from: [440, -130], to: [300, 50], rot: 70 }, { S: Scarab, from: [500, -126], to: [700, 66], rot: -40 },
  { S: Djed, from: [560, -130], to: [420, 80], rot: 104 }, { S: Ankh, from: [620, -130], to: [860, 56], rot: -80 }, { S: Scarab, from: [680, -126], to: [560, 44], rot: 28 },
];

/** Painted burial chamber. variant "intact" holds still; "looted" dissolves to broken. */
export const TombInteriorTemplate: React.FC<TemplateProps> = ({ scene, seed }) => {
  const { f, D, p } = useClock();
  const looted = scene.variant === "looted";
  const k = looted ? p : 0; // 0 → 1 over the scene
  const crack = ramp(k, 0.2, 0.56, (t) => t);
  const lid = ramp(k, 0.5, 0.68);
  const G = GROUND;
  return (
    <Camera {...cameraMove(scene.camera ?? "push-in", p)} cy={1000}>
      <Backdrop env="tomb-wall" f={f} seed={seed} />
      <Layer depth={0.7}>
        {looted && (
          <>
            <path d="M196 412L250 498L232 560L330 640L372 742L352 800L470 862L520 842L610 930L716 950L760 1040L842 1196" fill="none" stroke={C.shadow} strokeWidth={6} strokeLinejoin="bevel" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - crack} />
            <path d="M200 412L254 498L236 560L334 640L376 742L356 800L474 862L524 842L614 930L720 950L764 1040L846 1196" fill="none" stroke={C.paper} strokeWidth={2} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - crack} opacity={0.8} />
            <RPoly pts={[[352, 800], [470, 862], [420, 900], [340, 860]]} seed={5} fill={C.paperDark} opacity={ramp(k, 0.5, 0.62)} />
          </>
        )}
      </Layer>
      <Layer depth={1}>
        {GOODS.map((g, i) => {
          const gone = looted ? ramp(k, 0.38 + i * 0.045, 0.46 + i * 0.045) : 0;
          return (
            <g key={i} transform={`translate(${g.x} ${G}) scale(${g.s})`}>
              <g opacity={gone * 0.55} stroke={C.paper} strokeWidth={1.4} strokeDasharray="4 4"><g.S c="none" /></g>
              <g opacity={1 - gone} transform={`translate(0 ${-gone * 10})`}><g.S c={C.gold} /></g>
            </g>
          );
        })}
        <path d={`M300 ${G}L300 ${G - 38}L780 ${G - 38}L780 ${G}L760 ${G}L760 ${G - 24}L320 ${G - 24}L320 ${G}Z`} fill={C.shadow} />
        <CoffinSide x={540} y={G - 38} len={470} tone="gold" royal seed={seed} lidShift={lid} />
        {SCATTER.map((a, i) => {
          const t = looted ? ramp(k, 0.62 + i * 0.03, 0.76 + i * 0.03) : 0;
          return (
            <g key={i} transform={`translate(${mix(a.from[0], a.to[0], t)} ${G + mix(a.from[1], a.to[1], t) - Math.sin(t * Math.PI) * 26}) rotate(${a.rot * t}) scale(${mix(0.9, 1.15, t)})`}>
              <a.S c={i % 2 ? C.teal : C.terra} />
            </g>
          );
        })}
        {!looted && <Glow id={`tomb${seed}`} x={540} y={G - 120} r={520} f={f} strength={0.32} />}
        <Stipple x={-300} y={G + 10} w={1700} h={90} seed={31} count={Math.round(160 * k)} color={C.paperDark} opacity={0.8} size={5} />
        <Dust f={f} x={60} y={430} w={960} h={740} seed={3} count={26} color={C.paper} opacity={0.3 + 0.3 * k} />
      </Layer>
      <Caption label={scene.label} sub={scene.sublabel} t={pulse(f, 20, 50, D - 30, D - 6)} y={300} color={C.cream} />
    </Camera>
  );
};

const SiteIcon: React.FC<{ x: number; y: number; seed: number; final?: boolean; t: number; name?: string }> = ({ x, y, seed, final, t, name }) => (
  <g opacity={t} transform={`translate(${x} ${y}) scale(${mix(0.8, 1, t)})`}>
    <RPoly pts={[[-62, 0], [-22, -62], [10, -48], [36, -76], [66, 0]]} seed={seed} fill={final ? C.gold : C.sand} amp={1.8} />
    <RPoly pts={[[36, -76], [66, 0], [26, 0]]} seed={seed + 1} fill={C.teal} amp={1.2} opacity={0.8} />
    <rect x={-14} y={-30} width={24} height={30} fill={C.shadow} />
    {name && <Label x={0} y={44} text={name.toUpperCase()} size={Math.min(24, 300 / (name.length * 0.8))} spacing={0.14} weight={600} />}
  </g>
);

/** Dotted route drawn between three sites. Sublabel "Site A | Site B | Site C" names them. */
export const MapTemplate: React.FC<TemplateProps> = ({ scene, seed }) => {
  const { f, D, p } = useClock();
  const names = (scene.sublabel ?? "").split("|").map((s) => s.trim());
  const A = [230, 1150], B = [540, 760], Cc = [850, 1090];
  const P1 = `M${A[0]} ${A[1] - 50}Q${A[0] + 60} ${B[1] - 30} ${B[0] - 60} ${B[1] - 10}`;
  const P2 = `M${B[0] + 60} ${B[1]}Q${Cc[0] - 40} ${B[1] - 20} ${Cc[0] - 14} ${Cc[1] - 90}`;
  const d1 = ramp(p, 0.25, 0.5), d2 = ramp(p, 0.52, 0.78);
  const ring = spring({ frame: f - D * 0.8, fps: 30, config: { damping: 14 } });
  return (
    <Camera zoom={mix(1.06, 1.0, p)} cy={900}>
      <Layer depth={1}>
        <RRect x={-300} y={520} w={1680} h={760} seed={seed + 11} fill={C.paperDark} amp={5} step={24} />
        <Streaks x={-290} y={540} w={1660} h={720} seed={seed + 12} count={150} color={C.sand} opacity={0.6} maxLen={220} thick={4} />
        <Stipple x={-290} y={540} w={1660} h={720} seed={seed + 13} count={520} color={C.gold} opacity={0.5} />
        <path d="M-280 1236q60 -26 120 0t120 0t120 0t120 0t120 0t120 0t120 0t120 0t120 0t120 0t120 0t120 0t120 0t96 0" stroke={C.teal} strokeWidth={6} fill="none" opacity={0.5} />
        <defs>
          <mask id={`mp1${seed}`} maskUnits="userSpaceOnUse" x={-300} y={400} width={1700} height={1000}><path d={P1} stroke="#fff" strokeWidth={30} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - d1} /></mask>
          <mask id={`mp2${seed}`} maskUnits="userSpaceOnUse" x={-300} y={400} width={1700} height={1000}><path d={P2} stroke="#fff" strokeWidth={30} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - d2} /></mask>
        </defs>
        <path d={P1} stroke={C.shadow} strokeWidth={7} fill="none" strokeDasharray="2 19" strokeLinecap="round" mask={`url(#mp1${seed})`} />
        <path d={P2} stroke={C.shadow} strokeWidth={7} fill="none" strokeDasharray="2 19" strokeLinecap="round" mask={`url(#mp2${seed})`} />
        <SiteIcon x={A[0]} y={A[1]} seed={3} t={ramp(p, 0.1, 0.22)} name={names[0]} />
        <SiteIcon x={B[0]} y={B[1] + 40} seed={5} t={ramp(p, 0.42, 0.52)} name={names[1]} />
        <SiteIcon x={Cc[0]} y={Cc[1]} seed={7} final t={ramp(p, 0.7, 0.8)} name={names[2]} />
        <circle cx={Cc[0]} cy={Cc[1] - 30} r={mix(50, 104, ring)} fill="none" stroke={C.terra} strokeWidth={5} strokeDasharray="14 9" opacity={Math.min(1, ring * 2)} />
      </Layer>
      <Caption label={scene.label} t={pulse(f, 14, 44, D - 30, D - 6)} />
    </Camera>
  );
};

/** Closing shot: wide landscape, end title, and a credit line that stays legible. */
export const EndCardTemplate: React.FC<TemplateProps> = ({ scene, seed }) => {
  const { f, D, p } = useClock();
  const hold = Math.min(f, D - 50); // last ~1.7 s is a quiet hold
  const credit = scene.sublabel ?? "";
  return (
    <Camera zoom={mix(1.14, 1.0, ramp(p, 0, 0.8))} cy={1040}>
      <Backdrop env={scene.environment ?? "deir-el-bahari"} f={hold} seed={seed} />
      <TitleBlock title={scene.label} t={ramp(f, Math.min(40, D * 0.2), Math.min(84, D * 0.45))} y={470} max={66} />
      {credit && (
        <g opacity={ramp(f, D * 0.45, D * 0.6) * 0.9}>
          <Label x={540} y={1334} text={credit} size={Math.min(24, 960 / (credit.length * 0.5))} spacing={0.04} />
        </g>
      )}
    </Camera>
  );
};
