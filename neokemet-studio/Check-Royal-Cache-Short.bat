@echo off
setlocal
cd /d "%~dp0"
echo.
echo NeoKemetAI Royal Cache Short - read-only QA
node scripts\check-royal-cache-short.mjs royal-cache-short-2026
if errorlevel 1 (
  echo.
  echo The pilot checker found errors. Review the messages above.
  pause
  exit /b 1
)
echo.
echo Voiceover has not been generated in the distributed pilot.
echo After recording, verify the actual scene durations with:
echo   npx tsx server\cli.ts validate royal-cache-short-2026
echo.
pause
