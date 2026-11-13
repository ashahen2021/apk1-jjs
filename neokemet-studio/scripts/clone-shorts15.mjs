#!/usr/bin/env node
/** Creates a separately editable 15-second Short from the shipped 10-shot master. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const title=process.argv.slice(2).join(" ").trim();
if(title.length<2||title.length>110){console.error('Usage: node scripts/clone-shorts15.mjs "Your short title"');process.exit(1)}
const clean=title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,43)||"new";
const projects=path.join(ROOT,"projects");
let slug="shorts15-"+clean, i=2;while(fs.existsSync(path.join(projects,slug)))slug="shorts15-"+clean.slice(0,38)+"-"+i++;
const data=JSON.parse(fs.readFileSync(path.join(projects,"royal-cache-15s-v2","project.json"),"utf8"));
data.title=title;data.topic="Shorts15 V2 template cloned from the Royal Cache visual master. IMPORTANT: Change narration, on-screen text and artwork when adapting to a different historical subject.";
data.scenes.forEach((s,i)=>{s.id="new15-"+String(i+1).padStart(2,"0")+"-"+Date.now().toString(36);delete s.narrationFile;});
fs.mkdirSync(path.join(projects,slug),{recursive:false});
fs.writeFileSync(path.join(projects,slug,"project.json"),JSON.stringify(data,null,2)+"\n");
console.log("CREATED "+slug+"\nIn the studio, edit the four scene scripts and visual directions before recording.");
const command=process.platform==="win32"?"npm.cmd":"npm";
const args=["run","baseline","--",slug,"--write"];
const child=spawnSync(command,args,{cwd:ROOT,stdio:"inherit",shell:process.platform==="win32"});
if(child.status!==0){console.error("Baseline could not be recorded. Run npm run baseline -- "+slug+" --write before running the regression tests.");process.exit(1)}
console.log("READY: new project and matching baseline created in this copy.");
