@echo off
setlocal
title NeoKemetAI Animation Studio
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js is not installed.
  echo  Install the LTS version from https://nodejs.org and run this file again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\remotion" (
  echo  First run: installing the studio. This needs an internet connection once and takes a few minutes...
  call npm install
  if errorlevel 1 (
    echo.
    echo  Installation failed. Check your internet connection and run this file again.
    pause
    exit /b 1
  )
)

echo  Starting NeoKemetAI Animation Studio...
call npx tsx server/index.ts
echo.
echo  The studio has stopped.
pause
