---
status: active
last_updated: 2026-08-31
---

# 开发执行入口

开发区同时使用两种组织轴：

```text
Backend  = 领域驱动
Admin    = 页面 / 运营工作流驱动
Mobile   = 页面 / 用户流程驱动
Feature  = 跨层交付视图
```

真正交给 AI 执行时，再把这些工作拆成 **AI Stage**：一段完整 Prompt 能独立执行、产生明确结果、Push 并 STOP，就算一个 Stage。

## 一、先选择实施轨

| 任务类型 | 入口 | 组织主线 |
| --- | --- | --- |
| 后端领域能力 | [后端开发](backend/index.md) | Domain / capability |
| 管理后台 | [后台开发](admin/index.md) | Page / Workbench / Operator Flow |
| 移动端 | [移动端开发](mobile/index.md) | Screen / User Flow / Journey |
| 跨层功能验收 | [功能交付](../features/index.md) | User / Operator capability |

## 二、AI Stage 是真正的执行单位

```text
Domain / Feature / Page / Flow
        ↓
拆成一段段可独立启动的新会话 Prompt
        ↓
Task Manifest + Stage ID
        ↓
执行 → Gate / Report → Push → STOP
```

例如：

```text
CONTENT-DESIGN
CONTENT-BACKEND-PREP
CONTENT-BACKEND
CONTENT-BACKEND-AUDIT
```

是四个不同 Stage。

如果 Admin Stage A 与 Stage B 需要两个独立会话，也必须显示成两个 Stage，而不是合并成“后台进行中”。

正式协议见 [AI 开发阶段模型](workflow/AI_STAGE_MODEL.md)。

## 三、领域设计与后端

Domain 的典型链路：

```text
领域设计 Prompt
→ DESIGN_GATE
→ Backend Prep Prompt
→ IMPLEMENTATION_READY
→ Backend Implementation Prompt
→ Backend Independent Audit Prompt
→ BACKEND_GATE
```

一个设计 Prompt 内部可以同时完成产品语义、Use Case、Workflow、State Machine、Domain Model、Data、Contract、Reliability，只要它本来就是一个连续 AI 会话的职责。

因此这些不再各占 Matrix 一列。

## 四、Admin / Mobile

Admin 和 Mobile 不照抄 Domain 目录，而从体验出发：

```text
页面 / 用户流程设计 Stage
→ Implementation Stage
→ Integration / E2E Stage
```

一个页面可以消费多个 Domain；一个 Domain 也可以被多个页面消费。

## 五、Feature

Feature 负责把 Domain、Backend、Admin、Mobile 与 Infrastructure 串成端到端能力。

例如登录：

```text
Identity Domain
+ Identity Backend
+ Mobile Auth Design
+ Mobile Auth Implementation
+ Real API Integration
+ E2E Acceptance
```

例如音频生产：

```text
Content Backend
+ Audio Production Backend
+ Operations Backend
+ Admin Workbench
+ Integration
+ E2E Acceptance
```

Feature 行直接显示在 AI 开发阶段矩阵中，并挂在 `primary_domain` 下方。

## 六、任务启动核验

每段 Stage 启动前重新确认：

```text
latest main
Task Manifest + Stage ID
Entry Gate
required sources
Blueprint / base commit / spec SHA（适用时）
active claims
repository drift
```

核验不能重新发明产品设计。

## 七、控制面阅读顺序

1. [AI 开发阶段矩阵](DOMAIN_LIFECYCLE_MATRIX.md)
2. [当前下一动作](workflow/NEXT_ACTIONS.md)
3. [AI Stage 模型](workflow/AI_STAGE_MODEL.md)
4. [AI 多会话 Workflow](workflow/index.md)
5. [Task Manifest Schema](workflow/TASK_MANIFEST_SCHEMA.md)
6. [可执行规格系统](SPEC_SYSTEM.md)
7. [实现蓝图模板](IMPLEMENTATION_BLUEPRINT_TEMPLATE.md)
8. [开发流程控制中心](DEVELOPMENT_CONTROL_CENTER.md)
9. 当前 Stage Manifest 指向的 Brief / Blueprint / Gate / Report

## 八、Authority

| 工件 | 职责 |
| --- | --- |
| `domains/` | 当前领域事实 |
| `features/` | 人工维护的端到端 Feature Page 与交付地图 |
| Task Manifest | 当前 Prompt Stage 边界与路径权限 |
| Execution Brief | 当前 Stage 必须完成什么 |
| Executable Spec | machine-readable MUST BE TRUE |
| Implementation Blueprint | 当前 snapshot 上如何实现 |
| Gate / Audit / Report | 完成状态证据 |
| `AI_STAGE_REGISTRY.json` | derived Stage 快照 |
| AI Stage Matrix | derived 可视化与下一 Prompt 入口 |

## 九、并行

严格顺序约束的是同一依赖链的 Gate，不是整个项目只能串行推进一个 Phase。

不同 Lane 的 READY Stage 在依赖、路径、Claim 和 contract snapshot 不冲突时可以并行。

## 十、旧 Phase 目录

历史 `01-foundation`～`07-audio` 只保留既有证据和兼容引用。

新的实施工件必须写入：

```text
development/backend/**
development/admin/**
development/mobile/**
```

新的 Stage/Task 控制工件写入：

```text
development/workflow/**
```
