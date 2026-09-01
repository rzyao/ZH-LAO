---
feature_id: account-lifecycle
title: 账户禁用 / 关闭与会话撤销
portfolio_status: active
domain:
- identity
mobile_pages: []
admin_pages: []
---

# 账户禁用 / 关闭与会话撤销

## 功能概览

本 Feature 负责账户从 active/disabled/closed 状态变化到产品可执行的“禁用、恢复、关闭/注销”流程，以及状态变化与 Session 撤销之间的联动。Identity Domain 已实现并验证底层账户状态机，但当前冻结生产 HTTP **没有** `/me/disable`、`/me/enable`、`/me/close` 或 `DELETE /me`；因此底层 `IdentityState.changeStatus()` 不能被当作本 Feature 已交付。

`closed` 在当前 Domain 语义中是 terminal；状态转为 disabled/closed 会撤销该用户全部 Sessions。是否由用户自助、Operator 后台或其它正式入口触发，仍需由 Feature Design 明确。
