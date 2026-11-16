import React from "react";
import { paramOf } from "../../../shared/params.ts";
import { useClock } from "../components/AnimatedScene";
import { Camera, Layer } from "../components/Camera";
import { cameraMove, FarDesert, GROUND, lineY, SiteFloor } from "../components/Environments";
import { Figure, GroundShadow, walkPhase } from "../components/Figures";
import { Palm, Ridge } from "../components/Landscape";
import { Boat, Rope, RopeCoil, ToolKit } from "../components/Objects";
import { Ground, RPoly, RRect, Streaks } from "../components/Print";
import { CargoBoat, Log, LogPile, MastAndSail, Plank, PlankStack, ReedShed, Reeds, RibTimber, Shavings, ShipHull, Trestle } from "../components/Ships";
import { Carriers, hand, P2, RopeGang, ToolWorker } from "../components/Workers";
import { mix, pulse, ramp } from "../lib/anim";
import { C } from "../lib/theme";
import { Caption, TemplateProps, TitleBlock } from "./common";

// Boatbuilding, from timber to a vessel under sail. Eight compositions on one
// template; each shows its own subject (a hull at a different stage, a
// different job, a different setting), so no two read as the same picture.
// Art stays between y 560 and y 1170, clear of the caption and the subtitles.

const X0 = -760, WW = 2600;
const CREW: Record<string, number> = { two: 2, four: 4, six: 6 };
type ViewProps = { f: number; D: number; seed: number; crew: number; tools: boolean };

/** The Nile behind a working bank: far shore with palms, then the river itself. */
const River: React.FC<{ f: number; seed: number; top?: number; h?: number; boat?: boolean }> = ({ f, seed, top = 975, h = 240, boat }) => (
  <>
    <FarDesert f={f} seed={seed} ridgeY={top - 66} />
    <Layer depth={0.6}>
      <RRect x={X0} y={top - 70} w={WW} h={90} seed={seed + 11} fill={C.sand} amp={4} step={30} />
      <RRect x={X0} y={top - 70} w={WW} h={90} seed={seed + 11} fill={C.teal} amp={4} step={30} opacity={0.5} />
      {[-330, -90, 150, 600, 880, 1240].map((px, i) => <Palm key={px} x={px} y={top - 30 + (i % 3) * 14} h={140 + (i % 2) * 40} f={f} seed={seed + i} lean={(i % 2 ? -1 : 1) * 12} />)}
    </Layer>
    <Layer depth={0.85}>
      <RRect x={X0} y={top} w={WW} h={h} seed={seed + 14} fill={C.shadow} amp={5} step={34} />
      <Streaks x={X0} y={top + 10} w={WW} h={h - 20} seed={seed + 15} count={Math.round(h * 0.65)} color={C.teal} opacity={0.8} maxLen={300} thick={5} />
      <Streaks x={X0 + ((f * 0.5) % 60)} y={top + 10} w={WW} h={h - 20} seed={seed + 16} count={Math.round(h * 0.4)} color={C.paper} opacity={0.4} maxLen={120} thick={2} />
      {boat && <Boat x={820 - f * 0.25} y={top + 46} s={-0.8} />}
    </Layer>
  </>
);
const Standing: React.FC<{ x: number; y: number; h: number; dir?: 1 | -1; armF?: number; armB?: number; lean?: number; kind?: "bearer" | "scribe" | "worker" }> = ({ x, y, h, dir = 1, armF, armB, lean, kind = "bearer" }) => (
  <g><GroundShadow x={x + dir * 6} y={y} w={h * 0.4} /><Figure x={x} y={y} h={h} kind={kind} dir={dir} armF={armF} armB={armB} lean={lean} /></g>
);

