// Original, locally rendered V1 topic illustrations. No image generation or V3 assets.
// Every frame uses simple editable SVG geometry consistent with V1's graphic language.
import React from "react";
import { useClock } from "../components/AnimatedScene";
import { C } from "../lib/theme";
import type { TemplateProps } from "./common";

type ArtProps = { t: number; f: number; seed: number };
const tr = (v: number) => Math.max(0, Math.min(1, v));
const rise = (t: number, a = 0, b = 0.3) => tr((t - a) / (b - a));
const SKIN = C.earth;
const Person: React.FC<{x:number; y:number; scale?:number; arm?:number; kneel?:boolean}> = ({x,y,scale=1,arm=0,kneel=false}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d={kneel ? "M-23 -85L-50 -36L-12 -36M24 -85L48 -42L70 -42" : "M-20 -85L-24 0M20 -85L25 0"} stroke={SKIN} strokeWidth="17" fill="none" strokeLinecap="round"/>
    <path d="M-35 -190L35 -190L44 -75L-45 -75Z" fill={C.cream} stroke={C.sand} strokeWidth="5"/>
    <path d="M-35 -130L35 -130L42 -80L-42 -80Z" fill={C.teal} opacity=".75"/>
    <path d="M-34 -175L-62 -120" stroke={SKIN} strokeWidth="17" strokeLinecap="round"/>
    <g transform={`rotate(${arm} 32 -170)`}><path d="M30 -175L74 -125" stroke={SKIN} strokeWidth="17" strokeLinecap="round"/><circle cx="74" cy="-125" r="11" fill={SKIN}/></g>
    <circle cy="-236" r="34" fill={SKIN}/><path d="M-35 -244Q0 -289 35 -244" fill="none" stroke={C.shadow} strokeWidth="12"/>
  </g>
);
const Flame: React.FC<{x:number;y:number;t:number}> = ({x,y,t}) => (
  <g>
    <circle cx={x} cy={y-55} r={135+9*Math.sin(t*12)} fill={C.gold} opacity=".13"/>
    <path d={`M${x} ${y}Q${x-24} ${y-36} ${x-3} ${y-105-8*Math.sin(t*13)}Q${x+35} ${y-54} ${x} ${y}Z`} fill={C.gold}/>
    <path d={`M${x} ${y-6}Q${x-12} ${y-29} ${x} ${y-65}Q${x+14} ${y-28} ${x} ${y-6}Z`} fill={C.cream}/>
  </g>
);
const Wall: React.FC<{y?:number}> = ({y=585}) => (
  <g>
    <rect x="110" y={y} width="860" height="720" fill={C.sand} stroke={C.earth} strokeWidth="9"/>
    <path d={`M115 ${y+108}H970M115 ${y+570}H970`} stroke={C.terra} strokeWidth="14"/>
    {[0,1,2,3,4].map((i) => <g key={i} transform={`translate(${175+i*165} ${y+235})`} stroke={i%2?C.teal:C.terra} strokeWidth="10" fill="none">
      <path d="M0 0Q35 -70 68 0Q35 43 0 0Z"/><path d="M35 -65V87M-16 92H83M5 132H65M25 160H50"/>
    </g>)}
  </g>
);
const Water: React.FC<{f:number}> = ({f}) => <g>{[0,1,2,3,4].map(i=><path key={i} d={`M60 ${1160+i*58}Q300 ${1118+i*58+Math.sin(f/20)*12} 540 ${1160+i*58}T1020 ${1160+i*58}`} stroke={C.teal} strokeWidth="16" fill="none" opacity={.4+i*.1}/>)}</g>;
const Stone: React.FC<{x:number;y:number;w?:number;h?:number}> = ({x,y,w=310,h=215}) => (
  <g><path d={`M${x} ${y}L${x+w-22} ${y-21}L${x+w} ${y+h-26}L${x+10} ${y+h}Z`} fill={C.sand} stroke={C.earth} strokeWidth="7"/>
    <path d={`M${x+30} ${y+36}L${x+w-40} ${y+24}M${x+35} ${y+85}L${x+w-40} ${y+74}`} stroke={C.paper} strokeWidth="5" opacity=".7"/></g>
);

