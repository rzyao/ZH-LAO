---
status: frozen
last_updated: 2026-08-30
---

# Identity 业务模型与边界

## 聚合拆分

```text
User
├─ AuthIdentity：phone / facebook
├─ BasicProfile：普通基础资料
├─ LearningProfile：固定学习方向
├─ Device：安装和设备
└─ Session：可撤销登录会话
```

User 只代表平台账户是否存在及账户状态，不能成为拥有 phone、Facebook ID、社交照片、位置、VIP、认证和学习进度的万能对象。

## 已冻结规则

- 游客不写入 `identity.users`；客户端本地生成 `installation_id` 并保存 UI locale。
- 只有注册时创建 User、AuthIdentity 和 LearningProfile；第一阶段不做游客云同步。
- 当前登录 Provider 为手机号和 Facebook；一个 User 可绑定多个 AuthIdentity。
- 手机号统一为 E.164，直接保存完整标准化号码，不拆存 `country_code + phone`。
- OTP 是临时认证挑战，不能存入 AuthIdentity，验证码只保存 hash。
- UI locale、native language、learning language 是三个不同语义。
- 学习方向注册时固定，只允许 `lo → zh` 或 `zh → lo`，当前不支持切换。
- `users.status` 只表达账户状态：`active`、`disabled`、`closed`。
- 禁止发动态、聊天、社交或关注属于 Trust & Safety 的 capability restriction，不进入 User Status。
- Access Token 可使用短期 JWT；Refresh Token 必须通过服务端 Session 可撤销。

## 被后续结论取代

早期 `users.status` 示例包含 `suspended`。后续冻结结论将临时/能力型限制移交 Trust & Safety，因此 `suspended` 为 `superseded`，不再属于 User Status。

## 延期项

- `platform.installations` 与游客服务端进度迁移：仅在需要游客云同步时评估。
- `identity.account_closures`：不是第一版必需表。
