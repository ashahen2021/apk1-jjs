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
  if (perScene > 8) warnings.push("Too few scenes for 1–2-second shots; split the script into more paragraphs.");
  if (!topic) warnings.push("No V1 illustration set matches this story. New visual assets must be drawn before publishing.");
  let matched = 0;
  const shotHistory: {id:string;time:number}[] = [];
  const scenes: Scene[] = sourceScenes.map((s, i) => {
    // Distribute integer frames, not fractional seconds: 4 × 3.75 s rounds to 452 frames otherwise.
    const startFrame = Math.round(i * seconds * 30 / sourceScenes.length);
    const endFrame = Math.round((i + 1) * seconds * 30 / sourceScenes.length);
    const exactSeconds = (endFrame - startFrame) / 30;
    const description = [s.production?.visual ?? "", s.narration].join(" ");
    const realMatches = topic ? BEAT_RULES[topic].filter(([re]) => re.test(description)).map(([, id]) => id) : [];
    if (realMatches.length) matched++;
    else warnings.push(`Scene ${i + 1}: no exact semantic drawing match; preview uses a labelled approximation or missing-art card.`);
    const candidates = topic ? [...V1_TOPICS[topic]] : [];
    // Prefer identified actions. Fill with related but different subject illustrations,
    // and report that the additional images are approximate rather than claiming exactness.
    // 2–3 second visual beats (rounding allows 1.875s for the 3.75s/2 case).
    // Never repeat the same V1 illustration consecutively, or >2 times
    // inside any sliding 20-second interval. Prefer semantically matched art.
    const amount = Math.max(1, Math.min(4, Math.round(exactSeconds / 2.5)));
    const visible: string[] = [];
    const options = [...new Set([...realMatches,...candidates])];
    for(let j=0;j<amount;j++){
      const at=startFrame/30 + j*(exactSeconds/amount);
      const previous=shotHistory.at(-1)?.id;
      const available=options.find(b=>b!==previous &&
        shotHistory.filter(old=>old.id===b && at-old.time<20).length<2);
      if(!available){
        const missing=`missing-art-${i+1}-${j+1}`;
        visible.push(missing);
        shotHistory.push({id:missing,time:at});
        warnings.push(`Scene ${i+1}, shot ${j+1}: V1 has no unused, subject-relevant drawing available under the 20-second repeat limit; create original art in Visual Lab.`);
      }else{
        visible.push(available);
        shotHistory.push({id:available,time:at});
        const idx=options.indexOf(available);
        // Round-robin after coverage choices to avoid identical compositions in sequence.
        if(idx>=0){options.splice(idx,1);options.push(available);}
      }
    }
    // Avoid old generic opening/end cards; begin with the subject.
    const out: Scene = {
      ...s, template: "v1-topic-short",
      durationSec: exactSeconds, ambience: s.ambience ?? "auto",
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


/**
 * Adjust only the ephemeral render timeline to the measured narration duration.
 * Never rewrites saved scene data or a user's approved artShots.
 * Guarantees known procedural art is not repeated back-to-back or >2 times
 * in any rolling 20-second window. Missing art is reported, not fabricated.
 */
export const conformV1VisualCadence = (
  entries: readonly {scene:Scene;durationInFrames:number}[],fps:number
): {scenes:Scene[];warnings:string[]}=>{
  const history:{id:string;sec:number}[]=[];
  const warnings:string[]=[];
  const out:Scene[]=[];
  let current=0;
  for(let i=0;i<entries.length;i++){
    const {scene,durationInFrames}=entries[i];
    const seconds=durationInFrames/fps;
    if(scene.template!=="v1-topic-short"){
      out.push(scene);current+=seconds;continue;
    }
    const target=Math.max(1,Math.round(seconds/2.5));
    if(scene.artShots?.length){
      const n=Math.min(scene.artShots.length,target);
      if(seconds/n>3.05)warnings.push(`Scene ${i+1}: approved Visual Lab art has only ${n} unique shots for ${seconds.toFixed(1)} seconds. Add more art for 2–3-second cuts.`);
      for(let j=0;j<n;j++){
        const id=scene.artShots[j].label;
        const at=current+j*seconds/n;
        if(history.at(-1)?.id===id||history.filter(h=>h.id===id&&at-h.sec<20).length>=2)
          warnings.push(`Scene ${i+1}: approved illustration "${id}" repeats too frequently. Review in Visual Lab before publishing.`);
        history.push({id,sec:at});
      }
      out.push(scene);current+=seconds;continue;
    }
    const original=String(scene.params?.shots??"").split(",").map(x=>x.trim()).filter(Boolean);
    const topic=String(scene.params?.topic??"") as V1Topic;
    const available=[...new Set([...original,...(V1_TOPICS[topic]??[])])];
    const selected:string[]=[];
    for(let k=0;k<target;k++){
      const at=current+k*seconds/target;
      const last=history.at(-1)?.id;
      const chosen=available.find(id=>id!==last &&
        history.filter(h=>h.id===id&&at-h.sec<20).length<2);
      if(chosen){
        selected.push(chosen);
        history.push({id:chosen,sec:at});
        // Cycle the named candidates so each new beat begins with a new drawing.
        available.splice(available.indexOf(chosen),1);available.push(chosen);
      }else{
        const missing=`missing-art-scene-${i+1}-beat-${k+1}`;
        selected.push(missing);
        history.push({id:missing,sec:at});
        warnings.push(`Scene ${i+1}: the art library cannot supply enough unique 2–3s beats; create an original illustration in Visual Lab.`);
      }
    }
    out.push({...scene,params:{...(scene.params??{}),shots:selected.join(",")}});
    current+=seconds;
  }
  return {scenes:out,warnings};
};
