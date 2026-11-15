# Bespoke SVG packs for NeoKemetAI Studio — V1 beta

The original **Great Pyramid** sequences are the visual benchmark: handcrafted
objects, intentional compositions and camera motion. A local LLM can *plan*
visual beats, but it should not be trusted to draw the final coordinates from
scratch without art direction.

## What is implemented

- A Painting the Dark pack: 12 distinct, project-portable SVG illustrations,
  organised as three shots for each of the four example scenes.
- A palette with native mineral blue, malachite green, red ochre, yellow ochre,
  chalk white, dark ink and limestone; central Tomb Painting Flat light/shadow.
- SVG-based people, painting tools, oil lamps, mineral palettes, mural registers,
  interior walls, lotus symbols and a close-up of grinding pigments.
- Anti-empty-art checks on all new drafts before they can reach the approval UI.
- Full-size artwork review via click-to-zoom in Visual Lab.

### On Windows

1. Start the V1 beta studio (normal startup command: npm start).
2. Select **Painting the Dark | V1 Illustrated Short**.
3. Open **Visual Lab → Analyze script and scenes**.
4. Click **Generate bespoke SVG art (offline)** (does not require Ollama).
5. Examine all twelve illustration previews; click a thumbnail to zoom.
6. **Approve drawings** only if the whole set matches the narration.
7. Check Storyboard previews and render a local MP4; save only if satisfied.

The demo's script, duration and audio are never modified by the proposal step.
The artwork is attached in-memory on approval and persisted when the user
presses **Save project**. The previous scene can be restored with Undo prior
to reloading.

### Adding a new work

Author an original subject pack in shared/visualLabBespoke.ts or a sibling
module. Reuse the typed shape constructors (ellipse, polygon, line, rectangle)
and scene-recipes, rather than asking an LLM for freehand SVG text. New code
must return one {id,shots} entry per current scene, preserve IDs, and remain
inside VisualPackageSchema. Then:

1. Add a strict subject detector and implement pack-specific propose...Art().
2. Register it in proposeOfflineArt() and expose offlineAvailable through
   analyzeVisualLab(); check that other topics cannot silently use it.
3. Define at least 2–3 distinctive shot compositions per narrated action.
4. Check auditIllustrations() and include a non-mutating test.
5. Render 1080×1920 proofs; visually inspect anatomy, palette, readability,
   cropped objects, historical plausibility and similarity with other shots.

Only safe shape data (no executable SVG/CSS/JS) is saved into project.json.
For new historical topics, research the details first and label hypothetical
or reconstructed objects where necessary. Avoid inventing hieroglyph strings.

### Design limitations

- The hand-authored Egyptian mural pack is not a universal image generator.
  Each genuinely new subject needs a new authored set of SVG assets.
- The visual quality gate is a *minimum* density, framing and repetition filter,
  not a replacement for a human art review.
- Ollama can still propose geometry for unsupported topics, but weak sketches
  are now rejected and existing project art remains unchanged.
- Royal Cache, Great Pyramid classic templates, production scenes and the
  original Painting the Dark demo JSON are not overwritten by this beta.

### Verification

- npm run typecheck
- npx tsx server/selftest-visual-lab.ts
- npx tsx server/selftest-bespoke.ts
- npx tsx scripts/bespoke-art-render-smoke.ts
- Inspect CI artifact: v1-bespoke-painting-eight-stills
