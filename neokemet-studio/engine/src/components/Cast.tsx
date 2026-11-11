import React from "react";
import type { ActionId, CharacterId } from "../../../shared/catalog.ts";
import { mix, ramp } from "../lib/anim";
import { C } from "../lib/theme";
import { Flame, Glow } from "./Atmosphere";
import { Figure, GroundShadow, handPos, walkPhase } from "./Figures";

export type CastMember = { kind: CharacterId; action: ActionId };

const ROBES: Partial<Record<CharacterId, string[]>> = { villager: [C.earth, C.teal, C.gold], worker: [C.sand, C.paperDark, C.gold] };

/**
 * Places up to five characters on a ground line and animates each according
 * to its action. Walkers cross the stage with stride-matched steps; the rest
 * hold their marks with small gestures.
 */
export const Cast: React.FC<{ cast: CastMember[]; f: number; D: number; ground: number; h?: number; cx?: number; spread?: number; idp?: string }> = ({ cast, f, D, ground, h = 230, cx = 540, spread, idp = "cast" }) => {
  const n = cast.length;
  if (!n) return null;
  const gap = spread ?? Math.min(h * 0.92, 820 / Math.max(1, n));
  const standing = cast.filter((c) => c.action !== "walk").length;
  let si = 0, wi = 0;
  return (
    <g>
      {cast.map((m, i) => {
        const robe = ROBES[m.kind]?.[i % 3];
        const hh = h * (1 - (i % 3) * 0.035);
        if (m.action === "walk") {
          const speed = (1.35 * hh) / 150;
          const dist = f * speed;
          const x = cx - 420 - wi * hh * 0.62 + dist + (D > 0 ? 0 : 0);
          wi++;
          return (
            <g key={i}>
              <GroundShadow x={x + 8} y={ground} w={hh * 0.42} />
              <Figure x={x} y={ground} h={hh} kind={m.kind} robe={robe} phase={walkPhase(dist, hh) + i * 1.1} />
            </g>
          );
        }
        // standing actors face the centre of their group
        const x = cx + (si - (standing - 1) / 2) * gap;
        const dir: 1 | -1 = standing > 1 && si >= standing / 2 ? -1 : 1;
        si++;
        const breathe = Math.sin(f * 0.05 + i) * 0.6;
        const settle = ramp(f, 10 + i * 8, 46 + i * 8);
        let armF = 4, armB = -4, lean = 0;
        let extra: React.ReactNode = null;
        if (m.action === "talk") { armF = mix(6, 52 + Math.sin(f * 0.09 + i * 2) * 12, settle); lean = settle * 2; }
        if (m.action === "point") { armF = mix(6, 84, settle); lean = settle * 3; }
        if (m.action === "read") {
          armF = mix(10, 72, settle); armB = mix(-4, 34, settle);
          const hand = handPos(x, ground, hh, dir, armF);
          extra = (
            <g transform={`translate(${hand.x} ${hand.y}) scale(${(dir * hh) / 250} ${hh / 250})`} opacity={settle}>
              <rect x={-8} y={-8} width={mix(22, 96, settle)} height={74} fill={C.cream} stroke={C.gold} strokeWidth={2} />
              {[8, 20, 32, 44].map((y, k) => <rect key={y} x={4} y={y - 4} width={Math.max(0, mix(0, 70 - k * 9, settle))} height={3} fill={C.shadow} opacity={0.6} />)}
              <rect x={-12} y={-12} width={9} height={82} fill={C.earth} />
            </g>
          );
        }
        if (m.action === "staff") {
          armF = 62;
          const hand = handPos(x, ground, hh, dir, armF);
          extra = <rect x={hand.x - 3} y={hand.y - hh * 0.5} width={6} height={ground - hand.y + hh * 0.5} fill={C.earth} />;
        }
        if (m.action === "torch") {
          armF = 118;
          const hand = handPos(x, ground, hh, dir, armF);
          extra = (
            <g>
              <Glow id={`${idp}g${i}`} x={hand.x} y={hand.y - 26} r={hh * 1.1} f={f + i * 30} strength={0.45} />
              <rect x={hand.x - 3} y={hand.y - 26} width={6} height={36} fill={C.earth} />
              <Flame x={hand.x} y={hand.y - 24} f={f + i * 9} s={hh / 150} />
            </g>
          );
        }
        return (
          <g key={i}>
            <GroundShadow x={x + 10} y={ground} w={hh * 0.5} skew={hh * 0.12} />
            {m.action === "torch" && extra}
            <Figure x={x} y={ground + breathe} h={hh} kind={m.kind} dir={dir} robe={robe} armF={armF} armB={armB} lean={lean} />
            {m.action !== "torch" && extra}
          </g>
        );
      })}
    </g>
  );
};
