import fs from "node:fs";
import path from "node:path";
import { paramProblems } from "../shared/params.ts";
import { planFromScript, splitScript } from "../shared/planner.ts";
import { MAX_SCENES, Project, ProjectSchema, Scene } from "../shared/schema.ts";
import { slugify } from "../shared/timing.ts";
import { ensureDir, PROJECTS_DIR } from "./paths.ts";
import { backupPathOf, type SaveFault, writeFileAtomic } from "./persist.ts";

export const projectDir = (slug: string) => {
  const clean = slugify(slug);
  return path.join(PROJECTS_DIR, clean);
};

/** Readable validation errors: "scenes[2].template: Invalid option…". */
export const parseProject = (raw: unknown): Project => {
  const r = ProjectSchema.safeParse(raw);
  if (!r.success) throw new Error("Invalid project:\n" + r.error.issues.map((i) => `  ${i.path.map((p) => (typeof p === "number" ? `[${p}]` : `.${String(p)}`)).join("").replace(/^\./, "") || "(root)"}: ${i.message}`).join("\n"));
  r.data.scenes.forEach((s, i) => { const bad = paramProblems(s); if (bad.length) throw new Error(`Invalid project:\n${bad.map((b) => `  scenes[${i}].${b}`).join("\n")}`); });
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
  let raw: unknown;
  try { raw = JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (e) {
    const bak = backupPathOf(file);
    const hint = fs.existsSync(bak) ? ` A previous version is available: run "npm run restore -- ${path.basename(path.dirname(file))}" to bring it back (${path.basename(bak)}).` : "";
    throw new Error(`Could not read ${file}: ${e instanceof Error ? e.message : String(e)}.${hint}`);
  }
  return { project: parseProject(raw), dir: path.dirname(file) };
};

/**
 * Validate and write a project file into `dir` atomically, keeping the version
 * it replaces as project.json.bak. Saving content identical to what is on disk
 * changes nothing (no rewrite, no new backup).
 */
export const writeProjectFile = (dir: string, raw: unknown, opts: { fault?: SaveFault } = {}) => {
  const project = parseProject(raw);
  const file = path.join(ensureDir(dir), "project.json");
  const text = JSON.stringify(project, null, 2) + "\n";
  if (!opts.fault && fs.existsSync(file) && fs.readFileSync(file, "utf8") === text) return { project, dir, written: false, backup: null as string | null };
  const { backup } = writeFileAtomic(file, text, { fault: opts.fault, verify: (t) => { parseProject(JSON.parse(t)); } });
  return { project, dir, written: true, backup };
};

export const saveProject = (slug: string, raw: unknown) => writeProjectFile(projectDir(slug), raw);

/**
 * Bring back the previous version of a project file. The file being replaced is
 * kept (it becomes the new backup), so a restore can itself be undone.
 */
export const restoreProjectBackup = (dir: string) => {
  const file = path.join(dir, "project.json"), bak = backupPathOf(file);
  if (!fs.existsSync(bak)) throw new Error(`No previous version to restore: ${bak} does not exist.`);
  const text = fs.readFileSync(bak, "utf8");
  let project: Project;
  try { project = parseProject(JSON.parse(text)); }
  catch (e) { throw new Error(`The backup is not a valid project and was not restored: ${e instanceof Error ? e.message : String(e)}`); }
  // Keep whatever is there now (even if damaged) so nothing is lost by restoring.
  const damaged = fs.existsSync(file) ? fs.readFileSync(file) : null;
  writeFileAtomic(file, text, { backup: false });
  if (damaged) fs.writeFileSync(bak, damaged);
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
