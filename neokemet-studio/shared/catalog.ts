// The visual vocabulary of the studio. Shared by the engine (what to draw),
// the server (validation, Ollama schema) and the UI (selectors).

export const FORMATS = {
  "9:16": { width: 1080, height: 1920, label: "Vertical 9:16 (1080×1920)" },
  "16:9": { width: 1920, height: 1080, label: "Landscape 16:9 (1920×1080)" },
  "1:1": { width: 1080, height: 1080, label: "Square 1:1 (1080×1080)" },
} as const;
export type FormatId = keyof typeof FORMATS;
export const FORMAT_IDS = Object.keys(FORMATS) as [FormatId, ...FormatId[]];

export const FPS_OPTIONS = [24, 25, 30, 60] as const;

export const ENVIRONMENTS = {
  "theban-cliffs": "Theban limestone cliffs",
  "deir-el-bahari": "Deir el-Bahari with Hatshepsut's temple",
  "giza-pyramids": "Pyramids on the desert plateau",
  "nile-valley": "Nile valley with boats and palms",
  "temple-courtyard": "Temple courtyard with columns",
  village: "Mud-brick village below the hills",
  "open-desert": "Open desert and dunes",
  market: "Market street with stalls",
  "tomb-wall": "Painted tomb chamber wall",
} as const;
export type EnvId = keyof typeof ENVIRONMENTS;
export const ENV_IDS = Object.keys(ENVIRONMENTS) as [EnvId, ...EnvId[]];

export const CHARACTERS = {
  priest: "Priest (linen robe, teal sash)",
  pharaoh: "Pharaoh (nemes headdress, kilt)",
  noblewoman: "Noblewoman (long dress, wig)",
  scribe: "Scribe (kilt, palette)",
  bearer: "Bearer / workman (kilt)",
  villager: "Villager (galabeya, turban)",
  worker: "19th-century worker",
  brugsch: "19th-century official (dark coat, tarboosh)",
  kamal: "19th-century official (teal coat, tarboosh)",
} as const;
export type CharacterId = keyof typeof CHARACTERS;
export const CHARACTER_IDS = Object.keys(CHARACTERS) as [CharacterId, ...CharacterId[]];

export const ACTIONS = {
  stand: "Stand",
  walk: "Walk across",
  talk: "Talk / gesture",
  read: "Read a papyrus",
  torch: "Carry a torch",
  staff: "Hold a staff",
  point: "Point ahead",
} as const;
export type ActionId = keyof typeof ACTIONS;
export const ACTION_IDS = Object.keys(ACTIONS) as [ActionId, ...ActionId[]];

export const CAMERAS = {
  "push-in": "Slow push in",
  "pull-back": "Slow pull back",
  "pan-right": "Pan right",
  "pan-left": "Pan left",
  rise: "Rise (tilt up)",
  static: "Static",
} as const;
export type CameraId = keyof typeof CAMERAS;
export const CAMERA_IDS = Object.keys(CAMERAS) as [CameraId, ...CameraId[]];

export const PROPS = {
  coffin: "Royal coffin",
  papyrus: "Papyrus scroll",
  "canopic-jars": "Canopic jars",
  amulets: "Amulets (ankh, scarab, djed)",
  statue: "Seated statue",
  obelisk: "Obelisk",
  chest: "Treasure chest and vases",
} as const;
export type PropId = keyof typeof PROPS;
export const PROP_IDS = Object.keys(PROPS) as [PropId, ...PropId[]];

type TemplateInfo = {
  label: string;
  description: string;
  group: "Generic" | "Documentary" | "Royal Cache presets";
  uses: ("environment" | "cast" | "camera" | "label" | "sublabel" | "prop" | "variant")[];
  variants?: string[];
};

