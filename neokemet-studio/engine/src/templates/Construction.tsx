import React from "react";
import { paramOf } from "../../../shared/params.ts";
import { useClock } from "../components/AnimatedScene";
import { Camera, Layer } from "../components/Camera";
import { BigPyramid, cameraMove, ConstructionRamp, FarDesert as Far, GROUND, QuarryFace, SiteFloor as Floor, UnfinishedPyramid } from "../components/Environments";
import { Figure } from "../components/Figures";
import { Palm, Ridge } from "../components/Landscape";
import { Sledge, StoneBarge, StoneBlock, ToolKit } from "../components/Objects";
import { Ground, Label, RRect, Streaks } from "../components/Print";
import { mix, pulse, ramp } from "../lib/anim";
import { C } from "../lib/theme";
import { HaulTeam, P2, ToolWorker } from "../components/Workers";
import { Caption, TemplateProps, TitleBlock } from "./common";

// Building scenes drawn with the original print library: a ramp that is really
// there, a block that is really on a sledge, and a crew that is really pulling
// it. One template, six compositions ("view"), all configurable from the
// storyboard. Art stays between y 560 (under the caption) and y 1170 (above
// the subtitle strip) so type never covers the subject.

const X0 = -760, WW = 2600;
const CREW: Record<string, number> = { two: 2, four: 4, six: 6 };

/** A few spare blocks stacked on the ground. */
const Stockpile: React.FC<{ x: number; y: number; s?: number; seed: number }> = ({ x, y, s = 1, seed }) => (
  <g>
    <StoneBlock x={x} y={y} w={110 * s} h={64 * s} seed={seed} />
    <StoneBlock x={x + 118 * s} y={y} w={96 * s} h={58 * s} seed={seed + 4} />
    <StoneBlock x={x + 52 * s} y={y - 62 * s} w={104 * s} h={60 * s} seed={seed + 8} />
  </g>
);

type ViewProps = { f: number; D: number; seed: number; crew: number; tools: boolean; progress: number };
const PROGRESS: Record<string, number> = { early: 0.24, "half built": 0.45, "nearly complete": 0.74 };

/** The whole site: a half-built pyramid and one long ramp climbing to its working level. */
const RampWide: React.FC<ViewProps> = ({ f, seed, crew, tools, progress }) => {
  const base = GROUND - 2, w = 880, px = 820;
  const topY = base - w * 0.64 * progress, edge = px - (w / 2) * (1 - progress);
  const foot: P2 = [-70, base], head: P2 = [edge + 12, topY];
  return (
    <>
      <Far f={f} seed={seed} pyramids={false} />
      <Layer depth={1}>
        <UnfinishedPyramid id={`cnP${seed}`} x={px} baseY={base} w={w} progress={progress} seed={seed + 10} />
        <ConstructionRamp id={`cnR${seed}`} foot={foot} head={head} baseY={base} seed={seed + 20} />
        <HaulTeam a={foot} b={head} at={150} n={Math.min(crew, 4)} h={88} f={f} sledgeW={132} block={{ w: 88, h: 60 }} seed={seed} pourer={false} />
        {/* masons setting a block on the working level */}
        <Figure x={px - 48} y={topY} h={64} kind="bearer" lean={10} armF={56} armB={40} />
        <StoneBlock x={px} y={topY} w={46} h={30} seed={seed + 3} />
        <Figure x={px + 48} y={topY} h={64} kind="bearer" dir={-1} lean={10} armF={56} armB={40} />
        <Floor f={f} seed={seed} />
        <Stockpile x={770} y={GROUND + 22} s={0.8} seed={seed + 40} />
        <Figure x={690} y={GROUND + 24} h={104} kind="scribe" dir={-1} armF={74} />
      </Layer>
      {tools && <Layer depth={1.2}><ToolKit x={120} y={1352} s={1.25} set="haulers" /></Layer>}
    </>
  );
};

