import React, { useMemo } from "react";
import { useSceneFrame } from "../components/AnimatedScene";
import { Dust } from "../components/Atmosphere";
import { Camera, Layer } from "../components/Camera";
import { CoffinTop, toneOf } from "../components/Coffins";
import { RRect, Streaks } from "../components/Print";
import { mix, pulse, ramp } from "../lib/anim";
import { hash } from "../lib/rng";
import { C, FONT_TITLE } from "../lib/theme";

const COLS = 5, ROWS = 11; // 55 burials: "more than fifty"

/** 01:20 — MORE THAN FIFTY. Ordered ranks of different coffins; kings are a minority. */
export const Scene09Fifty: React.FC = () => {
  const f = useSceneFrame();
  const pull = ramp(f, 0, 120);
  const sweep = ramp(f, 40, 290, (t) => t);
  const coffins = useMemo(
    () =>
      Array.from({ length: COLS * ROWS }, (_, i) => {
        const c = i % COLS, r = Math.floor(i / COLS);
        return {
          x: 212 + c * 164 + (hash(i, 1) - 0.5) * 14,
          y: 392 + r * 89 + (hash(i, 2) - 0.5) * 8,
          h: 168 * (0.72 + hash(i, 3) * 0.28),
          rot: (c % 2 ? 90 : -90) + (hash(i, 4) - 0.5) * 7,
          royal: hash(i, 5) > 0.76,
          seed: i * 7 + 3,
        };
      }),
    [],
  );
  const num = pulse(f, 50, 86, 150, 184);
  const bandX = mix(-700, 1500, sweep);
  return (
    <Camera zoom={mix(2.7, 1, pull)} cx={540} cy={836}>
      <Layer depth={1}>
        {/* rock-cut chamber floor */}
        <RRect x={84} y={316} w={912} h={1060} seed={3} fill={C.teal} amp={5} step={30} />
        <Streaks x={110} y={316} w={860} h={1060} seed={4} count={170} color={C.shadow} opacity={0.5} maxLen={260} thick={5} />
        <RRect x={84} y={316} w={912} h={1060} seed={3} fill="none" stroke={C.gold} strokeWidth={10} amp={5} step={30} />
        {coffins.map((c, i) => (
          <g key={i}>
            <ellipse cx={c.x + 5} cy={c.y + 7} rx={c.h * 0.5} ry={c.h * 0.17} fill={C.night} opacity={0.55} />
            <CoffinTop x={c.x} y={c.y} h={c.h} rot={c.rot} seed={c.seed} tone={toneOf(c.seed)} royal={c.royal} />
          </g>
        ))}
        {/* funerary objects along the walls */}
        {Array.from({ length: 12 }, (_, i) => {
          const left = i % 2 === 0;
          const y = 380 + Math.floor(i / 2) * 176 + hash(i, 9) * 30;
          const x = left ? 112 : 968;
          return i % 3 === 0 ? (
            <rect key={i} x={x - 14} y={y - 14} width={28} height={28} fill={C.gold} stroke={C.earth} strokeWidth={3} />
          ) : (
            <g key={i}>
              <circle cx={x} cy={y} r={11} fill={C.cream} stroke={C.sand} strokeWidth={2} />
              <circle cx={x} cy={y} r={4.5} fill={C.earth} />
            </g>
          );
        })}
        {/* darkness, with a staged band of light crossing the ranks */}
        <defs>
          <linearGradient id="s9light" gradientUnits="userSpaceOnUse" x1={bandX} y1={0} x2={bandX + 760} y2={300}>
            <stop offset="0" stopColor={C.night} stopOpacity={0.42} />
            <stop offset="0.5" stopColor={C.night} stopOpacity={0.0} />
            <stop offset="1" stopColor={C.night} stopOpacity={0.42} />
          </linearGradient>
          <linearGradient id="s9warm" gradientUnits="userSpaceOnUse" x1={bandX} y1={0} x2={bandX + 760} y2={300}>
            <stop offset="0.25" stopColor="#F3C877" stopOpacity={0} />
            <stop offset="0.5" stopColor="#F3C877" stopOpacity={0.22} />
            <stop offset="0.75" stopColor="#F3C877" stopOpacity={0} />
          </linearGradient>
        </defs>
        <rect x={-300} y={-300} width={1700} height={2500} fill="url(#s9light)" />
        <rect x={100} y={306} width={880} height={1080} fill="url(#s9warm)" />
        <Dust f={f} x={120} y={330} w={840} h={1030} seed={5} count={36} color={C.sand} opacity={0.5} />
      </Layer>
      <g opacity={num}>
        <rect x={330} y={700} width={420} height={250} fill={C.night} opacity={0.62} />
        <text x={540} y={890} textAnchor="middle" fontFamily={FONT_TITLE} fontWeight={600} fontSize={210} fill={C.cream} letterSpacing="0.02em">
          50+
        </text>
      </g>
    </Camera>
  );
};
