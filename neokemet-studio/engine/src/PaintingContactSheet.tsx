/** Contact sheet assembled by Remotion itself; no system FFmpeg dependency. */
import React from "react";
import { AbsoluteFill, Img } from "remotion";
export const PaintingContactSheet:React.FC<{images:string[]}> = ({images})=>
  <AbsoluteFill style={{backgroundColor:"#12100E",display:"grid",
    gridTemplateColumns:"repeat(4, 540px)",gridTemplateRows:"repeat(2, 960px)",
    overflow:"hidden"}}>
    {Array.from({length:8},(_,i)=>
      <div key={i} style={{width:540,height:960,overflow:"hidden",position:"relative"}}>
        {images[i] ? <Img src={images[i]}
          style={{width:540,height:960,objectFit:"fill",display:"block"}}/> : null}
      </div>)}
  </AbsoluteFill>;
