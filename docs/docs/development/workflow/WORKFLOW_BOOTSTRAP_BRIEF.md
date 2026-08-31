---
status: ready
role: workflow_dispatcher
bootstrap_only: true
business_implementation: false
last_updated: 2026-08-31
---

# Workflow Control Plane Bootstrap Brief

本 Brief 用于第一次点火或重新校准 ZH-LAO 的仓库驱动 AI 多会话工作流。

本会话只建立/校准控制面，不执行任何 Domain 正式设计、Backend、Admin、Mobile 或 Feature Implementation。

## 1. Mission

```text
Repository Re-Audit
→ Recover actual current state
→ Discover Domain + Feature AI Stages
→ Build / repair Task Registry
→ Create task manifests
→ Define dependency graph
→ Establish claim/event structure
→ Calculate READY / BLOCKED / ACTIVE / RECOVERY_REQUIRED
→ Rebuild AI_STAGE_REGISTRY.json
→ Generate AI 开发阶段矩阵
→ Generate context-free next-session prompts
→ Run matrix/docs validation
→ Push main
→ STOP
```

## 2. Hard Rule：不依赖聊天上下文

假定：

```text
之前所有聊天都已经丢失
```

所有状态必须从当前 GitHub `main` 恢复。用户口述、AI 记忆和旧聊天只能帮助定位 source，不能直接成为状态事实。

## 3. Mandatory Reads

至少读取：

```text
docs/docs/development/DEVELOPMENT_CONTROL_CENTER.md
docs/docs/development/DOMAIN_LIFECYCLE_MATRIX.md
docs/docs/development/DEVELOPMENT_PROGRESS.md

docs/docs/development/workflow/index.md
docs/docs/development/workflow/AI_STAGE_MODEL.md
docs/docs/development/workflow/AI_STAGE_REGISTRY.json
docs/docs/development/workflow/ROLE_MODEL.md
docs/docs/development/workflow/SESSION_HANDOFF_CONTRACT.md
docs/docs/development/workflow/CONCURRENCY_RULES.md
docs/docs/development/workflow/TASK_MANIFEST_SCHEMA.md

docs/docs/features/index.md
docs/docs/domains/index.md
```

同时扫描最新：

```text
docs/docs/development/backend/**
docs/docs/development/admin/**
docs/docs/development/mobile/**
docs/docs/features/**
docs/docs/domains/**
```

历史 `01-foundation`～`07-audio` 只作为 legacy evidence source。

## 4. Authority

架构 / 数据库 / 产品事实：

```text
Frozen Migration
→ Accepted ADR / Frozen Architecture
→ canonical Domain docs
→ upstream Public Contract
→ canonical executable spec（adopted 时）
→ Execution Brief
→ Implementation Blueprint
```

完成状态：

```text
Final Gate / Final Audit
→ Implementation Report
→ current code/tests/CI evidence
→ Task Manifest / Event / Claim
→ DEVELOPMENT_PROGRESS
→ Stage Registry / Matrix / Control views
```

Matrix 和 Registry 是派生视图，不能反向覆盖更高 authority。

## 5. AI Stage Discovery

必须按 [AI_STAGE_MODEL.md](AI_STAGE_MODEL.md) 识别工作原子：

```text
一段可独立复制的新会话 Prompt
→ 一次完整执行
→ 一个明确结果
→ Push
→ STOP
= 一个 Stage
```

禁止把需要两次独立会话的工作压成一个格子。

例如：

```text
PLATFORM-ADMIN-STAGE-A
PLATFORM-ADMIN-STAGE-B
```

必须是两个 Stage。

Domain 默认重点识别：

```text
<DOMAIN>-DESIGN
<DOMAIN>-BACKEND-PREP
<DOMAIN>-BACKEND
<DOMAIN>-BACKEND-AUDIT
```

但不得为了模板完整伪造历史上不存在的 Stage。

Feature 默认重点识别：

```text
<FEATURE>-FEATURE-DESIGN
<FEATURE>-ADMIN-DESIGN
<FEATURE>-ADMIN
<FEATURE>-MOBILE-DESIGN
<FEATURE>-MOBILE
<FEATURE>-INTEGRATION
<FEATURE>-ACCEPTANCE
```

只建立实际需要的 Stage。

## 6. Domain / Feature Placement

Matrix 对象类型：

```text
system
domain
feature
```

Feature 必须读取 frontmatter：

```text
feature_id
primary_domain
participating_domains
```

Feature 只在 `primary_domain` 下显示一次；参与其它 Domain 不重复行。

Backend dependency 可以显示在 Feature 的 Backend Lane，但不能因此创建第二份 Domain implementation fact。

## 7. Build Task Registry

创建/修复：

```text
docs/docs/development/workflow/TASK_INDEX.md
docs/docs/development/workflow/NEXT_ACTIONS.md
docs/docs/development/workflow/tasks/*.yaml
docs/docs/development/workflow/events/*.md   # 仅需要时
```

每个新 Manifest 必须包含 `matrix`：

```yaml
matrix:
  object_type: domain | feature | system
  object_id: <id>
  lane: design | backend | admin | mobile | integration | acceptance
  sequence: <int>
  stage_id: <stable-id>
  label_zh: <中文名称>
  parent_object_id: <primary-domain-or-null>
```

一个 Manifest 默认只代表一个 Stage。

## 8. Status Calculation

