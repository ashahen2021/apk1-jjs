import React from "react";
import { interpolate } from "remotion";
import { useSceneFrame } from "../../components/AnimatedScene";
import { Birds, Haze } from "../../components/Atmosphere";
import { Camera, Layer } from "../../components/Camera";
import { Cliff, HatshepsutTemple, Palm } from "../../components/Landscape";
import { Ground, Label, RPoly, RRect, Rule, Streaks, Stipple } from "../../components/Print";
import { easeInOut, ramp } from "../../lib/anim";
import { C } from "../../lib/theme";

const Boat: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-60 0Q-40 18 0 18Q40 18 64 -6L40 2L-44 2Z" fill={C.earth} />
    <path d="M-4 2L-4 -78L2 -78L2 2Z" fill={C.shadow} />
    <path d="M2 -76L50 -20L2 -14Z" fill={C.cream} stroke={C.sand} strokeWidth={2} />
    <rect x={-60} y={22} width={130} height={3} fill={C.paper} opacity={0.6} />
  </g>
);

/** 01:00 — DEIR EL-BAHARI. A slow rise from the Nile to the limestone cliffs. No pyramids. */
export const Scene07DeirElBahari: React.FC = () => {
  const f = useSceneFrame();
  const camY = interpolate(f, [0, 250], [1500, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  const label = ramp(f, 196, 236);
  return (
    <Camera y={camY}>
      <Layer depth={0.55}>
        <Cliff id="s7far" x={-260} baseY={1010} w={1600} h={470} seed={31} color={C.sand} shade={C.gold} scree={C.paperDark} peak={0.72} peakiness={0.35} strata={false} />
      </Layer>
      <Layer depth={0.35}>
        <Birds f={f} x={220} y={470} seed={6} count={3} speed={0.55} />
      </Layer>
      <Layer depth={0.85}>
        {/* the great bay of cliffs with the peak above */}
        <Cliff id="s7main" x={-140} baseY={1096} w={1360} h={640} seed={17} peak={0.42} peakiness={0.5} screeH={0.3} />
      </Layer>
      <Layer depth={1}>
        <HatshepsutTemple x={560} y={1104} s={1.3} />
        <Ground y={1104} seed={4} h={640} dense={1.3} />
        {/* causeway toward the valley */}
        <RPoly pts={[[536, 1108], [584, 1108], [640, 1960], [500, 1960]]} seed={7} fill={C.paperDark} amp={2} />
        <Stipple x={-100} y={1300} w={1300} h={600} seed={8} count={320} color={C.gold} opacity={0.4} fall />
        {/* cultivation: the green edge of the valley */}
        <RRect x={-200} y={1960} w={1500} h={330} seed={11} fill={C.sand} amp={5} step={30} />
        <RRect x={-200} y={1960} w={1500} h={330} seed={11} fill={C.teal} amp={5} step={30} opacity={0.55} />
        <Streaks x={-200} y={1966} w={1500} h={320} seed={12} count={120} color={C.teal} opacity={0.6} maxLen={260} thick={5} />
        <Streaks x={-200} y={1966} w={1500} h={320} seed={13} count={70} color={C.sand} opacity={0.5} maxLen={200} thick={3} />
        {[90, 240, 330, 700, 830, 1010].map((x, i) => (
          <Palm key={x} x={x} y={2010 + (i % 3) * 70} h={130 + (i % 2) * 36} f={f} seed={i + 3} lean={(i % 2 ? -1 : 1) * 12} />
        ))}
        {/* the Nile */}
        <RRect x={-200} y={2290} w={1500} h={420} seed={14} fill={C.shadow} amp={6} step={34} />
        <Streaks x={-200} y={2300} w={1500} h={400} seed={15} count={90} color={C.teal} opacity={0.8} maxLen={300} thick={5} />
        <Streaks x={-200 + ((f * 0.5) % 60)} y={2300} w={1500} h={400} seed={16} count={60} color={C.paper} opacity={0.4} maxLen={120} thick={2} />
        <Boat x={300 + f * 0.35} y={2440} s={1.25} />
        <Boat x={820 - f * 0.22} y={2590} s={-0.95} />
        {/* east bank: ancient Thebes, reduced to pylons and an obelisk */}
        <RRect x={-200} y={2700} w={1500} h={800} seed={18} fill={C.sand} amp={5} step={30} />
        <Streaks x={-200} y={2706} w={1500} h={700} seed={19} count={120} color={C.paper} opacity={0.5} maxLen={240} thick={5} />
        <g transform="translate(250 2990)">
          <RPoly pts={[[-170, 0], [-150, -190], [-30, -190], [-22, 0]]} seed={21} fill={C.gold} />
          <RPoly pts={[[22, 0], [30, -190], [150, -190], [170, 0]]} seed={22} fill={C.gold} />
          <rect x={-24} y={-120} width={48} height={120} fill={C.earth} />
          <rect x={-154} y={-204} width={128} height={16} fill={C.earth} />
          <rect x={26} y={-204} width={128} height={16} fill={C.earth} />
          <path d="M-232 0L-224 -250L-216 -270L-208 -250L-200 0Z" fill={C.earth} />
        </g>
        <g transform="translate(780 3080)">
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <rect x={-150 + i * 70} y={-150} width={34} height={150} fill={C.gold} />
              <rect x={-156 + i * 70} y={-164} width={46} height={16} fill={C.earth} />
            </g>
          ))}
          <rect x={-170} y={-186} width={350} height={22} fill={C.earth} />
        </g>
        <Palm x={560} y={2900} h={330} f={f} seed={12} lean={22} />
        <Palm x={1010} y={2860} h={240} f={f} seed={14} lean={-16} />
      </Layer>
      <Layer depth={1}>
        <Haze id="s7h1" y={1180} h={300} opacity={0.75} />
        <Haze id="s7h2" y={1820} h={260} opacity={0.6} />
      </Layer>
      <g opacity={label} transform={`translate(0 ${(1 - label) * 12})`}>
        <Label x={540} y={372} text="DEIR EL-BAHARI" size={46} spacing={0.3} weight={600} />
        <Rule x={540} y={402} w={240} t={label} />
        <Label x={540} y={446} text="WEST BANK · LUXOR" size={22} spacing={0.3} opacity={0.8} />
      </g>
    </Camera>
  );
};
