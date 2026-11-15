/**
 * Bespoke Painting the Dark illustrations in the ORIGINAL Great Pyramid
 * printmaking language. Uses precisely the same paper, ink, rough-edge,
 * environment, actor and atmosphere primitives as the classic scenes.
 *
 * This is deliberately different from the separate Tomb Painting Flat renderer.
 * It contains no arbitrary executable SVG from Ollama.
 */
import React from "react";
import { Camera } from "../components/Camera";
import { Backdrop, GROUND, cameraMove } from "../components/Environments";
import { Figure, GroundShadow } from "../components/Figures";
import { Dust, Flame, Glow } from "../components/Atmosphere";
import { RPoly, RRect, Stipple, Streaks } from "../components/Print";
import { Caption } from "./common";
import { C } from "../lib/theme";
import { pulse } from "../lib/anim";

type Props={recipe:string;frame:number;duration:number;label:string;captionActive?:boolean};
const frameSeed=(recipe:string)=>recipe.split("").reduce((s,c)=>((s*33+c.charCodeAt(0))>>>0),7)%300+1;
const X=(x:number)=>x;

/** Earth-toned Nile pigments kept inside natural limestone/clay bowls. */
const Bowl:React.FC<{x:number;y:number;s?:number;ink:string;seed:number}>=({x,y,s=1,ink,seed})=><g transform={"translate("+x+" "+y+") scale("+s+")"}>
  <ellipse cx="0" cy="17" rx="98" ry="22" fill={C.shadow} opacity=".12"/>
  <RPoly pts={[[-92,-5],[-79,28],[-48,50],[53,50],[82,28],[92,-5]]} seed={seed} fill={C.earth} amp={2}/>
  <ellipse cx="0" cy="-5" rx="92" ry="30" fill={C.cream} stroke={C.sand} strokeWidth="3"/>
  <ellipse cx="0" cy="-7" rx="73" ry="21" fill={ink} opacity=".85"/>
  <path d="M-53 -14Q0 -23 51 -10" stroke={C.paper} strokeWidth="3" opacity=".3" fill="none"/>
</g>;

/** Historic clay lamp — understated, not a modern candlestick. */
const ClayLamp:React.FC<{x:number;y:number;s?:number;f:number;id:string}>=({x,y,s=1,f,id})=><g transform={"translate("+x+" "+y+") scale("+s+")"}>
  <ellipse cx="0" cy="18" rx="109" ry="23" fill={C.shadow} opacity=".13"/>
  <Glow x={28} y={-52} r={235} f={f} id={id} strength={0.32}/>
  <RPoly pts={[[-110,0],[-73,31],[76,32],[112,0],[75,8],[-74,8]]} seed={87} fill={C.earth} amp={2}/>
  <ellipse cx="0" cy="0" rx="102" ry="34" fill={C.gold} stroke={C.earth} strokeWidth="3"/>
  <ellipse cx="-18" cy="-4" rx="63" ry="15" fill={C.shadow} opacity=".55"/>
  <path d="M32 1L103 -30" stroke={C.earth} strokeWidth="12" strokeLinecap="round"/>
  <Flame x={100} y={-32} f={f} s={1.65}/>
</g>;

/** A warm, almost monochrome, historically styled working painter. */
const Painter:React.FC<{x:number;y?:number;h?:number;f:number;dir?:1|-1;brush?:boolean;seed:number}>=({x,y=GROUND,h=342,f,dir=1,brush=true,seed})=><g>
  <GroundShadow x={x+12} y={y+3} w={h*.46} opacity={.17}/>
  <Figure x={x} y={y} h={h} kind="worker" dir={dir} armF={brush?68:14} armB={-3}/>
  {brush&&<g transform={"translate("+ (x+dir*h*.31)+" "+(y-h*.67)+")"}>
    <path d={"M0 0l"+(dir*96)+" -125"} stroke={C.earth} strokeWidth="5" strokeLinecap="round"/>
    <path d={"M"+(dir*91)+" -120l"+(dir*13)+" -21l"+(dir*2)+" 26Z"} fill={C.terra}/>
  </g>}
  <Dust f={f} x={x-h*.75} y={y-h*1.08} w={h*1.4} h={h*.88} count={17} seed={seed} opacity={.26}/>
</g>;