/** Close on the work itself: one block on its sledge, the crew on the rope, the slope under their feet. */
const Hauling: React.FC<ViewProps> = ({ f, seed, crew, tools, progress }) => {
  const a: P2 = [-520, 1262], b: P2 = [1640, 834];
  const h = crew > 4 ? 178 : 204;
  return (
    <>
      <Far f={f} seed={seed} ridgeY={980} />
      <Layer depth={0.6}><UnfinishedPyramid id={`cnP${seed}`} x={1340} baseY={1180} w={1500} progress={Math.min(0.62, progress + 0.05)} seed={seed + 10} color={C.sand} ghost={false} /></Layer>
      <Layer depth={1}>
        <ConstructionRamp id={`cnR${seed}`} foot={a} head={b} baseY={1560} seed={seed + 20} />
        <HaulTeam a={a} b={b} at={crew > 4 ? 150 : 190} n={crew} h={h} f={f} sledgeW={300} block={{ w: 196, h: 136 }} gap={crew > 4 ? 100 : crew > 2 ? 128 : 170} seed={seed} />
      </Layer>
      <Layer depth={1.22}>
        {/* foreground berm with the crew's kit */}
        <RRect x={X0} y={1300} w={WW} h={400} seed={seed + 50} fill={C.paper} amp={5} step={40} />
        <Ground y={1304} seed={seed + 51} x={X0} w={WW} dense={2} h={300} />
        {tools && <ToolKit x={120} y={1378} s={1.5} set="haulers" />}
        <Stockpile x={770} y={1384} s={1.05} seed={seed + 40} />
      </Layer>
    </>
  );
};

/** Side-view diagram: the same slope at three building heights, so the ramp's growth can be read off. */
const RampGrowth: React.FC<ViewProps & { flip: boolean }> = ({ f, D, seed, flip }) => {
  const rows = [{ y: 716, k: 0.3 }, { y: 932, k: 0.6 }, { y: 1148, k: 0.9 }];
  const w = 256, px = 890, tan = Math.tan((10 * Math.PI) / 180);
  const span = Math.min(D * 0.14, 40);
  return (
    <Layer depth={1}>
      {rows.map((r, i) => {
        const t = ramp(f, i * span, i * span + span);
        const rise = w * 0.64 * r.k, headX = px - (w / 2) * (1 - r.k), run = rise / tan, footX = headX - run * t;
        const top = r.y - rise;
        return (
          <g key={i} opacity={Math.min(1, t * 3)}>
            <rect x={X0} y={r.y} width={WW} height={2} fill={C.ink} opacity={0.35} />
            <UnfinishedPyramid id={`cnG${seed}${i}`} x={px} baseY={r.y} w={w} progress={r.k} seed={seed + i * 7} />
            {t > 0.04 && <ConstructionRamp id={`cnH${seed}${i}`} foot={[footX, r.y]} head={[headX, r.y - rise * t]} baseY={r.y} seed={seed + 20 + i} sleepers={false} />}
            {/* ramp length, measured along the ground */}
            <g opacity={t}>
              <rect x={footX} y={r.y + 20} width={headX - footX} height={3} fill={C.terra} />
              <rect x={footX - 1} y={r.y + 11} width={3} height={21} fill={C.terra} />
              <rect x={headX - 2} y={r.y + 11} width={3} height={21} fill={C.terra} />
            </g>
            {/* height marker */}
            <g opacity={t}>
              <rect x={1034} y={top} width={3} height={rise} fill={C.shadow} />
              <rect x={1024} y={top - 1} width={23} height={3} fill={C.shadow} />
              <rect x={1024} y={r.y - 2} width={23} height={3} fill={C.shadow} />
              <path d={`M1020 ${top}l-16 -9l0 18Z`} fill={C.terra} />
            </g>
            <g transform={flip ? `translate(1080 0) scale(-1 1)` : undefined} opacity={t}>
              <Label x={flip ? 1080 - 56 : 56} y={r.y - 132} text={["LOW", "HALFWAY", "NEAR THE TOP"][i]} size={21} spacing={0.24} anchor={flip ? "end" : "start"} weight={600} opacity={0.8} />
            </g>
          </g>
        );
      })}
    </Layer>
  );
};

