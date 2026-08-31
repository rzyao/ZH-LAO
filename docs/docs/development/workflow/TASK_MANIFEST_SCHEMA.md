---
status: active
last_updated: 2026-08-31
---

# Task Manifest Schema

每个可独立启动的 AI Prompt Stage 必须拥有唯一 Task Manifest：

```text
docs/docs/development/workflow/tasks/<TASK_ID>.yaml
```

Task Manifest 是当前任务的执行身份证明：它定义 **谁执行、从哪里开始、允许改什么、必须读取什么、绑定哪个 Spec/Blueprint、最终关闭哪个 Gate**。它不是聊天摘要。

## 一、Track 与 AI Stage

ZH-LAO 新实施 track：

```text
backend   → development/backend/<domain-or-capability>/
admin     → development/admin/<page-or-workflow>/
mobile    → development/mobile/<flow-or-screen-group>/
```

控制类 track 可使用：

```text
design
recovery
reconciliation
workflow
integration
validation
acceptance
release
```

一个 Manifest 默认只代表一段可独立执行、Push、结束后 STOP 的 Prompt Stage。

## 二、推荐结构

```yaml
task_id: CONTENT-BACKEND
version: 1

role: backend_worker
domain: content
track: backend

status: ready
priority: primary
parallel_safe: false

brief:
  path: docs/docs/development/backend/content/CONTENT_BACKEND_EXECUTION_BRIEF.md

executable_spec:
  required: true
  scope_type: domain
  scope_id: content
  path: docs/docs/development/specs/domains/content.spec.json
  sha256: <real-64-char-sha256>

implementation_blueprint:
  required: true
  path: docs/docs/development/backend/content/CONTENT_BACKEND_IMPLEMENTATION_BLUEPRINT.md
  base_commit: <real-40-char-commit>
  canonical_spec:
    adopted: true
    scope_type: domain
    scope_id: content
    path: docs/docs/development/specs/domains/content.spec.json
    sha256: <real-64-char-sha256>

entry_gates:
  - name: CONTENT_IMPLEMENTATION_READY
    required: PASS

depends_on:
  - CONTENT-BACKEND-PREP
conflicts_with:
  - CONTENT-BACKEND

owned_paths:
  - apps/backend/src/modules/content/**
shared_paths:
  - apps/backend/src/main.ts
exclusive_paths: []

allowed_paths:
  - apps/backend/src/modules/content/**
  - apps/backend/test/**
  - apps/backend/src/main.ts
  - docs/docs/development/backend/content/**
  - docs/docs/development/specs/evidence/domains/content.evidence.json
  - docs/docs/development/workflow/**

forbidden_paths:
  - database/migrations/0400_content.sql
  - database/migrations/1240_content_revision.sql
  - apps/admin/**
  - apps/mobile/**

required_sources:
  - docs/docs/development/SPEC_SYSTEM.md
  - docs/docs/development/specs/domains/content.spec.json
  - docs/docs/development/backend/content/CONTENT_BACKEND_EXECUTION_BRIEF.md
  - docs/docs/development/backend/content/CONTENT_BACKEND_IMPLEMENTATION_BLUEPRINT.md
  - docs/docs/development/05-content/CONTENT_DESIGN_AUDIT.md
  - docs/docs/development/04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md

dependency_snapshot: []

expected_gate:
  name: CONTENT_BACKEND_GATE
  pass_value: PASS

on_pass:
  unlock_candidates: []

on_fail:
  recovery_task_pattern: CONTENT-BACKEND-RECOVERY
  block_dependents: true

final_report:
  path: docs/docs/development/backend/content/CONTENT_BACKEND_REPORT.md
```

正式 Manifest 中不得复制占位 SHA。

## 三、Executable Spec：新正式 Task 默认强制

从 [Executable Spec System](../SPEC_SYSTEM.md) 协议升级后：

```text
新的正式开发 Task = executable_spec.required: true
```

不再允许：

```yaml
implementation_blueprint:
  required: false
```

被 Implementation Worker 理解成“Spec 也可以不读”。Spec 与 Blueprint 是两种独立约束：Spec 定义 MUST BE TRUE，Blueprint 定义当前 snapshot 上 HOW TO IMPLEMENT。

正式 Spec 绑定：

```yaml
executable_spec:
  required: true
  scope_type: domain | feature | system
  scope_id: <stable-id>
  path: <canonical spec path>
  sha256: <real sha256>
```

### 允许的豁免

只有下面四类：

```yaml
executable_spec:
  required: false
  exemption: legacy_pre_spec | docs_only | private_refactor | recovery_no_semantic_change
  reason: <repository-grounded reason>
```

规则：

