# Phase 3A — Baseline record

Captured 13 November 2026, before any code change, from the studio as found on disk.

## Repository state

| Item | Finding |
|---|---|
| Active version | `apk1-jjs-feature-smart-template-selection` — the newest of five unpacked branch snapshots, and the only one holding the 36-scene project's final render |
| Studio package | `neokemetai-animation-studio` 0.1.0 (root site package `neokemetai` 0.1.0) |
| Git | **None of the five folders is a git repository.** They are extracted branch archives with no `.git` folder and no remote. |
| Lineage (by features present) | `claude-practical-curie` → `production-script-importer` → `template-library-phase1` → `reusable-royal-cache-presets` → `smart-template-selection` |
| Local additions in the active folder | `export-royal-cache-srt.ts`, `Build_Final_YouTube_Description.*`, the `youtube/` folder of the 36-scene project, and a `project.json` saved at 12:25 on 12 Nov. These may not exist on the remote branch. |

Because there was no repository, this work was done in a copy:

- `dev-phase-3ab/` — a full copy of the active snapshot **without** `workspace/` (settings, caches, renders).
- Commit `97d3e26` on `main` is the untouched snapshot. All changes are on `phase-3ab/safety-and-intent-validation`.
- The production folder was only ever read. After the work: 0 files modified, all 72 narration files and `project.json` byte-identical, final movie hash unchanged.

## Toolchain

| Component | Version |
|---|---|
| Node.js | 22.23.4 |
| Remotion (`remotion`, `@remotion/renderer`, `@remotion/bundler`) | 4.0.542 |
| React | 19.3.1 |
| zod | 4.6.7 |
| tsx / TypeScript | 4.23.15 / 7.0.2 |
| FFmpeg | the build bundled with Remotion |

No dependency was added, removed or upgraded.

## The Royal Cache — Full Documentary (reference project)

| Property | Value |
|---|---|
| Project folder | `projects/the-royal-cache-full-documentary` |
| `project.json` SHA-256 | `4af22673ff04d72ac71b732cf8db3ba205bc5a6f246c644b712860b7918ecd70` |
| Scenes | 36, ids `s01` … `s36`, no manual durations |
| Format | 16:9, 1920×1080, 30 fps, burned-in subtitles off |
| Timeline | 23,522 frames = 784.07 s (13 min 4 s) |
| Scene lengths | 19.20 s – 25.83 s, each following its measured narration (0.5 s lead, 0.9 s tail) |
| Audio settings | generated score, seed 1881, volume 0.5; foley on, volume 0.55; narration volume 1.0 |
| Subtitle cues | 373 across the film |

### Narration audio

| Property | Value |
|---|---|
| Files | 36 MP3 (`narration/NN-sNN.mp3`) + 36 text stamps (`.mp3.txt`) = 72 files |
| Encoding | MP3, 44.1 kHz, mono, 128 kbit/s |
| Total length | 745.41 s of file audio (18.16 s – 24.85 s per clip); 11,965,614 bytes |
| Text stamps | all 36 equal the scene's current narration text |
| Provider (from settings) | ElevenLabs enabled; model `eleven_multilingual_v2`; output `mp3_44100_128`; stability 0.55; similarity boost 0.8 |
| Voice id / API key | present in `workspace/settings.json`; **deliberately not recorded here** |
| Manifest | none (legacy stamp files only) |

The size and SHA-256 of every one of the 72 files is recorded in the baseline file.

### Final movie (not regenerated, not modified)

| Property | Value |
|---|---|
| File | `workspace/output/egypts-pharaohs-hidden-in-a-secret-tomb-the-royal-cache.mp4` |
| Size | 471,416,649 bytes, written 12 Nov 2026 13:09 |
| SHA-256 | `F4B131D29C7AD20DEFEBF3DFF3E0A7FD5A891AB59A18BD0F1AE160CF4EBD0645` |
| Video | H.264, 1920×1080, 30 fps, 23,522 frames, 784.07 s |
| Audio | AAC, 44.1 kHz stereo |

The movie's frame count equals the timeline the current code resolves (23,522), so the project on disk is the one the movie was made from.

### Render settings (unchanged)

Per scene: H.264, CRF 18, `yuv420p`, JPEG frames at quality 92, muted. Scenes are joined without re-encoding; audio is mixed to 44.1 kHz stereo WAV and muxed as AAC 192 kbit/s with `+faststart`. Render concurrency is automatic.

Production caches at capture time: 54 decoded audio files, 73 rendered scene clips, engine bundle `bundle-e929e47e8721`.

## Other bundled projects

| Project | Scenes | Frames | Length | Narration files |
|---|---|---|---|---|
| `royal-cache` | 18 | 5,400 | 180.00 s | 18 MP3, no stamps (supplied by hand); every scene has a 10 s manual duration |
| `demo-great-pyramid` | 8 | 1,949 | 64.97 s | 8 WAV + 8 stamps (Piper) |
| `demo-template-library` | 3 | 793 | 26.43 s | none (lengths are estimates) |

## How the baselines work

`baselines/<project>.json` holds, per project: the `project.json` hash; scene order; each scene's start frame, length, measured voice length, cue count, a hash of its exact subtitle cues, a hash of exactly what the renderer receives, and a hash of its narration text; plus the size and hash of every file in `narration/`.

They were captured by running the **original, unmodified code** (a separate checkout of commit `97d3e26`). The test suite re-captures them with the new code and requires an exact match.

```bash
npm run baseline -- the-royal-cache-full-documentary
```

prints `UNCHANGED` or lists every difference. `--write` records a new baseline, which should only be done deliberately after an approved change.

## Results before any change

- `npm run typecheck`: clean.
- `npm test`: 21 of 21 checks pass.
- `npm run validate` on all four projects: OK, no warnings.
