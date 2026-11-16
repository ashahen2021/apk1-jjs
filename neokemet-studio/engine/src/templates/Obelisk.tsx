import React from "react";
import { paramOf } from "../../../shared/params.ts";
import { Glow } from "../components/Atmosphere";
import { useClock } from "../components/AnimatedScene";
import { Camera, Layer } from "../components/Camera";
import { cameraMove, ConstructionRamp, FarDesert, GROUND, lineY, SiteFloor } from "../components/Environments";
import { Figure, GroundShadow, walkPhase } from "../components/Figures";
import { Cliff, Palm, Ridge } from "../components/Landscape";
import { bargeBow, GraniteBoulders, GraniteTexture, lyingTop, ObeliskBarge, ObeliskLying, ObeliskOnSledge, ObeliskShaft, obeliskTip, Pedestal, PolishingKit, Pounders, Pylon, ROLLER_H, SLEDGE_T } from "../components/Obelisks";
import { Basket, Chisel, Lever, Mallet, Rope, RopeCoil, ToolKit, WaterJar } from "../components/Objects";
import { Ground, RPoly, RRect, Stipple, Streaks } from "../components/Print";
import { CargoBoat, Reeds, ShipHull } from "../components/Ships";
import { hand, P2, RopeGang, ToolWorker } from "../components/Workers";
import { mix, pulse, ramp } from "../lib/anim";
import { C } from "../lib/theme";
import { Caption, TemplateProps, TitleBlock } from "./common";

// The making of an obelisk, from the granite of Aswan to the temple court.
// Eight compositions on one template, built the way the shipyard template is:
// each stage has its own setting, its own structure and its own tools, so no
// two read as the same picture. Art stays between y 560 and y 1170, clear of
// the caption above and the subtitles below.

const X0 = -760, WW = 2600;
const CREW: Record<string, number> = { two: 2, four: 4, six: 6 };
type ViewProps = { f: number; D: number; seed: number; crew: number; tools: boolean };

const Standing: React.FC<{ x: number; y: number; h: number; dir?: 1 | -1; armF?: number; armB?: number; lean?: number; kind?: "bearer" | "scribe" | "priest" | "pharaoh" }> = ({ x, y, h, dir = 1, armF, armB, lean, kind = "bearer" }) => (
  <g><GroundShadow x={x + dir * 6} y={y} w={h * 0.4} /><Figure x={x} y={y} h={h} kind={kind} dir={dir} armF={armF} armB={armB} lean={lean} /></g>
);
/** Tools set out on the ground from (x, y), each `gap` apart. */
const Kit: React.FC<{ x: number; y: number; s?: number; gap?: number; children: React.ReactNode }> = ({ x, y, s = 1.4, gap = 104, children }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>{React.Children.toArray(children).map((c, i) => <g key={i} transform={`translate(${i * gap} 0)`}>{c}</g>)}</g>
);
/** Open water from `top` down `h`, with the print's teal and paper streaks. */
const Water: React.FC<{ f: number; seed: number; top: number; h: number; x?: number; w?: number }> = ({ f, seed, top, h, x = X0, w = WW }) => (
  <>
    <RRect x={x} y={top} w={w} h={h} seed={seed + 14} fill={C.shadow} amp={5} step={34} />
    <Streaks x={x} y={top + 10} w={w} h={h - 20} seed={seed + 15} count={Math.round((h * w) / 4400)} color={C.teal} opacity={0.8} maxLen={300} thick={5} />
    <Streaks x={x + ((f * 0.5) % 60)} y={top + 10} w={w} h={Math.min(h - 20, 460)} seed={seed + 16} count={Math.round((Math.min(h, 460) * w) / 7500)} color={C.paper} opacity={0.4} maxLen={120} thick={2} />
  </>
);
/** The far bank of the Nile: a green strip and a line of palms. */
const FarBank: React.FC<{ f: number; seed: number; y: number; palms?: number[] }> = ({ f, seed, y, palms = [-330, -90, 150, 600, 880, 1240] }) => (
  <>
    <RRect x={X0} y={y - 70} w={WW} h={90} seed={seed + 11} fill={C.sand} amp={4} step={30} />
    <RRect x={X0} y={y - 70} w={WW} h={90} seed={seed + 11} fill={C.teal} amp={4} step={30} opacity={0.5} />
    {palms.map((px, i) => <Palm key={px} x={px} y={y - 30 + (i % 3) * 14} h={140 + (i % 2) * 40} f={f} seed={seed + i} lean={(i % 2 ? -1 : 1) * 12} />)}
  </>
);
/** A slab of granite bedrock filling the polygon, textured over its bounding box. */
const Bedrock: React.FC<{ id: string; pts: P2[]; seed: number; color?: string }> = ({ id, pts, seed, color = C.gold }) => {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x = Math.min(...xs), y = Math.min(...ys), w = Math.max(...xs) - x, h = Math.min(Math.max(...ys), 1700) - y;
  return (
    <g>
      <defs><clipPath id={id}><path d={`M${pts.map((p) => p.join(" ")).join("L")}Z`} /></clipPath></defs>
      <RPoly pts={pts} seed={seed} fill={color} amp={2.6} />
      <g clipPath={`url(#${id})`}><GraniteTexture x={x} y={y} w={w} h={h} seed={seed + 1} /></g>
    </g>
  );
};
/** Sand drifted over the near quarry floor, so the bedrock does not fill the frame as one slab. */
const DriftedSand: React.FC<{ seed: number; y: number }> = ({ seed, y }) => (
  <>
    <RPoly pts={[[X0, y + 30], [-200, y], [260, y + 44], [700, y + 6], [1180, y + 50], [X0 + WW, y + 10], [X0 + WW, 1920], [X0, 1920]]} seed={seed} fill={C.paper} amp={5} step={40} />
    <Ground y={y + 50} seed={seed + 1} x={X0} w={WW} dense={2} h={420} />
  </>
);
/** A puff of stone dust where a pounder lands. */
const Dust: React.FC<{ x: number; y: number; f: number; k?: number; s?: number }> = ({ x, y, f, k = 0, s = 1 }) => {
  const t = ((f * 0.17 + k + Math.PI * 0.5) % (Math.PI * 2)) / (Math.PI * 2);
  return <g opacity={Math.max(0, 0.75 - t * 1.6)}>{[-1, 0, 1].map((i) => <circle key={i} cx={x + i * 13 * s * (0.5 + t)} cy={y - (6 + t * 26) * s - Math.abs(i) * 3} r={(5 + t * 9) * s} fill={C.paper} />)}</g>;
};

