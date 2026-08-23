@echo off
setlocal
set "PATH=C:\Program Files\nodejs;%PATH%"
echo ===================================================
echo Starting Agentflow_AI Platform (Server + Client)...
echo ===================================================
npm run dev
if %ERRORLEVEL% NEQ 0 (
    "C:\Program Files\nodejs\npm.cmd" run dev
)
pause
