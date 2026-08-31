---
status: control-center
last_updated: 2026-08-31
---

# 开发流程控制中心

本页是开发控制面的导航与裁决入口，不复制每个 Domain / Feature 的详细进度和排期。

## 一、控制面入口

| 问题 | 查看 |
| --- | --- |
| 现在最应该启动什么 | [当前下一动作](workflow/NEXT_ACTIONS.md) |
| 某个 Domain 处于哪一步 | [领域生命周期矩阵](DOMAIN_LIFECYCLE_MATRIX.md) |
| 用户/运营功能是否真正交付 | [功能交付](/features/) |
| Backend 任务如何组织 | [后端开发](backend/) |
| Admin 页面如何组织 | [后台开发](admin/) |
| Mobile 页面如何组织 | [移动端开发](mobile/) |
| 详细证据和历史 | [开发进度记录](DEVELOPMENT_PROGRESS.md) |
| 新会话如何恢复角色、Task、Claim | [Workflow Control Plane](workflow/) |
| Spec / Blueprint 规则 | [Executable Spec System](SPEC_SYSTEM.md) |

动态调度只在 `workflow/NEXT_ACTIONS.md` 维护，避免多份全局页面互相漂移。

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
→ Task Manifest / Task Events
→ DEVELOPMENT_PROGRESS
→ NEXT_ACTIONS / Matrix / Control Center summary
```

## 三、开发轴

```text
Backend Track = Domain / Domain capability driven
Admin Track   = Page / Workbench / Operator Flow driven
Mobile Track  = Screen / User Flow / Journey driven
Feature       = cross-track delivery / E2E view
```

Backend、Admin、Mobile 的文档不得继续混在同一个数字 Phase 目录。

## 四、标准 Domain → Delivery 流程

```text
产品定义
→ 业务设计 / 状态机
→ 领域模型与数据设计
→ API / Public / Cross-domain / Event Contract
→ 安全 / 权限 / 事务 / 并发 / 幂等
→ DESIGN_GATE
→ Spec（采用时）
→ Execution Brief
→ Implementation Blueprint
→ Backend Implementation
→ BACKEND_GATE
        ↓
Admin / Mobile / Integration（按 Feature 需要并行）
        ↓
对应 Track Gate
        ↓
Feature E2E / Domain Acceptance
```

不能混用：

```text
DB_CONTRACT_FROZEN ≠ Backend Implemented
DESIGN_GATE PASS   ≠ Backend Verified
BACKEND_GATE PASS  ≠ Feature Delivered
ADMIN_GATE PASS    ≠ Mobile Complete
FEATURE_GATE PASS  ≠ Production Ready
```

## 五、Task 准入

Implementation Worker 开始代码修改前至少确认：

1. Task Manifest 存在；
2. Role / track 匹配；
3. Entry Gate 满足；
4. required sources 可读取；
5. dependency snapshot 有效；
6. Claim 不冲突；
7. Blueprint required 时 base/spec/authority snapshot 可验证；
8. 没有 material repository drift；
9. 输出文档路径符合 `backend | admin | mobile` track 规则。

## 六、并行规则

严格的是依赖链 Gate 顺序，不是整个项目一次只能做一个 Phase。

```text
Backend Worker
+ Admin Worker
+ Mobile(client_worker)
+ Design / Spec Compiler
+ Recovery / Audit Worker
```

只有依赖、路径、contract snapshot 与 Claim 都兼容时才允许并行。

## 七、Gate FAIL / Recovery / Drift

```text
ANY STATE
→ GATE_FAIL / SPEC_CONFLICT / IMPLEMENTATION_BLOCKER / REPOSITORY_DRIFT
→ RECOVERY_REQUIRED
→ Recovery / Design Fix / Revalidation
→ 重新运行原 Gate
```

当前 Gate `!= PASS` 时：

```text
dependent downstream = BLOCKED
shortest legal Recovery = PRIMARY
independent parallel-safe Task = 可继续
```

## 八、Grounding Gate

严重 finding 必须重新 grounding 到当前 `main`，给出 source path、exact heading/symbol/field、current commit、authority 交叉验证和可复现 evidence。

聊天上下文不是 authority。

## 九、全局视图维护

Worker 主要写自己的 Task 事实：Manifest、Event、Brief/Blueprint、Report、Gate、Claim release。

以下为派生视图，由 Dispatcher / Reconciliation 汇总：

```text
workflow/NEXT_ACTIONS.md
DOMAIN_LIFECYCLE_MATRIX.md
DEVELOPMENT_PROGRESS.md
DEVELOPMENT_CONTROL_CENTER.md
features/* delivery status
```

## 十、Production Readiness

Production Readiness 是系统级生命周期。只有 release-required Domain、Backend、Admin、Mobile、Feature/Integration 全部满足后，才进入全系统 E2E、性能、安全、可观测性、部署、备份恢复和正式发布门禁。
