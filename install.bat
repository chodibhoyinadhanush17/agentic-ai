@echo off
setlocal
set "PATH=C:\Program Files\nodejs;%PATH%"
echo ===================================================
echo Installing Agentflow_AI Dependencies...
echo ===================================================
npm run install:all
if %ERRORLEVEL% NEQ 0 (
    "C:\Program Files\nodejs\npm.cmd" run install:all
)
pause
