import React from "react";
import { tombTheme as T, tombPalette as P, getSceneLightingMode, getSceneBackground, getGlowProps, getOutlineProps, stoneNoisePath } from "../theme/tombPaintingFlat";
export type PaintMode = "day" | "tomb";
export const Ink: React.FC<{children:React.ReactNode}> = ({children})=><g {...getOutlineProps()}>{children}</g>;
export const TombPerson: React.FC<{x:number;y:number;scale?:number;pose?:"paint"|"haul"|"carry"|"scribe"|"stand";progress?:number}> = ({x,y,scale=1,pose="stand",progress=0})=>{
 const pull=pose==="haul"||pose==="carry",hand=pose==="paint"||pose==="scribe";
 const reach=hand ? -60-12*Math.sin(progress*6) : pull ? -12 : 20;
 return <g transform={"translate("+x+" "+y+") scale("+scale+")"}>
   <Ink>
     <path d="M-24 -192L-34 -46L-13 0L12 -2L18 -85L31 -16L61 3L83 -9L49 -119L45 -188Z" fill={P.yellowOchre}/>
     <path d="M-45 -283Q-67 -325 -50 -373Q-34 -423 17 -425Q73 -422 79 -367L106 -346L80 -322Q69 -290 39 -276Z" fill={P.yellowOchre}/>
     <path d="M-49 -378Q-60 -421 -17 -445Q45 -462 78 -411Q88 -397 85 -383Q24 -413 -49 -378Z" fill={P.carbonBlack}/>
     <path d="M-9 -362Q22 -374 48 -359Q32 -341 2 -345Z" fill={P.gypsumWhite}/>
     <path d="M15 -362L24 -345" fill="none"/>
     <path d="M63 -323Q75 -313 84 -324" fill="none"/>
     <path d="M-53 -278Q-10 -296 34 -286L54 -178Q5 -152 -64 -180Z" fill={P.ochreRed}/>
     <path d="M-64 -183Q-10 -161 54 -182L67 -61Q-5 -43 -78 -63Z" fill={P.gypsumWhite}/>
     <path d="M-65 -177H56M-61 -143H57" fill="none"/>
     <path d="M-30 -278Q-86 -226 -91 -170Q-104 -126 -85 -90L-61 -102Q-63 -141 -57 -158L8 -214Z" fill={P.yellowOchre}/>
     <path d={hand ? "M36 -270Q88 -277 92 -232L139 "+reach+"L119 "+(reach+18)+"L53 -190L17 -225Z" :
       pull ? "M37 -270Q87 -284 102 -235L147 -215L158 -188L136 -171L76 -196L24 -223Z":
              "M38 -270Q81 -278 90 -239L98 -115L67 -110L53 -195L15 -224Z"} fill={P.yellowOchre}/>
     <path d="M-50 -60L-46 36L-6 42L10 -45M29 -49L45 41L85 47L74 -55" fill={P.yellowOchre}/>
     <path d="M-49 33Q-79 28 -83 51H-9L-4 42M47 38Q72 28 95 54H38Z" fill={P.carbonBlack}/>
   </Ink>
   <path d="M-64 -190Q-8 -170 54 -190" stroke={P.egyptianBlue} strokeWidth={T.outline.width} fill="none"/>
 </g>;
};

export const TombSun:React.FC<{x?:number;y?:number}> = ({x=790,y=540})=><Ink>
 <circle cx={x} cy={y} r="105" fill={P.yellowOchre}/>
 <path d={"M"+(x-105)+" "+(y+20)+"h210"} stroke={P.carbonBlack} fill="none" />
</Ink>;

export const TombPyramid:React.FC<{x?:number;floor?:number;height?:number}> = ({x=460,floor=1520,height=680})=><Ink>
 <path d={"M"+(x-400)+" "+floor+"L"+x+" "+(floor-height)+"L"+(x+455)+" "+floor+"Z"} fill={P.yellowOchre}/>
 <path d={"M"+x+" "+(floor-height)+"L"+(x+455)+" "+floor+"H"+(x+200)+"Z"} fill={P.limestone}/>
 <path d={"M"+(x-335)+" "+(floor-120)+"H"+(x+380)+"M"+(x-260)+" "+(floor-245)+"H"+(x+298)+"M"+(x-180)+" "+(floor-375)+"H"+(x+215)} fill="none"/>
 </Ink>;

