import assert from "node:assert/strict";
import React from "react";
import fs from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { GARDINER_SIGNS, GARDINER_CODES, GARDINER_PATHS_BY_NAME, type GardinerCode } from "../engine/src/data/hieroglyphSigns.ts";
import { HieroglyphSign, HieroglyphWallText, DEFAULT_GARDINER_COLUMNS } from "../engine/src/templates/HieroglyphWall.tsx";
import { EgyptianOilLamp } from "../engine/src/templates/EgyptianOilLamp.tsx";
import { EgyptianTombRig } from "../engine/src/templates/EgyptianTombRig.tsx";
import { TombWall, TombLamp } from "../engine/src/templates/TombPaintingParts.tsx";
import { tombPalette as P, tombTheme as T } from "../engine/src/theme/tombPaintingFlat.ts";

const required=["A1","D4","D21","G17","M17","N35","Q3","S34","R8","F35"] as const;
assert.deepEqual([...GARDINER_CODES].sort(),[...required].sort());
assert.equal(DEFAULT_GARDINER_COLUMNS.length,2);
assert.deepEqual(DEFAULT_GARDINER_COLUMNS.flat().sort(),[...required].sort());
for(const id of required){
 const sign=GARDINER_SIGNS[id];
 assert.equal(sign.gardiner,id);
 assert.ok(sign.name.trim().length>=3 && sign.meaning.trim().length>=3);
 assert.ok(sign.unicode.codePointAt(0)!>=0x13000 && sign.unicode.codePointAt(0)!<=0x1342f,
   id+" must be a Unicode Egyptian hieroglyph");
 assert.ok(["egyptianBlue","ochreRed","malachiteGreen","carbonBlack"].includes(sign.ink));
 assert.ok(sign.paths.length>=1 && sign.paths.every(p=>/^M[-\d.\s]/.test(p.d)),id+" must have SVG path data");
 assert.equal(GARDINER_PATHS_BY_NAME[sign.name],sign.paths,"name-to-path map must expose canonical paths");
 assert.ok(sign.paths.every(p=>!/url\(|<script|onload|javascript:|foreignObject/i.test(p.d)),id+" cannot contain executable SVG");
 const markup=renderToStaticMarkup(React.createElement(HieroglyphSign,{code:id}));
 assert.ok(markup.includes('data-gardiner="'+id+'"'));
 assert.equal((markup.match(/<path/g)||[]).length,sign.paths.length);
}
const columns=renderToStaticMarkup(React.createElement(HieroglyphWallText,{}));
assert.ok(columns.includes('data-purpose="illustrative-signs-not-transliteration"'));
for(const id of required)assert.ok(columns.includes('data-gardiner="'+id+'"'));
assert.equal((columns.match(/data-column="/g)||[]).length,2);
assert.ok(columns.includes(P.egyptianBlue)||columns.includes(P.ochreRed));
const wall=renderToStaticMarkup(React.createElement(TombWall,{}));
assert.ok(wall.includes("data-wall="));
for(const id of required)assert.ok(wall.includes('data-gardiner="'+id+'"'));
for(const variant of ["bowl","on-stand"] as const){
 const markup=renderToStaticMarkup(React.createElement(EgyptianOilLamp,{variant,flameFrame:12}));
 assert.ok(markup.includes('data-part="shallow-clay-bowl"'));
 assert.ok(markup.includes('data-part="floating-wick"'));
 assert.ok(markup.includes('data-part="wick-flame"'));
 assert.equal(markup.includes('data-part="tall-lamp-stand"'),variant==="on-stand");
 assert.ok(!/linearGradient|url\(#/.test(markup),"Only scene lighting may use a radial gradient");
}
const handheld=renderToStaticMarkup(React.createElement(EgyptianTombRig,{x:500,y:1225,pose:"carrying-lamp"}));
assert.ok(handheld.includes('data-prop="egyptian-clay-oil-lamp"'));
assert.ok(renderToStaticMarkup(React.createElement(TombLamp,{})).includes('data-part="floating-wick"'));
for(const file of ["engine/src/templates/HieroglyphWall.tsx","engine/src/templates/EgyptianOilLamp.tsx"]){
 const src=fs.readFileSync(file,"utf8");
 assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(src),file+" must use centralized theme, not hard-coded colors");
}
console.log("PASS Gardiner: ten authentic signs, data-driven paths, two vertical columns, no invented marks, clay bowl/stand with wick and shared rig lamp");
