// What the templates can actually draw, in a small shared vocabulary.
//
// Each capability is one thing a director might ask for, with the words that
// ask for it. Each template declares which capabilities it shows. The intent
// validator (shared/intent.ts) compares the two; nothing here changes a scene.
//
// To maintain:
//   * a new template must be added to TEMPLATE_CAPABILITIES (the compiler insists);
//   * a new capability is one line in VOCABULARY, then listed on the templates that draw it;
//   * a capability that no template lists is, by definition, "unsupported".
import type { ActionId, CharacterId, EnvId, PropId, TemplateId } from "./catalog.ts";

type Kind = "environment" | "figure" | "action" | "prop";
type Term = { kind: Kind; label: string; cue: RegExp };

export const VOCABULARY = {
  // ---- environments ----
  cliffs: { kind: "environment", label: "limestone cliffs", cue: /cliffs?|escarpment|limestone|ravine|mountains?|rock face|theban (landscape|hills)/ },
  "deir-el-bahari": { kind: "environment", label: "Deir el-Bahari / Hatshepsut's temple", cue: /deir el.bahari|hatshepsut/ },
  nile: { kind: "environment", label: "the Nile", cue: /\bnile\b|\briver\b|\bboats?\b|\bbarges?\b/ },
  temple: { kind: "environment", label: "temple with columns", cue: /\btemples?\b|karnak|columns?|courtyard/ },
  village: { kind: "environment", label: "mud-brick village", cue: /\bvillages?\b|family home|mud.brick/ },
  desert: { kind: "environment", label: "open desert", cue: /\bdesert\b|\bdunes?\b|plateau/ },
  market: { kind: "environment", label: "market street", cue: /\bmarket(place)?\b|\bstalls?\b|\btraders?\b/ },
  pyramids: { kind: "environment", label: "Giza pyramids", cue: /\bgiza\b|\bpyramids?\b/ },
  "burial-chamber": { kind: "environment", label: "burial chamber interior", cue: /burial chamber|tomb interior|sarcophag|grave goods|funerary (objects?|vessels?)/ },
  "rock-cutaway": { kind: "environment", label: "cutaway through rock (shaft and passages)", cue: /cutaway|cross.section|section through|\bshaft\b|tomb plans?/ },
  "route-map": { kind: "environment", label: "map with a drawn route", cue: /\bmaps?\b|map.like|\broutes?\b|path markers?|source paths?|map pins?/ },
  "modern-city": { kind: "environment", label: "modern city streets", cue: /modern cairo|\bcairo\b|\bcity\b|boulevard|\b2021\b/ },
  museum: { kind: "environment", label: "museum interior", cue: /\bmuseums?\b(?! catalog)|glass cases?|exhibit|gallery/ },
  // ---- figures ----
  priests: { kind: "figure", label: "priests", cue: /\bpriests?\b/ },
  scribes: { kind: "figure", label: "scribes", cue: /\bscribes?\b/ },
  pharaoh: { kind: "figure", label: "pharaoh or royal statue", cue: /\bpharaohs?\b|coloss(al|us)|royal statue|enthroned|\bmonuments?\b/ },
  "workers-1881": { kind: "figure", label: "19th-century workers", cue: /\bworkers?\b|labourers?|workmen/ },
  "officials-1881": { kind: "figure", label: "19th-century officials", cue: /brugsch|ahmed kamal|\binspectors?\b|investigators?|19th.century officials?/ },
  villagers: { kind: "figure", label: "villagers or a local family", cue: /\bvillagers?\b|\bfamily (in|at|of|home)\b|local family|travell?ers?/ },
  intruders: { kind: "figure", label: "tomb robbers", cue: /\bintruders?\b|\bthie(f|ves)\b|\brobbers?\b|\blooters?\b/ },
  "modern-people": { kind: "figure", label: "modern people (visitors, conservators)", cue: /conservators?|scientists?|museum silhouettes|visitors?|\bcrowds?\b/ },
  // ---- actions ----
  procession: { kind: "action", label: "coffin carried in procession", cue: /procession|\bbiers?\b|carr(y|ied|ying) (the |a )?(coffin|remains|mumm)/ },
  "hoist-by-rope": { kind: "action", label: "coffins hauled by rope", cue: /\bhoist|\bhaul|pull(ing|ed|s)? (the |a )?coffins?|by rope|pulleys?/ },
  rewrapping: { kind: "action", label: "rewrapping in linen", cue: /re-?wrap|(fresh|clean) linen|linen bands?|\bwrapping\b/ },
  looting: { kind: "action", label: "looted or damaged burial", cue: /\bloot|stripped|\bpried\b|damaged|\bbroken\b|ransack/ },
  "torch-light": { kind: "action", label: "torch or lantern light", cue: /\btorch|\blanterns?\b|\blamps?\b|\bflames?\b/ },
  parade: { kind: "action", label: "the 2021 parade of vehicles", cue: /\bparade\b|\bvehicles?\b|\bconvoy\b|\bcarriages?\b/ },
  // ---- props ----
  coffin: { kind: "prop", label: "coffin or mummy", cue: /\bcoffins?\b|sarcophag|\bmumm(y|ies)\b|wrapped body/ },
  "coffin-row": { kind: "prop", label: "a row of many coffins", cue: /rows? of coffins|repeated coffin|corridor of [a-z ]*coffins|coffins in (a )?(crowded )?(tunnel|corridor|rows?)/ },
  papyrus: { kind: "prop", label: "papyrus, docket or inscription", cue: /papyrus|hieratic|\bdockets?\b|inscriptions?|handwriting|linen labels?|name tags?|cartouches?/ },
  records: { kind: "prop", label: "19th-century paper records", cue: /\bledger\b|inventory|catalog(ue)?( cards?)?|record cards?|inked documents|\bdocuments?\b|date on paper/ },
  "canopic-jars": { kind: "prop", label: "canopic jars", cue: /canopic/ },
  amulets: { kind: "prop", label: "amulets", cue: /\bamulets?\b|\bankh\b|\bscarab/ },
  statue: { kind: "prop", label: "seated statue", cue: /\bstatues?\b/ },
  obelisk: { kind: "prop", label: "obelisk", cue: /\bobelisks?\b/ },
  chest: { kind: "prop", label: "treasure chest and vases", cue: /\bchests?\b|\btreasure\b|\bvases?\b/ },
  rope: { kind: "prop", label: "rope", cue: /\bropes?\b/ },
  goat: { kind: "prop", label: "goat", cue: /\bgoats?\b/ },
  steamer: { kind: "prop", label: "steamship", cue: /\bsteamers?\b|steamship|paddle (boat|steamer)/ },
  "scan-imagery": { kind: "prop", label: "X-ray or scan imagery", cue: /x.ray|\bscans?\b|scanner|grid overlay/ },
  "desk-interior": { kind: "prop", label: "office interior (door, desk)", cue: /\bdesk\b|shut door|\boffice\b/ },
} as const satisfies Record<string, Term>;