/** Aswan: the granite hills by the river, the obelisk marked out and half cut from the bedrock. */
const Quarry: React.FC<ViewProps> = ({ f, seed, crew, tools }) => {
  const top = 1090, lip = 1150, ox = 110, len = 860, w = 104;
  const diggers: [number, 1 | -1][] = [[ox + 170, 1], [ox + 430, -1], [ox + 650, 1], [ox + 300, 1]];
  return (
    <>
      <FarDesert f={f} seed={seed} ridgeY={940} />
      <Layer depth={0.4}>
        <RRect x={420} y={962} w={1500} h={50} seed={seed + 11} fill={C.teal} amp={3} step={30} opacity={0.6} />
        {[640, 860, 1150, 1380].map((px, i) => <Palm key={px} x={px} y={968 + (i % 2) * 10} h={110 + (i % 2) * 30} f={f} seed={seed + i} lean={(i % 2 ? -1 : 1) * 10} />)}
      </Layer>
      <Layer depth={0.6}><GraniteBoulders x={X0} y={1094} w={WW} h={170} seed={seed + 20} color={C.sand} shade={C.gold} /></Layer>
      <Layer depth={0.82}><GraniteBoulders x={-720} y={1096} w={980} h={330} seed={seed + 22} color={C.gold} shade={C.earth} /></Layer>
      <Layer depth={1}>
        {/* the trench round the obelisk, the obelisk, then the quarry floor in front */}
        <RRect x={ox - 48} y={top - 6} w={len + 110} h={lip - top + 30} seed={seed + 30} fill={C.shadow} amp={2} />
        <ObeliskLying id={`obQ${seed}`} x={ox} y={top + w} len={len} w={w} stage="rough" seed={seed + 10} />
        {diggers.slice(0, crew > 4 ? 4 : crew > 2 ? 3 : 2).map(([px, d], i) => <ToolWorker key={i} x={px} y={top + w - 8} h={124} f={f} tool="pounder" dir={d} k={i * 1.7} shadow={false} />)}
        <Bedrock id={`obR${seed}`} seed={seed + 40} pts={[[X0, top], [ox - 60, top], [ox - 60, lip], [ox + len + 70, lip], [ox + len + 70, top], [X0 + WW, top], [X0 + WW, 1920], [X0, 1920]]} />
        <path d={`M${ox - 60} ${lip}H${ox + len + 70}`} stroke={C.paper} strokeWidth={4} opacity={0.6} />
        <Stipple x={ox - 40} y={lip + 4} w={len + 90} h={40} seed={seed + 44} count={150} color={C.cream} opacity={0.8} size={4} />
        {/* the overseer with his measuring cord, and chips carried away */}
        <Standing x={52} y={1250} h={150} kind="scribe" armF={78} />
        <Rope pts={[hand(52, 1250, 150, 78, 0), [150, 1170], [ox + len * 0.5, lip - 1]]} sag={0} width={3} color={C.cream} />
        <g transform="translate(700 1262) scale(1.3)"><Basket /></g>
        {crew > 2 && <g><Standing x={880} y={1256} h={140} dir={-1} armF={30} armB={20} lean={8} /><g transform="translate(846 1240) scale(1.1)"><Basket /></g></g>}
        <g transform="translate(430 1250) scale(1.2)"><Pounders n={5} /></g>
      </Layer>
      <Layer depth={1.25}>
        <DriftedSand seed={seed + 60} y={1330} />
        {tools && <Kit x={150} y={1400}><Pounders /><Basket /><Lever /></Kit>}
        <GraniteBoulders x={760} y={1640} w={640} h={200} seed={seed + 50} color={C.earth} shade={C.shadow} />
      </Layer>
    </>
  );
};

