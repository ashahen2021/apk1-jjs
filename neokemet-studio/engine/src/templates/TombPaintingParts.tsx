import React from "react";
import { EgyptianTombRig, type TombRigPose, type TombRigSex } from "./EgyptianTombRig";
import { HieroglyphWallText } from "./HieroglyphWall";
import { EgyptianOilLamp } from "./EgyptianOilLamp";
import { tombTheme as T, tombPalette as P, getSceneLightingMode, getSceneBackground, getGlowProps, getOutlineProps, stoneNoisePath } from "../theme/tombPaintingFlat";
export type PaintMode = "day" | "tomb";
export const Ink: React.FC<{children:React.ReactNode}> = ({children})=><g {...getOutlineProps()}>{children}</g>;

export const TombPerson:React.FC<{x:number;y:number;scale?:number;pose?:TombRigPose|"paint"|"haul"|"carry"|"scribe"|"stand";progress?:number;sex?:TombRigSex}> = ({x,y,scale=1,pose="stand",progress=0,sex="man"})=>{
 const roles:Record<string,TombRigPose>={stand:"standing",paint:"painting",haul:"walking",carry:"carrying-lamp",scribe:"painting"};
 const role=(roles[pose]??pose) as TombRigPose;
 return <EgyptianTombRig x={x} y={Math.min(y,T.composition.groundLineY)} scale={scale} pose={role} sex={sex} progress={progress}/>;
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

export const TombRamp:React.FC<{height?:number}> = ({height=470})=>{
 const y=T.composition.groundLineY;
 return <Ink>
  <path d={"M-40 "+y+"L780 "+(y-height)+"L780 "+(y-height+70)+"L-40 "+(y+110)+"Z"} fill={P.ochreRed}/>
  <path d={"M-40 "+(y-28)+"L780 "+(y-height-28)} fill="none" strokeWidth={T.outline.width}/>
 </Ink>;
};

export const TombRiver:React.FC<{f?:number}> = ({f=0})=><g>
 <path d="M0 1120Q190 1070 370 1120T740 1120T1080 1120V1920H0Z" fill={P.egyptianBlue}/>
 <Ink><path d={"M0 1260Q220 "+(1220+Math.sin(f/10)*12)+" 440 1260T880 1260T1320 1260M-50 1500Q200 1450 440 1500T900 1500T1250 1500"} fill="none" stroke={P.gypsumWhite}/></Ink>
 </g>;

export const TombBoat:React.FC<{f?:number}> = ({f=0})=><g transform={"translate(0 "+(-320+Math.sin(f/10)*9)+")"}>
 <Ink>
 <path d="M120 1460Q545 1545 970 1450Q900 1620 620 1650H360Q175 1620 120 1460Z" fill={P.ochreRed}/>
 <path d="M550 1460V670H585V1470Z" fill={P.ochreRed}/>
 <path d="M585 710Q870 930 775 1330H585Z" fill={P.gypsumWhite}/>
 <path d="M250 1420H850" fill="none"/>
 </Ink>
 <TombBlock x={260} y={1260} scale={.45}/><TombBlock x={550} y={1270} scale={.45}/>
 </g>;

export const TombWall:React.FC = ()=><g>
 <rect x="0" y="0" width={T.width} height={T.height} fill={P.limestone}/>
 {/* Stone courses remain full-bleed in both YouTube UI safe zones.
     These are masonry divisions, not invented hieroglyphs. */}
 <g stroke={P.ochreRed} strokeWidth={T.outline.width} fill="none" opacity=".65">
  <path d="M0 90H1080M0 200H1080M0 315H1080M0 1580H1080M0 1720H1080M0 1850H1080"/>
  <path d="M200 0V90M670 90V200M300 200V315M780 1580V1720M340 1720V1850M700 1850V1920"/>
 </g>
 <Ink>
 <path d="M0 435H1080M0 1460H1080M0 1550H1080" fill="none" stroke={P.ochreRed} strokeWidth={T.outline.width}/>
 <path d="M0 650H1080M0 940H1080M0 1230H1080" fill="none" stroke={P.yellowOchre}/>
 {/* Gardiner signs are illustrative examples, never invented pole/eye glyphs. */}
 </Ink>
 <HieroglyphWallText x={710} y={465} scale={.88}/>
 </g>;

/** Consistent historical oil-lamp shape in every V1 illustration. */
export const TombLamp:React.FC<{x?:number;y?:number;f?:number;variant?:"bowl"|"on-stand"}> = ({x=540,y=1040,f=0,variant="bowl"})=>
 <EgyptianOilLamp x={x} y={y} flameFrame={f} variant={variant} scale={1}/>;

export const TombPaletteTable:React.FC = ()=><g transform="translate(0 -385)">
 <Ink><rect x="100" y="1350" width="890" height="86" fill={P.ochreRed}/>
 <path d="M165 1436V1630H218V1436M862 1436V1630H920V1436" fill={P.yellowOchre}/>
 {([P.yellowOchre,P.ochreRed,P.egyptianBlue,P.malachiteGreen] as string[]).map((c,i)=><g key={i}>
 <ellipse cx={240+i*205} cy={1345} rx={80} ry={37} fill={P.gypsumWhite}/>
 <path d={"M"+(160+i*205)+" 1344Q"+(240+i*205)+" 1410 "+(320+i*205)+" 1344Z"} fill={c}/>
 </g>)}
 </Ink></g>;

export const TombPapyrus:React.FC<{stage?:number;f?:number}> = ({stage=0,f=0})=><g>
 {stage===0 ? <><TombRiver f={f}/><Ink>{[100,260,410,560,725,875,1010].map((x,i)=><g key={i} transform={"rotate("+(Math.sin(f/18+i)*3)+" "+x+" 1450)"}>
 <path d={"M"+x+" 1220Q"+(x-30)+" 920 "+x+" 480"} fill="none" stroke={P.malachiteGreen} strokeWidth={T.outline.width}/>
 <path d={"M"+(x-12)+" 840Q"+(x-122)+" 750 "+(x-95)+" 660Q"+(x+70)+" 680 "+(x-12)+" 840Z"} fill={P.malachiteGreen}/>
 <path d={"M"+x+" 670Q"+(x+120)+" 520 "+(x+55)+" 470Q"+(x-45)+" 500 "+x+" 670Z"} fill={P.malachiteGreen}/>
 </g>)}</Ink></> : <g transform="translate(0 -270)"><Ink>
 <rect x="100" y="1020" width="880" height="570" fill={P.yellowOchre}/>
 {Array.from({length:6},(_,i)=><rect key={i} x={170+i*118} y={1070} width={90} height={380} fill={P.gypsumWhite} stroke={P.carbonBlack}/>)}
 {stage>=2 && Array.from({length:4},(_,i)=><rect key={"h"+i} x={155} y={1110+i*96} width={770} height={67} fill={P.limestone} stroke={P.carbonBlack}/>)}
 {stage>=3 && <rect x="120" y="1150" width="845" height="190" fill={P.ochreRed}/>}
 </Ink></g>}
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
     <rect x="0" y="0" width={T.width} height={T.height} fill={"url(#"+gradientId+")"}/>
   </g>}
   <path d={stoneNoisePath()} fill={P.carbonBlack} opacity={T.texture.opacity} stroke="none"/>
 </g>;
};
/** Tomb murals are read in horizontal registers; action stands on an ochre-red ground line. */
export const TombRegister:React.FC = ()=> <g data-layout="register" fill="none">
 <path d={"M0 "+T.composition.groundLineY+"H"+T.width} stroke={P.ochreRed} strokeWidth={T.outline.width}/>
 <path d={"M0 "+(T.composition.groundLineY+15)+"H"+T.width} stroke={P.carbonBlack} strokeWidth={T.outline.width}/>