/** The whole yard: a hull half planked on the stocks, timber coming in, a reed shed, the river behind. */
const Yard: React.FC<ViewProps> = ({ f, seed, crew, tools }) => {
  const g = GROUND + 16;
  return (
    <>
      <River f={f} seed={seed} boat />
      <Layer depth={1}>
        <ReedShed x={896} y={g - 6} w={270} h={236} seed={seed + 30} />
        <PlankStack x={800} y={g - 2} len={196} rows={4} seed={seed + 31} />
        <LogPile x={-360} y={g} len={260} rows={3} seed={seed + 33} />
        <ShipHull id={`syH${seed}`} x={410} y={1118} a={290} H={100} stage="half" seed={seed + 10} stocks={g - 1118} />
        <SiteFloor f={f} seed={seed} />
        <ToolWorker x={286} y={g + 4} h={150} f={f} tool="mallet" />
        <ToolWorker x={560} y={g + 4} h={150} f={f} tool="adze" dir={-1} k={2} />
        {crew > 2 && <Carriers x={30} y={g + 38} h={142} f={f} len={220} speed={0.3}><Plank x={0} y={0} len={236} t={13} seed={seed + 3} /></Carriers>}
        {crew > 4 && <Standing x={736} y={g + 26} h={146} kind="scribe" dir={-1} armF={76} />}
      </Layer>
      <Layer depth={1.25}>
        {tools && <ToolKit x={470} y={1372} s={1.4} set="shipwrights" />}
        <Reeds x={80} y={1470} h={170} n={6} f={f} seed={seed + 7} />
      </Layer>
    </>
  );
};

/** Timber arriving: a boat of logs at the bank, a pair carrying one ashore, a man trimming another. */
const Timber: React.FC<ViewProps> = ({ f, seed, crew, tools }) => {
  const g = GROUND + 16;
  return (
    <>
      <River f={f} seed={seed} />
      <Layer depth={1}>
        <CargoBoat id={`syB${seed}`} x={210} y={1160} a={250} f={f} seed={seed + 10} sail={false} cargo="timber" crew={2} steering={false} />
        <SiteFloor f={f} seed={seed} />
        <Plank x={396} y={1166} len={170} t={10} seed={seed + 2} angle={15} color={C.sand} />
        <LogPile x={690} y={g + 6} len={290} rows={crew > 4 ? 4 : 3} seed={seed + 33} />
        <Carriers x={390} y={g + 30} h={150} f={f} len={250} speed={0.3}><Log x={0} y={4} len={250} t={24} seed={seed + 4} /></Carriers>
        <Log x={690} y={g + 66} len={210} t={26} seed={seed + 6} />
        {crew > 2 && <ToolWorker x={950} y={g + 62} h={156} f={f} tool="axe" dir={-1} k={1} />}
      </Layer>
      <Layer depth={1.25}>
        <Reeds x={84} y={1470} h={170} n={7} f={f} seed={seed + 7} />
        {tools && <ToolKit x={330} y={1380} s={1.4} set="shipwrights" />}
      </Layer>
    </>
  );
};

/** Close on the carpenters: a plank on trestles, one man with an adze, one with a saw, cut ribs waiting. */
const Shaping: React.FC<ViewProps> = ({ f, seed, crew, tools }) => {
  const g = GROUND + 30, bench = 1108;
  return (
    <>
      <River f={f} seed={seed} top={930} h={200} />
      <Layer depth={0.9}><ShipHull id={`syF${seed}`} x={170} y={1136} a={190} H={62} stage="frame" seed={seed + 20} stocks={66} /></Layer>
      <Layer depth={1}>
        <SiteFloor f={f} seed={seed} y={GROUND - 20} />
        <RibTimber x={850} y={g} h={230} />
        <RibTimber x={904} y={g + 6} h={200} />
        {crew > 4 && <RibTimber x={1040} y={g + 2} h={214} />}
        <Trestle x={330} y={bench} h={g - bench} />
        <Trestle x={742} y={bench} h={g - bench} />
        <Plank x={170} y={bench} len={720} t={26} seed={seed + 3} />
        <Shavings x={540} y={g + 16} w={520} seed={seed + 4} />
        <ToolWorker x={410} y={g + 14} h={232} f={f} tool="adze" />
        <ToolWorker x={690} y={g + 14} h={232} f={f} tool="saw" dir={-1} k={1.6} />
        {crew > 2 && <PlankStack x={-240} y={g + 8} len={230} rows={4} seed={seed + 31} />}
      </Layer>
      {tools && <Layer depth={1.25}><ToolKit x={250} y={1392} s={1.6} set="shipwrights" /></Layer>}
    </>
  );
};

