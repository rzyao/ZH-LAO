---
status: active
last_updated: 2026-08-31
---

# New Session Prompt Template

本模板用于从任意新 ChatGPT 会话启动一个独立 Task。

## 1. 最小启动版

当 `Task Manifest` 已完整存在时，Human Controller 可以只发送：

```text
使用 GitHub 连接器连接远程仓库 `rzyao/ZH-LAO`，读取最新 `main`。

读取：
- `docs/docs/development/workflow/index.md`
- `docs/docs/development/workflow/tasks/<TASK_ID>.yaml`

严格执行该 Task。

不得依赖任何聊天上下文、记忆、旧会话结果或用户口述的旧状态；所有事实必须从当前 `main` 恢复。

开始修改前必须完成：Role / Brief / Entry Gate / active claims / dependency snapshot / path scope 检查。
提交前必须重新读取最新 `main` 并执行 Pre-Push Revalidation。

完成当前 Task 后直接推送 GitHub main，并按照 `SESSION_HANDOFF_CONTRACT.md` 输出 Gate、下一合法动作、并行安全任务、阻塞任务，以及所有 READY Task 的完整新会话提示词。

完成当前 Task 后 STOP，不自动执行下一 Task。
```

## 2. 完整启动版

当需要人工复制一个完全自解释的 Prompt 时使用：

```text
你正在执行 ZH-LAO V2 的一个仓库驱动 AI Workflow Task。

远程仓库：`rzyao/ZH-LAO`
branch：`main`
Task ID：`<TASK_ID>`

必须使用 GitHub 连接器读取最新 `main`，不得依赖本聊天之前的任何上下文、记忆、旧 commit 状态、用户粘贴的旧结果或其它 AI 会话结论。

首先依次读取：
1. `docs/docs/development/workflow/index.md`
2. `docs/docs/development/workflow/ROLE_MODEL.md`
3. `docs/docs/development/workflow/SESSION_HANDOFF_CONTRACT.md`
4. `docs/docs/development/workflow/CONCURRENCY_RULES.md`
5. `docs/docs/development/workflow/tasks/<TASK_ID>.yaml`
6. Task Manifest 引用的 Brief / Gate / Report / required_sources
7. 当前 `workflow/claims/` 中相关 active claims

开始工作前必须：
- 记录当前 HEAD 为 `base_commit`；
- 确认 Task role；
- 确认 Entry Gate 全部满足；
- 检查 `conflicts_with`；
- 检查 owned/shared/exclusive/allowed/forbidden paths；
- 记录关键 dependency snapshot；
- 获取合法 Task claim。

如果 Entry Gate 不满足、Task 已被 claim、存在 exclusive path 冲突、或 required source 与 Task Manifest 发生实质冲突，立即 STOP，并按 Workflow Contract 报告真实阻塞原因；不得自行扩大 Scope 或绕过 Gate。

执行过程中严格遵守 Task Manifest 和 Brief。

提交前必须重新 fetch 最新 `main`，对比 `base_commit..latest_main`，检查并行会话是否修改了：
- 当前 Task Manifest；
- active claims；
- owned/shared/exclusive paths；
- upstream Gate；
- upstream public contract；
- frozen migration / ADR / architecture authority。

如果发现语义冲突或 dependency drift：
`CONCURRENT_CONFLICT / DEPENDENCY_DRIFT → STOP`。
不得 force push、reset main 或覆盖其他会话提交。

如果当前 Gate PASS：
- 完成当前 Task；
- 释放 claim；
- 计算 newly unlocked tasks；
- 推荐 Primary / Parallel Safe / Blocked。

如果当前 Gate != PASS：
- 当前主链停止；
- dependent downstream 必须 BLOCKED；
- 推荐最短合法 Recovery / Fix / Re-audit Task；
- 仍可推荐无依赖关系的 Parallel Safe Tasks；
- 不得把失败 Gate 的 dependent task 标为 READY。

完成后直接推送 GitHub main。

最终回复必须严格包含：
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

其中 `NEXT CONVERSATION PROMPTS` 必须为每个 READY Task 提供一份不依赖本聊天上下文的完整可复制 Prompt。

完成当前 Task 后 STOP，不自动开始下一 Task。
```

## 3. Recovery 会话附加段

如果 Task 是 Recovery，追加：

```text
本会话只负责恢复原失败 Gate。
必须先区分：真实实现/设计缺陷、依赖未满足、并发漂移、还是错误 Grounding/Invalid Gate。

如果原 finding 缺乏当前 main 的 exact source evidence，不得盲目修改代码或 frozen contract；必须先完成 Grounding Recovery。

Recovery 完成后重跑原 Gate。
无论原 Gate 最终 PASS 或 FAIL，本会话都在报告结果后 STOP，不自动进入原 Gate 之后的下游阶段。
```

## 4. Dispatcher 会话附加段

如果 role 是 `workflow_dispatcher`，追加：

```text
本会话不执行任何 Domain 业务实现，也不领取 Worker Claim。
只负责扫描 latest main，计算：
PRIMARY / PARALLEL SAFE / BLOCKED / ACTIVE / RECOVERY REQUIRED，
并为 READY Tasks 生成完整新会话 Prompt。
```

## 5. Prompt 质量检查

一个合格的下一会话 Prompt 必须做到：

```text
删除当前聊天记录后仍然能执行
换一个 AI 会话仍然能执行
多个会话并行时仍然安全
仓库状态变化后会重新审计而不是沿用旧结论
Gate FAIL 时不会错误向下游推进
```

如果做不到其中任何一条，Handoff 不合格。
