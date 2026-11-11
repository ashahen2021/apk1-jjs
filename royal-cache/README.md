# THE ROYAL CACHE — The Secret Tomb of Egypt's Greatest Pharaohs

A 180-second, 9:16 animated documentary short, generated entirely by code with
[Remotion](https://www.remotion.dev) + React + TypeScript.

| | |
|---|---|
| Composition | `RoyalCacheFilm` |
| Picture | 1080 × 1920, 30 fps, 5,400 frames (exactly 180 s), H.264 / yuv420p |
| Structure | 18 scenes × 10 s, cut on the 10-second marks |
| Style | vintage Egyptian travel-poster print: papyrus stock, ochre / sand / dusty gold / desaturated teal, rough relief-print edges, dry-brush wear, paper grain |
| Audio | narration (ElevenLabs) + original synthesised score + original synthesised foley |
| Final render | [`renders/royal-cache.mp4`](renders/royal-cache.mp4) |

Everything on screen is hand-built SVG geometry. There are no bitmaps except three
procedurally generated print textures, and no `Math.random()` anywhere: every frame is a
pure function of the frame number and fixed seeds, so renders are reproducible.

## Requirements

- Node.js 18+ (built with Node 22)
- `ffmpeg` / `ffprobe` on the PATH (used to assemble the narration stem and to verify renders)

## Install

```bash
npm install
```

## Preview (Remotion Studio)

```bash
npm run dev
```

The first run generates any missing assets (textures, score, foley, narration stem).

## Render the MP4

```bash
npm run render
```

Output: `out/royal-cache.mp4`. A version without burned-in subtitles:

```bash
npm run render:clean
```

Check the result (duration, 9:16 dimensions, frame count, blank-frame scan, audio level, narration sync):

```bash
npm run verify
```

## Project layout

```
src/
  Root.tsx                  registers the RoyalCacheFilm composition
  RoyalCacheFilm.tsx        timeline: 18 sequences + print pass + subtitles + audio
  scenes/                   one file per shot (Scene01Secret … Scene18Hidden) + index.ts
  components/
    AnimatedScene.tsx       reusable per-shot wrapper (paper, SVG stage, cross-dissolve)
    Camera.tsx              procedural 2.5-D camera: <Camera> + depth-aware <Layer>
    Print.tsx               rough-edged polygons, dry-brush streaks, stipple, ground, labels
    PrintOverlay.tsx        ink wear + speckle + multiplied paper grain over every scene
    Figures.tsx             priests, bearers, villagers, officials, goats (grounded walk cycles)
    Coffins.tsx             anthropoid coffins (front and profile), uraeus
    Landscape.tsx           Theban cliffs, Hatshepsut's temple, palms, houses
    Atmosphere.tsx          drifting sand, dust motes, birds, torch glow, haze
    Subtitles.tsx           burned-in captions from the cue file
  lib/                      palette + timing constants, seeded RNG / rough paths, easing
  data/script.json          the authoritative voiceover, split into caption lines
  data/cues.json            generated cue timings (do not edit by hand)
scripts/                    asset generators, cue builder, verifier
audio/                      cue sheet, SRT, foley cue list, narration clips (audio/vo)
public/                     fonts, textures, audio stems served to the renderer
```

### How the look is made

- **Rough relief printing** — `roughPath()` subdivides every polygon edge and offsets it
  with seeded jitter, so shapes have an uneven, hand-cut edge without any SVG filters.
- **Dry-brush strata / stipple** — `Streaks` and `Stipple` scatter seeded strokes and dots
  inside shapes (cliff strata, sand, plaster).
- **Print pass** — `scripts/gen-textures.mjs` writes three seeded PNGs: ivory streaks that
  knock holes in the ink, sparse dark speckle, and fibrous paper grain (multiplied). The
  wear plate is mirrored differently in each scene.
- **2.5-D camera** — `<Camera x y zoom>` never moves pixels itself; each `<Layer depth>`
  applies the pan/zoom scaled by its depth, giving multiplane parallax.
- **Grounded figures** — walk phase is derived from distance travelled (`walkPhase`) so
  stride matches leg swing, and the body is lowered by exactly the amount swung legs
  shorten, so soles stay on the ground line.

## Voiceover

The narration text lives in `src/data/script.json` and is authoritative: it is used
verbatim for the audio, the subtitles, the SRT and the cue sheet.

The shipped film uses ElevenLabs narration (clips in `audio/vo/`, one per scene, with
character-level timestamps that drive the subtitle timing).

### Regenerate with ElevenLabs

```bash
ELEVENLABS_API_KEY=your_key npm run vo:elevenlabs
```

Optional arguments go to the generator script, e.g. another voice id or only some scenes:

```bash
ELEVENLABS_API_KEY=your_key node scripts/gen-vo-elevenlabs.mjs <voiceId> --only=3,7 --speed=0.95
```

```bash
npm run cues
```

Never commit the API key; it is only read from the environment.

### Insert an external / human voiceover

1. Record one file per scene and save them as `audio/vo/scene-01.wav` … `scene-18.wav`
   (`.mp3` and `.m4a` also work). Delete the matching `scene-XX.json` files, which hold the
   timing of the old take.
2. Rebuild the stem and all cue documents:

```bash
npm run cues
```

This writes `public/audio/royal-cache-vo.wav` (each clip placed 0.55 s after its cut,
loudness-normalised; clips longer than 9.25 s are gently time-compressed to fit the
10-second scene), `src/data/cues.json`, `audio/royal-cache.srt` and `audio/cue-sheet.md`.
Without per-character timestamps, subtitle lines are distributed across each clip in
proportion to their length.

Alternatively, drop a finished 180-second mix straight onto
`public/audio/royal-cache-vo.wav` — the film plays whatever is there.

If there are no clips at all, `npm run cues` writes a silent placeholder to the same path
and estimates cue times at ~128 wpm, so the picture can be finished before the voice.

## Music and foley

Both stems are original and synthesised from scratch by `scripts/gen-audio.mjs` (seeded,
no samples, nothing licensed or imported):

- **Score** — slow modal drone in D, sparse Karplus–Strong plucked phrases, a soft frame
  drum on each cut and a processional pulse under scenes 6 and 17.
- **Foley** — wind, room tone, footsteps, linen, rope strain, falling stone, torch crackle,
  all placed on the same timestamps the animation uses (see `audio/cue-sheet.md`).

Stem levels are props of the composition (`voVolume`, `musicVolume`, `foleyVolume`), and
each stem can be switched off (`voiceover`, `music`, `foley`, `subtitles`).

```bash
npm run assets
```

regenerates textures, score, foley, narration stem and cues in one go.

## Historical notes built into the film

- TT320 is a rock-cut tomb in the cliffs at **Deir el-Bahari**, near Luxor — not inside a
  pyramid. The only pyramids in the film are two tiny, distant shapes in the opening shot,
  as a generic symbol of Egypt, while the narrator says "not beneath a pyramid".
- The cutaway in scene 8 is labelled as illustrative, not a surveyed plan.
- Scene 9 shows 55 burials of which only a minority carry royal insignia: more than fifty
  people, not fifty kings.
- The goat story (scene 12) carries the on-screen caption "ACCORDING TO ONE ACCOUNT".
- Scene 17 shows a handful of parade vehicles and gives no count; ten of the twenty-two
  mummies in the 2021 parade came from this cache.

Historical basis: Royal Cache (TT320), Deir el-Bahari; Egypt's Ministry of Tourism and
Antiquities.

## Fonts

Cormorant Garamond and Josefin Sans (SIL Open Font License), bundled in `public/fonts`.