const LampArt: React.FC<ArtProps> = ({t}) => (
  <g><path d="M180 1260V780Q540 325 900 780V1260" fill={C.shadow} stroke={C.earth} strokeWidth="45"/>
    {[330,540,750].map(x=><path key={x} d={`M${x} 450L${x} 1240`} stroke={C.sand} strokeWidth="7" opacity=".28"/>)}
    <ellipse cx="540" cy="1275" rx="245" ry="25" fill={C.ink} opacity=".35"/>
    <path d="M395 1180Q540 1040 685 1180L660 1250H420Z" fill={C.gold} stroke={C.cream} strokeWidth="10"/>
    <path d="M660 1180Q770 1160 755 1193" stroke={C.gold} fill="none" strokeWidth="21"/>
    <Flame x={540} y={1130} t={t}/></g>
);
const PigmentArt: React.FC<ArtProps> = ({t}) => (
  <g><rect x="120" y="1090" width="850" height="100" fill={C.earth}/><rect x="155" y="1190" width="44" height="185" fill={C.earth}/><rect x="885" y="1190" width="44" height="185" fill={C.earth}/>
    {[C.teal,C.terra,C.gold].map((v,i)=><g key={i}><ellipse cx={290+i*250} cy="1104" rx="102" ry="26" fill={C.shadow}/><path d={`M${188+i*250} 1100Q${290+i*250} 1190 ${392+i*250} 1100`} fill={v}/></g>)}
    <g transform={`translate(${540+35*Math.sin(t*8)} ${1010}) rotate(${-12+10*Math.sin(t*8)})`}><rect x="-38" y="-170" width="76" height="195" rx="25" fill={C.sand} stroke={C.earth} strokeWidth="5"/></g>
    <Person x={190} y={1174} scale={1.25} arm={-38+7*Math.sin(t*8)}/></g>
);
const PaintArt: React.FC<ArtProps> = ({t}) => (
  <g><Wall y={470}/><Person x={350} y={1255} scale={1.45} arm={-75+11*Math.sin(t*9)}/>
    <path d={`M${455} ${930-30*Math.sin(t*9)}L${660} ${625-20*Math.sin(t*9)}`} stroke={C.earth} strokeWidth="12" strokeLinecap="round"/>
    <path d={`M660 ${625-20*Math.sin(t*9)}l21 -33`} stroke={C.teal} strokeWidth="16" strokeLinecap="round"/>
    <path d="M720 630Q755 590 795 630" stroke={C.gold} fill="none" strokeWidth={12*rise(t,.1,.7)}/></g>
);
const CorridorArt: React.FC<ArtProps> = ({t}) => (
  <g><rect x="70" y="370" width="940" height="1000" fill={C.sand}/><path d="M120 1370L330 610H750L960 1370Z" fill={C.earth}/><path d="M310 1370L450 760H630L770 1370Z" fill={C.shadow}/><path d="M440 1370L500 950H580L640 1370Z" fill={C.night}/>
    <path d="M120 1370L330 610M960 1370L750 610" stroke={C.gold} strokeWidth="15" opacity=".6"/>
    <Flame x={545} y={1130} t={t}/></g>
);
const MuralArt: React.FC<ArtProps> = ({t}) => (
  <g><Wall y={440}/><g opacity={rise(t,.05,.55)}>
    <circle cx="535" cy="947" r="82" fill={C.gold}/><path d="M535 1005V1170M440 1080H635M535 1170L460 1220M535 1170L610 1220" stroke={C.shadow} strokeWidth="28" fill="none"/>
    <path d="M510 880H560" stroke={C.teal} strokeWidth="16"/></g>
    <path d={`M110 ${1330}H${110+850*rise(t,.1,.9)}`} stroke={C.terra} strokeWidth="14"/></g>
);
const ReedsArt: React.FC<ArtProps> = ({t,f}) => (
  <g><Water f={f}/>{[170,250,335,425,510,605,715,800,900].map((x,i)=><g key={x} transform={`rotate(${Math.sin(f/16+i)*3} ${x} 1200)`}><path d={`M${x} 1200Q${x-32} 750 ${x+14} 460`} stroke={C.teal} strokeWidth="16" fill="none"/><path d={`M${x-20} 760Q${x-130} 685 ${x-105} 602M${x-10} 890Q${x+120} 785 ${x+94} 713`} stroke={C.teal} strokeWidth="12" fill="none"/></g>)}
    <Person x={255} y={1285} scale={1.55} arm={-25+13*Math.sin(t*8)}/></g>
);
const StripArt: React.FC<ArtProps> = ({t}) => (
  <g><rect x="130" y="1070" width="820" height="100" fill={C.earth}/><rect x="170" y="1170" width="45" height="150" fill={C.earth}/><rect x="880" y="1170" width="45" height="150" fill={C.earth}/>
    {[0,1,2,3].map(i=><rect key={i} x={200+i*170} y={865+i*12} width={155} height="48" rx="12" fill={C.teal} opacity=".65"/>)}
    <path d={`M340 890Q540 ${815-35*Math.sin(t*9)} 780 895`} stroke={C.cream} strokeWidth="35" fill="none"/>
    <path d="M300 735L380 905M825 735L760 905" stroke={SKIN} strokeWidth="42" strokeLinecap="round"/></g>
);
const LayerArt: React.FC<ArtProps> = ({t}) => (
  <g><rect x="150" y="630" width="800" height="690" rx="18" fill={C.paperDark} stroke={C.earth} strokeWidth="13"/>
    {[0,1,2,3,4].map(i=><rect key={i} x={225+i*120} y={710} width="74" height="510" rx="10" fill={C.sand} stroke={C.gold} strokeWidth="4"/>)}
    <g opacity={rise(t,.15,.7)}>{[0,1,2,3,4].map(i=><rect key={i} x={205} y={740+i*100} width="675" height="65" rx="12" fill={C.cream} stroke={C.earth} strokeWidth="3" opacity=".87"/>)}</g></g>
);
const PressArt: React.FC<ArtProps> = ({t}) => (
  <g><rect x="125" y="1100" width="850" height="105" fill={C.earth}/><rect x="210" y={855+100*rise(t,.2,.9)} width="670" height="150" rx="18" fill={C.sand} stroke={C.shadow} strokeWidth="9"/>
    <rect x="210" y="1054" width="670" height="32" fill={C.paper} stroke={C.gold} strokeWidth="6"/>
    <path d="M540 790V850" stroke={C.earth} strokeWidth="24" strokeLinecap="round"/>
    <path d="M385 740L540 805L695 740" stroke={SKIN} strokeWidth="40" strokeLinecap="round" fill="none"/></g>
);
const ScribeArt: React.FC<ArtProps> = ({t}) => (
  <g><Person x={285} y={1270} scale={1.7} arm={-38+8*Math.sin(t*10)}/>
    <rect x="360" y="850" width="600" height="390" rx="18" fill={C.paperDark} stroke={C.gold} strokeWidth="14"/>
    {[0,1,2,3].map(i=><path key={i} d={`M420 ${920+i*72}H${420+440*rise(t,.1+i*.12,.6+i*.1)}`} stroke={C.ink} strokeWidth="10" strokeLinecap="round" />)}
    <path d={`M480 ${1020+25*Math.sin(t*10)}L610 920`} stroke={C.teal} strokeWidth="12"/></g>
);
const QuarryArt: React.FC<ArtProps> = ({t}) => (
  <g><path d="M60 1380L130 670L430 560L520 1370Z" fill={C.sand}/><path d="M530 1370L610 470L990 620L1030 1370Z" fill={C.earth} opacity=".7"/>
    <Stone x={415} y={990}/><Person x={200} y={1210} scale={1.2} arm={-40+16*Math.sin(t*10)}/>
    <path d={`M290 ${950-20*Math.sin(t*10)}L480 1030`} stroke={C.shadow} strokeWidth="14"/></g>
);
const LoadArt: React.FC<ArtProps> = ({t}) => (
  <g><path d="M160 1280L900 900V1380H160Z" fill={C.sand} stroke={C.earth} strokeWidth="8"/>
    <g transform={`translate(${190+150*rise(t,0,1)} ${-80*rise(t,0,1)})`}><Stone x={230} y={990} w={330} h={205}/></g>
    <Person x={190} y={1370} scale={1.1} arm={-55}/>
    <path d={`M315 ${1060-80*rise(t,0,1)}L100 1140`} stroke={C.terra} strokeWidth="8"/></g>
);
const RopesArt: React.FC<ArtProps> = ({t}) => (
  <g><Stone x={170} y={780} w={750} h={420}/><path d="M185 860Q530 990 900 860M180 990Q530 1140 900 990" stroke={C.terra} strokeWidth="24" fill="none" />
    <path d={`M545 855Q${615+25*Math.sin(t*8)} 940 550 1020Q460 1070 520 990Q610 935 545 855Z`} fill="none" stroke={C.gold} strokeWidth="19"/><path d="M535 1030Q660 1190 845 1240" stroke={C.terra} strokeWidth="19" fill="none"/></g>
);
const SailArt: React.FC<ArtProps> = ({t,f}) => (
  <g><Water f={f}/><g transform={`translate(${22*Math.sin(t*8)} ${8*Math.sin(t*10)})`}>
    <path d="M110 1120H990L860 1310H245Z" fill={C.earth} stroke={C.shadow} strokeWidth="10"/>
    <path d="M520 1100V410" stroke={C.earth} strokeWidth="25"/><path d="M530 440Q800 600 740 970L530 970Z" fill={C.cream} stroke={C.gold} strokeWidth="11"/>
    {[210,390,570].map(x=><Stone key={x} x={x} y={1005} w={160} h={93}/>)}</g></g>
);
const UnloadArt: React.FC<ArtProps> = ({t}) => (
  <g><path d="M0 1280H1080" stroke={C.earth} strokeWidth="100"/><path d="M90 970H960L870 1120H180Z" fill={C.teal}/>
    <path d="M390 1100L790 1310" stroke={C.sand} strokeWidth="50"/>
    <g transform={`translate(${170*rise(t,0,1)} ${95*rise(t,0,1)})`}><Stone x={240} y={880} w={280} h={190}/></g>
    <Person x={795} y={1295} scale={1.25} arm={-30+15*Math.sin(t*8)}/></g>
);
const ART: Record<string, React.FC<ArtProps>> = {
  lamp: LampArt, pigments: PigmentArt, artist: PaintArt, corridor: CorridorArt, mural: MuralArt,
  reeds: ReedsArt, strip: StripArt, layer: LayerArt, press: PressArt, scribe: ScribeArt,
  quarry: QuarryArt, load: LoadArt, ropes: RopesArt, sail: SailArt, unload: UnloadArt,
};
const LABELS: Record<string,string> = {
  lamp:"WORKING BY LAMPLIGHT",pigments:"GROUND PIGMENTS",artist:"PAINTED BY HAND",corridor:"INSIDE THE MOUNTAIN",mural:"THE UNDERWORLD",
  reeds:"HARVESTING PAPYRUS",strip:"STRIPPING THE STEM",layer:"CROSS-LAYERED FIBRES",press:"PRESSED INTO SHEETS",scribe:"WRITTEN BY HAND",
  quarry:"CUT FROM STONE",load:"HAULING THE BLOCKS",ropes:"SECURING THE CARGO",sail:"ACROSS THE NILE",unload:"ARRIVING AT GIZA",
};