/** Close in the trench: men stand in the cut beside the obelisk, bruising the granite away with dolerite balls. */
const Trench: React.FC<ViewProps> = ({ f, seed, crew, tools }) => {
  const top = 1000, w = 200, lip = top + w - 6, floor = top + 92, ox = -500, len = 1560;
  const men: [number, 1 | -1][] = [[200, 1], [500, -1], [760, 1]];
  const n = crew > 2 ? 3 : 2;
  return (
    <>
      <FarDesert f={f} seed={seed} ridgeY={900} />
      <Layer depth={0.9}>
        <Bedrock id={`obW${seed}`} seed={seed + 20} pts={[[X0, top + 10], [X0, 640], [-120, 600], [260, 640], [600, 628], [980, 676], [1400, 650], [X0 + WW, 690], [X0 + WW, top + 10]]} />
        {[[-60, 620, 40], [420, 650, -30], [860, 670, 26]].map(([px, py, dx], i) => <path key={i} d={`M${px} ${py}Q${px + dx} ${(py + top) / 2} ${px + dx * 0.4} ${top}`} stroke={C.shadow} strokeWidth={4} fill="none" opacity={0.3} />)}
      </Layer>
      <Layer depth={1}>
        {/* the far trench, the end of the cut, and the rock left standing beyond it */}
        <RRect x={X0} y={top - 240} w={1920} h={w + 250} seed={seed + 30} fill={C.shadow} amp={4} step={30} />
        <Streaks x={X0} y={top - 230} w={1900} h={230} seed={seed + 33} count={140} color={C.teal} opacity={0.75} maxLen={220} thick={5} />
        <Bedrock id={`obE${seed}`} seed={seed + 32} pts={[[1150, top - 244], [X0 + WW, top - 244], [X0 + WW, lip + 20], [1150, lip + 20]]} />
        {men.slice(0, n).map(([px, d], i) => (
          <g key={i}>
            <ToolWorker x={px} y={floor} h={236} f={f} tool="pounder" dir={d} k={i * 2.1} shadow={false} lean={12} />
            <Dust x={px + d * 78} y={top - 4} f={f} k={i * 2.1} s={1.5} />
          </g>
        ))}
        <ObeliskLying id={`obT${seed}`} x={ox} y={top + w} len={len} w={w} stage="rough" seed={seed + 10} />
        {/* the near edge of the trench: the men's legs are below it */}
        <Bedrock id={`obL${seed}`} seed={seed + 40} pts={[[X0, lip], [X0 + WW, lip], [X0 + WW, 1920], [X0, 1920]]} />
        <path d={`M${X0} ${lip}H${X0 + WW}`} stroke={C.paper} strokeWidth={5} opacity={0.65} />
        <Stipple x={X0} y={lip + 6} w={WW} h={46} seed={seed + 44} count={420} color={C.cream} opacity={0.85} size={5} />
        <g transform="translate(360 1322) scale(1.7)"><Basket /></g>
        <g transform="translate(660 1340) scale(1.6)"><Pounders n={6} /></g>
        {crew > 4 && <g><Standing x={960} y={1392} h={214} dir={-1} armF={32} armB={22} lean={8} /><g transform="translate(908 1368) scale(1.6)"><Basket /></g></g>}
        {tools && <g transform="translate(120 1350) scale(1.5)"><Lever /></g>}
      </Layer>
      <Layer depth={1.25}><DriftedSand seed={seed + 60} y={1450} /></Layer>
    </>
  );
};

