import React from "react";
import { useSceneFrame } from "../components/AnimatedScene";
import { Dust } from "../components/Atmosphere";
import { Camera, Layer } from "../components/Camera";
import { CoffinSide } from "../components/Coffins";
import { Figure, handPos } from "../components/Figures";
import { Cliff } from "../components/Landscape";
import { Label, RPoly, RRect, Rule, Streaks, Stipple } from "../components/Print";
import { easeInOut, mix, pulse, ramp } from "../lib/anim";
import { C } from "../lib/theme";

const HEAVES = [24, 69, 114, 159, 204]; // on the foley rope creaks
const SX = 430, SURF = 640;

const Sheet: React.FC<{ x: number; y: number; rot: number; seed: number; fade: number; blank: number[] }> = ({ x, y, rot, seed, fade, blank }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={8} y={10} width={270} height={330} fill={C.shadow} opacity={0.18} />
    <RRect x={0} y={0} w={270} h={330} seed={seed} fill={C.cream} amp={2} stroke={C.sand} strokeWidth={2} />
    <rect x={24} y={26} width={130} height={7} fill={C.shadow} opacity={0.8} />
    <rect x={24} y={44} width={222} height={2} fill={C.gold} />
    {Array.from({ length: 6 }, (_, r) => {
      const y0 = 62 + r * 43;
      const gone = blank.includes(r) ? fade : 0;
      return (
        <g key={r}>
          <rect x={24} y={y0} width={222} height={34} fill="none" stroke={gone > 0.5 ? C.terra : C.sand} strokeWidth={2} strokeDasharray={gone > 0.5 ? "7 6" : undefined} />
          <g opacity={1 - gone}>
            <path d={`M34 ${y0 + 13}q7 -5 14 0t14 0t14 0t14 0t14 0t14 0${r % 2 ? "t14 0t14 0" : ""}`} stroke={C.shadow} strokeWidth={2.3} fill="none" opacity={0.75} />
            <path d={`M34 ${y0 + 25}q7 -5 14 0t14 0t14 0${r % 3 ? "t14 0t14 0" : ""}`} stroke={C.shadow} strokeWidth={2.3} fill="none" opacity={0.6} />
            <rect x={206} y={y0 + 7} width={28} height={20} fill={C.sand} />
          </g>
        </g>
      );
    })}
  </g>
);

