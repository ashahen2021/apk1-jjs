import React from "react";
import { useSceneFrame } from "../../components/AnimatedScene";
import { Birds, SandDrift } from "../../components/Atmosphere";
import { Camera, Layer } from "../../components/Camera";
import { Figure, Goat, GroundShadow, walkPhase } from "../../components/Figures";
import { Cliff, House, Palm } from "../../components/Landscape";
import { Ground, RPoly, Streaks } from "../../components/Print";
import { alongPath, lin, mix, ramp } from "../../lib/anim";
import { C } from "../../lib/theme";

const BRANCH: [number, number][] = [[690, 1212], [800, 1170], [900, 1104], [1010, 1052], [1140, 1012]];

/** 01:40 — THE FAMILY. A nineteenth-century village below the foothills. */
export const Scene11Family: React.FC = () => {
  const f = useSceneFrame();
  const V = 1.35;
  const d = (f + 30) * V;
  const G = 1216;
  // the lone figure leaves the group at the fork
  const forkAt = (690 - 520) / V - 30;
  const bt = lin(f, forkAt, forkAt + 330);
  const b = alongPath(BRANCH, bt);
  const onBranch = f >= forkAt;
  const loneX = onBranch ? b.x : 520 + d;
  const loneY = onBranch ? b.y : G;
  const loneH = mix(150, 104, onBranch ? ramp(f, forkAt, forkAt + 230, (t) => t) : 0);
  const gt = lin(f, forkAt - 34, forkAt + 250);
  const g = alongPath(BRANCH, gt);
  const goatOn = f >= forkAt - 34;
  return (
    <Camera x={mix(0, 170, ramp(f, 0, 300, (t) => t))} cy={1100} zoom={1.02}>
      <Layer depth={0.14}>
        <Birds f={f} x={420} y={520} seed={9} count={3} speed={0.4} />
      </Layer>
      <Layer depth={0.3}>
        <Cliff id="s11c" x={-200} baseY={966} w={1900} h={390} seed={13} color={C.sand} shade={C.gold} scree={C.paperDark} peak={0.72} peakiness={0.4} />
      </Layer>
      <Layer depth={0.6}>
        <Ground y={1030} seed={3} h={120} dense={0.7} />
        <House x={40} y={1040} w={200} h={130} seed={3} color={C.gold} />
        <House x={226} y={1046} w={150} h={96} seed={5} color={C.sand} dome />
        <House x={420} y={1040} w={230} h={150} seed={7} color={C.gold} />
        <House x={640} y={1046} w={130} h={90} seed={9} color={C.sand} />
        <House x={1080} y={1040} w={190} h={120} seed={11} color={C.gold} dome />
        {/* dovecote tower */}
        <RPoly pts={[[350, 1046], [362, 900], [402, 900], [414, 1046]]} seed={15} fill={C.paperDark} />
        <Streaks x={356} y={910} w={54} h={120} seed={16} count={14} color={C.shadow} opacity={0.6} maxLen={8} thick={3} />
      </Layer>
      <Layer depth={0.75}>
        <Palm x={300} y={1070} h={330} f={f} seed={4} lean={18} />
        <Palm x={830} y={1074} h={400} f={f} seed={7} lean={-22} />
        <Palm x={900} y={1080} h={270} f={f} seed={9} lean={14} />
      </Layer>
      <Layer depth={1}>
        <Ground y={1200} seed={11} dense={1.2} />
        {/* the rough path and the fork toward the cliffs */}
        <RPoly pts={[[-200, 1200], [1500, 1200], [1500, 1240], [-200, 1240]]} seed={21} fill={C.paperDark} amp={4} step={30} />
        <RPoly pts={[[650, 1206], [800, 1150], [900, 1088], [1010, 1036], [1150, 996], [1150, 1022], [1014, 1064], [912, 1118], [820, 1184], [740, 1236]]} seed={22} fill={C.paperDark} amp={3} />
        <Streaks x={-200} y={1204} w={1700} h={34} seed={23} count={50} color={C.sand} opacity={0.6} maxLen={140} thick={3} />
        {/* family group */}
        {[
          { x: 250, kind: "villager" as const, robe: C.teal, h: 150 },
          { x: 150, kind: "villager" as const, robe: C.gold, h: 132 },
        ].map((p, i) => (
          <g key={i}>
            <GroundShadow x={p.x + d + 8} y={G} w={64} />
            <Figure x={p.x + d} y={G} h={p.h} kind={p.kind} robe={p.robe} phase={walkPhase(d, p.h) + i * 1.3} />
          </g>
        ))}
        {/* walking staff */}
        <path d={`M${250 + d + 26} ${G - 96}L${250 + d + 34} ${G}`} stroke={C.shadow} strokeWidth={4} strokeLinecap="round" />
        {[
          { x: 340, s: 70, c: C.shadow },
          { x: 410, s: 58, c: C.earth },
          { x: 60, s: 64, c: C.cream },
        ].map((q, i) => (
          <g key={i}>
            <GroundShadow x={q.x + d} y={G + 4} w={56} />
            <Goat x={q.x + d} y={G + 4} size={q.s} color={q.c} phase={(d / 11) * (70 / q.s) + i * 2} />
          </g>
        ))}
        {/* the wandering goat and the one who follows it */}
        <GroundShadow x={goatOn ? g.x : 600 + d} y={goatOn ? g.y : G} w={50} />
        <Goat x={goatOn ? g.x : 600 + d} y={goatOn ? g.y : G} size={mix(62, 46, goatOn ? gt : 0)} color={C.shadow} phase={(goatOn ? g.dist : d) / 9} />
        <GroundShadow x={loneX + 8} y={loneY} w={60} />
        <Figure x={loneX} y={loneY} h={loneH} kind="villager" robe={C.earth} phase={walkPhase(onBranch ? b.dist : d, loneH)} />
        <SandDrift f={f} y={1180} h={90} seed={4} count={18} speed={0.5} opacity={0.4} />
      </Layer>
    </Camera>
  );
};
