// Shared constants: palette, canvas and timing.
export const C = {
  paper: "#F8EBD2",
  sand: "#E1BF87",
  gold: "#CA9856",
  earth: "#A86D3B",
  teal: "#54716A",
  shadow: "#2D4845",
  terra: "#CB664F",
  // supporting tints derived from the palette
  cream: "#FBF3E2",
  paperDark: "#EEDDB9",
  ink: "#3B332C", // warm charcoal for type
  night: "#22393A",
} as const;

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const SCENE_FRAMES = 300; // 10 s
export const SCENE_COUNT = 18;
export const TOTAL_FRAMES = SCENE_FRAMES * SCENE_COUNT; // 5400
/** Frames a scene is mounted before its stated timestamp, for the cross-dissolve. */
export const LEAD = 6;

// Platform safe zones (top / bottom 15 %).
export const SAFE_TOP = Math.round(H * 0.15);
export const SAFE_BOTTOM = Math.round(H * 0.85);

export const FONT_TITLE = "Cormorant Garamond";
export const FONT_LABEL = "Josefin Sans";
