@echo off
setlocal
title ZH-LAO Documentation

echo ================================================
echo   ZH-LAO Documentation server
echo ================================================
echo.

set "DOCS_DIR=%~dp0docs"
if not exist "%DOCS_DIR%\package.json" (
    echo [ERROR] Documentation package.json was not found:
    echo %DOCS_DIR%\package.json
    goto failed
)

where pnpm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] pnpm was not found. Install Node.js and pnpm first.
    goto failed
)

pushd "%DOCS_DIR%"
if errorlevel 1 (
    echo [ERROR] Could not enter the documentation directory.
    goto failed
)

if not exist "node_modules\vitepress\package.json" (
    echo Installing documentation dependencies...
    call pnpm install --frozen-lockfile
    if errorlevel 1 goto failed_in_docs
)

echo Starting documentation at http://127.0.0.1:15172
echo Press Ctrl+C to stop the server.
echo.
call pnpm docs:dev
if errorlevel 1 goto failed_in_docs
goto finished_in_docs

:failed_in_docs
popd
:failed
echo.
echo [ERROR] Documentation startup failed. Review the messages above.
goto finished

:finished_in_docs
popd
:finished
echo.
pause
endlocal
