---
status: integration-pending
last_updated: 2026-08-31
feature_id: login
feature_type: single-domain
primary_domain: identity
participating_domains: []
---

# 用户登录与会话

## 用户目标

App 用户能够建立自己的 Identity，会话恢复后进入已认证状态，并可以安全退出。

本 Feature 专指 **C 端 / Mobile 用户认证体验**，不代表 Admin Operator 登录。后台登录单独作为“后台登录与操作员认证” Feature 跟踪。

## 用户流程

当前领域设计支持的主要路径：

```text
需要账户能力
↓
手机号 OTP 或已支持的外部身份方式
↓
Identity 识别 / 创建用户身份
↓
建立 Session
↓
Mobile 保存和恢复会话
↓
进入已认证体验
```

手机号 OTP、Facebook、Session、Device 的 authoritative 业务流程见 [身份领域账户与会话流程](/domains/identity/flows)。

## 领域关系

| 角色 | 领域 | 本功能中的职责 |
| --- | --- | --- |
| 主要领域 | [身份（Identity）](/domains/identity/) | 认证身份、OTP、Session、Device 与会话生命周期 |

本 Feature 不创建第二份认证规则或 Session 状态机。

## Backend

- [Identity Backend 实施入口](/development/backend/identity/)
- 当前 Identity Backend 已存在实现和 Gate/Report 证据。

## Admin

`— 不适用`。

Admin 管理后台仍然需要登录，但属于独立的“后台登录与操作员认证” Feature，其认证主体、Operator Resolution 与 RBAC 会组合 Identity + Operations。

## Mobile

- [登录与认证流程实施入口](/development/mobile/auth/)
- Mobile Foundation 已具备 Auth/Session/Secure Storage 骨架，但真实 Identity API 集成仍待独立任务完成。

## 验收重点

最终 Feature Gate 至少应验证：

- 有效认证流程可以建立 Session；
- 无效/过期凭证被明确拒绝；
- App 重启后会话按契约恢复；
- Access/Refresh 凭证遵守安全存储边界；
- 单设备退出按契约撤销当前会话；
- 未认证状态不能伪装成已认证状态。

## 交付状态

| 轨道 | 当前状态 |
| --- | --- |
| Identity Domain | 已冻结主要领域事实 |
| Backend | 已有实现与验证证据 |
| Mobile | 真实 Identity 集成待完成 |
| Admin | 不适用 |
| E2E Feature Gate | 待完成 |

因此当前不能把“Identity Backend 已通过”解释成“用户登录功能已经完整交付”。
