---
status: active
last_updated: 2026-08-31
---

# Task Manifest Schema

每个可独立启动的 AI 工作项都必须拥有唯一 Task Manifest：

```text
docs/docs/development/workflow/tasks/<TASK_ID>.yaml
```

Task Manifest 是新会话的“执行身份证明”，不是聊天摘要。对于采用 Implementation Blueprint 的 implementation Task，Manifest 还必须告诉 Worker：**哪一份 Blueprint 是当前代码级执行说明、它绑定哪个 base commit / spec snapshot，以及是否强制使用。**

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

implementation_blueprint:
  required: true
  path: docs/docs/development/05-content/CONTENT_BACKEND_IMPLEMENTATION_BLUEPRINT.md
  base_commit: 0123456789abcdef0123456789abcdef01234567
  canonical_spec:
    adopted: true
    path: docs/docs/development/specs/content.spec.json
    sha256: 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

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
  - docs/docs/development/SPEC_SYSTEM.md
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

> 上面的 commit/SHA 仅展示格式，真实 Manifest 必须写实际值，不得复制示例。

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

如果 `implementation_blueprint.required = true`，Blueprint 缺失、未 ready、snapshot 无法验证，也等价于 Task 不具备安全实施条件。

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

Blueprint 的 File Change Map 只能在 Manifest 的 path 权限内进一步收紧，不能扩大 Manifest scope。

## 7. `required_sources`

列出新会话必须读取的关键上下文。

不能只列 Brief；应把 frozen contract、upstream public contract、必要 Gate/Report 明确列出。

采用 Executable Spec / Blueprint 的 Task 应至少包含：

```text
docs/docs/development/SPEC_SYSTEM.md
Task Execution Brief
Blueprint
canonical spec（若 adopted）
相关 Public Contract / frozen authority
```

Blueprint path 本身可放在 `implementation_blueprint.path`，无需重复列出，但 Worker 的读取顺序必须包含它。

## 8. `implementation_blueprint`

这是 implementation Task 的代码级执行绑定。

推荐结构：

```yaml
implementation_blueprint:
  required: true
  path: docs/docs/development/06-learning/LEARNING_BACKEND_IMPLEMENTATION_BLUEPRINT.md
  base_commit: <40-char-sha>
  canonical_spec:
    adopted: true
    path: docs/docs/development/specs/learning.spec.json
    sha256: <64-char-sha256>
```

规则：

- `required: true` 时，Worker 必须先读取并验证 Blueprint，之后才能改代码。
- `base_commit` 必须与 Blueprint Metadata 一致。
- adopted Domain 必须保存 canonical spec path + SHA-256；未 adopted 时写 `adopted: false`，path/SHA 可省略或为 null。
- Manifest 不复制 Blueprint 的伪代码、Decision Budget 或测试矩阵；只引用它。
- Manifest 可以比 Blueprint 更严格，不能更宽松。

采用策略：

```text
New executable-spec implementation Task        → required: true
Task after material design/contract revision   → required: true
Pre-existing Task before this protocol         → no retroactive requirement
Explicitly upgraded existing Task              → required: true
```

因此升级本 Schema 不会自动阻断已经 READY/ACTIVE 的旧 Task。

## 9. Blueprint Snapshot / Drift Validation

Worker 获得 claim 后，第一处代码修改前必须比较：

```text
Blueprint base_commit
vs
latest main
```

如果相同：正常执行。

如果不同：检查 `base_commit..latest_main` 是否修改：

- Task Manifest；
- Blueprint；
- canonical spec / spec SHA；
- Design Gate / Execution Brief；
- owned/shared/exclusive paths；
- upstream public contracts；
- frozen migration / ADR / architecture authority；
- Blueprint 指向的关键 target symbols。

结论只能是：

```text
DRIFT_REVALIDATED   # 变化与 Blueprint 语义无关，可继续并记录
REPOSITORY_DRIFT    # 有实质影响，STOP
```

不得因为“改动看起来很小”跳过验证。

## 10. Decision Budget 的位置

`LOCKED / CONSTRAINED / FREE` 的详细内容保存在 Blueprint，不在 Manifest 重复维护。

优先级：

```text
Manifest path/scope restrictions
+ higher authority constraints
+ Blueprint Decision Budget
```

Implementation Worker 只能在三者共同允许的范围内工作。

## 11. `dependency_snapshot`

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

如果 Blueprint 已绑定同一个依赖 snapshot，Manifest 可以引用同一事实；不得维护两个冲突版本。

## 12. Implementation Conflict Status

采用 Blueprint 的实现 Worker 遇到超出其权限的问题时，Task Event / Final Report 必须使用以下状态之一：

```text
SPEC_CONFLICT
IMPLEMENTATION_BLOCKER
REPOSITORY_DRIFT
```

含义与处理方式以 `../SPEC_SYSTEM.md` 为准。

Worker 不得把这些状态写成普通 TODO 后继续主链。

## 13. `expected_gate`

当前 Task 最终必须关闭什么 Gate。

Design Task 示例：

```yaml
expected_gate:
  name: SOCIAL_DESIGN_GATE
  pass_value: PASS
```

Recovery Task 的 expected_gate 应仍然是“原 Gate”，而不是创造一个替代 Gate。

Blueprint ready 不是 Gate PASS，也不能替代 `expected_gate`。

## 14. `on_pass`

仅表示候选解锁，不自动把任务改成 READY。

Dispatcher 必须重新计算这些 Task 的全部 entry gates / claims / conflicts / Blueprint requirement。

## 15. `on_fail`

必须明确 Gate FAIL 路由。

推荐：

```yaml
on_fail:
  recovery_task_pattern: LEARNING-BACKEND-RECOVERY
  block_dependents: true
```

`SPEC_CONFLICT / IMPLEMENTATION_BLOCKER / REPOSITORY_DRIFT` 也应路由到最短合法 Design/Recovery/Revalidation Task，而不是让同一 Implementation Worker 自行扩大角色。

## 16. Manifest 不应该保存什么

禁止把以下内容作为权威状态塞进 Task Manifest：

- 大段聊天摘要；
- Blueprint 的整份伪代码副本；
- 未经 source 验证的推理；
- 密码/secret；
- “用户应该同意”的假设；
- 被 frozen source 否决的临时方案；
- Implementation Worker 临时发明的架构决策。

Task Manifest 应短小、机器可解析、可被新会话快速恢复。

## 17. Task Event

建议每次关键状态变化追加事件：

```text
workflow/events/<TASK_ID>-<timestamp>-<event>.md
```

事件可记录：

```text
CLAIMED
BLUEPRINT_VALIDATED
DRIFT_REVALIDATED
SPEC_CONFLICT
IMPLEMENTATION_BLOCKER
REPOSITORY_DRIFT
VALIDATION_STARTED
GATE_PASS
GATE_FAIL
BLOCKED
RECOVERY_REQUIRED
COMPLETED
RELEASED
```

Event 是追加式事实，不应通过改写旧事件伪造历史。
