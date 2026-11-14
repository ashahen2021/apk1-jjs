#!/usr/bin/env node
/** Structural QA + deterministic static collision contract. No downloads or writes. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const slug=process.argv[2]||"royal-cache-15s-v3";
const errors=[], warnings=[];
if(!/^[a-z0-9][a-z0-9-]{0,59}$/.test(slug)){console.error("Invalid slug");process.exit(1)}
const file=path.join(ROOT,"projects",slug,"project.json");
if(!fs.existsSync(file)){console.error("Missing project "+file);process.exit(1)}
const proj=JSON.parse(fs.readFileSync(file,"utf8"));
const expected=["shorts15-v3-hook","shorts15-v3-danger","shorts15-v3-reveal","shorts15-v3-cta"];
const durations=[3,5,4,3], shotCount=[2,3,3,2];
if(proj.format!=="9:16"||proj.fps!==30)errors.push("Project must render at 9:16, 30 fps");
if(proj.subtitles!==true)errors.push("Subtitles must be enabled");
if(!Array.isArray(proj.scenes)||proj.scenes.length!==4)errors.push("Project must have 4 scenes");
let total=0;const ids=new Set();
for(let i=0;i<(proj.scenes||[]).length;i++){
 const s=proj.scenes[i];total+=s.durationSec||0;
 if(s.template!==expected[i])errors.push(`Scene ${i+1}: incorrect V3 template`);
 if(s.durationSec!==durations[i])errors.push(`Scene ${i+1}: expected ${durations[i]}s`);
 if(ids.has(s.id))errors.push("Duplicate ID "+s.id);
 ids.add(s.id);
 if(!s.narration?.trim())errors.push(`Scene ${i+1}: narration missing`);
 const words=s.narration?.trim().split(/\s+/).length||0;
 // Conservative estimate only; actual audio must be measured separately.
 if(words/135*60+.65>durations[i])warnings.push(`Scene ${i+1}: spoken pacing may overflow ${durations[i]}s; record, run validate and adjust before export.`);
 // Narration audio is private and is not in Git. A project with no narration/ folder at all is a
 // fresh clone: warn. A narration/ folder that exists but lacks a referenced file is a real error.
 if(s.narrationFile&&!fs.existsSync(path.resolve(path.dirname(file),s.narrationFile))){
  if(fs.existsSync(path.join(path.dirname(file),"narration")))errors.push(`Scene ${i+1}: missing audio file`);
  else warnings.push(`Scene ${i+1}: narration audio is not on this computer (private, not in Git); timing uses estimates until it is copied or re-recorded.`);
 }
}
if(total!==15)errors.push(`Expected 15.00s, got ${total}`);
if(!proj.topic?.includes("YIS3_xrkv4I"))warnings.push("Related full documentary URL missing from topic");
for(const f of ["engine/src/templates/Shorts15V3.tsx","engine/src/components/Shorts15CaptionsV3.tsx","engine/public/v3/royal-tomb.webp","engine/public/v3/theban-procession.webp"]){
 if(!fs.existsSync(path.join(ROOT,f)))errors.push("Missing V3 asset: "+f);
}
// Formal safe lanes for every shot; focal boxes are manually authored review bounds,
// not machine vision object detections. App animation remains subject to human QC.
const title={x:108,y:212,w:864,h:166},caption={x:57,y:1370,w:966,h:157};
const boxes=[
 [{x:220,y:445,w:640,h:790},{x:180,y:475,w:760,h:820}],
 [{x:170,y:440,w:760,h:830},{x:150,y:480,w:780,h:820},{x:160,y:480,w:760,h:820}],
 [{x:120,y:415,w:820,h:920},{x:140,y:460,w:790,h:870},{x:120,y:450,w:840,h:860}],
 [{x:135,y:470,w:820,h:820},{x:160,y:760,w:760,h:520}]
];
const collide=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
for(let s=0;s<4;s++)for(let j=0;j<boxes[s].length;j++){
 const art=boxes[s][j];
 if(collide(art,title))errors.push(`Scene ${s+1} shot ${j+1}: reserved headline overlaps focal art box`);
 if(collide(art,caption))errors.push(`Scene ${s+1} shot ${j+1}: reserved caption overlaps focal art box`);
}
console.log(`NeoKemetAI V3: ${proj.scenes?.length??0} scenes, ${shotCount.join('+')} = ${shotCount.reduce((a,b)=>a+b,0)} micro-shots, ${total}s / ${total*proj.fps} frames`);
console.log("Asset and static reserved-zone checks: "+(errors.length?"FAIL":"PASS"));
console.log("Note: visual-safe boxes are an authored contract, NOT proof of real video frame non-overlap.");
for(const x of warnings)console.log("WARNING "+x);
for(const x of errors)console.error("ERROR "+x);
if(errors.length)process.exit(1);
console.log("PASS — V3 project timing, source assets and layout manifest are structurally sound.");
