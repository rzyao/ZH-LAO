#!/usr/bin/env bash

# 同步配置
BRANCH="main"
REMOTE="origin"
INTERVAL_SECONDS=20

echo "======================================================"
echo "🚀 [Git Auto-Sync] 自动拉取与合并服务已启动"
echo "📡 监听目标: ${REMOTE}/${BRANCH}"
echo "⏱️  检查间隔: ${INTERVAL_SECONDS} 秒"
echo "======================================================"

while true; do
  # 1. 抓取远程最新元数据（静默模式）
  git fetch -q "$REMOTE" "$BRANCH" 2>/dev/null

  # 2. 对比本地与远程 commit
  LOCAL_COMMIT=$(git rev-parse HEAD 2>/dev/null)
  REMOTE_COMMIT=$(git rev-parse "${REMOTE}/${BRANCH}" 2>/dev/null)

  if [ -n "$LOCAL_COMMIT" ] && [ -n "$REMOTE_COMMIT" ] && [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]; then
    BEHIND_COUNT=$(git rev-list --count HEAD.."${REMOTE}/${BRANCH}" 2>/dev/null)

    if [ "$BEHIND_COUNT" -gt 0 ]; then
      echo ""
      echo "🔔 [$(date '+%Y-%m-%d %H:%M:%S')] 检测到远程仓库有 $BEHIND_COUNT 个新提交 (最新 Commit: ${REMOTE_COMMIT:0:7})"

      # 检查本地是否有未暂存/未提交的改动
      HAS_CHANGES=$(git status --porcelain)
      STASHED=false

      if [ -n "$HAS_CHANGES" ]; then
        echo "📦 正在暂存本地未提交的改动 (stash)..."
        git stash push -u -m "auto-sync-$(date +%s)" >/dev/null 2>&1
        STASHED=true
      fi

      echo "⬇️  正在变基拉取 (git pull --rebase ${REMOTE} ${BRANCH})..."
      if git pull --rebase "$REMOTE" "$BRANCH"; then
        echo "✅ 远程更新已成功合并到本地！"
      else
        echo "⚠️  自动变基遇到冲突，已暂停。请手动解决冲突后运行 git rebase --continue"
      fi

      # 恢复本地暂存的改动
      if [ "$STASHED" = true ]; then
        echo "📤 正在恢复本地暂存的改动 (stash pop)..."
        git stash pop >/dev/null 2>&1
        echo "✨ 本地开发上下文已恢复！"
      fi
    fi
  fi

  sleep $INTERVAL_SECONDS
done
