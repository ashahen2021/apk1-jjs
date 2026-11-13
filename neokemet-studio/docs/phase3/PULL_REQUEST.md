# Phase 3A/3B: foundation, safety and production validation

Makes the studio safer and able to say where a scene's template does not match its written direction, without changing the rendering pipeline or any recorded narration.

**Not in this change:** Multi-Shot Director, Intelligent Sound Director, rigging, visual redesign, timeline UI, Remotion upgrade. No file under `engine/` is touched. No dependency changed. No narration was generated, no paid service was called, and the documentary was not re-rendered.

## What changed

### 1. Timeline and subtitle safety

| File | Change |
|---|---|
| `shared/timing.ts` | `safeSceneSeconds`: a manual duration is honoured exactly when the voice fits; when recorded narration is longer, the scene is lengthened to the normal narration-following length instead of cutting the voice. `cueProblems` detects invalid cue timing. `buildCues` now guarantees displayable cues, re-spreading lines when the normal layout would produce reversed or empty ones. |
| `server/timeline.ts` | Uses the above; adds plain-language warnings; drops cues only as a last resort, with a warning. |
| `server/audio.ts` | Narration that would run past its scene is faded out at the scene boundary. Speech that fits is mixed exactly as before. |
| `server/render.ts` | Surfaces that warning in the export report. |

Before: a manual duration shorter than the voice produced only a warning; the voice continued over the next scene and its subtitles got reversed timings.

### 2. Safe project persistence

| File | Change |
|---|---|
| `server/persist.ts` (new) | `writeFileAtomic`: temporary file, flush, read-back check, backup of the previous version, single rename. Any failure leaves the original untouched and cleans up. |
| `server/projects.ts` | `saveProject` is atomic and keeps `project.json.bak`; an identical save writes nothing. A damaged project file gives an error that names the restore command. `restoreProjectBackup` restores without losing the file it replaces. |
| `server/paths.ts` | Settings are saved through a temporary file. |
| `server/index.ts` | Deleting a project moves it to `workspace/trash/`. Uploading audio never replaces an existing file. |

### 3. Production Intent Validator

| File | Change |
|---|---|
| `shared/capabilities.ts` (new) | A 41-term vocabulary (environments, figures, actions, props), each with the words that ask for it, and one table saying which template shows what. The table is typed by template id, so a new template cannot be added without declaring its capabilities. |
| `shared/intent.ts` (new) | Compares a scene's visual direction with its template. Returns **validated match**, **unsupported direction** (naming what is missing and the closest existing template), or **requires human review**. Understands "no X" constraints. Lists sound cues the audio engine does not perform. Pure; never edits a project. |
| `server/index.ts`, `ui/*` | `POST /api/intent/preview` and a "Production Match Check" card on the Storyboard tab. Report only. |
| `server/cli.ts` | `npm run intent -- <project>` |

Result on the 36-scene documentary: 5 validated, 21 unsupported, 10 need review.

| Scene | Template | Direction asks for | Result |
|---|---|---|---|
| 23 | Tomb cutaway | workers hauling coffins by rope | Unsupported: no workers, no hauling. Closest: RC 16 · The Rushed Removal, which shows everything recognised. |
| 30 | Coffin chamber | modern Cairo at night, vehicles | Unsupported: nothing requested is shown. Closest: RC 17 · Golden Parade. |
| 31 | RC 08 · TT320 cutaway | two routes merging into a museum route | Unsupported: no route map, no museum. "Journey map" covers the route; no template shows a museum. |

No template was changed.

### 4. Audio reuse and cache safety

Audit in `AUDIO_CACHE_AUDIT.md`. In short: narration identity depended only on exact text and on the file path (scene position, id, provider extension), and not at all on voice, model or settings.

| File | Change |
|---|---|
| `server/audio-manifest.ts` (new) | Identity = normalised text + provider + voice fingerprint + model + settings. Read-only audit of every clip. Lookup of existing audio by what it says. Optional `narration/manifest.json`. |
| `server/narrate.ts` | Keeps current audio; reuses matching audio after reordering; keeps audio that has no record of its text unless forced; always writes a new take to a new name through a temporary file. Still writes legacy stamp files. |
| `server/tts.ts` | Model and settings as named constants shared with the identity. `NEOKEMET_NO_PAID=1` blocks paid calls before any request. |
| `server/cli.ts` | `npm run audio -- <project> [--write-manifest]` |

### 5. Baselines and regression tests

| File | Change |
|---|---|
| `server/baseline.ts` (new), `baselines/*.json` | Fingerprint of each bundled project, captured with the original code. `npm run baseline -- <project>` reports drift. |
| `server/selftest-phase3.ts` (new) | 21 checks. `npm test` runs the original 21 first, unmodified, then these. |

## Evidence

In `docs/phase3/evidence/`:

- `typecheck.txt` — clean
- `tests.txt` — 42 of 42 pass
- `validate-and-baseline.txt` — all four projects validate; all four `UNCHANGED`
- `intent-royal-cache-full-documentary.txt` — full per-scene report
- `audio-royal-cache-full-documentary.txt` — 36 of 36 clips match their text

Documentary: 36 scenes, same order, 23,522 frames, 784.07 s, before and after. See `REGRESSION_REPORT.md`.

## Behaviour changes to review

1. A too-short manual duration is lengthened rather than truncating narration.
2. Linked audio with no text stamp is no longer regenerated on request without `--force` (affects the 18-scene `royal-cache`).
3. New takes and uploads get a new file name instead of overwriting.
4. Deleting a project moves it to `workspace/trash/`.
5. Saves leave a `project.json.bak` (git-ignored).

## Known side effect

The scene render cache key covers every file in `shared/`. This change edits one and adds two, so the first export after installing it re-renders scenes rather than reusing cached clips. This is how the cache already behaves for any code change. The fix is specified as Phase 3C.0.

## Limits

- The validator matches words in the direction against a capability table. It does not look at pictures. No frames were rendered, so no claim is made about visual quality.
- Preset capabilities were taken from source comments and catalogue descriptions and should be reviewed by someone who knows the shots.

## Not merged

This branch has not been merged anywhere. See `UNRESOLVED_AND_NEXT_STEPS.md` and `PHASE_3C_3D_SPEC.md`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
