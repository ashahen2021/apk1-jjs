// Production Intent Validator.
//
// Compares each scene's written visual direction with what its chosen template
// can actually draw (shared/capabilities.ts) and says, in plain words, whether
// they match. It is a report only: it never changes a template, a parameter or
// any other part of a project. Pure and offline.
import { CAPABILITY_IDS, type CapabilityId, sceneCapabilities, SETUP_CAPABILITIES, SOUND_CUES, SOUND_PERFORMED, TEMPLATE_CAPABILITIES, VOCABULARY } from "./capabilities.ts";
import { TEMPLATE_IDS, TEMPLATES, type TemplateId } from "./catalog.ts";
import type { Project, Scene } from "./schema.ts";

export type IntentStatus =
  | "validated"     // everything recognised in the direction is something this template shows
  | "unsupported"   // the direction asks for something this template does not show
  | "review"        // cannot be judged automatically: a person has to look
  | "no-direction"; // the scene has no visual direction to check

export const INTENT_LABELS: Record<IntentStatus, string> = {
  validated: "Validated match",
  unsupported: "Unsupported direction",
  review: "Requires human review",
  "no-direction": "No direction to check",
};

export type IntentAlternative = { template: TemplateId; label: string; covers: CapabilityId[]; stillMissing: CapabilityId[]; needsSetup: boolean };

export type SceneIntent = {
  sceneId: string;
  index: number; // 1-based, for display only
  sceneTitle: string;
  template: TemplateId;
  status: IntentStatus;
  /** One actionable sentence for the storyboard. */
  message: string;
  requested: CapabilityId[];
  supported: CapabilityId[];
  unsupported: CapabilityId[];
  /** The direction says "no X" but the template shows X. */
  conflicts: CapabilityId[];
  reviewReasons: string[];
  /** Existing templates that show more of what was asked. Suggestions only; nothing is applied. */
  alternatives: IntentAlternative[];
  /** Sound cues in the note that the audio engine does not perform. */
  soundNotPerformed: string[];
};

export type IntentReport = {
  scenes: SceneIntent[];
  summary: Record<IntentStatus, number> & { total: number };
};

const NEGATION = /\b(no|not|never|without|avoid|avoiding)\b/;
/** Bespoke animation that a fixed template cannot be checked against. */
const CHOREOGRAPHY = /dissolv|morph|\bbecomes?\b|\bshrinks?\b|\bfolds?\b|transform|time.lapse|overlay|fades? beneath|\brotates?\b|widening|\bmerges?\b|\breturns? to\b|sequentially|name.by.name|ripple|split.screen|side.by.side/;

const label = (ids: readonly CapabilityId[]) => ids.map((id) => VOCABULARY[id].label).join(", ");
const detect = (text: string) => CAPABILITY_IDS.filter((id) => VOCABULARY[id].cue.test(text));

/** Split a direction into what is asked for and what is explicitly ruled out ("no Giza pyramids"). */
export const splitDirection = (visual: string): { wanted: string; ruledOut: string } => {
  const wanted: string[] = [], ruledOut: string[] = [];
  for (const clause of visual.toLowerCase().replace(/[–—]/g, "-").split(/[;.,]/)) {
    const m = NEGATION.exec(clause);
    if (!m) { wanted.push(clause); continue; }
    wanted.push(clause.slice(0, m.index));
    ruledOut.push(clause.slice(m.index + m[0].length));
  }
  return { wanted: wanted.join(" ; "), ruledOut: ruledOut.join(" ; ") };
};

/** What a template could show once its environment, cast or prop is chosen. */
const potential = (template: TemplateId): { caps: Set<CapabilityId>; needsSetup: boolean } => {
  const fixed = TEMPLATE_CAPABILITIES[template];
  const caps = new Set<CapabilityId>([...fixed.core, ...(fixed.also ?? [])]);
  const before = caps.size;
  const uses = TEMPLATES[template].uses as readonly string[];
  for (const field of ["environment", "cast", "prop"] as const) if (uses.includes(field)) for (const c of SETUP_CAPABILITIES[field]) caps.add(c);
  return { caps, needsSetup: caps.size > before };
};

const alternativesFor = (scene: Scene, requested: CapabilityId[], unsupported: CapabilityId[]): IntentAlternative[] => {
  const out: IntentAlternative[] = [];
  for (const template of TEMPLATE_IDS) {
    if (template === scene.template) continue;
    const { caps, needsSetup } = potential(template);
    const newlyCovered = unsupported.filter((c) => caps.has(c));
    if (!newlyCovered.length) continue;
    const covers = requested.filter((c) => caps.has(c));
    out.push({ template, label: TEMPLATES[template].label, covers, stillMissing: requested.filter((c) => !caps.has(c)), needsSetup });
  }
  // A ready-made shot before one that still needs setting up; then whichever shows most of the request.
  return out.sort((a, b) => Number(a.needsSetup) - Number(b.needsSetup) || b.covers.length - a.covers.length).slice(0, 2);
};