- `legacy_pre_spec`：协议启用前已经存在且本次无实质 design/contract revision；
- `docs_only`：纯文档整理，无 observable behavior change；
- `private_refactor`：私有重构，不改变 API/Public/DB/state/security/concurrency/cross-domain behavior；
- `recovery_no_semantic_change`：恢复已冻结行为，不改变 Requirement。

新产品行为、新 API、RBAC、安全、状态机、DB/cross-domain contract 变化都不能使用 exemption。

Manifest 缺 `executable_spec` 且 Task 属于新正式开发时：

```text
Task != READY
```

## 四、Entry Gate

`entry_gates` 是实施权限，不是提示信息。

任一 mandatory Gate 不满足：

```text
Task != READY
```

如果 Spec required：

- canonical path 必须存在；
- scope 必须已 adopted；
- SHA 必须与当前 canonical spec 一致；
- `python scripts/check_executable_specs.py --scope <type:id>` 必须可通过。

如果 Blueprint required：

- Blueprint 必须存在；
- base commit / spec SHA / authority snapshot 必须可验证；
- material repository drift 必须先处理。

## 六、Path 权限与并发

```text
owned_paths      当前 Task 自然所有区域
shared_paths     可并行修改，但提交前必须 revalidate
exclusive_paths  active claim 时排它
allowed_paths    最大允许写入范围
forbidden_paths  硬禁止
```

Blueprint 只能进一步收紧 Manifest scope，不能扩大。

Task 需要超出 `allowed_paths`：

```text
STOP → scope change / new Task
```

`depends_on` 表达 Task 依赖；Task COMPLETE 不自动等于 Gate PASS。真正依赖 Gate 时必须同时放入 `entry_gates`。

`conflicts_with` 表达即使路径不直接重叠，也禁止同时执行的 Task。

## 七、Track Path Rule

新的文档产物按 track 写入：

```text
backend → docs/docs/development/backend/**
admin   → docs/docs/development/admin/**
mobile  → docs/docs/development/mobile/**
```

历史 `01-foundation`～`07-audio` 可以作为 evidence / required source，但不再作为新 Task 输出目录。

## 八、`required_sources`

必须列出新会话真正需要读取的 authority：

- canonical Domain / Feature / System docs；
- canonical executable spec（required 时必须有）；
- frozen migration / ADR（适用时）；
- upstream Public Contract；
- Execution Brief；
- Implementation Blueprint（实现 Task）；
- dependency Gate / Report；

Feature Task 还必须读取对应 `/features/<feature>/` 与参与 Domain authority。

## 九、Implementation Blueprint

Implementation Task 默认：

```yaml
implementation_blueprint:
  required: true
  path: ...
  base_commit: <40-char-sha>
  canonical_spec:
    adopted: true
    scope_type: domain | feature | system
    scope_id: ...
    path: ...
    sha256: <64-char-sha256>
```

规则：

- 第一处代码修改前先验证 Blueprint snapshot；
- base commit 必须与 Blueprint metadata 一致；
- canonical spec path/SHA 必须与 Manifest `executable_spec` 一致；
- Manifest 不复制 Blueprint 伪代码或 Decision Budget；
- Manifest 可以更严格，不能更宽松。

Prep / Design Task 可以不要求“输入 Blueprint”，因为其职责可能就是创建 Blueprint；但只要它是新正式 Task，仍默认要求 Executable Spec，除非明确 exemption。

## 十、Drift Validation

第一处代码修改前比较：

```text
Blueprint base_commit
vs
latest main
```

检查：

```text
Manifest / Brief / Blueprint
canonical spec / SHA
upstream contract
frozen migration / ADR
owned/shared/exclusive paths
Blueprint target symbols
```

结论只能是：

```text
DRIFT_REVALIDATED
REPOSITORY_DRIFT
```

material drift 必须 STOP。

## 十一、Implementation Conflict

超出 Decision Budget 时使用：

```text
SPEC_CONFLICT
IMPLEMENTATION_BLOCKER
REPOSITORY_DRIFT
```

不得靠修改 Requirement、Public Contract、frozen migration 或扩大 Task scope 继续主链。

## 十二、Expected Gate 与 STOP

Task 必须声明自己最终关闭什么可客观验证的结果，例如：

```text
CONTENT_DESIGN_GATE
CONTENT_IMPLEMENTATION_READY
CONTENT_BACKEND_GATE
AUDIO_ADMIN_GATE
LOGIN_MOBILE_GATE
LOGIN_FEATURE_GATE
```

完成 expected Gate / Report / Push 后必须 STOP。Backend Gate 不等于 Feature Gate，Admin/Mobile Gate 也不能互相替代。
