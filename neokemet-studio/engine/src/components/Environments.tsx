import React from "react";
import type { CameraId, EnvId } from "../../../shared/catalog.ts";
import { easeInOut, mix, ramp } from "../lib/anim";
import { C } from "../lib/theme";
import { Birds, Haze, SandDrift } from "./Atmosphere";
import { Layer } from "./Camera";
import { Cliff, HatshepsutTemple, House, Palm, Ridge } from "./Landscape";
import { Boat, Column, Stall } from "./Objects";
import { Ground, RPoly, RRect, Streaks, Stipple } from "./Print";

/** Ground line shared by every environment: characters stand on y = GROUND. */
export const GROUND = 1200;
// Environments are drawn wider than any output format needs (16:9 sees x −420 … 1500).
const X0 = -760;
const WW = 2600;

/** Camera move presets, eased over the whole scene (p = 0 → 1). */
export const cameraMove = (camera: CameraId | undefined, p: number) => {
  const t = easeInOut(Math.max(0, Math.min(1, p)));
  switch (camera) {
    case "pull-back": return { x: 0, y: mix(20, 0, t), zoom: mix(1.18, 1.0, t) };
    case "pan-right": return { x: mix(-90, 90, t), y: 0, zoom: 1.06 };
    case "pan-left": return { x: mix(90, -90, t), y: 0, zoom: 1.06 };
    case "rise": return { x: 0, y: mix(150, -10, t), zoom: 1.08 };
    case "static": return { x: 0, y: 0, zoom: 1.02 };
    case "push-in":
    default: return { x: 0, y: mix(0, 16, t), zoom: mix(1.0, 1.15, t) };
  }
};

/** Large pyramid with dry-brushed masonry courses and a shaded face. */
export const BigPyramid: React.FC<{ id: string; x: number; y: number; w: number; seed?: number; color?: string }> = ({ id, x, y, w, seed = 1, color = C.gold }) => {
  const h = w * 0.64;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={`M${x - w / 2} ${y}L${x} ${y - h}L${x + w / 2} ${y}Z`} />
        </clipPath>
      </defs>
      <RPoly pts={[[x - w / 2, y], [x, y - h], [x + w / 2, y]]} seed={seed} fill={color} amp={2.4} />
      <RPoly pts={[[x - w / 2, y], [x, y - h], [x - w * 0.2, y]]} seed={seed + 1} fill={C.teal} amp={2} opacity={0.85} />
      <g clipPath={`url(#${id})`}>
        <Streaks x={x - w / 2} y={y - h} w={w} h={h} seed={seed + 2} count={Math.round(w / 3.2)} color={C.earth} opacity={0.42} maxLen={170} thick={3} />
        <Streaks x={x - w / 2} y={y - h} w={w} h={h} seed={seed + 3} count={Math.round(w / 4)} color={C.paper} opacity={0.5} maxLen={130} thick={3} />
      </g>
    </g>
  );
};

/**
 * Everything behind the actors, as depth-sorted layers. Must be rendered
 * inside a <Camera>. `f` is the scene frame for wind, water and birds.
 */
