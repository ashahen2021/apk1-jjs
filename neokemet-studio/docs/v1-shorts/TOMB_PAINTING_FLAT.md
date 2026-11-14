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
