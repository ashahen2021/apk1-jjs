/** Bold kinetic V1 captions, restricted to Tomb Painting Flat theme colors. */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { FormatId } from "../../../shared/catalog.ts";
import type { Cue } from "../../../shared/schema.ts";
import { tombPalette as P, tombTheme as T } from "../theme/tombPaintingFlat";

export const Shorts15Captions: React.FC<{cues:Cue[];format:FormatId}> = ({cues,format}) => {
 const frame=useCurrentFrame();
 const cue=cues.find(c=>frame>=c.from&&frame<c.to);
 if(!cue)return null;
 const words=cue.text.trim().split(/\s+/).filter(Boolean);
 if(!words.length)return null;
 const idx=Math.min(words.length-1,Math.max(0,Math.floor((frame-cue.from)/Math.max(1,cue.to-cue.from)*words.length)));
 const vertical=format==="9:16",fontSize=vertical?58:44;
 const scale=interpolate(frame,[cue.from,cue.from+4],[.96,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
 return <AbsoluteFill style={{pointerEvents:"none",alignItems:"center",justifyContent:"flex-end",paddingBottom:vertical?350:60}}>
   <div style={{
     display:"block",maxWidth:vertical?"89%":"78%",padding:"17px 23px",
     background:P.tombDark,border:"5px solid "+P.carbonBlack,
     color:P.gypsumWhite,textAlign:"center",fontFamily:"Arial, sans-serif",
     fontSize,fontWeight:900,lineHeight:1.18,letterSpacing:".015em",
     transform:"scale("+scale+")",overflowWrap:"break-word"
   }}>
     {words.map((w,i)=><span key={i} style={{display:"inline-block",marginRight:".24em",color:i===idx?P.yellowOchre:P.gypsumWhite}}>{w}</span>)}
   </div>
 </AbsoluteFill>;
};