/** Two registers: the finished pyramid alone, and the same pyramid with the ramp that would have built it. */
const Comparison: React.FC<ViewProps> = ({ f, D, seed }) => {
  const top = 846, bot = 1160, w = 400, rise = w * 0.64;
  const t = ramp(f, Math.min(20, D * 0.1), Math.min(70, D * 0.35));
  const head: P2 = [716, bot - rise * 0.7], foot: P2 = [mix(640, -330, t), bot];
  return (
    <Layer depth={1}>
      <rect x={X0} y={top} width={WW} height={2} fill={C.ink} opacity={0.35} />
      <BigPyramid id={`cnA${seed}`} x={540} y={top} w={w} seed={seed + 10} />
      <Figure x={300} y={top} h={40} kind="bearer" phase={f * 0.05} />
      <Streaks x={X0} y={top + 4} w={WW} h={14} seed={seed + 2} count={60} color={C.sand} opacity={0.8} maxLen={220} thick={5} />
      {/* divider */}
      <g opacity={0.6}>
        <rect x={340} y={top + 34} width={400} height={2} fill={C.ink} />
        <rect x={535} y={top + 30} width={10} height={10} fill={C.ink} transform={`rotate(45 540 ${top + 35})`} />
      </g>
      <rect x={X0} y={bot} width={WW} height={2} fill={C.ink} opacity={0.35} />
      <BigPyramid id={`cnB${seed}`} x={770} y={bot} w={w} seed={seed + 10} />
      <g opacity={Math.min(1, t * 2.5)}>
        <ConstructionRamp id={`cnR${seed}`} foot={foot} head={[head[0], mix(bot - 8, head[1], t)]} baseY={bot} seed={seed + 20} sleepers={false} />
        {t > 0.6 && <HaulTeam a={foot} b={head} at={120} n={3} h={46} f={f} sledgeW={70} block={{ w: 46, h: 30 }} seed={seed} pourer={false} />}
      </g>
      <Streaks x={X0} y={bot + 4} w={WW} h={14} seed={seed + 3} count={60} color={C.sand} opacity={0.8} maxLen={220} thick={5} />
    </Layer>
  );
};

/** The quarry: a stepped face, men freeing blocks, one block already on its sledge. */
const Quarry: React.FC<ViewProps> = ({ f, seed, crew, tools }) => {
  const base = GROUND + 2, h = 520, w = 900, x = -40;
  const bench = (u: number, v: number): P2 => [x + u * w, base - v * h];
  const men: [P2, 1 | -1][] = [[bench(0.13, 1), 1], [bench(0.4, 0.72), 1], [bench(0.64, 0.44), 1]];
  return (
    <>
      <Far f={f} seed={seed} ridgeY={1000} />
      <Layer depth={0.5}><Ridge x={X0} y={1090} w={WW} h={150} seed={seed + 9} color={C.sand} opacity={0.7} /></Layer>
      <Layer depth={1}>
        {/* the uncut hill the face is being worked back into */}
        <RRect x={X0} y={base - h} w={x - X0 + 6} h={h} seed={seed + 12} fill={C.sand} amp={2.2} />
        <Streaks x={X0} y={base - h} w={x - X0} h={h} seed={seed + 13} count={220} color={C.gold} opacity={0.5} maxLen={150} thick={3} />
        <QuarryFace id={`cnQ${seed}`} x={x} baseY={base} w={w} h={h} seed={seed + 10} />
        {men.slice(0, crew > 2 ? 3 : 2).map(([p, d], i) => (
          <g key={i}>
            <ToolWorker x={p[0]} y={p[1]} h={118} f={f} tool={i === 1 ? "chisel" : "mallet"} dir={d} k={i * 2} shadow={false} />
            <StoneBlock x={p[0] + d * 78} y={p[1]} w={70} h={44} seed={seed + i * 5} />
          </g>
        ))}
        <Floor f={f} seed={seed} />
        <HaulTeam a={[300, GROUND + 30]} b={[1500, GROUND + 30]} at={560} n={crew > 4 ? 3 : 2} h={128} f={f} sledgeW={176} block={{ w: 116, h: 80 }} gap={92} seed={seed} pourer={false} />
        <Stockpile x={230} y={GROUND + 30} s={0.85} seed={seed + 40} />
      </Layer>
      {tools && <Layer depth={1.2}><ToolKit x={140} y={1366} s={1.4} set="quarry" /></Layer>}
    </>
  );
};

