---
status: active
last_updated: 2026-09-02
---

# 开始参与开发

## 第一步：了解产品

先读[产品画像](product)、[用户旅程](journeys)和[能力地图](capabilities)，再进入对应 Feature Page。需要当前阶段时读[交付状态](delivery-status)。

## 按工作类型选择入口

| 工作 | 入口 |
| --- | --- |
| 产品或领域设计 | [产品文档](/developer/reference/product/product-overview)、[领域文档](/developer/reference/domains/)、[架构文档](/developer/reference/architecture/)、[ADR](/developer/reference/adr/) |
| 后端实现 | 对应 Domain authority、[Identity API 契约](reference/contracts/identity/IDENTITY_API.md)与代码/测试 |
| Admin 实现 | 页面/工作台规范、[Operations API 契约](reference/contracts/operations/OPERATIONS_API.md)与代码/测试 |
| Mobile 实现 | 用户流程、[迁移时基线](evidence/delivery-baseline)与代码/测试 |
| Feature 端到端验收 | [功能文档](./features/)、Gate / Report 与真实测试证据 |
| AI 执行规格 | 仓库根目录 `.specify/memory/constitution.md`（Spec Kit Constitution）与 `specs/` |
| 本地运行 | 仓库根目录 `README.md` 与各应用 README |

## Spec Kit 规则

Spec Kit 是当前 Feature Spec 工作流。执行具体变更前必须读取相关 canonical 文档、现有代码/schema/API/contract，并在发现冲突、漂移或实现阻塞时停止报告；Spec、任务勾选或规划文字本身不能证明实现完成。

旧自建 Executable Spec 文档已退役，只作 Git 历史参考；不得作为新任务入口。
