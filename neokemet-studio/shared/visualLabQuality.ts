/**
 * Visual Lab acceptance checks. Schema validity alone does not establish
 * that an SVG is legible, detailed or framed for a vertical Short.
 * This tests actual foreground geometry; a giant background rectangle is
 * intentionally excluded so an otherwise empty image cannot cheat the gate.
 */
import type { ArtElement, ArtShot } from "./visualLab.ts";

type Bounds={left:number;top:number;right:number;bottom:number};
export type IllustrationIssue={scene:string;shot:string;reason:string};
const finite=(...v:(number|undefined)[])=>v.every(x=>Number.isFinite(x));
const bounds=(shape:ArtElement):Bounds|null=>{
  if(shape.kind==="rect" && finite(shape.x,shape.y,shape.width,shape.height))
    return {left:shape.x!,top:shape.y!,right:shape.x!+shape.width!,bottom:shape.y!+shape.height!};
  if(shape.kind==="ellipse" && finite(shape.cx,shape.cy,shape.rx,shape.ry))
    return {left:shape.cx!-shape.rx!,top:shape.cy!-shape.ry!,right:shape.cx!+shape.rx!,bottom:shape.cy!+shape.ry!};
  if(shape.kind==="line" && finite(shape.x1,shape.y1,shape.x2,shape.y2))
    return {left:Math.min(shape.x1!,shape.x2!),top:Math.min(shape.y1!,shape.y2!),right:Math.max(shape.x1!,shape.x2!),bottom:Math.max(shape.y1!,shape.y2!)};
  if(shape.kind==="polygon" && shape.points){
    const pairs=shape.points.trim().split(/\s+/).map(p=>p.split(",").map(Number));
    if(pairs.length<3 || pairs.some(p=>p.length!==2||!finite(p[0],p[1])))return null;
    return {left:Math.min(...pairs.map(p=>p[0])),top:Math.min(...pairs.map(p=>p[1])),right:Math.max(...pairs.map(p=>p[0])),bottom:Math.max(...pairs.map(p=>p[1]))};
  }
  // Paths use a restricted grammar but can include relative coordinates; avoid
  // inventing exact bounds from unparsed commands. They still count as details.
  return null;
};
const isBackdrop=(shape:ArtElement,b:Bounds)=>shape.kind==="rect"&&(b.right-b.left)>=800&&(b.bottom-b.top)>=700;
const foreground=(shot:ArtShot):{width:number;height:number;parts:number;palette:number}=>{
  const items=shot.shapes.map(s=>({s,b:bounds(s)}))
    .filter((entry):entry is {s:ArtElement;b:Bounds}=>!!entry.b&&!isBackdrop(entry.s,entry.b));
  if(!items.length)return {width:0,height:0,parts:0,palette:0};
  const minX=Math.min(...items.map(x=>x.b.left)),maxX=Math.max(...items.map(x=>x.b.right));
  const minY=Math.min(...items.map(x=>x.b.top)),maxY=Math.max(...items.map(x=>x.b.bottom));
  const paints=new Set(shot.shapes.flatMap(s=>[s.fill,s.stroke]).filter(c=>c&&c!=="none"&&c!=="paper"&&c!=="paperDark"&&c!=="cream"));
  return {width:maxX-minX,height:maxY-minY,parts:shot.shapes.length,palette:paints.size};
};
export const auditIllustrations=(pack:{scenes:{id:string;shots:ArtShot[]}[]}):IllustrationIssue[]=>{
  const issues:IllustrationIssue[]=[];
  for(const scene of pack.scenes){
    const prior=new Set<string>();
    for(const [i,shot] of scene.shots.entries()){
      const shotName=shot.label||"Shot "+(i+1);
      const q=foreground(shot);
      if(q.parts<10)issues.push({scene:scene.id,shot:shotName,reason:"Too few illustrated elements ("+q.parts+"); add foreground objects and detail"});
      if(q.width<430||q.height<340)issues.push({scene:scene.id,shot:shotName,reason:"Tiny composition ("+Math.round(q.width)+" x "+Math.round(q.height)+"); occupy the central frame"});
      if(q.palette<3)issues.push({scene:scene.id,shot:shotName,reason:"Insufficient distinct mineral colours ("+q.palette+"); use a readable palette"});
      const fingerprint=JSON.stringify(shot.shapes);
      if(prior.has(fingerprint))issues.push({scene:scene.id,shot:shotName,reason:"Identical geometry to another shot in this scene"});
      prior.add(fingerprint);
    }
  }
  return issues;
};