/** Stone on the river: a loaded barge crossing in front of the far bank. */
const River: React.FC<ViewProps> = ({ f, seed, tools }) => {
  const bob = Math.sin(f * 0.08) * 4;
  const bx = 470 + f * 0.35;
  return (
    <>
      <Far f={f} seed={seed} ridgeY={900} />
      <Layer depth={0.45}><UnfinishedPyramid id={`cnP${seed}`} x={800} baseY={930} w={380} progress={0.6} seed={seed + 10} color={C.sand} /></Layer>
      <Layer depth={0.6}>
        <RRect x={X0} y={920} w={WW} h={90} seed={seed + 11} fill={C.sand} amp={4} step={30} />
        <RRect x={X0} y={920} w={WW} h={90} seed={seed + 11} fill={C.teal} amp={4} step={30} opacity={0.5} />
        {[-300, -60, 170, 400, 1010, 1250].map((px, i) => <Palm key={px} x={px} y={960 + (i % 3) * 14} h={150 + (i % 2) * 40} f={f} seed={seed + i} lean={(i % 2 ? -1 : 1) * 12} />)}
      </Layer>
      <Layer depth={1}>
        <RRect x={X0} y={1000} w={WW} h={330} seed={seed + 14} fill={C.shadow} amp={5} step={34} />
        <Streaks x={X0} y={1010} w={WW} h={310} seed={seed + 15} count={190} color={C.teal} opacity={0.8} maxLen={300} thick={5} />
        <Streaks x={X0 + ((f * 0.5) % 60)} y={1010} w={WW} h={310} seed={seed + 16} count={110} color={C.paper} opacity={0.4} maxLen={120} thick={2} />
        <g transform={`translate(0 ${bob.toFixed(2)})`}>
          <Figure x={bx - 250} y={1084} h={120} kind="bearer" lean={-6} armF={-40} armB={-58} />
          <StoneBarge x={bx} y={1110} s={1.55} seed={seed} />
          <Figure x={bx + 232} y={1084} h={116} kind="bearer" armF={62} />
        </g>
      </Layer>
      <Layer depth={1.2}>
        {/* near bank: the next load waiting */}
        <RRect x={X0} y={1310} w={WW} h={400} seed={seed + 50} fill={C.paper} amp={5} step={40} />
        <Ground y={1314} seed={seed + 51} x={X0} w={WW} dense={2} h={300} />
        <Sledge x={800} y={1392} w={210} seed={seed + 6} block={{ w: 140, h: 92 }} />
        {tools && <ToolKit x={130} y={1392} s={1.4} set="haulers" />}
      </Layer>
    </>
  );
};

export const ConstructionTemplate: React.FC<TemplateProps> = ({ scene, seed }) => {
  const { f, D, p } = useClock();
  const view = paramOf(scene, "view");
  const flip = paramOf(scene, "facing") === "left";
  const vp: ViewProps = { f, D, seed, crew: CREW[paramOf(scene, "crew")] ?? 4, tools: paramOf<boolean>(scene, "showTools"), progress: PROGRESS[paramOf(scene, "stage")] ?? 0.45 };
  const diagram = view === "ramp growth" || view === "comparison";
  const cam = cameraMove(scene.camera ?? (diagram ? "static" : "push-in"), p);
  const art =
    view === "hauling" ? <Hauling {...vp} /> :
    view === "ramp growth" ? <RampGrowth {...vp} flip={flip} /> :
    view === "comparison" ? <Comparison {...vp} /> :
    view === "quarry" ? <Quarry {...vp} /> :
    view === "river transport" ? <River {...vp} /> :
    <RampWide {...vp} />;
  const t = pulse(f, Math.min(20, D * 0.1), Math.min(50, D * 0.25), D - 30, D - 6);
  return (
    <Camera {...cam} cy={1040}>
      <g transform={flip ? "translate(1080 0) scale(-1 1)" : undefined}>{art}</g>
      {paramOf(scene, "heading") === "title"
        ? <TitleBlock title={scene.label} sub={scene.sublabel} t={ramp(f, Math.min(12, D * 0.08), Math.min(40, D * 0.25))} />
        : <Caption label={scene.label} sub={scene.sublabel} t={t} />}
    </Camera>
  );
};
