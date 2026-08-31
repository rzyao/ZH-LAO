@echo off
chcp 65001 >nul
title Git 自动同步服务 (ZH-LAO)
color 0A

echo ======================================================
echo   🚀 [Git Auto-Sync] 自动拉取与合并服务正在启动...
echo   📡 监听目标: origin/main
echo   ⏱️  检查间隔: 20 秒
echo   ℹ️  请保持本窗口开启，关闭窗口即可停止同步。
echo ======================================================
echo.

cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\auto-sync.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️ 发生错误，按任意键退出...
    pause >nul
)
