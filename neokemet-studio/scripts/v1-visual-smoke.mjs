// Offline visual smoke test: render representative V1 SVG artwork for inspection.
// Does not call voice/image services or modify production project files.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const files = ["v1-painting-dark-demo", "v1-papyrus-demo", "v1-nile-transport-demo"];
const out = path.resolve("v1-visual-previews");
fs.mkdirSync(out,{recursive:true});
for(const slug of files){
  const p=JSON.parse(fs.readFileSync(path.join("examples",slug,"project.json"),"utf8"));
  for(const frame of [12,65]){
    const scene=p.scenes[0];
    const props={scene,format:"9:16",fps:30,durationInFrames:Math.round(scene.durationSec*30),cues:[],subtitles:false};
    const json=path.join(out,slug+".json");
    const png=path.join(out,slug+"-"+frame+".png");
    fs.writeFileSync(json,JSON.stringify(props));
    const result=spawnSync("npx",["--no-install","remotion","still","engine/src/index.ts","StudioScene",png,"--props",json,"--frame",String(frame)],{stdio:"inherit",env:{...process.env,NEOKEMET_NO_PAID:"1"}});
    if(result.status!==0)throw new Error("Visual smoke render failed for "+slug+" frame "+frame);
    console.log("PASS visual "+png);
  }
}