const soundGaps = (sound: string): string[] => {
  const s = sound.toLowerCase();
  if (!s.trim()) return [];
  const gaps = SOUND_CUES.filter(([, re]) => re.test(s)).map(([name]) => name);
  return gaps.length || SOUND_PERFORMED.test(s) ? gaps : ["sound note not recognised"];
};

export const validateSceneIntent = (scene: Scene, index: number): SceneIntent => {
  const visual = scene.production?.visual?.trim() ?? "";
  const base = {
    sceneId: scene.id, index: index + 1, sceneTitle: scene.production?.sceneTitle || `Scene ${index + 1}`, template: scene.template,
    requested: [] as CapabilityId[], supported: [] as CapabilityId[], unsupported: [] as CapabilityId[], conflicts: [] as CapabilityId[],
    reviewReasons: [] as string[], alternatives: [] as IntentAlternative[], soundNotPerformed: soundGaps(scene.production?.sound ?? ""),
  };
  if (!visual) return { ...base, status: "no-direction", message: "This scene has no visual direction, so there is nothing to compare the template against." };

  const { wanted, ruledOut } = splitDirection(visual);
  const caps = sceneCapabilities(scene);
  const requested = detect(wanted);
  const supported = requested.filter((c) => caps.all.has(c));
  const unsupported = requested.filter((c) => !caps.all.has(c));
  const conflicts = detect(ruledOut).filter((c) => caps.all.has(c));
  const name = TEMPLATES[scene.template].label;
  const reviewReasons: string[] = [];
  if (CHOREOGRAPHY.test(wanted)) reviewReasons.push("The direction describes a transformation or bespoke animation; templates play a fixed animation.");
  if (ruledOut.trim() && !detect(ruledOut).length) reviewReasons.push(`The direction rules something out ("${ruledOut.trim().replace(/\s*;\s*/g, "; ").slice(0, 90)}") that cannot be checked automatically.`);

  if (unsupported.length || conflicts.length) {
    const alternatives = unsupported.length ? alternativesFor(scene, requested, unsupported) : [];
    const parts: string[] = [];
    if (unsupported.length) parts.push(`"${name}" does not show: ${label(unsupported)}.`);
    if (conflicts.length) parts.push(`The direction rules out ${label(conflicts)}, which "${name}" shows.`);
    parts.push(alternatives.length
      ? `Closest existing template: ${alternatives.map((a) => `"${a.label}" (shows ${label(a.covers)}${a.stillMissing.length ? `; still missing ${label(a.stillMissing)}` : ""}${a.needsSetup ? "; needs its environment, cast or prop set" : ""})`).join(" or ")}. Nothing was changed.`
      : "No existing template shows this. Rewrite the direction, accept the approximation, or plan new artwork.");
    return { ...base, status: "unsupported", message: parts.join(" "), requested, supported, unsupported, conflicts, reviewReasons, alternatives };
  }
  if (!requested.length)
    return { ...base, status: "review", message: `Nothing in this direction is in the template vocabulary, so the match with "${name}" cannot be judged automatically. Compare a preview frame with the direction.`, requested, supported, unsupported, conflicts, reviewReasons: ["No recognised subject, setting, action or prop in the direction.", ...reviewReasons] };
  const coreHit = caps.core.size === 0 || requested.some((c) => caps.core.has(c));
  if (!coreHit) reviewReasons.unshift(`"${name}" is mainly about ${label([...caps.core])}, which the direction does not ask for.`);
  if (reviewReasons.length)
    return { ...base, status: "review", message: `"${name}" shows ${label(supported)}, but a person should confirm the match. ${reviewReasons[0]}`, requested, supported, unsupported, conflicts, reviewReasons };
  return { ...base, status: "validated", message: `"${name}" shows what the direction asks for: ${label(supported)}.`, requested, supported, unsupported, conflicts, reviewReasons };
};

/** Check every scene. Read-only: the project is not modified. */
export const validateIntent = (project: Project): IntentReport => {
  const scenes = project.scenes.map((s, i) => validateSceneIntent(s, i));
  const summary = { total: scenes.length, validated: 0, unsupported: 0, review: 0, "no-direction": 0 };
  for (const s of scenes) summary[s.status]++;
  return { scenes, summary };
};
