---
feature_id: region-management
title: 产品支持地区管理
portfolio_status: active
domain:
- platform
- operations
mobile_pages: []
admin_pages: []
delivery_evidence:
- /development/03-platform/PLATFORM_DESIGN_AUDIT.md
- /development/03-platform/PLATFORM_IMPLEMENTATION_REPORT.md
---

# 产品支持地区管理

## 功能概览

Portfolio Status：`active`。

本 Feature 负责产品当前支持哪些 Region，以及 Region 的稳定 code、名称、默认 locale/timezone 与 active/retired 管理。权威事实见 [客户端与产品范围治理](/domains/platform/client-governance.md)。Platform Region 是产品 reference/control data；Identity 用户资料里的地区是 Identity-owned profile fact，两者不建立跨 Domain 物理 FK。
