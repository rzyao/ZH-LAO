---
feature_id: runtime-config-history
title: 运行配置版本与回滚
portfolio_status: deferred
domain:
- platform
mobile_pages: []
admin_pages: []
---

# 运行配置版本与回滚

## 功能概览

Portfolio Status：`deferred`。

本 Feature 保存 Runtime Config 的历史、版本与回滚需求，但当前不在开发组合中。现行 [运行参数管理](/features/runtime-config-management/) 只拥有 `platform.runtime_configs` 的 current-state；V1 canonical design 明确没有 history / rollback / publish revision。`deferred` 不应改写成 实际 Stage / Gate `blocked`，也不能因为 current-state Backend 已完成就认定本 Feature 已设计或实现。
