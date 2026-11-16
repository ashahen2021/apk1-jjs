// Offline storyboard planner: turns a plain script into scenes with sensible
// templates, environments and casts using keyword rules. No AI involved —
// it gives every imported script a usable first storyboard to edit.
import type { CameraId, CharacterId, EnvId, TemplateId } from "./catalog.ts";
import type { Scene } from "./schema.ts";

const ENV_RULES: [RegExp, EnvId][] = [
  [/pyramid|giza|khufu|khafre|menkaure|sphinx|saqqara|djoser/i, "giza-pyramids"],
  [/deir el-bahari|hatshepsut/i, "deir-el-bahari"],
  // "limestone" alone is not a place: Giza and Tura are limestone too.
  [/valley of the kings|cliff|thebes|theban|limestone (?:hills?|escarpment|mountain)/i, "theban-cliffs"],
  [/nile|river|boat|flood|barge|harbou?r|delta/i, "nile-valley"],
  [/temple|karnak|luxor|column|shrine|amun|sanctuary|pylon/i, "temple-courtyard"],
  [/village|town|house|famil|home|settlement|deir el-medina/i, "village"],
  [/market|trade|merchant|dealer|bazaar/i, "market"],
  [/desert|\bsands?\b|dune|caravan|oasis/i, "open-desert"],
];
const CAST_RULES: [RegExp, CharacterId][] = [
  [/pharaoh|king|ruler|ramesses|seti|tutankhamun|khufu|thutmose|amenhotep/i, "pharaoh"],
  [/queen|princess|hatshepsut|nefertiti|nefertari|cleopatra|noblewoman|wife/i, "noblewoman"],
  [/priest/i, "priest"],
  [/scribe|record|wrote|written|papyr|document|letter/i, "scribe"],
  [/worker|builder|labou?rer|mason|craftsm|artisan|hauled|carried|dragg/i, "bearer"],
  [/villager|farmer|local|peasant|herd/i, "villager"],
  [/archaeolog|egyptolog|excavat|carter|petrie|brugsch|inspector|nineteenth|19th|18\d\d|19\d\d/i, "brugsch"],
];
// Plural wording means a group: one lone figure cannot show "crews" or "priests".
const GROUP_RULES: Partial<Record<CharacterId, RegExp>> = {
  bearer: /workers|builders|labou?rers|masons|craftsmen|artisans|crews|teams of|gangs|haulers|stonecutters|quarrymen/i,
  priest: /priests/i,
  scribe: /scribes/i,
  villager: /villagers|farmers|locals|peasants|families/i,
  brugsch: /archaeologists|egyptologists|excavators|inspectors|officials/i,
};
const GROUP_ACTIONS = ["point", "staff", "talk", "stand"] as const;

/** First environment named in the text, if any. */
export const envFromText = (text: string): EnvId | undefined => ENV_RULES.find(([re]) => re.test(text))?.[1];

/**
 * Who the text puts on screen. A plural mention becomes a small group with
 * varied actions (three when it is the only kind, two beside other kinds).
 */
export const castFromText = (text: string, mode: "act" | "walk" = "act"): NonNullable<Scene["cast"]> => {
  const kinds = CAST_RULES.filter(([re]) => re.test(text)).map(([, k]) => k).slice(0, 3);
  const out: NonNullable<Scene["cast"]> = [];
  for (const kind of kinds) {
    const group = GROUP_RULES[kind]?.test(text) ?? false;
    const n = group ? (kinds.length === 1 ? 3 : 2) : 1;
    for (let j = 0; j < n && out.length < 4; j++) {
      const action = mode === "walk" ? "walk" : kind === "scribe" ? "read" : group ? GROUP_ACTIONS[out.length % GROUP_ACTIONS.length] : out.length === 0 ? "talk" : "stand";
      out.push({ kind, action });
    }
  }
  return out;
};

/** A file-style project name ("My_Film_Production") reads badly as a title card. */
export const displayTitle = (title: string) => title.replace(/_+/g, " ").replace(/\s+/g, " ").trim();