</g>;
/** Restrained push-in: 3–6% overall, no bounce and no scaling of titles/captions. */
export const TombCameraPush:React.FC<{frame:number;duration:number;children:React.ReactNode;strength?:number}> = ({frame,duration,children,strength=.045})=>{
 const alpha=Math.min(1,Math.max(0,frame/Math.max(1,duration-1)));
 const amount=Math.min(T.pacing.pushInMax,Math.max(T.pacing.pushInMin,strength));
 const scale=1+alpha*amount;
 return <g transform={"translate(540 "+T.composition.groundLineY+") scale("+scale.toFixed(5)+") translate(-540 -"+T.composition.groundLineY+")"}>{children}</g>;
};
export const TombSceneTitle:React.FC<{title:string;mode:PaintMode;visible?:boolean}> = ({title,mode,visible=true})=>{
 if(!visible || !title.trim())return null;
 const text=title.trim().toUpperCase();
 const longest=text.length;
 const size=Math.min(T.typography.titleMaxSize,Math.max(T.typography.titleMinSize,
  T.typography.labelMaxWidth/Math.max(1,longest*.64)));
 // Large serif text, wrapped onto two lines when necessary rather than shrunk below 72px.
 const words=text.split(/\s+/);
 const line1:string[]=[],line2:string[]=[];
 for(const word of words) {
   if(!line1.length || (line1.join(" ").length+word.length+1)<=18)line1.push(word);
   else line2.push(word);
 }
 const lines=line2.length?[line1.join(" "),line2.join(" ")]:[text];
 const labelFont=Math.max(T.typography.titleMinSize,Math.min(size,T.typography.labelMaxWidth/(Math.max(1,...lines.map(l=>l.length))*.6)));
 const baseline=lines.length===1?T.typography.titleBaseline:T.typography.titleBaseline-40;
 return <g data-layout="title-band" data-safe-zone="1250-1450">
   <rect x="0" y={T.typography.bandTop} width={T.width} height={T.typography.bandBottom-T.typography.bandTop} fill={P.carbonBlack}/>
   {lines.map((line,i)=><text key={i} x={540} y={baseline+i*82} textAnchor="middle"
     fontSize={Math.max(58,labelFont)} fontFamily={T.typography.fontFamily} fontWeight={700} fill={P.gypsumWhite}>
     {line}
   </text>)}
   <path d={"M0 "+(T.typography.bandTop-7)+"H"+T.width} stroke={P.ochreRed} strokeWidth={T.outline.width}/>
 </g>;
};
export { getSceneLightingMode };
