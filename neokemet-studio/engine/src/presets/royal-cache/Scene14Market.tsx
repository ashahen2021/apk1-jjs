import React from "react";
import { useSceneFrame } from "../../components/AnimatedScene";
import { Camera, Layer } from "../../components/Camera";
import { Figure, GroundShadow } from "../../components/Figures";
import { Cliff, House } from "../../components/Landscape";
import { Ground, RPoly, RRect, Streaks } from "../../components/Print";
import { mix, ramp } from "../../lib/anim";
import { C } from "../../lib/theme";

const Stall: React.FC<{ x: number; y: number; w: number; a: string; b: string; seed: number; f: number }> = ({ x, y, w, a, b, seed, f }) => {
  const n = 6;
  return (
    <g>
      <rect x={x + 8} y={y - 250} width={8} height={250} fill={C.earth} />
      <rect x={x + w - 16} y={y - 250} width={8} height={250} fill={C.earth} />
      {Array.from({ length: n }, (_, i) => {
        const x0 = x - 14 + ((w + 28) * i) / n, x1 = x - 14 + ((w + 28) * (i + 1)) / n;
        const sw = Math.sin(f * 0.07 + i * 0.8 + seed) * 4;
        return <path key={i} d={`M${x0} ${y - 262}L${x1} ${y - 262}L${x1 + 4} ${y - 196 + sw}L${(x0 + x1) / 2 + 2} ${y - 182 + sw}L${x0 + 4} ${y - 196 + sw}Z`} fill={i % 2 ? a : b} />;
      })}
      <RRect x={x - 6} y={y - 96} w={w + 12} h={18} seed={seed} fill={C.earth} amp={1.2} />
      <rect x={x + 6} y={y - 80} width={10} height={80} fill={C.shadow} />
      <rect x={x + w - 16} y={y - 80} width={10} height={80} fill={C.shadow} />
      {/* small wares */}
      {Array.from({ length: 4 }, (_, i) => {
        const px = x + 30 + ((w - 60) * i) / 3;
        return i % 2 ? (
          <path key={i} d={`M${px - 9} ${y - 96}L${px - 6} ${y - 126}L${px + 6} ${y - 126}L${px + 9} ${y - 96}Z`} fill={C.gold} />
        ) : (
          <path key={i} d={`M${px - 12} ${y - 96}Q${px - 16} ${y - 120} ${px - 4} ${y - 128}L${px + 4} ${y - 128}Q${px + 16} ${y - 120} ${px + 12} ${y - 96}Z`} fill={C.teal} />
        );
      })}
    </g>
  );
};

const TRAIL1 = "M430 868Q470 1010 640 1040";
const TRAIL2 = "M620 1180Q470 1290 250 1262";