/** The skeleton: keel and ribs on the stocks, one rib being offered up and driven home. */
const Frame: React.FC<ViewProps> = ({ f, seed, crew, tools }) => {
  const g = GROUND + 16;
  return (
    <>
      <FarDesert f={f} seed={seed} ridgeY={1000} />
      <Layer depth={0.5}><Ridge x={X0} y={1100} w={WW} h={150} seed={seed + 9} color={C.sand} opacity={0.7} /></Layer>
      <Layer depth={0.7}>
        {[-300, -130, 1130, 1320].map((px, i) => <Palm key={px} x={px} y={1190} h={250 + (i % 2) * 60} f={f} seed={seed + i} lean={(i % 2 ? -1 : 1) * 14} />)}
      </Layer>
      <Layer depth={1}>
        <ShipHull id={`syH${seed}`} x={540} y={1106} a={396} H={132} stage="frame" seed={seed + 10} stocks={g - 1106} />
        <SiteFloor f={f} seed={seed} />
        <ToolWorker x={300} y={g + 6} h={158} f={f} tool="mallet" />
        <RibTimber x={700} y={1100} h={150} flip />
        <Standing x={760} y={g + 6} h={158} dir={-1} armF={132} armB={112} lean={4} />
        {crew > 2 && <Standing x={936} y={g + 22} h={150} kind="scribe" dir={-1} armF={78} />}
        {crew > 4 && <ToolWorker x={500} y={g + 10} h={154} f={f} tool="chisel" k={3} />}
      </Layer>
      <Layer depth={1.25}>
        <RibTimber x={70} y={1400} h={200} />
        <RibTimber x={150} y={1404} h={170} />
        <Plank x={30} y={1410} len={330} t={16} seed={seed + 5} />
        {tools && <ToolKit x={560} y={1380} s={1.4} set="shipwrights" />}
      </Layer>
    </>
  );
};

/** Putting it together: the shell planked, lashings and the rope truss hauled tight, mallets driving joints home. */
const Assembly: React.FC<ViewProps> = ({ f, seed, crew, tools }) => {
  const g = GROUND + 16, hx = 390, hy = 1118, a = 310, H = 104;
  const bowTop: P2 = [hx + a * 1.05, hy - a * 0.224 - H * 0.2 - H * 0.6];
  return (
    <>
      <River f={f} seed={seed} />
      <Layer depth={1}>
        <ShipHull id={`syH${seed}`} x={hx} y={hy} a={a} H={H} stage="planked" seed={seed + 10} stocks={g - hy} truss />
        {/* lashing ropes still hanging over the side */}
        <Rope pts={[[hx - 150, hy - H - 2], [hx - 158, hy - 20], [hx - 196, g + 26]]} sag={0} width={5} />
        <Rope pts={[[hx + 70, hy - H - 2], [hx + 64, hy - 8], [hx + 96, g + 30]]} sag={0} width={5} />
        <SiteFloor f={f} seed={seed} />
        <g transform={`translate(${hx - 214} ${g + 38})`}><RopeCoil /></g>
        <ToolWorker x={170} y={g + 8} h={152} f={f} tool="mallet" />
        <ToolWorker x={540} y={g + 8} h={152} f={f} tool="chisel" dir={-1} k={2} />
        <RopeGang anchor={bowTop} x={bowTop[0] + 118} y={g + 14} h={150} n={crew > 4 ? 3 : 2} f={f} gap={84} dir={-1} />
      </Layer>
      <Layer depth={1.25}>
        {tools && <ToolKit x={120} y={1380} s={1.4} set="haulers" />}
        <Reeds x={990} y={1480} h={170} n={6} f={f} seed={seed + 7} />
      </Layer>
    </>
  );
};

