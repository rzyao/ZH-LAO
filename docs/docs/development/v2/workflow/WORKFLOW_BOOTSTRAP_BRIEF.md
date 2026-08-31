---
status: ready
role: workflow_dispatcher
bootstrap_only: true
business_implementation: false
last_updated: 2026-08-31
---

# Workflow Control Plane Bootstrap Brief

本 Brief 用于 **第一次点火** ZH-LAO V2 的仓库驱动 AI 多会话工作流。

本会话只建立/校准 Workflow Control Plane，不执行任何 Domain 的正式 Design、Backend、Admin、Client Implementation。

## 1. Mission

```text
Repository Re-Audit
→ Recover actual current state
→ Build Task Registry
→ Define current dependency graph
→ Create task manifests
→ Establish claim/event structure
→ Calculate READY / BLOCKED / ACTIVE / RECOVERY_REQUIRED
→ Generate context-free next-session prompts
→ Push main
→ STOP
```

## 2. Hard Rule：完全不依赖聊天上下文

Bootstrap 必须假定：

```text
之前所有聊天都已经丢失
```

所有状态必须从当前 GitHub `main` 恢复。

用户口述、AI 记忆、旧 commit 摘要只能用于帮助定位 source，不能直接成为状态事实。

## 3. Mandatory Global Reads

至少读取：

```text
docs/docs/development/v2/MASTER_DEVELOPMENT_PLAN.md
docs/docs/development/v2/DEVELOPMENT_CONTROL_CENTER.md
docs/docs/development/v2/DOMAIN_LIFECYCLE_MATRIX.md
docs/docs/development/v2/DEVELOPMENT_PROGRESS.md

docs/docs/development/v2/workflow/index.md
docs/docs/development/v2/workflow/ROLE_MODEL.md
docs/docs/development/v2/workflow/SESSION_HANDOFF_CONTRACT.md
docs/docs/development/v2/workflow/CONCURRENCY_RULES.md
docs/docs/development/v2/workflow/TASK_MANIFEST_SCHEMA.md
```

## 4. Mandatory Repository Discovery

扫描当前 `docs/docs/development/v2/**` 中存在的：

```text
*_DESIGN_BRIEF.md
*_DESIGN_AUDIT.md
*_EXECUTION_BRIEF.md
*_IMPLEMENTATION_REPORT.md
*_ADMIN_EXECUTION_BRIEF.md
*_ADMIN_IMPLEMENTATION_REPORT.md
*_RECOVERY_BRIEF.md
```

并检查与这些文档对应的真实：

- backend module；
- admin feature；
- mobile/client feature；
- tests；
- CI evidence；
- Gate declarations；
- frozen migration / ADR / public contracts。

不要因为“Brief 存在”就认为 Implementation 已开始。

不要因为“代码存在”就认为 Gate PASS。

## 5. Authority Rules

架构 / DB：

```text
Frozen Migration
→ Frozen Domain DB Docs / Accepted ADR
→ Current Phase Brief
→ Upstream Frozen Public Contract
→ Generated Docs
```

完成状态：

```text
Final Gate / Final Audit
→ Implementation Report
→ Current code/tests/CI evidence
→ DEVELOPMENT_PROGRESS
→ Control views
```

如果全局控制页与 Final Report 冲突，把它标记为 documentation drift，不得反过来否定更高优先级证据。

## 6. Build Task Registry

创建：

```text
docs/docs/development/v2/workflow/TASK_INDEX.md
docs/docs/development/v2/workflow/NEXT_ACTIONS.md
docs/docs/development/v2/workflow/tasks/*.yaml
docs/docs/development/v2/workflow/events/*.md   # 仅在需要记录 bootstrap 事实时
```

`claims/` 只为真实 active Worker 创建 Claim；Bootstrap 自身不得领取业务 Claim。

## 7. Task Discovery Rules

至少考虑这些 track：

```text
design
backend
admin
client
recovery
reconciliation
integration
validation
release
```

不要为了“表看起来完整”提前创建大量臆测任务。

只为当前 pipeline 中：

- 已存在 Brief；
- 已被 Master Plan 明确；
- 或已经被真实 Gate/Report 解锁/阻塞；

的工作建立 Task Manifest。

## 8. Task Manifest Requirements

每个 Task 至少填：