/** Dressing the faces: the freed obelisk on baulks under an awning, rubbed smooth and cut with its signs. */
const Smoothing: React.FC<ViewProps> = ({ f, D, seed, crew, tools }) => {
  const g = GROUND + 26, ox = 60, len = 980, w = 128, under = g - 26;
  const glyphs = mix(0.16, 0.5, ramp(f, 0, D));
  const carveX = ox + glyphs * (len - w * 0.9) + 54;
  return (
    <>
      <FarDesert f={f} seed={seed} ridgeY={1000} />
      <Layer depth={0.55}><GraniteBoulders x={X0} y={1112} w={WW} h={170} seed={seed + 20} color={C.sand} shade={C.gold} /></Layer>
      <Layer depth={0.9}>
        {/* linen awning on poles, shading the work */}
        {[-40, 330, 700, 1070].map((px) => <rect key={px} x={px - 5} y={792} width={10} height={g - 792} fill={C.earth} />)}
        <path d={`M-90 800Q150 838 330 802Q520 840 700 804Q890 842 1120 806L1120 774Q890 800 700 770Q520 800 330 768Q150 798 -90 766Z`} fill={C.cream} stroke={C.sand} strokeWidth={3} />
        {[-10, 150, 330, 510, 700, 880, 1060].map((px, i) => <rect key={px} x={px - 9} y={768 + (i % 2) * 14} width={18} height={44} fill={C.terra} opacity={0.5} />)}
      </Layer>
      <Layer depth={1}>
        <SiteFloor f={f} seed={seed} y={g - 6} />
        {[150, 350, 550, 750, 920].map((px) => <rect key={px} x={px - 22} y={under} width={44} height={28} fill={C.earth} />)}
        {/* behind the stone: a sculptor at the edge of the inscription, polishers toward the point */}
        <rect x={ox + 40} y={under - 46} width={len - 150} height={12} fill={C.shadow} />
        <ToolWorker x={carveX} y={under - 44} h={214} f={f} tool="chisel" k={1} lean={14} shadow={false} />
        <ToolWorker x={640} y={under - 44} h={218} f={f} tool="polisher" lean={17} shadow={false} />
        {crew > 2 && <ToolWorker x={900} y={under - 44} h={212} f={f} tool="polisher" dir={-1} k={2.4} lean={17} shadow={false} />}
        <ObeliskLying id={`obS${seed}`} x={ox} y={under} len={len} w={w} stage="inscribed" glyphs={glyphs} seed={seed + 10} />
        <ellipse cx={ox + len * 0.5} cy={g + 6} rx={len * 0.5} ry={9} fill={C.shadow} opacity={0.18} />
        {/* in front: the draughtsman with the text, and water for the abrasive */}
        {crew > 2 && <Standing x={44} y={g + 52} h={196} kind="scribe" armF={74} armB={50} />}
        {crew > 4 && <g><Standing x={1010} y={g + 56} h={192} dir={-1} armF={40} armB={30} lean={6} /><g transform={`translate(950 ${g + 60}) scale(1.5)`}><WaterJar /></g></g>}
      </Layer>
      {tools && <Layer depth={1.25}><Kit x={250} y={1396} gap={120}><PolishingKit /><g transform="translate(40 0)"><Chisel /></g><Mallet /><WaterJar c={C.gold} /></Kit></Layer>}
    </>
  );
};

