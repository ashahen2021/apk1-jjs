// Produce native 1080x1920 stills for both changed V1 render templates.
import fs from "node:fs";
import path from "node:path";
import { parseProject } from "../server/projects.ts";
import { closeBrowser, renderScenePreview } from "../server/render.ts";
import { resolveTimeline } from "../server/timeline.ts";
import { WORKSPACE } from "../server/paths.ts";
import { proposeOfflineRampArt } from "../shared/visualLab.ts";

const out=path.join(WORKSPACE,"tomb-flat-stills");
fs.mkdirSync(out,{recursive:true});
async function renderOne(project:ReturnType<typeof parseProject>,label:string,sceneIndex=0){
  const tl=await resolveTimeline(project,out);
  const file=await renderScenePreview(project,tl.scenes[sceneIndex],Math.round(tl.scenes[sceneIndex].durationInFrames*.24),1);
  const result=path.join(out,label+".png");
  fs.copyFileSync(file,result);
  const sig=fs.readFileSync(result).subarray(0,8).toString("hex");
  if(sig!=="89504e470d0a1a0a")throw new Error("Still is not PNG: "+result);
  console.log("PASS native 1080x1920 still",result);
}
try{
  for(const topic of ["painting-dark","papyrus","nile-transport"]){
    const file=path.join("examples","v1-"+topic+"-demo","project.json");
    const p=parseProject(JSON.parse(fs.readFileSync(file,"utf8")));
    await renderOne(p,"V1TopicShort-"+topic);
  }
  const ramp=parseProject({title:"A Giant Pyramid Ramp?",topic:"Pyramid construction ramp",format:"9:16",fps:30,subtitles:true,scenes:[
    {id:"scene-1",template:"v1-topic-short",narration:"Did workers use a rising ramp to build the pyramids?",durationSec:4},
    {id:"scene-2",template:"v1-topic-short",narration:"Workers hauled massive limestone blocks uphill on sledges.",durationSec:4},
    {id:"scene-3",template:"v1-topic-short",narration:"As the pyramid rose, the ramp had to grow.",durationSec:4},
    {id:"scene-4",template:"v1-topic-short",narration:"Could the ramp itself become impossibly huge?",durationSec:4},
  ]});
  const proposed=proposeOfflineRampArt(ramp);
  const illustrated=parseProject({...ramp,scenes:ramp.scenes.map((s,i)=>({...s,artShots:proposed.scenes[i].shots}))});
  await renderOne(illustrated,"V1LabShots-pyramid-ramp",3);
}finally{await closeBrowser();}
