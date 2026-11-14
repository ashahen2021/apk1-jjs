// CI screenshot proof: real Remotion render of newly generated ramp art.
// Writes only under workspace/visual-lab-smoke, never a user's production project.
import fs from "node:fs";
import path from "node:path";
import { parseProject } from "../server/projects.ts";
import { closeBrowser, renderScenePreview } from "../server/render.ts";
import { resolveTimeline } from "../server/timeline.ts";
import { WORKSPACE } from "../server/paths.ts";
import { proposeOfflineRampArt } from "../shared/visualLab.ts";

const original=parseProject({
 title:"Did Egyptians Build One Giant Rising Ramp?",topic:"Pyramid construction with a mudbrick ramp",
 format:"9:16",fps:30,subtitles:true,
 scenes:[
   {id:"s01",template:"v1-topic-short",narration:"Was one giant ramp the secret to building the pyramids?",durationSec:3.75},
   {id:"s02",template:"v1-topic-short",narration:"Workers hauled heavy stone blocks uphill with ropes.",durationSec:3.75},
   {id:"s03",template:"v1-topic-short",narration:"The higher the pyramid rose, the longer the ramp grew.",durationSec:3.75},
   {id:"s04",template:"v1-topic-short",narration:"But would the ramp itself become too enormous?",durationSec:3.75},
 ]
});
const proposals=proposeOfflineRampArt(original);
const project=parseProject({...original,scenes:original.scenes.map((s,i)=>({...s,artShots:proposals.scenes[i].shots}))});
const folder=path.join(WORKSPACE,"visual-lab-smoke");
fs.mkdirSync(folder,{recursive:true});
const tl=await resolveTimeline(project,folder);
try{
 for(let i=0;i<4;i++){
   const still=await renderScenePreview(project,tl.scenes[i],15,.35);
   fs.copyFileSync(still,path.join(folder,`ramp-scene-${i+1}.png`));
   console.log("PASS rendered subject-specific ramp art",i+1);
 }
}finally{await closeBrowser();}