/** Overland: the obelisk on its sledge and rollers, two lines of men on the ropes, the track wetted ahead. */
const Hauling: React.FC<ViewProps> = ({ f, seed, crew, tools }) => {
  const g = GROUND + 16, len = 520, w = 84, h = 136, LEAN = 21;
  const travel = f * 0.42, sx = 268 + travel;
  const nose: P2 = [sx + len * 0.54 + 22, g - ROLLER_H - 40];
  const n = crew + 4;
  const row = (dx: number, dy: number, hh: number) => Array.from({ length: n }, (_, i) => ({ x: sx + len / 2 + 172 + dx + i * 82, y: g + dy, h: hh, phase: walkPhase(travel, hh) + i * 1.7 + dx }));
  const far = row(-46, -10, h * 0.94), near = row(0, 10, h);
  const rope = (men: { x: number; y: number; h: number }[]): P2[] => { const pts: P2[] = [nose, ...men.map((m) => hand(m.x, m.y, m.h, 72, LEAN))]; const l = pts[pts.length - 1]; return [...pts, [l[0] + 40, l[1] + 12]]; };
  const px = sx + len / 2 + 96, pour = (Math.sin(f * 0.12) + 1) / 2;
  const top = g - ROLLER_H - SLEDGE_T - lyingTop(len, w, len * 0.45);
  return (
    <>
      <FarDesert f={f} seed={seed} ridgeY={1040} />
      <Layer depth={0.5}>
        <Ridge x={X0} y={1110} w={WW} h={150} seed={seed + 9} color={C.sand} opacity={0.7} />
        <GraniteBoulders x={-700} y={1116} w={760} h={230} seed={seed + 20} color={C.gold} shade={C.earth} />
      </Layer>
      <Layer depth={0.7}>{[820, 1010, 1300].map((x, i) => <Palm key={x} x={x} y={1186} h={230 + (i % 2) * 60} f={f} seed={seed + i} lean={(i % 2 ? -1 : 1) * 14} />)}</Layer>
      <Layer depth={1}>
        {/* the prepared track, with its sleepers */}
        <RRect x={X0} y={g - 8} w={WW} h={20} seed={seed + 30} fill={C.paperDark} amp={2} />
        {Array.from({ length: 30 }, (_, i) => <rect key={i} x={X0 + 20 + i * 88} y={g - 10} width={12} height={24} fill={C.shadow} opacity={0.5} />)}
        <SiteFloor f={f} seed={seed} y={g + 6} />
        <path d={`M${sx + len * 0.3} ${g - 2}H${px + 60}`} stroke={C.teal} strokeWidth={7} strokeLinecap="round" opacity={0.55} />
        {far.map((m, i) => <Figure key={i} x={m.x} y={m.y} h={m.h} kind="bearer" phase={m.phase} lean={LEAN} armF={72} armB={58} opacity={0.72} />)}
        <Rope pts={rope(far)} sag={2} width={4} color={C.teal} />
        <ObeliskOnSledge id={`obH${seed}`} x={sx} y={g} len={len} w={w} tip={-1} roll={travel} seed={seed + 10} />
        {/* the overseer rides the load and claps the time */}
        <Figure x={sx - 30} y={top} h={104} kind="scribe" armF={mix(96, 132, pour)} armB={mix(60, 96, pour)} />
        {/* a man levers the tail along */}
        <g>
          <GroundShadow x={sx - len / 2 - 70} y={g + 10} w={56} />
          <Figure x={sx - len / 2 - 76} y={g + 10} h={h} kind="bearer" lean={26} armF={58} armB={46} />
          <path d={`M${hand(sx - len / 2 - 76, g + 10, h, 58, 26).join(" ")}L${sx - len / 2 + 6} ${g - 6}`} stroke={C.earth} strokeWidth={8} strokeLinecap="round" />
        </g>
        {near.map((m, i) => <GroundShadow key={`s${i}`} x={m.x + 6} y={m.y} w={h * 0.4} />)}
        {near.map((m, i) => <Figure key={i} x={m.x} y={m.y} h={m.h} kind="bearer" phase={m.phase} lean={LEAN} armF={72} armB={58} />)}
        <Rope pts={rope(near)} sag={2} width={5} />
        {/* water poured under the runners */}
        <GroundShadow x={px} y={g + 4} w={h * 0.4} />
        <Figure x={px} y={g + 4} h={h * 0.96} kind="bearer" dir={-1} lean={16} armF={mix(48, 62, pour)} armB={40} />
        <g transform={`translate(${px - h * 0.2} ${g + 4 - h * 0.5}) rotate(${mix(-104, -124, pour)}) scale(${h / 250})`}><WaterJar c={C.terra} /></g>
        {[0, 1, 2].map((k) => { const t = (f * 0.05 + k / 3) % 1; return <circle key={k} cx={px - h * 0.4} cy={g + 4 - h * 0.4 + t * h * 0.38} r={3} fill={C.teal} opacity={0.85 * (1 - t)} />; })}
      </Layer>
      {tools && <Layer depth={1.25}><ToolKit x={130} y={1384} s={1.4} set="haulers" /></Layer>}
    </>
  );
};

