/**
 * Canonical 18-square Egyptian painted figure, articulated SVG groups.
 * All colors and strokes come from Tomb Painting Flat — no generated assets.
 * y is the soles baseline; rigid torso, slow pivoting limbs, no bounce.
 */
import React from "react";
import { tombPalette as P, tombTheme as T, getOutlineProps } from "../theme/tombPaintingFlat";

export type TombRigPose = "standing" | "painting" | "grinding" | "carrying-lamp" | "walking";
export type TombRigSex = "man" | "woman";
export type TombRigProps = {
  x:number; y:number; scale?:number; sex?:TombRigSex;
  pose?:TombRigPose; progress?:number; facing?:1|-1;
};

const U=24, HEIGHT=18*U;
const edge=getOutlineProps();
const stroke={...edge,strokeLinejoin:"round" as const,strokeLinecap:"round" as const};
const point=(a:number)=>Number(a.toFixed(2));
const limbAngle=(pose:TombRigPose,progress:number) => {
 const sway=Math.sin(progress*2*Math.PI);
 switch(pose){
  case "painting":return {rightUpper:-20+8*sway,rightFore:-22+9*sway,leftUpper:-4,leftFore:9,frontLeg:0,backLeg:0};
  case "grinding":return {rightUpper:12+8*sway,rightFore:20+6*sway,leftUpper:-8,leftFore:-22+6*sway,frontLeg:0,backLeg:0};
  case "carrying-lamp":return {rightUpper:-21+4*sway,rightFore:-25,leftUpper:1,leftFore:0,frontLeg:0,backLeg:0};
  case "walking":return {rightUpper:8*sway,rightFore:-10,leftUpper:-8*sway,leftFore:8,frontLeg:12*sway,backLeg:-12*sway};
  default:return {rightUpper:-2,rightFore:0,leftUpper:2,leftFore:0,frontLeg:0,backLeg:0};
 }
};

