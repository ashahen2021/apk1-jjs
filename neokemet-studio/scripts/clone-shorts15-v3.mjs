#!/usr/bin/env node
/** Clone the V3 master into a separate editable project. Does not touch master. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const title=process.argv.slice(2).join(" ").trim();
if(title.length<3||title.length>100){console.error('Usage: node scripts/clone-shorts15-v3.mjs "New Short title"');process.exit(1)}
const s=title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,38)||"short";
const root=path.join(ROOT,"projects");let slug="shorts15-v3-"+s,n=2;
while(fs.existsSync(path.join(root,slug)))slug="shorts15-v3-"+s.slice(0,31)+"-"+n++;
const source=path.join(root,"royal-cache-15s-v3","project.json");
const project=JSON.parse(fs.readFileSync(source,"utf8"));project.title=title;project.subtitles=true;
project.topic="V3 cinematic 15-second template. IMPORTANT: The supplied art and scene directions depict the Royal Cache. Replace those templates/assets if making a Short about a different historical subject.";
project.scenes.forEach((scene,i)=>{scene.id=`v3-new-${String(i+1).padStart(2,"0")}-${slug.slice(-12)}`;delete scene.narrationFile;});
fs.mkdirSync(path.join(root,slug),{recursive:false});
fs.writeFileSync(path.join(root,slug,"project.json"),JSON.stringify(project,null,2)+"\n");
console.log("CREATED new project: "+slug+" (4 scenes / 15 s). No prior project was changed.");
console.log("BEFORE publishing: edit narration and title; verify the visuals match the new historical subject.");
console.log(`Record a new baseline only after editing: npm run baseline -- ${slug} --write`);
