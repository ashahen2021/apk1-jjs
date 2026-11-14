// Focused offline contract test. No Chrome, Ollama, paid AI or existing project files.
import assert from "node:assert/strict";
import { ArtShotSchema, VisualPackageSchema, analyzeVisualLab, proposeOfflineRampArt } from "../shared/visualLab.ts";
import { parseProject } from "./projects.ts";

const script=[
  "Did the ancient Egyptians build the Great Pyramid using one giant rising ramp?",
  "Workers hauled heavy stone blocks on wooden sleds and pulled them up a mudbrick slope.",
  "But as the pyramid grew higher, the ramp had to rise and grow longer too.",
  "Was that clever engineering, or was a ramp of that scale impossible to build?",
];
const base=parseProject({
 version:1,title:"Pyramid Ramp Theory",topic:"How were pyramids built using a rising ramp?",
 format:"9:16",fps:30,subtitles:true,
 scenes:script.map((n,i)=>({
   id:"s"+String(i+1).padStart(2,"0"),
   template:"v1-topic-short",narration:n,
   durationSec:[3.7666666667,3.7333333333,3.7666666667,3.7333333333][i],
   params:{topic:"transport",shots:"quarry,load",hook:i===0},
   ambience:"auto",
 }))
});
const audit=analyzeVisualLab(base);
assert.equal(audit.offlineAvailable,true);
assert.equal(audit.missing,4);
const proposal=proposeOfflineRampArt(base);
assert.equal(proposal.scenes.length,4);
assert.ok(proposal.scenes.every(s=>s.shots.length===3));
assert.ok(proposal.scenes.every(s=>s.shots.every(shot=>shot.shapes.length>=4)));
assert.ok(new Set(proposal.scenes.flatMap(s=>s.shots.map(shot=>shot.label))).size>=4);
const updated=parseProject({
 ...base,scenes:base.scenes.map((s,i)=>({...s,artShots:proposal.scenes[i].shots})),
});
assert.equal(analyzeVisualLab(updated).generated,4);
for(let i=0;i<4;i++){
 assert.equal(updated.scenes[i].narration,base.scenes[i].narration);
 assert.equal(updated.scenes[i].durationSec,base.scenes[i].durationSec);
}
assert.equal(base.scenes[0].artShots,undefined,"analysis/generation must never mutate source project");
assert.equal(VisualPackageSchema.safeParse({...proposal,scenes:[{id:"oops",shots:[]}]}).success,false);
const malicious={
 label:"BAD",description:"injection",
 shapes:[
  {kind:"path",d:'M0 0 onload="alert(1)"',fill:"sand"},
  {kind:"rect",x:0,y:0,width:100,height:100,fill:"gold"},
  {kind:"rect",x:0,y:0,width:100,height:100,fill:"gold"},
  {kind:"rect",x:0,y:0,width:100,height:100,fill:"gold"}
 ]
};
assert.equal(ArtShotSchema.safeParse(malicious).success,false,"unsafe SVG must be rejected");
const unmatched=parseProject({title:"What Is Electricity?",scenes:[
 {id:"s01",template:"title",narration:"A battery powers a small electric circuit."},
 {id:"s02",template:"characters",narration:"Electrons move along wires."}
]});
assert.equal(analyzeVisualLab(unmatched).offlineAvailable,false);
assert.throws(()=>proposeOfflineRampArt(unmatched),/does not match/);
console.log("PASS Visual Lab: detect missing art, generate 12 original ramp shots, validate portability, reject SVG injection, preserve narration and old projects");
