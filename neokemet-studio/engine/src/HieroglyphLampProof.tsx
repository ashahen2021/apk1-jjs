import React from "react";
import { AbsoluteFill } from "remotion";
import { HieroglyphWallText } from "./templates/HieroglyphWall";
import { EgyptianOilLamp } from "./templates/EgyptianOilLamp";
import { tombPalette as P, tombTheme as T } from "./theme/tombPaintingFlat";

/** Verification composition; museum-style reference sheet, not a real Egyptian inscription. */
export const HieroglyphLampProof:React.FC=()=> <AbsoluteFill style={{backgroundColor:P.limestone}}>
  <svg viewBox="0 0 1080 1920" width="100%" height="100%">
    <rect x="0" y="0" width="1080" height="1920" fill={P.limestone}/>
    <text x="540" y="292" textAnchor="middle" fontSize="72" fontFamily={T.typography.fontFamily}
      fontWeight="bold" fill={P.carbonBlack}>GARDINER SIGN STUDY</text>
    <path d="M80 332H1000" fill="none" stroke={P.ochreRed} strokeWidth={T.outline.width}/>
    <HieroglyphWallText x={150} y={388} scale={2.45}/>
    <text x="540" y="1765" textAnchor="middle" fill={P.carbonBlack} fontSize="30"
      fontFamily="Arial, sans-serif">Simplified sign forms · Not an Egyptian inscription</text>
    <EgyptianOilLamp x={260} y={1435} variant="bowl" scale={1.42}/>
    <EgyptianOilLamp x={820} y={1330} variant="on-stand" scale={1.3}/>
    <text x="260" y="1650" textAnchor="middle" fontSize="35" fill={P.carbonBlack}>CLAY OIL BOWL</text>
    <text x="820" y="1650" textAnchor="middle" fontSize="35" fill={P.carbonBlack}>BOWL ON STAND</text>
  </svg>
</AbsoluteFill>;
