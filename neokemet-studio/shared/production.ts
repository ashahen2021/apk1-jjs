// Parse structured production Markdown into editable, validated storyboard candidates.
// Importing is deliberately a dry run: no existing project is changed here.
// Narration is the only text sent onward to a speech provider.
import { matchDocumentaryTemplate } from "./documentary.ts";
import { matchReusableRoyalCacheShot } from "./reusable.ts";
import { castFromText, envFromText, planScene, obeliskFromText, WORK_TEMPLATES, workSceneFromText } from "./planner.ts";
import { MAX_SCENES, type Scene } from "./schema.ts";

type Draft = {
  number: number;
  title: string;
  chapter: string;
  narration: string[];
  visual: string[];
  sound: string[];
  estimateSeconds?: number;
};

export type ProductionImport = {
  scenes: Scene[];
  script: string;
  suggestedFormat?: "9:16" | "16:9" | "1:1";
  warnings: string[];
  summary: { sceneCount: number; chapters: number; approximateMinutes?: number };
};

/**
 * Drop what the director rules out ("no Giza pyramids", "avoid generic temple
 * courtyards") so a forbidden subject cannot select itself.
 */
export const affirmed = (direction: string) => direction.replace(/\b(?:no|not|never|without|avoid(?:ing)?)\b[^.;,]*/gi, " ");

