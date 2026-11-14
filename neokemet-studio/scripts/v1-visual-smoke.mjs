// Offline V1 visual smoke: use the studio's own render pipeline and publicDir.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const demos = ["v1-painting-dark-demo", "v1-papyrus-demo", "v1-nile-transport-demo"];
const outDir = path.resolve("v1-visual-previews");
fs.mkdirSync(outDir, { recursive: true });
for(const slug of demos){
  const file = path.join("examples",slug,"project.json");
  if(!fs.existsSync(file))throw new Error("Missing visual demo: "+file);
  for(const frame of [12,65]){
    // The studio CLI sets engine/public as the asset root, unlike bare Remotion CLI.
    const proc = spawnSync("npx", ["--no-install","tsx","server/cli.ts","still",path.dirname(file),"1",String(frame)],
      {encoding:"utf8",env:{...process.env,NEOKEMET_NO_PAID:"1"},maxBuffer:6*1024*1024});
    if(proc.status!==0)throw new Error("Studio still failed: "+slug+" frame "+frame+"\n"+proc.stdout+"\n"+proc.stderr);
    const lines=proc.stdout.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    const png=lines.at(-1);
    if(!png || !fs.existsSync(png))throw new Error("Studio still did not produce a file: "+proc.stdout);
    const destination=path.join(outDir,slug+"-"+frame+".png");
    fs.copyFileSync(png,destination);
    console.log("PASS visual "+destination);
  }
}
