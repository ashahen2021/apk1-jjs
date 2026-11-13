import React from "react";
import type { Scene } from "../../../shared/schema.ts";
import { Label, Rule } from "../components/Print";
import { C, FONT_TITLE } from "../lib/theme";

export type TemplateProps = { scene: Scene; seed: number };

/** Deterministic seed from a scene id, so each scene gets its own terrain. */
export const seedOf = (id: string) => {
  let h = 7;
  for (let i = 0; i < id.length; i++) h = (Math.imul(h, 31) + id.charCodeAt(i)) >>> 0;
  return (h % 89) + 1;
};

/** Big serif title that shrinks to fit long text; optional second line. */
export const TitleBlock: React.FC<{ y?: number; title?: string; sub?: string; t: number; color?: string; max?: number }> = ({ y = 452, title, sub, t, color = C.ink, max = 84 }) => {
  if (!title && !sub) return null;
  const words = (title ?? "").toUpperCase();
  // split long titles over two lines at the middle space
  let lines = [words];
  if (words.length > 22 && words.includes(" ")) {
    const mid = words.length / 2;
    const idx = words.split("").reduce((best, ch, i) => (ch === " " && Math.abs(i - mid) < Math.abs(best - mid) ? i : best), -99);
    lines = [words.slice(0, idx), words.slice(idx + 1)];
  }
  const longest = Math.max(...lines.map((l) => l.length), 1);
  const size = Math.min(max, 940 / (longest * 0.7));
  const y0 = y - (lines.length - 1) * size * 1.12;
  return (
    <g opacity={t} transform={`translate(0 ${(1 - t) * 14})`}>
      {title && lines.map((l, i) => (
        <text key={i} x={540} y={y0 + i * size * 1.12} textAnchor="middle" fontFamily={FONT_TITLE} fontWeight={600} fontSize={size} fill={color} letterSpacing="0.09em">{l}</text>
      ))}
      <Rule x={540} y={y + 36} w={300} t={t} color={color} />
      {sub && <Label x={540} y={y + 88} text={sub.toUpperCase()} size={Math.min(24, 880 / (sub.length * 0.74))} spacing={0.2} color={color} />}
    </g>
  );
};

/** Small tracked caption used inside scenes (place names, dates). */
export const Caption: React.FC<{ label?: string; sub?: string; t: number; y?: number; color?: string }> = ({ label, sub, t, y = 372, color = C.ink }) => {
  if (!label && !sub) return null;
  return (
    <g opacity={t} transform={`translate(0 ${(1 - t) * 10})`}>
      {label && <Label x={540} y={y} text={label.toUpperCase()} size={Math.min(44, 900 / (label.length * 0.86))} spacing={0.26} weight={600} color={color} />}
      <Rule x={540} y={y + 28} w={220} t={t} color={color} />
      {sub && <Label x={540} y={y + 72} text={sub.toUpperCase()} size={Math.min(22, 880 / (sub.length * 0.74))} spacing={0.24} opacity={0.85} color={color} />}
    </g>
  );
};