export const TEMPLATES = {
  title: { label: "Title card", group: "Generic", description: "Landscape with the film title set in the sky.", uses: ["environment", "camera", "label", "sublabel"] },
  landscape: { label: "Landscape", group: "Generic", description: "Establishing shot with multiplane parallax; small figures optional.", uses: ["environment", "cast", "camera", "label", "sublabel"] },
  characters: { label: "Characters", group: "Generic", description: "Up to five figures acting in the foreground of an environment.", uses: ["environment", "cast", "camera", "label"] },
  procession: { label: "Procession", group: "Generic", description: "A coffin carried on a bier by grounded bearers, with walkers ahead.", uses: ["environment", "cast", "camera", "label"] },
  artifact: { label: "Artifact", group: "Generic", description: "One object presented on paper with a soft glow.", uses: ["prop", "label", "sublabel"] },
  "tomb-interior": { label: "Tomb interior", group: "Generic", description: "Painted burial chamber with coffin and grave goods.", uses: ["variant", "label"], variants: ["intact", "looted"] },
  cutaway: { label: "Tomb cutaway", group: "Generic", description: "Section through rock: shaft, passages, chamber, torch-lit party.", uses: ["label", "sublabel"] },
  "coffin-chamber": { label: "Coffin chamber", group: "Generic", description: "Torchlight travelling along a row of coffins.", uses: ["label"] },
  map: { label: "Journey map", group: "Generic", description: "Dotted route drawn between three sites on a desert map.", uses: ["label", "sublabel"] },
  "end-card": { label: "End card", group: "Generic", description: "Closing landscape with end title and a credit line.", uses: ["environment", "label", "sublabel"] },
  "royal-pharaohs": { label: "Royal Pharaohs", group: "Documentary", description: "A pharaoh — seated, standing or as a colossal statue — in a cinematic setting, with a name plate.", uses: ["label", "sublabel"] },
  "tomb-robbery": { label: "Tomb Robbery", group: "Documentary", description: "A royal burial shown in order, then opened, looted or damaged. Schematic and restrained.", uses: ["label", "sublabel"] },
  "priests-rewrapping": { label: "Priests Rewrapping", group: "Documentary", description: "Priests of Amun inspect, rewrap, label or carry a royal burial in a work chamber.", uses: ["label", "sublabel"] },
  "rc-01": { label: "RC 01 · The Secret", group: "Royal Cache presets", description: "Cliff, slit and gold coffin; title.", uses: [] },
  "rc-02": { label: "RC 02 · The Looted Tombs", group: "Royal Cache presets", description: "Chamber dissolves from whole to broken.", uses: [] },
  "rc-03": { label: "RC 03 · Priests of Amun", group: "Royal Cache presets", description: "Two priests study a papyrus.", uses: [] },
  "rc-04": { label: "RC 04 · Rewrapped in Linen", group: "Royal Cache presets", description: "Top-down wrapping and repair.", uses: [] },
  "rc-05": { label: "RC 05 · Labels and Journeys", group: "Royal Cache presets", description: "Dockets and a dotted route.", uses: [] },
  "rc-06": { label: "RC 06 · Seti I and Ramesses II", group: "Royal Cache presets", description: "Two biers cross the desert.", uses: [] },
  "rc-07": { label: "RC 07 · Deir el-Bahari", group: "Royal Cache presets", description: "Rise from the Nile to the cliffs.", uses: ["label", "sublabel"] },
  "rc-08": { label: "RC 08 · TT320 cutaway", group: "Royal Cache presets", description: "Shaft, passages, Pinedjem II.", uses: ["label", "sublabel"] },
  "rc-09": { label: "RC 09 · More Than Fifty", group: "Royal Cache presets", description: "Ranks of coffins, 50+.", uses: [] },
  "rc-10": { label: "RC 10 · Sealed by Time", group: "Royal Cache presets", description: "Sand and stone close the opening.", uses: [] },
  "rc-11": { label: "RC 11 · The Family", group: "Royal Cache presets", description: "Village, goats, a lone figure.", uses: ["label", "sublabel"] },
  "rc-12": { label: "RC 12 · The Goat Legend", group: "Royal Cache presets", description: "Goat, shaft, rope and lantern.", uses: ["label", "sublabel"] },
  "rc-13": { label: "RC 13 · A Chamber of Kings", group: "Royal Cache presets", description: "Torch along royal coffins.", uses: [] },
  "rc-14": { label: "RC 14 · Clues in the Market", group: "Royal Cache presets", description: "Market, record card, trail.", uses: ["label", "sublabel"] },
  "rc-15": { label: "RC 15 · 1881", group: "Royal Cache presets", description: "The team arrives at the shaft.", uses: ["label", "sublabel"] },
  "rc-16": { label: "RC 16 · The Rushed Removal", group: "Royal Cache presets", description: "Hoisting coffins; blank records.", uses: ["label", "sublabel"] },
  "rc-17": { label: "RC 17 · Golden Parade", group: "Royal Cache presets", description: "Cairo 2021 from above.", uses: ["label", "sublabel"] },
  "rc-18": { label: "RC 18 · Hidden, Not Forgotten", group: "Royal Cache presets", description: "Coffin returns to the mountain; end title.", uses: [] },
} as const satisfies Record<string, TemplateInfo>;
export type TemplateId = keyof typeof TEMPLATES;
export const TEMPLATE_IDS = Object.keys(TEMPLATES) as [TemplateId, ...TemplateId[]];
export const GENERIC_TEMPLATE_IDS = TEMPLATE_IDS.filter((t) => !t.startsWith("rc-")) as [TemplateId, ...TemplateId[]];