```yaml
task_id:
role:
domain:
track:
status:
priority:
parallel_safe:
brief:
entry_gates:
depends_on:
conflicts_with:
owned_paths:
shared_paths:
exclusive_paths:
allowed_paths:
forbidden_paths:
required_sources:
expected_gate:
on_pass:
on_fail:
final_report:
```

遵守 `TASK_MANIFEST_SCHEMA.md`。

## 9. Status Calculation

### READY

只有同时满足：

```text
Entry Gate satisfied
AND no active conflicting claim
AND no exclusive path collision
AND no invalid/recovery source
AND required Brief/source exists
```

### BLOCKED

明确记录：

- blocked_by task；
- blocked_by Gate；
- blocked_by contract；
- blocked_by missing source。

### RECOVERY_REQUIRED

如果当前 Gate FAIL / invalid / contamination / dependency drift，优先创建 Recovery Task。

### ACTIVE

只能来自真实 active claim；不要根据“看起来有人在做”猜。

## 10. Gate FAIL Routing

如果当前 Gate `!= PASS`：

```text
Primary = Recovery / Fix / Re-audit
Dependent downstream = BLOCKED
Independent work = may remain PARALLEL SAFE
```

必须显式验证：

```text
失败 Gate 的 dependent task 不得出现在 READY
```

## 11. Concurrency Planning

推荐当前并行窗口最多优先选择：

```text
1 Admin
1 Backend
1 Design
+ 1 Recovery/Audit when necessary
```

但必须基于真实 path / claim / contract 冲突判断，而不是机械凑满三轨。

## 12. TASK_INDEX.md

应提供人类可读总表，至少：

| Task ID | Role | Track | Status | Gate | Dependencies | Claim | Parallel Safe | Brief |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

它是索引，不是最终事实源；状态仍需回到 Manifest/Gate/Report。

## 13. NEXT_ACTIONS.md

必须按以下固定结构：

```text
# Current Scheduling Snapshot

HEAD
Generated At

## PRIMARY

## PARALLEL SAFE

## ACTIVE

## BLOCKED

## RECOVERY REQUIRED

## NEXT CONVERSATION PROMPTS
```

每个 READY Task 都必须有一份完整、无上下文 Prompt。

## 14. New Session Prompt Quality Gate

每个 Prompt 必须通过：

```text
NO_CHAT_CONTEXT_REQUIRED = YES
LATEST_MAIN_REVALIDATION = YES
TASK_ID_EXPLICIT = YES
ROLE_DISCOVERABLE = YES
CLAIM_CHECK_REQUIRED = YES
ENTRY_GATE_CHECK_REQUIRED = YES
PRE_PUSH_REVALIDATION_REQUIRED = YES
GATE_FAIL_ROUTING_INCLUDED = YES
STOP_BOUNDARY_INCLUDED = YES
```

任一为 NO，则不能把该 Prompt 视为可交接。

## 15. Global Views

Bootstrap 可以修正：

- `DEVELOPMENT_CONTROL_CENTER.md`
- `DOMAIN_LIFECYCLE_MATRIX.md`
- `DEVELOPMENT_PROGRESS.md`

但仅限把它们同步到已经由更高优先级 Gate/Report 证实的事实。

不得利用 Bootstrap 重新设计 Domain。

## 16. No Business Work

本任务严格禁止：

- Domain backend implementation；
- Admin UI implementation；
- Mobile/client implementation；
- 新业务表；
- frozen migration rewrite；
- 新产品需求设计；
- 领取任何 Domain Worker Claim。

## 17. Final Audit

完成前确认：

```text
TASK_REGISTRY_EXISTS = YES
READY_TASKS_GROUNDED = YES
BLOCKED_TASKS_HAVE_REASON = YES
GATE_FAIL_DEPENDENTS_NOT_READY = YES
CONCURRENCY_RULES_APPLIED = YES
NEXT_PROMPTS_CONTEXT_FREE = YES
BUSINESS_IMPLEMENTATION_CHANGES = 0
```

## 18. Final Response

必须报告：

```text
BOOTSTRAP RESULT
HEAD / COMMITS
CREATED TASKS
READY TASKS
PARALLEL SAFE TASKS
ACTIVE TASKS
BLOCKED TASKS
RECOVERY REQUIRED
DOCUMENTATION DRIFT FOUND
NEXT CONVERSATION PROMPTS
STOP
```

## 19. Stop

Workflow Bootstrap 完成后直接推送 GitHub main，然后 STOP。

不要自动启动任何 READY Task。
