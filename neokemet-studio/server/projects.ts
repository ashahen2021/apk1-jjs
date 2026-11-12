import fs from "node:fs";
import path from "node:path";
import { planFromScript, splitScript } from "../shared/planner.ts";
import { MAX_SCENES, Project, ProjectSchema, Scene } from "../shared/schema.ts";
import { slugify } from "../shared/timing.ts";
import { ensureDir, PROJECTS_DIR } from "./paths.ts";

export const projectDir = (slug: string) => {
  const clean = slugify(slug);
  return path.join(PROJECTS_DIR, clean);
};

/** Readable validation errors: "scenes[2].template: Invalid option…". */
export const parseProject = (raw: unknown): Project => {
  const r = ProjectSchema.safeParse(raw);
  if (!r.success) throw new Error("Invalid project:\n" + r.error.issues.map((i) => `  ${i.path.map((p) => (typeof p === "number" ? `[${p}]` : `.${String(p)}`)).join("").replace(/^\./, "") || "(root)"}: ${i.message}`).join("\n"));
  const ids = new Set<string>();
  for (const s of r.data.scenes) { if (ids.has(s.id)) throw new Error(`Invalid project: duplicate scene id "${s.id}"`); ids.add(s.id); }
  return r.data;
};

/**
 * Build a storyboard from a script and validate it as a whole before anyone
 * uses it. Throws a plain-language error and returns nothing on failure, so a
 * caller can never end up holding a partial or invalid storyboard.
 */
export const planStoryboard = (title: string, script: string): Scene[] => {
  const paragraphs = splitScript(script);
  if (!paragraphs.length) throw new Error("The script is empty. Paste or import a script first.");
  if (paragraphs.length > MAX_SCENES)
    throw new Error(`The script has ${paragraphs.length} paragraphs, and each paragraph becomes one scene. The limit is ${MAX_SCENES} scenes. Join some paragraphs (remove the blank line between them) and try again.`);
  const scenes = planFromScript(title || "Untitled", script);
  return parseProject({ title: title || "Untitled", scenes }).scenes;
};

export const loadProject = (dirOrFile: string) => {
  const file = fs.statSync(dirOrFile).isDirectory() ? path.join(dirOrFile, "project.json") : dirOrFile;
  return { project: parseProject(JSON.parse(fs.readFileSync(file, "utf8"))), dir: path.dirname(file) };
};

export const saveProject = (slug: string, raw: unknown) => {
  const project = parseProject(raw);
  const dir = ensureDir(projectDir(slug));
  fs.writeFileSync(path.join(dir, "project.json"), JSON.stringify(project, null, 2) + "\n");
  return { project, dir };
};

export const listProjects = () =>
  fs.existsSync(PROJECTS_DIR)
    ? fs.readdirSync(PROJECTS_DIR).filter((d) => fs.existsSync(path.join(PROJECTS_DIR, d, "project.json"))).map((slug) => {
        try {
          const p = JSON.parse(fs.readFileSync(path.join(PROJECTS_DIR, slug, "project.json"), "utf8"));
          return { slug, title: String(p.title ?? slug), scenes: Array.isArray(p.scenes) ? p.scenes.length : 0, format: String(p.format ?? "9:16") };
        } catch { return { slug, title: slug, scenes: 0, format: "?" }; }
      })
    : [];
