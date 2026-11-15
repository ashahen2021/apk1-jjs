/**
 * Simple ancient Egyptian open oil-lamp: shallow clay bowl with oil and floating wick.
 * Bowl can sit on a tall, narrow stand. No modern gas/torch flame, no gradient.
 * Historical subject approximation rather than a reconstruction of one artefact.
 */
import React from "react";
import { tombPalette as P, tombTheme as T } from "../theme/tombPaintingFlat";

export type EgyptianLampVariant="bowl"|"on-stand";
export const EgyptianOilLamp:React.FC<{
 x?:number;y?:number;scale?:number;variant?:EgyptianLampVariant;flameFrame?:number;
}> = ({x=0,y=0,scale=1,variant="bowl",flameFrame=0})=>{
 const flicker=2*Math.sin(flameFrame/9);
 const outline={stroke:P.carbonBlack,strokeWidth:T.outline.width,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
 return <g data-prop="egyptian-clay-oil-lamp" data-lamp-variant={variant}
   transform={"translate("+x+" "+y+") scale("+scale+")"}>
   {variant==="on-stand" && <g data-part="tall-lamp-stand">
     <path d="M-26 22H26L18 213H-18Z" fill={P.ochreRed} {...outline}/>
     <path d="M-71 210H71V235H-71Z" fill={P.ochreRed} {...outline}/>
     <path d="M-48 16H48V31H-48Z" fill={P.yellowOchre} {...outline}/>
   </g>}
   {/* The oil surface is an open shallow bowl, not an upright torch. */}
   <g data-part="shallow-clay-bowl">
     <path d="M-97 -28Q-77 25 -10 32Q63 32 95 -28L84 -10Q46 14 0 15Q-52 14 -87 -10Z"
       fill={P.ochreRed} {...outline}/>
     <path d="M-97 -28Q0 -48 96 -28Q89 -11 0 -10Q-85 -10 -97 -28Z" fill={P.yellowOchre} {...outline}/>
     <path d="M-78 -29Q0 -42 82 -28" fill="none" {...outline}/>
   </g>
   <g data-part="floating-wick">
     <path d="M23 -27Q49 -27 70 -38Q78 -41 82 -54" fill="none" stroke={P.carbonBlack}
       strokeWidth={T.outline.width+1} strokeLinecap="round"/>
     <path d="M23 -28Q47 -32 68 -39" fill="none" stroke={P.gypsumWhite}
       strokeWidth={T.outline.width-1} strokeLinecap="round"/>
   </g>
   <g data-part="wick-flame" transform={"rotate("+flicker+" 82 -61)"}>
     <path d="M82 -56Q61 -76 80 -111Q99 -84 95 -67Q93 -55 82 -56Z"
       fill={P.yellowOchre} {...outline}/>
     <path d="M83 -60Q77 -77 84 -90Q90 -75 88 -64Z" fill={P.ochreRed} {...outline}/>
   </g>
 </g>;
};
