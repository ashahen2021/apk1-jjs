# NeoKemet Studio V1 — Tomb Painting Flat (visual foundation)

**Development branch:** `feature/v1-tomb-painting-flat` (forked from `feature/v1-visual-development-lab`). This branch does **not** replace V3, existing films or the user's production installation.

## Central theme
`engine/src/theme/tombPaintingFlat.ts` — the only V1 theme definition.

Fixed 8 colors:
- Limestone `#E9DCC0`; gypsum white `#F4EFE3`
- Yellow ochre `#D9A441`; ochre red `#B5452B`
- Egyptian blue `#2E6DA4`; malachite green `#3E8E6E`
- Carbon black `#1B1A17`; tomb dark `#12100E`

Outline width 5 px, full-bleed 1080×1920 at 30 fps. Flat fills only. One radial dark/glow mask is permitted for tomb lighting, on art layers only; title and captions remain readable. Stone-noise speckle opacity 4%. All palette/texture/light/outline defaults live in the theme file.

## Updated renderer files

| File | Changes |
|---|---|
| `engine/src/templates/V1TopicShort.tsx` | Updated the V1 topic-aware template to use centralized theme, real full-bleed scenes and non-stick Egyptian figure silhouettes |
| `engine/src/templates/V1LabShots.tsx` | Applies exactly the same style to Visual Development Lab's generated SVG; maps old palette tokens to the new fixed palette, removes large legacy inner frames |
| `engine/src/templates/TombPaintingParts.tsx` | New reusable V1 component vocabulary: workers, stone blocks, ramp, quarry/pyramid, tomb walls, lamps, Nile riverboats, papyrus, pigments and artistic action |
| `engine/src/components/Shorts15Captions.tsx` | Bold flat caption bar with theme-only colors; removes previous non-theme gradient |
| `engine/src/StudioScene.tsx` | Disables older distressed-paper overlays for V1 only; preserves existing overlays for documentary/V3 templates |

No V3 templates or Royal Cache presets were changed.

## Day/tomb mode
`getSceneLightingMode(scene)` selects `tomb` when text involves tombs, darkness, lamplight, shafts, night, underground corridors or burial; otherwise `day`. A scene may explicitly override its lighting with `scene.params.lighting = "day"|"tomb"`. In tomb mode, the art outside the lamp's radial range is dimmed to about 19% (center brighter); headings are drawn above the lighting pass.

## Drawings and composition
- Removed the former 970×1340 inset poster frame and the empty lower-band divider.
- 15 V1 motif shot types continue to work, with new full-screen illustrations.
- Approved Visual Lab SVG drawings use the same colors and outlines and are vertically extended; stored art geometry is not rewritten in project data.
- Custom generated drawings still require human review for chronology, invented symbols and anatomical detail.

## Verification and images
- `npm run typecheck`, `npm test`, `npx tsx server/selftest-v1.ts`, `npx tsx server/selftest-visual-lab.ts`, `npx tsx server/selftest-tomb-flat.ts`
- `npx tsx scripts/tomb-flat-render-stills.ts` saves **native 1080×1920 PNG stills**, one per updated V1 template and three illustration domains:
  - `workspace/tomb-flat-stills/V1TopicShort-painting-dark.png`
  - `workspace/tomb-flat-stills/V1TopicShort-papyrus.png`
  - `workspace/tomb-flat-stills/V1TopicShort-nile-transport.png`
  - `workspace/tomb-flat-stills/V1LabShots-pyramid-ramp.png`
- CI uploads these images as `tomb-painting-flat-native-stills` workflow artifact.

## Remaining user instructions
This commit delivers the **style foundation** only. The user has mentioned four more requirements:
2. Character design
3. Vertical composition
4. Historical accuracy of symbols
5. Final testing

The exact text of these requirements must be applied before artistic approval and merging. Keep this branch a draft until the follow-on revisions pass tests and screenshots are reviewed.


## Instruction 2 — Articulated Egyptian figures (implemented)
- `engine/src/templates/EgyptianTombRig.tsx` is a native SVG rig on an **18-square Egyptian proportion grid**, with head in profile, frontal eye and shoulders, adult-sized limbs and characteristic profile stance.
- SVG layers are separate groups: head, torso, hips, both upper arms, forearms, hands and legs; joint rotation drives slow motion without body bouncing.
- Man/woman silhouettes and built-in poses: standing, painting, grinding pigment, carrying a lamp, and walking.
- `TombPerson` is now a compatibility wrapper using this rig for all existing V1 subject illustrations.
- Review composition: `engine/src/EgyptianRigPoseSheet.tsx`; generated PNG `EgyptianRig-Five-Poses.png`.

## Instruction 3 — Vertical safe composition (implemented)
- Central configuration: `engine/src/theme/tombPaintingFlat.ts`:
  - No text above y=220 or below y=1500 (bottom 420px excluded).
  - Scene's primary figures/actions are staged against the register y=1225, with main visual content in y=350–1450; characters and the register stay visible ABOVE the text band.
  - Title is a **72–90px gypsum-white serif** in a carbon-black full-width band at y=1240–1440, not at the top.
  - Word captions occupy **the exact same band**; titles automatically hide for frames when word captions are visible, avoiding overlaps.
  - Every V1 shot uses a thin ochre-red register ground rule and ~4.5% slow push centered at the ground line; title and captions stay fixed.
  - `planV1Short` schedules approximately 2–3-second illustrated cuts, prohibits adjacent identical motifs and limits each procedural motif to two occurrences in a rolling 20-second interval. `conformV1VisualCadence` adapts the **render-only** scene list if the measured voice changes scene length, without overwriting project.json.
- `shared/wordTiming.ts` is the timestamp-driven caption scheduler. If verified `wordTimings` are attached to scene data, word timing follows those timestamps at frame precision.
- **Limitation made explicit:** Existing ElevenLabs MP3s do not automatically contain word-level alignment. Without exact per-word metadata, captions use duration-weighted estimates within the measured spoken span, with a timeline warning. Audio itself is not altered. For exact lip/word timing, import verified alignment; do not market estimated sync as exact.
- Subject-specific art approved in Visual Lab is never changed by automatic motif replacement. If that art cannot cover the measured duration, the timeline warns and requests additional unique art.
- Video pace and authenticity still need final visual review; instruction #4 historical symbols and #5 final testing remain pending.

### GitHub validation
`npm run typecheck`, `npm test`, `npx tsx server/selftest-v1.ts`, `npx tsx server/selftest-visual-lab.ts`, `npx tsx server/selftest-tomb-flat.ts`, `npx tsx scripts/tomb-flat-render-stills.ts`, and `npx tsx scripts/render-tomb-rig-poses.ts`.
