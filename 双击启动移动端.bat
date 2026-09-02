@echo off
setlocal
title ZH-LAO Mobile

echo ================================================
echo   ZH-LAO Mobile (Expo / Metro Dev Server)
echo ================================================
echo.

set "MOBILE_DIR=%~dp0apps\mobile"
if not exist "%MOBILE_DIR%\package.json" (
    echo [ERROR] Mobile package.json was not found:
    echo %MOBILE_DIR%\package.json
    goto failed
)

where pnpm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] pnpm was not found. Install Node.js and pnpm first.
    goto failed
)

pushd "%MOBILE_DIR%"
if errorlevel 1 (
    echo [ERROR] Could not enter the mobile directory.
    goto failed
)

if not exist "node_modules\expo\package.json" (
    echo Installing mobile dependencies...
    call pnpm install --frozen-lockfile
    if errorlevel 1 goto failed_in_mobile
)

if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] Creating .env from .env.example...
        copy /y ".env.example" ".env" >nul
    )
)

echo [1] Web preview mode (Recommended, opens in browser)
echo [2] Standard Metro dev mode (Press w for web, a for Android)
echo.
set /p MODE="Select mode [default: 1]: "

if "%MODE%"=="2" (
    echo.
    echo Starting Expo / Metro development server on port 18081...
    echo.
    echo Shortcut instructions:
    echo   - Press 'w' to open in web browser
    echo   - Press 'a' to open in Android emulator
    echo   - Press 'r' to reload app
    echo.
    call pnpm start
) else (
    echo.
    echo Starting Expo Web on http://localhost:18081...
    call pnpm web
)

if errorlevel 1 goto failed_in_mobile
goto finished_in_mobile

:failed_in_mobile
popd
:failed
echo.
echo [ERROR] Mobile startup failed. Review the messages above.
goto finished

:finished_in_mobile
popd
:finished
echo.
pause
endlocal
