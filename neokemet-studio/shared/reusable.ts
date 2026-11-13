// Conservative reuse of existing Royal Cache shots for documentary direction.
// This is visual-direction only: narration alone must never select a hard-directed
// preset. A generic mention of a tomb, market, king, goat or Nile is insufficient.
import type { TemplateId } from "./catalog.ts";
import { defaultParams } from "./params.ts";

type ReuseMatch = { template: TemplateId; params: Record<string, string | boolean> };

export function matchReusableRoyalCacheShot(visual: string): ReuseMatch | null {
  const v = visual.toLowerCase().replace(/[–—]/g, "-");
  const both = (a: RegExp, b: RegExp) => a.test(v) && b.test(v);
  let template: TemplateId | undefined;

  // Most specific historical event cues first.
  if (/golden parade|pharaohs.? parade/.test(v) || both(/2021/, /parade|royal mumm|cairo/)) template = "rc-17";
  else if (both(/coffin|sarcophag|mumm/, /hoist|haul|lift|pulley|extract|remove.*shaft/)) template = "rc-16";
  else if (both(/1881|july 6|july sixth|6 july/, /shaft|entrance|excavat|investigat|brugsch|ahmed kamal/) || both(/brugsch|ahmed kamal/, /shaft|entrance|lantern|passage/)) template = "rc-15";
  else if (both(/goat/, /shaft|fell|fall|opening|rope|lantern/)) template = "rc-12";
  else if (both(/abd.el.rassul|19th.century|nineteenth.century|family/, /village|theban|ravine|foothill|goat|hills/)) template = "rc-11";
  else if (both(/antiquit|papyrus|funerary object|inscription|canopic/, /market|trader|seller|buyer|stall/)) template = "rc-14";
  else if (/tt.?320|pinedjem.+shaft/.test(v) || both(/deep shaft|shaft diagram/, /passage|corridor|burial chamber|cutaway/)) template = "rc-08";
  else if (/deir.el.bahari|hatshepsut/.test(v) && /cliff|temple|escarpment|nile|mountain/.test(v)) template = "rc-07";

  if (!template) return null;
  const params = defaultParams(template);
  // Do not infer a crop that might hide key action: leave original composition
  // and entire animation. Editors can adjust these in the Storyboard.
  return { template, params };
}
