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
→ Rebuild complete Product Feature Inventory
→ Discover Domain + Feature AI Stages
→ Build / repair Task Registry
→ Calculate READY / BLOCKED / ACTIVE / RECOVERY_REQUIRED
→ Rebuild AI_STAGE_REGISTRY.json
→ Validate AI 开发阶段矩阵
→ Generate context-free next-session prompts
→ Push main
→ STOP
```

## 2. 完全不依赖聊天上下文

假定之前聊天全部丢失。所有状态必须从当前 GitHub `main` 恢复；聊天、用户口述和 AI 记忆只能帮助定位 source，不能成为完成状态事实。

## 3. Mandatory Reads

至少读取：

```text
docs/docs/product/**
docs/docs/domains/**
docs/docs/features/**
docs/docs/governance/open-questions.md

docs/docs/development/DEVELOPMENT_CONTROL_CENTER.md
docs/docs/development/DEVELOPMENT_PROGRESS.md
docs/docs/development/workflow/index.md
docs/docs/development/workflow/AI_STAGE_MODEL.md
docs/docs/development/workflow/AI_STAGE_REGISTRY.json
docs/docs/development/workflow/FEATURE_INVENTORY.json
docs/docs/development/workflow/TASK_MANIFEST_SCHEMA.md
docs/docs/development/workflow/NEXT_ACTIONS.md

docs/docs/development/backend/**
docs/docs/development/admin/**
docs/docs/development/mobile/**
```

并审查当前代码、Gate、Report、CI 与 active claims。历史 `01-foundation`～`07-audio` 只作为 legacy evidence source。

## 4. Authority

产品/架构/领域事实：

```text
Frozen Migration
→ Accepted ADR / Frozen Architecture
→ canonical Product / Domain docs
→ upstream Public Contract
→ canonical executable spec（采用时）
→ Execution Brief
→ Implementation Blueprint
```

完成状态：

```text
Final Gate / Final Audit
→ Implementation Report
→ current code/tests/CI
→ Task Manifest / Event / Claim
→ DEVELOPMENT_PROGRESS
→ Registry / Matrix / Control views
```

Matrix、Registry 和 Feature Inventory 是派生控制视图，不能反向覆盖 authority。

## 5. Feature Inventory Bootstrap

每次 Bootstrap / Reconciliation 都必须重新检查是否出现新的产品能力，不能只扫描已有 `/features/` 目录。

Feature 来源至少包括：

```text
Product scope / rollout / business model
+
11 Domain capability & use case
+
Admin operator workflows
+
Mobile screen / user journey
+
明确 deferred
+
明确 designing / scope conflict
```

每个 Feature 必须声明：

```text
portfolio_status = active | planned | deferred | unresolved
```

规则：

- `active`：已有正式设计/实施/交付工作；
- `planned`：当前产品能力，但尚未形成 READY Task；
- `deferred`：仓库明确延期，矩阵必须继续显示 `⏸`；
- `unresolved`：产品范围与 Domain/Contract 需要裁决，必须显示 `⛔` 和明确 blocker。

禁止：

- 只因为某个 Feature 尚未启动就忽略它；
- 创建缺少功能定位、Domain、六个 Lane 和适用性说明的空白 Feature 文档；
- 把数据库表、Repository、Worker、缓存/索引当成 Feature；
- 把设计文档中的示例场景自动升级成产品承诺；
- 把明确 excluded 的能力重新加入当前范围。

Inventory 审计规则见 `FEATURE_INVENTORY_AUDIT.md` 与 `/features/FEATURE_DOCUMENT_STANDARD.md`。

## 6. AI Stage Discovery

```text
一段可独立复制的新会话 Prompt
→ 一次完整执行
→ 一个明确结果
→ Push
→ STOP
= 一个 AI Stage
```

Domain 通常识别：

```text
<DOMAIN>-DESIGN
<DOMAIN>-BACKEND-PREP
<DOMAIN>-BACKEND
<DOMAIN>-BACKEND-AUDIT
```

Feature 根据实际需要识别：

```text
<FEATURE>-FEATURE-DESIGN
<FEATURE>-ADMIN-DESIGN / ADMIN
<FEATURE>-MOBILE-DESIGN / MOBILE
<FEATURE>-INTEGRATION
<FEATURE>-ACCEPTANCE
```

不得为历史任务伪造当时不存在的 Stage。

## 7. Status Calculation

```text
✅ done       有充分 Gate / Audit / Report / code+CI 证据
▶ ready      Manifest READY + Entry Gate + Claim + Blueprint + drift 校验全部满足
⏳ active     存在真实 active Claim
○ todo       适用，但还没有 READY
⛔ blocked    有明确 task/gate/contract/decision blocker
🟣 recovery  当前合法下一步是 Recovery/Fix/Revalidation
⏸ deferred  明确延期
— na         不适用
```

只有 READY Stage 才允许显示 `▶`。

## 8. Registry 与 Task Manifest

重建：

```text
docs/docs/development/workflow/FEATURE_INVENTORY.json
docs/docs/development/workflow/AI_STAGE_REGISTRY.json
docs/docs/development/workflow/TASK_INDEX.md
docs/docs/development/workflow/NEXT_ACTIONS.md
docs/docs/development/workflow/tasks/*.yaml
```

新的可执行 Stage 必须有 Manifest，并使用 `matrix` 映射：

```yaml
matrix:
  object_type: domain | feature | system
  object_id: <id>
  lane: design | backend | admin | mobile | integration | acceptance
  sequence: <int>
  stage_id: <stable-id>
  label_zh: <中文名称>
  parent_object_id: <parent-or-null>
```

一个 Manifest 默认只代表一个 Stage。

## 9. Matrix

`DOMAIN_LIFECYCLE_MATRIX.md` 保留旧路径，但语义是 **AI 开发阶段矩阵**。

页面必须继续只显示一个表格。

执行：

```text
python scripts/generate_ai_stage_matrix.py --check
pnpm --dir docs docs:build
```

不得手工维护 Matrix 的 Feature 行状态；状态修改必须发生在 canonical Feature Page Frontmatter。System / Domain 汇总行继续读取 Stage Registry。生成器同时锁定矩阵树状 UI，禁止生成 Node Detail 页面。

## 10. NEXT_ACTIONS

固定输出：

```text
PRIMARY
PARALLEL SAFE
ACTIVE
BLOCKED
RECOVERY REQUIRED
NEXT CONVERSATION PROMPTS
```

每个 READY Stage 必须有一份完整、无聊天上下文 Prompt，包含 repository、branch、Task/Stage ID、role、latest-main revalidation、Claim、Entry Gate、required sources、Blueprint/drift、允许路径、Gate/Report 与 STOP 边界。

## 11. Concurrency

并行安全必须检查：

```text
dependency
conflicts_with
owned/shared/exclusive paths
public contract snapshot
Blueprint snapshot
active claims
```

严格的是同一依赖链的 Gate 顺序，不是整个项目只能串行推进一个 Phase。

## 12. No Business Work

Bootstrap 严禁直接执行业务 Design/Implementation。它只恢复并校准控制面、Feature Inventory、Task/Stage 调度和下一会话 Prompt。

## 13. Final Audit

完成前至少确认：

```text
AI_STAGE_REGISTRY_GROUNDED = YES
FEATURE_INVENTORY_RECONCILED = YES
PORTFOLIO_STATUS_COMPLETE = YES
DEFERRED_FEATURES_VISIBLE = YES
UNRESOLVED_FEATURES_HAVE_BLOCKER = YES
READY_STAGES_HAVE_MANIFEST = YES
BLOCKED_STAGES_HAVE_REASON = YES
ACTIVE_STAGES_HAVE_CLAIM = YES
LEGACY_STAGES_NOT_FABRICATED = YES
NEXT_PROMPTS_CONTEXT_FREE = YES
MATRIX_CHECK = PASS
DOCS_BUILD = PASS
BUSINESS_IMPLEMENTATION_CHANGES = 0
```

完成后推送 `main` 并 STOP，不自动启动任何 READY 业务 Stage。
