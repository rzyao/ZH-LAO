---
feature_id: guest-cloud-sync
title: 游客云同步与注册数据迁移
portfolio_status: deferred
domain:
- identity
mobile_pages: []
admin_pages: []
---

# 游客云同步与注册数据迁移

## 功能概览

本 Feature 的 canonical title 保持“游客云同步与注册数据迁移”，是否当前推进由独立的 `portfolio_status: deferred` 表达，不把“延期”写回标题或 实际 Stage / Gate。

Identity 当前允许未登录客户端携带 `installation_id`，并在注册/登录时绑定设备；但 canonical design、冻结 API 与最终审计都把服务端 `GuestDataMigration` 留在 deferred/not-supported 边界。设备绑定 **不等于** 游客云数据迁移，也没有证据表明游客学习/业务数据已在注册后自动合并到正式用户。