export const TombBlock:React.FC<{x:number;y:number;scale?:number}> = ({x,y,scale=1})=><g transform={"translate("+x+" "+y+") scale("+scale+")"}><Ink>
 <path d="M0 32L55 0H310L268 37Z" fill={P.gypsumWhite}/>
 <path d="M268 37L310 0V185L268 225Z" fill={P.yellowOchre}/>
 <path d="M0 32H268V225H0Z" fill={P.limestone}/>
 <path d="M20 180H240" fill="none"/>
 </Ink></g>;

export const TombRamp:React.FC<{height?:number}> = ({height=470})=><Ink>
 <path d={"M-40 1640L780 "+(1640-height)+"L780 "+(1710-height)+"L-40 1790Z"} fill={P.ochreRed}/>
 <path d={"M-40 1612L780 "+(1612-height)} fill="none" strokeWidth={T.outline.width}/>
 <path d="M0 1760H1080" fill="none"/>
 </Ink>;

export const TombRiver:React.FC<{f?:number}> = ({f=0})=><g>
 <path d="M0 1430Q190 1380 370 1430T740 1430T1080 1430V1920H0Z" fill={P.egyptianBlue}/>
 <Ink><path d={"M0 1530Q220 "+(1490+Math.sin(f/10)*12)+" 440 1530T880 1530T1320 1530M-50 1730Q200 1680 440 1730T900 1730T1250 1730"} fill="none" stroke={P.gypsumWhite}/></Ink>
 </g>;

export const TombBoat:React.FC<{f?:number}> = ({f=0})=><g transform={"translate(0 "+(Math.sin(f/10)*9)+")"}>
 <Ink>
 <path d="M120 1460Q545 1545 970 1450Q900 1620 620 1650H360Q175 1620 120 1460Z" fill={P.ochreRed}/>
 <path d="M550 1460V670H585V1470Z" fill={P.ochreRed}/>
 <path d="M585 710Q870 930 775 1330H585Z" fill={P.gypsumWhite}/>
 <path d="M250 1420H850" fill="none"/>
 </Ink>
 <TombBlock x={260} y={1260} scale={.45}/><TombBlock x={550} y={1270} scale={.45}/>
 </g>;

export const TombWall:React.FC = ()=><g>
 <rect x="0" y="320" width="1080" height="1600" fill={P.limestone}/>
 <Ink>
 <path d="M0 435H1080M0 1460H1080M0 1550H1080" fill="none" stroke={P.ochreRed} strokeWidth={T.outline.width}/>
 <path d="M0 650H1080M0 940H1080M0 1230H1080" fill="none" stroke={P.yellowOchre}/>
 <path d="M70 500H1010V1370H70Z" fill="none" stroke={P.malachiteGreen}/>
 </Ink>
 </g>;

export const TombLamp:React.FC<{x?:number;y?:number;f?:number}> = ({x=540,y=1200,f=0})=><g transform={"translate("+x+" "+y+")"}>
 <Ink>
 <path d="M-88 12Q-84 -52 -12 -54Q80 -50 92 12Q0 49 -88 12Z" fill={P.yellowOchre}/>
 <path d="M-15 -35Q-56 -138 -6 -188Q46 -131 15 -72Q43 -101 43 -138Q82 -83 15 -34Z" fill={P.ochreRed} transform={"scale("+(1+Math.sin(f/5)*.04)+")"}/>
 <path d="M-5 -42Q-16 -109 0 -130Q22 -84 8 -46Z" fill={P.gypsumWhite}/>
 </Ink></g>;

export const TombPaletteTable:React.FC = ()=><g>
 <Ink><rect x="100" y="1350" width="890" height="86" fill={P.ochreRed}/>
 <path d="M165 1436V1630H218V1436M862 1436V1630H920V1436" fill={P.yellowOchre}/>
 {([P.yellowOchre,P.ochreRed,P.egyptianBlue,P.malachiteGreen] as string[]).map((c,i)=><g key={i}>
 <ellipse cx={240+i*205} cy={1345} rx={80} ry={37} fill={P.gypsumWhite}/>
 <path d={"M"+(160+i*205)+" 1344Q"+(240+i*205)+" 1410 "+(320+i*205)+" 1344Z"} fill={c}/>
 </g>)}
 </Ink></g>;

