---
status: active
last_updated: 2026-08-31
---

# New Session Prompt Template

本模板用于从任意新 ChatGPT 会话启动一个独立 Task。对于采用 Implementation Blueprint 的 implementation Task，Prompt 必须让 Worker 在改代码前完成 Blueprint / base commit / spec SHA 验证。

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
如果 Manifest 的 `implementation_blueprint.required = true`，还必须读取 `SPEC_SYSTEM.md` 和 Blueprint，验证 Blueprint `base_commit`、canonical spec SHA、Decision Budget 与 Repository Drift；验证完成前禁止改代码。

提交前必须重新读取最新 `main` 并执行 Pre-Push Revalidation。

完成当前 Task 后按照 `SESSION_HANDOFF_CONTRACT.md` 输出 Gate、下一合法动作、并行安全任务、阻塞任务，以及所有 READY Task 的完整新会话提示词。

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
3. `docs/docs/development/SPEC_SYSTEM.md`
4. `docs/docs/development/workflow/SESSION_HANDOFF_CONTRACT.md`
5. `docs/docs/development/workflow/CONCURRENCY_RULES.md`
6. `docs/docs/development/workflow/tasks/<TASK_ID>.yaml`
7. Task Manifest 引用的 Brief / Gate / Report / required_sources
8. 如果 `implementation_blueprint.required = true`：读取 Manifest 指向的 Implementation Blueprint
9. 如果 Domain 已 adopted canonical spec：读取 spec 并验证 Blueprint/Manifest 记录的 SHA-256
10. 当前 `workflow/claims/` 中相关 active claims

开始工作前必须：
- 记录当前 HEAD 为 `latest_main`；
- 确认 Task role；
- 确认 Entry Gate 全部满足；
- 检查 `conflicts_with`；
- 检查 owned/shared/exclusive/allowed/forbidden paths；
- 记录关键 dependency snapshot；
- 获取合法 Task claim；
- 若有 Blueprint，读取其中 Requirement Trace / File Change Map / Symbol Contracts / ordered pseudocode / transaction-concurrency-error-security rules / Test Matrix / Implementation Order / Decision Budget；
- 若有 Blueprint，比较 `blueprint.base_commit..latest_main`，判断 `BASE_MATCH / DRIFT_REVALIDATED / REPOSITORY_DRIFT`；
- 若有 adopted spec，确认 `source_spec_sha256` 匹配当前 canonical spec。

如果 Entry Gate 不满足、Task 已被 claim、存在 exclusive path 冲突、required source 与 Task Manifest 发生实质冲突，立即 STOP，并按 Workflow Contract 报告真实阻塞原因；不得自行扩大 Scope 或绕过 Gate。

如果 Blueprint 与 authority/spec/brief 不可同时满足：
`SPEC_CONFLICT → STOP`。

如果 Blueprint 缺少超出 Decision Budget 的必要设计决定：
`IMPLEMENTATION_BLOCKER → STOP`。

如果 Blueprint 生成后 main 的变化实质影响其 authority、spec SHA、target symbols、owned/shared paths 或 upstream contract：
`REPOSITORY_DRIFT → STOP`。

如果 main 有变化但证明与 Blueprint 语义无关：记录 `DRIFT_REVALIDATED` 后可以继续。

执行过程中严格遵守 Task Manifest、Brief、Blueprint 和上游 authority。

Implementation Worker 只能自行处理：
- Blueprint `CONSTRAINED` 范围内的 private decomposition；
- Blueprint `FREE` 范围内的局部实现细节；
- 编译、lint、类型、测试失败中不改变 observable semantics 的局部修复。

Implementation Worker 不得自行改变 Blueprint `LOCKED` 项，包括但不限于：
- API path/request/response；
- public interfaces；
- DB/transaction boundary；
- state transitions；
- error semantics；
- cross-domain contract；
- permission/security invariant；
- frozen DB invariant。

提交前必须重新 fetch 最新 `main`，对比实现起点到 latest main，检查并行会话是否修改了：
- 当前 Task Manifest；
- active claims；
- Blueprint；
- canonical spec / spec SHA；
- owned/shared/exclusive paths；
- upstream Gate；
- upstream public contract；
- frozen migration / ADR / architecture authority；
- Blueprint referenced target symbols。

如果发现语义冲突或 dependency drift：
`CONCURRENT_CONFLICT / DEPENDENCY_DRIFT / REPOSITORY_DRIFT → STOP`。
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

最终回复必须严格包含：
CURRENT TASK
ROLE
RESULT
GATE RESULT
ACTUAL COMMITS
CHANGED FILES
BLUEPRINT CONFORMANCE
REQUIREMENT TRACE RESULT
TEST / AUDIT EVIDENCE
CONCURRENT CHANGES OBSERVED
CLAIM STATUS
CONFLICT STATUS
REMAINING BLOCKERS
NEWLY UNLOCKED TASKS
PARALLEL SAFE TASKS
BLOCKED TASKS
PRIMARY NEXT ACTION
NEXT CONVERSATION PROMPTS
STOP CONFIRMATION

