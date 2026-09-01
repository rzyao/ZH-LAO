---
feature_id: user-reporting
title: 用户举报提交
portfolio_status: active
domain:
- trust
- identity
- social
- chat
- commerce
mobile_pages: []
admin_pages: []
---

# 用户举报提交

## 功能概览

Portfolio Status：`active`。

用户从 Social / Chat / Commerce 等业务入口提交举报后，唯一 canonical 举报事实必须写入 `trust.reports`。`reason_code` 与 `description` 只表达举报者观点，不等于 Moderation Decision，也不等于任何 Enforcement 已成立。业务域只提供举报入口，不得自建第二套 report fact。

本 Feature 只负责 **Report 提交**；后续 `Moderation Case → Evidence → Decision → Enforcement Action → Appeal` 属于 Trust 治理链的后续能力。
