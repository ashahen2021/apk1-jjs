// V1 illustrated Shorts: deterministic, explicit semantic coverage. No AI / cloud calls.
// This is an opt-in workflow; generic storyboard behaviour is unchanged.
import type { Scene } from "./schema.ts";

export const V1_TOPICS = {
  painting: ["lamp", "pigments", "artist", "corridor", "mural"],
  papyrus: ["reeds", "strip", "layer", "press", "scribe"],
  transport: ["quarry", "load", "ropes", "sail", "unload"],
} as const;
export type V1Topic = keyof typeof V1_TOPICS;
export type V1Beat = (typeof V1_TOPICS)[V1Topic][number];

const TOPIC_RULES: { topic: V1Topic; re: RegExp }[] = [
  { topic: "painting", re: /paint|pigment|brush|lamp|torch|mural|underworld|tomb wall|tomb artist|hieroglyph|chiselled chamber/i },
  { topic: "papyrus", re: /papyrus|reeds?|stalk|pith|press(?:ed|ing)?|scribal sheet|writing material/i },
  { topic: "transport", re: /limestone blocks?|quarry|quarries|stone transport|haul(?:ed|ing)?|cargo|barge|unload|boatload|stonecut/i },
];
const BEAT_RULES: Record<V1Topic, readonly [RegExp, string][]> = {
  painting: [
    [/oil lamp|lamplight|torch|flame|darkness|dark chamber/i, "lamp"],
    [/pigment|grind|powder|ochre|palette|colour|color/i, "pigments"],
    [/artist|brush|paint|draw|craftsman/i, "artist"],
    [/corridor|passage|mountain|limestone|carve|cut deep|entrance/i, "corridor"],
    [/underworld|wall|image|hieroglyph|painted for|eternity|finished/i, "mural"],
  ],
  papyrus: [
    [/harvest|collect|grow|marsh|reed|stalk|cut plant/i, "reeds"],
    [/strip|slice|peel|pith|thin strips/i, "strip"],
    [/layer|cross|weav|overlap|arrange/i, "layer"],
    [/press|dry|sheet|flatten|weight/i, "press"],
    [/scribe|writ|ink|record|scroll/i, "scribe"],
  ],
  transport: [
    [/quarry|extract|saw|copper|cut stone/i, "quarry"],
    [/load|ramp|drag|hauling|sled|block on board/i, "load"],
    [/rope|secur|tie|lash|knot/i, "ropes"],
    [/sail|boat|barge|river|nile|current|cross/i, "sail"],
    [/unload|arriv|shore|offload|land|destination/i, "unload"],
  ],
};

export const identifyV1Topic = (source: string): V1Topic | null => {
  const scores = TOPIC_RULES.map(({ topic, re }) => ({
    topic, score: (source.match(new RegExp(re.source, "gi")) ?? []).length,
  })).sort((a, b) => b.score - a.score);
  return scores[0].score > 0 ? scores[0].topic : null;
};

export type V1Plan = { scenes: Scene[]; warnings: string[]; coverage: number; topic: V1Topic | null };
/** Preserve narration and existing IDs. Each editable scene has 2–4 shot-specific SVG IDs. */
export const planV1Short = (sourceScenes: Scene[], seconds: 15 | 30, title = ""): V1Plan => {
  if (sourceScenes.length < 2 || sourceScenes.length > 10)
    throw new Error("V1 Shorts need 2–10 narration paragraphs/scenes.");
  const combined = [title, ...sourceScenes.flatMap(s => [s.narration, s.production?.visual ?? ""])].join(" ");
  const topic = identifyV1Topic(combined);
  const warnings: string[] = [];
  const perScene = seconds / sourceScenes.length;
  if (perScene < 2) throw new Error("Too many scenes for the selected Shorts duration (minimum 2 seconds each).");
  if (!topic) warnings.push("No V1 illustration set matches this story. New visual assets must be drawn before publishing.");
  let matched = 0;
  const scenes: Scene[] = sourceScenes.map((s, i) => {
    const description = [s.production?.visual ?? "", s.narration].join(" ");
    const realMatches = topic ? BEAT_RULES[topic].filter(([re]) => re.test(description)).map(([, id]) => id) : [];
    if (realMatches.length) matched++;
    else warnings.push(`Scene ${i + 1}: no exact semantic drawing match; preview uses a labelled approximation or missing-art card.`);
    const candidates = topic ? [...V1_TOPICS[topic]] : [];
    // Prefer identified actions. Fill with related but different subject illustrations,
    // and report that the additional images are approximate rather than claiming exactness.
    const amount = Math.max(2, Math.min(4, Math.round(perScene / 1.5)));
    const beats: string[] = [...realMatches];
    for (const b of candidates) if (beats.length < amount && !beats.includes(b)) beats.push(b);
    const visible = beats.slice(0, amount);
    // Avoid old generic opening/end cards; begin with the subject.
    const out: Scene = {
      ...s, template: "v1-topic-short",
      durationSec: perScene, ambience: s.ambience ?? "auto",
      label: i === 0 ? (s.label || "THE HIDDEN STORY") : s.label,
      params: {
        topic: topic ?? "missing",
        shots: visible.join(","),
        hook: i === 0,
      },
    };
    delete out.cast; delete out.prop; delete out.variant;
    return out;
  });
  const coverage = matched / sourceScenes.length;
  if (coverage < 0.8) warnings.push(`Semantic coverage ${Math.round(coverage * 100)}% is below the 80% production goal. Draw more subject-specific SVG shots before release.`);
  warnings.push("Voiceover must be checked against the 15/30s timeline; measured speech may require lengthening scenes. No paid audio is generated.");
  return { scenes, warnings, coverage, topic };
};
