# Narration cache audit

What decides whether the studio reuses a recorded narration clip or generates a new one, what was wrong with it, and what this branch changes.

## How it worked before

A clip was considered current only if **all** of these held:

1. a file existed at `narration/<scene position>-<scene id>.<wav|mp3>`;
2. a stamp file `<that file>.txt` existed;
3. the stamp was character-for-character equal to the scene's narration.

Otherwise the provider was called and the file at that path was overwritten.

| The identity depended on | Consequence |
|---|---|
| Script text, exactly | Adding a space or a line break regenerated the clip (paid, with ElevenLabs). |
| Scene position | Inserting, deleting or reordering a scene changed every later file name. All of those scenes regenerated, and the old files were orphaned. |
| Scene id | Renaming an id regenerated the clip. |
| Provider, through the file extension | Switching provider regenerated everything. |
| **Not** the voice id | Changing the voice left the old voice in place with no warning. |
| **Not** the model or generation settings | Same: silently stale. The model and settings were hard-coded in the request and recorded nowhere. |

Further risks found:

- **Hand-supplied audio was not protected.** The 18-scene `royal-cache` project uses `scene-NN.mp3` files with no stamps. Pressing "narrate" would have generated all 18 again and repointed the project.
- **Regeneration overwrote in place.** A changed line destroyed the previous take.
- **A failed request could leave a partial file** at the final path.
- **Uploads overwrote** any existing file of the same name.
- **Deleting a project erased its narration** permanently.

## What this branch changes

| Change | Effect |
|---|---|
| Identity = normalised text + provider + voice + model + settings (`audioIdentity`) | The voice, model and settings are now part of what a clip *is*. The voice is stored as a short fingerprint, never the raw id; no key is stored. |
| Whitespace-insensitive text comparison | Spacing edits no longer cost a generation. |
| Lookup by content, not by path (`findReusableAudio`) | Reordering or renumbering scenes reuses the existing clip. Works for legacy projects too, by reading the stamp files. |
| Linked audio with no record of its text is kept | Hand-supplied clips are never replaced unless `--force` is given. Reported to the user. |
| A new take always goes to a new file name | No clip is ever overwritten, by generation or by upload. |
| Generation writes to a temporary file, then renames | A failed or interrupted request leaves nothing behind and does not relink the scene. |
| A voice or settings mismatch is **reported, not acted on** | Changing the voice in Settings does not silently spend money. Re-recording is an explicit `--force`. |
| Optional `narration/manifest.json` | Written only when a clip is generated. Records file hash, text hash, identity, origin and voice. |
| `NEOKEMET_NO_PAID=1` | Every paid call fails before a request is sent. The test suite sets it. |
| Deleting a project moves it to `workspace/trash/` | Narration is recoverable. |

## Backward compatibility

- A project with no manifest behaves as before; stamp files are still read **and still written**, so older versions of the studio keep working with new clips.
- The manifest is never required and never created for an existing project unless the user asks: `npm run audio -- <project> --write-manifest`.
- No existing audio file is renamed, moved or rewritten by any code path.

## Result for the existing projects

`npm run audio -- the-royal-cache-full-documentary` (read-only):

- 36 of 36 clips match the text they were spoken from.
- Running narration against the project generates **0** clips and changes **0** files (enforced by a test whose fake provider fails if it is ever called).
- `royal-cache`: 18 clips reported as unverified and kept.
- `demo-great-pyramid`: 8 of 8 current.

## Not changed, and why

| Item | Reason |
|---|---|
| The reference project has no manifest | Adding one is a change to the original project folder, which needs explicit approval. It is one command and touches no audio. |
| The voice of the 36 existing clips is recorded as "unknown" if a manifest is written | It cannot be proven after the fact that today's settings produced them. Guessing would make the manifest untrustworthy. |
| Decoded-audio cache key (absolute path + size + modified time) | Changing it would invalidate the existing cache once for no functional gain. Copying a project re-decodes its audio locally in a few seconds, at no cost. Proposed for Phase 3C. |
| Scene render cache key (includes size and modified time of every engine and `shared/` file) | See the unresolved-issues list: any checkout or copy invalidates every rendered scene. Fixing it changes every key once, so it is specified for Phase 3C rather than done here. |
