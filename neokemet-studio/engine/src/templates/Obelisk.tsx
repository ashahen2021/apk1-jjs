import React from "react";
import { paramOf } from "../../../shared/params.ts";
import { useClock } from "../components/AnimatedScene";
import { Camera, Layer } from "../components/Camera";
import { cameraMove, FarDesert, GROUND, SiteFloor } from "../components/Environments";
import { Figure } from "../components/Figures";
import { StoneBarge, Rope, ToolKit } from "../components/Objects";
import { Ground, RRect, Streaks } from "../components/Print";
import { Palm } from "../components/Landscape";
import { ramp, pulse } from "../lib/anim";
import { C } from "../lib/theme";
import { Caption, TemplateProps, TitleBlock } from "./common";

// Eight purpose-built print compositions; no pyramid-construction backgrounds.
// Coordinates follow the same 1080 x 1920 stage as the original Great Pyramid.
// Stone erection technique is illustrative, not a claim of one proven method.
type View = { f: number; D: number; seed: number; crew: number; tools: boolean };
const CREW: Record<string, number> = { two: 2, four: 4, six: 6 };
const S = C.earth;

const Obelisk: React.FC<{x:number;y:number;length?:number;thick?:number;vertical?:boolean;angle?:number;carved?:boolean}> = ({x,y,length=610,thick=94,vertical=false,angle=0,carved=true}) => (
  <g transform={"translate("+x+" "+y+") rotate("+(vertical ? -90 + angle : angle)+")"}>
    <path d={"M0 0 L"+(length-95)+" 0 L"+length+" "+(thick/2)+" L"+(length-95)+" "+thick+" L0 "+thick+" Z"} fill={C.sand} stroke={S} strokeWidth={5}/>
    <path d={"M0 "+thick+" L"+(length-95)+" "+thick+" L"+(length-95)+" "+(thick*.58)+" L0 "+(thick*.58)+"Z"} fill={C.gold} opacity={0.5}/>
    <path d={"M"+(length-95)+" 0 L"+length+" "+(thick/2)+" L"+(length-95)+" "+thick+"Z"} fill={C.terra} opacity={0.55}/>
    {carved && Array.from({length:8},(_,i)=><g key={i} fill="none" stroke={S} strokeWidth={2} opacity={0.62}>
      <path d={"M"+(64+i*59)+" 17 h17 v12 h-12 M"+(75+i*59)+" 40 v10 h18"}/>
      <circle cx={80+i*59} cy={thick-19} r={5}/>
    </g>)}
  </g>
);

const Workers:React.FC<{x:number;y:number;n:number;f:number;spacing?:number;h?:number}> = ({x,y,n,f,spacing=105,h=135}) => (
  <g>{Array.from({length:n},(_,i)=><Figure key={i} x={x+i*spacing} y={y} h={h} kind="bearer" dir={i%2 ? -1:1} lean={8+Math.sin(f*.065+i)*7} armF={70+i%3*10} armB={40+i%2*25}/>)}</g>
);

const StoneChips:React.FC<{x:number;y:number}> = ({x,y}) => <g fill={C.sand} stroke={S} strokeWidth={2}>
  {Array.from({length:11},(_,i)=><path key={i} d={"M"+(x+i*31)+" "+(y+(i%3)*10)+" l16 -8 l9 13 z"}/>)}
</g>;

const Quarry:React.FC<View> = ({f,seed,crew,tools}) => <g>
  <FarDesert f={f} seed={seed} ridgeY={970} pyramids={false}/>
  <Layer depth={1}>
    <path d="M-320 1020 L1240 1020 L1240 1330 L-320 1330Z" fill={C.sand} opacity={0.6}/>
    <path d="M0 1050 L1040 1050 L1040 1295 L0 1295Z" fill={C.gold} opacity={0.25} stroke={S} strokeWidth={5}/>
    <Obelisk x={165} y={1090} length={720} thick={112} carved={false}/>
    <path d="M145 1065 H920 V1235 H145Z" fill="none" stroke={S} strokeWidth={10} strokeDasharray="26 12"/>
    <Workers x={180} y={1310} n={crew} f={f} h={128}/>
    <StoneChips x={440} y={1350}/><SiteFloor f={f} seed={seed}/>
    {tools && <ToolKit x={220} y={1450} set="haulers" s={1.2}/>}
  </Layer>
</g>;

