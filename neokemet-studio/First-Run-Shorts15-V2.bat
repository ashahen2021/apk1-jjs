@echo off
setlocal
cd /d "%~dp0"
set NEOKEMET_NO_PAID=1
if not exist "node_modules\tsx" (
  echo Installing exact locked local dependencies. NO PAID AI CALLS.
  call npm ci --no-audit --no-fund
  if errorlevel 1 goto failed
)
echo Establishing baseline for NEW 15-second Short only...
if not exist "baselines\royal-cache-15s-v2.json" (
  call npm run baseline -- royal-cache-15s-v2 --write
  if errorlevel 1 goto failed
)
echo Checking new cinematic 15-second structure, 10 shots and captions...
node scripts\check-shorts15.mjs royal-cache-15s-v2
if errorlevel 1 goto failed
echo Type checking all original and NEW templates...
call npm run typecheck
if errorlevel 1 goto failed
echo Running all original and Fable Phase 3 regressions...
call npm test
if errorlevel 1 goto failed
call npm run validate -- royal-cache-15s-v2
if errorlevel 1 goto failed
echo.
echo FULL TESTS PASSED: Cinematic Shorts15 Studio V2 is ready.
echo Opening the studio at 127.0.0.1:4173 ...
call Start-NeoKemetAI-Studio.bat
exit /b 0
:failed
echo.
echo CHECK FAILED: your old studios and movie were not modified.
echo Copy the error text to ChatGPT. No paid AI services were called.
pause
exit /b 1