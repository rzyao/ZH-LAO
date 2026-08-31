---
status: active
last_updated: 2026-08-31
---

# 开发执行入口

开发区采用三条实施轴：

```text
Backend  = 领域驱动
Admin    = 页面 / 运营工作流驱动
Mobile   = 页面 / 用户流程驱动
```

Feature 不属于第四条代码轨。Feature 位于 [`/features/`](../features/index.md)，负责把三条实施轨与 Domain / Infrastructure 串成一个端到端可交付能力。

## 一、先选择实施轨

| 任务类型 | 入口 | 组织主线 |
| --- | --- | --- |
| 后端领域能力 | [后端开发](backend/index.md) | Domain / capability |
| 管理后台 | [后台开发](admin/index.md) | Page / Workbench / Operator Flow |
| 移动端 | [移动端开发](mobile/index.md) | Screen / User Flow / Journey |
| 跨层功能验收 | [功能交付](../features/index.md) | User / Operator capability |

## 二、任务启动核验

任务启动核验不属于 Domain 产品生命周期第一阶段。它只负责确认：

```text
latest main
当前 Task Manifest
authority / dependency snapshot
base commit / spec SHA
active claims
repository drift
当前应该从生命周期哪一步继续
```

它不能决定产品应该做什么、状态机是什么或数据库应该怎么设计。

## 三、领域设计与后端生命周期

```text
产品定义
↓
业务设计
  ├─ 用例
  ├─ 工作流
  └─ 状态机
↓
领域模型与事实边界
↓
数据设计
↓
API / Public / Cross-domain / Event Contract
↓
权限 / 安全 / 事务 / 并发 / 幂等 / 审计
↓
DESIGN_GATE
↓
Executable Spec（采用时）
↓
Execution Brief
↓
Implementation Blueprint
↓
Backend Implementation + Tests
↓
BACKEND VERIFICATION
```

Backend Verified 表示领域后端契约可以被消费者使用，不等于整个 Feature 已可交付。

## 四、Admin / Mobile 实施

Admin 和 Mobile 不照抄后端 Domain 目录，而从体验出发：

```text
页面 / 用户流程
↓
需要哪些 Backend/Public Contract
↓
页面状态与交互
↓
权限 / Loading / Empty / Error / Retry
↓
实现
↓
UI / Integration / E2E Evidence
```

同一个页面可以消费多个 Domain；同一个 Domain 也可以被多个页面消费。

## 五、Feature 交付

Feature Gate 只回答：

> 这个用户或运营功能是否已经从入口到最终结果真正可用？

例如登录功能可能组合：

```text
Identity Domain
+ Identity Backend
+ Mobile Auth Flow
+ Session Storage
+ E2E
```

音频生产功能可能组合：

```text
Content Contract
+ Audio Production Domain
+ Audio Backend
+ Admin Audio Workbench
+ Asset Infrastructure
+ E2E
```

Feature 只引用这些 authority，不复制它们。

## 六、控制面阅读顺序

1. [AI 多会话 Workflow](workflow/index.md)
2. [当前下一动作](workflow/NEXT_ACTIONS.md)
3. [可执行规格系统](SPEC_SYSTEM.md)
4. [实现蓝图模板](IMPLEMENTATION_BLUEPRINT_TEMPLATE.md)
5. [开发流程控制中心](DEVELOPMENT_CONTROL_CENTER.md)
6. [领域生命周期矩阵](DOMAIN_LIFECYCLE_MATRIX.md)
7. [开发进度记录](DEVELOPMENT_PROGRESS.md)
8. 当前 Task Manifest 指向的 Brief / Blueprint / Gate / Report / required sources

## 七、Authority

| 工件 | 职责 |
| --- | --- |
| `domains/` | 当前领域事实 |
| `features/` | derived 端到端交付地图 |
| Task Manifest | 当前任务边界与路径权限 |
| Execution Brief | 当前任务必须完成什么 |
| Executable Spec | machine-readable MUST BE TRUE |
| Implementation Blueprint | 当前 snapshot 上如何实现 |
| Gate / Audit / Report | 完成状态证据 |
| Matrix / Progress / Control Center | 派生控制视图 |

## 八、并行原则

严格顺序约束的是同一依赖链的 Gate，不是整个项目只能串行推进一个 Phase。

允许在依赖、路径、Claim 和 contract snapshot 都不冲突时并行：

```text
Backend Track
+ Admin Track
+ Mobile Track
+ Design / Spec Track
+ Recovery / Audit Track
```

## 九、旧 Phase 目录

历史 `01-foundation`～`07-audio` 只保留既有证据和兼容引用。从现在开始不得继续向这些目录创建新的 Brief、Blueprint、Report 或实施计划。

新的工件必须按 track 写入：

```text
development/backend/**
development/admin/**
development/mobile/**
```
