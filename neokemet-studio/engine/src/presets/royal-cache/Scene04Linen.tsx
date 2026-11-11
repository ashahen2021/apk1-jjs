import React from "react";
import { useSceneFrame } from "../../components/AnimatedScene";
import { Dust } from "../../components/Atmosphere";
import { Camera, Layer } from "../../components/Camera";
import { COFFIN_PTS, CoffinTop } from "../../components/Coffins";
import { RRect, Streaks } from "../../components/Print";
import { alongPath, mix, ramp } from "../../lib/anim";
import { C } from "../../lib/theme";

/** Person seen from directly above: shoulders, shaved head, two reaching arms. */
const TopFigure: React.FC<{ x: number; y: number; side: 1 | -1; reachX: number; reachY: number; sway: number }> = ({ x, y, side, reachX, reachY, sway }) => (
  <g>
    <ellipse cx={x + 6} cy={y + 8 * side} rx={62} ry={30} fill={C.shadow} opacity={0.16} />
    <path d={`M${x - 26} ${y}L${reachX - 16 + sway} ${reachY}`} stroke={C.earth} strokeWidth={13} strokeLinecap="round" />
    <path d={`M${x + 26} ${y}L${reachX + 18 - sway} ${reachY}`} stroke={C.earth} strokeWidth={13} strokeLinecap="round" />
    <ellipse cx={x} cy={y} rx={54} ry={27} fill={C.cream} stroke={C.sand} strokeWidth={2.5} />
    <path d={`M${x - 30} ${y + side * 4}Q${x} ${y + side * 30} ${x + 30} ${y + side * 4}`} stroke={C.teal} strokeWidth={9} fill="none" />
    <circle cx={x} cy={y - side * 2} r={21} fill={C.earth} />
  </g>
);

const BODY = "M212 660Q212 618 262 618Q306 618 314 640Q330 590 392 588L600 606L836 622Q872 626 872 660Q872 694 836 698L600 714L392 732Q330 730 314 680Q306 702 262 702Q212 702 212 660Z";