// ---- Building work: which construction picture the text asks for ----------
const BUILD_CUE = /\bramps?\b|\bsledges?\b|\bsleds?\b|sled runners?|\bquarr(?:y|ies|ied|ying)\b|stone barges?|(?:limestone|granite|stone|casing) blocks?/i;
const BUILD_VIEWS: [string, RegExp[]][] = [
  ["comparison", [/split.?(?:frame|screen)/i, /side.by.side/i, /compar(?:e|es|ing|ison)\b/i, /\bversus\b|\bvs\b/i, /two (?:halves|panels|registers)/i, /pyramid alone/i]],
  ["ramp growth", [/diagram/i, /\bscale\b/i, /height.marker|measur/i, /lengthen|longer and longer|bigger the ramp/i, /higher (?:stone )?courses|early courses/i, /side.view/i, /expanding|grows?\b|growing|growth/i]],
  ["quarry", [/\bquarr/i, /chisel|mallet|wedges?\b/i, /cut(?:ting)? (?:the |a )?(?:stone|blocks?|limestone|granite)/i, /bedrock|rock face/i]],
  ["river transport", [/\bbarges?\b/i, /\bboats?\b|\bships?\b/i, /\bnile\b|\briver\b|\bcanal\b/i, /harbou?r|\bquay\b|float(?:ed|ing)?\b/i]],
  ["hauling", [/\bsledges?\b|\bsleds?\b/i, /\bhaul/i, /\bropes?\b/i, /\btaut\b/i, /runners?\b/i, /\bpull(?:ed|ing|s)?\b|\bdragg?(?:ed|ing|s)?\b/i, /uphill|friction|weight/i]],
  ["ramp wide", [/silhouette|skyline/i, /\bbeside\b|alongside/i, /gigantic|giant ramp|enormous|colossal/i, /wide shot|establishing|panorama/i, /building site|construction site|worksite/i]],
];

/**
 * Parameters for the "construction" template when the text is about building
 * work (ramps, sledges, quarries, stone on the river); undefined otherwise.
 * The view is the one the text gives the most distinct cues for.
 */
export const constructionFromText = (text: string): Record<string, string | boolean> | undefined => {
  if (!BUILD_CUE.test(text)) return undefined;
  let view = "ramp wide", best = 0;
  for (const [name, cues] of BUILD_VIEWS) {
    const n = cues.filter((re) => re.test(text)).length;
    if (n > best) { best = n; view = name; }
  }
  const crew = /hundreds|dozens|thousands|large (?:crew|team|gang)|many (?:workers|men)|teams of|gangs of/i.test(text) ? "six" : /two (?:men|workers)|a pair of/i.test(text) ? "two" : "four";
  const stage = /nearly complete|almost (?:finished|complete)|near(?:ing)? the top|capstone/i.test(text) ? "nearly complete" : view !== "ramp growth" && /early courses|first courses|foundations?\b|lowest courses/i.test(text) ? "early" : "half built";
  return { view, crew, stage };
};

// ---- Boatbuilding: which shipyard picture the text asks for ---------------
const SHIP_CUE = /shipyards?|boatyards?|ship.?build|boat.?build|shipwrights?|\bhulls?\b|\bkeel\b|\bmasts?\b|\bslipway\b|(?:cargo|sailing|wooden|river|papyrus|funerary|completed|finished|seagoing) (?:boat|ship|vessel)s?|(?:assembl|launch|build|rigg)\w* (?:a |the |an? \w+ )?(?:boat|ship|vessel)|\b(?:boat|ship|vessel)s?\b[^.]*\bsail|\bsail(?:s|ing|ed)?\b[^.]*\b(?:boat|ship|vessel)/i;
const SHIP_VIEWS: [string, RegExp[]][] = [
  ["sailing", [/\bsail(?:s|ing|ed)?\b/i, /completed|finished/i, /\bcargo\b/i, /under (?:sail|way)|voyage|downstream|upstream|\bwind\b/i, /on the nile|open water|across the river/i, /steering oar|helmsman/i]],
  ["launch", [/launch/i, /slipway|slid(?:e|es|ing)\b/i, /into the (?:water|river|nile)/i, /\bpush(?:ed|ing|es)?\b/i]],
  ["rigging", [/\bmasts?\b/i, /rigging|rigged/i, /rais(?:e|ed|ing)\b|stepp?(?:ed|ing) the/i, /\bhoist/i, /yard.?arm|furled|\bstays?\b/i]],
  ["assembly", [/assembl/i, /\bropes?\b/i, /lash(?:ed|ing|ings)?\b|sewn|\bbound\b|\bbind/i, /planking|planked|fitting (?:the )?planks/i, /truss/i, /mallets?/i, /wooden tools/i]],
  ["frame", [/\bkeel\b/i, /\bribs?\b/i, /frame(?:work)?\b|skeleton/i, /\bstocks\b/i]],
  ["shaping", [/shap(?:e|ed|ing)\b/i, /\badzes?\b/i, /\bsaw(?:s|ing|n)\b/i, /carv|planing|smooth/i, /components?|\bplanks?\b|\bbeams?\b/i, /craftsmen|carpenters?/i]],
  ["timber", [/\blogs?\b/i, /cedar|acacia|sycamore/i, /fell(?:ed|ing)\b|unload|deliver|arriv/i, /\btimber\b/i, /lebanon|byblos/i]],
  ["shipyard", [/shipyards?|boatyards?/i, /beside the (?:nile|river)|riverbank|bank of/i, /wide shot|establishing|overview/i, /busy|bustling/i]],
];
export const shipyardFromText = (text: string): Record<string, string | boolean> | undefined => {
  if (!SHIP_CUE.test(text)) return undefined;
  let view = "shipyard", best = 0;
  for (const [name, cues] of SHIP_VIEWS) {
    const n = cues.filter((re) => re.test(text)).length;
    if (n > best) { best = n; view = name; }
  }
  const crew = /hundreds|dozens|large (?:crew|team|gang)|many (?:workers|men|craftsmen)|teams of|gangs of|busy|bustling/i.test(text) ? "six" : /two (?:men|workers|craftsmen)|a pair of/i.test(text) ? "two" : "four";
  return { view, crew };
};

