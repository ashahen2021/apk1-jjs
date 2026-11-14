import assert from "node:assert/strict";
import fs from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EgyptianTombRig, EGYPTIAN_RIG_GRID } from "../engine/src/templates/EgyptianTombRig.tsx";
import { buildWordCues } from "../shared/wordTiming.ts";
import { cueProblems } from "../shared/timing.ts";
import { tombPalette as P,tombTheme as T,getSceneLightingMode,getGlowProps,getSceneBackground,stoneNoisePath,tombLegacyColor } from "../engine/src/theme/tombPaintingFlat.ts";

const approved=["#E9DCC0","#F4EFE3","#D9A441","#B5452B","#2E6DA4","#3E8E6E","#1B1A17","#12100E"];
assert.deepEqual(Object.values(P),approved);
assert.equal(T.width,1080);assert.equal(T.height,1920);assert.equal(T.fps,30);
assert.equal(T.composition.fullBleed,true);
assert.equal(T.composition.topExclusion,220);
assert.equal(T.composition.bottomExclusion,420);
assert.equal(T.composition.subjectTop,350);
assert.equal(T.composition.subjectBottom,1450);
assert.ok(T.typography.bandTop>=1250-10 && T.typography.bandBottom<=1450);
assert.ok(T.typography.titleMinSize>=72 && T.typography.titleMaxSize<=90);
assert.ok(T.pacing.pushInMin>=.03 && T.pacing.pushInMax<=.06);
assert.equal(EGYPTIAN_RIG_GRID.squares,18);
for(const pose of ["standing","painting","grinding","carrying-lamp","walking"] as const){
 const svg=renderToStaticMarkup(React.createElement(EgyptianTombRig,{x:300,y:1450,pose,progress:.5}));
 for(const part of ["head","torso","hips","upper-arm-left","upper-arm-right","forearm-left","forearm-right","leg-back","leg-front","hand-right"]){
   assert.ok(svg.includes('data-part="'+part+'"'),pose+" missing pivot group "+part);
 }
 assert.ok(svg.includes('data-pose="'+pose+'"'));
}
assert.ok(renderToStaticMarkup(React.createElement(EgyptianTombRig,{x:300,y:1450,sex:"woman"})).includes('data-sex="woman"'));
const aligned=buildWordCues("Stone blocks rose",1.65,30,80,[
 {word:"Stone",startSec:0,endSec:.5},{word:"blocks",startSec:.5,endSec:1},{word:"rose",startSec:1,endSec:1.65}
]);
assert.equal(aligned.aligned,true);
assert.equal(aligned.cues[0].from,15);
assert.equal(aligned.cues[2].to,Math.round((.5+1.65)*30));
assert.deepEqual(cueProblems(aligned.cues,80),[]);
const estimated=buildWordCues("Stone blocks rose",1.65,30,80);
assert.equal(estimated.aligned,false);
assert.match(estimated.warning??"",/estimated/i);
assert.equal(estimated.cues.length,3);

assert.ok(T.outline.width>=4 && T.outline.width<=6);
assert.ok(T.texture.opacity>=.03&&T.texture.opacity<=.05);
assert.equal(getSceneLightingMode("Scribes working by lamplight inside an underground tomb"),"tomb");
assert.equal(getSceneLightingMode("Workers hauling limestone on a sunny ramp"),"day");
assert.equal(getSceneLightingMode({narration:"A boat travelled on the Nile",params:{lighting:"tomb"}}),"tomb");
assert.equal(getGlowProps("tomb").enabled,true);
assert.equal(getGlowProps("day").enabled,false);
assert.equal(getSceneBackground("day"),P.limestone);
assert.equal(getSceneBackground("tomb"),P.tombDark);
assert.equal(tombLegacyColor("paper"),P.limestone);
assert.equal(tombLegacyColor("gold"),P.yellowOchre);
assert.equal(tombLegacyColor("teal"),P.malachiteGreen);
assert.equal(tombLegacyColor("none"),"none");
assert.ok(stoneNoisePath().length>900);
const templates=[
"engine/src/templates/V1TopicShort.tsx",
"engine/src/templates/V1LabShots.tsx",
"engine/src/templates/TombPaintingParts.tsx",
"engine/src/templates/EgyptianTombRig.tsx",
"engine/src/components/Shorts15Captions.tsx"
];
for(const file of templates){
 const code=fs.readFileSync(file,"utf8");
 assert.equal(/#[0-9A-Fa-f]{3,8}\b/.test(code),false,file+" has a hard-coded color");
 assert.equal(/linear-gradient\(|<linearGradient|conic-gradient\(/.test(code),false,file+" has an unapproved gradient");
}
const stage=fs.readFileSync("engine/src/templates/TombPaintingParts.tsx","utf8");
assert.ok(stage.includes("<radialGradient"),"One radial light mask is required");
const v1=fs.readFileSync("engine/src/templates/V1TopicShort.tsx","utf8");
const lab=fs.readFileSync("engine/src/templates/V1LabShots.tsx","utf8");
assert.ok(v1.includes("TombSceneStyle")&&lab.includes("TombSceneStyle"));
assert.ok(!v1.includes("C.paper")&&!lab.includes("C.paper"));
console.log("PASS Tomb Painting Flat: eight-color palette, central style, day/tomb modes, full-bleed, stone noise, safe outline, both V1 templates and flat subtitles");
