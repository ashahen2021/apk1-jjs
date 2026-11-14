# NeoKemetAI V1 — Topic-Aware Shorts (15–30 s)

Status: **beta implementation for three subject domains**. The opt-in planner, 15 original SVG illustrations, 15/30-second editor controls, hooks, and caption selection are implemented and have passed code + visual smoke tests. The broader universal art library and full editorial QA below remain future work.
Working branch: `feature/v1-topic-aware-shorts`, based on `develop/neokemetai-v3.1`.
Purpose: preserve V1's approachable, expressive, flat illustrated SVG art; stop repeating unrelated generic drawings for unrelated subjects.

## Non-negotiable boundaries
- Work on this branch only; do not modify or merge Cinematic V3 templates, the original Royal Cache film, audio, existing project data, or stable branches.
- No cloud image/video/voice calls. Run local deterministic art generation and render tests; `NEOKEMET_NO_PAID=1`.
- Keep existing generic templates and project JSON valid. Add the opt-in **V1 Topic-Aware Shorts** workflow without changing existing or long-form projects.
- No forced 15/30-second timing when recorded narration will overrun. Report a timing conflict and offer retiming/rewrite instead of truncation.
- Prefer simple readable human-scale illustrations, not photorealistic graphics or decorative V3 backgrounds.
- A seed, recolour, zoom, or pan alone is **not** a new subject illustration.

## Verified starting point (code review)
- `shared/planner.ts`: keyword mapping creates generic title/characters/landscape/cutaway/etc and forces title/end-card on first/last scene.
- `shared/catalog.ts`: nine environment categories and a small fixed action vocabulary.
- `shared/production.ts`: Markdown visual directions become notes, but are only partly turned into visual commands.
- `engine/src/components/Figures.tsx`: simplified reusable figures; existing actions are basic.
- `engine/src/templates/`: existing generic SVG compositions and V1 pilots.
- `shared/timing.ts`: scene durations are narration-driven; preserve audio safety.
This explains why imported stories can display reusable backgrounds that do not convey the narrated action.

## Editorial standard (applies to opt-in V1 Shorts only)
- Delivery: 9:16, 1080×1920, 30 fps; target 15–30 s, with separate 15 s and 30 s presets.
- **0.0–3.0 seconds:** immediate relevant subject + curiosity hook. No logo or generic title-card delay.
- **3–12/26 seconds:** quick factual story, each visual beat must depict the spoken action/subject. No filler intros.
- **Last 1–2 seconds:** payoff and optional compact CTA, not a large end-card replacing the whole last scene.
- 15 s: generally 3–4 narrative scenes, 8–12 deliberately distinct visual shots.
- 30 s: generally 5–6 narrative scenes, 16–22 deliberately distinct visual shots.
- Change visual information every ~1–2 s by switching composition, action or material detail; camera-only motion does not count as a semantic change.
- Voice should be energetic and intelligible, with brief natural pauses; pacing is editorial, not a voice-speed hack. Script length must be measured against actual audio.
- Bold, legible captions enabled by default, one or two concise lines with contrast; use safe layout zones away from faces, key objects and platform overlays.
- Make the story loopable where naturally possible. Never promise that posting three Shorts a day guarantees viral growth; measure retention instead.
- Protect historical accuracy; no invented discoveries or incorrect objects/periods passed off as fact.

## Architecture required
1. **Story/shot planner**. Extend Markdown/short-script import to produce scene-level concepts, a structured shot plan, asset requirements, action and duration for V1 mode. Do NOT silently fall back to generic temple or unrelated kings. Keep the narration as supplied.
2. **Semantic asset library**. Add reusable SVG components for objects/actions with semantic capabilities (e.g. stone cutting, pigment grinding, brush painting, oil lamp, papyrus harvesting/pressing, Nile cargo/boat, tomb passage, royal burial). Each must include real subject-specific geometry and at least one animation state; expose editing controls.
3. **Compositor**. Compose subject-appropriate assets in differentiated close/wide/cutaway/detail shots, including object-anchored animation and varied blocking, with deterministic seeded variants. Retain V1 flat-poster style.
4. **Timed shot director**. Animate/switch meaningful shots within a single narration scene without splitting voice files. Avoid fades or motion that conceal the new shot. Ensure 15 s => 450 frames and 30 s => 900 frames **only if recorded VO fits**.
5. **Caption/hook layout**. Hook readable within first 3 s. Bold high contrast captions, adaptive lines, collisions avoided with focal objects and each other. Do not burn in old white rectangles on top of faces.
6. **Validation and authoring feedback**. Report exactly what is drawable, missing, unsupported or repeated. A generated story must include an editable shot list with preview, and warnings if semantic coverage is missing.

## Real content acceptance tests (distinct stories)
**A — Painting the Dark**
- Shot subjects: tomb doorway, lamplight, artists grinding pigments, brush tracing underworld imagery on a tomb wall, detailed wall close-up.
- Reusing a generic pharaoh gesturing in a temple courtyard does NOT pass.

**B — How Papyrus Was Made**
- Shot subjects: harvesting papyrus stalks, stripping pith, cross-layering strips, pressing/drying sheet, scribe writing.
- Reusing tomb/cutaway/coffin art does NOT pass.

**C — Nile Stone Transport**
- Shot subjects: quarry extraction, boat loading, cargo secured by rope, boat on Nile, unloading.
- Reusing royal-court character art does NOT pass.

For each topic test 15 s and 30 s presets; verify that at least 80% of planned visual beats have a positively matched semantic illustration (not a keyword-only template label), zero unsupported shots are silently substituted, and no consecutive shots are visually identical. Missing assets yield explicit warnings, not hallucinated images. Include screenshot/contact sheet review at representative frame times.

## Implementation order (small-budget daily tasks)
- **Stage 1 — V1 isolated mode + shot contract + planner + focused tests.** No new artwork yet; draft three storyboards and report missing asset capabilities.
- **Stage 2 — New SVG asset/action modules for Painting the Dark and Papyrus; previews.** This is the first *real illustration* milestone.
- **Stage 3 — Nile transport modules + semantic shot director (1–2 s meaningful changes).** Focus on object/hand animation, transitions, deterministic identity.
- **Stage 4 — Hook, subtitles, collision-safe composition, voice/duration QA for 15/30 s.**
- **Stage 5 — Six short demo renders, visual contact sheets, regression tests, editor workflow, clear README.** Do not export long movies or call paid services.

## Exit criteria
1. New topic produces **different drawn objects and actions**, not the old generic scenes with new labels.
2. First three seconds hook visually and verbally matches topic.
3. At least 80% semantic coverage in the three acceptance topics; unsupported beats explicitly flagged.
4. Each 1–2 seconds adds new visual information; 15/30-second presets respect recorded VO.
5. Captions are readable without collisions; assets remain editable and reusable.
6. Original V1 and V3 projects remain byte-identical; no production audio/video changes.
7. Typecheck and existing regression tests pass; new tests and before/after proof reported.
8. All changes committed to this branch; draft PR only; no merge.
