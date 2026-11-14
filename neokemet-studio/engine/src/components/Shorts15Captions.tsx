/**
 * Word-by-word captions for Tomb Painting Flat, entirely inside 1240–1440 px.
 * Exact timing when wordCues come from verified alignment; otherwise they are
 * explicitly estimated within the measured voice span by shared/wordTiming.ts.
 * Legacy Shorts continue using their prior cue styling.
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { FormatId } from "../../../shared/catalog.ts";
import type { Cue, WordCue } from "../../../shared/schema.ts";
import { tombPalette as P, tombTheme as T } from "../theme/tombPaintingFlat";

const V1WordBand:React.FC<{words:WordCue[]}> = ({words})=>{
 const frame=useCurrentFrame();
 const index=words.findIndex(w=>frame>=w.from && frame<w.to);
 if(index<0)return null;
 const windowStart=Math.floor(index/4)*4;
 const slice=words.slice(windowStart,windowStart+4);
 return <AbsoluteFill style={{pointerEvents:"none"}}>
   <div data-layout="word-captions" style={{
     position:"absolute",top:T.typography.bandTop,left:0,width:"100%",
     height:T.typography.bandBottom-T.typography.bandTop,
     backgroundColor:P.carbonBlack,borderTop:T.outline.width+"px solid "+P.ochreRed,
     display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
     padding:"14px 65px",boxSizing:"border-box",
   }}>
     <div style={{width:"100%",fontSize:64,lineHeight:1.12,fontWeight:800,fontFamily:"Arial, sans-serif",
       color:P.gypsumWhite,textAlign:"center",textWrap:"balance"}}>
       {slice.map((w,k)=><span key={k} style={{
         display:"inline-block",marginRight:".23em",
         color:windowStart+k===index?P.yellowOchre:P.gypsumWhite,
       }}>{w.text}</span>)}
     </div>
   </div>
 </AbsoluteFill>;
};

const LegacyCaptions:React.FC<{cues:Cue[];format:FormatId}> = ({cues,format})=>{
 const frame=useCurrentFrame();
 const cue=cues.find(c=>frame>=c.from&&frame<c.to);
 if(!cue)return null;
 const words=cue.text.trim().split(/\s+/).filter(Boolean);
 if(!words.length)return null;
 const index=Math.min(words.length-1,Math.max(0,Math.floor((frame-cue.from)/Math.max(1,cue.to-cue.from)*words.length)));
 const scale=interpolate(frame,[cue.from,cue.from+4],[.96,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
 const vertical=format==="9:16";
 return <AbsoluteFill style={{pointerEvents:"none",alignItems:"center",justifyContent:"flex-end",paddingBottom:vertical?350:60}}>
   <div style={{
     display:"block",maxWidth:vertical?"89%":"78%",padding:"17px 23px",
     background:P.tombDark,border:T.outline.width+"px solid "+P.carbonBlack,
     color:P.gypsumWhite,textAlign:"center",fontFamily:"Arial, sans-serif",
     fontSize:vertical?58:44,fontWeight:900,lineHeight:1.18,letterSpacing:".015em",
     transform:"scale("+scale+")",overflowWrap:"break-word",
   }}>
     {words.map((w,i)=><span key={i} style={{display:"inline-block",marginRight:".24em",
       color:i===index?P.yellowOchre:P.gypsumWhite}}>{w}</span>)}
   </div>
 </AbsoluteFill>;
};

export const Shorts15Captions:React.FC<{cues:Cue[];wordCues?:WordCue[];format:FormatId}> = ({cues,wordCues=[],format})=>
 wordCues.length && format==="9:16" ? <V1WordBand words={wordCues}/> : <LegacyCaptions cues={cues} format={format}/>;
