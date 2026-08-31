---
status: active
last_updated: 2026-08-31
---

# Task Manifest Schema

每个可独立启动的 AI 工作项都必须拥有唯一 Task Manifest：

```text
docs/docs/development/workflow/tasks/<TASK_ID>.yaml
```

Task Manifest 是新会话的“执行身份证明”，不是聊天摘要。

## 1. 推荐完整结构

```yaml
task_id: CONTENT-BACKEND
version: 1

role: backend_worker
domain: content
track: backend

status: ready
priority: primary
parallel_safe: true

brief:
  path: docs/docs/development/05-content/CONTENT_EXECUTION_BRIEF.md

entry_gates:
  - name: CONTENT_DESIGN_GATE
    required: PASS
  - name: OPERATIONS_GATE
    required: PASS

depends_on:
  - OPERATIONS-BACKEND

conflicts_with:
  - CONTENT-BACKEND

owned_paths:
  - apps/backend/src/modules/content/**
  - apps/backend/test/content/**

shared_paths:
  - apps/backend/src/bootstrap/**
  - apps/backend/src/http/**

exclusive_paths: []

allowed_paths:
  - apps/backend/**
  - docs/docs/development/05-content/**
  - docs/docs/development/workflow/tasks/CONTENT-BACKEND.yaml
  - docs/docs/development/workflow/events/**
  - docs/docs/development/workflow/claims/CONTENT-BACKEND.md

forbidden_paths:
  - database/v2/migrations/0400_content.sql
  - apps/admin/**
  - apps/mobile/**

required_sources:
  - docs/docs/development/MASTER_DEVELOPMENT_PLAN.md
  - docs/docs/development/05-content/CONTENT_PUBLIC_CONTRACTS.md
  - docs/docs/development/04-operations/OPERATIONS_PUBLIC_CONTRACTS.md

dependency_snapshot: []

expected_gate:
  name: CONTENT_GATE
  pass_value: PASS

on_pass:
  unlock_candidates:
    - CONTENT-ADMIN
    - LEARNING-BACKEND
    - AUDIO-BACKEND

on_fail:
  recovery_task_pattern: CONTENT-BACKEND-RECOVERY
  block_dependents: true

final_report:
  path: docs/docs/development/05-content/CONTENT_IMPLEMENTATION_REPORT.md
```

## 2. 必填字段

### `task_id`

全局唯一、稳定、可读。

推荐：

```text
<DOMAIN>-<TRACK>
<DOMAIN>-<TRACK>-<STAGE>
<DOMAIN>-<TRACK>-RECOVERY
```

例如：

```text
PLATFORM-ADMIN-STAGE-B
CONTENT-BACKEND
AUDIO-DESIGN-RECOVERY
SOCIAL-DESIGN
```

### `role`

必须是 `ROLE_MODEL.md` 中正式角色之一。

### `domain`

当前 Task 的主要 Domain；全局任务可使用 `workflow` / `integration` / `release`。

### `track`

推荐枚举：

```text
design
backend
admin
client
recovery
reconciliation
workflow
integration
validation
release
```

### `status`

推荐枚举：

```text
planned
ready
active
validating
blocked
recovery_required
complete
cancelled
```

## 3. Entry Gate

`entry_gates` 是实施权限，不是提示信息。

如果任一 mandatory Gate 不满足：

```text
Task != READY
```

Design Task 可以按照 Master Plan 的 Parallel Rule 使用 frozen upstream contract 作为设计准入，但 Backend/Admin/Client 不得自行放宽 Gate。

## 4. `depends_on`

表达 Task 级依赖。

依赖 Task COMPLETE 不自动等价于依赖 Gate PASS；如果真正依赖的是 Gate，必须同时写进 `entry_gates`。

## 5. `conflicts_with`

表达即使路径不明显重叠，也不允许同时执行的 Task。

例如同一个后端实现 Task 的重复 Worker。

## 6. Path 权限

### `owned_paths`
当前 Task 自然所有区域。

### `shared_paths`
可能被其它 Task 修改，提交前必须 revalidate。

### `exclusive_paths`
有 active claim 时排它。

### `allowed_paths`
最大写入范围。

### `forbidden_paths`
硬禁止。

如果 Task 需要超出 `allowed_paths`：必须 STOP 并请求 scope change。

## 7. `required_sources`

列出新会话必须读取的关键上下文。

不能只列 Brief；应把 frozen contract、upstream public contract、必要 Gate/Report 明确列出。

## 8. `dependency_snapshot`

在 Worker 获得 claim 后填写当前关键依赖版本：

```yaml
dependency_snapshot:
  - name: OPERATIONS_GATE
    value: PASS
    observed_at_commit: abc123
  - path: docs/docs/development/05-content/CONTENT_PUBLIC_CONTRACTS.md
    sha: def456
```

Pre-Push 时重新校验。

## 9. `expected_gate`

当前 Task 最终必须关闭什么 Gate。

Design Task 示例：

```yaml
expected_gate:
  name: SOCIAL_DESIGN_GATE
  pass_value: PASS
```

Recovery Task 的 expected_gate 应仍然是“原 Gate”，而不是创造一个替代 Gate。

## 10. `on_pass`

仅表示候选解锁，不自动把任务改成 READY。

Dispatcher 必须重新计算这些 Task 的全部 entry gates / claims / conflicts。

## 11. `on_fail`

必须明确 Gate FAIL 路由。

推荐：

```yaml
on_fail:
  recovery_task_pattern: LEARNING-BACKEND-RECOVERY
  block_dependents: true
```

## 12. Manifest 不应该保存什么

禁止把以下内容作为权威状态塞进 Task Manifest：

- 大段聊天摘要；
- 未经 source 验证的推理；
- 密码/secret；
- “用户应该同意”的假设；
- 被 frozen source 否决的临时方案。

Task Manifest 应短小、机器可解析、可被新会话快速恢复。

## 13. Task Event

建议每次关键状态变化追加事件：

```text
workflow/events/<TASK_ID>-<timestamp>-<event>.md
```

事件可记录：

```text
CLAIMED
VALIDATION_STARTED
GATE_PASS
GATE_FAIL
BLOCKED
RECOVERY_REQUIRED
COMPLETED
RELEASED
```

Event 是追加式事实，不应通过改写旧事件伪造历史。