export type CapabilityId = keyof typeof VOCABULARY;
export const CAPABILITY_IDS = Object.keys(VOCABULARY) as CapabilityId[];

type TemplateCapabilities = {
  /** The subject of the shot: what the template is for. */
  core: readonly CapabilityId[];
  /** Also visible, but not the point of the shot. */
  also?: readonly CapabilityId[];
};

/**
 * Fixed capabilities per template. Templates driven by scene fields
 * (environment, cast, prop, params) gain more from the scene itself: see
 * sceneCapabilities().
 */
export const TEMPLATE_CAPABILITIES: Record<TemplateId, TemplateCapabilities> = {
  title: { core: [] },
  landscape: { core: [] },
  characters: { core: [] },
  procession: { core: ["procession", "coffin"] },
  artifact: { core: [] },
  "tomb-interior": { core: ["burial-chamber", "coffin"], also: ["chest", "statue", "amulets"] },
  cutaway: { core: ["rock-cutaway"], also: ["torch-light", "coffin", "rope", "priests", "cliffs"] },
  "coffin-chamber": { core: ["coffin-row", "coffin"], also: ["torch-light"] },
  map: { core: ["route-map"] },
  "end-card": { core: [] },
  "royal-pharaohs": { core: ["pharaoh"], also: ["statue"] },
  "tomb-robbery": { core: ["looting", "burial-chamber"], also: ["coffin", "intruders", "chest"] },
  "priests-rewrapping": { core: ["priests"], also: ["coffin"] },
  "v1-topic-short": { core: [] }, // per-shot capability validated by V1 semantic planner, not a fixed subject
  "cinematic-royal-reveal": { core: ["pharaoh", "coffin"], also: ["temple", "burial-chamber"] },
  "cinematic-tt320": { core: ["rock-cutaway", "coffin"], also: ["torch-light", "burial-chamber"] },
  "shorts15-v3-hook": { core: ["pharaoh", "coffin"], also: ["burial-chamber", "temple"] },
  "shorts15-v3-danger": { core: ["intruders", "priests", "coffin"], also: ["looting", "rewrapping", "torch-light", "cliffs", "procession"] },
  "shorts15-v3-reveal": { core: ["rock-cutaway", "coffin"], also: ["coffin-row", "torch-light", "burial-chamber"] },
  "shorts15-v3-cta": { core: ["coffin", "burial-chamber"], also: ["torch-light"] },
  "shorts15-hook": { core: ["pharaoh", "coffin"], also: ["burial-chamber", "temple"] },
  "shorts15-danger": { core: ["intruders", "priests", "coffin"], also: ["looting", "rewrapping", "torch-light", "cliffs", "procession"] },
  "shorts15-reveal": { core: ["rock-cutaway", "coffin"], also: ["coffin-row", "torch-light", "burial-chamber"] },
  "shorts15-cta": { core: ["coffin", "burial-chamber"], also: ["torch-light"] },

  "rc-01": { core: ["cliffs", "coffin"] },
  "rc-02": { core: ["burial-chamber", "looting"], also: ["coffin"] },
  "rc-03": { core: ["priests", "papyrus"] },
  "rc-04": { core: ["rewrapping", "coffin"] },
  "rc-05": { core: ["papyrus", "route-map"] },
  "rc-06": { core: ["procession", "coffin", "desert"] },
  "rc-07": { core: ["deir-el-bahari", "cliffs"], also: ["nile", "temple", "obelisk"] },
  "rc-08": { core: ["rock-cutaway"], also: ["coffin", "torch-light", "rope", "priests", "papyrus"] },
  "rc-09": { core: ["coffin-row", "coffin"] },
  "rc-10": { core: ["cliffs"] },
  "rc-11": { core: ["village", "villagers"], also: ["goat", "cliffs"] },
  "rc-12": { core: ["goat", "rock-cutaway"], also: ["rope", "torch-light", "villagers"] },
  "rc-13": { core: ["coffin-row", "coffin", "torch-light"] },
  "rc-14": { core: ["market", "papyrus"], also: ["canopic-jars", "records", "desk-interior", "village"] },
  "rc-15": { core: ["officials-1881", "rock-cutaway"], also: ["torch-light", "records", "cliffs"] },
  "rc-16": { core: ["hoist-by-rope", "coffin"], also: ["rope", "workers-1881", "rock-cutaway", "records"] },
  "rc-17": { core: ["modern-city", "parade"], also: ["coffin", "obelisk", "museum"] },
  "rc-18": { core: ["cliffs", "coffin"] },
};

