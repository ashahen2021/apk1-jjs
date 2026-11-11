import React from "react";
import { useSceneFrame } from "../../components/AnimatedScene";
import { SandDrift } from "../../components/Atmosphere";
import { Camera, Layer } from "../../components/Camera";
import { Cliff, Ridge } from "../../components/Landscape";
import { Ground, RPoly, Streaks, Stipple } from "../../components/Print";
import { lin, mix, ramp } from "../../lib/anim";
import { C } from "../../lib/theme";

// rocks land exactly on the foley thuds (1.2, 2.0, 2.9, 3.5, 4.4 s)
const ROCKS = [
  { land: 36, x: 556, y: 1172, s: 1.0, rot: 12 },
  { land: 60, x: 648, y: 1160, s: 1.25, rot: -20 },
  { land: 87, x: 600, y: 1120, s: 0.9, rot: 34 },
  { land: 105, x: 520, y: 1128, s: 0.7, rot: -8 },
  { land: 132, x: 668, y: 1104, s: 0.8, rot: 50 },
];
const HX = 600, HY = 1118;

/** 01:30 — SEALED BY TIME. Sand and fallen stone close the opening; generations pass. */
export const Scene10Sealed: React.FC = () => {
  const f = useSceneFrame();
  const fill = ramp(f, 18, 178);
  const calm = ramp(f, 150, 262);
  // three quick passes of the sun = generations
  const day = lin(f, 96, 276) * 3;
  const p = day % 1;
  const sunOn = f > 96 && f < 276 ? Math.sin(p * Math.PI) : 0;
  const sunX = mix(-80, 1160, p);
  const sunY = 760 - Math.sin(p * Math.PI) * 330;
  return (
    <Camera zoom={mix(1.16, 1.0, ramp(f, 0, 280))} cx={HX} cy={1100}>
      <Layer depth={0.1}>
        <circle cx={sunX} cy={sunY} r={54} fill={C.sand} opacity={sunOn * 0.9} />
        <circle cx={sunX} cy={sunY} r={84} fill={C.sand} opacity={sunOn * 0.25} />
      </Layer>
      <Layer depth={0.3}>
        <Ridge x={-300} y={1040} w={1700} h={110} seed={6} color={C.paperDark} />
      </Layer>
      <Layer depth={0.9}>
        <Cliff id="s10c" x={-120} baseY={1186} w={1320} h={430} seed={7} peak={0.5} peakiness={0.4} />
        {/* raking light that swings with the sun */}
        <path d={`M-200 1186L1300 1186L${1300 + (0.5 - p) * 500} 1290L${-200 + (0.5 - p) * 500} 1290Z`} fill={C.shadow} opacity={0.14 * sunOn} />
        {/* the hidden opening */}
        <RPoly pts={[[HX - 40, HY + 64], [HX - 34, HY - 30], [HX - 8, HY - 52], [HX + 30, HY - 40], [HX + 42, HY + 64]]} seed={4} fill={C.night} amp={2.4} />
        {/* debris and sand building up over it */}
        {ROCKS.map((r, i) => {
          const t = lin(f, r.land - 13, r.land);
          const fall = t * t;
          const bounce = f > r.land ? Math.max(0, Math.sin(lin(f, r.land, r.land + 8) * Math.PI)) * 6 : 0;
          const sink = ramp(f, r.land + 30, 200) * 18;
          return (
            <g key={i} transform={`translate(${r.x} ${mix(r.y - 330, r.y, fall) - bounce + sink}) rotate(${r.rot * fall}) scale(${r.s})`} opacity={t > 0 ? 1 : 0}>
              <RPoly pts={[[-30, 14], [-22, -18], [6, -26], [30, -8], [26, 18]]} seed={i + 3} fill={i % 2 ? C.gold : C.earth} amp={2} />
              <RPoly pts={[[6, -26], [30, -8], [26, 18], [8, 4]]} seed={i + 9} fill={C.teal} amp={1.4} opacity={0.75} />
            </g>
          );
        })}
        <RPoly
          pts={[[HX - 250, 1192], [HX - 150, mix(1190, 1130, fill)], [HX - 50, mix(1190, 1062, fill)], [HX + 20, mix(1190, 1040, fill)], [HX + 96, mix(1190, 1072, fill)], [HX + 190, mix(1190, 1140, fill)], [HX + 290, 1192]]}
          seed={12} fill={C.sand} amp={2.6}
        />
        <Streaks x={HX - 230} y={mix(1186, 1060, fill)} w={480} h={mix(8, 130, fill)} seed={13} count={Math.round(34 * fill)} color={C.paperDark} opacity={0.75} maxLen={110} thick={3} />
        <Stipple x={HX - 220} y={mix(1180, 1050, fill)} w={460} h={mix(10, 140, fill)} seed={14} count={Math.round(160 * fill)} color={C.gold} opacity={0.6} fall />
        {/* sand sifting down from the ledge */}
        {Array.from({ length: 16 }, (_, i) => {
          const ph = (f * (2.2 + (i % 5) * 0.4) + i * 37) % 150;
          return <rect key={i} x={HX - 60 + ((i * 53) % 130)} y={950 + ph} width={2.4} height={10 + (i % 3) * 5} fill={C.sand} opacity={(1 - fill) * (1 - ph / 150) * 0.9} />;
        })}
      </Layer>
      <Layer depth={1}>
        <Ground y={1190} seed={9} dense={1.2} />
        <SandDrift f={f} y={1010} h={240} seed={5} count={70} speed={mix(2.2, 0.4, calm)} opacity={mix(0.75, 0.0, calm)} color={C.gold} />
        <SandDrift f={f} y={1150} h={130} seed={8} count={40} speed={mix(1.6, 0.3, calm)} opacity={mix(0.7, 0.05, calm)} color={C.sand} />
      </Layer>
      {/* seasons: warm and cool washes dissolving through the papyrus sky */}
      <rect x={-200} y={-200} width={1500} height={2400} fill={C.gold} opacity={0.1 * sunOn} />
      <rect x={-200} y={-200} width={1500} height={2400} fill={C.teal} opacity={f > 96 && f < 276 ? 0.09 * (1 - sunOn) : 0} />
    </Camera>
  );
};
