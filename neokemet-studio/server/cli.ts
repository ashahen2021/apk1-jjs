// Command-line interface: everything the app can do, scriptable.
//   tsx server/cli.ts validate <project>
//   tsx server/cli.ts intent   <project> [--all] [--sound]   (read-only)
//   tsx server/cli.ts audio    <project> [--write-manifest]  (read-only without the flag)
//   tsx server/cli.ts baseline <project> [--write]           (compare with, or record, baselines/<slug>.json)
//   tsx server/cli.ts restore  <project>                     (bring back project.json.bak)
//   tsx server/cli.ts narrate  <project> [--force]
//   tsx server/cli.ts still    <project> <sceneNo> [frame]
//   tsx server/cli.ts scene    <project> <sceneNo>
//   tsx server/cli.ts render   <project> [--format 16:9] [--no-subtitles]
import fs from "node:fs";
import path from "node:path";
import { FORMAT_IDS } from "../shared/catalog.ts";
import { INTENT_LABELS, validateIntent } from "../shared/intent.ts";
import { auditNarration, describeExistingAudio, loadManifest, MANIFEST_FILE, saveManifest } from "./audio-manifest.ts";
import { BASELINE_DIR, baselineFile, captureBaseline, compareBaseline, readBaseline } from "./baseline.ts";
import { narrateProject } from "./narrate.ts";
import { loadProject, planStoryboard, projectDir, restoreProjectBackup, writeProjectFile } from "./projects.ts";
import { closeBrowser, inspectOutput, renderProject, renderScenePreview } from "./render.ts";
import { resolveTimeline } from "./timeline.ts";

const [cmd, target, ...rest] = process.argv.slice(2);
const flag = (name: string) => rest.includes(`--${name}`);
const opt = (name: string) => { const i = rest.indexOf(`--${name}`); return i >= 0 ? rest[i + 1] : undefined; };
const positional = rest.filter((a, i) => !a.startsWith("--") && !(rest[i - 1]?.startsWith("--") && ["format"].includes(rest[i - 1].slice(2))));

const main = async () => {
  if (!cmd || !target) { console.log("Usage: validate|intent|audio|baseline|restore|narrate|still|scene|render <project folder or slug> [options]"); process.exit(1); }
  const where = fs.existsSync(target) ? target : projectDir(target);
  if (cmd === "restore") {
    // must work when project.json itself is unreadable
    const folder = fs.statSync(where).isDirectory() ? where : path.dirname(where);
    const r = restoreProjectBackup(folder);
    console.log(`Restored the previous version of "${r.project.title}" (${r.project.scenes.length} scenes). The file it replaced is kept as project.json.bak.`);
    return;
  }
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
    writeProjectFile(dir, project);
    console.log(`\nNarration: ${r.made} generated, ${r.reused} reused from existing audio, ${r.total - r.made - r.reused} already up to date.`);
    if (r.keptUnverified.length) console.log(`  ! Scenes ${r.keptUnverified.join(", ")}: existing audio has no record of its text and was kept. Use --force to record these again.`);
    if (r.voiceDiffers.length) console.log(`  ! Scenes ${r.voiceDiffers.join(", ")}: audio is current but was recorded with a different voice or settings.`);
  } else if (cmd === "intent") {
    // read-only: does each template show what its visual direction asks for?
    const report = validateIntent(project);
    const s = report.summary;
    console.log(`Production intent for "${project.title}": ${s.validated} validated, ${s.unsupported} unsupported, ${s.review} need review, ${s["no-direction"]} without direction (of ${s.total})`);
    for (const x of report.scenes) {
      if (x.status === "no-direction" && !flag("all")) continue;
      console.log(`  ${String(x.index).padStart(2)}  ${INTENT_LABELS[x.status].padEnd(22)} ${x.template.padEnd(18)} ${x.message}`);
      if (flag("sound") && x.soundNotPerformed.length) console.log(`      sound not performed: ${x.soundNotPerformed.join(", ")}`);
    }
  } else if (cmd === "audio") {
    // read-only unless --write-manifest: how each narration file relates to its text and voice
    const rows = auditNarration(project, dir);
    const count = (st: string) => rows.filter((r) => r.state === st).length;
    console.log(`Narration audio for "${project.title}": ${rows.length} scenes — ${count("verified")} verified, ${count("stamp-match")} match their text stamp, ${count("unverified")} unverified, ${count("text-changed")} text changed, ${count("modified")} modified, ${count("missing-file")} missing, ${count("no-audio")} without audio`);
    rows.forEach((r) => console.log(`  ${String(r.index + 1).padStart(2)}  ${r.state.padEnd(13)} ${(r.file ?? "—").padEnd(28)} ${r.bytes ? String(r.bytes).padStart(8) + " bytes  sha256 " + r.sha256!.slice(0, 16) : ""}`));
    console.log(`  manifest: ${loadManifest(dir) ? "present" : "none (legacy stamp files are used)"}`);
    if (flag("write-manifest")) {
      const m = describeExistingAudio(project, dir);
      saveManifest(dir, m);
      console.log(`  wrote ${MANIFEST_FILE} with ${m.entries.length} entries. No audio file was changed.`);
    }
  } else if (cmd === "baseline") {
    const now = await captureBaseline(dir);
    if (flag("write")) { fs.mkdirSync(BASELINE_DIR, { recursive: true }); fs.writeFileSync(baselineFile(now.slug), JSON.stringify(now, null, 2) + "\n"); console.log(`Recorded ${baselineFile(now.slug)}`); }
    else {
      const was = readBaseline(now.slug);
      if (!was) throw new Error(`No baseline recorded for "${now.slug}". Record one with: npm run baseline -- ${now.slug} --write`);
      const diff = compareBaseline(was, now);
      console.log(diff.length ? `CHANGED  "${now.slug}" differs from its baseline:\n${diff.map((d) => "  - " + d).join("\n")}` : `UNCHANGED  "${now.slug}" — ${now.sceneCount} scenes, ${now.totalFrames} frames, ${now.narrationFiles.length} narration files all identical to the baseline`);
      if (diff.length) process.exitCode = 1;
    }
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