/** Dry-brushed horizontal registers without hard black geometric frames. */
const DecorativeWall:React.FC<{seed:number;figures?:number;w?:number}>=({seed,figures=1,w=740})=><g>
  <RRect x={540-w/2} y={510} w={w} h={560} fill={C.paperDark} seed={seed} amp={3}/>
  <Streaks x={540-w/2+20} y={525} w={w-40} h={520} count={90} seed={seed+1} color={C.gold} opacity={.22} maxLen={180} thick={3}/>
  <path d={"M"+(540-w/2)+" 588H"+(540+w/2)+"M"+(540-w/2)+" 1040H"+(540+w/2)} stroke={C.terra} opacity=".62" strokeWidth="8"/>
  {Array.from({length:figures},(_,i)=> {
    const xx=540+(i-(figures-1)/2)*Math.min(230,w/figures*.88);
    return <g key={i}>
      <Figure x={xx} y={1012} h={268} kind={i%2?"scribe":"priest"} dir={i%2?-1:1} armF={i%2?48:12}/>
      <RPoly pts={[[xx-64,1045],[xx+68,1045],[xx+73,1054],[xx-64,1054]]} seed={seed+i+8} fill={C.terra} opacity={.6}/>
    </g>;
  })}
</g>;

const Worktable:React.FC<{seed:number;large?:boolean}>=({seed,large=false})=><g>
  <RRect x={large?106:130} y={1025} w={large?860:800} h={51} seed={seed+2} amp={2.2} fill={C.earth}/>
  <RRect x={large?160:198} y={1072} w={30} h={149} seed={seed+3} fill={C.sand}/>
  <RRect x={large?893:835} y={1072} w={32} h={149} seed={seed+4} fill={C.sand}/>
  {[[270,C.terra],[440,C.gold],[615,C.teal],[800,C.shadow]].map(([x,col],i)=> 
    <Bowl key={i} x={Number(x)} y={1008} s={.62} ink={String(col)} seed={seed+i+10}/>)}
  <Streaks x={135} y={1060} w={820} h={20} seed={seed+90} count={22} color={C.paper} opacity={.25}/>
</g>;

const Mortar:React.FC<{seed:number;f:number}>=({seed,f})=><g>
  <RRect x={140} y={990} w={800} h={215} seed={seed} fill={C.earth} amp={4}/>
  <RPoly pts={[[280,895],[800,895],[747,1010],[341,1010]]} seed={seed+1} fill={C.sand} amp={4}/>
  <ellipse cx={540} cy={887} rx={255} ry={95} fill={C.cream} stroke={C.gold} strokeWidth="4"/>
  <ellipse cx={540} cy={876} rx={204} ry={70} fill={C.terra} opacity={.91}/>
  <ellipse cx={500} cy={863} rx={100} ry={25} fill={C.gold} opacity={.36}/>
  <g transform={"rotate("+(Math.sin(f*.06)*3)+" 620 875)"}>
    <RPoly pts={[[650,485],[688,505],[543,883],[503,865]]} seed={seed+2} fill={C.earth} amp={2}/>
    <ellipse cx={523} cy={876} rx={56} ry={35} fill={C.gold} opacity={.8}/>
  </g>
  <Bowl x={246} y={1050} s={.62} ink={C.teal} seed={seed+4}/>
  <Bowl x={823} y={1050} s={.62} ink={C.gold} seed={seed+5}/>
  <Stipple x={255} y={1040} w={600} h={90} seed={seed+6} count={170} color={C.paperDark} opacity={.25}/>
</g>;

const TombPortal:React.FC<{f:number;seed:number;open?:boolean}>=({f,seed,open=false})=><g>
  <RPoly pts={[[210,510],[870,510],[930,1200],[150,1200]]} seed={seed} fill={C.earth} amp={3}/>
  <RPoly pts={[[313,610],[766,610],[807,1189],[272,1189]]} seed={seed+1} fill={C.shadow} amp={3}/>
  <RPoly pts={[[384,706],[693,706],[709,1181],[372,1181]]} seed={seed+2} fill={open?C.paperDark:C.night} amp={2}/>
  <Streaks x={221} y={550} w={648} h={625} seed={seed+3} count={140} color={C.gold} opacity={.24} maxLen={130}/>
  <Stipple x={220} y={558} w={620} h={590} seed={seed+4} count={120} color={C.paper} opacity={.27}/>
  <Glow id={"portal-glow-"+seed} x={540} y={865} r={400} strength={.16} f={f}/>
</g>;