export const V1TopicShortTemplate: React.FC<TemplateProps> = ({scene,seed}) => {
  const {f,D} = useClock();
  const shots = String(scene.params?.shots ?? "").split(",").map(x=>x.trim()).filter(Boolean);
  const n = Math.max(1,shots.length);
  const pos = tr(f/Math.max(1,D)) * n;
  const idx = Math.min(n-1,Math.floor(pos));
  const t = tr(pos-idx);
  const id = shots[idx];
  const Art = ART[id];
  const topic = String(scene.params?.topic ?? "missing");
  const HOOKS: Record<string, string> = {
    painting: "PAINTING IN DARKNESS?",
    papyrus: "PAPER FROM A PLANT?",
    transport: "HOW DID STONE MOVE?",
  };
  const label = scene.params?.hook === true && f < 90 && HOOKS[topic] ? HOOKS[topic] : (LABELS[id] || "ILLUSTRATION NEEDED");
  return (
    <g>
      <rect x="0" y="0" width="1080" height="1920" fill={C.paper}/>
      <rect x="55" y="70" width="970" height="1340" fill={topic==="painting"?C.paperDark:topic==="papyrus"?C.cream:C.paper} stroke={C.sand} strokeWidth="9"/>
      <g opacity=".25">{[0,1,2,3,4,5,6].map(i=><path key={i} d={`M70 ${440+i*130}H1020`} stroke={C.gold} strokeWidth="3"/>)}</g>
      {Art ? <g transform={`translate(${(t-.5)*12} ${(1-rise(t,0,.12))*25}) scale(${1+.02*t})`}><Art t={t} f={f} seed={seed}/></g> :
        <g><rect x="170" y="660" width="740" height="500" fill={C.cream} stroke={C.terra} strokeWidth="9"/>
          <text x="540" y="880" fontSize="48" fill={C.shadow} textAnchor="middle">NEW SVG ART NEEDED</text></g>}
      <rect x="90" y="173" width="900" height="140" rx="15" fill={C.shadow}/>
      <text x="540" y="265" fontSize="47" fontWeight="700" fill={C.cream} textAnchor="middle" letterSpacing="2">{label}</text>
      <path d="M155 340H925" stroke={C.gold} strokeWidth="11"/>
      <g opacity=".5">{shots.map((_,i)=><rect key={i} x={540-shots.length*27+i*54} y="1432" width="42" height="9" fill={i===idx?C.terra:C.sand}/>)}</g>
    </g>
  );
};
