# Git Auto-Sync PowerShell 脚本
param(
    [string]$Remote = "origin",
    [string]$Branch = "main",
    [int]$IntervalSeconds = 20
)

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "🚀 [Git Auto-Sync] PowerShell 自动拉取与合并服务已启动" -ForegroundColor Green
Write-Host "📡 监听目标: $Remote/$Branch" -ForegroundColor Yellow
Write-Host "⏱️  检查间隔: $IntervalSeconds 秒" -ForegroundColor Yellow
Write-Host "ℹ️  按 Ctrl + C 可随时退出" -ForegroundColor DarkGray
Write-Host "======================================================" -ForegroundColor Cyan

while ($true) {
    try {
        # 1. 抓取远程更新
        git fetch -q $Remote $Branch 2>$null

        # 2. 获取本地和远程 Commit ID
        $localCommit = (git rev-parse HEAD 2>$null).Trim()
        $remoteCommit = (git rev-parse "$Remote/$Branch" 2>$null).Trim()

        if ($localCommit -and $remoteCommit -and ($localCommit -ne $remoteCommit)) {
            $behindCount = [int]((git rev-list --count HEAD.."$Remote/$Branch" 2>$null).Trim())

            if ($behindCount -gt 0) {
                $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                Write-Host ""
                Write-Host "🔔 [$now] 检测到远程仓库有 $behindCount 个新提交 (最新 Commit: $($remoteCommit.Substring(0,7)))" -ForegroundColor Yellow

                # 检查本地工作区是否有未暂存/未提交的修改
                $status = (git status --porcelain 2>$null)
                $stashed = $false

                if ($status) {
                    Write-Host "📦 正在安全暂存本地未提交的改动 (git stash)..." -ForegroundColor Cyan
                    git stash push -u -m "powershell-auto-sync-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())" | Out-Null
                    $stashed = $true
                }

                Write-Host "⬇️  正在变基拉取 (git pull --rebase $Remote $Branch)..." -ForegroundColor Cyan
                git pull --rebase $Remote $Branch

                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ 远程代码已成功合并到本地！" -ForegroundColor Green
                } else {
                    Write-Host "⚠️  自动变基遇到冲突，已暂停。请手动解决冲突后运行 git rebase --continue" -ForegroundColor Red
                }

                # 恢复本地修改
                if ($stashed) {
                    Write-Host "📤 正在恢复本地暂存的改动 (git stash pop)..." -ForegroundColor Cyan
                    git stash pop | Out-Null
                    Write-Host "✨ 本地开发工作区已恢复！" -ForegroundColor Green
                }
            }
        }
    } catch {
        Write-Host "⚠️ 执行检查时发生异常: $_" -ForegroundColor DarkYellow
    }

    Start-Sleep -Seconds $IntervalSeconds
}