/** The body measures precisely 18 canonical squares from soles to hairline. */
export const EgyptianTombRig: React.FC<TombRigProps> = ({
 x,y,scale=1,sex="man",pose="standing",progress=0,facing=1,
})=>{
 const skin=sex==="man"?P.ochreRed:P.yellowOchre;
 const linen=P.gypsumWhite;
 const angles=limbAngle(pose,progress);
 const garment=sex==="woman";
 const g=(angle:number,cx:number,cy:number)=>"rotate("+point(angle)+" "+cx+" "+cy+")";
 return <g data-rig="egyptian-18-square" data-pose={pose} data-sex={sex}
     transform={"translate("+x+" "+y+") scale("+(scale*facing)+" "+scale+")"}>
   <g data-part="leg-back" transform={g(angles.backLeg,-13,-151)}>
    <path d="M-30 -158L-10 -158L-7 -76L-5 -9L-24 -8L-35 -68Z" fill={skin} {...stroke}/>
    <path d="M-25 -11L-5 -12L8 -1Q-11 3 -50 2Z" fill={skin} {...stroke}/>
   </g>
   <g data-part="leg-front" transform={g(angles.frontLeg,18,-151)}>
    <path d="M6 -159L33 -157L37 -87L37 -8L17 -8L7 -77Z" fill={skin} {...stroke}/>
    <path d="M20 -9L38 -9L67 -2Q69 4 55 4H13Z" fill={skin} {...stroke}/>
   </g>
   <g data-part="hips">
     <path d={garment?"M-44 -225Q0 -233 47 -220L41 -61L-38 -63Z":"M-42 -204Q0 -214 42 -201L48 -143L-43 -139Z"} fill={linen} {...stroke}/>
     <path d={garment?"M-38 -87H41":"M-42 -167H46"} fill="none" stroke={P.carbonBlack} strokeWidth={T.outline.width}/>
   </g>
   <g data-part="torso">
     {/* frontal shoulders paired with profile hips */}
     <path d="M-44 -316Q-30 -335 0 -330Q29 -335 44 -315L43 -218Q14 -210 0 -212Q-20 -210 -43 -219Z" fill={garment?linen:skin} {...stroke}/>
     {garment?<path d="M-37 -284H36M-32 -253H33" fill="none" stroke={P.yellowOchre} strokeWidth={T.outline.width}/>:
       <path d="M-43 -225H43" fill="none" stroke={P.gypsumWhite} strokeWidth={T.outline.width}/>}
     <path d="M-8 -352V-322H11V-354Z" fill={skin} {...stroke}/>
   </g>
   <g data-part="upper-arm-left" transform={g(angles.leftUpper,-39,-305)}>
     <path d="M-39 -309Q-52 -306 -53 -286L-56 -242L-40 -239L-22 -289L-27 -309Z" fill={skin} {...stroke}/>
     <g data-part="forearm-left" transform={g(angles.leftFore,-47,-242)}>
       <path d="M-56 -245L-40 -240L-45 -170L-63 -175Z" fill={skin} {...stroke}/>
       <g data-part="hand-left"><path d="M-63 -175Q-56 -154 -45 -166L-45 -178Z" fill={skin} {...stroke}/></g>
     </g>
   </g>
   <g data-part="upper-arm-right" transform={g(angles.rightUpper,39,-305)}>
     <path d="M26 -308Q39 -312 48 -288L59 -242L42 -238L27 -281Z" fill={skin} {...stroke}/>
     <g data-part="forearm-right" transform={g(angles.rightFore,50,-241)}>
       <path d="M43 -246L61 -240L66 -168L47 -163Z" fill={skin} {...stroke}/>
       <g data-part="hand-right"><path d="M47 -165Q51 -147 66 -151L67 -168Z" fill={skin} {...stroke}/></g>
       {pose==="painting" && <g data-prop="reed-brush">
         <path d="M59 -160L104 -294" fill="none" stroke={P.carbonBlack} strokeWidth={T.outline.width}/>
         <path d="M99 -301L111 -322L109 -289Z" fill={P.egyptianBlue} {...stroke}/>
       </g>}
       {pose==="carrying-lamp" && <g data-prop="lamp">
         <path d="M45 -160L147 -160Q142 -136 96 -126Q54 -134 45 -160Z" fill={P.yellowOchre} {...stroke}/>
         <path d="M90 -166Q67 -188 85 -214Q113 -192 101 -171Z" fill={P.ochreRed} {...stroke}/>
       </g>}
       {pose==="grinding" && <g data-prop="grinding-stone">
         <path d="M55 -152Q92 -167 130 -157L121 -138L61 -138Z" fill={P.ochreRed} {...stroke}/>
         <path d="M82 -152L106 -182L123 -170L103 -138Z" fill={P.limestone} {...stroke}/>
       </g>}
     </g>
   </g>
   <g data-part="head">
     {/* male or female black wig framing a small adult profile, eye is drawn frontally */}
     <path d="M-23 -424Q10 -440 36 -419L39 -367L20 -352L-20 -369Z" fill={P.carbonBlack} {...stroke}/>
     <path d="M-18 -415Q14 -427 32 -406L33 -385L49 -371L36 -361Q40 -336 17 -335L-15 -357Z" fill={skin} {...stroke}/>
     {/* pronounced profile nose facing right */}
     <path d="M32 -386L49 -372L36 -362" fill="none" stroke={P.carbonBlack} strokeWidth={T.outline.width}/>
     {/* eye shown frontal almond-shaped, not a side slit */}
     <path d="M0 -394Q13 -407 26 -394Q13 -383 0 -394Z" fill={linen} {...stroke}/>
     <circle cx="14" cy="-394" r="3.5" fill={P.carbonBlack}/>
     <path d="M23 -348Q29 -347 34 -351" fill="none" stroke={P.carbonBlack} strokeWidth={T.outline.width}/>
     {garment&&<path d="M-25 -419Q-37 -406 -34 -323L-18 -322L-15 -409Z" fill={P.carbonBlack} {...stroke}/>}
   </g>
 </g>;
};
export const EGYPTIAN_RIG_GRID={squares:18,unit:U,height:HEIGHT} as const;