/** At the river: the obelisk drawn off the embankment and over the stern onto the great barge. */
const Loading: React.FC<ViewProps> = ({ f, D, seed, crew, tools }) => {
  const wy = 1176, qy = 1112, bx = 810, a = 400, H = 112, keel = wy + 44, len = 580, w = 84, q = 350;
  const slide = ramp(f, 0, D * 0.9) * 70, ox = q + 20 + slide, sy = qy - 10;
  const lead: P2 = [ox + len * 0.54 + 22, sy - ROLLER_H - 40];
  const levers = [ox - len / 2 - 70, ox - len / 2 - 158];
  return (
    <>
      <FarDesert f={f} seed={seed} ridgeY={900} />
      <Layer depth={0.5}><GraniteBoulders x={-500} y={950} w={900} h={150} seed={seed + 20} color={C.sand} shade={C.gold} /></Layer>
      <Layer depth={0.6}><FarBank f={f} seed={seed} y={990} /></Layer>
      <Layer depth={1}>
        <Water f={f} seed={seed} top={1000} h={920} />
        <ShipHull id={`obB${seed}`} x={bx} y={keel} a={a} H={H} seed={seed + 10} />
        {/* the river over the hull below the waterline */}
        <RRect x={bx - a * 1.14} y={wy} w={a * 2.3} h={keel - wy + 12} seed={seed + 17} fill={C.shadow} amp={3} />
        <rect x={bx - a * 1.1} y={wy + 6} width={a * 2.2} height={4} fill={C.paper} opacity={0.6} />
        <Streaks x={bx - a * 1.1} y={wy + 14} w={a * 2.2} h={40} seed={seed + 18} count={40} color={C.teal} opacity={0.8} maxLen={220} thick={5} />
        {/* the embankment, faced with timber, level with the deck */}
        <RPoly pts={[[X0, qy], [q, qy], [q + 34, wy + 20], [q + 44, 1920], [X0, 1920]]} seed={seed + 40} fill={C.paper} amp={3} />
        <RPoly pts={[[q - 28, qy], [q, qy], [q + 36, wy + 22], [q + 8, wy + 22]]} seed={seed + 42} fill={C.earth} amp={2} />
        <Ground y={qy + 2} seed={seed + 41} x={X0} w={q - 32 - X0} dense={2} h={520} />
        {[0, 1].map((i) => <rect key={i} x={q - 40} y={qy - 12 + i * 7} width={190 - i * 16} height={7} fill={i ? C.shadow : C.earth} />)}
        {/* the gang on deck draws it aboard */}
        <RopeGang anchor={lead} x={ox + len / 2 + 190} y={keel - H + 4} h={126} n={crew > 4 ? 3 : 2} f={f} gap={84} dir={-1} />
        <ObeliskOnSledge id={`obL${seed}`} x={ox} y={sy} len={len} w={w} tip={-1} roll={slide} seed={seed + 10} />
        {/* men with levers ease the tail off the bank */}
        {levers.slice(0, crew > 2 ? 2 : 1).map((px, i) => (
          <g key={i}>
            <GroundShadow x={px + 6} y={qy + 6} w={58} />
            <Figure x={px} y={qy + 6} h={142} kind="bearer" lean={24} armF={60 - i * 6} armB={48 - i * 6} />
            {i === 0 && <path d={`M${hand(px, qy + 6, 142, 60, 24).join(" ")}L${ox - len / 2 + 8} ${sy - 4}`} stroke={C.earth} strokeWidth={8} strokeLinecap="round" />}
            {i === 1 && <Rope pts={[hand(px, qy + 6, 142, 54, 24), [ox - len / 2 - 4, sy - ROLLER_H - 30]]} sag={3} width={4} />}
          </g>
        ))}
        <Standing x={190} y={qy + 104} h={160} kind="scribe" armF={82} armB={8} />
      </Layer>
      <Layer depth={1.25}>
        <RPoly pts={[[X0, 1380], [300, 1372], [640, 1410], [1000, 1384], [X0 + WW, 1400], [X0 + WW, 1920], [X0, 1920]]} seed={seed + 50} fill={C.paper} amp={5} step={40} />
        <Ground y={1410} seed={seed + 51} x={X0} w={WW} dense={2} h={300} />
        {tools && <ToolKit x={60} y={1470} s={1.4} set="haulers" />}
        <Reeds x={930} y={1470} h={230} n={8} f={f} seed={seed + 7} />
      </Layer>
    </>
  );
};

