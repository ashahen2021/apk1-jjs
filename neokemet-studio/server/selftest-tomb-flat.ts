import assert from "node:assert/strict";
import fs from "node:fs";
import { tombPalette as P,tombTheme as T,getSceneLightingMode,getGlowProps,getSceneBackground,stoneNoisePath,tombLegacyColor } from "../engine/src/theme/tombPaintingFlat.ts";

const approved=["#E9DCC0","#F4EFE3","#D9A441","#B5452B","#2E6DA4","#3E8E6E","#1B1A17","#12100E"];
assert.deepEqual(Object.values(P),approved);
assert.equal(T.width,1080);assert.equal(T.height,1920);assert.equal(T.fps,30);
assert.equal(T.composition.fullBleed,true);
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