const PaintedLotus:React.FC<{x:number;y:number;s:number;seed:number}>=({x,y,s,seed})=><g transform={"translate("+x+" "+y+") scale("+s+")"}>
  <path d="M0 80L0 -18" stroke={C.teal} strokeWidth="8" strokeLinecap="round"/>
  <RPoly pts={[[0,24],[-72,-22],[-53,-86],[-6,-49],[0,-10]]} seed={seed} fill={C.teal} amp={1.5} opacity={.8}/>
  <RPoly pts={[[0,24],[72,-22],[53,-86],[6,-49],[0,-10]]} seed={seed+1} fill={C.teal} amp={1.5} opacity={.8}/>
  <RPoly pts={[[-23,15],[-23,-70],[0,-137],[23,-70],[23,15]]} seed={seed+2} fill={C.gold} amp={1.2}/>
  <path d="M-72 31Q0 51 72 31" stroke={C.terra} strokeWidth="6" fill="none"/>
</g>;

/**
 * Each shot must change its PRIMARY SUBJECT, SCALE, SPATIAL LAYOUT and camera
 * from its neighbours. Classic Great Pyramid print language is preserved.
 * Do not use the same wall/background as a blanket layer for all twelve shots.
 */
const WornPlaster:React.FC<{seed:number;x?:number;y?:number;w?:number;h?:number;dark?:boolean}>=
({seed,x=114,y=462,w=850,h=720,dark=false})=><g>
  <RRect x={x} y={y} w={w} h={h} seed={seed} fill={dark?C.sand:C.paperDark} amp={4}/>
  <Streaks x={x+20} y={y+15} w={w-40} h={h-30} seed={seed+1} count={205} color={dark?C.paper:C.sand} opacity={.32} maxLen={165} thick={3}/>
  <Stipple x={x+20} y={y+20} w={w-40} h={h-40} seed={seed+4} count={240} color={C.earth} opacity={.16} size={2.8}/>
</g>;

const WorkLight:React.FC<{f:number;x:number;y:number;seed:number;r?:number}>=({f,x,y,seed,r=330})=><g>
  <Glow x={x} y={y} f={f} id={"work-light-"+seed} r={r} strength={.38}/>
  <Dust f={f} x={Math.max(0,x-r)} y={y-r} w={Math.min(1000,r*2)} h={r*1.7} count={26} seed={seed} opacity={.30}/>
</g>;

const ColourSamples:React.FC<{seed:number;f:number}>=({seed,f})=><g>
  <WornPlaster seed={seed} x={108} y={484} w={860} h={700}/>
  <RRect x={144} y={930} w={800} h={244} seed={seed+3} fill={C.sand} amp={3}/>
  {[
    {x:260,y:716,s:1.08,c:C.terra},
    {x:525,y:675,s:1.23,c:C.gold},
    {x:797,y:718,s:1.04,c:C.teal},
    {x:326,y:995,s:.84,c:C.shadow},
    {x:755,y:990,s:.92,c:C.earth},
  ].map((v,i)=><Bowl key={i} x={v.x} y={v.y} s={v.s} ink={v.c} seed={seed+i*3}/>)}
  <RPoly pts={[[426,922],[454,882],[490,905],[475,949]]} seed={seed+8} fill={C.terra}/>
  <RPoly pts={[[600,922],[649,873],[682,937],[637,958]]} seed={seed+9} fill={C.gold}/>
  <Stipple x={185} y={680} w={725} h={470} seed={seed+10} count={140} color={C.earth} opacity={.16}/>
  <Dust f={f} x={220} y={530} w={680} h={470} seed={seed+11} count={18} opacity={.20}/>
</g>;

const BrushMacro:React.FC<{f:number;seed:number}>=({f,seed})=><g>
  <WornPlaster seed={seed} x={112} y={448} w={856} h={745}/>
  <RPoly pts={[[345,1002],[348,777],[444,696],[520,732],[529,1024]]} seed={seed+2} fill={C.teal} amp={2.5}/>
  <RPoly pts={[[344,1001],[442,692],[516,732],[471,837]]} seed={seed+3} fill={C.gold} amp={2}/>
  <path d="M360 1026Q408 982 466 1020" stroke={C.terra} strokeWidth={12} fill="none"/>
  <g transform={"rotate("+(Math.sin(f*.055)*2)+" 522 782)"}>
    <path d="M860 1000L530 762" fill="none" stroke={C.earth} strokeWidth={49} strokeLinecap="round"/>
    <path d="M552 782L481 721" fill="none" stroke={C.shadow} strokeWidth={20} strokeLinecap="round"/>
    <path d="M497 737Q477 701 465 685L487 724Z" fill={C.terra}/>
  </g>
  <Streaks x={195} y={1100} w={680} h={80} seed={seed+5} count={42} color={C.earth} opacity={.28}/>
