---
status: active
last_updated: 2026-08-31
---

# Concurrency / Claim Rules

本页定义多个 AI 会话同时工作时的并发安全规则。

## 1. 默认并行模型

推荐同时存在：

```text
1 x Admin 主任务
1 x Backend 主任务
1 x Design 主任务
+ 必要时 1 x Recovery / Audit
```

并发数量不是硬上限，但超过这个规模时必须证明：

- 路径不冲突；
- Contract dependency 不冲突；
- Claim 不冲突；
- Human Controller 确实需要更多并行度。

## 2. Claim 粒度

Claim 不是“锁整个 Domain”，而是至少锁：

```text
domain + track + task_id
```

例如：

```text
CONTENT / backend / CONTENT-BACKEND
CONTENT / admin   / CONTENT-ADMIN
SOCIAL  / design  / SOCIAL-DESIGN
```

这样允许不同轨按 Gate 规则错位并行。

## 3. Claim 文件

active claim 推荐路径：

```text
workflow/claims/<TASK_ID>.md
```

最小内容：

```yaml
task_id: CONTENT-BACKEND
role: backend_worker
status: active
base_commit: <sha>
claimed_at: <ISO timestamp>
manifest: workflow/tasks/CONTENT-BACKEND.yaml
```

Task 完成、失败并明确停止、或被 Dispatcher 正式取消后必须释放 claim。

## 4. 路径类别

每个 Task Manifest 必须区分：

### `owned_paths`

当前 Task 的自然所有权范围。并行 Task 不应修改。

### `shared_paths`

允许多个任务在不同时间修改，但提交前必须重新读取 latest main 并做语义合并检查。

### `exclusive_paths`

同一时刻只能被一个 active Task claim 使用。

### `allowed_paths`

Task 可修改的最大范围。

### `forbidden_paths`

即使“修起来很方便”也禁止修改。

## 5. 同一 Task 重复 Claim

如果已经存在：

```text
claims/CONTENT-BACKEND.md
status: active
```

第二个 Worker 试图执行 `CONTENT-BACKEND`：

```text
TASK_ALREADY_CLAIMED
→ STOP
```

不得创建第二个 Content Backend 实现会话。

## 6. Shared Path 规则

典型 shared path：

- composition/bootstrap wiring；
- root router；
- permission catalog；
- CI workflow；
-全局 docs index。

修改 shared path 前：

1. fetch latest main；
2. 检查 active claims；
3. 判断是否存在其它 Task 正准备修改；
4. 提交前再次 compare base..latest；
5. 只做语义兼容的合并。

## 7. Exclusive Path 规则

典型 exclusive path 可以包括：

- frozen migration family（通常应直接 forbidden）；
- 全局 static permission registry 的大规模重构；
- 单一 composition root 的结构性重写；
- release manifest / generated control state。

如果 exclusive path 已被另一 active claim 占用：

```text
EXCLUSIVE_PATH_BUSY
→ 当前 Task BLOCKED 或等待 Reconciliation
```

## 8. Dependency Snapshot

Task 启动时必须对关键上游依赖记录 snapshot，例如：

```yaml
dependency_snapshot:
  - name: CONTENT_GATE
    value: PASS
  - path: docs/docs/development/05-content/CONTENT_PUBLIC_CONTRACTS.md
    sha: <blob-sha>
```

Pre-Push 时重新比较。

如果上游 contract 发生变化：

```text
DEPENDENCY_DRIFT
→ re-audit required
```

不得静默使用旧假设继续提交。

## 9. Pre-Push Revalidation

所有 Worker 推送前必须：

```text
fetch latest main
compare base_commit..latest_main
```

并检查：

- 当前 Task Manifest 是否变化；
- claim 状态是否变化；
- owned/shared/exclusive path 是否变化；
- upstream Gate 是否仍满足；
- dependency snapshot 是否漂移；
- frozen source 是否变化。

## 10. 并发冲突处理

发现冲突时禁止：

- force push；
- reset main；
- 覆盖别人的文件；
- 通过删除别人 commit“解决”；
- 假定另一个 Worker 的改动不重要。

必须：

```text
CONCURRENT_CONFLICT
→ report exact files / contracts
→ release or retain claim according to safety
→ STOP
→ Dispatcher / Reconciliation 决定后续
```

## 11. Gate FAIL 与并行任务

某 Task Gate FAIL 只阻塞依赖它的任务。

例如：

```text
CONTENT_GATE = FAIL
```

应得到：

```text
Primary Recovery:
- CONTENT-BACKEND-RECOVERY

Blocked:
- CONTENT-ADMIN
- LEARNING-BACKEND
- AUDIO-BACKEND

Potentially Parallel Safe:
- OPERATIONS-ADMIN
- SOCIAL-DESIGN
```

后两项仍必须各自满足自己的 Task Manifest / Entry Gate。

## 12. 全局共享页面

以下文件默认视为高冲突 shared/control views：

- `DEVELOPMENT_CONTROL_CENTER.md`
- `DOMAIN_LIFECYCLE_MATRIX.md`
- `DEVELOPMENT_PROGRESS.md`
- `workflow/TASK_INDEX.md`
- `workflow/NEXT_ACTIONS.md`

普通 Worker 不应在每次提交中主动重写整页。

优先由 `reconciliation_worker` 或 `workflow_dispatcher` 基于 Task/Gate 事实统一更新。

## 13. 并行安全判断

一个 Task 只有同时满足以下条件才可标记 `parallel_safe: true`：

```text
Entry Gate satisfied
AND no conflicts_with active task
AND no owned/exclusive path collision
AND dependency snapshot stable
AND no recovery that invalidates its source
```

> “不同 Domain”不自动等于“可以并行”。
