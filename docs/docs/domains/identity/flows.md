---
status: frozen
last_updated: 2026-08-30
---

# Identity 账户与会话流程

## 游客与注册

```text
首次打开 → 本地 installation_id → 选择 UI locale → 浏览学习
→ 需要账户能力 → 手机 OTP 或 Facebook → 创建 User
→ 创建 AuthIdentity → 选择固定学习方向 → 创建 LearningProfile
```

如未来游客产生服务端数据，注册事务之后执行 Guest Data Migration，把归属迁移到正式 `user_id`；该能力当前为 `deferred`。

## 手机号认证

```text
标准化为 E.164 → 创建 OTP Challenge → 校验 hash/过期时间/尝试次数
→ consumed_at 标记消费 → 创建或识别 phone AuthIdentity → 建立 Session
```

验证码不得明文保存，也不得复用已经消费或过期的 Challenge。

## Facebook 登录

验证 Facebook 提供的主体身份后，以 `(provider, provider_subject)` 唯一定位 AuthIdentity，再建立服务端 Session。具体 OAuth 流程和 token 校验为 `designing`。

## Session 操作

- **单设备退出：** 撤销该设备关联的 Session。
- **全部设备退出：** 撤销该 User 的全部有效 Session。
- **账户禁用/关闭：** 由应用服务批量撤销全部 Session。
- **查看登录设备：** 从 User → Device → Session 查询。
- **刷新访问令牌：** 校验 Refresh Token hash、Session 状态和到期时间后签发短期 Access Token。

具体 Session 状态值、Refresh Token 轮换策略和并发控制仍为字段级 `designing`。
