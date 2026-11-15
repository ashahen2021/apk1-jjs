// Offline acceptance test for per-film authored SVG packs. No Ollama, Chrome,
// network access, paid APIs, production writes, or narration generation.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parseProject } from "./projects.ts";
import { analyzeVisualLab, proposeOfflineArt, VisualPackageSchema } from "../shared/visualLab.ts";
import { auditIllustrations } from "../shared/visualLabQuality.ts";

const fixture=path.resolve("examples/v1-painting-dark-demo/project.json");
const originalBytes=fs.readFileSync(fixture);
const project=parseProject(JSON.parse(originalBytes.toString("utf8")));
const narration=project.scenes.map(s=>s.narration);
const durations=project.scenes.map(s=>s.durationSec);
const audio=project.scenes.map(s=>s.narrationFile);
const before=JSON.stringify(project);

const analysis=analyzeVisualLab(project);
assert.equal(analysis.offlineRecipe,"bespoke-painting");
assert.equal(analysis.offlineAvailable,true);
const pack=proposeOfflineArt(project);
assert.equal(VisualPackageSchema.safeParse(pack).success,true);
assert.equal(pack.scenes.length,4);
assert.deepEqual(pack.scenes.map(s=>s.id),project.scenes.map(s=>s.id));
assert.ok(pack.scenes.every(s=>s.shots.length===3),"Three distinct illustrated shots per scene");
assert.deepEqual(auditIllustrations(pack),[],"No weak, tiny, monochrome or duplicate compositions");
assert.ok(pack.scenes.flatMap(s=>s.shots).every(s=>s.shapes.length>=10),"All artworks must be substantive");
assert.ok(pack.scenes.flatMap(s=>s.shots).every(s=>s.shapes.length<=60),"Remain inside SVG shape schema");
const allLabels=pack.scenes.flatMap(s=>s.shots.map(x=>x.label));
assert.equal(new Set(allLabels).size,12,"All bespoke labels differ across this film");
const recipes=pack.scenes.flatMap(s=>s.shots.map(shot=>shot.printRecipe));
assert.equal(new Set(recipes).size,12,"Every film shot has its own premium original-print recipe");
assert.ok(recipes.every(r=>typeof r==="string"&&r.startsWith("painting-dark/")),"Every shot uses the classic Great Pyramid print renderer");
assert.deepEqual(JSON.stringify(project),before,"Generating artwork is non-mutating");

const approved=parseProject({...project,scenes:project.scenes.map((scene,i)=>({
 ...scene,artShots:pack.scenes[i].shots
}))});
assert.equal(approved.scenes.length,4);
assert.deepEqual(approved.scenes.map(s=>s.narration),narration,"Narration unchanged");
assert.deepEqual(approved.scenes.map(s=>s.durationSec),durations,"Durations unchanged");
assert.deepEqual(approved.scenes.map(s=>s.narrationFile),audio,"Audio unchanged");
assert.equal(approved.format,project.format);
assert.equal(approved.fps,project.fps);
assert.equal(approved.subtitles,project.subtitles);
assert.equal(approved.scenes.every(s=>s.template==="v1-topic-short"),true);
assert.deepEqual(auditIllustrations({scenes:approved.scenes.map(s=>({id:s.id,shots:s.artShots!}))}),[]);

const empty=[{kind:"line",x1:500,y1:500,x2:502,y2:502,stroke:"ink",fill:"none"}];
const weak={scenes:[{id:"weak",shots:[
 {label:"TINY SHAPES",shapes:Array.from({length:12},(_,i)=>({...empty[0],x1:500+i,x2:501+i})),description:"nearly empty"},
 {label:"TINY REPEAT",shapes:Array.from({length:12},(_,i)=>({...empty[0],x1:500+i,x2:501+i})),description:"nearly empty"},
]}]};
assert.ok(auditIllustrations(weak as typeof pack).length>0,"Geometry validator must reject empty compositions");

// A non-painting film must not silently inherit a mural asset pack.
const other=parseProject({title:"Electromagnetic Induction",scenes:[
 {id:"s01",template:"title",narration:"A moving magnet induces voltage in a nearby coil."},
 {id:"s02",template:"end-card",narration:"The flux change drives the electric field."},
]});
assert.equal(analyzeVisualLab(other).offlineAvailable,false);
assert.throws(()=>proposeOfflineArt(other),/No bespoke SVG pack/);

assert.ok(fs.readFileSync(fixture).equals(originalBytes),"Demo project file is byte-identical");
console.log("PASS bespoke SVG: 12 original mural shots, framing/density checks, portable schema, unchanged narration/timing/audio, subject isolation");
