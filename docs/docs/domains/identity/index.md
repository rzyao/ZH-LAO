---
status: frozen
last_updated: 2026-08-31
schema: identity
---

# Identity 域

Identity Domain 回答“平台用户是谁、如何认证与登录”，拥有用户主体、认证身份、基础资料、固定学习方向、OTP、Session 与 Device。

它不拥有社交资料、真人认证、会员与资产、学习进度、社交关系或聊天内容。

## 核心职责

- 建立稳定 User Root；
- 管理登录身份与认证主体；
- 保存基础资料与固定学习方向；
- 管理 OTP Challenge；
- 管理 Session 与 Device；
- 向其他领域提供稳定 logical/public user identity。

## V1 数据模型

Identity 固定 7 张业务表：

```text
users
auth_identities
basic_profiles
learning_profiles
otp_challenges
sessions
devices
```

跨 Domain 使用稳定 logical/public UUID；其他领域不得引用 Identity 的内部实现标识或内部表关系。

## 领域边界

| 能力 | Owner |
| --- | --- |
| 用户主体、认证、Session、Device | Identity |
| 社交公开资料与交友偏好 | Social |
| 真人认证 / Moderation / Enforcement | Trust & Safety |
| 用户学习进度与掌握状态 | Learning |
| 钱包、支付与虚拟资产 | Commerce |
| Conversation 与 Message | Chat |

## 文档地图

- [业务模型与边界](model.md)
- [账户与会话流程](flows.md)
- [数据设计](database.md)
