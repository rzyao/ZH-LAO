---
status: frozen
last_updated: 2026-08-31
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
标准化为 E.164 → 创建 OTP Challenge → 校验 HMAC/过期时间/尝试次数
→ consumed_at 标记消费 → 创建或识别 phone AuthIdentity → 建立 Session
```

验证码不得明文保存，也不得复用已经消费或过期的 Challenge。

## Facebook 登录

Facebook 认证业务语义已经 `frozen`：

```text
Client 提交 opaque Facebook credential
→ Server-side FacebookCredentialVerifier 验证 credential
→ verifier 派生稳定 provider_subject
→ 以 (provider, provider_subject) 唯一解析/创建 AuthIdentity
→ 建立服务端 Session
```

Identity HTTP / application contract 不接受客户端直接提交 `provider_subject`，也不持久化原始 Facebook credential。

真实 Facebook provider adapter 仍属于 **Production Integration Debt**：正常 runtime 未配置可用 provider 时返回 `503 PROVIDER_UNAVAILABLE`，不得静默退化为 Fake verifier。Provider-specific OAuth transport / SDK 细节属于 adapter 集成，不再把 Identity Domain 的认证语义标记为 `designing`。

## Session 操作

- **单设备退出：** 撤销该设备关联的 Session。
- **全部设备退出：** 撤销该 User 的全部有效 Session。
- **账户禁用/关闭：** 与批量撤销全部 Session 保持冻结事务语义。
- **查看登录设备：** 从 User → Device → Session 查询。
- **刷新访问令牌：** 校验 Refresh Token hash、Session 状态和到期时间后轮换 Refresh Token，并签发短期 Access Token。

Session / Refresh Token 语义已经 `frozen`：

```text
Access Token = JWT，TTL 15 min
Refresh Token = opaque cryptographically-random token
Refresh Rotation = ALWAYS
Session TTL = 30-day sliding
raw refresh token = 不落库 / 不落日志 / 不进事件
同一旧 Refresh Token 并发刷新 = 成功恰好 1 个
被撤销/过期 Session = refresh rejected
```

因此 Refresh Token 轮换与并发控制不再是字段级 `designing`。后续未经正式 change protocol，不得以客户端实现便利为由改变上述 session semantics。
