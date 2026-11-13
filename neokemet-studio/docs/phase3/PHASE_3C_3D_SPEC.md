# Phase 3C / 3D — Technical specification

Specification only. Nothing here is implemented.

**Assumed scope.** The brief names the phases without defining them. This document takes **3C = Multi-Shot Director** and **3D = Intelligent Sound Director**, the two items the 3A/3B brief said not to begin. If the audit assigns them differently, the sections still stand on their own.

**Rule carried over from 3A/3B.** A project that does not use a new feature must resolve to the same frames, cues and renderer input as today. The baseline files and `npm run baseline` are the gate.

---

## 3C.0 — Prerequisite: stable cache keys

Must land first, alone, in its own pull request.

**Problem.** `engineHash()` in `server/render.ts` hashes the path, size and modified time of every file under `engine/src`, `shared/` and `engine/public`. Any checkout, copy or unrelated edit invalidates every rendered scene (about 1.5 hours for the reference film). `decodeAudio()` keys by absolute path and modified time.

**Change.**

| Cache | Key today | Key proposed |
|---|---|---|
| Engine bundle | path + size + mtime of all files | SHA-256 of file contents, sorted by relative path |
| Scene clip | renderer input + engine hash | renderer input + content hash of `engine/src`, `engine/public`, and only the `shared/` modules the engine imports (`catalog`, `params`, `schema` types) |
| Decoded audio | absolute path + size + mtime | SHA-256 of the source file |

**Migration.** Every existing key changes once. To avoid a re-render of the reference film, ship a one-time, read-only re-keying step: for each cached clip whose old key can be recomputed from an unchanged install, hard-link or copy it under the new key. If the old key cannot be reproduced, the clip is simply not reused.

**Acceptance.** Copying the install to a new folder and exporting the reference film reuses every scene clip. Editing `server/*.ts` or `shared/intent.ts` invalidates nothing.

---

## 3C — Multi-Shot Director

### Goal

Let one narrated scene be covered by several consecutive shots, each an existing template with its own parameters and camera, so a 20-second paragraph is not one static idea. Directly addresses the validator's most common finding: a direction that names two or three subjects while a template shows one.

### Non-goals

- No new artwork, characters or rigging.
- No free-form timeline editor.
- No change to how narration is recorded, stored or timed.
- No AI service.

### Data model (additive, optional)

```ts
// shared/schema.ts
const ShotSchema = z.object({
  id: z.string().min(1),
  template: z.enum(TEMPLATE_IDS),
  /** Share of the scene, relative to its siblings. Default 1 (equal split). */
  weight: z.number().min(0.1).max(10).default(1),
  /** Optional anchor: start this shot when this subtitle line begins (0-based). */
  startAtCue: z.number().int().min(0).optional(),
  transition: z.enum(["cut", "dissolve"]).default("cut"),
  environment, cast, camera, label, sublabel, prop, variant, params, // as on Scene today
});
SceneSchema.extend({ shots: z.array(ShotSchema).min(2).max(4).optional() });
```

A scene without `shots` is exactly today's scene. A scene with `shots` ignores its own `template` for drawing but keeps it as the fallback for older versions of the studio.

### Timeline

`resolveTimeline()` keeps deciding the **scene** length from the narration, unchanged. A new pure function then divides that length:

```ts
resolveShots(scene, durationInFrames, cues, fps): { shot, startFrame, durationInFrames }[]
```

Rules:

1. A shot with `startAtCue` starts on that cue's first frame.
2. Remaining shots share the remaining frames by `weight`.
3. No shot is shorter than 2.5 seconds. If the scene is too short for its shots, trailing shots are dropped and a warning names them.
4. Shot lengths always sum to the scene length. Scene start frames, and therefore the film length, cannot change.

Rule 4 is the safety property and gets a randomised test like the cue test in 3B.

### Rendering and caching

