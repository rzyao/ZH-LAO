---
feature_id: app-version-governance
title: 客户端版本检查与强制升级
portfolio_status: active
domain:
- platform
mobile_pages: []
admin_pages: []
delivery_evidence:
- /development/03-platform/PLATFORM_DESIGN_AUDIT.md
- /development/03-platform/PLATFORM_IMPLEMENTATION_REPORT.md
---

# 客户端版本检查与强制升级

## 功能概览

Portfolio Status：`active`。

本 Feature 负责客户端 build 的兼容与升级策略：服务端依据 Platform canonical `app_versions` 判断当前 build 是否已知、是否支持、是否存在更新及是否必须升级。权威事实见 [客户端与产品范围治理](/domains/platform/client-governance.md)。它不负责部署、发布渠道编排或应用商店运营。
