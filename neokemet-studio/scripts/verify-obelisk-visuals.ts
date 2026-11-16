// Standalone visual smoke test. Never writes into bundled projects.
// Usage: npx tsx scripts/verify-obelisk-visuals.ts
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { parseProductionMarkdown } from "../shared/production.ts";
import { parseProject } from "../server/projects.ts";
import { resolveTimeline } from "../server/timeline.ts";
import { renderScenePreview, closeBrowser } from "../server/render.ts";

const root = path.resolve("docs/obelisk-test");
const source = fs.readFileSync(path.join(root, "ancient-egyptian-obelisks.production.md"), "utf8");
const imported = parseProductionMarkdown(source, "Ancient Egyptian Obelisks");
if (imported.scenes.length !== 8 || imported.scenes.some((s) => s.template !== "obelisk")) throw new Error("Expected 8 dedicated Obelisk scenes");
const out = path.resolve(process.env.OBELISK_OUTPUT_DIR || "workspace/obelisk-visual-check");
fs.mkdirSync(out, { recursive: true });
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "neokemet-obelisk-"));
try {
  for (const format of ["9:16", "16:9"] as const) {
    const project = parseProject({ title: "Obelisk visual regression", format, fps: 30, subtitles: false, audio: { music: "none", sfx: false }, scenes: imported.scenes });
    const tl = await resolveTimeline(project, temp);
    const dest = path.join(out, format.replace(":", "x"));
    fs.mkdirSync(dest, { recursive: true });
    for (const s of tl.scenes) {
      const still = await renderScenePreview(project, s, s.durationInFrames * 0.6, 0.5);
      const file = path.join(dest, "scene-" + String(s.index + 1).padStart(2, "0") + ".png");
      fs.copyFileSync(still, file);
      console.log(format, String(s.index + 1).padStart(2, "0"), file);
    }
  }
} finally {
  await closeBrowser();
  fs.rmSync(temp, { recursive: true, force: true });
}
console.log("16 Obelisk stills generated in " + out);
