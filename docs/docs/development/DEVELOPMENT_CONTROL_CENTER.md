---
status: control-center
last_updated: 2026-08-31
---

# 开发流程控制中心

本页是开发控制面的导航与裁决入口，不复制每个 Domain / Feature 的详细进度和排期。

## 一、控制面入口

| 问题 | 查看 |
| --- | --- |
| Domain / Feature 哪些 AI Stage 已完成、下一段 Prompt 是什么 | [AI 开发阶段矩阵](DOMAIN_LIFECYCLE_MATRIX.md) |
| 现在真正允许启动什么 | [当前下一动作](workflow/NEXT_ACTIONS.md) |
| 一段 Prompt 为什么算一个 Stage | [AI 开发阶段模型](workflow/AI_STAGE_MODEL.md) |
| 用户/运营功能是否真正交付 | [功能交付](/features/) |
| Backend 任务如何组织 | [后端开发](backend/) |
| Admin 页面如何组织 | [后台开发](admin/) |
| Mobile 页面如何组织 | [移动端开发](mobile/) |
| 详细证据和历史 | [开发进度记录](DEVELOPMENT_PROGRESS.md) |
| 新会话如何恢复角色、Task、Claim | [Workflow Control Plane](workflow/) |
| Spec / Blueprint 规则 | [Executable Spec System](SPEC_SYSTEM.md) |

动态调度只在 `workflow/NEXT_ACTIONS.md` 维护。AI Stage Matrix 是派生可视化，不成为第二份调度事实源。

## 二、Source of Truth

### 产品 / 架构 / 领域事实

```text
Frozen Physical Migration（涉及物理 DB 时）
→ Accepted ADR / Frozen Architecture Contract
→ Canonical Product / Domain Docs
→ Upstream Frozen Public Contracts
→ Canonical Executable Spec（已采用时）
→ Execution Brief
→ Implementation Blueprint
```

Feature 是 derived delivery view，不插入上述 authority 链。

### 完成状态

```text
Final Gate / Final Audit
→ Implementation Report
→ Current Code + Tests / CI Evidence
→ Task Manifest / Task Events / Claim
→ DEVELOPMENT_PROGRESS
→ AI_STAGE_REGISTRY
→ Matrix / NEXT_ACTIONS / Control Center summary
```

## 三、开发轴

```text
Backend Track = Domain / Domain capability driven
Admin Track   = Page / Workbench / Operator Flow driven
Mobile Track  = Screen / User Flow / Journey driven
Feature       = cross-track delivery / E2E view
```

真正交给 AI 执行时，以上工作再拆成 Stage：

```text
一段完整 Prompt
→ 一个 Task Manifest + Stage ID
→ 明确输入/输出
→ Push
→ STOP
```

需要两次独立会话的工作必须显示为两个 Stage。

## 四、典型 Domain Stage 链

```text
<DOMAIN>-DESIGN
→ DESIGN_GATE
→ <DOMAIN>-BACKEND-PREP
→ IMPLEMENTATION_READY
→ <DOMAIN>-BACKEND
→ <DOMAIN>-BACKEND-AUDIT
→ BACKEND_GATE
```

历史任务遵守非追溯原则，不补造过去不存在的 Prep / Blueprint / Audit Stage。

## 五、典型 Feature Stage 链

Feature 在 AI Matrix 中显示在 `primary_domain` 下方：

```text
<FEATURE>-FEATURE-DESIGN
      ↓
Backend dependency
      ↓
Admin Design / Admin Implementation
和/或
Mobile Design / Mobile Implementation
      ↓
<FEATURE>-INTEGRATION
      ↓
<FEATURE>-ACCEPTANCE
```

Admin 和 Mobile 可以在依赖与路径安全时并行。

不能混用：

```text
DB_CONTRACT_FROZEN ≠ Backend Implemented
DESIGN_GATE PASS   ≠ Backend Verified
BACKEND_GATE PASS  ≠ Feature Delivered
ADMIN_GATE PASS    ≠ Mobile Complete
FEATURE_GATE PASS  ≠ Production Ready
```

## 六、Task 准入

Implementation Worker 开始代码修改前至少确认：

1. Task Manifest 存在；
2. `matrix.stage_id` 与当前 Prompt 一致；
3. Role / track / Matrix Lane 匹配；
4. Entry Gate 满足；
5. required sources 可读取；
6. dependency snapshot 有效；
7. Claim 不冲突；
8. Blueprint required 时 base/spec/authority snapshot 可验证；
9. 没有 material repository drift；
10. 输出文档路径符合 `backend | admin | mobile` track 规则。

Feature 行显示 Feature Page 人工裁决的 Lane 状态；READY 等 Stage 细节只在 Feature Page 对应模块和 Task Manifest 中展示。System / Domain 汇总行仍可显示 Registry 派生的 Stage 状态。

## 七、并行规则

严格的是依赖链 Gate 顺序，不是整个项目一次只能做一个 Phase。

```text
Backend Worker
+ Admin Worker
+ Mobile(client_worker)
+ Design / Spec Compiler
+ Recovery / Audit Worker
```

只有依赖、路径、contract snapshot 与 Claim 都兼容时才允许并行。

## 八、Gate FAIL / Recovery / Drift

```text
ANY STAGE
→ GATE_FAIL / SPEC_CONFLICT / IMPLEMENTATION_BLOCKER / REPOSITORY_DRIFT
→ RECOVERY_REQUIRED
→ Recovery / Design Fix / Revalidation Stage
→ 重新运行原 Gate
```

Recovery 显示在原来的 Lane，不创建永久 Recovery 列。

## 九、Grounding Gate

严重 finding 必须重新 grounding 到当前 `main`，给出 source path、exact heading/symbol/field、current commit、authority 交叉验证和可复现 evidence。

聊天上下文不是 authority。

## 十、全局视图维护

Worker 主要写自己的 Task 事实：Manifest、Event、Brief/Blueprint、Report、Gate、Claim release。

Dispatcher / Reconciliation 负责：

```text
Task / Gate / Claim / Feature Page Frontmatter
→ workflow/FEATURE_PAGE_INDEX.json
→ scripts/generate_ai_stage_matrix.py
→ DOMAIN_LIFECYCLE_MATRIX.md
```

Feature 行状态不允许在 Matrix 手工维护；CI 使用 `generate_ai_stage_matrix.py --check` 同时防止数据漂移、Node 页面回归和冻结 UI 变化。System / Domain 汇总行仍读取 `AI_STAGE_REGISTRY.json`。

其它派生视图：

```text
workflow/NEXT_ACTIONS.md
DEVELOPMENT_PROGRESS.md
DEVELOPMENT_CONTROL_CENTER.md
features/* delivery status
```

## 十一、Production Readiness

Production Readiness 是系统级生命周期。只有 release-required Domain、Backend、Admin、Mobile、Feature/Integration 全部满足后，才进入全系统 E2E、性能、安全、可观测性、部署、备份恢复和正式发布门禁。
