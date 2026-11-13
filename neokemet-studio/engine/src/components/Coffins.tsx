import React from "react";
import { C } from "../lib/theme";
import { hash } from "../lib/rng";

export type Tone = "gold" | "sand" | "earth" | "teal" | "cream";
const TONES: Record<Tone, { body: string; wig: string; b1: string; b2: string; face: string }> = {
  gold: { body: C.gold, wig: C.teal, b1: C.shadow, b2: C.terra, face: C.sand },
  sand: { body: C.sand, wig: C.shadow, b1: C.earth, b2: C.teal, face: C.cream },
  earth: { body: C.earth, wig: C.sand, b1: C.sand, b2: C.shadow, face: C.sand },
  teal: { body: C.teal, wig: C.gold, b1: C.sand, b2: C.terra, face: C.sand },
  cream: { body: C.paperDark, wig: C.teal, b1: C.gold, b2: C.terra, face: C.cream },
};
export const toneOf = (seed: number): Tone => (["gold", "sand", "earth", "gold", "cream", "teal", "sand"] as Tone[])[Math.floor(hash(seed, 91) * 7)];

/** Simplified rearing cobra (uraeus). Drawn around (0,0) = base of the hood. */
export const Uraeus: React.FC<{ x: number; y: number; s?: number; color?: string; accent?: string }> = ({ x, y, s = 1, color = C.gold, accent = C.terra }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-2.5 8Q-9 2 -7 -8Q-5 -17 0 -19Q5 -17 7 -8Q9 2 2.5 8Z" fill={color} />
    <path d="M-3 4Q-5 -4 0 -12Q5 -4 3 4Z" fill={accent} />
    <path d="M-3 -17Q-4 -25 1.5 -26Q6 -25 4 -20Q2 -17 0 -18Z" fill={color} />
    <rect x={1.6} y={-24} width={1.6} height={1.6} fill={C.shadow} />
  </g>
);

/**
 * Anthropoid coffin seen from the front / above. Unit box 100 × 300, centred
 * on (x, y). `seed` varies the bands so no two coffins are identical.
 */
