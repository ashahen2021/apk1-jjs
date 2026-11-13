// Optional local AI: asks an Ollama model for a storyboard and validates the
// answer against the scene schema. The studio works without it.
import { z } from "zod";
import { ACTIONS, CAMERAS, CHARACTERS, ENVIRONMENTS, GENERIC_TEMPLATE_IDS, PROPS, TEMPLATES } from "../shared/catalog.ts";
import { AiStoryboard, AiStoryboardSchema, Scene } from "../shared/schema.ts";

export const storyboardJsonSchema = () => z.toJSONSchema(AiStoryboardSchema);

const list = (o: Record<string, string>) => Object.entries(o).map(([k, v]) => `  - "${k}": ${v}`).join("\n");

export const buildPrompt = (topic: string, script: string, sceneCount: number) => `You are planning a short 2D animated documentary about ancient Egypt in a vintage travel-poster style.
Return ONLY JSON matching the schema. Write ${sceneCount} scenes. Total narration about ${Math.round(sceneCount * 20)} words (each scene 15-28 words, one or two sentences, plain factual English, no invented quotes).
${script.trim() ? `Use this script, divided across the scenes without changing its facts:\n"""${script.trim()}"""` : `Topic: ${topic}`}

The first scene must use template "title" with "label" set to the film title. The last scene must use "end-card".
Templates:
${GENERIC_TEMPLATE_IDS.map((id) => `  - "${id}": ${TEMPLATES[id].description} Uses: ${(TEMPLATES[id].uses as readonly string[]).join(", ") || "nothing"}.`).join("\n")}
Environments:
${list(ENVIRONMENTS)}
Characters (cast[].kind):
${list(CHARACTERS)}
Actions (cast[].action):
${list(ACTIONS)}
Cameras:
${list(CAMERAS)}
Props (for template "artifact"):
${list(PROPS)}
Rules: labels are short (at most 4 words). For "map" put three place names in "sublabel" separated by " | ". For "tomb-interior" set "variant" to "intact" or "looted". Do not state uncertain legends as fact.`;

export const ollamaStatus = async (url: string) => {
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/api/tags`, { signal: AbortSignal.timeout(1500) });
    if (!r.ok) return { reachable: false, models: [] as string[] };
    const j = (await r.json()) as { models?: { name: string }[] };
    return { reachable: true, models: (j.models ?? []).map((m) => m.name) };
  } catch {
    return { reachable: false, models: [] as string[] };
  }
};

/** Parse + validate model output. Throws a readable error listing what is wrong. */
export const validateStoryboard = (raw: string): AiStoryboard => {
  let data: unknown;
  try { data = JSON.parse(raw.replace(/^```(?:json)?/i, "").replace(/```\s*$/, "").trim()); } catch { throw new Error("The model did not return valid JSON."); }
  const r = AiStoryboardSchema.safeParse(data);
  if (!r.success) throw new Error("The storyboard does not match the scene schema: " + r.error.issues.slice(0, 6).map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  return r.data;
};

export const storyboardToScenes = (sb: AiStoryboard): Scene[] =>
  sb.scenes.map((s, i) => ({ ...s, id: `s${String(i + 1).padStart(2, "0")}`, ambience: "auto" as const, cast: s.cast?.map((c) => ({ kind: c.kind, action: c.action ?? "stand" })) }));

export const generateStoryboard = async (opts: { url: string; model: string; topic: string; script: string; sceneCount: number }) => {
  const base = opts.url.replace(/\/$/, "");
  const messages = [{ role: "user", content: buildPrompt(opts.topic, opts.script, opts.sceneCount) }];
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    let res: Response;
    try {
      res = await fetch(`${base}/api/chat`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: opts.model, messages, stream: false, format: storyboardJsonSchema(), options: { temperature: 0.4 } }), signal: AbortSignal.timeout(600000) });
    } catch (e) {
      throw new Error(`Could not reach Ollama at ${base}. Start Ollama (or write the scenes by hand) and try again. (${e instanceof Error ? e.message : e})`);
    }
    if (!res.ok) throw new Error(`Ollama returned ${res.status}: ${(await res.text()).slice(0, 200)}. Is the model "${opts.model}" pulled?`);
    const content = ((await res.json()) as { message?: { content?: string } }).message?.content ?? "";
    try { return validateStoryboard(content); } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      messages.push({ role: "assistant", content }, { role: "user", content: `That was rejected: ${lastError}. Return corrected JSON only.` });
    }
  }
  throw new Error(`Ollama's answer failed validation twice. ${lastError}`);
};