/** Templates whose picture follows these scene fields. */
const USES_ENVIRONMENT = new Set<TemplateId>(["title", "landscape", "characters", "procession", "end-card"]);
const USES_CAST = new Set<TemplateId>(["landscape", "characters", "procession"]);

const ENV_CAPS: Record<EnvId, CapabilityId[]> = {
  "theban-cliffs": ["cliffs"],
  "deir-el-bahari": ["deir-el-bahari", "cliffs", "temple"],
  "giza-pyramids": ["pyramids", "desert"],
  "nile-valley": ["nile"],
  "temple-courtyard": ["temple"],
  village: ["village", "cliffs"],
  "open-desert": ["desert"],
  market: ["market"],
  "tomb-wall": ["burial-chamber"],
};
const CHARACTER_CAPS: Record<CharacterId, CapabilityId[]> = {
  priest: ["priests"], pharaoh: ["pharaoh"], noblewoman: [], scribe: ["scribes"], bearer: [], villager: ["villagers"],
  worker: ["workers-1881"], brugsch: ["officials-1881"], kamal: ["officials-1881"],
};
const ACTION_CAPS: Partial<Record<ActionId, CapabilityId[]>> = { read: ["papyrus"], torch: ["torch-light"] };
const PROP_CAPS: Record<PropId, CapabilityId[]> = {
  coffin: ["coffin"], papyrus: ["papyrus"], "canopic-jars": ["canopic-jars"], amulets: ["amulets"], statue: ["statue"], obelisk: ["obelisk"], chest: ["chest"],
};
/** Documentary template parameters that change what is on screen. */
const PARAM_CAPS: Record<string, CapabilityId[]> = {
  "environment:temple courtyard with columns": ["temple"],
  "environment:theban limestone cliffs": ["cliffs"],
  "environment:royal burial chamber": ["burial-chamber"],
  "environment:desert plateau": ["desert"],
  "environment:hidden cliff tomb": ["cliffs", "burial-chamber"],
  "environment:corridor with side chamber": ["burial-chamber"],
  "environment:temple chamber": ["temple"],
  "environment:burial preparation room": ["burial-chamber"],
  "pose:statue close-up": ["statue"],
  "action:rewrap mummy": ["rewrapping"],
  "action:record labels": ["papyrus"],
  "action:carry remains": ["procession"],
  "action:inspect coffin": ["coffin"],
  "showTorch:true": ["torch-light"],
};

