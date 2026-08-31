@echo off
setlocal
title ZH-LAO Backend

echo ================================================
echo   ZH-LAO Backend development server
echo ================================================
echo.

set "BACKEND_DIR=%~dp0apps\backend"
if not exist "%BACKEND_DIR%\package.json" (
    echo [ERROR] Backend package.json was not found:
    echo %BACKEND_DIR%\package.json
    goto failed
)

where pnpm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] pnpm was not found. Install Node.js and pnpm first.
    goto failed
)

pushd "%BACKEND_DIR%"
if errorlevel 1 (
    echo [ERROR] Could not enter the backend directory.
    goto failed
)

if not exist "node_modules" (
    echo Installing backend dependencies...
    call pnpm install --frozen-lockfile
    if errorlevel 1 goto failed_in_backend
)

if not exist ".env" echo [INFO] apps\backend\.env was not found. System environment variables will be used.

echo Starting backend at http://127.0.0.1:18080
echo Press Ctrl+C to stop the server.
echo.
call pnpm dev
if errorlevel 1 goto failed_in_backend
goto finished_in_backend

:failed_in_backend
popd
:failed
echo.
echo [ERROR] Backend startup failed. Review the messages above.
goto finished

:finished_in_backend
popd
:finished
echo.
pause
endlocal
