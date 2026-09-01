---
feature_id: runtime-config-management
title: 运行参数管理
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

# 运行参数管理

## 功能概览

Portfolio Status：`active`。

本 Feature 负责真正跨领域的 Platform Runtime Config **当前值**治理。权威事实来自 [Platform 运行控制](/domains/platform/runtime-control.md)。Runtime Config 不是万能 `system_settings`：key 必须进入代码注册表并具有明确 owner / type / visibility / validation / fallback；历史、版本与回滚属于独立且延期的 [运行配置版本与回滚](/features/runtime-config-history/)。
