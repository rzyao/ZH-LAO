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

从 AI Stage 协议启用后，**一个 Task Manifest 默认只代表一段可以独立复制执行并在结束后 STOP 的 Prompt Stage**。详细定义见 [AI 开发阶段模型](AI_STAGE_MODEL.md)。

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
acceptance
release
```

历史 Manifest 中的 `client` 或数字 Phase 路径不追溯修改；新的 Task 不再使用它们。

## 二、推荐结构

```yaml
task_id: CONTENT-BACKEND-PREP
version: 1

role: design_worker
domain: content
track: backend

matrix:
  object_type: domain
  object_id: content
  lane: backend
  sequence: 20
  stage_id: CONTENT-BACKEND-PREP
  label_zh: 后端实现准备
  parent_object_id: null

status: ready
priority: primary
parallel_safe: true

brief:
  path: docs/docs/development/backend/content/CONTENT_BACKEND_PREP_BRIEF.md

implementation_blueprint:
  required: false

entry_gates:
  - name: CONTENT_DESIGN_GATE
    required: PASS

depends_on: []
conflicts_with:
  - CONTENT-BACKEND-PREP

owned_paths:
  - docs/docs/development/backend/content/**

shared_paths: []
exclusive_paths: []

allowed_paths:
  - docs/docs/development/backend/content/**
  - docs/docs/development/workflow/tasks/CONTENT-BACKEND-PREP.yaml
  - docs/docs/development/workflow/events/**

forbidden_paths:
  - database/v2/migrations/0400_content.sql
  - apps/admin/**
  - apps/mobile/**

required_sources:
  - docs/docs/development/SPEC_SYSTEM.md
  - docs/docs/development/workflow/AI_STAGE_MODEL.md
  - docs/docs/domains/content/index.md

dependency_snapshot: []

expected_gate:
  name: CONTENT_IMPLEMENTATION_READY
  pass_value: PASS

on_pass:
  unlock_candidates:
    - CONTENT-BACKEND

on_fail:
  recovery_task_pattern: CONTENT-BACKEND-PREP-RECOVERY
  block_dependents: true

final_report:
  path: docs/docs/development/backend/content/CONTENT_BACKEND_PREP_REPORT.md
```

示例 SHA 只能使用真实值；不得复制占位值到正式 Manifest。

## 三、必填语义

### `task_id`

全局唯一、稳定、可读。推荐直接等于 `matrix.stage_id`：

```text
<DOMAIN>-DESIGN
<DOMAIN>-BACKEND-PREP
<DOMAIN>-BACKEND
<DOMAIN>-BACKEND-AUDIT
<FEATURE>-ADMIN-DESIGN
<FEATURE>-ADMIN
<FEATURE>-MOBILE-DESIGN
<FEATURE>-MOBILE
<FEATURE>-INTEGRATION
<FEATURE>-ACCEPTANCE
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

## 四、`matrix`：AI Stage 映射

所有新 Task 必填。

```yaml
matrix:
  object_type: domain | feature | system
  object_id: content
  lane: design | backend | admin | mobile | integration | acceptance
  sequence: 20
  stage_id: CONTENT-BACKEND-PREP
  label_zh: 后端实现准备
  parent_object_id: null
```

字段：

- `object_type`：矩阵对象类型；
- `object_id`：稳定 Domain / Feature / System ID；
- `lane`：该 Prompt Stage 在矩阵中的工作轨；
- `sequence`：同对象、同 Lane 内顺序；
- `stage_id`：稳定 Stage ID；
- `label_zh`：面向人的中文名称；
- `parent_object_id`：Feature 填 `primary_domain`，Domain 通常为 `null`。

Recovery Task 的 `track` 可以是 `recovery`，但 `matrix.lane` 必须回到发生失败的原 Lane。例如 Backend Recovery 仍显示在 `backend`。

Task status 映射：

| Task Status | Matrix |
| --- | --- |
| `complete` | `done` / ✅ |
| `ready` | `ready` / ▶ |
| `active`、`validating` | `active` / ⏳ |
| `planned` | `todo` / ○ |
| `blocked` | `blocked` / ⛔ |
| `recovery_required` | `recovery` / 🟣 |

不适用的 Lane 不创建 Task，由派生 Registry 显示 `—`。

## 五、Entry Gate

`entry_gates` 是实施权限，不是提示信息。

任一 mandatory Gate 不满足：

```text
Task != READY
```

如果 `implementation_blueprint.required = true`，Blueprint 缺失、snapshot 无法验证或发生 material drift，也视为未具备安全实施条件。

因此 Matrix 中的 `▶` 只能来自真实 READY Manifest，不能手工指定。

## 六、依赖与并发

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

## 七、Track Path Rule

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

## 八、`required_sources`

必须列出新会话真正需要读取的 authority：

- canonical Domain docs；
- frozen migration/ADR（适用时）；
- upstream Public Contract；
- Execution Brief；
- canonical spec（采用时）；
- Gate / Report dependency evidence；
- `AI_STAGE_MODEL.md`。

Feature Task 还必须读取对应 `/features/<feature>/` 和参与 Domain authority。

## 九、Implementation Blueprint

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

## 十、Drift Validation

第一处代码修改前比较：

```text
Blueprint base_commit
vs
latest main
```

发生变化时检查 Manifest / Brief / Blueprint、canonical spec / SHA、upstream contract、frozen migration / ADR / architecture authority、owned/shared/exclusive path 和 Blueprint target symbols。

结论只能是：

```text
DRIFT_REVALIDATED
REPOSITORY_DRIFT
```

material drift 必须 STOP。

## 十一、Implementation Conflict

实现 Worker 遇到超出 Decision Budget 的问题时使用：

```text
SPEC_CONFLICT
IMPLEMENTATION_BLOCKER
REPOSITORY_DRIFT
```

不得通过改需求、改 Public Contract、改 frozen migration 或扩大 Task Scope 来继续主链。

## 十二、`expected_gate`

Task 必须声明自己最终关闭什么可客观验证的结果。

建议：

```text
CONTENT_DESIGN_GATE
CONTENT_IMPLEMENTATION_READY
CONTENT_BACKEND_GATE
AUDIO_ADMIN_GATE
LOGIN_MOBILE_GATE
LOGIN_FEATURE_GATE
```

Backend Gate 不自动代表 Feature Gate，Admin/Mobile Gate 也不能互相替代。

## 十三、`on_pass` / `on_fail`

`on_pass.unlock_candidates` 只是候选解锁，Dispatcher 必须重新计算依赖、Claim、冲突和 Blueprint requirement。

`on_fail` 必须路由最短合法 Recovery / Design Fix，并阻塞真正依赖当前 Gate 的下游 Task。

## 十四、Task Event

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

## 十五、Stage Registry 与 Matrix

Task Manifest 是当前 Stage 的工作边界事实；`AI_STAGE_REGISTRY.json` 是 Dispatcher / Reconciliation 产生的派生快照。

```text
Task Manifest + Claim + Event + Gate + Report + Feature metadata
→ AI_STAGE_REGISTRY.json
→ scripts/generate_ai_stage_matrix.py
→ DOMAIN_LIFECYCLE_MATRIX.md
```

Worker 不得直接手工修改 Matrix 状态。

历史 Task 非追溯：允许 Registry 记录“后端实现（历史）”等已证实阶段，但不得伪造过去不存在的 Blueprint/Prep Task。
