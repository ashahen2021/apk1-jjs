// Cue mapping for the phase-1 documentary templates. Given a scene's visual
// direction, title and narration, decide whether one of the three templates
// fits and fill in reasonable parameter values. Pure and deterministic.
import type { TemplateId } from "./catalog.ts";
import { defaultParams } from "./params.ts";

type Cue = [RegExp, number];
type Rules = { template: TemplateId; cues: Cue[] };

// Weights: 3 = names the subject outright, 2 = strong hint, 1 = weak hint.
const RULES: Rules[] = [
  {
    template: "tomb-robbery",
    cues: [
      [/loot(ed|ing|ers?)?\b/, 3], [/robber(y|ies|s)?\b|robbed/, 3], [/thie(f|ves)/, 3],
      [/damaged coffins?|coffins? (were |was )?damaged/, 3], [/disturbed (tomb|burial)s?|mumm(y|ies) (were |was )?disturbed/, 3],
      [/gold (had )?vanished|stripped (of )?(its |their )?(gold|gilding)/, 3], [/burial(s| places?)? (had been |were |was )?threatened/, 3],
      [/plunder|stolen|broken into|ransack/, 2], [/threatened/, 1],
    ],
  },
  {
    template: "priests-rewrapping",
    cues: [
      [/priests? of amun/, 3], [/re-?wrapp?(ed|ing)?\b/, 3], [/repair(ed|ing)? (the )?(damaged )?burials?/, 3], [/fresh linen/, 3],
      [/labels? (were )?recorded|dockets?/, 3], [/linen (bands?|labels?|strips?)|linen\b/, 2], [/transfers?\b|transferred|moved several times/, 2],
      [/labels?\b/, 1], [/priests?\b/, 1],
    ],
  },
  {
    template: "royal-pharaohs",
    cues: [
      [/ram(e|es)ses|ramses/, 3], [/\bseti\b/, 3], [/thutmose|amenhotep|seqenenre/, 3], [/coloss(al|us)|colossal statue/, 3],
      [/royal rulers?|famous rulers?|great(est)? pharaohs?/, 3], [/pharaohs?\b/, 2], [/enthroned|throne/, 2], [/\btemple\b/, 1], [/\bkings?\b/, 1],
    ],
  },
];

const score = (text: string, cues: Cue[]) => cues.reduce((n, [re, w]) => n + (re.test(text) ? w : 0), 0);

export type DocumentaryMatch = { template: TemplateId; params: Record<string, string | boolean>; score: number };

/** Minimum weighted score. Directions (visual, title) count double; narration counts once. */
export const MATCH_THRESHOLD = 4;
export const NARRATION_ONLY_THRESHOLD = 6;

export const matchDocumentaryTemplate = (src: { visual?: string; title?: string; narration?: string }): DocumentaryMatch | null => {
  const visual = (src.visual ?? "").toLowerCase(), title = (src.title ?? "").toLowerCase(), narration = (src.narration ?? "").toLowerCase();
  let best: { template: TemplateId; score: number } | null = null;
  for (const r of RULES) {
    const directed = score(visual, r.cues) + score(title, r.cues);
    const spoken = score(narration, r.cues);
    const sc = 2 * directed + spoken;
    // Narration alone must be emphatic (two strong cues); a general remark is not a direction.
    const enough = directed > 0 ? sc >= MATCH_THRESHOLD : spoken >= NARRATION_ONLY_THRESHOLD;
    if (enough && (!best || sc > best.score)) best = { template: r.template, score: sc }; // ties keep the earlier rule
  }
  if (!best) return null;
  const all = `${visual} ${title} ${narration}`;
  const dir = `${visual} ${title}`; // camera and setting come from the directions only
  const params = defaultParams(best.template);
  const camera = /pan left/.test(dir) ? "pan left" : /pan right|pan\b|drift|travels? along/.test(dir) ? "pan right" : /rise|tilt up|from below/.test(dir) && best.template === "royal-pharaohs" ? "rise" : "slow push in";
  params.camera = camera;
  if (best.template === "royal-pharaohs") {
    params.pharaohName = /ram(e|es)ses|ramses/.test(all) && !/\bseti\b/.test(dir) ? "Ramesses II" : /\bseti\b/.test(all) ? "Seti I" : /thutmose/.test(all) ? "Thutmose III" : /amenhotep/.test(all) ? "Amenhotep I" : /seqenenre/.test(all) ? "Seqenenre Tao" : "Generic Pharaoh";
    params.pose = /statue|coloss/.test(dir) ? "statue close-up" : /seated|enthroned|throne/.test(dir) ? "seated" : /standing|stands|strides/.test(dir) ? "standing" : "seated";
    params.environment = /burial chamber|tomb|coffin/.test(dir) ? "royal burial chamber" : /cliff|theban|limestone|deir el.bahari/.test(dir) ? "theban limestone cliffs" : /desert|plateau|sand|dune/.test(dir) ? "desert plateau" : "temple courtyard with columns";
  } else if (best.template === "tomb-robbery") {
    params.stage = /damag|broken|crack|smash|stripped/.test(all) ? "damaged" : /loot|robb|thie|stolen|vanish|plunder|ransack/.test(all) ? "looted" : /open|breach|unseal|broken into/.test(all) ? "opened" : /undisturbed|intact|sealed/.test(dir) ? "intact" : "looted";
    params.environment = /corridor|passage|side chamber/.test(dir) ? "corridor with side chamber" : /cliff|hidden|entrance|doorway|rock.cut/.test(dir) ? "hidden cliff tomb" : "royal burial chamber";
    params.showTorch = /torch|lamp|lantern|flame|shadow/.test(dir) || !/daylight|sunlit/.test(dir);
    params.showScatteredObjects = !/empty|bare|nothing (is )?left/.test(dir);
  } else {
    params.action = /re-?wrap|linen band|fresh linen|wrapp/.test(all) ? "rewrap mummy" : /label|docket|record|inscri|hieratic/.test(all) ? "record labels" : /carr(y|ied|ying)|transfer|moved|bier|procession/.test(all) ? "carry remains" : "inspect coffin";
    params.environment = /temple|karnak|column/.test(dir) ? "temple chamber" : /burial|tomb|embalm|preparation/.test(dir) ? "burial preparation room" : "work chamber";
  }
  return { template: best.template, params, score: best.score };
};
