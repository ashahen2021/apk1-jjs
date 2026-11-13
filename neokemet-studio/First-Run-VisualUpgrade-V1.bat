@echo off
setlocal
cd /d "%~dp0"
set NEOKEMET_NO_PAID=1
if not exist "node_modules\tsx" (
  echo Installing locked local Node packages. NO PAID AI calls.
  call npm ci --no-audit --no-fund
  if errorlevel 1 goto failed
)
if not exist "baselines\royal-cache-short-2026.json" (
  echo Recording your current Short baseline IN THIS COPY only...
  call npm run baseline -- royal-cache-short-2026 --write
  if errorlevel 1 goto failed
)
if not exist "baselines\royal-cache-short-visual-v1.json" (
  echo Registering baseline for NEW visual pilot project only...
  call npm run baseline -- royal-cache-short-visual-v1 --write
  if errorlevel 1 goto failed
)
echo Running TypeScript and Fable regression checks...
call npm run typecheck
if errorlevel 1 goto failed
call npm test
if errorlevel 1 goto failed
call npm run intent -- royal-cache-short-visual-v1
if errorlevel 1 goto failed
echo.
echo ALL CHECKS PASSED. New templates are now available in the NEW studio.
echo Close any other Studio window on port 4173 and run Start-NeoKemetAI-Studio.bat.
pause
exit /b 0
:failed
echo.
echo TEST FAILED. Do NOT copy changes into your production studio.
echo Send the complete error text to ChatGPT.
pause
exit /b 1