/** Text the direction asks to see on screen: label "X", heading "X", caption: "X". */
const onScreenText = (visual: string): string | undefined => {
  const m = /\b(?:label|heading|caption)s?\b[^"“.;]{0,40}["“]([^"”]{2,60})["”]/i.exec(visual);
  return m ? m[1].trim() : undefined;
};
const PLACE_TEMPLATES = new Set(["title", "landscape", "characters", "procession", "end-card"]);
// Only templates whose caption sits in clear sky; interiors and diagrams keep their own layout.
const LABELLED_TEMPLATES = new Set(["title", "end-card", "landscape", "characters", "procession", "artifact", "map", "construction", "shipyard", "obelisk"]);

export function parseProductionMarkdown(source: string, projectTitle = "Untitled"): ProductionImport {
  if (!source.trim()) throw new Error("The production Markdown file is empty.");
  if (source.length > 500_000) throw new Error("The production Markdown exceeds the 500 KB limit.");
  const drafts: Draft[] = [];
  const chapters = new Set<string>();
  let chapter = "";
  let current: Draft | undefined;
  let section: "narration" | "visual" | "sound" | undefined;
  const complete = () => {
    if (!current) return;
    if (!current.narration.join(" ").trim())
      throw new Error("Scene " + current.number + " (" + current.title + ") has no Voiceover section. No changes were made.");
    drafts.push(current);
    current = undefined;
    section = undefined;
  };

  for (const raw of source.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    const plain = line.replace(/\*\*/g, "").trim();
    const chapterMatch = /^#{1,6}\s+Chapter\s*:\s*(.+)$/i.exec(plain);
    if (chapterMatch) {
      complete();
      chapter = chapterMatch[1].trim();
      chapters.add(chapter);
      continue;
    }
    const sceneMatch = /^Scene\s+(\d+)\s*[—–:-]\s*(.+)$/i.exec(plain.replace(/^#{1,6}\s+/, ""));
    if (sceneMatch) {
      complete();
      const number = Number(sceneMatch[1]);
      const estimate = /[~≈]\s*(\d+(?:\.\d+)?)\s*s\b/i.exec(sceneMatch[2]);
      const sceneTitle = sceneMatch[2].replace(/\s*\(\s*\d+\s+words?\s*;[^)]*\)\s*$/i, "").trim();
      if (drafts.some((d) => d.number === number))
        throw new Error("Duplicate scene number " + number + " in the production file.");
      current = { number, title: sceneTitle, chapter, narration: [], visual: [], sound: [], estimateSeconds: estimate ? Number(estimate[1]) : undefined };
      section = undefined;
      continue;
    }
    if (/^#{1,6}\s+/.test(plain)) {
      complete(); // Ignore constraints, sources and other non-scene sections.
      continue;
    }
    if (!current) continue;
    if (/^(Voiceover|Narration)\s*:?\s*$/i.test(plain)) { section = "narration"; continue; }
    const visualMatch = /^(Visual|Visual direction)\s*:\s*(.*)$/i.exec(plain);
    if (visualMatch) { section = "visual"; if (visualMatch[2]) current.visual.push(visualMatch[2]); continue; }
    const soundMatch = /^(Sound\s*\/\s*transition|Sound|Audio|SFX)\s*:\s*(.*)$/i.exec(plain);
    if (soundMatch) { section = "sound"; if (soundMatch[2]) current.sound.push(soundMatch[2]); continue; }
    if (plain && section) current[section].push(plain);
  }
  complete();

  if (!drafts.length) throw new Error("No numbered scene headings found. Use **Scene 01 — Title** followed by **Voiceover**, **Visual:** and **Sound / transition:**.");
  if (drafts.length > MAX_SCENES)
    throw new Error("The production file contains " + drafts.length + " scenes; this version supports at most " + MAX_SCENES + ". No scenes were replaced.");
  const numbers = drafts.map((d) => d.number);
  if (new Set(numbers).size !== numbers.length) throw new Error("The production file has duplicate scene numbers.");
  for (let i = 1; i < numbers.length; i++)
    if (numbers[i] <= numbers[i - 1]) throw new Error("Scene numbers must be strictly increasing.");

  const warnings: string[] = [];
  if (drafts.some((d) => !d.visual.length)) warnings.push("One or more scenes have no Visual direction.");
  if (drafts.some((d) => !d.sound.length)) warnings.push("One or more scenes have no Sound / transition direction.");
  warnings.push("Visual and sound directions are saved as editable production notes. Existing SVG templates approximate them; unique choreography and sound cues are not automatically performed.");
  // The place the film as a whole is about, for scenes whose own text names none.
  const filmEnv = envFromText(affirmed(drafts.map((d) => d.visual.join(" ")).join(" ")));
  const scenes: Scene[] = drafts.map((d, i) => {
    const narration = d.narration.join(" ").replace(/\s+/g, " ").trim();
    const visual = d.visual.join(" ").replace(/\s+/g, " ").trim();
    const sound = d.sound.join(" ").replace(/\s+/g, " ").trim();
    const v = visual.toLowerCase();
    const s = planScene(narration, i, drafts.length, projectTitle);
    s.id = "s" + String(i + 1).padStart(2, "0");
    let claimed = false;
    // Prioritise the director's visual instruction over keyword guesses from narration.
    if (i > 0 && i < drafts.length - 1) {
      if (/cutaway|section through|cross.section|shaft|underground|tomb plan|passage|corridor|rock.cut/.test(v)) s.template = "cutaway";
      else if (/rows? of coffins|royal coffins|mummies.*chamber|coffins.*corridor/.test(v)) s.template = "coffin-chamber";
      else if (/coffin|sarcophag|burial chamber|grave goods|stripped gilding|looted tomb/.test(v)) s.template = "tomb-interior";
      else if (/hieratic|papyrus|docket|inscription|catalog cards|handwriting|linen label|record card/.test(v)) { s.template = "artifact"; s.prop = "papyrus"; }
      else if (/procession|bier|carry.*coffin|hoist.*coffin/.test(v)) s.template = "procession";
      else if (/map|route|markers|the nile divides/.test(v)) s.template = "map";
      else if (/priests|scribes|officials|family|villagers|workers|hands.*rewrap/.test(v)) s.template = "characters";
      else if (/cliff|temple|nile|mountain|village|desert|landscape/.test(v)) s.template = "landscape";
    }
    // Phase-1 documentary templates: chosen when the directions clearly call for one.
    // Structural diagrams asked for explicitly (cutaway, map, rows of coffins) are left alone.
    if (i > 0 && i < drafts.length - 1 && !["cutaway", "map", "coffin-chamber"].includes(s.template)) {
      const m = matchDocumentaryTemplate({ visual, title: d.title, narration });
      if (m) {
        s.template = m.template;
        s.params = m.params;
        claimed = true;
        delete s.cast; delete s.prop; delete s.variant;
      }
    }
    // Phase 2: reuse original hand-directed shots only when the visual direction
    // unmistakably names an existing sequence. This runs after documentary
    // matching; no generic narration reference can trigger a preset.
    if (i > 0 && i < drafts.length - 1) {
      const reuse = matchReusableRoyalCacheShot(visual);
      if (reuse) {
        s.template = reuse.template;
        s.params = reuse.params;
        claimed = true;
        delete s.cast; delete s.prop; delete s.variant;
      }
    }
    // The setting comes from what the direction asks for, never from what it rules out.
    const want = affirmed(v);
    if (/pyramid|giza|khufu|sphinx|\bramps?\b|sledges?/.test(want)) s.environment = "giza-pyramids";
    else if (/deir el.bahari|hatshepsut/.test(want)) s.environment = "deir-el-bahari";
    else if (/theban|cliff|limestone|valley of the kings/.test(want)) s.environment = "theban-cliffs";
    else if (/nile|river|boat|barge/.test(want)) s.environment = "nile-valley";
    else if (/village|family home|town/.test(want)) s.environment = "village";
    else if (/market/.test(want)) s.environment = "market";
    else if (/temple|karnak/.test(want)) s.environment = "temple-courtyard";
    else if (/desert|dunes?|\bsands?\b/.test(want)) s.environment = "open-desert";
    // A place template chosen from the direction must not fall back to a default
    // backdrop when the narration names the place.
    if (PLACE_TEMPLATES.has(s.template) && !s.environment) { const e = envFromText(narration) ?? filmEnv; if (e) s.environment = e; }

    // People named in the direction are the cast; narration is only the fallback.
    if (s.template === "characters") {
      const seen = castFromText(want);
      if (seen.length) s.cast = seen;
      else if (!s.cast?.length) { const spoken = castFromText(narration); if (spoken.length) s.cast = spoken; }
    } else if (s.template === "landscape") {
      const seen = castFromText(want, "walk").slice(0, 3);
      if (seen.length) s.cast = seen;
    }

    // Building work gets the picture the direction describes (ramp, sledge, crew,
    // quarry, barge), unless a documentary or hand-directed shot already claimed it.
    // Here the first and last scenes count too: "no unrelated end card" is a common
    // direction, and the heading is set as a title over the art.
    const obeliskParams = claimed ? undefined : obeliskFromText(d.title + " " + want + " " + narration, projectTitle);
    const build = obeliskParams
      ? { template: "obelisk" as const, params: obeliskParams }
      : claimed ? undefined : workSceneFromText(want) ?? (WORK_TEMPLATES.includes(s.template) ? workSceneFromText(narration) : undefined);
    if (build) {
      s.template = build.template;
      const edge = i === 0 || i === drafts.length - 1;
      s.params = { ...build.params, heading: edge || /\bheading\b|headline/.test(want) ? "title" : "caption" };
      delete s.cast; delete s.prop; delete s.variant; delete s.environment;
    } else if (WORK_TEMPLATES.includes(s.template)) {
      // narration alone suggested it, but the direction asks for something else
      s.template = "landscape";
      delete s.params;
      if (!s.environment) s.environment = envFromText(narration) ?? filmEnv ?? "open-desert";
    }

    // On-screen text: what the direction quotes, else a short scene title.
    const quoted = onScreenText(visual);
    const cleanTitle = d.title.replace(/\s*\([^)]*\)\s*$/, "").trim();
    if (s.template === "obelisk" && !quoted && cleanTitle && !/^scene\s*\d+$/i.test(cleanTitle)) s.label = cleanTitle.slice(0, 70);
    if (quoted && LABELLED_TEMPLATES.has(s.template)) s.label = quoted.slice(0, 70);
    else if (i > 0 && i < drafts.length - 1 && LABELLED_TEMPLATES.has(s.template) && !s.label && cleanTitle.length <= 32 && !/^scene\s*\d+$/i.test(cleanTitle)) s.label = cleanTitle;

    if (/pull.back|withdraw|zoom out/.test(v)) s.camera = "pull-back";
    else if (/push.in|zoom in|close.up|slow reveal/.test(v)) s.camera = "push-in";
    else if (/rise|top.down|from above/.test(v)) s.camera = "rise";
    else if (/pan left/.test(v)) s.camera = "pan-left";
    else if (/pan|drift|travels? along/.test(v)) s.camera = "pan-right";
    if (s.template === "construction" && ["ramp growth", "comparison"].includes(String(s.params?.view))) s.camera = "static";
    if (/wind/.test(sound.toLowerCase())) s.ambience = "wind";
    else if (/silence|hush|quiet/.test(sound.toLowerCase())) s.ambience = "none";
    s.production = {
      sourceNumber: d.number,
      sceneTitle: d.title,
      chapter: d.chapter,
      visual,
      sound,
      ...(d.estimateSeconds !== undefined ? { estimatedSeconds: d.estimateSeconds } : {}),
    };
    // No fixed duration: after importing or generating MP3, narration controls timing.
    delete s.durationSec;
    delete s.narrationFile;
    return s;
  });
  // Different directions that end up as the same picture are reported, not hidden.
  // Construction scenes can be told apart automatically: later repeats are
  // mirrored and given a different crew, so no two are the same drawing.
  const built = new Map<string, number>();
  const CREWS = ["four", "six", "two"];
  scenes.forEach((s) => {
    if (!WORK_TEMPLATES.includes(s.template)) return;
    const key = s.template + JSON.stringify(s.params);
    const k = built.get(key) ?? 0;
    built.set(key, k + 1);
    if (k > 0) s.params = { ...s.params, facing: k % 2 ? "left" : "right", crew: CREWS[(CREWS.indexOf(String(s.params?.crew)) + Math.ceil(k / 2)) % CREWS.length] };
  });
  const sameAs = new Map<string, number[]>();
  scenes.forEach((s, i) => {
    if (i === 0 || i === scenes.length - 1) return;
    const key = JSON.stringify([s.template, s.environment, s.cast, s.prop, s.variant, s.params]);
    sameAs.set(key, [...(sameAs.get(key) ?? []), drafts[i].number]);
  });
  for (const numbers of sameAs.values())
    if (numbers.length > 1) warnings.push("Scenes " + numbers.join(", ") + " have different directions but will draw the same picture. Change the template, setting, cast or prop of some of them in the Storyboard.");
  const script = scenes.map((s) => s.narration).join("\n\n");
  const approximateSeconds = drafts.reduce((n, d) => n + (d.estimateSeconds || 0), 0);
  const suggestedFormat = /(?:Target|Delivery)[^\n]*(?:16:9|1920\s*[×x]\s*1080)/i.test(source) ? "16:9" : undefined;
  return {
    scenes, script, suggestedFormat, warnings,
    summary: { sceneCount: scenes.length, chapters: chapters.size, ...(approximateSeconds ? { approximateMinutes: Math.round(approximateSeconds / 60 * 10) / 10 } : {}) },
  };
}
