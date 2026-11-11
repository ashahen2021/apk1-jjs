import React from "react";
import { useSceneFrame } from "../components/AnimatedScene";
import { Birds, Glow, SandDrift } from "../components/Atmosphere";
import { Camera, Layer } from "../components/Camera";
import { CoffinTop } from "../components/Coffins";
import { Cliff, HatshepsutTemple, Ridge } from "../components/Landscape";
import { Ground, Label, Rule } from "../components/Print";
import { mix, ramp } from "../lib/anim";
import { C, FONT_TITLE } from "../lib/theme";

/** 02:50 — HIDDEN, NOT FORGOTTEN. One lit coffin returns to the mountain; end title. */
export const Scene18Hidden: React.FC = () => {
  const f = useSceneFrame();
  const back = ramp(f, 60, 150); // coffin → mountain
  const out = ramp(f, 40, 240);
  const land = ramp(f, 66, 140);
  const title = ramp(f, 150, 190);
  const credit = ramp(f, 196, 232);
  const SLX = 610, SLY = 1040;
  // quiet hold: after f=240 nothing moves but the paper grain
  const bf = Math.min(f, 238);
  return (
    <Camera zoom={mix(1.3, 1.0, out)} cx={SLX} cy={SLY}>
      <Layer depth={0.14} opacity={land}>
        <Ridge x={-300} y={1070} w={1700} h={90} seed={8} color={C.paperDark} />
      </Layer>
      <Layer depth={0.2}>
        <g opacity={land * (1 - ramp(f, 226, 240))}>
          <Birds f={bf} x={-60 + (bf - 70) * 3.6} y={640} seed={12} count={4} speed={0.5} spread={90} />
        </g>
      </Layer>
      <Layer depth={0.5} opacity={land}>
        <Cliff id="s18far" x={-320} baseY={1120} w={1760} h={360} seed={31} color={C.sand} shade={C.gold} scree={C.paperDark} peak={0.7} peakiness={0.35} strata={false} />
      </Layer>
      <Layer depth={0.85} opacity={land}>
        <Cliff id="s18main" x={-160} baseY={1160} w={1400} h={470} seed={17} peak={0.42} peakiness={0.5} screeH={0.3} />
        <rect x={SLX - 12} y={SLY - 40} width={24} height={64} fill={C.night} />
      </Layer>
      <Layer depth={1} opacity={land}>
        <HatshepsutTemple x={330} y={1166} s={0.72} />
        <Ground y={1166} seed={4} dense={1.2} />
        <SandDrift f={bf} y={1150} h={150} seed={7} count={24} speed={0.5} opacity={0.4 * (1 - ramp(f, 200, 240))} />
      </Layer>
      {/* the single softly lit coffin, receding into the cliff */}
      <Layer depth={0.85}>
        <g opacity={1 - ramp(f, 118, 150)}>
          <Glow id="s18g" x={SLX} y={mix(SLY - 60, SLY - 8, back)} r={mix(520, 60, back)} f={bf} strength={mix(0.55, 0.8, back)} />
          <CoffinTop x={SLX} y={mix(SLY - 60, SLY - 8, back)} h={mix(640, 56, back)} seed={3} tone="gold" royal />
        </g>
        <Glow id="s18g2" x={SLX} y={SLY - 8} r={46} f={0} strength={0.7 * ramp(f, 140, 170)} />
      </Layer>
      {/* end title */}
      <g opacity={title} transform={`translate(0 ${(1 - title) * 12})`}>
        <text x={540} y={404} textAnchor="middle" fontFamily={FONT_TITLE} fontWeight={600} fontSize={64} fill={C.ink} letterSpacing="0.09em">
          HIDDEN FOR CENTURIES.
        </text>
        <text x={540} y={484} textAnchor="middle" fontFamily={FONT_TITLE} fontWeight={600} fontSize={64} fill={C.ink} letterSpacing="0.09em">
          REMEMBERED FOREVER.
        </text>
        <Rule x={540} y={520} w={280} t={title} />
        <Label x={540} y={572} text="THE ROYAL CACHE — TT320" size={27} spacing={0.3} weight={600} />
      </g>
      <g opacity={credit * 0.9}>
        <Label x={540} y={1318} text="Historical basis: Royal Cache (TT320), Deir el-Bahari;" size={23} spacing={0.04} weight={500} />
        <Label x={540} y={1352} text="Egypt’s Ministry of Tourism and Antiquities." size={23} spacing={0.04} weight={500} />
      </g>
    </Camera>
  );
};
