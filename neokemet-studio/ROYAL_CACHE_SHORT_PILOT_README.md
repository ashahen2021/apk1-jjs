# NeoKemetAI — Royal Cache Short Pilot (9:16)

This pilot builds on the actual GitHub branch `feature/smart-template-selection` and includes **a new eight-scene vertical project**. It does not contain the unreleased local Phase 3A/3B work that Fable built on another Windows folder.

## Related published documentary

**Egypt’s Pharaohs Hidden in a Secret Tomb for 3,000 Years | The Royal Cache**

https://www.youtube.com/watch?v=YIS3_xrkv4I

After uploading the Short, open **YouTube Studio → Content → select your Short → Related video**, and select this published long documentary. A link written in a caption alone does not establish the platform's native Related video link.

## Installation (new studio copy)

1. Download ZIP for the `feature/royal-cache-short-pilot-2026` branch.
2. Extract the ZIP to a **separate directory**. Do not overwrite your live studio or `dev-phase-3ab` copy.
3. Open its `neokemet-studio` folder and run `Start-NeoKemetAI-Studio.bat`. First run may require `npm install` and a browser download.
4. In the Projects sidebar select **Why Egypt Hid Its Greatest Kings | Royal Cache Short** (8 scenes; 9:16).
5. Run `Check-Royal-Cache-Short.bat` to verify the pilot story and structural checks.
6. Preview scenes 1, 5, and 8, then test `Render this scene` before exporting the entire Short.

## Audio — avoid paying before the visuals are approved

The pilot intentionally contains **no ElevenLabs API key and no narration MP3 files**. You can preview stills without paid credits. To hear narration, either import your own clips per scene or select Piper (offline) if installed. Only choose **Generate with ElevenLabs** deliberately; it calls a paid API for the narration text.

After narration exists, run:

```powershell
npx tsx server/cli.ts validate royal-cache-short-2026
```

This command reports durations measured from available audio, and any missing clips. If your actual Short exceeds one minute, edit the script or scene pacing accordingly; the checker gives only an **estimate**.

## Export settings

- 1080 × 1920 (9:16), 30fps.
- Burned-in subtitles ON in this Short pilot. This is deliberate and independent of your long film where subtitles were switched OFF.
- Music 0.25; effects 0.35; narration 1.0 as initial values (audition before publishing).
- Recommended title, description, keywords and CTA appear in `YouTube_Short_Package.md`.
- Keep the original film untouched. The short's own audio/exports go into its own project/workspace folders.

## Check results and caveats

This copy is constructed from reviewed GitHub source, not from the local Phase 3A/3B files. QA is read-only; it does not prove that the scene render looks correct. The complete Remotion app still needs its dependencies installed on Windows for visual and MP4 testing.

The preset scenes are reused intentionally rather than redescribed as newly generated animation. The shot 5 TT320 passage is a **schematic visual**, not a verified archaeological survey. The studio does **not** directly publish to YouTube or set the Related video field.