/**
 * Work scenes drawn for real (building, boatbuilding): the template and its
 * parameters when the text is about one of them, undefined otherwise.
 */
export const workSceneFromText = (text: string): { template: TemplateId; params: Record<string, string | boolean> } | undefined => {
  const build = constructionFromText(text);
  if (build) return { template: "construction", params: build };
  const ship = shipyardFromText(text);
  if (ship) return { template: "shipyard", params: ship };
  return undefined;
};
export const WORK_TEMPLATES: readonly TemplateId[] = ["construction", "shipyard"];

const CAMERAS: CameraId[] = ["push-in", "pan-right", "rise", "pan-left", "pull-back"];

/**
 * One paragraph = one scene. Paragraphs are separated by one or more blank
 * lines (lines holding only spaces count as blank; Windows line endings are
 * fine). A paragraph is never split, whatever its length: its full text
 * becomes that scene's narration, with line breaks inside it joined by spaces.
 */
export const splitScript = (script: string): string[] =>
  script
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t]*(?:\n[ \t]*)+/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);

/** `filmEnv` is the place the film as a whole is about: used when a scene names no place of its own. */
export const planScene = (text: string, i: number, total: number, title: string, filmEnv?: EnvId): Scene => {
  const id = `s${String(i + 1).padStart(2, "0")}`;
  const env = ENV_RULES.find(([re]) => re.test(text))?.[1] ?? filmEnv;
  const kinds = CAST_RULES.filter(([re]) => re.test(text)).map(([, k]) => k).slice(0, 3);
  const camera = CAMERAS[i % CAMERAS.length];
  const base = { id, narration: text, camera, ambience: "auto" as const };
  if (i === 0) return { ...base, template: "title", environment: env ?? "theban-cliffs", label: displayTitle(title), camera: "push-in" };
  if (i === total - 1 && total > 2) return { ...base, template: "end-card", environment: env ?? "deir-el-bahari", label: displayTitle(title), camera: "pull-back" };
  let template: TemplateId = "landscape";
  let extra: Partial<Scene> = {};
  const work = workSceneFromText(text);
  if (work) { template = work.template; extra = { params: work.params }; }
  else if (/shaft|passage|corridor|underground|descend|beneath the|cut into the rock/i.test(text)) template = "cutaway";
  else if (/burial chamber|tomb|sarcophag|grave goods|treasure/i.test(text)) { template = "tomb-interior"; extra = { variant: /robb|loot|thie|stolen|plunder|broke/i.test(text) ? "looted" : "intact" }; }
  else if (/coffins|mummies|cache|rows of/i.test(text)) template = "coffin-chamber";
  else if (/procession|funeral|carried the|bier|cortege/i.test(text)) template = "procession";
  else if (/route|journey|travell?ed|expedition|moved (from|to)|transfer/i.test(text)) template = "map";
  else if (/amulet|scarab|ankh/i.test(text)) { template = "artifact"; extra = { prop: "amulets" }; }
  else if (/canopic/i.test(text)) { template = "artifact"; extra = { prop: "canopic-jars" }; }
  else if (/obelisk/i.test(text)) { template = "artifact"; extra = { prop: "obelisk" }; }
  else if (/statue|colossus/i.test(text)) { template = "artifact"; extra = { prop: "statue" }; }
  else if (/coffin|mummy|mask/i.test(text)) { template = "artifact"; extra = { prop: "coffin" }; }
  else if (/papyrus|scroll/i.test(text) && !kinds.length) { template = "artifact"; extra = { prop: "papyrus" }; }
  else if (kinds.length) template = "characters";
  const scene: Scene = { ...base, template, ...extra };
  if (template === "landscape" || template === "characters" || template === "procession") scene.environment = env ?? (template === "characters" ? "temple-courtyard" : "open-desert");
  if (template === "characters") scene.cast = castFromText(text);
  if (template === "landscape" && kinds.length) scene.cast = castFromText(text, "walk").slice(0, 3);
  if (template === "procession") scene.cast = [{ kind: "priest", action: "staff" }];
  return scene;
};

export const planFromScript = (title: string, script: string): Scene[] => {
  const chunks = splitScript(script);
  const filmEnv = envFromText(title + " " + script);
  return chunks.map((t, i) => planScene(t, i, chunks.length, title, filmEnv));
};
