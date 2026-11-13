# Unresolved issues and recommended next steps

## Needs a decision from the project owner

| # | Issue | Recommendation |
|---|---|---|
| 1 | **No pull request exists yet.** None of the folders on disk is a git repository and no remote address is recorded anywhere, so the branch exists only locally in `dev-phase-3ab/`. | Provide the GitHub repository address. The branch can then be rebased onto the real `feature/smart-template-selection` and opened as a pull request. `PULL_REQUEST.md` is the ready description. |
| 2 | **The baseline commit is the folder as found, not the remote branch.** It includes files that look locally added (`export-royal-cache-srt.ts`, `Build_Final_YouTube_Description.*`, the project's `youtube/` folder). | Confirm whether these belong in the repository before the pull request is opened. |
| 3 | **21 of the 36 documentary scenes are flagged "unsupported direction"**, 10 need review, 5 validate. The released movie already contains these mismatches; the validator only makes them visible. Nothing was changed. | Review the list in `evidence/intent-royal-cache-full-documentary.txt` scene by scene. For each: switch template, rewrite the direction to match what is shown, or accept. Scenes 23 and 30 have a ready-made alternative (RC 16, RC 17). |
| 4 | **Scene 31 has no good existing template.** It asks for two routes merging into a museum route. "Journey map" draws one route through three sites; no template draws a museum. | New artwork (Phase 3C), or reword the direction to a single route. |
| 5 | **The reference project has no audio manifest.** | If wanted: `npm run audio -- the-royal-cache-full-documentary --write-manifest`. Adds one JSON file; touches no audio. Not done because it modifies the original project folder. |
| 6 | **Commits are authored as "NeoKemetAI Studio" with a placeholder address**, because no git identity is configured on this machine and a real address would become public on push. | Set the intended name and address, then amend before pushing. |

## Technical issues found and not fixed

| # | Issue | Why not fixed here | Proposed |
|---|---|---|---|
| 7 | **Render cache is invalidated by any checkout, copy or edit.** The key hashes the size and modified time of every file in `engine/src`, `shared/` and `engine/public`. Touching a file, or installing a new version, re-renders the whole film (about 1.5 h). | Changing the key invalidates every existing cached clip once; that deserves its own reviewed change. | Phase 3C.0: hash file *contents*, and hash only what a template actually imports. |
| 8 | **Decoded-audio cache is keyed by absolute path and modified time.** Moving a project re-decodes its audio. | Harmless and free (local, seconds); changing it invalidates the cache once. | Key by content hash, together with item 7. |
| 9 | **The validator matches words, not pictures.** "Validated match" means nothing recognised in the direction is missing from the template. It cannot see composition, scale or accuracy, and it ignores words outside its vocabulary. | By design for this phase: small and maintainable. | Keep the vocabulary honest by adding terms as real scripts expose gaps. Visual confirmation needs rendered benchmark frames. |
| 10 | **Capabilities of the RC presets were derived from their source comments and catalogue descriptions**, not from rendered frames. | No rendering was done in this phase. | Have someone who knows the shots review `TEMPLATE_CAPABILITIES`; it is one short table. |
| 11 | **Almost no sound direction is performed.** The audio engine has wind, room tone, footsteps and a generated score. Rope, breathing, drums, orchestra, paper and so on are reported per scene but not played. | The Intelligent Sound Director is out of scope. | Phase 3D. |
| 12 | **Subtitle timing inside a clip is proportional to line length**, not aligned to the spoken words. | Existing behaviour; unchanged. | Forced alignment, or word timestamps from the provider, in a later phase. |
| 13 | **Two browser tabs saving the same project: the last save wins.** Saves are now atomic and one step is recoverable, but there is no conflict detection. | Needs a revision counter in the save API and the UI. | Small follow-up: send the last-seen file hash with each save; reject on mismatch. |
| 14 | **Only one previous version is kept** (`project.json.bak`). | Enough to recover from a failed or mistaken save, which was the requirement. | Timestamped history in `workspace/history/<project>/` if more is wanted. |
| 15 | **`workspace/trash/` is never emptied.** | Deliberate: nothing here deletes narration. | A "clear trash" action with a confirmation. |
| 16 | **Silence detection uses a fixed amplitude threshold.** A noisy recording could be measured longer than its speech, lengthening the scene. | Existing behaviour; the reference clips measure cleanly. | Leave unless a real clip shows the problem. |
| 17 | **The scene limit is 40.** The reference film uses 36. | Existing behaviour. | Revisit with Phase 3C, where a scene may hold several shots. |

## Security observations (nothing was opened, printed or changed)

- The ElevenLabs key is stored in plain text in `workspace/settings.json`. The folder is git-ignored and the server never returns the key to the browser. The environment variable `ELEVENLABS_API_KEY` is already supported and is the safer option.
- Two files whose names indicate they hold an ElevenLabs key sit in the parent `NeoKemetAI` folder, outside the studio. Their contents were not read. Consider moving them out of a working folder that also holds scripts and exports.

## Recommended order

1. Supply the repository address; open the pull request for review (items 1, 2, 6).
2. Walk through the intent report and decide per scene (items 3, 4).
3. Approve Phase 3C.0, the cache-key fix, before any change that would force a full re-render (items 7, 8).
4. Then Phase 3C and 3D as specified in `PHASE_3C_3D_SPEC.md`.
