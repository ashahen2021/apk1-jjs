// Safe, offline template suggestions for an already edited storyboard.
// Analyze only: never mutate a project. Changes require explicit scene IDs.
// Unlike re-importing Markdown, this preserves voiceover/audio and manual edits.
import type { TemplateId } from "./catalog.ts";
import { matchDocumentaryTemplate } from "./documentary.ts";
import { matchReusableRoyalCacheShot } from "./reusable.ts";
import { defaultParams } from "./params.ts";
import type { Project, Scene } from "./schema.ts";

const SPECIALIZED = new Set<TemplateId>([
  "royal-pharaohs", "tomb-robbery", "priests-rewrapping",
]);

export type SmartSuggestion = {
  sceneId: string;
  index: number; // 1-based display index, never used as an update identifier
  sceneTitle: string;
  currentTemplate: TemplateId;
  proposedTemplate: TemplateId;
  proposedParams: Record<string, string | boolean>;
  confidence: "high" | "medium";
  reason: string;
};

export type SmartPreview = {
  suggestions: SmartSuggestion[];
  summary: { total: number; protected: number; withoutVisual: number; unchanged: number };
};

const reuseReason: Record<string, string> = {
  "rc-07": "The visual direction specifically describes Deir el-Bahari / Hatshepsut and its cliffs.",
  "rc-08": "The visual direction describes the TT320 shaft-and-passage cutaway.",
  "rc-11": "The visual direction describes a Theban family in a nineteenth-century village.",
  "rc-12": "The visual direction describes the goat, tomb opening and rope/lantern sequence.",
  "rc-14": "The visual direction links antiquities to a market or trader.",
  "rc-15": "The visual direction links the 1881 discovery or investigators to the shaft.",
  "rc-16": "The visual direction describes a coffin being hoisted from a shaft.",
  "rc-17": "The visual direction calls for the Pharaohs' Golden Parade in Cairo.",
};
const documentaryReason: Record<string, string> = {
  "royal-pharaohs": "The visual direction calls for a pharaoh, royal ruler or monumental statue.",
  "tomb-robbery": "The visual direction depicts a looted, disturbed or damaged royal burial.",
  "priests-rewrapping": "The visual direction depicts priests repairing, rewrapping or labelling burials.",
};

export function suggestSmartTemplates(project: Project): SmartPreview {
  const suggestions: SmartSuggestion[] = [];
  let protectedCount = 0, withoutVisual = 0, unchanged = 0;
  for (const [i, scene] of project.scenes.entries()) {
    // Do not redesign the title or closing scene, or overwrite a hand-picked
    // documentary/preset scene. Editing already chosen template parameters
    // remains a manual operation in the Storyboard.
    if (i === 0 || i === project.scenes.length - 1 ||
        scene.template.startsWith("rc-") || SPECIALIZED.has(scene.template) ||
        (scene.params && Object.keys(scene.params).length > 0)) {
      protectedCount++;
      continue;
    }
    const visual = scene.production?.visual?.trim() ?? "";
    if (!visual) { withoutVisual++; continue; }
    const title = scene.production?.sceneTitle ?? "";
    let template: TemplateId | undefined;
    let params: Record<string, string | boolean> | undefined;
    let reason = "";
    let confidence: "high" | "medium" = "high";

    // Original animation is preferred only for unmistakably specific visuals.
    // The director may describe the geometry without naming TT320 in Visual.
    // Permit the existing shaft cutaway only when narration/title ALSO
    // identifies TT320 and Visual explicitly describes shaft + passages.
    const tt320Geometry = /section through rock|cross.section|cutaway/i.test(visual) &&
      /shaft/i.test(visual) && /passage|corridor|chamber/i.test(visual) &&
      /tt.?320/i.test(title + " " + scene.narration);
    const reusable = matchReusableRoyalCacheShot(visual) ??
      (tt320Geometry ? { template: "rc-08" as TemplateId, params: defaultParams("rc-08") } : null);
    if (reusable) {
      template = reusable.template; params = reusable.params;
      reason = reuseReason[template] ?? "Strong visual cue for an existing animation.";
    } else {
      // The full direction + narration may refine the parameters, but a
      // narration-only reference must never trigger changes to an edited scene.
      const directed = matchDocumentaryTemplate({ visual, title });
      const refined = matchDocumentaryTemplate({ visual, title, narration: scene.narration });
      if (directed && refined && directed.template === refined.template) {
        template = refined.template; params = refined.params;
        reason = documentaryReason[template] ?? "The scene direction matches a documentary template.";
        confidence = directed.score >= 6 ? "high" : "medium";
      }
    }
    // No change is safer than suggesting a generic or identical template.
    if (!template || !params || template === scene.template) { unchanged++; continue; }
    suggestions.push({
      sceneId: scene.id, index: i + 1,
      sceneTitle: title || "Scene " + (i + 1),
      currentTemplate: scene.template, proposedTemplate: template,
      proposedParams: params, confidence, reason,
    });
  }
  return { suggestions, summary: {
    total: project.scenes.length, protected: protectedCount,
    withoutVisual, unchanged,
  } };
}

/**
 * Apply only the explicitly approved suggestions, recomputing them from the
 * current project. All fields except template and params remain byte-for-byte
 * equivalent, including narration, label, audio path, manual timing and notes.
 */
export function applySmartTemplates(project: Project, sceneIds: string[]) {
  if (!Array.isArray(sceneIds) || sceneIds.length < 1 || sceneIds.length > project.scenes.length ||
      sceneIds.some((id) => typeof id !== "string") || new Set(sceneIds).size !== sceneIds.length)
    throw new Error("Select one or more unique scene IDs from the preview.");
  const available = new Map(suggestSmartTemplates(project).suggestions.map((s) => [s.sceneId, s]));
  for (const id of sceneIds)
    if (!available.has(id)) throw new Error("Scene " + id + " is no longer eligible. Analyze the project again.");
  const selected = new Set(sceneIds);
  const scenes: Scene[] = project.scenes.map((scene) => {
    if (!selected.has(scene.id)) return { ...scene };
    const suggestion = available.get(scene.id)!;
    return { ...scene, template: suggestion.proposedTemplate, params: { ...suggestion.proposedParams } };
  });
  return { project: { ...project, scenes }, changedIds: sceneIds };
}
