import React from "react";
import { spring } from "remotion";
import { useSceneFrame } from "../../components/AnimatedScene";
import { Glow, SandDrift } from "../../components/Atmosphere";
import { Camera, Layer } from "../../components/Camera";
import { Figure, FigKind, handPos, walkPhase } from "../../components/Figures";
import { Cliff } from "../../components/Landscape";
import { Ground, Label, REllipse, RPoly } from "../../components/Print";
import { easeOut, mix, ramp } from "../../lib/anim";
import { C, FONT_TITLE, FPS } from "../../lib/theme";

const HX = 800, HY = 1216;
const TEAM: { kind: FigKind; h: number; stop: number; from: number; delay: number; robe?: string }[] = [
  { kind: "worker", h: 168, stop: 640, from: 150, delay: 0 },
  { kind: "worker", h: 174, stop: 548, from: 40, delay: 6, robe: C.gold },
  { kind: "brugsch", h: 192, stop: 430, from: -90, delay: 12 },
  { kind: "kamal", h: 186, stop: 330, from: -200, delay: 18 },
  { kind: "worker", h: 166, stop: 226, from: -310, delay: 24, robe: C.paperDark },
];

/** 02:20 — 1881. Brugsch, Kamal and a small team arrive at the shaft. */
export const Scene15Revealed: React.FC = () => {
  const f = useSceneFrame();
  const G = 1206;
  const crane = ramp(f, 30, 280);
  const stamp = spring({ frame: f - 14, fps: FPS, config: { damping: 11, stiffness: 190, mass: 0.7 } });
  const late = ramp(f, 60, 290, (t) => t); // sun dropping → shadows stretch
  const rope = ramp(f, 214, 284);
  return (
    <Camera x={mix(-110, 130, crane)} y={mix(-70, 90, crane)} zoom={mix(1.0, 1.2, crane)} cx={540} cy={1100}>
      <Layer depth={0.7}>
        <Cliff id="s15c" x={-300} baseY={1120} w={1700} h={560} seed={23} peak={0.66} peakiness={0.35} screeH={0.3} />
      </Layer>
      <Layer depth={1}>
        <Ground y={1160} seed={7} dense={1.3} />
        <RPoly pts={[[-300, 1176], [1500, 1168], [1500, 1260], [-300, 1268]]} seed={3} fill={C.paperDark} amp={4} step={36} />
        <RPoly pts={[[900, 1190], [930, 1128], [1000, 1120], [1040, 1190]]} seed={5} fill={C.gold} />
        <RPoly pts={[[1000, 1120], [1040, 1190], [1004, 1190]]} seed={6} fill={C.teal} opacity={0.75} />
        {/* the narrow hole */}
        <REllipse cx={HX} cy={HY - 4} rx={74} ry={30} seed={7} fill={C.earth} amp={2.6} />
        <REllipse cx={HX} cy={HY} rx={58} ry={20} seed={8} fill={C.night} amp={2} />
        {/* long shadows over the limestone */}
        {TEAM.map((m, i) => {
          const t = ramp(f, m.delay, 150 + m.delay, easeOut);
          const x = mix(m.from, m.stop, t);
          const len = mix(60, 300, late);
          return <path key={i} d={`M${x - 14} ${G}L${x + 14} ${G}L${x + len + 22} ${G + 44 + late * 20}L${x + len} ${G + 52 + late * 20}Z`} fill={C.shadow} opacity={0.2} />;
        })}
        {TEAM.map((m, i) => {
          const t = ramp(f, m.delay, 150 + m.delay, easeOut);
          const x = mix(m.from, m.stop, t);
          const walking = t < 0.995;
          const lead = i === 0;
          const hand = handPos(x, G, m.h, 1, lead ? mix(40, 64, rope) : 52);
          return (
            <g key={i}>
              {i === 1 && <Glow id="s15lan" x={hand.x} y={hand.y + 24} r={120} f={f} strength={0.42} />}
              <Figure x={x} y={G} h={m.h} kind={m.kind} robe={m.robe} phase={walking ? walkPhase(x - m.from, m.h) : undefined} armF={lead || i === 1 ? (lead ? mix(40, 64, rope) : 52) : i === 2 && !walking ? mix(4, 58, ramp(f, 180, 215)) : undefined} lean={lead ? rope * 6 : 0} />
              {i === 1 && (
                <g transform={`translate(${hand.x} ${hand.y})`}>
                  <rect x={-9} y={8} width={18} height={26} fill={C.sand} stroke={C.shadow} strokeWidth={3} />
                  <rect x={-3.5} y={15} width={7} height={11} fill={C.terra} />
                </g>
              )}
              {lead && (
                <>
                  <ellipse cx={hand.x} cy={hand.y + 4} rx={mix(16, 8, rope)} ry={mix(20, 10, rope)} fill="none" stroke={C.sand} strokeWidth={mix(8, 4, rope)} />
                  <path d={`M${hand.x} ${hand.y + 8}Q${(hand.x + HX) / 2} ${hand.y + 70} ${HX - 20} ${HY - 4}`} stroke={C.sand} strokeWidth={4.5} fill="none" opacity={rope > 0.02 ? 1 : 0} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, rope * 2)} />
                  <path d={`M${HX - 20} ${HY - 4}L${HX - 20} ${HY - 4 + Math.max(0, rope * 2 - 1) * 16}`} stroke={C.sand} strokeWidth={4.5} />
                </>
              )}
              {i === 4 && <path d={`M${x + 10} ${G - m.h * 0.74}l34 12l-6 30l-32 -10Z`} fill={C.earth} />}
            </g>
          );
        })}
        <SandDrift f={f} y={1150} h={120} seed={3} count={20} speed={0.5} opacity={0.4} />
      </Layer>
      {/* date stamped onto a weathered paper corner */}
      <g transform="translate(66 300)">
        <RPoly pts={[[0, 0], [430, 8], [404, 150], [300, 218], [10, 206]]} seed={15} fill={C.paperDark} amp={5} step={20} />
        <RPoly pts={[[300, 218], [404, 150], [330, 148]]} seed={16} fill={C.sand} amp={2} />
        <g transform={`translate(196 108) rotate(-6) scale(${mix(1.9, 1, Math.min(1.15, stamp))})`} opacity={Math.min(1, stamp * 1.4)}>
          <rect x={-148} y={-66} width={296} height={132} fill="none" stroke={C.terra} strokeWidth={7} />
          <rect x={-136} y={-54} width={272} height={108} fill="none" stroke={C.terra} strokeWidth={2.5} />
          <text x={0} y={36} textAnchor="middle" fontFamily={FONT_TITLE} fontWeight={700} fontSize={108} fill={C.terra} letterSpacing="0.06em">
            1881
          </text>
        </g>
      </g>
      <g opacity={ramp(f, 100, 130)}>
        <Label x={282} y={556} text="6 JULY" size={30} spacing={0.34} weight={600} />
      </g>
    </Camera>
  );
};
