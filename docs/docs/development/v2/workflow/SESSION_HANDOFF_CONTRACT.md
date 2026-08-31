---
status: active
last_updated: 2026-08-31
---

# Session Handoff Contract

本页定义所有 AI 工作会话的强制启动、执行、结束与交接协议。

目标：**任何新会话不依赖上一个聊天窗口，也能从 GitHub 最新 main 无缝接手。**

## 1. 启动契约

所有 Worker 开始前必须完成：

```text
FETCH latest main
→ record HEAD as base_commit
→ read workflow/index.md
→ read ROLE_MODEL.md
→ read this contract
→ read CONCURRENCY_RULES.md
→ read tasks/<TASK_ID>.yaml
→ read referenced Brief / Gate / Report / upstream contracts
→ inspect active claims
→ revalidate Entry Gate
→ acquire claim
→ only then execute
```

不得使用聊天历史替代上述任何一步。

## 2. Source Snapshot

启动时至少记录：

```yaml
base_commit: <sha>
task_id: <TASK_ID>
role: <role>
entry_gate_snapshot:
  - <gate>=PASS
dependency_snapshot:
  - path: <public-contract-or-gate>
    sha: <blob-or-commit-sha>
```

如果 Task 依赖 upstream public contract，必须记录其 snapshot。

## 3. 执行边界

Worker 只能修改 Task Manifest 允许的：

- `owned_paths`；
- `shared_paths`；
- `exclusive_paths`（已获得合法 claim 时）；
- `allowed_paths`。

`forbidden_paths` 永远禁止。

如果执行过程中发现需要修改未授权路径：

```text
SCOPE_EXPANSION_REQUIRED
→ STOP
→ 报告原因
→ 不静默扩大 Task
```

## 4. Pre-Push Revalidation

任何提交到 main 前必须重新读取最新 main：

```text
latest_main = fetch main
compare base_commit..latest_main
```

必须检查：

- active claims 是否变化；
- owned/shared/exclusive path 是否被别人修改；
- upstream Gate 是否变化；
- upstream public contract 是否变化；
- frozen migration / ADR 是否变化；
- Task Manifest 是否被 Dispatcher/Reconciliation 更新。

出现语义冲突时：

```text
CONCURRENT_CONFLICT
或
DEPENDENCY_DRIFT
→ STOP
→ 不覆盖别人提交
```

只要 latest main 的变化与本 Task 无语义冲突，可以继续。

## 5. Gate 结果路由

### Gate = PASS

允许：

- 标记当前 Task COMPLETE；
- 释放 claim；
- 计算 newly unlocked tasks；
- 推荐下一个合法阶段与 parallel-safe tasks。

### Gate != PASS

必须：

- 当前主链停止；
- dependent downstream 保持 BLOCKED；
- 推荐最短合法 Recovery / Fix / Re-audit Task；
- 仍可推荐与该失败无依赖关系的 parallel-safe tasks。

禁止把 dependent task 列为 READY。

## 6. Final Response Contract

所有 Design / Backend / Admin / Client / Recovery Worker 最终回复必须包含以下字段：

```text
CURRENT TASK
ROLE
RESULT
GATE RESULT
ACTUAL COMMITS
CHANGED FILES
TEST / AUDIT EVIDENCE
CONCURRENT CHANGES OBSERVED
CLAIM STATUS
REMAINING BLOCKERS
NEWLY UNLOCKED TASKS
PARALLEL SAFE TASKS
BLOCKED TASKS
PRIMARY NEXT ACTION
NEXT CONVERSATION PROMPTS
STOP CONFIRMATION
```

不得省略 `PRIMARY NEXT ACTION` 和 `NEXT CONVERSATION PROMPTS`。

## 7. 下一会话 Prompt 必须自包含

每个 READY Task 的 Prompt 必须明确：

- 仓库：`rzyao/ZH-LAO`；
- 分支：`main`；
- Task ID；
- 首先读取 `workflow/index.md`；
- 完全依赖 latest main；
- 不依赖聊天历史；
- 检查 claims / Entry Gate；
- 读取 Task Manifest 指向的 Brief；
- 提交前执行 Pre-Push Revalidation；
- Gate FAIL 的 Recovery 路由；
- 完成后继续输出下一合法动作和新的自包含 Prompt；
- 当前 Task 完成后 STOP。

统一模板见 [NEW_SESSION_PROMPT_TEMPLATE.md](NEW_SESSION_PROMPT_TEMPLATE.md)。

## 8. Handoff 数据应该落仓库

聊天最终回复只是给 Human Controller 看的便利输出。

真正可被下个会话复用的事实必须已经存在于 GitHub，例如：

```text
Task Manifest
Implementation / Design / Admin Report
Gate Result
Task Event
Claim release
Recovery Report（如果有）
```

如果某关键事实只存在于聊天回复、没有落仓库，则视为 **handoff incomplete**。

## 9. Stop Boundary

Worker 完成当前 Task 后：

```text
报告下一步
生成下一会话 Prompt
STOP
```

“告诉用户下一步是什么”不等于“自动执行下一步”。

## 10. 最小无上下文启动指令

当 Task Registry 已存在时，Human Controller 理论上只需要发送：

```text
使用 GitHub 连接器连接 `rzyao/ZH-LAO` 最新 main，
读取 `docs/docs/development/v2/workflow/index.md` 和
`docs/docs/development/v2/workflow/tasks/<TASK_ID>.yaml`，严格执行。
不得依赖任何聊天上下文。
```

其余上下文应全部由仓库文档恢复。
