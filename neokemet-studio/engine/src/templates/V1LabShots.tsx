// Render only validated, declarative shapes. The model never injects SVG source or JavaScript.
// Coordinates use V1's 1080 x 1920 composition and project.json travels between computers.
import React from "react";
import { C } from "../lib/theme";
import type { ArtElement, ArtShot } from "../../../shared/visualLab.ts";

const color=(id: ArtElement["fill"] | ArtElement["stroke"])=>id==="none"?"none":C[id];
const draw=(shape:ArtElement,key:number,t:number)=>{
  const fill=color(shape.fill),stroke=color(shape.stroke),strokeWidth=shape.strokeWidth??0,opacity=shape.opacity??1;
  const props={fill,stroke,strokeWidth,opacity,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
  const transform=`translate(${Math.round((shape.motionX??0)*(t-.5))} ${Math.round((shape.motionY??0)*(t-.5))})`;
  let graphic:React.ReactNode;
  switch(shape.kind){
    case "rect": graphic=<rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} {...props}/>; break;
    case "ellipse":graphic=<ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...props}/>;break;
    case "line":graphic=<line x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} {...props}/>;break;
    case "polygon":graphic=<polygon points={shape.points} {...props}/>;break;
    case "path":graphic=<path d={shape.d} {...props}/>;break;
  }
  return <g key={key} transform={transform}>{graphic}</g>;
};
export const V1LabShots:React.FC<{shots:ArtShot[];frame:number;duration:number}> = ({shots,frame,duration})=>{
  const shotCount=shots.length;
  const raw=Math.max(0,Math.min(.999999,frame/Math.max(1,duration)));
  const pos=raw*shotCount,index=Math.floor(pos),t=pos-index;
  const current=shots[index]??shots[0];
  return <g>
    <rect x="0" y="0" width="1080" height="1920" fill={C.paper}/>
    <rect x="55" y="75" width="970" height="1380" rx="12" fill={C.cream} stroke={C.sand} strokeWidth="12"/>
    <g>{current.shapes.map((s,i)=>draw(s,i,t))}</g>
    <rect x="90" y="180" width="900" height="155" rx="14" fill={C.shadow}/>
    <text x="540" y="270" textAnchor="middle" fontSize={43} fontWeight="700" letterSpacing="1.2" fill={C.cream}>{current.label.toUpperCase()}</text>
    <path d="M135 355H945" stroke={C.gold} strokeWidth="8"/>
    <g>{shots.map((_,i)=><rect key={i} x={540-shots.length*33+i*66} y="1450" width="54" height="11" rx="4" fill={i===index?C.terra:C.sand}/>)}</g>
  </g>;
};
