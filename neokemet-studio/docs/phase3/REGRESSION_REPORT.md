# Phase 3A/3B — Regression report

Branch `phase-3ab/safety-and-intent-validation` compared with baseline commit `97d3e26` (the studio as found on disk). Raw command output is in `evidence/`.

## Summary

| Check | Before | After |
|---|---|---|
| Type check (`npm run typecheck`) | clean | clean |
| Tests (`npm test`) | 21 pass | 42 pass (the same 21, unmodified, plus 21 new) |
| Project validation, 4 projects | OK, 0 warnings | OK, 0 warnings |
| Baseline comparison, 4 projects | — | all `UNCHANGED` |
| Files changed inside `projects/` | — | 0 |
| Files changed inside `engine/` | — | 0 |
| Dependencies changed | — | 0 |
| Calls to ElevenLabs or any paid service | — | 0 |
| Renders of the full documentary | — | 0 |

## The Royal Cache — Full Documentary

| Property | Baseline | This branch |
|---|---|---|
| Scene count and order | 36, `s01`…`s36` | identical |
| Total frames | 23,522 | 23,522 |
| Duration | 784.07 s | 784.07 s |
| Each scene's start frame and length | recorded | identical, all 36 |
| Each scene's measured voice length | recorded | identical (within 0.002 s) |
| Subtitle cues (373), exact frames and text | recorded | identical, all 36 scenes |
| Input handed to the renderer, per scene | recorded | identical, all 36 scenes |
| Narration text, per scene | recorded | identical |
| `project.json` | SHA-256 `4af22673…` | identical |
| Narration folder | 72 files | the same 72 files, identical size and SHA-256; none added, moved, renamed or replaced |
| Timeline warnings | none | none |
| Final movie | SHA-256 `F4B131D2…` | untouched (not re-rendered, not rewritten) |

"Input handed to the renderer" is the exact object Remotion receives for a scene (template, parameters, format, fps, length, cues). Because it is identical and no file under `engine/` changed, every existing template draws what it drew before. This is a statement about inputs and source code; **no frames were rendered or compared**, so nothing is claimed about visual quality.

## Other projects

| Project | Frames before | Frames after | Narration files | Result |
|---|---|---|---|---|
| `royal-cache` (18 scenes, manual 10 s each) | 5,400 | 5,400 | 18, identical | unchanged — manual durations are honoured exactly because every voice fits |
| `demo-great-pyramid` | 1,949 | 1,949 | 16, identical | unchanged |
| `demo-template-library` | 793 | 793 | none | unchanged |

## Behaviour when the new features are not used

| Situation | Result |
|---|---|
| Project with no `production` notes | Intent validator reports "no direction to check" for every scene; nothing else changes. |
| Project with no `narration/manifest.json` | Stamp files are used exactly as before. No manifest is created. |
| Scene with no manual duration | Length is computed by the same formula as before. |
| Scene with a manual duration that fits its voice | Length is exactly the manual value, as before. |
| Project file schema | Not changed. Old project files load; new project files load in the old code. |

## Proof that existing narration is left alone

The last test in the suite takes a size, modified-time and SHA-256 snapshot of every file under `projects/` before the first check and compares it after the last. In between, the suite resolves timelines, runs the intent validator, audits narration, builds (without writing) a manifest, and runs the narration routine against all three narrated projects with a fake provider that fails the test if it is ever called. The snapshots are identical and the fake provider is never called.

Separately, the production folder was checked directly after the work:

- 72 of 72 narration files match the baseline hashes;
- `project.json` matches;
- the final movie's SHA-256 is unchanged;
- no file in the production folder has a modified time later than the start of this work.

## New failure cases now covered by tests

| Area | Case |
|---|---|
| Timeline | Manual duration shorter than recorded narration → scene lengthened, warning shown |
| Timeline | Manual duration shorter than an *estimated* narration → duration kept, subtitles compressed, warning shown |
| Audio mix | A hand-built timeline with a scene shorter than its voice → voice faded out at the scene end; the next scene is silent |
| Subtitles | Reversed, zero-length, out-of-range, overlapping, fractional and empty cues are detected |
| Subtitles | 4,000 randomised combinations of text length, voice length, fps and scene length → always valid, no word lost |
| Saving | Failure after the temporary write, after the backup, and at the rename → original intact, no leftovers |
| Saving | Invalid project → refused before anything is written |
| Saving | Stray temporary file from a killed process → ignored on load |
| Recovery | Damaged `project.json` → clear error naming the restore command; restore brings back the previous version and keeps the damaged file |
| Narration | Reorder, renumber, unlink, spacing edit → 0 generations |
| Narration | Text change or `--force` → new file; every earlier take byte-identical |
| Narration | Provider failure mid-generation → no partial file, scene not relinked |
| Narration | Paid call with `NEOKEMET_NO_PAID=1` → refused before any request |
| Intent | Scenes 23, 30, 31 → "unsupported direction" with the expected alternative |
| Intent | Validation never mutates the project and is deterministic |

## Intentional behaviour changes

These are the only places where the studio now acts differently on input that previously "worked":

1. **A manual duration shorter than the recorded narration is lengthened** instead of cutting the voice off or letting it run into the next scene. No bundled project is affected.
2. **Narration is not regenerated for linked audio that has no text stamp.** It is kept and reported; `--force` regenerates. Affects `royal-cache` (18 clips), which previously would have been regenerated on request.
3. **A new take or an upload never overwrites an existing file**; it gets a new name (`23-s23-2.mp3`).
4. **Deleting a project moves it to `workspace/trash/`** instead of erasing it.
5. **Saving keeps the previous version** as `project.json.bak` (ignored by git).

## One side effect to know before deploying

The scene render cache key includes the size and modified time of every file under `engine/src`, `shared/` and `engine/public`. This branch changes one file in `shared/` and adds two, so on the machine where it is installed **the next export will re-render scenes instead of reusing cached clips**. That is existing behaviour for any code change or fresh checkout, not something this branch introduced, and it does not affect narration or the existing movie. A full re-render of the documentary took roughly 1 h 35 min on 12 November. See the unresolved-issues list.
