@echo off
setlocal
cd /d "%~dp0"
echo NeoKemetAI Royal Cache Short - read-only QA
node scripts\check-royal-cache-short.mjs royal-cache-short-2026
if errorlevel 1 (
 echo The pilot QA checker found an issue.
 pause
 exit /b 1
)
echo.
echo Narration has NOT been generated in this pilot.
echo After recording, check exact audio duration:
echo npx tsx server\cli.ts validate royal-cache-short-2026
pause
