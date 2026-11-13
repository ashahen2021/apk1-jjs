/** Kinetic bold captions for 15s Shorts only; standard Subtitles are unchanged. */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { FormatId } from "../../../shared/catalog.ts";
import type { Cue } from "../../../shared/schema.ts";

export const Shorts15Captions: React.FC<{cues:Cue[];format:FormatId}> = ({cues,format}) => {
  const frame = useCurrentFrame();
  const cue = cues.find(c=>frame>=c.from && frame<c.to);
  if (!cue) return null;
  const words = cue.text.trim().split(/\s+/).filter(Boolean);
  if(!words.length) return null;
  const idx = Math.min(words.length-1,Math.max(0,Math.floor(((frame-cue.from)/(Math.max(1,cue.to-cue.from)))*words.length)));
  const y = format === "9:16" ? 420 : 55;
  const font = format === "9:16" ? 58 : 45;
  const entrance = interpolate(frame,[cue.from,cue.from+4],[.95,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  const text = words.map((word,i)=><span key={i} style={{display:"inline-block",marginRight:"0.27em",color:i===idx?"#FFE49A":"#FFFFFF",transform:i===idx?"scale(1.08)":"scale(1)",textShadow:"0 3px 6px rgba(0,0,0,.95), 2px 2px 0 #0A141C, -2px -2px 0 #0A141C",transition:"none"}}>{word}</span>);
  return <AbsoluteFill style={{pointerEvents:"none",justifyContent:"flex-end",alignItems:"center",paddingBottom:y}}>
    <div style={{maxWidth:format==="9:16"?"86%":"78%",textAlign:"center",padding:"13px 20px",borderRadius:20,background:"linear-gradient(90deg,rgba(5,15,24,.80),rgba(5,15,24,.63))",border:"1px solid rgba(232,192,121,.43)",fontFamily:"Josefin Sans, Arial, sans-serif",fontSize:font,fontWeight:900,lineHeight:1.25,letterSpacing:".025em",transform:`scale(${entrance})`,overflowWrap:"break-word"}}>{text}</div>
  </AbsoluteFill>;
};
