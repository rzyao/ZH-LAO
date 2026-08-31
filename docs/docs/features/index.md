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

## 当前功能地图

| 功能 | 主要用户 | 主要领域 | 参与领域 | Backend | Admin | Mobile | 功能验收 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [登录与会话](login/index.md) | App 用户 | Identity | — | 已有后端实现与 Gate 证据 | 不适用 | 真实 Identity 集成待完成 | 待完成 |
| [音频生产](audio-production/index.md) | 运营人员 | Audio Production | Content、Operations | 设计完成，正式实现待推进 | 音频生产工作台待实施 | 非生产主入口 | 待完成 |

## Domain ↔ Feature

Feature 与 Domain 是二维关系，不是父子目录关系。

```text
Domain Capability
= 领域内部稳定能力

Product Feature
= 跨层交付切片
```

当前已经建立的关系：

| 领域 | 作为主要领域的功能 | 作为参与领域的功能 |
| --- | --- | --- |
| Identity | [登录与会话](login/) | — |
| Content | — | [音频生产](audio-production/) |
| Audio Production | [音频生产](audio-production/) | — |
| Operations | — | [音频生产](audio-production/) |

其它领域尚未建立正式 Feature 文档时，不为了目录完整提前制造占位功能。

以后新增功能应先确认它是否真的是一个**用户/运营结果**，而不是把某个表、接口或 Domain 换个名字放进 Feature。

## Feature 与 Domain 的区别

```text
Identity Domain
≠ 登录功能

Audio Production Domain
≠ 音频生产工作台页面
```

Domain 是长期事实边界；Feature 是跨层交付切片。

一个 Feature 可以跨多个 Domain，一个 Domain 也可以服务多个 Feature。

规范见 [功能文档规范](FEATURE_DOCUMENT_STANDARD.md)，双向关系模型见 [领域能力与产品功能关系模型](/domains/FEATURE_RELATIONSHIP_MODEL)。