`BLUEPRINT CONFORMANCE` 至少说明：
- blueprint path / version；
- base commit；
- spec SHA match（若适用）；
- LOCKED deviations = 0 或列出阻塞；
- File Change Map 与真实 diff 是否一致；
- 是否发生 DRIFT_REVALIDATED。

`CONFLICT STATUS` 只能明确写：
`NONE | SPEC_CONFLICT | IMPLEMENTATION_BLOCKER | REPOSITORY_DRIFT | CONCURRENT_CONFLICT | DEPENDENCY_DRIFT`。

其中 `NEXT CONVERSATION_PROMPTS`/`NEXT CONVERSATION PROMPTS` 必须为每个 READY Task 提供一份不依赖本聊天上下文的完整可复制 Prompt。

完成当前 Task 后 STOP，不自动开始下一 Task。
```

## 3. Design / Spec Compiler 会话附加段

如果 role 是 `design_worker`，并且当前 Task 要为后续 implementation 生成 Blueprint，追加：

```text
本会话承担 Architect / Spec Compiler 职责，不写正式业务实现代码。

Design Gate PASS 后，根据当前 main、Execution Brief、canonical spec（若 adopted）、Public Contract 和 frozen authority，使用：
`docs/docs/development/IMPLEMENTATION_BLUEPRINT_TEMPLATE.md`
生成本 Task 的 Implementation Blueprint。

Blueprint 必须做到接近伪代码级别：
- exact file paths；
- CREATE/MODIFY/TEST map；
- exact/new symbols；
- inputs/outputs；
- ordered pseudocode；
- transaction/concurrency/idempotency；
- error mapping；
- security/RBAC；
- integration/public contract calls；
- Requirement→symbol→test trace；
- test matrix；
- implementation order；
- LOCKED/CONSTRAINED/FREE Decision Budget；
- SPEC_CONFLICT / IMPLEMENTATION_BLOCKER / REPOSITORY_DRIFT protocol；
- base_commit + canonical spec SHA snapshot。

如果无法从 authority 和 current repository 推导出某个高风险实现决定，不要把决定留给实现 Worker；先补齐设计 authority 或把下游标记 BLOCKED。
```

## 4. Implementation Worker 会话附加段

如果 role 是 `backend_worker` / `admin_worker` / `client_worker` 且 Manifest 要求 Blueprint，追加：

```text
你的任务是实现，不是重新设计。

优先按 Blueprint 机械执行。你可以在 CONSTRAINED/FREE 中做局部工程选择，但不得改变 LOCKED。

遇到设计缺口不要脑补：
- authority 冲突 → SPEC_CONFLICT；
- 缺关键设计决定 → IMPLEMENTATION_BLOCKER；
- base/spec/repository 实质漂移 → REPOSITORY_DRIFT。

三者任一成立时 STOP，并给出 exact path/symbol/Requirement evidence，让上游 Spec Compiler 可以最小化修订。
```

## 5. Recovery 会话附加段

如果 Task 是 Recovery，追加：

```text
本会话只负责恢复原失败 Gate。
必须先区分：真实实现/设计缺陷、依赖未满足、并发漂移、Blueprint 漂移、Spec 冲突、还是错误 Grounding/Invalid Gate。

如果原 finding 缺乏当前 main 的 exact source evidence，不得盲目修改代码或 frozen contract；必须先完成 Grounding Recovery。

如果失败来自过期 Blueprint，优先恢复 authority snapshot 并重生成/revalidate Blueprint，而不是让 Implementation Worker 绕过它。

Recovery 完成后重跑原 Gate。
无论原 Gate 最终 PASS 或 FAIL，本会话都在报告结果后 STOP，不自动进入原 Gate 之后的下游阶段。
```

## 6. Dispatcher 会话附加段

如果 role 是 `workflow_dispatcher`，追加：

```text
本会话不执行任何 Domain 业务实现，也不领取 Worker Claim。
只负责扫描 latest main，计算：
PRIMARY / PARALLEL SAFE / BLOCKED / ACTIVE / RECOVERY REQUIRED。

对 implementation Task 还必须检查：
- 是否要求 Blueprint；
- required Blueprint 是否存在且 ready；
- Blueprint snapshot 是否明显失效；
- 是否需要先调度 design_worker / recovery_worker 生成或恢复 Blueprint。

然后为 READY Tasks 生成完整新会话 Prompt。
```

## 7. Prompt 质量检查

一个合格的下一会话 Prompt 必须做到：

```text
删除当前聊天记录后仍然能执行
换一个 AI 会话仍然能执行
强 AI 与本地弱 AI 可以按角色分工
实现 Worker 不需要重新推导高风险架构语义
多个会话并行时仍然安全
仓库状态变化后会重新审计而不是沿用旧结论
Gate FAIL 时不会错误向下游推进
Blueprint 过期时会 STOP/revalidate 而不是继续猜
```

如果做不到其中任何一条，Handoff 不合格。