export const TombPapyrus:React.FC<{stage?:number;f?:number}> = ({stage=0,f=0})=><g>
 {stage===0 ? <><TombRiver f={f}/><Ink>{[100,260,410,560,725,875,1010].map((x,i)=><g key={i} transform={"rotate("+(Math.sin(f/18+i)*3)+" "+x+" 1450)"}>
 <path d={"M"+x+" 1480Q"+(x-30)+" 920 "+x+" 480"} fill="none" stroke={P.malachiteGreen} strokeWidth={T.outline.width}/>
 <path d={"M"+(x-12)+" 840Q"+(x-122)+" 750 "+(x-95)+" 660Q"+(x+70)+" 680 "+(x-12)+" 840Z"} fill={P.malachiteGreen}/>
 <path d={"M"+x+" 670Q"+(x+120)+" 520 "+(x+55)+" 470Q"+(x-45)+" 500 "+x+" 670Z"} fill={P.malachiteGreen}/>
 </g>)}</Ink></> : <Ink>
 <rect x="100" y="1020" width="880" height="570" fill={P.yellowOchre}/>
 {Array.from({length:6},(_,i)=><rect key={i} x={170+i*118} y={1070} width={90} height={380} fill={P.gypsumWhite} stroke={P.carbonBlack}/>)}
 {stage>=2 && Array.from({length:4},(_,i)=><rect key={"h"+i} x={155} y={1110+i*96} width={770} height={67} fill={P.limestone} stroke={P.carbonBlack}/>)}
 {stage>=3 && <rect x="120" y="1150" width="845" height="190" fill={P.ochreRed}/>}
 </Ink>}
 </g>;

export const TombSceneStyle:React.FC<{mode:PaintMode;lightX?:number;lightY?:number;children:React.ReactNode}> = ({mode,lightX=T.glow.centerX,lightY=T.glow.centerY,children})=>{
 const glow=getGlowProps(mode,lightX,lightY);
 const gradientId="tomb-painting-flat-light";
 return <g>
   <rect x="0" y="0" width={T.width} height={T.height} fill={getSceneBackground(mode)}/>
   {children}
   {mode==="tomb" && <g>
     <defs><radialGradient id={gradientId} gradientUnits="userSpaceOnUse" cx={glow.cx} cy={glow.cy} r={glow.radius}>
       <stop offset="0%" stopColor={P.tombDark} stopOpacity={T.glow.innerDarkness}/>
       <stop offset="50%" stopColor={P.tombDark} stopOpacity=".25"/>
       <stop offset="100%" stopColor={P.tombDark} stopOpacity={T.glow.outerDarkness}/>
     </radialGradient></defs>
     <rect x="0" y="0" width={T.width} height={T.height} fill={P.tombDark} opacity={T.glow.outerDarkness}/>
     <circle cx={glow.cx} cy={glow.cy} r={glow.radius} fill={"url(#"+gradientId+")"}/>
   </g>}
   <path d={stoneNoisePath()} fill={P.carbonBlack} opacity={T.texture.opacity} stroke="none"/>
 </g>;
};
export const TombSceneTitle:React.FC<{title:string;mode:PaintMode}> = ({title,mode})=>{
 const color=mode==="tomb"?P.gypsumWhite:P.carbonBlack;
 const longest=Math.max(1,title.length);
 const font=Math.min(T.typography.titleSize, 920/(longest*.64));
 return <g>
 <text x="540" y={T.typography.top} textAnchor="middle" fontSize={font} fontWeight="800" letterSpacing=".035em" fontFamily="Arial, sans-serif" fill={color}>{title.toUpperCase()}</text>
 <path d={"M210 "+(T.typography.top+33)+"H870"} stroke={mode==="tomb"?P.yellowOchre:P.ochreRed} strokeWidth={T.outline.width}/>
 </g>;
};
export { getSceneLightingMode };