- Each shot renders as its own clip through the existing `StudioScene` composition, with its own renderer input and its own cache key. Editing one shot re-renders one shot.
- Subtitles span the scene, not the shot. Each shot receives the cues that overlap it, re-based to its own frame 0 and clamped with the existing `cueProblems()` check.
- `cut` joins clips exactly as scenes are joined today (stream copy).
- `dissolve` needs a re-encode across the boundary. Limit it to a fixed 12-frame cross-fade rendered as a small third clip, so the two neighbours stay cacheable.

### Director (suggestions only)

`shared/director.ts`, pure and offline, in the same style as `smart-selection.ts`:

1. Take the scene's visual direction and split it into clauses (reuse `splitDirection`).
2. For each clause, find recognised capabilities (reuse `VOCABULARY`).
3. Group clauses into at most four shots; for each, pick the template that covers most of its capabilities (reuse the validator's `alternativesFor`).
4. Return a proposal with a reason per shot. Never mutate.

Applying a proposal follows the existing approve-by-scene-id flow, with undo, and changes only `shots`.

### Validator integration

`validateSceneIntent` treats a multi-shot scene as covered when the **union** of its shots' capabilities covers the direction. Status and message format are unchanged.

### UI

One collapsible "Shots" list inside the existing scene card: reorder, template, weight, transition. No new screen.

### Benchmark and acceptance

Quality claims require rendered comparisons. Proposed benchmark set, to be approved before work starts:

| Scene | Why |
|---|---|
| 23 — A race against time | Cutaway asked to show workers hauling coffins; RC 16 exists |
| 30 — Cairo, 2021 | Ancient chamber asked to show modern Cairo; RC 17 exists |
| 31 — Not all from one tomb | No existing template fits; tests honest reporting |
| 10 — Across the Nile | Already validated; must not get worse |
| 2 — The kings are missing | Two subjects in one direction (monuments, then empty tomb) |

For each: render the current single-shot scene and the proposed version at identical length with identical audio; store both under `workspace/benchmarks/`; a person approves or rejects side by side. "Improved" may be stated only for scenes approved this way.

Automated acceptance:

- All four baselines `UNCHANGED` with the feature unused.
- With shots on scene 23 only: film length and every other scene's renderer-input hash unchanged.
- Shot lengths sum to scene length across a randomised sweep.
- Narration folder snapshot unchanged.

### Risks

| Risk | Mitigation |
|---|---|
| Render time grows with shot count | Per-shot caching; cap of four shots; 3C.0 first |
| A shot change mid-sentence feels arbitrary | Default anchors snap to cue starts |
| Dissolves force re-encoding | Fixed-length bridge clip only |
| Older studio versions opening a multi-shot project | They ignore `shots` and draw the fallback template |

---

## 3D — Intelligent Sound Director

### Goal

Perform more of the written sound direction, placed deliberately against narration, without samples that need licensing and without a paid service.

### Current state

`server/audio.ts` synthesises everything: a modal drone with plucked phrases and a soft drum on each cut (`synthMusic`), and wind or room tone plus footsteps under walking scenes (`synthFoley`). Ambience is chosen per scene from the template. The 3B validator reports the rest as "sound not performed"; in the reference film 34 of 36 scenes have at least one such cue.

### Non-goals

- No change to narration files, their loudness normalisation or their placement.
- No third-party sample library and no generative audio service.
- No mixer UI.

### Data model (additive, optional)

```ts
SceneSchema.extend({
  soundCues: z.array(z.object({
    kind: z.enum(SOUND_KINDS),
    at: z.enum(["start", "end", "under", "cue"]).default("under"),
    cue: z.number().int().min(0).optional(), // when at = "cue"
    gain: z.number().min(0).max(1).default(0.5),
  })).max(6).optional(),
  musicCue: z.enum(["continue", "thin", "swell", "silence", "resolve"]).optional(),
});
```

Absent fields mean today's behaviour, sample for sample.

### Sound vocabulary

A table in the style of `VOCABULARY`: kind, words that ask for it, and the synthesiser that plays it. First set, chosen from what the reference script asks for most:

| Kind | Asked for by | Synthesis approach |
|---|---|---|
| `rope-creak` | rope, pulley, strain | band-passed noise with slow stick-slip amplitude |
| `stone-tap` | chisel, tap, stone door, peg | short damped resonator, 2–3 partials |
| `metal-clink` | clink, metallic | inharmonic partials, fast decay |
| `paper` | paper, pen, brush, scratch | high-passed noise bursts |
| `water-drop` | drop, ripple | pitch-swept sine with short reverb |
| `bell` | goat bell | two detuned partials, medium decay |
| `low-drum` | ceremonial drum, pulse, heartbeat | the existing cut drum, repeated on a tempo |
| `crowd-murmur` | market, murmur, public | several band-limited noise voices with speech-rate modulation |
| `lantern-hiss` | lantern, hiss | steady narrow-band noise |

Everything is seeded and deterministic like the existing score. Human voices, breath and animal calls are **not** attempted; synthesised versions read as fake. They stay reported as not performed.

### Director (suggestions only)

`shared/sound-director.ts`, pure and offline:

1. Parse the scene's sound note into ordered clauses. Arrows and "then" give sequence; "under", "behind" give layering.
2. Map clauses to `SOUND_KINDS`. Unknown clauses are returned as unperformed, with the original words.
3. Propose placement: first clause at `start`, last at `end`, layered ones `under`.
4. Map music words to `musicCue` (`silence`, `near silence` → `silence`; `swell`, `resolves` → `swell`, `resolve`).

Applied only on approval, per scene, with undo.

### Mixing rules

- **Narration is never masked.** Effects placed `under` are ducked 9 dB while the voice is active, using the speech span the timeline already measures. Effects at `start` and `end` sit in the 0.5 s lead and 0.9 s tail.
- Effects are confined to their scene with the same fade-at-boundary guard added for narration in 3B.
- The final peak limiter stays as it is.
- `musicCue` shapes the existing score's gain per scene; it does not change its notes, so `musicSeed` keeps its meaning.

### Caching

The mix is rebuilt on every export today and takes seconds; no audio cache is added. Scene clip keys are unaffected because audio never enters renderer input.

### Validator integration

`soundNotPerformed` becomes the difference between what the note asks for and what `soundCues` contains. A scene whose note is fully covered shows no sound warning.

### Benchmark and acceptance

Audio-only benchmark, no video render needed: mix scenes 1, 11, 23, 30 and 36 before and after to WAV under `workspace/benchmarks/`, for listening approval.

Automated acceptance:

- With no `soundCues` or `musicCue` anywhere, the reference film's mix is **sample-identical** to the current code. Add the mix's SHA-256 to the baseline first.
- With effects present, RMS in the narration band during speech is within 1 dB of the no-effects mix.
- No effect energy outside its own scene.
- Deterministic: same project, same bytes.

### Risks

| Risk | Mitigation |
|---|---|
| Synthesised effects sound artificial | Small set, low default gain, listening approval per kind before it ships |
| Clutter under narration | Mandatory ducking; at most six cues per scene |
| Mix differences on existing films | Sample-identical gate with the feature unused |

---

## Suggested sequence

| Step | Content | Size |
|---|---|---|
| 3C.0 | Content-hashed cache keys with one-time re-keying | small |
| 3C.1 | `shots` schema, `resolveShots`, tests | small |
| 3C.2 | Per-shot rendering and cue re-basing | medium |
| 3C.3 | Director suggestions, approval UI, validator union | medium |
| 3C.4 | Benchmark renders and review | review |
| 3D.1 | Mix hash in baselines; `soundCues` schema; mixing rules with ducking | small |
| 3D.2 | First five synthesisers, each approved by listening | medium |
| 3D.3 | Sound director suggestions and approval UI | medium |
| 3D.4 | Remaining synthesisers, benchmark review | medium |

Each step is its own pull request and must leave all four baselines unchanged.
