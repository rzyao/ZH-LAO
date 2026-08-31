@echo off
setlocal
title ZH-LAO Database Migration

echo ================================================
echo   ZH-LAO V2 database migration
echo ================================================
echo.

set "DATABASE_DIR=%~dp0database"
if not exist "%DATABASE_DIR%\package.json" (
    echo [ERROR] Migration package.json was not found:
    echo %DATABASE_DIR%\package.json
    goto failed
)

where pnpm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] pnpm was not found. Install Node.js and pnpm first.
    goto failed
)

pushd "%DATABASE_DIR%"
if errorlevel 1 (
    echo [ERROR] Could not enter the database directory.
    goto failed
)

if not exist "node_modules\pg\package.json" (
    echo Installing migration dependencies...
    call pnpm install --frozen-lockfile
    if errorlevel 1 goto failed_in_database
)

echo Running pending migrations...
call pnpm run migrate
if errorlevel 1 goto failed_in_database

echo.
echo [OK] Database migration completed successfully.
goto finished_in_database

:failed_in_database
popd
:failed
echo.
echo [ERROR] Database migration failed. Review the messages above.
goto finished

:finished_in_database
popd
:finished
echo.
pause
endlocal
