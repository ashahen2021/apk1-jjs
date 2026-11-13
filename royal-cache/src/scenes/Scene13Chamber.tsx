import React from "react";
import { useSceneFrame } from "../components/AnimatedScene";
import { Dust, Flame, Glow } from "../components/Atmosphere";
import { Camera, Layer } from "../components/Camera";
import { CoffinTop, Tone } from "../components/Coffins";
import { Figure, handPos, walkPhase } from "../components/Figures";
import { RRect, Streaks } from "../components/Print";
import { mix, ramp } from "../lib/anim";
import { noise1 } from "../lib/rng";
import { C } from "../lib/theme";

const ROW: { x: number; h: number; tone: Tone; royal: boolean; lean: number }[] = [
  { x: 250, h: 520, tone: "earth", royal: false, lean: -3 },
  { x: 500, h: 560, tone: "gold", royal: true, lean: 2 },
  { x: 750, h: 500, tone: "cream", royal: false, lean: -2 },
  { x: 1000, h: 580, tone: "teal", royal: true, lean: 3 },
  { x: 1250, h: 540, tone: "sand", royal: true, lean: -2 },
  { x: 1500, h: 510, tone: "earth", royal: false, lean: 2 },
  { x: 1750, h: 570, tone: "cream", royal: true, lean: -3 },
];
const KING = { x: 2080, h: 760 };
const FLOOR = 1262;

/** 02:00 — A CHAMBER OF KINGS. Torchlight travels along a row of royal coffins. */
export const Scene13Chamber: React.FC = () => {
  const f = useSceneFrame();
  const travel = ramp(f, 4, 232, (t) => t * t * (3 - 2 * t));
  const dist = travel * 1560;
  const px = 150 + dist; // torch-bearer
  const end = ramp(f, 226, 286);
  const torch = handPos(px, FLOOR + 96, 320, 1, 122);
  const tx = torch.x + 14, ty = torch.y - 34;
  const R = (330 + noise1(f * 0.3, 4) * 14) * mix(1, 2.3, end);
  const camX = mix(px - 420, KING.x - 540, end);
  return (
    <Camera x={camX} zoom={mix(1.0, 1.08, end)} cy={900}>
      <Layer depth={1}>
        {/* rock-cut wall and floor */}
        <RRect x={-400} y={300} w={3200} h={980} seed={3} fill={C.teal} amp={4} step={40} />
        <Streaks x={-400} y={300} w={3200} h={980} seed={4} count={420} color={C.shadow} opacity={0.5} maxLen={320} thick={6} />
        <Streaks x={-400} y={300} w={3200} h={980} seed={5} count={160} color={C.gold} opacity={0.25} maxLen={200} thick={3} />
        <RRect x={-400} y={FLOOR} w={3200} h={420} seed={6} fill={C.earth} amp={4} step={40} />
        <Streaks x={-400} y={FLOOR + 6} w={3200} h={400} seed={7} count={220} color={C.gold} opacity={0.5} maxLen={260} thick={5} />
        {/* the row */}
        {ROW.map((c, i) => (
          <g key={i}>
            <ellipse cx={c.x + 10} cy={FLOOR + 4} rx={c.h * 0.2} ry={12} fill={C.night} opacity={0.6} />
            <CoffinTop x={c.x} y={FLOOR - c.h / 2 + 4} h={c.h} rot={c.lean} seed={i * 5 + 2} tone={c.tone} royal={c.royal} />
          </g>
        ))}
        {/* the striking royal coffin at the end of the passage */}
        <RRect x={KING.x - 190} y={FLOOR - 16} w={380} h={22} seed={9} fill={C.gold} amp={1.5} />
        <CoffinTop x={KING.x} y={FLOOR - 16 - KING.h / 2} h={KING.h} seed={3} tone="gold" royal />
        {/* small objects on the floor */}
        {[380, 880, 1380, 1640, 1900].map((x, i) => (
          <path key={x} d={`M${x - 12} ${FLOOR + 4}L${x - 8} ${FLOOR - 26}L${x - 4} ${FLOOR - 34}L${x + 4} ${FLOOR - 34}L${x + 8} ${FLOOR - 26}L${x + 12} ${FLOOR + 4}Z`} fill={i % 2 ? C.cream : C.gold} />
        ))}
        {/* darkness with a moving pool of light */}
        <defs>
          <radialGradient id="s13hole" gradientUnits="userSpaceOnUse" cx={tx} cy={ty} r={R}>
            <stop offset="0" stopColor="#000" />
            <stop offset="0.55" stopColor="#000" stopOpacity={0.85} />
            <stop offset="1" stopColor="#000" stopOpacity={0} />
          </radialGradient>
          <mask id="s13mask" maskUnits="userSpaceOnUse" x={-400} y={0} width={3200} height={1920}>
            <rect x={-400} y={0} width={3200} height={1920} fill="#fff" />
            <circle cx={tx} cy={ty} r={R} fill="url(#s13hole)" />
          </mask>
        </defs>
        <rect x={-400} y={0} width={3200} height={1920} fill={C.night} opacity={mix(0.94, 0.8, end)} mask="url(#s13mask)" />
        <Glow id="s13glow" x={tx} y={ty} r={R * 0.9} f={f} strength={0.34} />
        <Dust f={f} x={tx - R * 0.8} y={ty - R * 0.7} w={R * 1.6} h={R * 1.4} seed={4} count={44} color="#F6D58C" opacity={0.75} />
      </Layer>
      <Layer depth={1.12}>
        {/* the finder, seen from behind the light: a silhouette with a torch */}
        <Figure x={px} y={FLOOR + 96} h={320} kind="villager" silhouette={C.night} phase={travel > 0 && travel < 1 ? walkPhase(dist, 320) : undefined} armF={122} />
        <g transform={`translate(${torch.x} ${torch.y})`}>
          <rect x={8} y={-34} width={9} height={60} fill={C.night} transform="rotate(12)" />
          <Flame x={14} y={-32} f={f} s={1.7} />
        </g>
      </Layer>
    </Camera>
  );
};
