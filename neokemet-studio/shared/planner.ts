// Offline storyboard planner: turns a plain script into scenes with sensible
// templates, environments and casts using keyword rules. No AI involved —
// it gives every imported script a usable first storyboard to edit.
import type { CameraId, CharacterId, EnvId, TemplateId } from "./catalog.ts";
import type { Scene } from "./schema.ts";

const ENV_RULES: [RegExp, EnvId][] = [
  [/pyramid|giza|khufu|khafre|menkaure|sphinx|saqqara|djoser/i, "giza-pyramids"],
  [/deir el-bahari|hatshepsut/i, "deir-el-bahari"],
  [/valley of the kings|cliff|thebes|theban|limestone|quarr/i, "theban-cliffs"],
  [/nile|river|boat|flood|barge|harbou?r|delta/i, "nile-valley"],
  [/temple|karnak|luxor|column|shrine|amun|sanctuary|pylon/i, "temple-courtyard"],
  [/village|town|house|famil|home|settlement|deir el-medina/i, "village"],
  [/market|trade|merchant|dealer|bazaar/i, "market"],
  [/desert|sand|dune|caravan|oasis/i, "open-desert"],
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

export const planScene = (text: string, i: number, total: number, title: string): Scene => {
  const id = `s${String(i + 1).padStart(2, "0")}`;
  const env = ENV_RULES.find(([re]) => re.test(text))?.[1];
  const kinds = CAST_RULES.filter(([re]) => re.test(text)).map(([, k]) => k).slice(0, 3);
  const camera = CAMERAS[i % CAMERAS.length];
  const base = { id, narration: text, camera, ambience: "auto" as const };
  if (i === 0) return { ...base, template: "title", environment: env ?? "theban-cliffs", label: title, camera: "push-in" };
  if (i === total - 1 && total > 2) return { ...base, template: "end-card", environment: env ?? "deir-el-bahari", label: title, camera: "pull-back" };
  let template: TemplateId = "landscape";
  let extra: Partial<Scene> = {};
  if (/shaft|passage|corridor|underground|descend|beneath the|cut into the rock/i.test(text)) template = "cutaway";
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
  if (template === "characters") scene.cast = kinds.map((kind, k) => ({ kind, action: kind === "scribe" ? "read" : k === 0 ? "talk" : "stand" }));
  if (template === "landscape" && kinds.length) scene.cast = kinds.slice(0, 2).map((kind) => ({ kind, action: "walk" as const }));
  if (template === "procession") scene.cast = [{ kind: "priest", action: "staff" }];
  return scene;
};

export const planFromScript = (title: string, script: string): Scene[] => {
  const chunks = splitScript(script);
  return chunks.map((t, i) => planScene(t, i, chunks.length, title));
};