export const CoffinTop: React.FC<{
  x: number;
  y: number;
  h?: number;
  rot?: number;
  seed?: number;
  tone?: Tone;
  royal?: boolean;
  opacity?: number;
  detail?: boolean;
}> = ({ x, y, h = 300, rot = 0, seed = 1, tone, royal = false, opacity, detail = true }) => {
  const t = TONES[tone ?? toneOf(seed)];
  const s = h / 300;
  const variant = Math.floor(hash(seed, 5) * 4);
  const bandYs = [18, 52, 86, 118].filter((_, i) => hash(seed + i, 7) > 0.25 || i === 0);
  const jx = (i: number) => (hash(seed * 3 + i, 11) - 0.5) * 1.6;
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot}) scale(${s})`} opacity={opacity}>
      {/* case */}
      <path
        d={`M${-19 + jx(0)} -143L0 -150L${19 + jx(1)} -143L33 -112L39 -72L44 -58L47 -48L${48 + jx(2)} -18L${23 + jx(3)} 132L21 150L-21 150L${-23 + jx(4)} 132L${-48 + jx(5)} -18L-47 -48L-44 -58L-39 -72L-33 -112Z`}
        fill={t.body}
      />
      {/* wig / nemes */}
      <path d="M-19 -143L0 -150L19 -143L33 -112L39 -72L44 -58L24 -52L18 -96L0 -84L-18 -96L-24 -52L-44 -58L-39 -72L-33 -112Z" fill={t.wig} />
      {detail && royal && (
        <path d="M-27 -122L-13 -134M-33 -106L-17 -120M-37 -90L-20 -104M-40 -74L-22 -88M27 -122L13 -134M33 -106L17 -120M37 -90L20 -104M40 -74L22 -88M-42 -62L-23 -72M42 -62L23 -72" stroke={t.face} strokeWidth={3.2} opacity={0.9} />
      )}
      {/* face */}
      <path d="M-15 -118Q-16 -134 0 -136Q16 -134 15 -118Q14 -96 0 -90Q-14 -96 -15 -118Z" fill={t.face} />
      {detail && <path d="M-2.5 -90L2.5 -90L1.8 -76L-1.8 -76Z" fill={t.wig} />}
      {/* broad collar */}
      {detail && (
        <>
          <path d="M-36 -56Q0 -22 36 -56L40 -44Q0 -4 -40 -44Z" fill={t.b1} />
          <path d="M-41 -40Q0 2 41 -40L43 -30Q0 14 -43 -30Z" fill={t.b2} />
          <path d="M-44 -26Q0 18 44 -26L45 -19Q0 26 -45 -19Z" fill={t.face} opacity={0.9} />
        </>
      )}
      {/* body decoration */}
      {detail && (variant === 0 || variant === 2) && <path d="M-5 30L5 30L4 140L-4 140Z" fill={t.b1} opacity={0.9} />}
      {detail &&
        bandYs.map((by, i) => {
          const w = 44 - (by + 18) * 0.165;
          return <path key={i} d={`M${-w} ${by}L${w} ${by}L${w - 1.2} ${by + 7}L${-w + 1.2} ${by + 7}Z`} fill={i % 2 ? t.b2 : t.b1} opacity={0.92} />;
        })}
      {detail && variant === 1 && <path d="M-30 30L0 46L30 30L0 62Z" fill={t.b2} opacity={0.85} />}
      {detail && variant === 3 && <path d="M-24 40L24 40L18 100L-18 100Z" fill={t.face} opacity={0.35} />}
      {/* foot board */}
      <path d="M-23 134L23 134L21 150L-21 150Z" fill={t.b1} opacity={0.8} />
      {royal && <Uraeus x={0} y={-132} s={1.15} color={C.sand} accent={C.terra} />}
    </g>
  );
};

/**
 * Coffin lying in profile. Unit box 300 × 70; origin = bottom centre.
 * Head is on the left unless `flip`.
 */
export const CoffinSide: React.FC<{
  x: number;
  y: number;
  len?: number;
  seed?: number;
  tone?: Tone;
  flip?: boolean;
  royal?: boolean;
  rot?: number;
  opacity?: number;
  lidShift?: number; // lid displaced upward / askew (looted)
}> = ({ x, y, len = 300, seed = 1, tone = "gold", flip, royal, rot = 0, opacity, lidShift = 0 }) => {
  const t = TONES[tone];
  const s = len / 300;
  const bands = [-58, -22, 14, 50, 86].filter((_, i) => hash(seed + i, 3) > 0.2);
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot}) scale(${(flip ? -1 : 1) * s} ${s})`} opacity={opacity}>
      {/* trough */}
      <path d="M-150 -34L150 -34L148 0L-148 0Z" fill={t.b1} />
      <path d="M-146 -27L146 -27L146 -20L-146 -20Z" fill={t.body} opacity={0.75} />
      <g transform={`translate(${lidShift * 5} ${-lidShift * 7}) rotate(${-lidShift * 2.4} 150 -34)`}>
        {/* lid profile: wig, face, chest, legs, upturned feet */}
        <path d="M-150 -34L-150 -52Q-146 -70 -128 -72Q-112 -73 -106 -64L-98 -62Q-92 -52 -84 -54Q-60 -64 -30 -60Q30 -54 96 -48L118 -47Q126 -62 138 -70L150 -68L150 -34Z" fill={t.body} />
        <path d="M-150 -34L-150 -52Q-146 -70 -128 -72Q-116 -72 -110 -67L-104 -44L-112 -34Z" fill={t.wig} />
        {royal && <path d="M-146 -46L-112 -50M-144 -56L-116 -60M-138 -65L-120 -67" stroke={t.face} strokeWidth={2.6} />}
        <path d="M-110 -67L-98 -62Q-95 -56 -98 -52L-106 -50Z" fill={t.face} />
        {bands.map((bx, i) => (
          <path key={i} d={`M${bx} -61L${bx + 9} -60L${bx + 9} -34L${bx} -34Z`} fill={i % 2 ? t.b2 : t.b1} opacity={0.9} />
        ))}
        <path d="M-84 -42L118 -42L118 -38L-84 -38Z" fill={t.face} opacity={0.75} />
        {royal && (
          <g transform="translate(-121 -72) rotate(-18)">
            <Uraeus x={0} y={0} s={0.6} color={t.body} accent={C.terra} />
          </g>
        )}
      </g>
    </g>
  );
};

/** Clean outline of the anthropoid case (unit box, centred), for rims and repairs. */
export const COFFIN_PTS: [number, number][] = [
  [0, -150], [19, -143], [33, -112], [39, -72], [44, -58], [47, -48], [48, -18], [23, 132], [21, 150],
  [-21, 150], [-23, 132], [-48, -18], [-47, -48], [-44, -58], [-39, -72], [-33, -112], [-19, -143], [0, -150],
];