const Trench:React.FC<View> = ({f,seed,crew,tools}) => <g>
  <FarDesert f={f} seed={seed} ridgeY={1010} pyramids={false}/>
  <Layer depth={1}>
    <path d="M-140 960 H1200 V1440 H-140Z" fill={C.sand} opacity={0.43}/>
    <path d="M160 1070 L920 1070 L1000 1260 L100 1260Z" fill={C.earth} opacity={0.45}/>
    <path d="M188 1095 L894 1095 L955 1225 L139 1225 Z" fill={C.shadow} opacity={0.3}/>
    <Obelisk x={204} y={1114} length={675} thick={72} carved={false}/>
    <path d="M165 1070 H910 L954 1237 H131 Z" fill="none" stroke={C.cream} strokeWidth={12}/>
    <Workers x={210} y={1340} n={Math.min(crew,4)} f={f} h={178} spacing={172}/>
    <StoneChips x={190} y={1430}/><StoneChips x={645} y={1440}/>
    {tools && <ToolKit x={520} y={1510} set="haulers" s={1.25}/>}
  </Layer>
</g>;

const Smoothing:React.FC<View> = ({f,seed,crew,tools}) => <g>
  <FarDesert f={f} seed={seed} ridgeY={1030} pyramids={false}/>
  <Layer depth={1}>
    <rect x={180} y={1215} width={80} height={85} fill={S}/>
    <rect x={770} y={1215} width={80} height={85} fill={S}/>
    <Obelisk x={145} y={1110} length={760} thick={145}/>
    <Workers x={200} y={1345} n={Math.min(crew,4)} f={f} spacing={215} h={188}/>
    <StoneChips x={370} y={1400}/><SiteFloor f={f} seed={seed}/>
    {tools && <ToolKit x={615} y={1480} set="haulers" s={1.4}/>}
  </Layer>
</g>;

const Hauling:React.FC<View> = ({f,seed,crew,tools}) => <g>
  <FarDesert f={f} seed={seed} ridgeY={1020} pyramids={false}/>
  <Layer depth={1}>
    {/* Two parallel wooden runners, not wheels: the obelisk travels on a sledge. */}
    <path d="M110 1266 H800 L826 1298 H105Z" fill={S} stroke={C.shadow} strokeWidth={4}/>
    <path d="M120 1304 H798" stroke={C.earth} strokeWidth={15} strokeLinecap="round"/>
    <path d="M126 1320 H790" stroke={C.shadow} strokeWidth={5} strokeLinecap="round"/>
    <Obelisk x={135} y={1140} length={700} thick={105}/>
    <Rope pts={[[810,1250],[960,1320],[1050,1325]]} sag={10} width={6}/>
    <Workers x={754} y={1410} n={Math.min(crew,3)} f={f} spacing={104} h={160}/>
    <SiteFloor f={f} seed={seed}/>
    {tools && <ToolKit x={230} y={1470} set="haulers" s={1.15}/>}
  </Layer>
</g>;

const Water:React.FC<{f:number;seed:number}> = ({f,seed}) => <g>
  <FarDesert f={f} seed={seed} ridgeY={980} pyramids={false}/>
  <Layer depth={0.7}>
    <Palm x={110} y={1060} h={185} f={f} seed={seed+2}/>
    <Palm x={970} y={1070} h={210} f={f} seed={seed+3}/>
    <RRect x={-650} y={1100} w={2300} h={410} seed={seed+5} fill={C.shadow} amp={4} step={35}/>
    <Streaks x={-600} y={1120} w={2200} h={355} seed={seed+7} count={165} color={C.teal} opacity={0.75} maxLen={270} thick={5}/>
  </Layer>
</g>;

const Loading:React.FC<View> = ({f,seed,crew,tools}) => <g>
  <Water f={f} seed={seed}/>
  <Layer depth={1}>
    <StoneBarge x={650} y={1230} s={1.6} seed={seed+8}/>
    <path d="M-60 1430 L520 1300 L570 1330 L-60 1530Z" fill={C.sand} stroke={S} strokeWidth={5}/>
    <g transform="translate(130 1200) rotate(-12)"><Obelisk x={0} y={0} length={660} thick={83}/></g>
    <Rope pts={[[750,1200],[840,1350],[970,1430]]} sag={9}/>
    <Workers x={165} y={1500} n={Math.min(crew,4)} f={f} h={155} spacing={125}/>
    {tools && <ToolKit x={110} y={1580} set="haulers" s={1.1}/>}
  </Layer>
</g>;

