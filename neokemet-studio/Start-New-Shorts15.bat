@echo off
setlocal
cd /d "%~dp0"
set NEOKEMET_NO_PAID=1
set /p "name=Name for your NEW 15-second short: "
if "%name%"=="" goto end
node scripts\clone-shorts15.mjs "%name%"
if errorlevel 1 goto failed
echo.
echo A new project was created. Open it from Projects in the studio.
echo IMPORTANT: The artwork is Royal Cache-themed; change the story/subject graphics for other historical topics.
goto end
:failed
echo Project creation failed.
:end
pause
