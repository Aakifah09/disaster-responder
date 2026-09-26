@echo off
title DisasterResponder - Nuclear Startup
3: color 0C
echo.
echo  =============================================
echo   DISASTER RESPONDER - DEEP CLEAN STARTUP
echo  =============================================
echo.

:: 1. Force kill EVERYTHING
echo [1/5] Terminating all zombie processes...
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM uvicorn.exe /T >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM cmd.exe /FI "WINDOWTITLE eq DisasterResponder*" /T >nul 2>&1
timeout /t 3 /nobreak >nul
echo       System cleared.

:: 2. Forced Database Wipe
echo [2/5] Wiping old database...
if exist "backend\disaster.db" (
    del /F /Q "backend\disaster.db"
    echo       Old database destroyed.
)
timeout /t 1 /nobreak >nul

:: 3. Start Backend fresh
echo [3/5] Starting Backend (45min Logic)...
start "DisasterResponder Backend" cmd /k "cd /d %~dp0backend && uvicorn main:app --reload --port 8000"
timeout /t 5 /nobreak >nul

:: 4. Start Frontend
echo [4/5] Starting Frontend...
start "DisasterResponder Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 5 /nobreak >nul

:: 5. Launch
echo [5/5] Launching...
start "" "http://localhost:5173"

echo.
echo  =============================================
echo   CLEAN SYSTEM ONLINE (45m Deployment)
echo  =============================================
pause
