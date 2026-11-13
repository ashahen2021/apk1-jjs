@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set NEOKEMET_NO_PAID=1
where node >nul 2>&1
if errorlevel 1 goto no_node
if not exist "node_modules\tsx" (
  echo Installing local Node dependencies from package-lock.json...
  call npm ci --no-audit --no-fund
  if errorlevel 1 goto failed
)
echo.
echo Checking 15-second cinematic project and new template code...
node scripts\check-shorts15.mjs royal-cache-15s-v2
if errorlevel 1 goto failed
call npm run typecheck
if errorlevel 1 goto failed
call npx tsx server/selftest.ts
if errorlevel 1 goto failed
call npm run validate -- royal-cache-15s-v2
if errorlevel 1 goto failed
echo.
echo PORTABLE CHECKS PASSED: TypeScript, original self-tests, 15s QA and project validation.
echo The archive-specific Fable regression suite is NOT run without the missing 36-scene voice files.
echo All Phase 3A/3B safety MODULES are installed; no paid APIs were used.
echo.
echo Close any other NeoKemetAI Studio using port 4173.
echo Starting Cinematic Shorts15 V2...
call Start-NeoKemetAI-Studio.bat
exit /b %errorlevel%
:no_node
echo Node.js is missing. Please install Node.js 22 LTS: https://nodejs.org
pause
exit /b 1
:failed
echo.
echo FAILED: existing studios were not changed; copy the error text to ChatGPT.
pause
exit /b 1