/** Stepping the mast: a gang on the rope hauls it upright while men steady the foot. */
const Rigging: React.FC<ViewProps> = ({ f, D, seed, crew, tools }) => {
  const g = GROUND + 16, hx = 400, hy = 1124, a = 320, H = 100, mh = 400;
  const ang = mix(-56, -9, ramp(f, 0, D * 0.85));
  const foot: P2 = [hx - 10, hy - H + 8];
  const r = (ang * Math.PI) / 180;
  const head: P2 = [foot[0] + Math.sin(r) * mh * 0.97, foot[1] - Math.cos(r) * mh * 0.97];
  return (
    <>
      <River f={f} seed={seed} />
      <Layer depth={1}>
        <MastAndSail x={foot[0]} y={foot[1]} h={mh} w={250} sail={false} angle={ang} />
        <Figure x={hx + 60} y={hy - H + 4} h={112} kind="bearer" dir={-1} armF={mix(96, 128, ramp(f, 0, D * 0.85))} armB={80} lean={6} />
        <ShipHull id={`syH${seed}`} x={hx} y={hy} a={a} H={H} stage="planked" seed={seed + 10} stocks={g - hy} />
        <SiteFloor f={f} seed={seed} />
        {/* the sail, furled on its yard, waiting on the ground */}
        <g>
          <ellipse cx={225} cy={g + 82} rx={190} ry={9} fill={C.shadow} opacity={0.2} />
          <rect x={60} y={g + 44} width={330} height={34} rx={17} fill={C.cream} stroke={C.gold} strokeWidth={3} />
          {[0.14, 0.38, 0.62, 0.86].map((k) => <rect key={k} x={60 + 330 * k} y={g + 42} width={6} height={38} fill={C.terra} />)}
          <rect x={36} y={g + 36} width={378} height={9} fill={C.earth} />
        </g>
        <RopeGang anchor={head} x={786} y={g + 16} h={152} n={Math.min(crew, 3)} f={f} gap={82} dir={-1} />
      </Layer>
      <Layer depth={1.25}>
        {tools && <ToolKit x={520} y={1384} s={1.4} set="haulers" />}
      </Layer>
    </>
  );
};

/** Launch day: the finished hull runs down the slipway into the river, the yard pushing behind it. */
const Launch: React.FC<ViewProps> = ({ f, D, seed, crew }) => {
  const a: P2 = [440, 1070], b: P2 = [900, 1200];
  const slide = ramp(f, 0, D * 0.9) * 130;
  const cx = 590 + slide, cy = lineY(a, b, cx) - 6;
  const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  const travel = slide;
  const n = crew > 4 ? 4 : 3;
  return (
    <>
      <River f={f} seed={seed} top={1000} h={90} />
      <Layer depth={1}>
        <RRect x={X0} y={1010} w={WW} h={900} seed={seed + 14} fill={C.shadow} amp={5} step={34} />
        <Streaks x={X0} y={1020} w={WW} h={860} seed={seed + 15} count={420} color={C.teal} opacity={0.8} maxLen={300} thick={5} />
        <Streaks x={X0 + ((f * 0.5) % 60)} y={1020} w={WW} h={480} seed={seed + 16} count={150} color={C.paper} opacity={0.4} maxLen={120} thick={2} />
        {/* the bank and its slipway */}
        <RPoly pts={[[X0, a[1]], a, b, [b[0] + 70, 1920], [X0, 1920]]} seed={seed + 40} fill={C.paper} amp={3} />
        <Ground y={a[1] + 2} seed={seed + 41} x={X0} w={a[0] - X0 - 40} dense={2} h={420} />
        <path d={`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`} stroke={C.sand} strokeWidth={14} strokeLinecap="round" />
        {Array.from({ length: 6 }, (_, i) => { const px = a[0] + 20 + i * 76; return <rect key={i} x={px} y={lineY(a, b, px) - 7} width={34} height={12} fill={C.shadow} opacity={0.75} transform={`rotate(${ang} ${px} ${lineY(a, b, px)})`} />; })}
        <ShipHull id={`syH${seed}`} x={cx} y={cy} a={300} H={96} stage="planked" seed={seed + 10} angle={ang} />
        {/* the river closes over the bow */}
        <RPoly pts={[[b[0] + 2, 1214], [X0 + WW, 1214], [X0 + WW, 1920], [b[0] + 72, 1920]]} seed={seed + 17} fill={C.shadow} amp={3} />
        <Streaks x={b[0] + 60} y={1222} w={1300} h={640} seed={seed + 18} count={220} color={C.teal} opacity={0.8} maxLen={260} thick={5} />
        {[0, 1, 2, 3].map((k) => <path key={k} d={`M${cx + 236 + k * 22} ${1216 - k * 3}q${16 + k * 6} ${-34 - k * 10} ${44 + k * 12} ${-4}`} stroke={C.paper} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.85} />)}
        {Array.from({ length: n }, (_, i) => {
          const x = cx - 318 - i * 76;
          return <g key={i}><GroundShadow x={x + 6} y={a[1] + 16} w={62} /><Figure x={x} y={a[1] + 16} h={152} kind="bearer" phase={walkPhase(travel, 152) + i * 1.6} lean={24} armF={84} armB={70} /></g>;
        })}
      </Layer>
      <Layer depth={1.25}>
        <Reeds x={110} y={1480} h={170} n={6} f={f} seed={seed + 7} />
      </Layer>
    </>
  );
};

