---
feature_id: mobile-home
title: 用户首页与双侧入口
portfolio_status: active
domain:
  - content
  - learning
  - social
  - platform
status:
  design: todo
  backend: todo
  admin: na
  mobile: todo
  integration: todo
  acceptance: todo
mobile_pages: []
admin_pages: []
---

# 用户首页与双侧入口

## 功能概览

Portfolio Status：`active`。

`mobile-home` 是当前正式 Feature 清单中的功能。Feature Inventory 记录其参与领域为 [Content](../../domains/content/index.md)、[Learning](../../domains/learning/index.md)、[Social](../../domains/social/index.md)、[Platform](../../domains/platform/index.md)，交付 surface 为 Mobile、集成与验收；当前各实施 Lane 尚未启动。

## 设计

状态：todo

范围：当前只确认“用户首页与双侧入口”的正式 Feature 身份与四个参与领域；尚未发现该 Feature 的用户首页信息架构、双侧入口规则或端到端流程已经形成 canonical 设计工件。

Stage / 工件 / Gate：未发现 `mobile-home` 专属 Design Stage、Design Brief、Blueprint 或 Gate。相关领域事实继续分别以 [Content](../../domains/content/index.md)、[Learning](../../domains/learning/index.md)、[Social](../../domains/social/index.md)、[Platform](../../domains/platform/index.md) 为准，本页不重定义它们。

下一步：从正式 Feature Design Stage 开始确定页面目标、入口关系与跨域消费边界；当前保持 `todo`，不提前设计。

## Backend

状态：todo

范围：当前没有 `mobile-home` 专属 Backend API、聚合 Contract 或实现报告。

Stage / 工件 / Gate：[Application Foundation Report](../../development/01-foundation/APPLICATION_FOUNDATION_REPORT.md) 明确 Foundation 未实现业务 Domain、无业务 handler；未发现本 Feature 的 Backend Stage、Execution Brief、Implementation Report 或 Gate。

下一步：设计冻结真实数据来源与调用边界后，再创建 Backend Stage；当前保持 `todo`。

## Admin

状态：na

范围：当前 Feature Inventory 未把 Admin 列为 `mobile-home` 的交付 surface；该 Feature 面向 Mobile 用户首页，不维护独立 Admin Lane。

Stage / 工件 / Gate：不适用；当前没有本 Feature 的 Admin Stage / Gate。

下一步：无。仅在 canonical Inventory 后续加入 Admin surface 时重新启用。

## Mobile

状态：todo

范围：Mobile Foundation 已提供导航、App Providers 与共享组件，但没有 `mobile-home` 的已完成业务页面；`mobile_pages` 当前为空。

Stage / 工件 / Gate：[Mobile Foundation Report](../../development/MOBILE_FOUNDATION_REPORT.md) 明确记录业务 Domain 屏幕延后、Real Domain APIs integrated = 0；Foundation Gate 只证明移动端基础设施可用，不能替代 `mobile-home` 的 Mobile Gate。

下一步：设计完成并具备真实 Contract 后，在现有 Mobile Foundation 上建立该 Feature 的 Mobile Stage 与页面证据；当前保持 `todo`。

## 集成

状态：todo

范围：Feature Inventory 已声明 Content、Learning、Social、Platform 参与，但当前没有 `mobile-home` 已完成的跨域集成工件或真实 Domain API 接入证据。

Stage / 工件 / Gate：[Mobile Foundation Report](../../development/MOBILE_FOUNDATION_REPORT.md) 的 Scope Audit 明确 Real Domain APIs integrated = 0；未发现本 Feature 的 Integration Brief、Implementation Report、Test Report 或 Gate。

下一步：待设计与各参与领域 Contract 明确后，再创建 Integration Stage 并逐项记录真实接口接入与失败路径；当前保持 `todo`。

## 验收

状态：todo

范围：当前没有 `mobile-home` 已实现的端到端范围可执行 Feature 验收。

Stage / 工件 / Gate：未发现本 Feature 的 Acceptance Stage、Test Report、Audit Report 或 Gate；`MOBILE_FOUNDATION_GATE = PASS` 仅证明 Foundation，不是用户首页 Feature Gate。

下一步：在设计、Mobile 与集成完成并形成真实证据后，再进入 Feature 验收；当前保持 `todo`。