### COMPLETE → `done` / ✅

只有更高优先级 Gate / Audit / Report / code+CI evidence 足够支持时才可完成。

### READY → `ready` / ▶

必须同时满足：

```text
Entry Gate satisfied
AND no conflicting active claim
AND no exclusive path collision
AND required source exists
AND Blueprint requirement satisfied
AND no material repository drift
```

只有 READY Stage 才允许在 Matrix 中显示 `▶`。

### ACTIVE → `active` / ⏳

只能来自真实 active Claim。

### PLANNED → `todo` / ○

适用且已识别，但未满足 READY。

### BLOCKED → `blocked` / ⛔

必须记录明确：

```text
blocked_by task
或 blocked_by Gate
或 blocked_by contract
或 blocked_by missing source
```

### RECOVERY_REQUIRED → `recovery` / 🟣

Gate FAIL、Spec Conflict、Implementation Blocker 或 material Drift 应优先路由 Recovery / Design Fix / Revalidation Stage。

## 9. Legacy Mapping

非追溯原则：

- 已有历史 Gate/Report 可以映射为 `done` Stage；
- 可以显示“后端实现（历史）”“数据模型定稿（历史）”；
- 不得补造当时不存在的 Blueprint、Prep、独立 Audit Stage；
- 历史“代码存在”但无 Gate/Report 时不能自动标 COMPLETE。

## 10. Stage Registry

Bootstrap 必须重建：

```text
docs/docs/development/workflow/AI_STAGE_REGISTRY.json
```

完成 Bootstrap 后：

```json
"snapshot_status": "grounded"
```

Registry 是派生快照，来源于 Task / Gate / Claim / Report / Feature metadata。

必须包含：

```text
object kind/id/label
feature parent / primary domain
各 Lane Stage
每个 Stage 的 id / label / status / href
blocked_by（适用时）
next stage
```

## 11. Generate Matrix

执行：

```text
python scripts/generate_ai_stage_matrix.py --write
python scripts/generate_ai_stage_matrix.py --check
```

`DOMAIN_LIFECYCLE_MATRIX.md` 的物理路径暂时保留，但显示语义为：

```text
AI 开发阶段矩阵
```

页面必须继续只显示一个表格，不追加说明正文。

禁止手工编辑 Matrix 状态；应修改 Task/Gate/Registry 后重新生成。

## 12. TASK_INDEX.md

至少：

| Task ID | Stage ID | Object | Lane | Role | Status | Gate | Dependencies | Claim | Brief |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

它是索引，不是最终事实源。

## 13. NEXT_ACTIONS.md

固定结构：

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

每个 READY Stage 都必须有一份完整、无上下文 Prompt。

Prompt 必须明确：

```text
repository / branch
Task ID + Stage ID
role
latest main revalidation
claim check
entry gate check
required sources
Blueprint validation（适用时）
allowed / forbidden paths
pre-push revalidation
expected Gate / Report
STOP boundary
```

## 14. Prompt Quality Gate

```text
NO_CHAT_CONTEXT_REQUIRED = YES
LATEST_MAIN_REVALIDATION = YES
TASK_ID_EXPLICIT = YES
STAGE_ID_EXPLICIT = YES
ROLE_DISCOVERABLE = YES
CLAIM_CHECK_REQUIRED = YES
ENTRY_GATE_CHECK_REQUIRED = YES
PRE_PUSH_REVALIDATION_REQUIRED = YES
GATE_FAIL_ROUTING_INCLUDED = YES
STOP_BOUNDARY_INCLUDED = YES
```

任一为 NO，不得把该 Prompt 标成 READY。

## 15. Concurrency

并行安全不靠凑数量，必须检查：

```text
dependency
conflicts_with
owned/shared/exclusive paths
public contract snapshot
Blueprint snapshot
active claims
```

Admin、Backend、Mobile、Design/Spec、Recovery/Audit 在依赖与路径安全时可并行。

## 16. No Business Work

Bootstrap 严禁：

- Domain 正式设计；
- Backend Implementation；
- Admin / Mobile Implementation；
- 新业务表；
- frozen migration rewrite；
- 新产品需求；
- 领取业务 Worker Claim。

它只恢复和建立控制面。

## 17. Final Audit

完成前确认：

```text
TASK_REGISTRY_EXISTS = YES
AI_STAGE_REGISTRY_GROUNDED = YES
DOMAIN_AND_FEATURE_ROWS_MAPPED = YES
READY_STAGES_GROUNDED = YES
BLOCKED_STAGES_HAVE_REASON = YES
ACTIVE_STAGES_HAVE_CLAIM = YES
LEGACY_STAGES_NOT_FABRICATED = YES
NEXT_PROMPTS_CONTEXT_FREE = YES
MATRIX_GENERATION_CHECK = PASS
BUSINESS_IMPLEMENTATION_CHANGES = 0
```

## 18. Final Response

报告：

```text
BOOTSTRAP RESULT
HEAD / COMMITS
CREATED / UPDATED TASKS
DOMAIN STAGES
FEATURE STAGES
READY
PARALLEL SAFE
ACTIVE
BLOCKED
RECOVERY REQUIRED
NEXT CONVERSATION PROMPTS
MATRIX CHECK
STOP
```

完成后直接推送 GitHub `main`，然后 STOP。不要自动启动任何 READY 业务 Stage。
