---
feature_id: user-appeal
title: 用户申诉
portfolio_status: active
domain:
- trust
- identity
mobile_pages: []
admin_pages: []
---

# 用户申诉

## 功能概览

Portfolio Status：`active`。

用户针对符合申诉条件的治理决定/处罚发起复核请求，canonical 事实写入 `trust.appeals`。数据库关系以 `appeal.decision_id` 指向 immutable Moderation Decision；申诉不会重写原 Decision，也不会直接修改原 Enforcement Action。申诉获准后的处罚调整必须通过 Enforcement 生命周期保留审计链。

本 Feature 只负责用户侧 **Appeal 提交与状态消费**；运营复核属于 `appeal-review` Feature。
