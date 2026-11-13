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
   npx tsx server/selftest.ts
   npm run validate -- royal-cache-15s-v3
   ```

   Expected: no TypeScript errors, `21 checks passed.`, and an `OK` line for the 15-second
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
from the original computer (`C:\neokemetai\NeoKemetAI_V3\Studio-Shorts15-Cinematic-V3`):

- `npm run validate -- royal-cache-15s-v3` still passes, using estimated voice timing;
- `node scripts\check-shorts15-v3.mjs royal-cache-15s-v3` reports `missing audio file`.

## 4. Known state at migration time

Recorded so nobody loses time on them on a second computer:

- `npm test` runs two suites. The first (`server/selftest.ts`, 21 checks) passes. The second
  (`server/selftest-phase3.ts`) stops at its first check, because
  `projects\demo-great-pyramid\project.json` was edited after its baseline in `baselines\`
  was recorded, and because that suite also needs the 36-scene Royal Cache film and its voice
  files, which were never part of this studio copy (see `PORTABLE-BUILD-PROVENANCE.txt`).
- `node scripts\check-shorts15-v3.mjs royal-cache-15s-v3` reports
  `Subtitles must be enabled`, because the migrated V3 project has `"subtitles": false`.
- `First-Run-Shorts15-V3.bat` runs those checks, so it stops at the same point.

## 5. Where the original install fits

`C:\neokemetai\NeoKemetAI_V3\Studio-Shorts15-Cinematic-V3` on the first computer is the
untouched pre-GitHub installation. Keep it as a fallback; do new work in the Git clone.
