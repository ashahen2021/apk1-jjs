// Command-line interface: everything the app can do, scriptable.
//   tsx server/cli.ts validate <project>
//   tsx server/cli.ts narrate  <project> [--force]
//   tsx server/cli.ts still    <project> <sceneNo> [frame]
//   tsx server/cli.ts scene    <project> <sceneNo>
//   tsx server/cli.ts render   <project> [--format 16:9] [--no-subtitles]
import fs from "node:fs";
import path from "node:path";
import { FORMAT_IDS } from "../shared/catalog.ts";
import { narrateProject } from "./narrate.ts";
import { loadProject, planStoryboard, projectDir } from "./projects.ts";
import { closeBrowser, inspectOutput, renderProject, renderScenePreview } from "./render.ts";
import { resolveTimeline } from "./timeline.ts";

const [cmd, target, ...rest] = process.argv.slice(2);
const flag = (name: string) => rest.includes(`--${name}`);
const opt = (name: string) => { const i = rest.indexOf(`--${name}`); return i >= 0 ? rest[i + 1] : undefined; };
const positional = rest.filter((a, i) => !a.startsWith("--") && !(rest[i - 1]?.startsWith("--") && ["format"].includes(rest[i - 1].slice(2))));

const main = async () => {
  if (!cmd || !target) { console.log("Usage: validate|narrate|still|scene|render <project folder or slug> [options]"); process.exit(1); }
  const where = fs.existsSync(target) ? target : projectDir(target);
  const { project, dir } = loadProject(where);
  const format = opt("format");
  if (format) { if (!(FORMAT_IDS as string[]).includes(format)) throw new Error(`Unknown format "${format}". Use one of: ${FORMAT_IDS.join(", ")}`); project.format = format as typeof project.format; }
  if (flag("no-subtitles")) project.subtitles = false;
  // live bar on a terminal; sparse lines when piped to a file
  let lastLine = "", lastPct = -10;
  const bar = (p: { message: string; percent: number }) => {
    if (process.stdout.isTTY) return void process.stdout.write(`\r[${String(p.percent).padStart(3)}%] ${p.message.padEnd(64).slice(0, 64)}`);
    if (p.message !== lastLine && (p.percent - lastPct >= 10 || !/^Rendering/.test(p.message))) { console.log(`[${String(p.percent).padStart(3)}%] ${p.message}`); lastLine = p.message; lastPct = p.percent; }
  };

  if (cmd === "validate") {
    const tl = await resolveTimeline(project, dir);
    console.log(`OK  "${project.title}" — ${tl.scenes.length} scenes, ${tl.seconds.toFixed(2)} s, ${project.format} @ ${project.fps} fps`);
    tl.scenes.forEach((s) => console.log(`  ${String(s.index + 1).padStart(2)}  ${s.scene.template.padEnd(15)} ${(s.durationInFrames / project.fps).toFixed(2).padStart(6)} s  voice ${s.narrationSec.toFixed(2)} s ${s.estimated ? "(estimate)" : "(measured)"}  ${s.cues.length} cues`));
    tl.warnings.forEach((w) => console.log("  ! " + w));
  } else if (cmd === "plan") {
    // dry run: build a storyboard from the project's script without saving anything
    const scenes = planStoryboard(project.title, project.script);
    console.log(`OK  ${scenes.length} scenes from ${scenes.length} paragraphs`);
    scenes.forEach((s, i) => console.log(`  ${String(i + 1).padStart(2)}  ${s.template.padEnd(15)} ${String(s.narration.split(/\s+/).length).padStart(4)} words`));
  } else if (cmd === "narrate") {
    const r = await narrateProject(project, dir, "piper", { force: flag("force"), onProgress: (m, p) => bar({ message: m, percent: p }) });
    fs.writeFileSync(path.join(dir, "project.json"), JSON.stringify(project, null, 2) + "\n");
    console.log(`\nNarration: ${r.made} generated, ${r.total - r.made} already up to date.`);
  } else if (cmd === "still") {
    const tl = await resolveTimeline(project, dir);
    const s = tl.scenes[Number(positional[0] ?? 1) - 1];
    if (!s) throw new Error("No such scene.");
    const f = await renderScenePreview(project, s, positional[1] ? Number(positional[1]) : s.durationInFrames * 0.6, 0.5);
    console.log(f);
  } else if (cmd === "scene" || cmd === "render") {
    const only = cmd === "scene" ? Number(positional[0] ?? 1) - 1 : undefined;
    const r = await renderProject(project, dir, bar, only);
    const i = await inspectOutput(r.file);
    console.log(`\n${r.file}\n  ${i.width}×${i.height}, ${i.fps} fps, ${i.frames} frames, ${i.seconds.toFixed(2)} s, ${i.codec} + ${i.audio}, ${(i.bytes / 1e6).toFixed(1)} MB\n  scenes: ${r.rendered} rendered, ${r.reused} reused from cache; narrated scenes: ${r.narrated}; took ${r.tookSec.toFixed(1)} s`);
    r.warnings.forEach((w) => console.log("  ! " + w));
  } else throw new Error(`Unknown command "${cmd}"`);
  await closeBrowser();
};
main().catch(async (e) => { console.error("\nError: " + (e instanceof Error ? e.message : String(e))); await closeBrowser(); process.exit(1); });
