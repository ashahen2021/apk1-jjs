/** Design review sheet: all five canonical 18-grid poses before deployment. */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { EgyptianTombRig, EGYPTIAN_RIG_GRID, type TombRigPose } from "./templates/EgyptianTombRig";
import { tombPalette as P, tombTheme as T } from "./theme/tombPaintingFlat";

const poses:TombRigPose[]=["standing","painting","grinding","carrying-lamp","walking"];
export const EgyptianRigPoseSheet:React.FC=()=>{
 const frame=useCurrentFrame(),p=frame/120;
 return <AbsoluteFill style={{backgroundColor:P.limestone}}>
   <svg viewBox="0 0 1920 1080" width="100%" height="100%">
     <rect x="0" y="0" width="1920" height="1080" fill={P.limestone}/>
     <text x="960" y="115" textAnchor="middle" fill={P.carbonBlack}
       fontFamily={T.typography.fontFamily} fontWeight="bold" fontSize="57">TOMB PAINTING FLAT · ARTICULATED FIGURE RIG</text>
     <path d="M100 135H1820" stroke={P.ochreRed} strokeWidth={T.outline.width}/>
     {poses.map((pose,i)=>{
       const x=190+i*385;
       return <g key={pose} data-pose={pose}>
         <rect x={x-166} y="185" width="332" height="690" fill={i%2?P.gypsumWhite:P.limestone}
           stroke={P.carbonBlack} strokeWidth={T.outline.width}/>
         <EgyptianTombRig x={x} y={790} scale={1.22} pose={pose} progress={p} sex={i===2?"woman":"man"}/>
         <path d={"M"+(x-150)+" 790H"+(x+150)} stroke={P.ochreRed} strokeWidth={T.outline.width}/>
         <text x={x} y="925" textAnchor="middle" fill={P.carbonBlack}
           fontFamily="Arial, sans-serif" fontSize="33" fontWeight="bold">{pose.toUpperCase().replace("-"," ")}</text>
       </g>;
     })}
     <text x="960" y="1023" textAnchor="middle" fill={P.carbonBlack} fontFamily="Arial, sans-serif"
       fontSize="27">18 squares from soles to hairline · profile head / frontal eye / frontal shoulders · separate animated joints</text>
   </svg>
 </AbsoluteFill>;
};
