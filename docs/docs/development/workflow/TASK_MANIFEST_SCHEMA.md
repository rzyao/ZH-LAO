---
status: active
last_updated: 2026-08-31
---

# Task Manifest Schema

每个可独立启动的 AI 工作项都必须拥有唯一 Task Manifest：

```text
docs/docs/development/workflow/tasks/<TASK_ID>.yaml
```

Task Manifest 是当前任务的执行身份证明，不是聊天摘要。

## 一、Track 与文档路径

ZH-LAO 当前实施 track：

```text
backend   → development/backend/<domain-or-capability>/
admin     → development/admin/<page-or-workflow>/
mobile    → development/mobile/<flow-or-screen-group>/
```

角色与 track 不是同一个概念：移动端仍由 `client_worker` 角色执行，但 Manifest 的 `track` 写 `mobile`。

其他控制类 track 可以使用：

```text
design
recovery
reconciliation
workflow
integration
validation
release
```

历史 Manifest 中的 `client` 或数字 Phase 路径不追溯修改；新的 Task 不再使用它们。

## 二、推荐结构

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
  path: docs/docs/development/backend/content/CONTENT_EXECUTION_BRIEF.md

implementation_blueprint:
  required: true
  path: docs/docs/development/backend/content/CONTENT_BACKEND_IMPLEMENTATION_BLUEPRINT.md
  base_commit: <40-char-sha>
  canonical_spec:
    adopted: false

entry_gates:
  - name: CONTENT_DESIGN_GATE
    required: PASS

