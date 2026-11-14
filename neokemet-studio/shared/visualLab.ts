// V1 Visual Development Lab: typed, portable SVG scene-graph, no executable code.
// User-approved illustrations are stored in project.json, so a project can move PCs.
import { z } from "zod";
import type { Project, Scene } from "./schema.ts";

const PALETTE = ["paper","paperDark","cream","sand","gold","earth","terra","teal","shadow","ink","night","none"] as const;
const num = (min = -200, max = 2200) => z.number().finite().min(min).max(max);
export const ArtElementSchema = z.object({
  kind: z.enum(["rect","ellipse","line","polygon","path"]),
  x: num().optional(), y: num().optional(), width: num(0,2000).optional(), height: num(0,2000).optional(),
  cx: num().optional(), cy: num().optional(), rx: num(0,1500).optional(), ry: num(0,1500).optional(),
  x1: num().optional(), y1: num().optional(), x2: num().optional(), y2: num().optional(),
  // Coordinates and SVG path commands only: no CSS, URLs, scripts or foreign objects.
  points: z.string().min(3).max(1100).regex(/^[0-9.,+\-\s]+$/).optional(),
  d: z.string().min(3).max(1600).regex(/^[0-9eE.,+\-\sMLHVCSQTAZmlhvcsqtaz]+$/).optional(),
  fill: z.enum(PALETTE).default("sand"),
  stroke: z.enum(PALETTE).default("none"),
  strokeWidth: num(0,40).default(0),
  opacity: num(0,1).default(1),
  motionX: num(-200,200).default(0), motionY: num(-200,200).default(0),
}).strict();
export const ArtShotSchema = z.object({
  label: z.string().min(3).max(48),
  description: z.string().max(240).default(""),
  shapes: z.array(ArtElementSchema).min(4).max(60),
}).strict();
export type ArtShot = z.infer<typeof ArtShotSchema>;
export type ArtElement = z.infer<typeof ArtElementSchema>;
export const VisualPackageSchema = z.object({
  scenes: z.array(z.object({
    id: z.string().min(1).max(60),
    shots: z.array(ArtShotSchema).min(2).max(5)
  }).strict()).min(1).max(10)
}).strict();

const isRamp = (text: string) => /\b(?:ramp|ramps|slope|inclined|incline|mud.brick slope)\b/i.test(text)
  && /\b(?:pyramid|pyramids|stone|blocks?|khufu|egypt)\b/i.test(text);
const normalize = (s: Scene) => [s.narration,s.production?.visual || ""].join(" ");
const existingV1 = new Set(["lamp","pigments","artist","corridor","mural","reeds","strip","layer","press","scribe","quarry","load","ropes","sail","unload"]);
export const analyzeVisualLab = (p: Project) => {
  const full = [p.title,p.topic,p.script,...p.scenes.map(normalize)].join(" ");
  const ramp = isRamp(full);
  const rows = p.scenes.map((s,i) => {
    const fromText = normalize(s);
    const builtins = String(s.params?.shots ?? "").split(",").map(x=>x.trim()).filter(x=>existingV1.has(x));
    const custom = (s.artShots?.length ?? 0) > 0;
    const coverage = custom ? "custom" : ramp ? "missing" : builtins.length >= 2 && s.template === "v1-topic-short" ? "approximate" : "missing";
    return {
      id:s.id,scene:i+1,excerpt:s.narration.slice(0,125),
      coverage,subject:ramp?"Pyramid rising ramp":(p.topic||p.title||"Unclassified"),
      requested:fromText.slice(0,180),
      explanation:custom?"New illustrated shots already attached to this scene.":ramp
        ?"Ramp geometry, hauling ropes, changing pyramid height and workers need new illustrated shots."
        :coverage==="approximate"?"Uses existing V1 motifs; confirm they truly show the narrated action."
        :"No verified drawing set for this exact narration. Create new illustrations using local AI or a new offline recipe.",
    };
  });
  return {
    subject:ramp?"Pyramid rising ramp":p.topic||p.title,
    offlineAvailable:ramp,
    generated:rows.filter(r=>r.coverage==="custom").length,
    missing:rows.filter(r=>r.coverage==="missing").length,
    scenes:rows,
    advice:ramp?"Offline ramp illustrator available: generate new geometry and motion, inspect, then approve."
      :"No offline art recipe exists yet for this topic. If Ollama is installed, its local model can propose editable SVG drawings. Otherwise add a supported recipe or draw the missing shots manually.",
  };
};

