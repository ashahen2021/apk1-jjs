import React from "react";
import { useSceneFrame } from "../../components/AnimatedScene";
import { Glow, SandDrift } from "../../components/Atmosphere";
import { Camera, Layer } from "../../components/Camera";
import { Figure, Goat, GroundShadow, handPos, walkPhase } from "../../components/Figures";
import { Cliff } from "../../components/Landscape";
import { Ground, Label, REllipse, RPoly, Rule } from "../../components/Print";
import { easeOut, lin, mix, ramp } from "../../lib/anim";
import { C } from "../../lib/theme";

const HX = 660, HY = 1196, RX = 104, RY = 34;

/** 01:50 — THE GOAT LEGEND. An anecdote, captioned as such on screen. */
export const Scene12Goat: React.FC = () => {
  const f = useSceneFrame();
  const G = 1190;
  // goat: wanders in, pauses at the rim, slips out of sight
  const gWalk = ramp(f, -6, 70, easeOut);
  const gx0 = mix(250, 548, gWalk);
  const pause = ramp(f, 66, 84) * (1 - ramp(f, 112, 122));
  const slip = ramp(f, 122, 152, (t) => t * t);
  const gx = gx0 + slip * 96;
  const gy = G + slip * 190;
  // owner: follows cautiously
  const oDist = ramp(f, 104, 214, (t) => t) * 420;
  const ox = 20 + oDist;
  const arrived = ramp(f, 208, 226);
  const rope = ramp(f, 224, 292);
  const lantern = handPos(ox, G, 176, 1, mix(48, 70, arrived));
  const coilHand = handPos(ox, G, 176, 1, mix(-12, 34, arrived));
  return (
    <Camera y={mix(-30, 60, ramp(f, 0, 290))} zoom={mix(1.0, 1.12, ramp(f, 0, 290))} cx={HX} cy={1150}>
      <Layer depth={0.75}>
        <Cliff id="s12c" x={-200} baseY={1110} w={1500} h={500} seed={19} peak={0.36} peakiness={0.3} screeH={0.3} />
      </Layer>
      <Layer depth={1}>
        <Ground y={1150} seed={5} dense={1.3} />
        {/* boulders */}
        <RPoly pts={[[120, 1170], [150, 1104], [220, 1090], [262, 1170]]} seed={3} fill={C.gold} />
        <RPoly pts={[[220, 1090], [262, 1170], [224, 1170]]} seed={4} fill={C.teal} opacity={0.75} />
        <RPoly pts={[[860, 1180], [880, 1120], [960, 1112], [1010, 1180]]} seed={5} fill={C.earth} />
        <RPoly pts={[[960, 1112], [1010, 1180], [968, 1180]]} seed={6} fill={C.shadow} opacity={0.6} />
        {/* the dark opening */}
        <REllipse cx={HX} cy={HY - 4} rx={RX + 16} ry={RY + 12} seed={7} fill={C.earth} amp={3} />
        <REllipse cx={HX} cy={HY} rx={RX} ry={RY} seed={8} fill={C.night} amp={2.4} />
        <defs>
          {/* anything below the rim is only visible inside the hole */}
          <clipPath id="s12clip">
            <path d={`M-400 -400H1500V${HY}H${HX + RX}A${RX} ${RY} 0 0 1 ${HX - RX} ${HY}H-400Z`} />
          </clipPath>
        </defs>
        <g clipPath="url(#s12clip)">
          {slip < 0.05 && <GroundShadow x={gx} y={G + 2} w={56} />}
          <g transform={`rotate(${slip * 34} ${gx} ${gy})`}>
            <Goat x={gx} y={gy} size={78} color={C.shadow} phase={slip > 0 ? undefined : (gx0 / 10) * (gWalk < 1 ? 1 : 0)} headDown={pause} />
          </g>
          {/* rope paid out into the shaft */}
          <path
            d={`M${coilHand.x} ${coilHand.y}Q${mix(coilHand.x, HX - 30, 0.6)} ${coilHand.y + 40 + Math.sin(f * 0.2) * 4} ${HX - 30} ${HY - 6}L${HX - 30 + Math.sin(f * 0.12) * 3} ${HY - 6 + rope * 150}`}
            stroke={C.sand} strokeWidth={4.5} fill="none" strokeLinecap="round" opacity={rope > 0 ? 1 : 0}
          />
        </g>
        {/* front lip of the hole, over the goat */}
        <path d={`M${HX - RX - 14} ${HY + 2}A${RX + 14} ${RY + 12} 0 0 0 ${HX + RX + 14} ${HY + 2}A${RX} ${RY} 0 0 1 ${HX - RX} ${HY}Z`} fill={C.earth} />
        {/* the owner */}
        <g opacity={ramp(f, 100, 112)}>
          <GroundShadow x={ox + 8} y={G} w={76} />
          <Glow id="s12lan" x={lantern.x} y={lantern.y + 26} r={mix(110, 170, arrived)} f={f} strength={0.5} />
          <Figure x={ox} y={G} h={176} kind="villager" robe={C.earth} phase={arrived < 1 && f > 104 && f < 214 ? walkPhase(oDist, 176) : undefined} armF={mix(48, 70, arrived)} armB={mix(-12, 34, arrived)} lean={arrived * 7} />
          {/* lantern */}
          <g transform={`translate(${lantern.x} ${lantern.y})`}>
            <path d="M0 0L0 10" stroke={C.shadow} strokeWidth={2.5} />
            <rect x={-10} y={10} width={20} height={28} fill={C.sand} stroke={C.shadow} strokeWidth={3} />
            <rect x={-12} y={36} width={24} height={5} fill={C.shadow} />
            <rect x={-4} y={18} width={8} height={12} fill={C.terra} />
          </g>
          {/* coil of rope, shrinking as it pays out */}
          <ellipse cx={coilHand.x} cy={coilHand.y + 6} rx={mix(17, 9, rope)} ry={mix(21, 11, rope)} fill="none" stroke={C.sand} strokeWidth={mix(8, 4, rope)} />
        </g>
        <SandDrift f={f} y={1140} h={110} seed={6} count={18} speed={0.5} opacity={0.4} />
      </Layer>
      {/* on-screen caveat: this is an anecdote */}
      <g opacity={ramp(f, 14, 44)}>
        <Label x={540} y={364} text="ACCORDING TO ONE ACCOUNT" size={31} spacing={0.3} weight={600} />
        <Rule x={540} y={392} w={210} />
        <Label x={540} y={436} text="A FAMOUS BUT UNCERTAIN STORY" size={21} spacing={0.28} opacity={0.8} />
      </g>
    </Camera>
  );
};
