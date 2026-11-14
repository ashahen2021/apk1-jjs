import type { Cue, WordCue } from "./schema.ts";
import { VO_LEAD } from "./timing.ts";

export type Alignment = { word:string; startSec:number; endSec:number };
const wordsOf=(s:string)=>s.trim().split(/\s+/).filter(Boolean);
const normalize=(s:string)=>s.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu,"");
const within=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));

/**
 * Generate one caption event per spoken word.
 * A supplied alignment gives actual per-word timestamps relative to speech onset.
 * Otherwise only audio's measured *overall* speech span is known: word times
 * are length-weighted estimates. Never label the fallback as forced alignment.
 */
export const buildWordCues = (
  text:string,narrationSec:number,fps:number,durationInFrames:number,
  timings?:Alignment[]
): { cues:WordCue[]; aligned:boolean; warning?:string }=>{
 const words=wordsOf(text);
 if(!words.length||durationInFrames<=0)return {cues:[],aligned:false};
 const maxFrame=Math.max(1,durationInFrames);
 const lead=within(Math.round(VO_LEAD*fps),0,maxFrame-1);
 const possible=timings?.length===words.length && timings.every((t,i)=>
   normalize(t.word)===normalize(words[i]) && Number.isFinite(t.startSec)&&Number.isFinite(t.endSec)&&
   t.startSec>=0 && t.endSec>t.startSec && t.endSec<=narrationSec+.35 &&
   (i===0 || t.startSec>=timings[i-1].endSec-.012)
 );
 const aligned=!!possible;
 const endFrame=within(Math.round((VO_LEAD+narrationSec)*fps),lead+1,maxFrame);
 if(words.length > endFrame-lead){
   return {cues:[{from:lead,to:maxFrame,text:words.join(" ")}],aligned:false,
     warning:"Audio or scene is too short for one visible frame per word; using one caption line."};
 }
 if(aligned && timings){
   let prev=lead;
   const cues:WordCue[]=timings.map((t,i)=>{
     const from=within(Math.round((VO_LEAD+t.startSec)*fps),prev,maxFrame-1);
     const to=Math.max(from+1,within(Math.round((VO_LEAD+t.endSec)*fps),from+1,maxFrame));
     prev=to;
     return {text:words[i],from,to};
   });
   if(cues.every((c,i)=>c.to<=maxFrame && (i===0 || c.from>=cues[i-1].to)))
     return {cues,aligned:true};
 }
 const weights=words.map(w=>Math.max(2,normalize(w).length));
 const total=weights.reduce((a,b)=>a+b,0);
 let acc=0,prev=lead;
 const cues:WordCue[]=words.map((word,i)=>{
   acc+=weights[i];
   const from=prev;
   const ideal=i===words.length-1?endFrame:lead+Math.round(acc/total*(endFrame-lead));
   const to=within(ideal,from+1,endFrame-(words.length-1-i));
   prev=to;
   return {from,to,text:word};
 });
 return {cues,aligned:false,warning:timings?.length
   ?"Provided word timestamps did not match narration or recording; captions use estimated word timings."
   :"Word times are estimated within the measured narration span. For exact sync, supply verified wordTimings."};
};
