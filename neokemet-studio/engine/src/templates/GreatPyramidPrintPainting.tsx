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

/** Exactly twelve author-directed scenes, all visibly distinct under classic print art. */
const PrintContent:React.FC<{recipe:string;f:number;seed:number}>=({recipe,f,seed})=>{
  switch(recipe){
    case "painting-dark/dark-corridor":return <><TombPortal seed={seed} f={f}/><Painter x={870} h={230} f={f} seed={seed}/><ClayLamp x={690} y={1100} f={f} s={.5} id={"l"+seed}/></>;
    case "painting-dark/one-flame":return <><RRect x={150} y={600} w={780} h={600} seed={seed} fill={C.sand}/><Streaks x={167} y={630} w={745} h={520} seed={seed+1} count={120} color={C.paper} opacity={.38}/><ClayLamp x={550} y={920} s={2.25} f={f} id={"l"+seed}/><Dust f={f} x={240} y={530} w={630} h={630} count={45} seed={seed} opacity={.45}/></>;
    case "painting-dark/tomb-painter":return <><DecorativeWall seed={seed} figures={1}/><Painter x={250} h={370} f={f} seed={seed}/><ClayLamp x={820} y={1155} s={.55} f={f} id={"l"+seed}/></>;
    case "painting-dark/mineral-pigments":return <><Worktable seed={seed} large/><Stipple x={160} y={500} w={745} h={430} count={180} seed={seed} color={C.gold} opacity={.15}/><PaintedLotus x={540} y={740} s={.9} seed={seed}/></>;
    case "painting-dark/grinding-ochre":return <><Mortar seed={seed} f={f}/><Dust f={f} x={180} y={600} w={750} h={580} count={34} seed={seed} opacity={.45}/></>;
    case "painting-dark/colour-lamplight":return <><DecorativeWall seed={seed} figures={0}/><Worktable seed={seed}/><Painter x={290} h={330} f={f} seed={seed}/><ClayLamp x={840} y={925} s={.72} f={f} id={"l"+seed}/></>;
    case "painting-dark/brush-stone":return <><DecorativeWall seed={seed} figures={1} w={780}/><Painter x={810} h={430} f={f} seed={seed} dir={-1}/><path d="M565 818Q590 795 626 818" fill="none" stroke={C.terra} strokeWidth="13" strokeLinecap="round"/></>;
    case "painting-dark/underworld":return <><DecorativeWall seed={seed} figures={2}/><Painter x={900} h={240} f={f} seed={seed}/><Dust f={f} x={210} y={555} w={685} h={590} count={35} seed={seed}/></>;
    case "painting-dark/underground":return <><TombPortal seed={seed} f={f} open/><Painter x={334} h={320} f={f} seed={seed}/><ClayLamp x={719} y={1135} s={.63} f={f} id={"l"+seed}/></>;
    case "painting-dark/eternity":return <><DecorativeWall seed={seed} figures={3} w={870}/><Streaks x={120} y={540} w={840} h={640} count={165} seed={seed} color={C.paper} opacity={.35}/></>;
    case "painting-dark/lotus":return <><RRect x={150} y={500} w={780} h={700} seed={seed} fill={C.sand} amp={4}/><Streaks x={165} y={525} w={750} h={650} seed={seed+2} count={165} color={C.paper} opacity={.5}/><PaintedLotus x={540} y={910} s={2.8} seed={seed}/></>;
    case "painting-dark/wall-survives":return <><DecorativeWall seed={seed} figures={2} w={880}/><Streaks x={130} y={580} w={820} h={560} seed={seed+1} count={210} color={C.cream} opacity={.42}/><Stipple x={150} y={580} w={800} h={540} seed={seed+9} count={220} color={C.earth} opacity={.28}/></>;
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
  const move=cameraMove(recipe.includes("grinding")||recipe.includes("lotus")?"push-in":"static",progress);
  return <g data-style="great-pyramid-print" data-illustration={recipe}>
    <Camera {...move} cy={950}>
      <Backdrop env="tomb-wall" f={frame} seed={seed}/>
      <PrintContent recipe={recipe} f={frame} seed={seed}/>
    </Camera>
    {!captionActive&&<Caption label={label} t={pulse(frame,0,10,duration-6,duration-1)} y={392}/>}
  </g>;
};