/** 00:30 — REWRAPPED IN LINEN. Abstract top-down view: fresh bands, a repaired gold rim. */
export const Scene04Linen: React.FC = () => {
  const f = useSceneFrame();
  const N = 10;
  const bandT = (i: number) => ramp(f, 34 + i * 17, 56 + i * 17);
  const wrap = ramp(f, 34, 34 + N * 17 + 10, (t) => t);
  const wx = mix(826, 372, wrap); // where the wrapping is happening
  const sway = Math.sin(f * 0.37) * 12 * (wrap > 0 && wrap < 1 ? 1 : 0.15);
  const repair = ramp(f, 70, 262, (t) => t);
  // coffin lid lies horizontally: unit (px,py) → world
  const LX = 540, LY = 1126, LS = 590 / 300;
  const rim = COFFIN_PTS.map(([px, py]) => [LX - py * LS * 1.07, LY + px * LS * 1.16] as [number, number]);
  const rimD = rim.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("") + "Z";
  const brush = alongPath(rim, repair);
  return (
    <Camera zoom={mix(1.05, 1.0, ramp(f, 0, 300))} cy={860}>
      <Layer depth={1}>
        {/* woven mat and bier */}
        <RRect x={96} y={420} w={888} h={480} seed={3} fill={C.paperDark} amp={4} step={20} />
        <Streaks x={96} y={420} w={888} h={480} seed={4} count={150} color={C.sand} opacity={0.6} maxLen={220} thick={3} />
        <RRect x={160} y={540} w={760} h={240} seed={5} fill={C.earth} amp={2} />
        <RRect x={182} y={560} w={716} h={200} seed={6} fill={C.gold} amp={1.5} />
        {[150, 930].map((x) => [552, 768].map((y) => <rect key={`${x}${y}`} x={x - 14} y={y - 14} width={28} height={28} fill={C.shadow} />))}
        {/* wrapped form — an outline only, no remains */}
        <defs>
          <clipPath id="s4body">
            <path d={BODY} />
          </clipPath>
        </defs>
        <path d={BODY} fill={C.sand} />
        <g clipPath="url(#s4body)">
          <Streaks x={212} y={588} w={660} h={144} seed={8} count={40} color={C.gold} opacity={0.5} maxLen={90} thick={2} />
          {Array.from({ length: N }, (_, i) => {
            const t = bandT(i);
            const x = 818 - i * 50;
            return (
              <g key={i}>
                <path d={`M${x} 560L${x + 40} 560L${x + 40 - 56 * 1} ${560 + 200 * t}L${x - 56} ${560 + 200 * t}Z`} fill={C.cream} opacity={t > 0 ? 1 : 0}
                  transform={`translate(${-56 * 0} 0)`} />
                <path d={`M${x} 560L${x - 56 * t} ${560 + 200 * t}`} stroke={C.gold} strokeWidth={2} opacity={t > 0 ? 0.9 : 0} />
              </g>
            );
          })}
        </g>
        {/* the free end of the linen band, passed between the two wrappers */}
        <path
          d={`M${wx + 10} 588Q${wx + 40 + sway} 540 ${wx + 16 - sway * 0.6} 500Q${wx - 8 + sway * 0.5} 470 ${wx + 30} 452`}
          stroke={C.sand} strokeWidth={24} fill="none" strokeLinecap="round" opacity={wrap < 1 ? 1 : 1 - ramp(f, 214, 236)}
        />
        <path
          d={`M${wx + 10} 588Q${wx + 40 + sway} 540 ${wx + 16 - sway * 0.6} 500Q${wx - 8 + sway * 0.5} 470 ${wx + 30} 452`}
          stroke={C.cream} strokeWidth={19} fill="none" strokeLinecap="round" opacity={wrap < 1 ? 1 : 1 - ramp(f, 214, 236)}
        />
        <TopFigure x={wx + 40} y={462} side={1} reachX={wx + 18} reachY={548} sway={sway} />
        <TopFigure x={wx - 30} y={862} side={-1} reachX={wx - 24} reachY={772} sway={-sway} />
        {/* roll of fresh linen */}
        <g transform="translate(905 470)">
          <ellipse rx={36} ry={36} fill={C.cream} stroke={C.sand} strokeWidth={3} />
          <ellipse rx={22} ry={22} fill="none" stroke={C.sand} strokeWidth={2} />
          <ellipse rx={9} ry={9} fill={C.sand} />
        </g>
      </Layer>
      <Layer depth={1.06}>
        {/* coffin lid whose gold border is being repaired */}
        <ellipse cx={LX + 8} cy={LY + 16} rx={320} ry={110} fill={C.shadow} opacity={0.12} />
        <CoffinTop x={LX} y={LY} h={590} rot={-90} seed={6} tone="teal" royal />
        <path d={rimD} fill="none" stroke={C.earth} strokeWidth={5} strokeDasharray="10 14" opacity={0.55} />
        <path d={rimD} fill="none" stroke={C.gold} strokeWidth={10} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - repair} strokeLinejoin="round" />
        <path d={rimD} fill="none" stroke={C.cream} strokeWidth={2.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - repair} opacity={0.8} />
        {/* brush */}
        <g transform={`translate(${brush.x} ${brush.y}) rotate(${-38 + Math.sin(f * 0.3) * 5})`} opacity={1 - ramp(f, 262, 282)}>
          <path d="M-5 0L5 0L4 -16L-4 -16Z" fill={C.gold} />
          <rect x={-5} y={-24} width={10} height={9} fill={C.shadow} />
          <rect x={-3.5} y={-98} width={7} height={76} fill={C.earth} />
        </g>
        {/* pot of gold pigment */}
        <g transform="translate(905 1290)">
          <ellipse rx={34} ry={34} fill={C.earth} />
          <ellipse rx={24} ry={24} fill={C.gold} />
        </g>
      </Layer>
      <Dust f={f} x={100} y={420} w={880} h={860} seed={4} count={20} color={C.gold} opacity={0.4} />
    </Camera>
  );
};