/**
 * Template-specific, editable parameters. A template listed here gets these
 * fields in the storyboard; values are stored in scene.params. Every parameter
 * has a default, so a scene without params (or an older project) still renders.
 */
export type ParamDef =
  | { key: string; label: string; type: "select"; options: readonly string[]; default: string }
  | { key: string; label: string; type: "boolean"; default: boolean };

export const TEMPLATE_PARAMS: Partial<Record<TemplateId, readonly ParamDef[]>> = {
  "rc-07": [
    { key: "framing", label: "Framing", type: "select", options: ["original", "close-up", "wide"], default: "original" },
    { key: "movement", label: "Camera adjustment", type: "select", options: ["original", "push in", "pull back", "pan left", "pan right"], default: "original" },
    { key: "segment", label: "Portion of original animation", type: "select", options: ["full sequence", "opening half", "closing half"], default: "full sequence" },
    { key: "colourGrade", label: "Colour grade", type: "select", options: ["original", "warm dusk", "cool night"], default: "original" },
    { key: "showCustomLabel", label: "Display extra scene label", type: "boolean", default: false },
  ],
  "rc-08": [
    { key: "framing", label: "Framing", type: "select", options: ["original", "close-up", "wide"], default: "original" },
    { key: "movement", label: "Camera adjustment", type: "select", options: ["original", "push in", "pull back", "pan left", "pan right"], default: "original" },
    { key: "segment", label: "Portion of original animation", type: "select", options: ["full sequence", "opening half", "closing half"], default: "full sequence" },
    { key: "colourGrade", label: "Colour grade", type: "select", options: ["original", "warm dusk", "cool night"], default: "original" },
    { key: "showCustomLabel", label: "Display extra scene label", type: "boolean", default: false },
  ],
  "rc-11": [
    { key: "framing", label: "Framing", type: "select", options: ["original", "close-up", "wide"], default: "original" },
    { key: "movement", label: "Camera adjustment", type: "select", options: ["original", "push in", "pull back", "pan left", "pan right"], default: "original" },
    { key: "segment", label: "Portion of original animation", type: "select", options: ["full sequence", "opening half", "closing half"], default: "full sequence" },
    { key: "colourGrade", label: "Colour grade", type: "select", options: ["original", "warm dusk", "cool night"], default: "original" },
    { key: "showCustomLabel", label: "Display extra scene label", type: "boolean", default: false },
  ],
  "rc-12": [
    { key: "framing", label: "Framing", type: "select", options: ["original", "close-up", "wide"], default: "original" },
    { key: "movement", label: "Camera adjustment", type: "select", options: ["original", "push in", "pull back", "pan left", "pan right"], default: "original" },
    { key: "segment", label: "Portion of original animation", type: "select", options: ["full sequence", "opening half", "closing half"], default: "full sequence" },
    { key: "colourGrade", label: "Colour grade", type: "select", options: ["original", "warm dusk", "cool night"], default: "original" },
    { key: "showCustomLabel", label: "Display extra scene label", type: "boolean", default: false },
  ],
  "rc-14": [
    { key: "framing", label: "Framing", type: "select", options: ["original", "close-up", "wide"], default: "original" },
    { key: "movement", label: "Camera adjustment", type: "select", options: ["original", "push in", "pull back", "pan left", "pan right"], default: "original" },
    { key: "segment", label: "Portion of original animation", type: "select", options: ["full sequence", "opening half", "closing half"], default: "full sequence" },
    { key: "colourGrade", label: "Colour grade", type: "select", options: ["original", "warm dusk", "cool night"], default: "original" },
    { key: "showCustomLabel", label: "Display extra scene label", type: "boolean", default: false },
  ],
  "rc-15": [
    { key: "framing", label: "Framing", type: "select", options: ["original", "close-up", "wide"], default: "original" },
    { key: "movement", label: "Camera adjustment", type: "select", options: ["original", "push in", "pull back", "pan left", "pan right"], default: "original" },
    { key: "segment", label: "Portion of original animation", type: "select", options: ["full sequence", "opening half", "closing half"], default: "full sequence" },
    { key: "colourGrade", label: "Colour grade", type: "select", options: ["original", "warm dusk", "cool night"], default: "original" },
    { key: "showCustomLabel", label: "Display extra scene label", type: "boolean", default: false },
  ],
  "rc-16": [
    { key: "framing", label: "Framing", type: "select", options: ["original", "close-up", "wide"], default: "original" },
    { key: "movement", label: "Camera adjustment", type: "select", options: ["original", "push in", "pull back", "pan left", "pan right"], default: "original" },
    { key: "segment", label: "Portion of original animation", type: "select", options: ["full sequence", "opening half", "closing half"], default: "full sequence" },
    { key: "colourGrade", label: "Colour grade", type: "select", options: ["original", "warm dusk", "cool night"], default: "original" },
    { key: "showCustomLabel", label: "Display extra scene label", type: "boolean", default: false },
  ],
  "rc-17": [
    { key: "framing", label: "Framing", type: "select", options: ["original", "close-up", "wide"], default: "original" },
    { key: "movement", label: "Camera adjustment", type: "select", options: ["original", "push in", "pull back", "pan left", "pan right"], default: "original" },
    { key: "segment", label: "Portion of original animation", type: "select", options: ["full sequence", "opening half", "closing half"], default: "full sequence" },
    { key: "colourGrade", label: "Colour grade", type: "select", options: ["original", "warm dusk", "cool night"], default: "original" },
    { key: "showCustomLabel", label: "Display extra scene label", type: "boolean", default: false },
  ],
  "royal-pharaohs": [
    { key: "pharaohName", label: "Pharaoh", type: "select", options: ["Ramesses II", "Seti I", "Thutmose III", "Amenhotep I", "Seqenenre Tao", "Generic Pharaoh"], default: "Generic Pharaoh" },
    { key: "pose", label: "Pose", type: "select", options: ["seated", "standing", "statue close-up"], default: "seated" },
    { key: "environment", label: "Environment", type: "select", options: ["temple courtyard with columns", "theban limestone cliffs", "royal burial chamber", "desert plateau"], default: "temple courtyard with columns" },
    { key: "camera", label: "Camera", type: "select", options: ["slow push in", "pan left", "pan right", "rise"], default: "slow push in" },
  ],
  "tomb-robbery": [
    { key: "stage", label: "Stage", type: "select", options: ["intact", "opened", "looted", "damaged"], default: "looted" },
    { key: "environment", label: "Environment", type: "select", options: ["royal burial chamber", "hidden cliff tomb", "corridor with side chamber"], default: "royal burial chamber" },
    { key: "camera", label: "Camera", type: "select", options: ["slow push in", "pan right", "pan left"], default: "slow push in" },
    { key: "showTorch", label: "Show torch", type: "boolean", default: true },
    { key: "showScatteredObjects", label: "Show scattered objects", type: "boolean", default: true },
  ],
  "priests-rewrapping": [
    { key: "action", label: "Action", type: "select", options: ["inspect coffin", "rewrap mummy", "record labels", "carry remains"], default: "rewrap mummy" },
    { key: "environment", label: "Environment", type: "select", options: ["work chamber", "temple chamber", "burial preparation room"], default: "work chamber" },
    { key: "camera", label: "Camera", type: "select", options: ["slow push in", "pan left", "pan right"], default: "slow push in" },
  ],
};

export const CATALOG = { FORMATS, FPS_OPTIONS, ENVIRONMENTS, CHARACTERS, ACTIONS, CAMERAS, PROPS, TEMPLATES, TEMPLATE_PARAMS };
