---
status: active
last_updated: 2026-09-02
---

# ZH-LAO 产品开发全景

这是面向产品负责人、开发者、运营筹备人员和项目接手者的统一阅读入口。它把现有产品事实、用户旅程、功能地图和开发证据组织在同一条路径上，但不取代任何底层事实源。

## 先看这里能得到什么

- [产品画像](product)：产品服务谁、解决什么问题、包含什么和不包含什么。
- [用户旅程](journeys)：从游客浏览到学习、社交准入、关系和交流的完整路径。
- [能力地图](capabilities)：按用户或运营人员能够完成的能力组织功能，而不是按数据库表组织。
- [交付状态](delivery-status)：当前阶段、功能状态、阻塞和证据入口。
- [系统地图](system-map)：产品能力与 Domain、Backend、Admin、Mobile 和基础设施的关系。
- [当前重点](current-focus)：当前可执行任务、并行任务和明确阻塞。
- [开始参与开发](getting-started)：按角色选择正确的文档、代码和 Spec Kit 入口。
- [开发者常见问题](faq)：运行前置条件、状态含义和冲突处理。
- [当前开发方式](development-workflow)：全景、Spec Kit、代码/测试/CI 的职责边界。
- [交付基线](evidence/delivery-baseline)：迁移时可验证基线与已知状态漂移。
- [阶段历史](evidence/history)：旧开发资料的归档范围与 Git 追溯方式。

## 当前画像与覆盖范围

当前全景包含 **103 个 Feature detail 页面**：Portfolio 为 active 80、deferred 17、pending_decision 6。功能按能力和主领域分组，完整规模与各层状态计数见[功能目录](features/)；机器可读清单位于 `docs/docs/developer/feature-catalog.json`。

目前只有两个页面完成了基于迁移时代码/测试基线的人工核验：[用户登录与会话](features/login)和[老挝语字母管理](features/lao-alphabet-management)。其余页面是迁移后的产品/范围记录，不能把页面存在、`active` 或 Spec Kit 状态当作实现或验收证据。分层数据维护遵循[文档契约](DOCUMENT_CONTRACT)：单层拿到新证据时增量更新 front matter `delivery_layers` 并重新生成目录，无需整页重写。

## 这份全景文档不是什么

它不是新的需求、API、数据库设计或任务授权来源。产品与技术细节仍以现有 canonical 文档为准；Spec Kit 工件只在需要执行具体变更时使用。具体规则见[文档契约](DOCUMENT_CONTRACT)。

## 权威阅读路线

```text
本页
  → 产品画像 / 用户旅程 / 能力地图
  → 对应 Feature Page
  → Domain、架构和数据库事实
  → Spec Kit、代码、测试与 Gate 证据
```

## 当前项目边界

ZH-LAO 是中文–老挝语综合学习与跨语言社交应用。学习负责获客与留存，社交负责关系形成，商业化主要围绕社交效率和虚拟礼物。首期以 Android 为重点平台；项目仍处于开发阶段，不能把全景中的“规划”理解为已发布能力。

这些基线来自[产品定位与范围](/developer/reference/product/product-overview)和[交付基线](evidence/delivery-baseline)。