const unique = (lists: readonly (readonly CapabilityId[] | undefined)[]) => [...new Set(lists.flatMap((l) => l ?? []))];
/** What becomes available once a template's environment, cast or prop field is set. */
export const SETUP_CAPABILITIES = {
  environment: unique(Object.values(ENV_CAPS)),
  cast: unique([...Object.values(CHARACTER_CAPS), ...Object.values(ACTION_CAPS)]),
  prop: unique(Object.values(PROP_CAPS)),
} as const;

type SceneLike = {
  template: TemplateId;
  environment?: EnvId;
  cast?: { kind: CharacterId; action: ActionId }[];
  prop?: PropId;
  variant?: string;
  params?: Record<string, string | boolean>;
};

/** Everything this scene, as configured, can show. `core` is its main subject. */
export const sceneCapabilities = (scene: SceneLike): { core: Set<CapabilityId>; all: Set<CapabilityId> } => {
  const fixed = TEMPLATE_CAPABILITIES[scene.template];
  const core = new Set<CapabilityId>(fixed.core);
  const all = new Set<CapabilityId>([...fixed.core, ...(fixed.also ?? [])]);
  const add = (caps: readonly CapabilityId[] | undefined, isCore: boolean) => { for (const c of caps ?? []) { all.add(c); if (isCore) core.add(c); } };
  if (USES_ENVIRONMENT.has(scene.template) && scene.environment) add(ENV_CAPS[scene.environment], true);
  if (USES_CAST.has(scene.template)) for (const m of scene.cast ?? []) { add(CHARACTER_CAPS[m.kind], scene.template === "characters"); add(ACTION_CAPS[m.action], false); }
  if (scene.template === "artifact") add(PROP_CAPS[scene.prop ?? "coffin"], true);
  // What a documentary template is doing (its action, pose) is its subject; where it happens is not.
  for (const [k, v] of Object.entries(scene.params ?? {})) add(PARAM_CAPS[`${k}:${String(v)}`], k === "action" || k === "pose");
  if (scene.template === "tomb-interior" && scene.variant === "looted") add(["looting"], true);
  return { core, all };
};

/** The few sounds the audio engine performs. Anything else in a sound note is not heard. */
export const SOUND_PERFORMED = /\bwind\b|room tone|\bhush|silence|\bquiet\b|footsteps?/;
export const SOUND_CUES: [string, RegExp][] = [
  ["rope or pulley", /\bropes?\b|pulleys?|creak/], ["breathing", /breath/], ["bell or animal call", /\bbell\b|bleat|\bbird\b/],
  ["water", /water|\bdrops?\b|ripple/], ["metal or stone impact", /clink|metallic|\btaps?\b|stone.door|\bpeg\b|pebble/],
  ["paper, pen or brush", /paper|\bpen\b|pencil|brush|scratch|wax.seal|linen swish/], ["voices or choir", /choir|voices?|murmurs?|marketplace ambience/],
  ["named musical gesture", /orchestra|strings?|chord|\bnotes?\b|motifs?|drums?|percussion|pulse|music (narrows|resolves)/],
  ["machine or electronic tone", /scanner|\bhum\b|monitor|static|steamer|paddle|lantern hiss/], ["door or room event", /door latch|echo|vessel placed/],
];
