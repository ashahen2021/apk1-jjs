// Optional no-credit illustrator using an explicitly LOCAL Ollama server.
// Output is validated against a small SVG shape grammar; never execute generated code.
import { z } from "zod";
import type { Project } from "../shared/schema.ts";
import { VisualPackageSchema } from "../shared/visualLab.ts";

export const generateOllamaArt = async (project:Project,url:string,model:string)=>{
  const target=new URL(url);
  if(target.protocol!=="http:" || !["127.0.0.1","localhost","[::1]"].includes(target.hostname))
    throw new Error("Visual Lab only connects to LOCAL Ollama (127.0.0.1 or localhost), never a paid remote API.");
  if(!model.trim())throw new Error("Choose an installed Ollama model in Settings.");
  if(project.scenes.length>10)throw new Error("Generate a maximum of 10 scenes per illustrated Short.");
  const instructions=[
    "You are an SVG storyboard artist. Draw unique educational 2D scenes in an elegant, simple ancient-Egypt travel-poster style.",
    "Return JSON ONLY matching the provided schema. Every scene must have 2 or 3 visually DISTINCT shots.",
    "Each shot is a group of 8–28 safe geometric SVG elements. Output ONLY geometric data, no executable code or SVG strings.",
    "Canvas: 1080 wide x 1920 high. Draw the subject LARGE and recognisable mostly within x=90..990, y=440..1370.",
    "Reserve y<370 for a bold shot label and y>1460 for captions/YouTube controls. Do not draw letters as geometry.",
    "Use pyramids, workers, ramps, ropes, stones, sleds, boats etc only if the narration or direction asks for them. Do not reuse generic people or temples for unrelated stories.",
    "Each shape kind must be rect, ellipse, polygon, line, or path. Use palette names only: paper, paperDark, cream, sand, gold, earth, terra, teal, shadow, ink, night, none.",
    "Include kind-specific coordinates. For rect use x,y,width,height; ellipse cx,cy,rx,ry; line x1,y1,x2,y2; polygon points e.g. '100,800 400,650 600,900'; path d e.g. 'M100 800L300 650L550 820Z'.",
    "Make actors recognizable from bodies, head, limbs and tools; use many composited shapes, not text-only cards.",
    "Use subtle motionX and motionY only for movable objects. Maintain historical plausibility; represent any speculative construction method as a theory.",
    "Do not change narration, draw only. Return exactly one entry per input scene, preserving its id and order.",
    "Scene requirements:",
    ...project.scenes.map((s,i)=>JSON.stringify({id:s.id,scene:i+1,narration:s.narration,visual:s.production?.visual||""})),
  ].join("\n");
  const messages=[{role:"user",content:instructions}];
  const schema=z.toJSONSchema(VisualPackageSchema);
  const req=await fetch(new URL("/api/chat",target).toString(),{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({model,messages,format:schema,stream:false,options:{temperature:0.35,num_predict:12000}}),
    signal:AbortSignal.timeout(600000),
  }).catch(e=>{throw new Error("Local Ollama is unavailable. Start Ollama and pull your selected model. "+String(e))});
  if(!req.ok)throw new Error("Local Ollama returned "+req.status+": "+(await req.text()).slice(0,200));
  const raw=((await req.json()) as {message?:{content?:string}}).message?.content ?? "";
  let data:unknown;
  try{data=JSON.parse(raw.replace(/^\x60\x60\x60(?:json)?/i,"").replace(/\x60\x60\x60\s*$/,"").trim());}
  catch{throw new Error("Local AI did not return valid illustration JSON. No project data changed.");}
  const result=VisualPackageSchema.safeParse(data);
  if(!result.success)throw new Error("Local AI artwork failed geometry validation: "+result.error.issues.slice(0,4).map(i=>i.path.join(".")+": "+i.message).join("; "));
  const ids=project.scenes.map(s=>s.id);
  if(JSON.stringify(result.data.scenes.map(s=>s.id))!==JSON.stringify(ids))throw new Error("Local AI changed scene IDs/order; no art applied.");
  return result.data;
};