const R=(x:number,y:number,width:number,height:number,fill:ArtElement["fill"],stroke:ArtElement["stroke"]="none"):ArtElement=>({
 kind:"rect",x,y,width,height,fill,stroke,strokeWidth:stroke==="none"?0:5,opacity:1,motionX:0,motionY:0,
});
const E=(cx:number,cy:number,rx:number,ry:number,fill:ArtElement["fill"]):ArtElement=>({
 kind:"ellipse",cx,cy,rx,ry,fill,stroke:"none",strokeWidth:0,opacity:1,motionX:0,motionY:0,
});
const P=(points:string,fill:ArtElement["fill"],stroke:ArtElement["stroke"]="none"):ArtElement=>({
 kind:"polygon",points,fill,stroke,strokeWidth:stroke==="none"?0:6,opacity:1,motionX:0,motionY:0,
});
const L=(x1:number,y1:number,x2:number,y2:number,stroke:ArtElement["stroke"],strokeWidth=9,motionX=0,motionY=0):ArtElement=>({
 kind:"line",x1,y1,x2,y2,fill:"none",stroke,strokeWidth,opacity:1,motionX,motionY,
});
const worker=(x:number,y:number,step:number):ArtElement[]=>[
 E(x,y-130,23,28,"earth"),
 L(x,y-102,x,y-25,"earth",18),
 L(x,y-75,x-32,y-32,"earth",13),
 L(x,y-75,x+28,y-48,"earth",13,step*4,0),
 L(x,y-25,x-19,y+34,"earth",15,step*5,0),
 L(x,y-25,x+23,y+34,"earth",15,-step*5,0),
 R(x-28,y-92,55,62,"cream"),
];
const pyramid=(tier:number):ArtElement[]=>{
 const top=730-60*tier, base=1320;
 const pts=`380,${base} 760,${top} 1050,${base}`;
 const out:ArtElement[]=[P(pts,"sand","earth")];
 for(let i=1;i<=3+tier;i++){
   const y=top+(base-top)*i/(4+tier),inset=(y-top)/(base-top);
   out.push(L(760-380*inset,y,760+290*inset,y,"earth",5));
 }
 return out;
};
const ramp=(height:number):ArtElement[]=>{
 const top=1270-height, xEnd=695, xBegin=90;
 return [
 P(`70,1350 ${xEnd},${top+68} ${xEnd},${top} 70,1275`,"terra","earth"),
 L(90,1250,xEnd,top+3,"gold",13),
 L(110,1290,xEnd,top+43,"cream",5),
 ];
};
const block=(x:number,y:number,motion=0):ArtElement[]=>[
 R(x,y,95,78,"sand","earth"),
 L(x+16,y+20,x+82,y+20,"paper",5),
 { ...L(x+48,y+2,x-70,y-75,"earth",7),motionX:motion,motionY:-motion/2 },
];
const base=():ArtElement[]=>[
 R(65,390,950,1035,"paperDark"),
 R(65,1285,950,142,"sand"),
 L(65,1284,1015,1284,"earth",12),
 E(880,490,88,88,"gold"),
];
type RampPhase = "intro"|"haul"|"growth"|"scale";
const stageShots=(phase:RampPhase,sceneIndex:number):ArtShot[]=>{
 const options=[
  {label:"A RAMP TO THE PYRAMID?",description:"Reveal the unfinished pyramid beside an earthen rising ramp", height:165,level:0},
  {label:"STONE BLOCKS GO UPHILL",description:"Workers haul a block by rope up a sloping embankment",height:250,level:1},
  {label:"AS THE PYRAMID ROSE",description:"Ramp grows together with the pyramid; moving stone on the slope",height:360,level:2},
  {label:"BUT HOW LARGE A RAMP?",description:"Wide view showing the ramp length and scale problem",height:490,level:3},
 ];
 const mapping: Record<RampPhase,number[]>={intro:[0,1,0],haul:[1,1,2],growth:[2,2,3],scale:[3,0,3]};
 return mapping[phase].map((k,variation)=>{
  const o=options[k],step=((sceneIndex+variation)%3)-1;
  const sh=base();
  sh.push(...pyramid(o.level));
  sh.push(...ramp(o.height));
  const stoneY=1190-o.height*0.55-variation*16;
  if(k!==3){sh.push(...block(370+variation*55,stoneY,12+variation*8));sh.push(...worker(220+variation*20,1140-variation*14,step));}
  else{
    sh.push(...worker(115,1320,.5));
    sh.push(L(85,1420,920,1420,"terra",15));
    sh.push(L(105,1460,105,1400,"ink",9),L(920,1460,920,1400,"ink",9));
    sh.push(...block(470,1050));
  }
  sh.push(L(80,1415,1000,1415,"teal",5));
  return ArtShotSchema.parse({label:o.label,description:o.description,shapes:sh});
 });
};
const selectPhase=(s:Scene,index:number,total:number):RampPhase=>{
 const t=normalize(s).toLowerCase();
 if(/(?:higher|larger|grew|grows|rise|longer|taller|enormous)/.test(t))return "growth";
 if(/(?:workers|pulled|hauling|blocks|stones|sled|ropes)/.test(t))return "haul";
 if(/(?:impossible|problem|huge|work|really|clever|theory|could)/.test(t)&&index>=total-2)return "scale";
 return index===0?"intro":index===total-1?"scale":"haul";
};
export const proposeOfflineRampArt=(p:Project)=>{
 const text=[p.title,p.topic,p.script,...p.scenes.map(normalize)].join(" ");
 if(!isRamp(text))throw new Error("This topic does not match the Pyramid Ramp offline illustrator. Run Analyze and choose the local Ollama option for other subjects.");
 if(p.scenes.length>10)throw new Error("Visual Lab supports up to 10 scenes per illustration batch.");
 return VisualPackageSchema.parse({scenes:p.scenes.map((scene,i)=>({
   id:scene.id,shots:stageShots(selectPhase(scene,i,p.scenes.length),i),
 }))});
};
