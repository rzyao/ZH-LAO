param(
    [string]$Remote = "origin",
    [string]$Branch = "main",
    [int]$IntervalSeconds = 20
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "[Git Auto-Sync] Auto-Sync background service is running" -ForegroundColor Green
Write-Host "Target: $Remote/$Branch" -ForegroundColor Yellow
Write-Host "Check Interval: $IntervalSeconds seconds" -ForegroundColor Yellow
Write-Host "Press Ctrl + C to stop at any time" -ForegroundColor DarkGray
Write-Host "======================================================" -ForegroundColor Cyan

while ($true) {
    try {
        git fetch -q $Remote $Branch 2>$null

        $localCommit = (git rev-parse HEAD 2>$null)
        if ($localCommit) { $localCommit = $localCommit.Trim() }

        $remoteCommit = (git rev-parse "$Remote/$Branch" 2>$null)
        if ($remoteCommit) { $remoteCommit = $remoteCommit.Trim() }

        if ($localCommit -and $remoteCommit -and ($localCommit -ne $remoteCommit)) {
            $behindCountRaw = (git rev-list --count HEAD.."$Remote/$Branch" 2>$null)
            $behindCount = 0
            if ($behindCountRaw) {
                $behindCount = [int]($behindCountRaw.Trim())
            }

            if ($behindCount -gt 0) {
                $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                $shortHash = $remoteCommit
                if ($shortHash.Length -gt 7) { $shortHash = $shortHash.Substring(0, 7) }

                Write-Host ""
                Write-Host "[$now] Remote updates detected: $behindCount new commits (Latest: $shortHash)" -ForegroundColor Yellow

                $status = (git status --porcelain 2>$null)
                $stashed = $false

                if ($status) {
                    Write-Host "[Stash] Stashing local uncommitted changes..." -ForegroundColor Cyan
                    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
                    git stash push -u -m "powershell-auto-sync-$timestamp" | Out-Null
                    $stashed = $true
                }

                Write-Host "[Pull] Pulling and rebasing (git pull --rebase $Remote $Branch)..." -ForegroundColor Cyan
                git pull --rebase $Remote $Branch

                if ($LASTEXITCODE -eq 0) {
                    Write-Host "[Success] Successfully pulled and merged remote changes!" -ForegroundColor Green
                } else {
                    Write-Host "[Warning] Rebase conflict occurred. Please resolve conflicts and run git rebase --continue" -ForegroundColor Red
                }

                if ($stashed) {
                    Write-Host "[Restore] Restoring local uncommitted changes (stash pop)..." -ForegroundColor Cyan
                    git stash pop | Out-Null
                    Write-Host "[Success] Local workspace restored!" -ForegroundColor Green
                }
            }
        }
    } catch {
        Write-Host "[Error] Exception during sync check: $_" -ForegroundColor DarkYellow
    }

    Start-Sleep -Seconds $IntervalSeconds
}