</g>;

const UndergroundWork:React.FC<{f:number;seed:number}>=({f,seed})=><g>
  <RPoly pts={[[95,470],[985,470],[839,1192],[240,1192]]} seed={seed} fill={C.sand} amp={4}/>
  <RPoly pts={[[232,490],[862,490],[742,1165],[344,1165]]} seed={seed+1} fill={C.earth} amp={2.5}/>
  <RPoly pts={[[325,555],[750,555],[714,1160],[373,1160]]} seed={seed+2} fill={C.shadow} amp={3} opacity={.85}/>
  <RPoly pts={[[400,659],[675,659],[666,1130],[417,1130]]} seed={seed+3} fill={C.paperDark} amp={2}/>
  <Streaks x={176} y={550} w={728} h={612} seed={seed+4} count={160} color={C.gold} opacity={.33}/>
  <Painter x={340} y={1176} h={254} f={f} seed={seed+3}/>
  <Painter x={729} y={1160} h={196} f={f} seed={seed+4} dir={-1}/>
  <ClayLamp x={550} y={1173} s={.61} f={f} id={"u"+seed}/>
</g>;

const ProcessionalRegister:React.FC<{seed:number;f:number}>=({seed,f})=><g>
  <WornPlaster seed={seed} x={91} y={425} w={900} h={795}/>
  <path d="M110 582H970M110 1017H970" stroke={C.terra} strokeWidth={9} opacity={.58}/>
  {[220,440,660,865].map((x,i)=><g key={i}>
    <Figure x={x} y={995} h={295+(i%2)*16} kind={i===0?"scribe":"priest"} dir={i%2?1:-1} armF={i===0?74:20}/>
    {i!==0&&<g transform={"translate("+x+" 643) scale(.56)"}><PaintedLotus x={0} y={0} s={.5} seed={seed+i}/></g>}
  </g>)}
  <Stipple x={120} y={440} w={840} h={750} seed={seed+12} count={215} color={C.paper} opacity={.4}/>
  <Dust f={f} x={120} y={430} w={840} h={690} seed={seed+14} count={22} opacity={.24}/>
</g>;

const AgedFragment:React.FC<{seed:number;f:number}>=({seed,f})=><g>
  <WornPlaster seed={seed} x={129} y={460} w={820} h={735} dark/>
  <RPoly pts={[[205,596],[520,553],[830,586],[805,1006],[633,1085],[280,1038]]} seed={seed+7} fill={C.paperDark} amp={6}/>
  <path d="M215 616L804 614M230 1014L792 1014" stroke={C.terra} strokeWidth={7} opacity={.43}/>
  <Figure x={406} y={1006} h={328} kind="scribe" dir={1} armF={55}/>
  <PaintedLotus x={711} y={931} s={1.12} seed={seed+5}/>
  <path d="M186 625l72 80l-16 56l48 82M827 561l-44 91l31 90l-40 70M552 1018l65 49l-20 64" stroke={C.earth} opacity={.43} strokeWidth={5} fill="none"/>
  <Streaks x={160} y={497} w={760} h={630} seed={seed+18} color={C.cream} count={220} opacity={.52} maxLen={135} thick={4}/>
  <Dust f={f} x={190} y={520} w={700} h={550} count={24} seed={seed+25} opacity={.22}/>
</g>;

export const PRINT_SHOT_PRIMARY_SUBJECTS:Record<string,string>={
  "painting-dark/dark-corridor":"entrance-perspective",
  "painting-dark/one-flame":"lamp-macro",
  "painting-dark/tomb-painter":"working-artist",
  "painting-dark/mineral-pigments":"mineral-palette-overhead",
  "painting-dark/grinding-ochre":"mortar-pestle-macro",
  "painting-dark/colour-lamplight":"palette-and-painter",
  "painting-dark/brush-stone":"brush-contact-macro",
  "painting-dark/underworld":"painted-procession",
  "painting-dark/underground":"two-artist-tomb-interior",
  "painting-dark/eternity":"full-width-register",
  "painting-dark/lotus":"faded-lotus-closeup",
  "painting-dark/wall-survives":"worn-painted-fragment",
};

