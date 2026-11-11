import React from "react";
import { useSceneFrame } from "../components/AnimatedScene";
import { SandDrift } from "../components/Atmosphere";
import { Camera, Layer } from "../components/Camera";
import { CoffinSide, Tone } from "../components/Coffins";
import { Figure, GroundShadow, walkPhase } from "../components/Figures";
import { Cliff, Ridge } from "../components/Landscape";
import { Ground, Label, RRect } from "../components/Print";
import { mix, ramp } from "../lib/anim";
import { C } from "../lib/theme";

/** A coffin on a stable wooden bier, shouldered by four grounded bearers. */
const Bier: React.FC<{ cx: number; ground: number; h: number; dist: number; tone: Tone; seed: number; name: string; nameT: number; f: number }> = ({ cx, ground, h, dist, tone, seed, name, nameT, f }) => {
  const ph = walkPhase(dist, h);
  const poleY = ground - h * 0.79 + Math.abs(Math.sin(ph)) * 1.2;
  const offs = [-1.42, -1.05, 1.05, 1.42];
  const len = h * 2.5;
  return (
    <g>
      {offs.map((o, i) => (
        <GroundShadow key={i} x={cx + o * h + 10} y={ground} w={h * 0.5} />
      ))}
      {/* far-side bearers */}
      {[offs[0], offs[2]].map((o, i) => (
        <Figure key={i} x={cx + o * h + h * 0.14} y={ground - 3} h={h * 0.97} kind="bearer" phase={ph + Math.PI * 0.5 + i} armF={168} opacity={0.72} />
      ))}
      {/* platform, cloth and coffin */}
      <rect x={cx - h * 1.75} y={poleY - 5} width={h * 3.5} height={7} fill={C.earth} />
      <RRect x={cx - len * 0.52} y={poleY - 16} w={len * 1.04} h={12} seed={seed} fill={C.shadow} amp={1} />
      {Array.from({ length: 9 }, (_, i) => {
        const x0 = cx - len * 0.5 + (len * i) / 9;
        const sw = Math.sin(f * 0.12 + i * 0.9) * 3;
        return <path key={i} d={`M${x0} ${poleY - 5}L${x0 + len / 9} ${poleY - 5}L${x0 + len / 18 + sw} ${poleY + h * 0.14}Z`} fill={i % 2 ? C.terra : C.cream} />;
      })}
      <CoffinSide x={cx} y={poleY - 15} len={len} tone={tone} seed={seed} royal />
      {/* near-side bearers */}
      {[offs[1], offs[3]].map((o, i) => (
        <Figure key={i} x={cx + o * h} y={ground} h={h} kind="bearer" phase={ph + i * 0.8} armF={166} />
      ))}
      {/* nameplate */}
      <g opacity={nameT} transform={`translate(${cx} ${poleY - h * 0.95 - (1 - nameT) * 10})`}>
        <path d={`M0 30L0 ${h * 0.3}`} stroke={C.ink} strokeWidth={2} />
        <RRect x={-name.length * 15 - 26} y={-30} w={name.length * 30 + 52} h={60} seed={seed + 3} fill={C.cream} stroke={C.gold} strokeWidth={2} amp={1.4} />
        <Label x={0} y={12} text={name} size={32} spacing={0.22} weight={600} />
      </g>
    </g>
  );
};

/** 00:50 — THE GREAT PHARAOHS. Seti I and Ramesses II carried across the desert floor. */
export const Scene06Pharaohs: React.FC = () => {
  const f = useSceneFrame();
  const d1 = (f + 20) * 0.78;
  const d2 = (f + 20) * 1.0;
  return (
    <Camera x={mix(-30, 90, ramp(f, 0, 300, (t) => t))} zoom={1.02} cy={1000}>
      <Layer depth={0.15}>
        <Ridge x={-200} y={800} w={1600} h={70} seed={9} color={C.paperDark} />
      </Layer>
      <Layer depth={0.3}>
        <Cliff id="s6c" x={520} baseY={828} w={900} h={250} seed={22} color={C.sand} shade={C.gold} scree={C.paperDark} peak={0.6} peakiness={0.45} strata={false} />
      </Layer>
      <Layer depth={0.75}>
        <Ground y={900} seed={3} h={200} dense={0.7} />
        <Bier cx={300 + d1} ground={918} h={128} dist={d1} tone="teal" seed={5} name="SETI I" nameT={ramp(f, 72, 100)} f={f} />
        {/* a priest walks ahead */}
        <GroundShadow x={300 + d1 + 310} y={918} w={60} />
        <Figure x={300 + d1 + 300} y={918} h={128} kind="priest" phase={walkPhase(d1, 128)} armF={70} />
        <rect x={300 + d1 + 300 + 34} y={918 - 150} width={5} height={150} fill={C.earth} />
      </Layer>
      <Layer depth={1}>
        <Ground y={1206} seed={7} dense={1.1} />
        <Bier cx={170 + d2} ground={1226} h={168} dist={d2} tone="gold" seed={9} name="RAMESSES II" nameT={ramp(f, 116, 146)} f={f} />
        <SandDrift f={f} y={1180} h={110} seed={9} count={26} speed={0.6} opacity={0.5} />
      </Layer>
    </Camera>
  );
};