/** On the Nile: the laden barge towed downstream by oared boats, the temple it is bound for on the far bank. */
const Transport: React.FC<ViewProps> = ({ f, seed, crew }) => {
  const bob = Math.sin(f * 0.07) * 3, drift = f * 0.2;
  const bx = 290 + drift, by = 1172, a = 370;
  const bow = bargeBow(bx, by + bob, a);
  const tows: [number, number, number][] = [[900 + drift, 1112, 158], [1330 + drift, 1200, 150]];
  return (
    <>
      <FarDesert f={f} seed={seed} ridgeY={880} />
      <Layer depth={0.3}><Cliff id={`obC${seed}`} x={X0} baseY={930} w={WW} h={250} seed={seed + 30} color={C.sand} shade={C.gold} scree={C.paperDark} peak={0.64} peakiness={0.3} strata={false} /></Layer>
      <Layer depth={0.45}><Pylon id={`obP${seed}`} x={800} y={938} w={230} h={112} f={f} seed={seed + 3} color={C.paperDark} /></Layer>
      <Layer depth={0.6}><FarBank f={f} seed={seed} y={1000} palms={[-330, -90, 150, 420, 1080, 1320]} /></Layer>
      <Layer depth={1}>
        <Water f={f} seed={seed} top={1010} h={340} />
        {tows.map(([tx, ty, ta], i) => (
          <g key={i}>
            <Rope pts={[bow, [tx - ta * 1.03, ty - ta * 0.16]]} sag={16 + i * 8} width={4} />
            <CargoBoat id={`obt${i}${seed}`} x={tx} y={ty + Math.sin(f * 0.08 + i) * 3} a={ta} f={f} seed={seed + 60 + i} sail={false} oars={4} cargo="none" crew={2} />
          </g>
        ))}
        <g transform={`translate(0 ${bob.toFixed(2)})`}><ObeliskBarge id={`obG${seed}`} x={bx} y={by} a={a} f={f} seed={seed + 10} crew={Math.min(3, crew)} /></g>
      </Layer>
      <Layer depth={1.25}>
        <RRect x={X0} y={1330} w={WW} h={400} seed={seed + 50} fill={C.paper} amp={5} step={40} />
        <Ground y={1334} seed={seed + 51} x={X0} w={WW} dense={2} h={300} />
        <Reeds x={940} y={1410} h={300} n={8} f={f} seed={seed + 7} />
        <Reeds x={90} y={1440} h={210} n={6} f={f} seed={seed + 8} />
      </Layer>
    </>
  );
};

/** Raising it: off the end of a brick ramp, its foot let down through a sand-filled pit onto the pedestal, then hauled upright. */
const Erection: React.FC<ViewProps> = ({ f, D, seed, crew, tools }) => {
  const g = GROUND + 16, len = 520, w = 70;
  const foot: P2 = [-640, g], head: P2 = [400, g - 310], wall = 716, pedX = 560, pedH = 46;
  const t = ramp(f, 0, D * 0.92);
  const s = Math.min(1, t / 0.6), up = Math.max(0, (t - 0.6) / 0.4);
  // the shaft rides over the lip of the ramp as its foot goes down into the sand
  const base: P2 = [mix(455, pedX, s), mix(head[1] - w / 2 - 17, g - pedH, s * s * (3 - 2 * s))];
  const edge: P2 = [head[0], head[1] - w / 2];
  const lean = (Math.atan2(edge[0] - base[0], base[1] - edge[1]) * 180) / Math.PI;
  const ang = mix(lean, -7, up);
  const grip = obeliskTip(base[0], base[1], len, ang, 0.86);
  const sandTop = mix(g - 296, g - 30, s);
  const brakeX = [170, 80];
  return (
    <>
      <FarDesert f={f} seed={seed} ridgeY={1030} />
      <Layer depth={0.6}>
        <Pylon id={`obY${seed}`} x={900} y={1186} w={600} h={350} f={f} seed={seed + 3} color={C.paperDark} />
        {[1250, 1400].map((x, i) => <Palm key={x} x={x} y={1190} h={260 + i * 50} f={f} seed={seed + i} lean={-14} />)}
      </Layer>
      <Layer depth={1}>
        <ConstructionRamp id={`obM${seed}`} foot={foot} head={head} baseY={g} seed={seed + 20} />
        {/* the pit: its back wall, the pedestal, then the obelisk going down into the sand */}
        <RRect x={head[0]} y={head[1] + 4} w={wall - head[0]} h={g - head[1] - 4} seed={seed + 22} fill={C.paperDark} amp={2} />
        <Pedestal x={pedX} y={g} w={112} h={pedH} seed={seed + 24} />
        <ObeliskShaft id={`obU${seed}`} x={base[0]} y={base[1]} len={len} w={w} angle={ang} seed={seed + 10} />
        <RPoly pts={[[head[0], sandTop - 14], [pedX, sandTop + 12], [wall, sandTop - 8], [wall, g], [head[0], g]]} seed={seed + 26} fill={C.sand} amp={3} />
        <Stipple x={head[0]} y={sandTop} w={wall - head[0]} h={g - sandTop} seed={seed + 27} count={Math.round((g - sandTop) * 1.6)} color={C.gold} opacity={0.6} size={3} />
        {/* the brick wall that holds the sand, and the sand let out at its foot */}
        <RRect x={wall} y={head[1] - 6} w={34} h={g - head[1] + 6} seed={seed + 28} fill={C.earth} amp={2} />
        <Streaks x={wall} y={head[1]} w={34} h={g - head[1]} seed={seed + 29} count={34} color={C.gold} opacity={0.6} maxLen={26} thick={4} />
        <rect x={wall + 6} y={g - 26} width={28} height={22} fill={C.shadow} />
        <path d={`M${wall + 34} ${g}Q${wall + 60 + s * 30} ${g - 14 - s * 44} ${wall + 100 + s * 60} ${g}Z`} fill={C.sand} />
        <SiteFloor f={f} seed={seed} y={g - 2} />
        {/* the gang that hauls it upright, and the gang on the ramp that checks it */}
        <RopeGang anchor={grip} x={900} y={g + 14} h={142} n={crew > 4 ? 3 : 2} f={f} gap={86} dir={-1} />
        {crew > 2 && (() => {
          const men = brakeX.map((x) => ({ x, y: lineY(foot, head, x) }));
          const pts: P2[] = [grip, ...men.map((m) => hand(m.x, m.y, 124, 70, -6))];
          return (
            <g>
              {men.map((m, i) => <Figure key={i} x={m.x} y={m.y} h={124} kind="bearer" lean={-6} armF={70} armB={56} />)}
              <Rope pts={[...pts, [pts[pts.length - 1][0] - 34, pts[pts.length - 1][1] + 22]]} sag={8} width={4} />
            </g>
          );
        })()}
        {/* sand carried off in baskets; the overseer gives the word */}
        <g><Standing x={870} y={g + 86} h={150} armF={30} armB={20} lean={8} /><g transform={`translate(906 ${g + 62}) scale(1.15)`}><Basket /></g></g>
        {crew > 4 && <Standing x={770} y={g + 70} h={156} kind="scribe" dir={-1} armF={mix(96, 128, (Math.sin(f * 0.1) + 1) / 2)} />}
      </Layer>
      {tools && <Layer depth={1.25}><Kit x={150} y={1392} gap={112}><RopeCoil /><Basket /><Lever /></Kit></Layer>}
    </>
  );
};

