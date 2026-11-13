import React from "react";
import { useSceneFrame } from "../../components/AnimatedScene";
import { Birds, Glow, SandDrift } from "../../components/Atmosphere";
import { Camera, Layer } from "../../components/Camera";
import { CoffinTop } from "../../components/Coffins";
import { Cliff, Palm, Pyramid, Ridge } from "../../components/Landscape";
import { Ground, Label, RPoly, Rule } from "../../components/Print";
import { mix, ramp } from "../../lib/anim";
import { C, FONT_TITLE } from "../../lib/theme";

/** 00:00 — THE SECRET. Empty paper → Theban cliff → the slit and the gold coffin. */
export const Scene01Secret: React.FC = () => {
  const f = useSceneFrame();
  const push = ramp(f, 20, 290);
  const open = ramp(f, 158, 205);
  const beam = ramp(f, 185, 235);
  const title = ramp(f, 208, 250);
  const slitX = 566;
  const slitY = 1010;
  const slitW = 62 * open;
  return (
    <Camera zoom={mix(1, 1.42, push)} x={mix(-40, 14, push)} y={mix(-30, 26, push)} cx={slitX} cy={slitY}>
      <Layer depth={0.12} opacity={ramp(f, 4, 50)}>
        <Ridge x={-200} y={1030} w={1500} h={90} seed={4} color={C.paperDark} />
        {/* generic symbol of ancient Egypt, far away — not the site of the cache */}
        <Pyramid x={84} y={1046} w={124} seed={2} opacity={0.8} />
        <Pyramid x={184} y={1048} w={72} seed={3} opacity={0.65} />
      </Layer>
      <Layer depth={0.35} opacity={ramp(f, 14, 62)}>
        <Cliff id="s1far2" x={820} baseY={1090} w={620} h={240} seed={15} color={C.sand} shade={C.gold} scree={C.paperDark} peak={0.7} peakiness={0.4} strata={false} />
      </Layer>
      <Layer depth={0.8} opacity={ramp(f, 26, 78)}>
        <Cliff id="s1main" x={250} baseY={1135} w={800} h={470} seed={7} peak={0.52} peakiness={0.55} />
      </Layer>
      <Layer depth={0.8} opacity={ramp(f, 26, 78)}>
        {/* the slit */}
        <defs>
          <clipPath id="s1slit">
            <rect x={slitX - slitW / 2} y={slitY - 86} width={slitW} height={172} />
          </clipPath>
        </defs>
        <RPoly pts={[[slitX - slitW / 2 - 2, slitY - 88], [slitX + slitW / 2 + 2, slitY - 92], [slitX + slitW / 2 + 1, slitY + 88], [slitX - slitW / 2 - 1, slitY + 88]]} seed={41} amp={open * 2} fill={C.shadow} opacity={open > 0.02 ? 1 : 0} />
        <g clipPath="url(#s1slit)">
          <Glow id="s1glow" x={slitX} y={slitY} r={120} f={f} strength={0.85 * beam} />
          <CoffinTop x={slitX} y={slitY + 6} h={138} seed={3} tone="gold" royal opacity={mix(0.25, 1, beam)} />
        </g>
        {/* thin beam of gold */}
        <path d={`M${slitX + 330} ${slitY - 620}L${slitX + 352} ${slitY - 616}L${slitX + 16} ${slitY + 40}L${slitX - 14} ${slitY - 30}Z`} fill="#F1C76E" opacity={0.42 * beam} />
        <path d={`M${slitX + 338} ${slitY - 618}L${slitX + 344} ${slitY - 617}L${slitX + 4} ${slitY + 10}L${slitX - 4} ${slitY - 10}Z`} fill={C.cream} opacity={0.6 * beam} />
      </Layer>
      <Layer depth={1} opacity={ramp(f, 34, 86)}>
        <Ground y={1138} seed={5} />
        <SandDrift f={f} y={1120} h={170} seed={3} count={34} opacity={0.5} />
      </Layer>
      <Layer depth={0.25}>
        <Birds f={f} x={90} y={700} seed={2} count={3} speed={0.45} spread={70} />
      </Layer>
      <Layer depth={1.5} opacity={ramp(f, 40, 95)}>
        <Palm x={950} y={1500} h={560} f={f} seed={5} lean={-40} />
        <Palm x={1040} y={1560} h={380} f={f} seed={8} lean={-24} />
      </Layer>
      {/* title, outside the camera */}
      <g opacity={title} transform={`translate(0 ${(1 - title) * 14})`}>
        <text x={540} y={452} textAnchor="middle" fontFamily={FONT_TITLE} fontWeight={600} fontSize={84} fill={C.ink} letterSpacing="0.1em">
          THE ROYAL CACHE
        </text>
        <Rule x={540} y={488} w={300} t={title} />
        <Label x={540} y={540} text="THE SECRET TOMB OF EGYPT’S GREATEST PHARAOHS" size={22} spacing={0.2} />
      </g>
    </Camera>
  );
};