/** 02:30 — THE RUSHED REMOVAL. Coffins hauled up the narrow shaft; records left blank. */
export const Scene16Removal: React.FC = () => {
  const f = useSceneFrame();
  const lift = HEAVES.reduce((a, t) => a + ramp(f, t, t + 26, easeInOut), 0) / HEAVES.length;
  const strain = HEAVES.reduce((a, t) => Math.max(a, pulse(f, t - 4, t + 10, t + 22, t + 34)), 0);
  const cy = mix(1250, 700, lift); // coffin centre
  const PY = 430; // pulley
  const sheets = [ramp(f, 150, 184), ramp(f, 160, 194), ramp(f, 170, 204)];
  const fade = ramp(f, 206, 262);
  return (
    <Camera zoom={mix(1.04, 1.0, ramp(f, 0, 280))} cy={800}>
      <Layer depth={0.75}>
        <Cliff id="s16c" x={-200} baseY={SURF + 6} w={600} h={300} seed={5} peak={0.3} peakiness={0.4} />
      </Layer>
      <Layer depth={1}>
        {/* rock in section */}
        <RPoly pts={[[-60, SURF + 6], [300, SURF], [SX + 40, SURF - 4], [760, SURF], [1140, SURF + 6], [1140, 2100], [-60, 2100]]} seed={3} fill={C.sand} amp={3} />
        <Streaks x={-60} y={SURF + 8} w={1200} h={1400} seed={4} count={260} color={C.gold} opacity={0.7} maxLen={300} thick={4} />
        <Streaks x={-60} y={SURF + 8} w={1200} h={1400} seed={5} count={180} color={C.paperDark} opacity={0.7} maxLen={260} thick={5} />
        <Stipple x={-60} y={SURF + 8} w={1200} h={1400} seed={6} count={420} color={C.earth} opacity={0.45} />
        {/* extremely narrow shaft */}
        <RRect x={SX - 37} y={SURF - 8} w={74} h={860} seed={11} fill={C.night} amp={2.2} step={26} />
        <RRect x={SX - 37} y={1410} w={300} h={84} seed={12} fill={C.night} amp={2.2} step={26} />
        {/* hoist frame */}
        <path d={`M${SX - 110} ${SURF}L${SX - 14} ${PY - 18}M${SX + 110} ${SURF}L${SX + 14} ${PY - 18}`} stroke={C.earth} strokeWidth={11} strokeLinecap="round" />
        <rect x={SX - 36} y={PY - 30} width={72} height={12} fill={C.shadow} />
        <circle cx={SX} cy={PY} r={17} fill={C.gold} stroke={C.shadow} strokeWidth={5} />
        <circle cx={SX} cy={PY} r={4} fill={C.shadow} />
        <path d={`M${SX} ${PY}L${SX + 12 * Math.cos(lift * 40)} ${PY + 12 * Math.sin(lift * 40)}`} stroke={C.shadow} strokeWidth={3} />
        {/* rope: pulley → coffin */}
        <path d={`M${SX - 15} ${PY}L${SX - 15 + Math.sin(f * 0.5) * strain * 1.5} ${cy - 150}`} stroke={C.cream} strokeWidth={4.5} />
        {/* coffin, upright, a tight fit */}
        <g transform={`translate(${SX + 30} ${cy}) rotate(${-90 + Math.sin(f * 0.21) * strain * 1.3})`}>
          <CoffinSide x={0} y={0} len={290} tone="gold" seed={7} royal />
          <path d="M-150 -30L-170 -30M-60 -64L-60 0M70 -58L70 0" stroke={C.cream} strokeWidth={4} />
        </g>
        <Dust f={f} x={SX - 30} y={cy - 40} w={60} h={260} seed={3} count={12} color={C.sand} opacity={0.7 * strain} />
        {/* three grounded men hauling: feet planted, bodies leaning into each heave */}
        {[0, 1, 2].map((i) => {
          const x = 640 + i * 104;
          const lean = -(6 + strain * 15) - i * 1.5;
          const h = 176 - i * 5;
          const a = 62 + strain * 14;
          const hand = handPos(x, SURF, h, -1, a);
          return (
            <g key={i}>
              <ellipse cx={x + 16} cy={SURF + 3} rx={44} ry={6} fill={C.shadow} opacity={0.2} />
              <Figure x={x} y={SURF} h={h} kind="worker" dir={-1} robe={[C.paperDark, C.gold, C.cream][i]} lean={lean} armF={a} armB={a - 16} phase={0.7 + strain * 0.5} />
              {i === 0 && <path d={`M${SX + 15} ${PY}L${hand.x} ${hand.y}`} stroke={C.earth} strokeWidth={4.5} />}
              <path d={`M${hand.x} ${hand.y}L${hand.x + 104} ${hand.y + 3}`} stroke={C.earth} strokeWidth={4.5} opacity={i < 2 ? 1 : 0} />
            </g>
          );
        })}
        <path d={`M${640 + 2 * 104 - 20} ${SURF - 92}Q${940} ${SURF - 70} ${1000} ${SURF}`} stroke={C.earth} strokeWidth={4.5} fill="none" />
        <ellipse cx={1010} cy={SURF - 4} rx={30} ry={10} fill="none" stroke={C.earth} strokeWidth={7} />
      </Layer>
      <Layer depth={1.08}>
        {/* inventory sheets: handwriting fades to blank boxes */}
        <g transform={`translate(0 ${(1 - sheets[0]) * 900})`}><Sheet x={90} y={1010} rot={-4} seed={21} fade={fade} blank={[1, 4]} /></g>
        <g transform={`translate(0 ${(1 - sheets[1]) * 900})`}><Sheet x={404} y={1040} rot={2} seed={23} fade={fade} blank={[0, 2, 3, 5]} /></g>
        <g transform={`translate(0 ${(1 - sheets[2]) * 900})`}><Sheet x={716} y={1004} rot={5} seed={25} fade={fade} blank={[2, 3]} /></g>
      </Layer>
      <g opacity={pulse(f, 40, 66, 150, 176)}>
        <Label x={760} y={372} text="≈ 48 HOURS" size={40} spacing={0.26} weight={600} />
        <Rule x={760} y={400} w={170} />
      </g>
    </Camera>
  );
};
