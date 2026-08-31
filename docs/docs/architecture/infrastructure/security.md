---
status: baseline
last_updated: 2026-08-31
---

# 安全与权限

ZH-LAO 的安全模型按事实所有权拆分认证、后台授权、平台治理和业务状态校验，不由一个“万能权限模块”接管全部判断。

## 安全责任分层

| 能力 | 事实拥有者 | 主要职责 |
| --- | --- | --- |
| 用户认证 | 身份（Identity） | 登录身份、OTP、Session、Device、Access / Refresh Token、账号状态 |
| 后台操作者 | 运营（Operations） | Operator、Role、Permission、RBAC、后台操作审计 |
| 平台治理 | 信任与安全（Trust & Safety） | 举报、审核、证据、处罚、限制、申诉 |
| 业务授权 | 各业务领域 | 资源归属、业务状态、状态机前置条件与领域不变量 |
| 技术安全 | Shared Application / Infrastructure | Request ID、日志脱敏、错误封装、Secret Fail-Fast、HTTP 边界 |

## 认证不等于授权

典型请求需要多层裁决：

```text
Authentication
↓
Actor Resolution
↓
Platform / RBAC Permission
↓
Owner Domain Resource / State Rule
↓
Mutation
```

前端隐藏按钮只能改善体验，不能替代服务端授权。

## Identity 认证边界

当前 Identity 认证基线包括：

- 手机号 E.164 + OTP；
- Facebook Credential Adapter Boundary；
- JWT Access Token；
- Opaque Refresh Token；
- Refresh Rotation；
- Session；
- Device；
- `active / disabled / closed` 账号状态。

关键规则：

```text
Raw OTP 不落库、不进普通日志、不进事件
Raw Refresh Token 不落库、不进普通日志
Raw Credential 不持久化
Access Token 不做普通持久化
账号 disabled / closed 会撤销 Session
closed 为终态
```

生产 Secret 缺失或不满足要求时必须 Fail-Fast，不能静默使用开发默认值。

## Token 与客户端存储

移动端：

```text
Access Token  → Memory
Refresh Token → SecureStore
普通偏好      → AsyncStorage
```

后台管理端通过统一 API/Auth Boundary 使用认证信息，页面与组件禁止自行拼接认证 Header。

## Operations RBAC

后台权限使用 exact permission key：

```text
<domain>.<resource>.<action>
```

当前规则：

- 不支持 wildcard permission；
- V1 不引入 ABAC；
- disabled Operator 不授权；
- disabled Role 不参与 permission union；
- `super_admin` 不存在绕过 permission rows 的隐式后门；
- RBAC 不把 Redis / stale cache 当作事实源；
- 权限变更以后端当前数据库事实为准。

Operations 只能做授权和后台操作审计，不能越过 Owner Domain 修改其业务 Schema。

## 用户 Block 与平台处罚

必须区分：

```text
social_blocks
= 用户主动关系事实

trust.enforcement_actions
= 平台治理处罚事实
```

Discover、Follow、Chat 等业务动作可以同时消费 Social 和 Trust & Safety 的公开事实做最终业务判断，但两类 canonical fact 不合并。

## 跨领域安全边界

跨领域必须遵守：

- 只消费对方公开 Contract；
- 禁止跨领域 Repository Import；
- 禁止跨领域 SQL；
- 禁止跨领域 Physical FK；
- 使用稳定 Logical/Public UUID；
- 不暴露 Internal BIGINT；
- Hash、Token、Credential、Secret 不进入 Public Contract 或普通 Event Payload。

## HTTP 输入安全

HTTP Adapter 必须严格校验输入。

系统级原则包括：

- 拒绝 unknown field；
- 防止 mass assignment；
- 校验 public UUID / owner scope；
- 不接受客户端注入 provider subject；
- 不接受客户端注入 internal ID；
- Token/认证响应使用禁止缓存语义；
- PostgreSQL raw error、stack、secret 不返回客户端。

业务级 IDOR 防护必须由 Application Service 根据当前 Actor 和 Resource Ownership 执行。

## 错误与日志

统一错误和日志基础应保证：

```text
客户端得到稳定错误码
服务端保留 Request ID
内部 Stack 不直接暴露
数据库约束名不直接暴露
Secret / OTP / Token / Credential 不进普通日志
```

Pino Redaction 和 Request Context 属系统级基础设施，不由每个 Domain 重复实现。

## 数据库安全边界

数据库负责结构完整性，但不是跨领域授权捷径。

- 同 Domain 建真实 FK；
- 跨 Domain 无物理 FK；
- Repository 只访问 Owner Schema；
- HTTP 层禁止 SQL；
- Migration 只能由 `database/v2` 明确执行；
- Backend Readiness 不修改数据库。

## 并发安全

安全判断不能只做事务外 stale read。

以下场景需要数据库约束、Row Lock、事务或最终不变量保护：

```text
Refresh Rotation
账号状态变更
Device Revoke
角色与权限变更
Last-admin invariant
一次性 OTP
幂等 Mutation
业务状态转换
```

并发测试应验证最终不变量，而不是依赖固定 sleep。

## 客户端安全边界

客户端必须：

- 不保存 Internal BIGINT；
- 不把本地 Permission Guard 当作最终授权；
- 敏感 Token 使用安全存储策略；
- 前端环境变量不保存服务器 Secret；
- 不向用户展示服务器 Stack / Raw Provider Error；
- Deep Link / Route Resource ID 做格式校验。

## 尚未形成系统能力的事项

以下能力目前不能被其他 Domain 假设已存在：

```text
MFA
Passkey
Google / Apple / Email 登录
Access Token Blacklist
全局 ABAC
独立权限策略引擎
Refresh Token Family Replay Detection
通用 Notification / Push 权限系统
```

未来如需引入，应先由事实拥有者或系统级 ADR 正式设计。

跨领域协作见 [领域依赖与协作](../domains/dependencies.md)，后端运行边界见 [后端架构](../applications/backend.md)。
