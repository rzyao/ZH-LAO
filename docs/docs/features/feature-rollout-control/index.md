---
feature_id: feature-rollout-control
title: 功能开关与范围灰度管理
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

# 功能开关与范围灰度管理

## 功能概览

Portfolio Status：`active`。

本 Feature 负责 Platform 的 Feature Flag 定义、生命周期、运行时求值，以及 Region / Client / Region+Client 范围覆盖。权威产品事实来自 [Platform 运行控制](/domains/platform/runtime-control.md) 与 [Platform Domain](/domains/platform/)。V1 的范围灰度只覆盖冻结的范围模型；用户、分群、百分比、时间窗、版本表达式等高级策略属于 [高级灰度发布](/features/advanced-feature-rollout/)，不得回填到本 Feature。