export const Backdrop: React.FC<{ env: EnvId; f: number; seed?: number; appear?: number }> = ({ env, f, seed = 1, appear = 1 }) => {
  const sky = (
    <Layer depth={0.14}>
      <Birds f={f} x={120} y={680} seed={seed + 2} count={3} speed={0.4} spread={80} />
    </Layer>
  );
  const floor = (
    <Layer depth={1}>
      <Ground y={GROUND - 6} seed={seed + 5} x={X0} w={WW} dense={2.2} />
      <SandDrift f={f} y={GROUND - 30} h={120} seed={seed + 3} count={22} speed={0.5} opacity={0.4} />
    </Layer>
  );
  switch (env) {
    case "giza-pyramids":
      return (
        <g opacity={appear}>
          {sky}
          <Layer depth={0.18}><Ridge x={X0} y={1050} w={WW} h={70} seed={seed + 4} color={C.paperDark} /></Layer>
          <Layer depth={0.4}><BigPyramid id={`pyC${seed}`} x={960} y={1120} w={470} seed={seed + 30} color={C.sand} /></Layer>
          <Layer depth={0.55}><BigPyramid id={`pyB${seed}`} x={640} y={1150} w={720} seed={seed + 20} color={C.sand} /></Layer>
          <Layer depth={0.7}>
            <BigPyramid id={`pyA${seed}`} x={270} y={1176} w={640} seed={seed + 10} />
            <BigPyramid id={`pyD${seed}`} x={690} y={1186} w={250} seed={seed + 40} />
          </Layer>
          {floor}
          <Layer depth={1.35}>
            <Palm x={1010} y={1470} h={560} f={f} seed={seed + 5} lean={-36} />
            <Palm x={1120} y={1500} h={360} f={f} seed={seed + 8} lean={-20} />
          </Layer>
        </g>
      );
    case "deir-el-bahari":
    case "theban-cliffs":
      return (
        <g opacity={appear}>
          {sky}
          <Layer depth={0.2}><Ridge x={X0} y={1060} w={WW} h={90} seed={seed + 4} color={C.paperDark} /></Layer>
          <Layer depth={0.5}><Cliff id={`clF${seed}`} x={X0} baseY={1120} w={WW} h={400} seed={seed + 30} color={C.sand} shade={C.gold} scree={C.paperDark} peak={0.62} peakiness={0.3} strata={false} /></Layer>
          <Layer depth={0.8}><Cliff id={`clM${seed}`} x={-560} baseY={1176} w={2200} h={env === "deir-el-bahari" ? 560 : 500} seed={seed + 16} peak={0.5} peakiness={0.45} screeH={0.3} /></Layer>
          {env === "deir-el-bahari" && <Layer depth={0.9}><HatshepsutTemple x={560} y={1184} s={1.15} /></Layer>}
          {floor}
        </g>
      );
    case "nile-valley":
      return (
        <g opacity={appear}>
          {sky}
          <Layer depth={0.3}><Cliff id={`nvC${seed}`} x={X0} baseY={900} w={WW} h={260} seed={seed + 30} color={C.sand} shade={C.gold} scree={C.paperDark} peak={0.3} peakiness={0.3} strata={false} /></Layer>
          <Layer depth={0.6}>
            <RRect x={X0} y={900} w={WW} h={90} seed={seed + 11} fill={C.sand} amp={4} step={30} />
            <RRect x={X0} y={900} w={WW} h={90} seed={seed + 11} fill={C.teal} amp={4} step={30} opacity={0.5} />
            {[-300, -80, 130, 420, 700, 980, 1240].map((x, i) => <Palm key={x} x={x} y={940 + (i % 3) * 16} h={150 + (i % 2) * 40} f={f} seed={seed + i} lean={(i % 2 ? -1 : 1) * 12} />)}
          </Layer>
          <Layer depth={0.85}>
            <RRect x={X0} y={980} w={WW} h={230} seed={seed + 14} fill={C.shadow} amp={5} step={34} />
            <Streaks x={X0} y={990} w={WW} h={210} seed={seed + 15} count={150} color={C.teal} opacity={0.8} maxLen={300} thick={5} />
            <Streaks x={X0 + ((f * 0.5) % 60)} y={990} w={WW} h={210} seed={seed + 16} count={90} color={C.paper} opacity={0.4} maxLen={120} thick={2} />
            <Boat x={260 + f * 0.4} y={1070} s={1.3} />
            <Boat x={860 - f * 0.25} y={1150} s={-1} />
          </Layer>
          {floor}
          <Layer depth={1.3}><Palm x={1000} y={1460} h={520} f={f} seed={seed + 9} lean={-30} /></Layer>
        </g>
      );
    case "temple-courtyard":
      return (
        <g opacity={appear}>
          {sky}
          <Layer depth={0.3}>
            <RPoly pts={[[560, 1100], [620, 520], [1120, 520], [1180, 1100]]} seed={seed + 3} fill={C.paperDark} amp={2} />
            <rect x={612} y={506} width={516} height={18} fill={C.sand} />
            <Streaks x={590} y={540} w={570} h={540} seed={seed + 4} count={50} color={C.sand} opacity={0.7} maxLen={120} />
            <RRect x={830} y={850} w={84} h={250} seed={seed + 5} fill={C.teal} opacity={0.55} />
          </Layer>
          <Layer depth={0.55}>
            <RRect x={X0} y={590} w={1330} h={46} seed={seed + 7} fill={C.sand} amp={1.5} />
            <rect x={X0} y={590} width={1330} height={9} fill={C.teal} />
            {[-560, -370, -180, 10, 200, 390].map((x, i) => <Column key={x} x={x} y={1120} h={426} w={74} seed={seed + 10 + i} />)}
            <RRect x={X0} y={1030} w={WW} h={120} seed={seed + 8} fill={C.paperDark} amp={1.6} />
            <rect x={X0} y={1030} width={WW} height={10} fill={C.gold} opacity={0.7} />
            <rect x={X0} y={1104} width={WW} height={8} fill={C.teal} opacity={0.7} />
          </Layer>
          <Layer depth={0.8}>
            <Palm x={960} y={1150} h={520} f={f} seed={seed + 3} lean={-34} />
            <Palm x={1240} y={1160} h={400} f={f} seed={seed + 6} lean={18} />
          </Layer>
          {floor}
          <Layer depth={1}>{[1236, 1300, 1380].map((y, i) => <rect key={y} x={X0} y={y} width={WW} height={2} fill={C.gold} opacity={0.35 - i * 0.08} />)}</Layer>
        </g>
      );
    case "village":
      return (
        <g opacity={appear}>
          {sky}
          <Layer depth={0.3}><Cliff id={`viC${seed}`} x={X0} baseY={966} w={WW} h={390} seed={seed + 13} color={C.sand} shade={C.gold} scree={C.paperDark} peak={0.7} peakiness={0.4} /></Layer>
          <Layer depth={0.6}>
            <Ground y={1030} seed={seed + 3} h={120} dense={1.4} x={X0} w={WW} />
            {[[-520, 190, 120], [-300, 150, 96], [-110, 210, 140], [130, 180, 110], [330, 140, 92], [520, 230, 150], [790, 150, 100], [980, 200, 126], [1220, 170, 110]].map(([x, w, h], i) => (
              <House key={i} x={x} y={1044} w={w} h={h} seed={seed + i * 2} color={i % 2 ? C.sand : C.gold} dome={i % 4 === 1} />
            ))}
          </Layer>
          <Layer depth={0.75}>
            <Palm x={-160} y={1070} h={360} f={f} seed={seed + 2} lean={-16} />
            <Palm x={300} y={1070} h={330} f={f} seed={seed + 4} lean={18} />
            <Palm x={880} y={1074} h={400} f={f} seed={seed + 7} lean={-22} />
          </Layer>
          {floor}
          <Layer depth={1}><RPoly pts={[[X0, 1200], [X0 + WW, 1200], [X0 + WW, 1240], [X0, 1240]]} seed={seed + 21} fill={C.paperDark} amp={4} step={30} /></Layer>
        </g>
      );
    case "market":
      return (
        <g opacity={appear}>
          <Layer depth={0.5}>
            {[[-560, 250, 250], [-290, 220, 300], [-50, 260, 250], [240, 210, 300], [480, 300, 230], [810, 260, 290], [1100, 240, 250]].map(([x, w, h], i) => (
              <House key={i} x={x} y={1130} w={w} h={h} seed={seed + i * 2 + 1} color={i % 2 ? C.sand : C.paperDark} dome={i === 3} />
            ))}
          </Layer>
          <Layer depth={0.85}>
            <Ground y={1140} seed={seed + 3} h={100} dense={1.4} x={X0} w={WW} />
            <Stall x={-330} y={1180} w={280} a={C.gold} b={C.cream} seed={seed + 1} f={f} />
            <Stall x={40} y={1180} w={280} a={C.teal} b={C.cream} seed={seed + 2} f={f} />
            <Stall x={400} y={1170} w={250} a={C.terra} b={C.cream} seed={seed + 5} f={f} />
            <Stall x={730} y={1180} w={280} a={C.gold} b={C.shadow} seed={seed + 8} f={f} />
            <Stall x={1090} y={1180} w={270} a={C.teal} b={C.cream} seed={seed + 9} f={f} />
          </Layer>
          {floor}
        </g>
      );
    case "tomb-wall":
      return (
        <g opacity={appear}>
          <Layer depth={0.7}>
            <RRect x={X0} y={330} w={WW} h={880} seed={seed + 22} fill={C.sand} amp={2} />
            <Streaks x={X0} y={420} w={WW} h={780} seed={seed + 23} count={230} color={C.paper} opacity={0.4} maxLen={170} thick={3} />
            {[540, 660, 780, 900, 1020, 1120].map((y, i) => <rect key={y} x={X0} y={y} width={WW} height={2} fill={C.gold} opacity={0.5 - i * 0.03} />)}
            <rect x={X0} y={340} width={WW} height={62} fill={C.shadow} />
            {Array.from({ length: 66 }, (_, i) => <path key={i} d={`M${X0 + 12 + i * 40} 396L${X0 + 24 + i * 40} 352Q${X0 + 30 + i * 40} 344 ${X0 + 36 + i * 40} 352L${X0 + 48 + i * 40} 396Z`} fill={[C.gold, C.terra, C.sand][i % 3]} />)}
          </Layer>
          <Layer depth={1}>
            <RRect x={X0} y={GROUND - 4} w={WW} h={260} seed={seed + 25} fill={C.earth} amp={3} />
            <Streaks x={X0} y={GROUND} w={WW} h={250} seed={seed + 26} count={130} color={C.gold} opacity={0.5} maxLen={150} />
            <Stipple x={X0} y={GROUND} w={WW} h={250} seed={seed + 27} count={300} color={C.paperDark} opacity={0.5} />
          </Layer>
        </g>
      );
    case "open-desert":
    default:
      return (
        <g opacity={appear}>
          {sky}
          <Layer depth={0.2}><Ridge x={X0} y={1030} w={WW} h={110} seed={seed + 4} color={C.paperDark} /></Layer>
          <Layer depth={0.45}><Ridge x={X0} y={1100} w={WW} h={170} seed={seed + 9} color={C.sand} /></Layer>
          <Layer depth={0.75}>
            <Ridge x={-900} y={1196} w={1500} h={210} seed={seed + 12} color={C.gold} />
            <Ridge x={500} y={1196} w={1500} h={150} seed={seed + 14} color={C.gold} />
            <Streaks x={X0} y={1000} w={WW} h={190} seed={seed + 15} count={120} color={C.paper} opacity={0.4} maxLen={200} thick={3} />
          </Layer>
          {floor}
          <Layer depth={1}><Haze id={`hz${seed}`} y={1010} h={160} opacity={0.5} /></Layer>
        </g>
      );
  }
};

export const fadeIn = (f: number, a = 0, b = 18) => ramp(f, a, b);
