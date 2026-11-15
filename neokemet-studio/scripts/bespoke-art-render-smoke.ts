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
  // Photograph every authored composition at its own midpoint, not just the
  // eight 2-second samples: otherwise four out of twelve shots go unseen.
  const centers:{scene:string;shot:string;file:string}[]=[];
  for(const scene of timeline.scenes){
    const drawings=scene.scene.artShots!;
    const visibleCount=Math.min(drawings.length,Math.ceil(scene.durationInFrames/30/1.6));
    for(let index=0;index<visibleCount;index++){
      const at=Math.min(scene.durationInFrames-1,Math.round(scene.durationInFrames*(index+.5)/visibleCount));
      const file="shot-"+scene.scene.id+"-"+String(index+1)+".png";
      const sourceImage=await renderScenePreview(project,scene,at,1);
      const dest=path.join(out,file);
      fs.copyFileSync(sourceImage,dest);
      const bytes=fs.readFileSync(dest);
      assert.equal(bytes.readUInt32BE(16),1080);
      assert.equal(bytes.readUInt32BE(20),1920);
      centers.push({scene:scene.scene.id,shot:drawings[index].label,file});
      console.log("Rendered full set",file,drawings[index].label);
    }
  }
  assert.equal(centers.length,12,"Every custom SVG composition has a native still");
  fs.writeFileSync(path.join(out,"proof.json"),JSON.stringify({
    source:"examples/v1-painting-dark-demo/project.json",
    durationFrames:timeline.totalFrames,
    narrationChanged:false,
    audioGenerated:false,
    labels:findings,
    allBespokeShots:centers,
  },null,2));
  assert.ok(fs.readFileSync(source).equals(original),"Reference source unchanged");
  console.log("PASS: eight timeline samples plus all twelve bespoke SVG compositions rendered in Remotion",out);
}finally{await closeBrowser();}
