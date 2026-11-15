// Project-portable SVG layers drawn with Tomb Painting Flat theme.
// No arbitrary SVG source, CSS, gradients or free-form colors are accepted.
import React from "react";
import type { ArtElement, ArtShot } from "../../../shared/visualLab.ts";
import { getSceneLightingMode, tombLegacyColor, tombTheme as T, tombPalette as P } from "../theme/tombPaintingFlat";
import { TombSceneStyle, TombSceneTitle, TombCameraPush, TombRegister, TombWall } from "./TombPaintingParts";

const draw=(shape:ArtElement,index:number,t:number):React.ReactNode=>{
  const outlined={
    fill:shape.fill==="none"?"none":tombLegacyColor(shape.fill),
    stroke:shape.stroke==="none"?P.carbonBlack:tombLegacyColor(shape.stroke),
    strokeWidth:Math.min(40,Math.max(T.outline.width,shape.strokeWidth??T.outline.width)),
    strokeLinejoin:"round" as const,
    strokeLinecap:"round" as const,
    opacity:shape.opacity??1,
  };
  const tx=Math.round((shape.motionX??0)*(t-.5)),ty=Math.round((shape.motionY??0)*(t-.5));
  const el=(()=>{
    switch(shape.kind){
      case "rect": return <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} {...outlined}/>;
      case "ellipse":return <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...outlined}/>;
      case "line":return <line x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} {...outlined} fill="none"/>;
      case "polygon":return <polygon points={shape.points} {...outlined}/>;
      case "path":return <path d={shape.d} {...outlined}/>;
    }
  })();
  return <g key={index} transform={"translate("+tx+" "+ty+")"}>{el}</g>;
};
export const V1LabShots:React.FC<{shots:ArtShot[];frame:number;duration:number;narration?:string;captionActive?:boolean}> = ({shots,frame,duration,narration="",captionActive=false})=>{
  const raw=Math.min(.999999,Math.max(0,frame/Math.max(1,duration)));
  // Show each bespoke beat at Short cadence; a 3.75s scene shows 3 distinct 1.25s shots.
  const count=Math.max(1,Math.min(shots.length,Math.ceil((duration/30)/1.6)));
  const pos=raw*count,index=Math.floor(pos),t=pos-index;
  const shot=shots[index]??shots[0];
  const mode=getSceneLightingMode([narration,shot.description,shot.label].join(" "));
  return <g>
    <TombSceneStyle mode={mode} lightX={T.glow.centerX} lightY={T.glow.centerY}>
      <TombCameraPush frame={frame} duration={duration}>
        {/* A full-bleed authentic stone environment remains visible in safe zones.
            The bespoke focal art is painted on top; no blank black bands. */}
        <TombWall/>
        <g data-artwork="bespoke-svg" data-safe-zone="350-1225">
          {shot.shapes.map((shape,i)=>draw(shape,i,t))}
        </g>
        <TombRegister/>
      </TombCameraPush>
    </TombSceneStyle>
    <TombSceneTitle title={shot.label} mode={mode} visible={!captionActive}/>
  </g>;
};