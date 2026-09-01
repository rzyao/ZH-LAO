---
status: control-center
last_updated: 2026-09-02
---

# 开发流程控制中心

本页是开发控制面的导航与裁决入口，不复制每个 Domain / Feature 的详细进度和排期。

## 一、控制面入口

| 问题 | 查看 |
| --- | --- |
| Domain / Feature 的交付状态与证据 | 各 Domain / Feature 文档、Task Manifest、Gate / Report |
| 现在真正允许启动什么 | [当前下一动作](workflow/NEXT_ACTIONS.md) |
| 一段 Prompt 如何成为可执行 Stage | Task Manifest 与对应 Brief / Gate / Report |
| 用户/运营功能是否真正交付 | [功能交付](/features/) |
| Backend 任务如何组织 | [后端开发](backend/) |
| Admin 页面如何组织 | [后台开发](admin/) |
| Mobile 页面如何组织 | [移动端开发](mobile/) |
| 详细证据和历史 | [开发进度记录](DEVELOPMENT_PROGRESS.md) |
| 新会话如何恢复角色、Task、Claim | [Workflow Control Plane](workflow/) |
| Spec / Blueprint 规则 | [Executable Spec System](SPEC_SYSTEM.md) |

动态调度只在 `workflow/NEXT_ACTIONS.md` 维护。

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

Feature Page 是端到端能力的人工维护交付地图；它不取代 Domain / Contract authority，也不维护固定交付状态矩阵。`FEATURE_PAGE_INDEX.json` 只派生 Feature 清单、领域归属、页面关联和证据线索。

### 完成状态

```text
Final Gate / Final Audit
→ Implementation Report
→ Current Code + Tests / CI Evidence
→ Task Manifest / Task Events / Claim
→ DEVELOPMENT_PROGRESS
→ AI_STAGE_REGISTRY
→ NEXT_ACTIONS / Control Center summary
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

Feature 按 `primary_domain` 归属组织：

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
2. `stage_id` 与当前 Prompt 一致；
3. Role / track / Stage 匹配；
4. Entry Gate 满足；
5. required sources 可读取；
6. dependency snapshot 有效；
7. Claim 不冲突；
8. Blueprint required 时 base/spec/authority snapshot 可验证；
9. 没有 material repository drift；
10. 输出文档路径符合 `backend | admin | mobile` track 规则。

Feature 行显示 Portfolio 状态、关联页面和真实证据；READY 等执行状态只来自 Task Manifest、Stage Registry 与 Gate / Report。System / Domain 汇总行可以显示 Registry 派生的概览状态。

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

Recovery 绑定原 Stage 或新建有明确 ID 的 Recovery Stage，不创建永久 Recovery 分类。

## 九、Grounding Gate

严重 finding 必须重新 grounding 到当前 `main`，给出 source path、exact heading/symbol/field、current commit、authority 交叉验证和可复现 evidence。

聊天上下文不是 authority。

## 十、全局视图维护

Worker 主要写自己的 Task 事实：Manifest、Event、Brief/Blueprint、Report、Gate、Claim release。

Dispatcher / Reconciliation 负责：

```text
Task / Gate / Claim / Feature Page Frontmatter
→ workflow/FEATURE_PAGE_INDEX.json
→ Feature Page / Task Manifest / Gate / Report
```

Feature 状态不在派生索引中手工维护；CI 使用 `validate_feature_pages.py` 防止 Feature Page 与派生索引发生数据漂移。

其它派生视图：

```text
workflow/NEXT_ACTIONS.md
DEVELOPMENT_PROGRESS.md
DEVELOPMENT_CONTROL_CENTER.md
features/* delivery status
```

## 十一、Production Readiness

Production Readiness 是系统级生命周期。只有 release-required Domain、Backend、Admin、Mobile、Feature/Integration 全部满足后，才进入全系统 E2E、性能、安全、可观测性、部署、备份恢复和正式发布门禁。
