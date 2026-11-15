/**
 * Render actual 1080x1920 Remotion stills from the authored Painting the Dark
 * pack, without overwriting project.json or narration. Safe for CI.
 * These images are for human review; passing type/schema checks alone is not
 * a guarantee of strong artistic direction.
 */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { parseProject } from "../server/projects.ts";
import { resolveTimeline } from "../server/timeline.ts";
import { closeBrowser, renderScenePreview } from "../server/render.ts";
import { WORKSPACE } from "../server/paths.ts";
import { proposeOfflineArt } from "../shared/visualLab.ts";

const source=path.resolve("examples/v1-painting-dark-demo/project.json");
const original=fs.readFileSync(source);
const base=parseProject(JSON.parse(original.toString("utf8")));
const art=proposeOfflineArt(base);
const project=parseProject({
  ...base,
  scenes:base.scenes.map((s,i)=>({...s,artShots:art.scenes[i].shots})),
});
const out=path.join(WORKSPACE,"bespoke-painting-preview");
fs.mkdirSync(out,{recursive:true});
const timeline=await resolveTimeline(project,path.dirname(source));
assert.equal(timeline.totalFrames,450);
const findings:{sec:number;scene:string;shot:string;file:string}[]=[];
try{
  for(const sec of [0,2,4,6,8,10,12,14]){
    const absoluteFrame=sec*30;
    const scene=timeline.scenes.find(s=>absoluteFrame>=s.startFrame&&absoluteFrame<s.startFrame+s.durationInFrames);
    assert.ok(scene,"Source scene at "+sec+" seconds");
    const localFrame=absoluteFrame-scene.startFrame;
    const index=Math.min(scene.scene.artShots!.length-1,Math.floor(localFrame/scene.durationInFrames*Math.min(scene.scene.artShots!.length,Math.ceil(scene.durationInFrames/30/1.6))));
    const name="bespoke-"+String(sec).padStart(2,"0")+"s.png";
    const temp=await renderScenePreview(project,scene,localFrame,1);
    const dest=path.join(out,name);
    fs.copyFileSync(temp,dest);
    const data=fs.readFileSync(dest);
    assert.equal(data.readUInt32BE(16),1080);
    assert.equal(data.readUInt32BE(20),1920);
    findings.push({sec,scene:scene.scene.id,shot:scene.scene.artShots![index].label,file:name});
    console.log("Rendered",name,scene.scene.id,scene.scene.artShots![index].label);
  }
  fs.writeFileSync(path.join(out,"proof.json"),JSON.stringify({
    source:"examples/v1-painting-dark-demo/project.json",
    durationFrames:timeline.totalFrames,
    narrationChanged:false,
    audioGenerated:false,
    labels:findings,
  },null,2));
  assert.ok(fs.readFileSync(source).equals(original),"Reference source unchanged");
  console.log("PASS: eight real Remotion bespoke SVG stills",out);
}finally{await closeBrowser();}
