@echo off
title PMS v2 - INFOCUS-IT
color 0A
cd /d "%~dp0"

echo.
echo ========================================================
echo   PMS v2 - INFOCUS-IT Project Management System
echo ========================================================
echo.
echo   Backend:  http://localhost:5002
echo   Frontend: http://localhost:5174
echo.
echo   Internal Login: jagbir@infocus-it.com / pass123
echo   Client Login:   vivek@ifci.com / client123
echo.
echo ========================================================
echo.

:: Kill any old processes on ports 5002 and 5174
echo Cleaning up old processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5002 "') do (
    if not "%%a"=="0" taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5174 "') do (
    if not "%%a"=="0" taskkill /f /pid %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

echo Starting Backend Server (Port 5002)...
start "PMS-V2-Backend" cmd /c "set SECRET_KEY=dev-secret-key-change-in-production&& set DATABASE_URL=sqlite:///pms_v2.db&& set FRONTEND_URL=http://localhost:5174&& cd /d "%~dp0backend" && python run.py"
echo Backend started.
echo.
echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul
echo.
echo Starting Frontend (Port 5174)...
start "PMS-V2-Frontend" cmd /c "cd /d "%~dp0frontend" && call npm run dev"
echo Frontend started.
echo.
echo ========================================================
echo   BOTH SERVERS RUNNING
echo.
echo   Internal: http://localhost:5174/login
echo   Client:   http://localhost:5174/client-login
echo ========================================================
echo.
pause
