/** Burned kinetic subtitles for V3 ONLY: fixed bottom lane away from key objects. */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { Cue } from "../../../shared/schema.ts";
import type { FormatId } from "../../../shared/catalog.ts";

export const Shorts15CaptionsV3:React.FC<{cues:Cue[];format:FormatId}>=({cues,format})=>{
 const f=useCurrentFrame(),cue=cues.find(c=>f>=c.from&&f<c.to);
 if(!cue)return null;
 const words=cue.text.trim().split(/\s+/).filter(Boolean);
 if(!words.length)return null;
 const pos=Math.max(0,Math.min(words.length-1,Math.floor((f-cue.from)/Math.max(1,cue.to-cue.from)*words.length)));
 const vertical=format==="9:16";
 const font=vertical?(words.length>9?42:48):38;
 const opacity=Math.min(1,(f-cue.from)/3,(cue.to-f)/3);
 return <AbsoluteFill style={{pointerEvents:"none",justifyContent:"flex-end",alignItems:"center",paddingBottom:vertical?398:56}}>
  <div style={{width:vertical?"89%":"72%",maxWidth:vertical?940:1360,minHeight:vertical?92:72,display:"flex",justifyContent:"center",alignItems:"center",textAlign:"center",background:"rgba(4,14,26,.96)",boxShadow:"0 0 0 2px rgba(223,176,98,.77), 0 15px 45px rgba(0,0,0,.55)",borderRadius:12,padding:"12px 22px",color:"white",fontFamily:"Josefin Sans,Arial,sans-serif",fontSize:font,lineHeight:1.22,fontWeight:900,opacity,overflowWrap:"anywhere"}}>
   <div style={{maxWidth:"100%"}}>{words.map((w,i)=><span key={i} style={{display:"inline-block",marginRight:9,color:i===pos?"#FFE09A":"#FAF6EF",transform:i===pos?"scale(1.035)":"scale(1)",textShadow:"1px 2px 2px #05121F"}}>{w}</span>)}</div>
  </div>
 </AbsoluteFill>;
};
