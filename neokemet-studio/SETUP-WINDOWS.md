# NeoKemetAI Studio (Cinematic V3) — Windows setup on multiple computers

The studio source lives in the `neokemet-studio/` folder of
<https://github.com/ashahen2021/apk1-jjs>. GitHub is the single source of truth; each
computer keeps its own clone, its own `node_modules`, and its own private `workspace`.

| Branch | Purpose |
| --- | --- |
| `feature/neokemetai-cinematic-v3` | Snapshot of the working Cinematic V3 studio as migrated. Do not develop here. |
| `develop/neokemetai-v3.1` | Day-to-day development of V3.1. Work here. |

## 1. One-time setup on each computer

1. Install **Git for Windows** — <https://git-scm.com/download/win>
2. Install **Node.js 22 LTS** — <https://nodejs.org> (tested with Node 22.18 / npm 10.9).
3. Open **PowerShell** and tell Git who you are (once per computer):

   ```powershell
   git config --global user.name "Your Name"
   git config --global user.email "your-github-email@example.com"
   ```

4. Clone the repository and switch to the development branch:

   ```powershell
   cd C:\
   git clone https://github.com/ashahen2021/apk1-jjs.git neokemetai-git\apk1-jjs
   cd C:\neokemetai-git\apk1-jjs
   git switch develop/neokemetai-v3.1
   ```

   The first push or pull opens a browser window to sign in to GitHub.

5. Install the exact locked dependencies (internet needed, a few minutes, about 830 MB):

   ```powershell
   cd C:\neokemetai-git\apk1-jjs\neokemet-studio
   npm ci --no-audit --no-fund
   ```

6. Check the install:

   ```powershell
   npm run typecheck
   npm test
   npm run validate -- royal-cache-15s-v3
   ```

   Expected: no TypeScript errors, two `checks passed` lines, and an `OK` line for the 15-second
   V3 Short (4 scenes, 15.00 s, 9:16 @ 30 fps). None of these commands call a paid service.

7. Start the studio: double-click **`Start-NeoKemetAI-Studio.bat`** (or run `npm start`) and
   open <http://127.0.0.1:4173>. The first preview downloads a headless Chrome for Remotion
   (once, about 100 MB).

## 2. Daily routine when moving between computers

Before you start work:

```powershell
cd C:\neokemetai-git\apk1-jjs
git switch develop/neokemetai-v3.1
git pull
```

If `git pull` changed `neokemet-studio\package-lock.json`, run `npm ci --no-audit --no-fund`
again in `neokemet-studio`.

When you finish — always, before leaving the computer:

```powershell
git status
git add -A
git commit -m "Describe what changed"
git push
```

Rules that keep the computers in sync:

- **Pull before you start, push before you leave.** Unpushed work exists on one computer only.
- Never use `git push --force`.
- Keep `feature/neokemetai-cinematic-v3` untouched as the V3 reference point.

## 3. What is NOT in GitHub (by design)

These are excluded by `neokemet-studio/.gitignore` and stay on each computer:

| Not in GitHub | Why | How to get it on another computer |
| --- | --- | --- |
| `node_modules\` | Reinstallable | `npm ci` |
| `workspace\` (settings, cache, rendered output) | Holds `settings.json`, which can contain the ElevenLabs API key in plain text, plus caches and MP4 renders | Created automatically on first start; re-enter settings in the app |
| API keys, `.env` files | Credentials | Enter the key in the app's Settings tab, or set the `ELEVENLABS_API_KEY` environment variable on that computer. Never commit a key. |
| `projects\<name>\narration\` for new projects, and any `*.mp3 / *.wav` | Private or paid narration audio | Copy the folder by USB/private cloud drive, or regenerate narration on that computer |
| Rendered videos (`*.mp4`, `*.mov`, …) | Large generated output | Re-render with Export, or copy privately |
| `tools\piper\`, `tools\voices\` | Downloaded offline voice | `powershell -ExecutionPolicy Bypass -File scripts\setup-piper.ps1` |
| `*.bak` project backups | Per-machine undo files | Not needed |

Narration and the demo video that were already tracked in the repository before the V3
migration (for example the Great Pyramid demo) remain tracked.

### Narration for the V3 Short

`projects\royal-cache-15s-v3\project.json` refers to four narration files in
`projects\royal-cache-15s-v3\narration\`. They are not in GitHub. Until you copy that folder
from the original computer (`C:\neokemetai\NeoKemetAI_V3\Studio-Shorts15-Cinematic-V3`),
the checks still pass, using estimated voice timing and printing a warning per scene.

## 4. What the checks report on a fresh clone

All of these pass on a new clone that has no private files:

- `npm test` runs two suites. First: `21 checks passed.` Second:
  `18 checks passed, 3 skipped (private production data not present).` The three `SKIP` lines
  are checks that read the 36-scene Royal Cache film and its voice files, which are private and
  were never part of this studio copy. They run automatically on a computer that has them.
- The baseline check prints a `NOTE` for `royal-cache-15s-v3` when its narration folder is
  absent, and then compares everything that does not depend on measuring that audio.
- `node scripts\check-shorts15-v3.mjs royal-cache-15s-v3` passes, with one warning per scene
  while the narration audio is absent.

**Shorts standard: subtitles are required.** The V3 check fails with
`Subtitles must be enabled` if a V3 Short has `"subtitles": false`. The V3 master project has
subtitles on, and `Start-New-Shorts15-V3.bat` always creates new Shorts with subtitles on.

A baseline in `baselines\` records the approved state of a project. If the baseline check
reports drift, first find out what changed in the project. Record a new baseline only for a
change you intend to keep: `npm run baseline -- <project-folder-name> --write`, then commit it.

## 5. Where the original install fits

`C:\neokemetai\NeoKemetAI_V3\Studio-Shorts15-Cinematic-V3` on the first computer is the
untouched pre-GitHub installation. Keep it as a fallback; do new work in the Git clone.