depends_on: []
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
  - docs/docs/development/backend/content/**
  - docs/docs/development/workflow/tasks/CONTENT-BACKEND.yaml
  - docs/docs/development/workflow/events/**
  - docs/docs/development/workflow/claims/CONTENT-BACKEND.md

forbidden_paths:
  - database/v2/migrations/0400_content.sql
  - apps/admin/**
  - apps/mobile/**

required_sources:
  - docs/docs/development/SPEC_SYSTEM.md
  - docs/docs/domains/content/index.md
  - docs/docs/development/backend/content/CONTENT_PUBLIC_CONTRACTS.md

dependency_snapshot: []

expected_gate:
  name: CONTENT_BACKEND_GATE
  pass_value: PASS

on_pass:
  unlock_candidates:
    - CONTENT-ADMIN
    - LEARNING-BACKEND

on_fail:
  recovery_task_pattern: CONTENT-BACKEND-RECOVERY
  block_dependents: true

final_report:
  path: docs/docs/development/backend/content/CONTENT_IMPLEMENTATION_REPORT.md
```

示例 SHA 只能使用真实值；不得复制占位值到正式 Manifest。

## 三、必填语义

### `task_id`

全局唯一、稳定、可读。推荐：

```text
<DOMAIN>-BACKEND
<FEATURE>-ADMIN
<FEATURE>-MOBILE
<DOMAIN>-BACKEND-RECOVERY
```

### `role`

必须是 `ROLE_MODEL.md` 中正式角色。

### `domain`

填写主要 Domain。跨域/全局任务可以使用 `integration`、`workflow`、`release` 等明确值。

### `track`

新的产品实施任务优先：`backend | admin | mobile`。

Backend 按 Domain；Admin/Mobile 的 Task 名和 artifact path 按页面/工作流组织，即使它们消费多个 Domain。

### `status`

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

## 四、Entry Gate

`entry_gates` 是实施权限，不是提示信息。

任一 mandatory Gate 不满足：

```text
Task != READY
```

如果 `implementation_blueprint.required = true`，Blueprint 缺失、snapshot 无法验证或发生 material drift，也视为未具备安全实施条件。

## 五、依赖与并发

### `depends_on`

表达 Task 级依赖。Task COMPLETE 不自动等于 Gate PASS；真正依赖 Gate 时必须同时写入 `entry_gates`。

### `conflicts_with`

表达即使路径不明显重叠，也禁止同时执行的 Task。

### Path 权限

```text
owned_paths      当前 Task 自然所有区域
shared_paths     可被其他 Task 修改，提交前必须 revalidate
exclusive_paths  active claim 时排它
allowed_paths    最大允许写入范围
forbidden_paths  硬禁止
```

如果任务需要超出 `allowed_paths`，必须 STOP 请求 scope change。

Blueprint 只能进一步收紧 Manifest scope，不能扩大。

## 六、Track Path Rule

新 Task 的文档路径必须与 track 一致：

```text
backend task
→ docs/docs/development/backend/**

admin task
→ docs/docs/development/admin/**

mobile task
→ docs/docs/development/mobile/**
```

禁止新的 Admin Task 把 `*_ADMIN_*` 写进 Backend Domain 目录；禁止新的 Mobile Task 写入 Domain Backend 目录。

历史 `01-foundation`～`07-audio` 仅作为 legacy evidence source，可以出现在 `required_sources`，但不得作为新 Task 的输出目录。

## 七、`required_sources`

必须列出新会话真正需要读取的 authority：

- canonical Domain docs；
- frozen migration/ADR（适用时）；
- upstream Public Contract；
- Execution Brief；
- canonical spec（采用时）；
- Gate / Report dependency evidence。

Feature 文档可以作为端到端交付地图读取，但不能代替 Domain/Public Contract authority。

## 八、Implementation Blueprint

推荐结构：

```yaml
implementation_blueprint:
  required: true
  path: docs/docs/development/backend/learning/LEARNING_BACKEND_IMPLEMENTATION_BLUEPRINT.md
  base_commit: <40-char-sha>
  canonical_spec:
    adopted: true
    path: docs/docs/development/specs/learning.spec.json
    sha256: <64-char-sha256>
```

规则：

- `required: true` 时先验证 Blueprint，再修改代码；
- `base_commit` 必须与 Blueprint metadata 一致；
- adopted spec 必须绑定 path + SHA-256；
- Manifest 不复制 Blueprint 的伪代码和 Decision Budget；
- Manifest 可以更严格，不能更宽松。

采用策略：

```text
新的 executable-spec implementation Task      → required
实质 design/contract revision 后的 Task        → required
协议启用前已有 Task                            → 不追溯强制
显式升级的旧 Task                              → required
```

## 九、Drift Validation

第一处代码修改前比较：

```text
Blueprint base_commit
vs
latest main
```

发生变化时检查：

- Manifest / Brief / Blueprint；
- canonical spec / SHA；
- upstream contract；
- frozen migration / ADR / architecture authority；
- owned/shared/exclusive path；
- Blueprint target symbols。

结论只能是：

```text
DRIFT_REVALIDATED
REPOSITORY_DRIFT
```

material drift 必须 STOP。

## 十、Implementation Conflict

实现 Worker 遇到超出 Decision Budget 的问题时使用：

```text
SPEC_CONFLICT
IMPLEMENTATION_BLOCKER
REPOSITORY_DRIFT
```

不得通过改需求、改 Public Contract、改 frozen migration 或扩大 Task Scope 来继续主链。

## 十一、`expected_gate`

Task 必须声明自己最终关闭什么 Gate。

建议新 Gate 名明确 track：

```text
CONTENT_BACKEND_GATE
AUDIO_ADMIN_GATE
LOGIN_MOBILE_GATE
LOGIN_FEATURE_GATE   # Feature/E2E task 使用
```

Backend Gate 不自动代表 Feature Gate，Admin/Mobile Gate 也不能互相替代。

## 十二、`on_pass` / `on_fail`

`on_pass.unlock_candidates` 只是候选解锁，Dispatcher 必须重新计算依赖、Claim、冲突和 Blueprint requirement。

`on_fail` 必须路由最短合法 Recovery / Design Fix，并阻塞真正依赖当前 Gate 的下游 Task。

## 十三、Task Event

关键状态变化追加：

```text
workflow/events/<TASK_ID>-<timestamp>-<event>.md
```

推荐事件：

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

Event 是追加式事实，不改写旧事件伪造历史。
