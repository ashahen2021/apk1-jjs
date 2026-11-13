// Template parameters: defaults, lookup and validation.
import { TEMPLATE_PARAMS, type TemplateId } from "./catalog.ts";

type Params = Record<string, string | boolean> | undefined;

/** Default parameter values for a template ({} when it has none). */
export const defaultParams = (template: TemplateId): Record<string, string | boolean> =>
  Object.fromEntries((TEMPLATE_PARAMS[template] ?? []).map((d) => [d.key, d.default]));

/** A parameter's value, falling back to its default when absent or not allowed. */
export const paramOf = <T extends string | boolean = string>(scene: { template: TemplateId; params?: Params }, key: string): T => {
  const def = (TEMPLATE_PARAMS[scene.template] ?? []).find((d) => d.key === key);
  const v = scene.params?.[key];
  if (!def) return v as T;
  if (def.type === "boolean") return (typeof v === "boolean" ? v : def.default) as T;
  return (typeof v === "string" && def.options.includes(v) ? v : def.default) as T;
};

/** Problems with a scene's params, as readable messages (empty = valid). */
export const paramProblems = (scene: { template: TemplateId; params?: Params }): string[] => {
  const defs = TEMPLATE_PARAMS[scene.template];
  if (!defs || !scene.params) return [];
  const out: string[] = [];
  for (const d of defs) {
    const v = scene.params[d.key];
    if (v === undefined) continue;
    if (d.type === "boolean" && typeof v !== "boolean") out.push(`params.${d.key}: expected true or false`);
    if (d.type === "select" && (typeof v !== "string" || !d.options.includes(v))) out.push(`params.${d.key}: "${String(v)}" is not one of ${d.options.map((o) => `"${o}"`).join(", ")}`);
  }
  return out;
};
