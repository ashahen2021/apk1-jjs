// Reuse eight original, hand-directed Royal Cache shots without redrawing them.
// With no (or default) parameters the original scene is rendered unchanged.
// Optional framing, movement, segment and colour grade make the same artwork
// useful in a longer documentary. Production notes and narration are untouched.
import React, { useContext } from "react";
import { ClockCtx } from "../components/AnimatedScene";
import { Scene07DeirElBahari } from "../presets/royal-cache/Scene07DeirElBahari";
import { Scene08TT320 } from "../presets/royal-cache/Scene08TT320";
import { Scene11Family } from "../presets/royal-cache/Scene11Family";
import { Scene12Goat } from "../presets/royal-cache/Scene12Goat";
import { Scene14Market } from "../presets/royal-cache/Scene14Market";
import { Scene15Revealed } from "../presets/royal-cache/Scene15Revealed";
import { Scene16Removal } from "../presets/royal-cache/Scene16Removal";
import { Scene17Parade } from "../presets/royal-cache/Scene17Parade";
import { paramOf } from "../../../shared/params.ts";
import type { TemplateProps } from "./common";
import { Caption } from "./common";
import { C } from "../lib/theme";

const SHOTS: Record<string, React.FC> = {
  "rc-07": Scene07DeirElBahari,
  "rc-08": Scene08TT320,
  "rc-11": Scene11Family,
  "rc-12": Scene12Goat,
  "rc-14": Scene14Market,
  "rc-15": Scene15Revealed,
  "rc-16": Scene16Removal,
  "rc-17": Scene17Parade,
};

const ease = (p: number) => {
  const t = Math.max(0, Math.min(1, p));
  return t * t * (3 - 2 * t);
};

/**
 * The underlying 300-frame preset is unchanged, and is only time-windowed
 * when the editor explicitly chooses an opening/closing segment. Never use
 * this for the first appearance of a scene without previewing the result.
 */
export const ReusableRoyalCacheShot: React.FC<TemplateProps> = ({ scene }) => {
  const clock = useContext(ClockCtx);
  const Shot = SHOTS[scene.template];
  if (!Shot) return null;

  const framing = paramOf(scene, "framing");
  const movement = paramOf(scene, "movement");
  const segment = paramOf(scene, "segment");
  const colourGrade = paramOf(scene, "colourGrade");
  const showCustomLabel = paramOf<boolean>(scene, "showCustomLabel");

  // Prevent any incidental visual difference in old projects (no params).
  const unchanged = framing === "original" && movement === "original" &&
    segment === "full sequence" && colourGrade === "original" && !showCustomLabel;
  if (unchanged) return <Shot />;

  const p = ease(clock.D > 0 ? clock.f / clock.D : 0);
  const adjustedClock = segment === "opening half"
    ? { ...clock, f: clock.f * 0.5 }
    : segment === "closing half"
      ? { ...clock, f: clock.D * 0.5 + clock.f * 0.5 }
      : clock;

  const startZoom = framing === "close-up" ? 1.24 : framing === "wide" ? 0.94 : 1;
  const movementZoom = movement === "push in" ? 1 + p * 0.12 : movement === "pull back" ? 1.12 - p * 0.12 : 1;
  const z = startZoom * movementZoom;
  const pan = movement === "pan left" ? 72 - 144 * p : movement === "pan right" ? -72 + 144 * p : 0;

  const filter = colourGrade === "warm dusk"
    ? { fill: "#BA713F", opacity: 0.12 }
    : colourGrade === "cool night"
      ? { fill: "#142C45", opacity: 0.22 }
      : null;

  // Art is authored in the 1080x1920 shared stage and clipped by AnimatedScene.
  return (
    <ClockCtx.Provider value={adjustedClock}>
      <g transform={"translate("+(540+pan)+" 960) scale("+z+") translate(-540 -960)"}>
        <Shot />
      </g>
      {filter && <rect x={-900} y={-600} width={3000} height={4200} fill={filter.fill} opacity={filter.opacity} pointerEvents="none" />}
      {showCustomLabel && scene.label && (
        <Caption label={scene.label} sub={scene.sublabel} y={1070} t={Math.min(1, Math.max(0, (clock.f - 8) / 22))} color={C.ink} />
      )}
    </ClockCtx.Provider>
  );
};