/** Under way: the finished boat with its sail set, cargo on deck, the helmsman at the steering oar. */
const Sailing: React.FC<ViewProps> = ({ f, seed, crew }) => {
  const bob = Math.sin(f * 0.08) * 4;
  return (
    <>
      <River f={f} seed={seed} top={1000} h={90} boat />
      <Layer depth={1}>
        <RRect x={X0} y={1010} w={WW} h={340} seed={seed + 14} fill={C.shadow} amp={5} step={34} />
        <Streaks x={X0} y={1020} w={WW} h={320} seed={seed + 15} count={200} color={C.teal} opacity={0.8} maxLen={300} thick={5} />
        <Streaks x={X0 + ((f * 0.5) % 60)} y={1020} w={WW} h={320} seed={seed + 16} count={120} color={C.paper} opacity={0.4} maxLen={120} thick={2} />
        <g transform={`translate(0 ${bob.toFixed(2)})`}>
          <CargoBoat id={`syB${seed}`} x={500 + f * 0.3} y={1150} a={330} f={f} seed={seed + 10} sail cargo="jars" crew={Math.min(4, crew)} />
        </g>
      </Layer>
      <Layer depth={1.25}>
        <RRect x={X0} y={1330} w={WW} h={400} seed={seed + 50} fill={C.paper} amp={5} step={40} />
        <Ground y={1334} seed={seed + 51} x={X0} w={WW} dense={2} h={300} />
        <Reeds x={110} y={1400} h={330} n={9} f={f} seed={seed + 7} />
        <Reeds x={950} y={1410} h={270} n={7} f={f} seed={seed + 8} />
      </Layer>
    </>
  );
};

const VIEWS: Record<string, React.FC<ViewProps>> = { shipyard: Yard, timber: Timber, shaping: Shaping, frame: Frame, assembly: Assembly, rigging: Rigging, launch: Launch, sailing: Sailing };

export const ShipyardTemplate: React.FC<TemplateProps> = ({ scene, seed }) => {
  const { f, D, p } = useClock();
  const View = VIEWS[paramOf(scene, "view")] ?? Yard;
  const flip = paramOf(scene, "facing") === "left";
  const cam = cameraMove(scene.camera ?? "push-in", p);
  const t = pulse(f, Math.min(20, D * 0.1), Math.min(50, D * 0.25), D - 30, D - 6);
  return (
    <Camera {...cam} cy={1040}>
      <g transform={flip ? "translate(1080 0) scale(-1 1)" : undefined}>
        <View f={f} D={D} seed={seed} crew={CREW[paramOf(scene, "crew")] ?? 4} tools={paramOf<boolean>(scene, "showTools")} />
      </g>
      {paramOf(scene, "heading") === "title"
        ? <TitleBlock title={scene.label} sub={scene.sublabel} t={ramp(f, Math.min(12, D * 0.08), Math.min(40, D * 0.25))} />
        : <Caption label={scene.label} sub={scene.sublabel} t={t} />}
    </Camera>
  );
};
