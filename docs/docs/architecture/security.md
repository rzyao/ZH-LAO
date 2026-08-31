---
status: baseline
last_updated: 2026-08-31
---

# 安全与权限架构

ZH-LAO 的安全模型不是由一个“万能权限模块”统一接管，而是按照业务事实归属拆分认证、后台授权、平台治理和业务状态校验。

## 安全责任分层

| 能力 | 事实拥有者 | 主要职责 |
| --- | --- | --- |
| 用户认证 | 身份（Identity） | 登录身份、OTP、Session、Device、Access / Refresh Token、账号状态 |
| 后台操作者 | 运营（Operations） | Operator、Role、Permission、RBAC、后台操作审计 |
| 平台治理 | 信任与安全（Trust & Safety） | 举报、审核案件、证据、处罚、限制、申诉 |
| 业务授权 | 各业务领域 | 对自身业务状态、资源归属和状态机前置条件做最终裁决 |
| 技术安全 | Shared Application / Infrastructure | request ID、日志脱敏、错误封装、secret fail-fast、HTTP 边界 |

这些责任可以组合，但不得互相夺取事实所有权。

## 认证不等于授权

一个请求通常需要经过多层判断：

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

例如后台操作：

```text
Identity 验证当前认证主体
↓
Operations 解析 Operator
↓
Operations 检查 exact permission
↓
Owner Domain 检查业务规则
↓
执行 owner Domain mutation
↓
记录后台 Audit
```

前端隐藏按钮只能改善体验，不能替代服务端授权。

## 身份认证

Identity 当前实现并冻结的主要认证能力：

- 手机号 E.164 + OTP；
- Facebook credential adapter boundary；
- JWT Access Token；
- opaque Refresh Token；
- Refresh Rotation；
- Session；
- Device；
- 账号 active / disabled / closed 状态。

关键安全规则：

```text
Raw OTP 不落库、不落普通日志、不进事件
Raw Refresh Token 不落库、不落普通日志
Facebook raw credential 不持久化
Access Token 不做普通持久化
账号 disable / close 会撤销 Session
closed 为终态
```

生产 Secret 缺失或过短时必须 fail-fast，不能使用静默开发默认值。

## Token 与 Session

当前会话架构：

```text
Access Token
→ JWT
→ 短生命周期

Refresh Token
→ opaque cryptographically random token
→ rotation always
→ 服务端 Session 管理
```

移动客户端的存储分层：

```text
Access Token  → memory
Refresh Token → SecureStore
```

后台客户端通过统一 auth/client boundary 使用认证信息，页面和组件禁止自行拼接认证 header。

## 后台 RBAC

Operations 的权限模型采用 exact permission key：

```text
<domain>.<resource>.<action>
```

V1 当前明确：

- 不支持 wildcard permission；
- 不引入 ABAC；
- disabled Operator 不授权；
- disabled Role 不参与 permission union；
- `super_admin` 不存在绕过 permission rows 的隐式后门；
- RBAC 不依赖 Redis / stale cache；
- 权限变更后以后端当前数据库事实为准。

Operations 只能做授权和后台操作审计，不能直接越过 owner Domain 修改其 Schema。

## 用户主动 Block 与平台处罚

必须区分两类事实：

```text
social_blocks
= 用户主动的社交关系事实

trust.enforcement_actions
= 平台治理处罚事实
```

两者不能合并。

业务 Domain 在执行 Discover、Follow、Chat 等动作时，可以同时消费 Social 与 Trust 暴露的事实做最终授权判断。

## 跨领域安全边界

跨领域必须遵守：

- 只消费对方 `public` contract；
- 禁止跨 Domain repository import；
- 禁止跨 Domain SQL；
- 禁止跨 Domain physical FK；
- 使用 stable logical UUID；
- 不暴露 internal BIGINT；
- 不把 hash、token、credential、secret 放入 public contract 或 event payload。

跨领域安全不是通过“大家都在一个数据库”来绕过边界。

## HTTP 输入安全

HTTP adapter 必须进行严格输入校验。

当前已有的安全原则包括：

- unknown field 拒绝；
- 防止 mass assignment；
- public UUID / owner scope 校验；
- 不允许客户端注入 provider subject；
- 不允许客户端注入 internal ID；
- 认证 / token 响应使用禁止缓存语义；
- PostgreSQL raw error、stack、secret 不返回客户端。

业务级 IDOR 防护必须由 application service 根据当前 actor 与 resource ownership 执行。

## 错误与日志安全

统一错误系统应确保：

```text
客户端得到稳定、安全的错误码
服务端日志保留 request ID 供追踪
内部 stack 不直接暴露
数据库约束名不直接暴露
secret / OTP / token / credential 不进入普通日志
```

Pino redaction 和 request context 是系统级基础设施，不由各领域重复实现。

## 数据库安全边界

数据库层负责结构完整性，但不作为跨领域授权捷径。

关键规则：

- 同 Domain 建真实 FK；
- 跨 Domain 无物理 FK；
- repository 只访问 owner schema；
- HTTP 层禁止直接 SQL；
- migration 只能由 `database/v2` 明确执行；
- 后端 readiness 不自动修改数据库。

## 并发也是安全问题

安全判断不能只在事务前做一次 stale read。

对于：

```text
Refresh Rotation
账号状态变更
Device revoke
角色与权限变更
last-admin invariant
一次性 OTP
幂等 mutation
```

必须通过 row lock、数据库约束、事务或最终不变量保证并发下仍然安全。

测试应验证并发结果，而不是依赖固定毫秒 sleep。

## 客户端安全边界

客户端必须遵守：

- 不保存 internal BIGINT；
- 不把服务端 permission guard 复制为本地最终事实；
- 敏感 Token 使用安全存储策略；
- 前端环境变量不得放服务器 secret；
- 服务器 stack / raw provider error 不展示给用户；
- deep link / route resource ID 需要格式校验。

## 当前尚未实施的安全能力

以下能力目前没有被冻结为系统基础能力，因此不能在其他 Domain 中自行假设存在：

```text
MFA
Passkey
Google / Apple / Email 登录
Access Token blacklist
全局 ABAC
独立权限策略引擎
Refresh Token family replay detection
通用 Notification / Push 权限系统
```

未来若需要，应先由拥有该事实的 Domain 或系统级 ADR 正式设计。

参见 [后端架构](backend.md)、[客户端架构](frontend.md)、[领域关系图](domain-map.md)、[PostgreSQL 总规范](database.md)。