const RiverTransport:React.FC<View> = ({f,seed,crew}) => <g>
  <Water f={f} seed={seed}/>
  <Layer depth={1}>
    <StoneBarge x={470+f*.22} y={1290} s={2} seed={seed+9}/>
    <Obelisk x={155+f*.22} y={1150} length={700} thick={94}/>
    <Workers x={260+f*.22} y={1203} n={Math.min(crew,3)} f={f} h={100} spacing={195}/>
    <Streaks x={100} y={1435} w={1000} h={120} seed={seed+11} count={75} color={C.paper} opacity={0.65} maxLen={200} thick={3}/>
  </Layer>
</g>;

const Erection:React.FC<View> = ({f,D,seed,crew,tools}) => {
  const angle = -17-54*ramp(f,D*.05,D*.85);
  return <g>
    <FarDesert f={f} seed={seed} ridgeY={1050} pyramids={false}/>
    <Layer depth={1}>
      <path d="M90 1250 L510 860 L660 1250 Z" fill={C.sand} stroke={S} strokeWidth={5}/>
      <g transform={"translate(540 1260) rotate("+angle+")"}>
        <Obelisk x={0} y={-65} length={750} thick={120}/>
      </g>
      <Rope pts={[[540+Math.cos(angle*Math.PI/180)*600,1190+Math.sin(angle*Math.PI/180)*600],[880,890],[1060,1335]]} width={5}/>
      <Workers x={765} y={1395} n={Math.min(crew,3)} f={f} h={154} spacing={102}/>
      <SiteFloor f={f} seed={seed}/>
      {tools && <ToolKit x={130} y={1470} set="haulers" s={1.3}/>}
    </Layer>
  </g>;
};

const Monument:React.FC<View> = ({f,seed,crew}) => <g>
  <FarDesert f={f} seed={seed} ridgeY={1100} pyramids={false}/>
  <Layer depth={0.65}>
    {/* Battered New Kingdom temple pylon, not a classical triangular pediment. */}
    <path d="M648 910 H805 L820 1295 H620 Z" fill={C.sand} stroke={S} strokeWidth={6}/>
    <path d="M872 910 H1050 L1080 1295 H845 Z" fill={C.sand} stroke={S} strokeWidth={6}/>
    <path d="M807 1015 H870 V1295 H807Z" fill={C.shadow}/>
    <path d="M630 925 H1060 M630 964 H1060" stroke={C.gold} strokeWidth={10}/>
    {[693,940].map(x=><g key={x} fill="none" stroke={S} strokeWidth={4} opacity={0.65}>
      <path d={"M"+x+" 1008 h72 v155 h-72Z M"+(x+14)+" 1045 h44 M"+(x+14)+" 1090 h44 M"+(x+14)+" 1135 h44"}/>
    </g>)}
  </Layer>
  <Layer depth={1}>
    <rect x={150} y={1290} width={355} height={55} fill={S}/>
    <Obelisk x={280} y={1290} length={830} thick={142} vertical/>
    <Workers x={720} y={1400} n={Math.min(crew,3)} f={f} h={126} spacing={128}/>
    <SiteFloor f={f} seed={seed}/>
  </Layer>
</g>;

const VIEWS:Record<string,React.FC<View>> = {
  "granite quarry":Quarry, "trench carving":Trench, smoothing:Smoothing,
  "sledge hauling":Hauling, "barge loading":Loading, "river transport":RiverTransport,
  erection:Erection, "temple obelisk":Monument,
};

export const ObeliskTemplate:React.FC<TemplateProps> = ({scene,seed}) => {
  const {f,D,p}=useClock();
  const Shot=VIEWS[paramOf(scene,"view")] ?? Quarry;
  const flip=paramOf(scene,"facing")==="left";
  const t=pulse(f,Math.min(20,D*.1),Math.min(50,D*.25),D-30,D-6);
  return <Camera {...cameraMove(scene.camera ?? "push-in",p)} cy={1040}>
    <g transform={flip ? "translate(1080 0) scale(-1 1)" : undefined}>
      <Shot f={f} D={D} seed={seed} crew={CREW[paramOf(scene,"crew")]??4} tools={paramOf<boolean>(scene,"showTools")}/>
    </g>
    {paramOf(scene,"heading")==="title"
      ? <TitleBlock title={scene.label} sub={scene.sublabel} t={ramp(f,10,35)}/>
      : <Caption label={scene.label} sub={scene.sublabel} t={t}/>}
  </Camera>;
};
