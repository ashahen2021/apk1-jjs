# Royal Cache Short Pilot — NeoKemetAI (9:16)

This is a **separate, eight-scene vertical project** bundled into NeoKemetAI Studio. Built from the verified GitHub branch `feature/smart-template-selection`; it does not contain the more recent local-only Fable Phase 3A/3B code.

## Full documentary
**Egypt’s Pharaohs Hidden in a Secret Tomb for 3,000 Years | The Royal Cache**
https://www.youtube.com/watch?v=YIS3_xrkv4I

## How to test (Windows)
1. Download the branch ZIP for `feature/royal-cache-short-pilot-2026`.
2. Extract into a **new folder**. Do not overwrite the existing working studio or Fable's `dev-phase-3ab` folder.
3. Run `neokemet-studio/Start-NeoKemetAI-Studio.bat` (first run needs dependencies).
4. Open the project **Why Egypt Hid Its Greatest Kings | Royal Cache Short** (8 scenes, 9:16).
5. Run `Check-Royal-Cache-Short.bat` to check the project without paid calls.
6. Preview scene 1, scene 5 and scene 8; only then use `Render this scene` or export.

## Narration and timing
No voice files or ElevenLabs credentials are bundled. You can preview visuals without audio. Import narration per scene or use offline Piper if installed. If you choose ElevenLabs it is **paid**, and the studio will send narration text; do not use it until satisfied with the story.

After generating narration:
```powershell
npx tsx server/cli.ts validate royal-cache-short-2026
```
The initial ~50-second duration is estimated from text, not measured MP3. Review actual duration, pronunciation, and music levels before publishing.

## Export and related-video setting
- 1080x1920 (9:16), 30fps; burned-in English captions ON for Short by default. For the long documentary you had captions OFF; the settings are independent.
- The closing card deliberately says **WATCH THE FULL FILM**.
- After publishing: **YouTube Studio → Content → Short → Related video → choose the published Royal Cache documentary** (`YIS3_xrkv4I`). Writing a URL in the caption does not replace this native step.
- This pilot reuses existing Royal Cache drawings and templates; it does not claim Phase 3C multi-shot animation or Phase 3D event-based sound.
- Existing Royal Cache projects and narration stay untouched.