/** Each print shot is independently blocked, not the same scene repainted. */
const PrintContent:React.FC<{recipe:string;f:number;seed:number}>=({recipe,f,seed})=>{
 switch(recipe){
  case "painting-dark/dark-corridor":return <>
    <TombPortal seed={seed} f={f}/>
    <Painter x={875} h={204} f={f} seed={seed} brush={false}/>
    <ClayLamp x={692} y={1149} s={.42} f={f} id={"l"+seed}/>
  </>;
  case "painting-dark/one-flame":return <>
    <WornPlaster seed={seed} x={119} y={565} w={844} h={650}/>
    <WorkLight x={570} y={809} f={f} seed={seed} r={420}/>
    <ClayLamp x={535} y={1039} s={2.06} f={f} id={"l"+seed}/>
  </>;
  case "painting-dark/tomb-painter":return <>
    <WornPlaster seed={seed} x={327} y={465} w={600} h={710}/>
    <DecorativeWall seed={seed+10} figures={1} w={450}/>
    <Painter x={228} h={438} f={f} seed={seed} />
    <ClayLamp x={856} y={1156} s={.49} f={f} id={"l"+seed}/>
  </>;
  case "painting-dark/mineral-pigments":return <ColourSamples seed={seed} f={f}/>;
  case "painting-dark/grinding-ochre":return <>
    <Mortar seed={seed} f={f}/>
    <Dust f={f} x={180} y={580} w={735} h={590} count={39} seed={seed} opacity={.37}/>
  </>;
  case "painting-dark/colour-lamplight":return <>
    <WornPlaster seed={seed} x={110} y={448} w={870} h={760}/>
    <Worktable seed={seed}/>
    <Painter x={240} h={398} f={f} seed={seed} brush={false}/>
    <ClayLamp x={792} y={815} s={.84} f={f} id={"l"+seed}/>
  </>;
  case "painting-dark/brush-stone":return <BrushMacro seed={seed} f={f}/>;
  case "painting-dark/underworld":return <ProcessionalRegister seed={seed} f={f}/>;
  case "painting-dark/underground":return <UndergroundWork seed={seed} f={f}/>;
  case "painting-dark/eternity":return <>
    <WornPlaster seed={seed} x={92} y={441} w={900} h={757}/>
    <DecorativeWall seed={seed+5} figures={3} w={845}/>
    <Streaks x={122} y={508} w={833} h={653} seed={seed+9} count={155} color={C.paper} opacity={.37}/>
  </>;
  case "painting-dark/lotus":return <>
    <WornPlaster seed={seed} x={150} y={480} w={770} h={750} dark/>
    <PaintedLotus x={540} y={973} s={3.2} seed={seed}/>
    <path d="M218 559L264 629L242 720M808 612L777 691L804 758" stroke={C.earth} opacity={.4} strokeWidth={7} fill="none"/>
    <Streaks x={184} y={516} w={690} h={652} count={146} seed={seed+7} color={C.paper} opacity={.27}/>
  </>;
  case "painting-dark/wall-survives":return <AgedFragment seed={seed} f={f}/>;
  default:return null;
 }
};

export const CLASSIC_PRINT_PAINTING_IDS=[
  "painting-dark/dark-corridor",
  "painting-dark/one-flame",
  "painting-dark/tomb-painter",
  "painting-dark/mineral-pigments",
  "painting-dark/grinding-ochre",
  "painting-dark/colour-lamplight",
  "painting-dark/brush-stone",
  "painting-dark/underworld",
  "painting-dark/underground",
  "painting-dark/eternity",
  "painting-dark/lotus",
  "painting-dark/wall-survives",
] as const;

export const ClassicPrintPaintingShot:React.FC<Props>=({recipe,frame,duration,label,captionActive=false})=>{
  const seed=frameSeed(recipe);
  const progress=Math.max(0,Math.min(1,frame/Math.max(1,duration)));
  const camera=recipe.endsWith("dark-corridor")?"push-in":
    recipe.endsWith("underworld")?"pan-left":
    recipe.endsWith("underground")?"pull-back":
    recipe.endsWith("eternity")?"pan-right":
    recipe.endsWith("lotus")||recipe.endsWith("grinding-ochre")||recipe.endsWith("one-flame")?"push-in":"static";
  const move=cameraMove(camera,progress);
  const architectural=["tomb-painter","eternity"].some(x=>recipe.endsWith(x));
  return <g data-style="great-pyramid-print" data-illustration={recipe}
     data-primary-subject={PRINT_SHOT_PRIMARY_SUBJECTS[recipe]}>
    <Camera {...move} cy={950}>
      {architectural && <Backdrop env="tomb-wall" f={frame} seed={seed}/>}
      <PrintContent recipe={recipe} f={frame} seed={seed}/>
    </Camera>
    {!captionActive&&<Caption label={label} t={pulse(frame,0,10,duration-6,duration-1)} y={392}/>}
  </g>;
};
