@echo off
rem Git Auto-Sync Launcher (ANSI Encoding Safe)
title Git Auto-Sync Service
color 0A

echo ======================================================
echo   Git Auto-Sync is starting...
echo   Target: origin/main
echo   Interval: 20s
echo   Keep this window open. Close it to stop.
echo ======================================================
echo.

cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\auto-sync.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo An error occurred. Press any key to exit...
    pause >nul
)
