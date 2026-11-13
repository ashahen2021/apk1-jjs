@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set NEOKEMET_NO_PAID=1
where node >nul 2>&1
if errorlevel 1 goto no_node
if not exist "node_modules\tsx" (
 echo Installing exact locked dependencies once, local only...
 call npm ci --no-audit --no-fund
 if errorlevel 1 goto failed
)
echo.
echo Establishing a baseline for the NEW V3 Short only...
if not exist "baselines\royal-cache-15s-v3.json" (
 call npm run baseline -- royal-cache-15s-v3 --write
 if errorlevel 1 goto failed
)
echo.
echo Checking V3 structure and title/subtitle reserved lanes...
node scripts\check-shorts15-v3.mjs royal-cache-15s-v3
if errorlevel 1 goto failed
echo.
echo TypeScript checking new and existing engine code...
call npm run typecheck
if errorlevel 1 goto failed
echo.
echo Running original regression tests (portable mode)...
call npx tsx server/selftest.ts
if errorlevel 1 goto failed
echo.
echo Checking actual 450-frame project timing without creating voice files...
call npm run validate -- royal-cache-15s-v3
if errorlevel 1 goto failed
echo.
echo V3 CHECKS PASSED. No paid API used.
echo Full Fable archive tests need the original 36-scene voice files and are not implied here.
echo Close any older studio listening on 4173, then press a key to launch V3.
pause >nul
call Start-NeoKemetAI-Studio.bat
exit /b %errorlevel%
:no_node
echo ERROR: Node.js is not installed. Install Node.js 22 LTS.
pause
exit /b 1
:failed
echo.
echo V3 CHECK FAILED. All original studios remain unchanged.
echo Copy the complete error to ChatGPT. No paid calls were made.
pause
exit /b 1