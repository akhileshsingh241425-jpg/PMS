@echo off
title PMS - Project Management System
color 0A
cd /d "%~dp0"
set "ROOT=%~dp0"

echo.
echo ========================================================
echo   PMS - Project Management System
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

:: Kill old backend/frontend processes
echo Cleaning up old processes...
for /f "tokens=5 delims= " %%a in ('netstat -ano ^| findstr /c:":5002 "') do (
    if not "%%a"=="" taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5 delims= " %%a in ('netstat -ano ^| findstr /c:":5174 "') do (
    if not "%%a"=="" taskkill /f /pid %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

:: Force re-seed: delete old DB so schema matches current models
cd /d "%ROOT%backend"
if exist "instance\pms_v2.db" (
    echo Removing old database to sync schema...
    del /q "instance\pms_v2.db"
)
if exist "instance\.seeded" del /q "instance\.seeded"

echo Seeding fresh database...
python seed_data.py
python seed_client.py
echo seeded > "instance\.seeded"
cd /d "%ROOT%"

echo.
echo Starting Backend Server (Port 5002)...
start "PMS-Backend" /d "%ROOT%backend" cmd /c "set FRONTEND_URL=http://localhost:5174 && python run.py"
echo Backend started.
echo.
timeout /t 3 /nobreak >nul
echo.
echo Starting Frontend (Port 5174)...
start "PMS-Frontend" /d "%ROOT%frontend" cmd /c "call npm run dev"
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
