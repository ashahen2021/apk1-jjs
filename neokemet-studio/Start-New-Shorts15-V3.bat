@echo off
setlocal
cd /d "%~dp0"
set /p title=Name for the NEW V3 Short: 
if "%title%"=="" ( echo A title is required. & pause & exit /b 1 )
node scripts\clone-shorts15-v3.mjs "%title%"
pause