/** Finished: a pair of inscribed obelisks before the temple pylon, their gilded points catching the sun. */
const Temple: React.FC<ViewProps> = ({ f, seed, crew }) => {
  const g = GROUND + 16, len = 590, w = 84, ox = 300, tip = g - 44 - len;
  return (
    <>
      <FarDesert f={f} seed={seed} ridgeY={1040} />
      <Layer depth={0.6}>{[-320, -150, 1250, 1400].map((x, i) => <Palm key={x} x={x} y={1190} h={300 + (i % 2) * 70} f={f} seed={seed + i} lean={(i % 2 ? -1 : 1) * 14} />)}</Layer>
      <Layer depth={0.82}><Pylon id={`obN${seed}`} x={620} y={1196} w={1000} h={500} f={f} seed={seed + 3} /></Layer>
      <Layer depth={0.92}>
        <Pedestal x={940} y={g - 8} w={112} h={38} seed={seed + 30} />
        <ObeliskShaft id={`obV${seed}`} x={940} y={g - 46} len={530} w={74} stage="inscribed" cap seed={seed + 14} />
      </Layer>
      <Layer depth={1}>
        <SiteFloor f={f} seed={seed} />
        {[1250, 1310, 1390].map((y, i) => <rect key={y} x={X0} y={y} width={WW} height={2} fill={C.gold} opacity={0.35 - i * 0.08} />)}
        <ellipse cx={ox + 40} cy={g + 4} rx={150} ry={10} fill={C.shadow} opacity={0.2} />
        <Pedestal x={ox} y={g} w={132} h={44} seed={seed + 24} />
        <ObeliskShaft id={`obF${seed}`} x={ox} y={g - 44} len={len} w={w} stage="inscribed" cap seed={seed + 10} />
        <Glow id={`obK${seed}`} x={ox} y={tip + 30} r={150} f={f} strength={0.55} />
        {/* priests before it, small against the stone */}
        <Standing x={520} y={g + 30} h={104} kind="priest" dir={-1} armF={118} armB={96} />
        <Standing x={600} y={g + 42} h={100} kind="priest" dir={-1} armF={20} />
        {crew > 2 && <Standing x={690} y={g + 34} h={100} kind="scribe" dir={-1} armF={70} />}
        {crew > 4 && <Standing x={790} y={g + 46} h={108} kind="pharaoh" dir={-1} armF={86} />}
      </Layer>
      <Layer depth={1.3}><Palm x={1150} y={1480} h={520} f={f} seed={seed + 9} lean={-34} /></Layer>
    </>
  );
};

const VIEWS: Record<string, React.FC<ViewProps>> = {
  "granite quarry": Quarry, "trench carving": Trench, smoothing: Smoothing, "sledge hauling": Hauling,
  "barge loading": Loading, "river transport": Transport, erection: Erection, "temple obelisk": Temple,
};

export const ObeliskTemplate: React.FC<TemplateProps> = ({ scene, seed }) => {
  const { f, D, p } = useClock();
  const View = VIEWS[paramOf(scene, "view")] ?? Quarry;
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
