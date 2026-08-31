---
status: active
last_updated: 2026-08-31
---

# 功能交付

Feature 表达**用户或运营人员能够完成的端到端能力**。

它是横向交付视图，不拥有第二份 Domain、API、数据库或状态机事实。

```text
Domain defines truth
        ↓
Backend exposes capability
        ↓
Admin / Mobile builds experience
        ↓
Feature E2E proves deliverable value
```

## 完整功能进度

完整 Feature Inventory 不再手工复制到本页，统一查看：

[AI 开发阶段矩阵](/development/DOMAIN_LIFECYCLE_MATRIX)

矩阵同时显示：

- 当前正式功能；
- 已识别但尚未启动的功能；
- 明确阻塞 / 待裁决的功能；
- 明确延期的功能；
- 每个 Feature 的 Design / Backend / Admin / Mobile / Integration / Acceptance AI Stage；
- 当前下一段可执行 Prompt。

这样功能数量增加后不会出现“Feature 首页、Domain 概览、开发矩阵各维护一套状态”的漂移。

## 已建立正式 Feature 文档

当前已经建立稳定 delivery 文档的 Feature：

| 功能 | 主要领域 | 当前交付重点 |
| --- | --- | --- |
| [用户登录与会话](login/index.md) | Identity | Mobile 真实 Identity 集成与 E2E |
| [音频生产](audio-production/index.md) | Audio Production | Audio Backend、Admin Workbench、跨层集成与 E2E |

其它已识别 Feature 先存在于 Feature Inventory / Matrix 中。只有正式进入 Feature Design 或已有稳定交付事实时才创建页面，禁止批量创建空白 Feature 文档。

## Domain ↔ Feature

Feature 与 Domain 是二维关系：

```text
Domain Capability
= 领域内部稳定能力

Product Feature
= 跨层交付切片
```

一个 Feature 可以跨多个 Domain，一个 Domain 也可以服务多个 Feature。

Feature Inventory 的 `primary_domain` 只表示主要业务协调领域，不改变任何 canonical ownership。

规范见 [功能文档规范](FEATURE_DOCUMENT_STANDARD.md)，双向关系模型见 [领域能力与产品功能关系模型](/domains/FEATURE_RELATIONSHIP_MODEL)。
