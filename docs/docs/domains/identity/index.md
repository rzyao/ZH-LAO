---
status: frozen
last_updated: 2026-08-31
schema: identity
---

# 身份（Identity）

Identity Domain 回答“平台用户是谁、如何认证与登录”，拥有用户主体、认证身份、基础资料、固定学习方向、OTP、Session 与 Device。

它不拥有社交资料、真人认证、会员与资产、学习进度、社交关系或聊天内容。

## 核心职责

- 建立稳定 User Root；
- 管理登录身份与认证主体；
- 保存基础资料与固定学习方向；
- 管理 OTP Challenge；
- 管理 Session 与 Device；
- 向其他领域提供稳定 logical/public user identity。

## 领域能力地图

Identity 当前提供的稳定业务能力包括：

```text
用户主体
├─ 创建 / 识别用户
├─ 基础资料
└─ 固定学习方向

认证
├─ 手机 OTP Challenge
├─ AuthIdentity 识别
└─ 外部身份接入边界

会话
├─ 创建 Session
├─ 刷新 Session
├─ 单设备退出
├─ 全设备退出
└─ Device / Session 查询与撤销
```

这些是 Identity 自身的 Domain Capability，不等于具体 Mobile 页面或端到端 Feature。

## 参与的产品功能

| 产品功能 | 关系 | Identity 职责 |
| --- | --- | --- |
| [登录与会话](/features/login/) | 主要领域 | 认证、OTP、Session、Device 与认证状态事实 |

Feature 只组织交付与 E2E 验收；认证规则和 Session 业务事实仍以 Identity 文档与契约为 authority。

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
- [登录与会话 Feature](/features/login/)
- [领域能力与产品功能关系模型](/domains/FEATURE_RELATIONSHIP_MODEL)