/** 02:10 — CLUES IN THE MARKET. A papyrus becomes a record; the trail leads to the hills. */
export const Scene14Market: React.FC = () => {
  const f = useSceneFrame();
  const morph = ramp(f, 112, 152);
  const go = ramp(f, 150, 206);
  const t1 = ramp(f, 132, 200), t2 = ramp(f, 204, 262);
  // record card travels along the first trail (quadratic bezier)
  const bz = (t: number) => {
    const u = 1 - t;
    return { x: u * u * 430 + 2 * u * t * 470 + t * t * 640, y: u * u * 868 + 2 * u * t * 1010 + t * t * 1040 };
  };
  const card = bz(go);
  return (
    <Camera zoom={mix(1.05, 1.0, ramp(f, 0, 280))} y={mix(-30, 10, ramp(f, 0, 280))} cy={900}>
      <Layer depth={0.5}>
        <House x={-20} y={640} w={260} h={250} seed={3} color={C.paperDark} />
        <House x={270} y={640} w={210} h={300} seed={5} color={C.sand} dome />
        <House x={520} y={640} w={300} h={230} seed={7} color={C.paperDark} />
        <House x={850} y={640} w={260} h={290} seed={9} color={C.sand} />
        {/* minaret-free skyline: only flat roofs and a palm crown or two */}
      </Layer>
      <Layer depth={0.85}>
        <Ground y={650} seed={3} h={200} dense={0.8} />
        <Stall x={70} y={690} w={280} a={C.teal} b={C.cream} seed={2} f={f} />
        <Stall x={410} y={676} w={250} a={C.terra} b={C.cream} seed={5} f={f} />
        <Stall x={730} y={690} w={280} a={C.gold} b={C.shadow} seed={8} f={f} />
        <GroundShadow x={376} y={704} w={70} />
        <Figure x={370} y={704} h={170} kind="villager" robe={C.teal} dir={1} armF={36 + Math.sin(f * 0.05) * 6} />
        <GroundShadow x={700} y={712} w={70} />
        <Figure x={700} y={712} h={176} kind="villager" robe={C.earth} dir={-1} armF={20} />
        <GroundShadow x={160} y={716} w={64} />
        <Figure x={160} y={716} h={160} kind="worker" dir={1} />
      </Layer>
      <Layer depth={1}>
        {/* cloth on the ground with the funerary papyrus */}
        <RPoly pts={[[250, 790], [640, 776], [690, 900], [210, 916]]} seed={11} fill={C.terra} amp={2.6} />
        <Streaks x={220} y={786} w={460} h={124} seed={12} count={26} color={C.cream} opacity={0.55} maxLen={180} thick={4} />
        <path d="M520 842Q520 814 540 814L548 814Q566 814 566 842L570 884L516 884Z" fill={C.teal} />
        <path d="M596 880L600 838L606 828L614 828L620 838L624 880Z" fill={C.gold} />
        <g opacity={1 - morph * 0.75}>
          <rect x={282} y={812} width={206} height={84} fill={C.cream} stroke={C.gold} strokeWidth={2.5} />
          <rect x={272} y={806} width={12} height={96} fill={C.earth} />
          <rect x={486} y={806} width={12} height={96} fill={C.earth} />
          {[828, 842, 856, 870].map((y, i) => (
            <path key={y} d={`M300 ${y}q7 -5 14 0t14 0t14 0t14 0t14 0${i % 2 ? "t14 0" : ""}`} stroke={C.shadow} strokeWidth={2.2} fill="none" opacity={0.7} />
          ))}
          <path d="M420 830L468 830L468 880L420 880Z" fill={C.sand} />
          <path d="M432 878L436 846Q444 836 452 846L456 878Z" fill={C.teal} />
        </g>
        {/* inscription marks lifting off the papyrus */}
        {Array.from({ length: 7 }, (_, i) => {
          const k = ramp(f, 104 + i * 5, 150 + i * 5);
          return <rect key={i} x={300 + i * 22} y={840 - k * 46 - (i % 3) * 8} width={12} height={3} fill={C.shadow} opacity={Math.sin(k * Math.PI) * 0.8} />;
        })}
        {/* trail of inscriptions → the investigator's desk */}
        <defs>
          <mask id="s14m1" maskUnits="userSpaceOnUse" x={0} y={700} width={1080} height={700}>
            <path d={TRAIL1} stroke="#fff" strokeWidth={30} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - t1} />
          </mask>
          <mask id="s14m2" maskUnits="userSpaceOnUse" x={0} y={700} width={1080} height={700}>
            <path d={TRAIL2} stroke="#fff" strokeWidth={30} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - t2} />
          </mask>
        </defs>
        <path d={TRAIL1} stroke={C.shadow} strokeWidth={6} fill="none" strokeDasharray="2 17" strokeLinecap="round" mask="url(#s14m1)" />
        <path d={TRAIL2} stroke={C.terra} strokeWidth={6} fill="none" strokeDasharray="2 17" strokeLinecap="round" mask="url(#s14m2)" />
        {/* desk */}
        <ellipse cx={760} cy={1296} rx={220} ry={12} fill={C.shadow} opacity={0.14} />
        <RRect x={590} y={1110} w={340} h={22} seed={21} fill={C.earth} amp={1.4} />
        <rect x={606} y={1132} width={14} height={160} fill={C.shadow} />
        <rect x={900} y={1132} width={14} height={160} fill={C.shadow} />
        <rect x={606} y={1132} width={308} height={34} fill={C.gold} />
        <rect x={720} y={1140} width={80} height={18} fill={C.earth} />
        {/* lamp, ledger, inkwell, lens */}
        <path d="M858 1110L866 1066L894 1066L902 1110Z" fill={C.teal} />
        <path d="M872 1066L874 1040L886 1040L888 1066Z" fill={C.cream} stroke={C.sand} strokeWidth={2} />
        <circle cx={880} cy={1050} r={46} fill="#F3C877" opacity={0.25 + Math.sin(f * 0.2) * 0.03} />
        <rect x={770} y={1094} width={70} height={16} fill={C.shadow} />
        <rect x={774} y={1086} width={62} height={9} fill={C.cream} />
        <rect x={738} y={1092} width={18} height={18} fill={C.shadow} />
        <path d="M747 1092L760 1058" stroke={C.earth} strokeWidth={3} strokeLinecap="round" />
        {/* the record card (artifact → paper record) */}
        <g transform={`translate(${card.x} ${card.y}) rotate(${mix(-4, 5, go)})`} opacity={morph}>
          <rect x={-58} y={-40} width={116} height={80} fill={C.cream} stroke={C.shadow} strokeWidth={2.5} />
          <rect x={-48} y={-30} width={36} height={30} fill={C.sand} />
          <path d="M-42 -2L-39 -20Q-30 -28 -21 -20L-18 -2Z" fill={C.teal} />
          {[-24, -12, 0, 14, 26].map((y, i) => (
            <rect key={y} x={i < 3 ? -4 : -48} y={y} width={i < 3 ? 52 : 96 - i * 6} height={3} fill={C.shadow} opacity={0.65} />
          ))}
          <circle cx={40} cy={26} r={7} fill={C.terra} />
        </g>
        <g opacity={ramp(f, 196, 214)} transform="translate(700 1052)">
          <circle r={26} fill={C.cream} opacity={0.5} stroke={C.shadow} strokeWidth={5} />
          <path d="M18 18L44 44" stroke={C.shadow} strokeWidth={8} strokeLinecap="round" />
        </g>
        {/* toward the desert edge and the family's village */}
        <g opacity={ramp(f, 226, 256)}>
          <Cliff id="s14c" x={60} baseY={1270} w={330} h={150} seed={5} strata={false} peak={0.4} />
          <House x={150} y={1290} w={76} h={46} seed={31} color={C.sand} />
          <House x={236} y={1292} w={58} h={36} seed={33} color={C.paperDark} />
          <circle cx={222} cy={1262} r={mix(50, 118, ramp(f, 240, 282))} fill="none" stroke={C.terra} strokeWidth={5} strokeDasharray="14 9" />
        </g>
      </Layer>
    </Camera>
  );
};
