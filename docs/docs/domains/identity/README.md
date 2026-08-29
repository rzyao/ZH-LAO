---
status: frozen
last_updated: 2026-08-30
source: 数据库域设计
---

# Identity 域

Identity 回答“这个平台用户是谁、如何认证与登录”，拥有 User Root、登录身份、基础资料、固定学习方向、OTP、Session 与 Device。

它不拥有社交资料、真人认证、会员、学习进度、Follow 或聊天；分别由 Social、Trust & Safety、Commerce、Learning 和 Messaging 管理。

- [业务模型与边界](model.md)
- [账户与会话流程](flows.md)
- [字段级数据库规格](database.md)

当前冻结表：`users`、`auth_identities`、`basic_profiles`、`learning_profiles`、`otp_challenges`、`sessions`、`devices`。
