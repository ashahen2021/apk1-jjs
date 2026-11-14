/**
 * Tomb Painting Flat — the single source of truth for V1 illustrated Shorts.
 * Fixed Egyptian mural palette, full-bleed geometry and two lighting modes.
 * V3 / old Royal Cache palettes are deliberately not changed.
 */
export const tombPalette = {
  limestone: "#E9DCC0",
  gypsumWhite: "#F4EFE3",
  yellowOchre: "#D9A441",
  ochreRed: "#B5452B",
  egyptianBlue: "#2E6DA4",
  malachiteGreen: "#3E8E6E",
  carbonBlack: "#1B1A17",
  tombDark: "#12100E",
} as const;
export type TombColor = keyof typeof tombPalette;
export type TombLightingMode = "day" | "tomb";

export const tombTheme = {
  name: "Tomb Painting Flat",
  width: 1080,
  height: 1920,
  fps: 30,
  palette: tombPalette,
  outline: { color: tombPalette.carbonBlack, width: 5, min: 4, max: 6, join: "round", cap: "round" },
  texture: { color: tombPalette.carbonBlack, opacity: 0.04, count: 220, seed: 71 },
  glow: { radius: 710, centerX: 540, centerY: 920, innerDarkness: 0, outerDarkness: 0.81 },
  typography: { top: 230, titleSize: 56, labelMaxWidth: 940, baseline: 1750 },
  composition: { safeLeft: 72, safeRight: 72, actionTop: 380, actionBottom: 1830, fullBleed: true },
  lighting: {
    day: { background: tombPalette.limestone, outsideGlowBrightness: 1 },
    tomb: { background: tombPalette.tombDark, outsideGlowBrightness: 0.19 },
  },
} as const;

const darknessTerms = /\b(tomb|burial|hidden chamber|shaft|cave|underground|dark(?:ness)?|night|lamplight|lamps?|torch(?:es)?|coffin|crypt|inside the mountain|underworld|passage|corridor)\b/i;
export const getSceneLightingMode = (
  input: string | { narration?: string; label?: string; sublabel?: string; topic?: string; params?: Record<string,unknown>; production?: { visual?: string } }
): TombLightingMode => {
  if (typeof input !== "string") {
    const explicit = input.params?.lighting;
    if (explicit === "day" || explicit === "tomb") return explicit;
    input = [input.narration,input.label,input.sublabel,input.topic,input.production?.visual].filter(Boolean).join(" ");
  }
  return darknessTerms.test(input) ? "tomb" : "day";
};
export const getSceneBackground = (mode: TombLightingMode) => tombTheme.lighting[mode].background;
export const getOutlineProps = () => ({
  stroke: tombTheme.outline.color,
  strokeWidth: tombTheme.outline.width,
  strokeLinejoin: tombTheme.outline.join,
  strokeLinecap: tombTheme.outline.cap,
} as const);
export const getGlowProps = (mode: TombLightingMode, cx: number = tombTheme.glow.centerX, cy: number = tombTheme.glow.centerY) => ({
  enabled: mode === "tomb",
  cx, cy,
  radius: tombTheme.glow.radius,
  outsideBrightness: tombTheme.lighting[mode].outsideGlowBrightness,
  overlay: tombPalette.tombDark,
});
/** Backward-compatible V1 Visual Lab palette tokens are resolved here, not in templates. */
export const tombLegacyColor = (key: string): string => {
  const map: Record<string,TombColor> = {
    paper:"limestone",paperDark:"limestone",cream:"gypsumWhite",sand:"yellowOchre",
    gold:"yellowOchre",earth:"ochreRed",terra:"ochreRed",teal:"malachiteGreen",
    shadow:"carbonBlack",ink:"carbonBlack",night:"tombDark",none:"carbonBlack",
  };
  if (key === "none") return "none";
  return tombPalette[map[key] ?? (key in tombPalette ? key as TombColor : "carbonBlack")];
};
/** Pure deterministic 4% mineral flecks, never paper scratches. */
export const stoneNoisePath = (seed = tombTheme.texture.seed): string => {
  let v=seed>>>0;const rand=()=>{v=(Math.imul(v,1664525)+1013904223)>>>0;return v/4294967296};
  let d="";
  for(let i=0;i<tombTheme.texture.count;i++){
    const x=Math.floor(rand()*tombTheme.width), y=Math.floor(rand()*tombTheme.height);
    const n=1+rand()*4;
    d+=`M${x} ${y}h${n.toFixed(1)}v${Math.max(1,n*.55).toFixed(1)}h-${n.toFixed(1)}Z`;
  }
  return d;
};
