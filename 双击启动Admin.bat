@echo off
setlocal
title ZH-LAO Admin

echo ================================================
echo   ZH-LAO Admin development server
echo ================================================
echo.

set "ADMIN_DIR=%~dp0apps\admin"
if not exist "%ADMIN_DIR%\package.json" (
    echo [ERROR] Admin package.json was not found:
    echo %ADMIN_DIR%\package.json
    goto failed
)

where pnpm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] pnpm was not found. Install Node.js and pnpm first.
    goto failed
)

pushd "%ADMIN_DIR%"
if errorlevel 1 (
    echo [ERROR] Could not enter the Admin directory.
    goto failed
)

if not exist "node_modules\vite\package.json" (
    echo Installing Admin dependencies...
    call pnpm install --frozen-lockfile
    if errorlevel 1 goto failed_in_admin
)

echo Starting Admin at http://127.0.0.1:15173
echo Press Ctrl+C to stop the server.
echo.
call pnpm dev -- --host 127.0.0.1 --port 15173 --strictPort
if errorlevel 1 goto failed_in_admin
goto finished_in_admin

:failed_in_admin
popd
:failed
echo.
echo [ERROR] Admin startup failed. Review the messages above.
goto finished

:finished_in_admin
popd
:finished
echo.
pause
endlocal
