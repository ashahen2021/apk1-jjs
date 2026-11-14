/** Gardiner sign columns for tomb-wall illustration, not a translated inscription. */
import React from "react";
import { GARDINER_SIGNS, type GardinerCode } from "../data/hieroglyphSigns";
import { tombPalette as P, tombTheme as T } from "../theme/tombPaintingFlat";

const COLUMNS:readonly (readonly GardinerCode[])[] = [
  ["A1","G17","M17","N35","F35"],
  ["D4","D21","Q3","S34","R8"],
];
export const HieroglyphSign:React.FC<{code:GardinerCode;x?:number;y?:number;width?:number;height?:number}> =
({code,x=0,y=0,width=72,height=82})=>{
  const sign=GARDINER_SIGNS[code];
  return <svg data-gardiner={code} x={x} y={y} width={width} height={height} viewBox="0 0 100 100"
    overflow="visible" role="img" aria-label={sign.gardiner+" "+sign.name}>
    <g stroke={P.carbonBlack} strokeWidth={T.outline.width} strokeLinecap="round" strokeLinejoin="round">
      {sign.paths.map((part,i)=><path key={i} d={part.d}
        fill={part.fill ? P[sign.ink] : "none"} />)}
    </g>
  </svg>;
};

/** Two vertical sign-study columns; thin rules, no fictitious phonetic text. */
export const HieroglyphWallText:React.FC<{x?:number;y?:number;scale?:number;columns?:readonly (readonly GardinerCode[])[]}> =
({x=706,y=450,scale=1,columns=COLUMNS})=>{
  const pitchX=148,pitchY=111,margin=22;
  const maxRows=Math.max(...columns.map(c=>c.length),0);
  return <g data-wall="gardiner-sign-columns" data-purpose="illustrative-signs-not-transliteration"
    transform={"translate("+x+" "+y+") scale("+scale+")"}>
    {columns.map((signs,col)=><g key={col} data-column={col+1}>
      <path d={"M"+(col*pitchX-margin)+" 0V"+(maxRows*pitchY+8)} fill="none"
        stroke={P.carbonBlack} strokeWidth={T.outline.width*.8}/>
      {signs.map((code,row)=><HieroglyphSign key={code+"-"+row} code={code}
        x={col*pitchX+20} y={row*pitchY+5} width={87} height={88}/>)}
    </g>)}
    <path d={"M"+(columns.length*pitchX-margin)+" 0V"+(maxRows*pitchY+8)} fill="none"
      stroke={P.carbonBlack} strokeWidth={T.outline.width*.8}/>
  </g>;
};
export const DEFAULT_GARDINER_COLUMNS=COLUMNS;
