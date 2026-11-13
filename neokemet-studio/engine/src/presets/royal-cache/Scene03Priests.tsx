import React from "react";
import { useSceneFrame } from "../../components/AnimatedScene";
import { Birds } from "../../components/Atmosphere";
import { Camera, Layer } from "../../components/Camera";
import { Figure, GroundShadow, handPos } from "../../components/Figures";
import { Palm } from "../../components/Landscape";
import { Ground, Label, RPoly, RRect, Rule, Streaks } from "../../components/Print";
import { mix, pulse, ramp } from "../../lib/anim";
import { C } from "../../lib/theme";

const Column: React.FC<{ x: number; y: number; h: number; w: number; seed: number }> = ({ x, y, h, w, seed }) => (
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

/** 00:20 — A PLAN TO SAVE THE KINGS. Two priests of Amun study a papyrus record. */
export const Scene03Priests: React.FC = () => {
  const f = useSceneFrame();
  const pan = ramp(f, 0, 300);
  const extend = ramp(f, 86, 132);
  const unroll = ramp(f, 118, 170);
  const point = ramp(f, 172, 214);
  const G = 1196;
  const hand = handPos(452, G, 250, 1, mix(18, 78, extend));
  const breathe = Math.sin(f * 0.05) * 0.6;
  return (
    <Camera x={mix(-80, 80, pan)} zoom={mix(1.03, 1.08, pan)} cy={1000}>
      <Layer depth={0.18}>
        <Birds f={f} x={200} y={520} seed={4} count={3} speed={0.35} />
      </Layer>
      <Layer depth={0.3}>
        {/* distant pylon */}
        <RPoly pts={[[620, 1100], [668, 560], [1010, 560], [1060, 1100]]} seed={3} fill={C.paperDark} amp={2} />
        <rect x={662} y={548} width={354} height={16} fill={C.sand} />
        <Streaks x={640} y={580} w={400} h={500} seed={4} count={40} color={C.sand} opacity={0.7} maxLen={120} />
        <RRect x={800} y={860} w={78} h={240} seed={5} fill={C.teal} opacity={0.55} />
      </Layer>
      <Layer depth={0.55}>
        {/* colonnade */}
        <RRect x={-120} y={596} w={840} h={46} seed={7} fill={C.sand} amp={1.5} />
        <rect x={-120} y={596} width={840} height={9} fill={C.teal} />
        {[-40, 150, 340, 530].map((x, i) => (
          <Column key={i} x={x} y={1120} h={420} w={74} seed={10 + i} />
        ))}
        {/* low court wall */}
        <RRect x={-200} y={1030} w={1500} h={110} seed={8} fill={C.paperDark} amp={1.6} />
        <rect x={-200} y={1030} width={1500} height={10} fill={C.gold} opacity={0.7} />
        <rect x={-200} y={1100} width={1500} height={8} fill={C.teal} opacity={0.7} />
      </Layer>
      <Layer depth={0.8}>
        <Palm x={930} y={1150} h={520} f={f} seed={3} lean={-34} />
        <Palm x={1050} y={1160} h={380} f={f} seed={6} lean={18} />
      </Layer>
      <Layer depth={1}>
        <Ground y={1190} seed={9} dense={1.2} />
        {/* paving joints */}
        {[1230, 1290, 1370].map((y, i) => (
          <rect key={y} x={-200} y={y} width={1500} height={2} fill={C.gold} opacity={0.35 - i * 0.08} />
        ))}
        <GroundShadow x={470} y={G} w={150} skew={40} />
        <GroundShadow x={648} y={G} w={150} skew={40} />
        {/* priest holding the record */}
        <Figure x={452} y={G + breathe} h={250} kind="priest" dir={1} armF={mix(18, 78, extend)} armB={mix(-4, 30, extend)} />
        {/* papyrus: unrolls from the hand */}
        <g transform={`translate(${hand.x} ${hand.y}) rotate(${mix(20, 4, extend)})`} opacity={ramp(f, 80, 96)}>
          <rect x={-8} y={-8} width={mix(22, 96, unroll)} height={mix(60, 74, unroll)} fill={C.cream} stroke={C.gold} strokeWidth={2} />
          {[8, 20, 32, 44].map((y, i) => (
            <rect key={y} x={4} y={y - 4} width={Math.max(0, mix(0, 70 - i * 9, unroll))} height={3} fill={C.shadow} opacity={0.6} />
          ))}
          <rect x={mix(14, 88, unroll) - 4} y={-12} width={9} height={mix(68, 82, unroll)} fill={C.earth} />
          <rect x={-12} y={-12} width={9} height={mix(68, 82, unroll)} fill={C.earth} />
        </g>
        {/* second priest leans in and points */}
        <Figure x={676} y={G - breathe} h={244} kind="priest" dir={-1} armF={mix(8, 62, point)} lean={mix(0, 4, point)} />
      </Layer>
      <g opacity={pulse(f, 24, 56, 268, 296)}>
        <Label x={540} y={372} text="21ST DYNASTY" size={34} spacing={0.34} />
        <Rule x={540} y={398} w={170} />
      </g>
    </Camera>
  );
};
