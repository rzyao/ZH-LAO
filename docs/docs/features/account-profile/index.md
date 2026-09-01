---
feature_id: account-profile
title: 账户基础资料与学习方向
portfolio_status: active
domain:
- identity
mobile_pages: []
admin_pages: []
---

# 账户基础资料与学习方向

## 功能概览

本 Feature 面向用户自己的账户基础资料与学习方向。Identity 当前已经提供 BasicProfile 与固定 LearningProfile 的 Domain/Backend 能力，但仓库尚未为 `account-profile` 建立独立 Feature Stage/Gate，因此不能把 Domain 实现自动折算为本 Feature 的 Design、Backend 或 Mobile 已交付。

当前冻结语义中，首次注册可以设置学习方向，已有用户再次登录若提交冲突方向会返回 `LEARNING_DIRECTION_IMMUTABLE`；生产 API 只提供学习方向读取，没有修改学习方向的端点。
