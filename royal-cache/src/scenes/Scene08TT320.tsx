import React from "react";
import { interpolate } from "remotion";
import { useSceneFrame } from "../components/AnimatedScene";
import { Flame, Glow } from "../components/Atmosphere";
import { Camera, Layer } from "../components/Camera";
import { CoffinSide } from "../components/Coffins";
import { Figure, walkPhase } from "../components/Figures";
import { Cliff } from "../components/Landscape";
import { Label, RPoly, RRect, Streaks, Stipple } from "../components/Print";
import { alongPath, easeInOut, mix, ramp } from "../lib/anim";
import { C, FONT_TITLE } from "../lib/theme";

const ROUTE: [number, number][] = [[560, 1100], [716, 1100], [836, 1420], [520, 1420]];

/** 01:10 — TT320. Illustrative cutaway: shaft, passages, and the burial of Pinedjem II. */
export const Scene08TT320: React.FC = () => {
  const f = useSceneFrame();
  const camY = interpolate(f, [0, 100, 190, 285], [0, 300, 520, 560], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  const lower = ramp(f, 8, 96); // lantern lowered down the shaft
  const lanY = mix(420, 1050, lower);
  const walk = interpolate(f, [70, 288], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lead = alongPath(ROUTE, walk);
  const reveal = ramp(f, 196, 256);
  const tag = ramp(f, 150, 190);
  return (
    <Camera y={camY}>
      <Layer depth={0.8}>
        <Cliff id="s8c" x={380} baseY={372} w={900} h={330} seed={9} peak={0.6} peakiness={0.4} />
      </Layer>
      <Layer depth={1}>
        {/* living rock, in section */}
        <RPoly pts={[[-60, 372], [240, 356], [300, 348], [364, 352], [520, 366], [1140, 372], [1140, 2700], [-60, 2700]]} seed={3} fill={C.sand} amp={3} />
        <Streaks x={-60} y={380} w={1200} h={2300} seed={4} count={420} color={C.gold} opacity={0.7} maxLen={300} thick={4} />
        <Streaks x={-60} y={380} w={1200} h={2300} seed={5} count={300} color={C.paperDark} opacity={0.7} maxLen={260} thick={5} />
        <Stipple x={-60} y={380} w={1200} h={2300} seed={6} count={700} color={C.earth} opacity={0.45} />
        {/* the cut spaces */}
        <RRect x={296} y={346} w={68} h={756} seed={11} fill={C.night} amp={2.2} step={26} />
        <RRect x={296} y={1036} w={486} h={66} seed={12} fill={C.night} amp={2.2} step={26} />
        <RPoly pts={[[716, 1036], [782, 1036], [902, 1356], [902, 1422], [836, 1422], [716, 1102]]} seed={13} fill={C.night} amp={2.2} step={26} />
        <RRect x={470} y={1356} w={432} h={66} seed={14} fill={C.night} amp={2.2} step={26} />
        <RRect x={148} y={1262} w={336} h={160} seed={15} fill={C.night} amp={2.4} step={26} />
        {/* steps cut in the sloping passage */}
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d={`M${716 + i * 15} ${1100 + i * 40}l15 0l0 40`} stroke={C.sand} strokeWidth={3} fill="none" opacity={0.7} />
        ))}
        {/* the rope and its lantern */}
        <path d={`M330 330L${330 + Math.sin(f * 0.07) * 2} ${lanY - 20}`} stroke={C.sand} strokeWidth={3} />
        <rect x={282} y={322} width={96} height={10} fill={C.earth} />
        <Glow id="s8lan" x={330} y={lanY} r={190} f={f} strength={0.5} />
        <g transform={`translate(${330 + Math.sin(f * 0.07) * 2} ${lanY})`}>
          <rect x={-8} y={-20} width={16} height={22} fill={C.gold} stroke={C.shadow} strokeWidth={2} />
          <Flame x={0} y={-2} f={f} s={0.6} />
        </g>
        {/* the burial of the High Priest and his family */}
        <g opacity={mix(0.28, 1, reveal)}>
          <RRect x={196} y={1404} w={250} h={18} seed={21} fill={C.earth} amp={1} />
          <CoffinSide x={320} y={1404} len={236} tone="gold" seed={5} />
          <CoffinSide x={262} y={1330} len={150} tone="teal" seed={8} opacity={0.9} />
          <CoffinSide x={400} y={1338} len={130} tone="earth" seed={9} flip opacity={0.9} />
          <rect x={190} y={1330} width={150} height={5} fill={C.earth} />
          <rect x={336} y={1338} width={130} height={5} fill={C.earth} />
        </g>
        <Glow id="s8pin" x={320} y={1380} r={200} f={f} strength={0.5 * reveal} />
        {/* torch-lit procession */}
        <Glow id="s8torch" x={lead.x} y={lead.y - 56} r={210} f={f + 40} strength={0.62 * ramp(f, 66, 90)} />
        {[0, 1, 2].map((i) => {
          const back = (i * 50) / lead.total;
          const p = alongPath(ROUTE, Math.max(0, walk - back));
          const dir = p.dx >= 0 ? 1 : -1;
          const vis = ramp(f, 66 + i * 12, 84 + i * 12);
          return (
            <g key={i} opacity={vis}>
              <Figure x={p.x} y={p.y} h={58} kind={i === 0 ? "priest" : "bearer"} dir={dir as 1 | -1} phase={walkPhase(p.dist, 58)} armF={i === 0 ? 120 : undefined} />
              {i === 0 && (
                <g transform={`translate(${p.x + dir * 15} ${p.y - 60})`}>
                  <rect x={-2} y={0} width={4} height={22} fill={C.earth} />
                  <Flame x={0} y={2} f={f} s={0.7} />
                </g>
              )}
            </g>
          );
        })}
        {/* docket naming the burial */}
        <g opacity={tag} transform={`translate(316 ${1196 + (1 - tag) * 10})`}>
          <path d="M0 26L0 62" stroke={C.cream} strokeWidth={2} />
          <RRect x={-150} y={-26} w={300} h={52} seed={31} fill={C.cream} amp={1.4} stroke={C.earth} strokeWidth={2} />
          <Label x={0} y={10} text="PINEDJEM II" size={27} spacing={0.24} weight={600} />
        </g>
      </Layer>
      {/* fixed labels */}
      <g opacity={ramp(f, 60, 100)}>
        <text x={540} y={1190} textAnchor="middle" fontFamily={FONT_TITLE} fontWeight={700} fontSize={128} fill={C.shadow} letterSpacing="0.08em" opacity={0.96}>
          TT320
        </text>
        <rect x={420} y={1216} width={240} height={2.5} fill={C.shadow} />
        <Label x={540} y={1262} text="ILLUSTRATIVE CUTAWAY · NOT A SURVEYED PLAN" size={20} spacing={0.2} color={C.ink} />
      </g>
    </Camera>
  );
};
