---
status: baseline
last_updated: 2026-08-31
---

# 后端架构

ZH-LAO 后端采用 **Node.js + TypeScript + ESM 的模块化单体**。当前运行时已经落地，不再处于“技术栈待确认”状态。

## 技术基线

| 项目 | 当前选择 |
| --- | --- |
| 运行时 | Node.js 22+ |
| 语言 | TypeScript + ESM |
| HTTP 框架 | Fastify 5 |
| 数据库访问 | `pg` |
| 参数与配置校验 | Zod |
| 日志 | Pino |
| 测试 | Vitest + 真实 PostgreSQL 集成测试 |
| 包管理 | pnpm |

## 运行进程

后端当前有两个正式运行入口：

```text
src/main.ts
└─ API Runtime
   ├─ Fastify
   ├─ HTTP routes
   ├─ Authentication
   ├─ Application Services
   └─ PostgreSQL

src/worker.ts
└─ Worker Runtime
   ├─ Worker Registry
   ├─ Polling Jobs
   └─ Outbox Publisher
```

API 和 Worker 共享基础设施代码，但承担不同运行职责。异步任务不得阻塞 HTTP 请求生命周期。

## 代码边界

共享技术基础位于：

```text
src/
├─ bootstrap/
├─ config/
├─ logging/
├─ database/
├─ ids/
├─ errors/
├─ auth/
├─ http/
├─ events/
├─ outbox/
├─ jobs/
└─ assets/
```

业务领域位于：

```text
src/modules/<domain>/
├─ domain/
├─ application/
├─ infrastructure/
├─ http/
└─ public/
```

当前已经进入代码实现的领域模块包括身份（Identity）、平台（Platform）和运营（Operations）；其他领域按开发生命周期逐步加入。

## 领域模块规则

领域模块必须遵守以下边界：

1. 一个领域只能直接访问自己拥有的 PostgreSQL Schema；
2. 一个领域需要调用另一个领域时，只允许依赖对方的 `public/`；
3. 禁止导入其他领域的 `domain/`、`application/`、`infrastructure/`、`http/` 或 repository 实现；
4. Shared technical code 不得反向依赖业务 Domain；
5. HTTP adapter 不得执行 SQL；
6. Domain HTTP handler 不得直接操作 repository 绕过 application service；
7. 业务模块不得自行创建 PostgreSQL Pool；
8. `infrastructure.assets` 与 `infrastructure.system_outbox_events` 只能通过 Foundation 提供的共享 adapter 使用。

这些规则由自动化 architecture audit 检查，而不是只靠人工约定。

## 请求处理链

典型写请求：

```text
HTTP Request
↓
Fastify Route / Adapter
↓
认证与请求上下文
↓
Zod / Contract Validation
↓
Application Service
↓
Transaction Manager
├─ Domain Repository
├─ Domain Rule / State Transition
└─ Outbox Writer（如需要）
↓
COMMIT
↓
安全 HTTP Response
```

HTTP 层只负责协议适配，不拥有业务状态机。

## 数据库访问与事务

数据库访问使用共享 `pg` Pool 和统一 executor。

规则：

- repository 通过显式 executor 执行 SQL；
- 事务由 application service / transaction manager 控制；
- 同一业务事务内的 repository 与 Outbox Writer 必须共享 transaction-scoped executor；
- 数据库约束错误统一归一化为应用错误，不把 PostgreSQL 原始约束和 stack 暴露给客户端；
- 后端不会自动执行 production migration。

Migration 的唯一权威位于 `database/v2`。

## Migration 与 Readiness

后端 readiness 不负责迁移，只验证当前数据库是否满足运行要求。

当前机制会检查：

- PostgreSQL 是否可连接；
- 所需 migration 文件是否已登记；
- migration 文件名与 SHA256 是否匹配；
- 必需 Shared Infrastructure 对象是否存在。

这用于识别数据库版本漂移，但不会在启动时自动修复 Schema。

## 认证架构

用户认证由身份领域（Identity）拥有。

当前已实现：

```text
手机号 OTP
Facebook credential adapter boundary
Access Token = JWT
Refresh Token = opaque token + rotation
Session / Device / Account State
```

HTTP 认证 Provider 缺失时采用 fail-closed，不允许因为 provider 未配置而默认授权。

其他领域不得解析 Identity 内部表来自行判断用户身份；跨领域使用 Identity 的公开契约。

## 后台授权

后台 Operator 和 RBAC 由运营领域（Operations）拥有。

典型后台请求：

```text
Identity Authentication
↓
Operations Operator Resolution
↓
Operations exact Permission Check
↓
Owner Domain Application Service
↓
Operations Audit
```

Operations 不拥有其他业务领域的数据写入权。后台管理动作仍然必须进入业务事实拥有者的 application service。

## 错误模型

后端使用统一 `AppError` 和安全 HTTP error envelope。

目标是保证：

- 客户端可以按稳定错误码处理；
- validation / conflict / unauthorized / forbidden / unavailable 等语义统一；
- PostgreSQL constraint、stack trace、token、credential、OTP、secret 不直接进入响应；
- request ID 可以在客户端响应和服务端日志之间关联。

## 日志与请求关联

使用 Pino 结构化日志，并维护 request context。

基础要求：

```text
每个请求有 request ID
响应携带关联 request ID
敏感字段进行日志脱敏
应用错误与内部错误区分
事务 rollback 有结构化记录
```

敏感信息如 OTP、raw refresh token、登录 credential、完整 push token 不允许写入普通日志。

## Outbox 与异步处理

项目使用唯一共享 Outbox：

```text
infrastructure.system_outbox_events
```

业务事实和对应 event row 在同一个 PostgreSQL transaction 中提交。

Publisher 使用 PostgreSQL polling，并通过 `FOR UPDATE SKIP LOCKED` 支持并发领取；`available_at` 同时用于待执行时间和有限 lease；失败使用有上限的指数退避重试。

未知事件不会被静默标记成功，而是保留并重试。

当前不引入 Kafka / RabbitMQ。只有真实吞吐或投递延迟证明 PostgreSQL polling 不足时才重新评估。

## Asset 基础设施

通用文件事实由 Shared Asset Infrastructure 管理，而不是散落在各业务领域。

后端 Foundation 已提供：

- canonical Asset metadata model；
- `infrastructure.assets` repository；
- object-storage port。

业务领域只保存稳定 `asset_id` UUID logical reference。

生产对象存储 Provider 当前尚未正式选定，后端不得假装存在 production adapter。

## Public Contract

跨领域同步调用必须经过领域 `public/` contract。

公开内容只应包含：

- 稳定 logical/public ID；
- 查询接口；
- 需要跨领域共享的最小业务类型；
- 明确的应用级操作接口。

禁止公开：

```text
repository
DB record
internal BIGINT
SQL
transaction manager
hash / token secret
内部 service implementation
```

## 测试与 Gate

后端基础验证至少包含：

```text
typecheck
lint
architecture audit
unit test
build
real PostgreSQL integration test
database migration validation
database audit
```

领域阶段还必须按业务增加：状态机、权限、安全、事务、并发、幂等、HTTP contract 和跨领域集成测试。

## 当前边界

已经冻结或实际存在的架构事实可以记录在本页；下列内容当前仍属于未来基础设施决策，不在这里提前设计：

- 生产部署 Provider；
- 外部 message broker；
- WebSocket / Push production transport；
- production object storage adapter；
- 各未实施 Domain 的内部代码结构细节。

参见 [总体架构](overview.md)、[基础设施与集成](infrastructure.md)、[安全与权限架构](security.md)、[PostgreSQL 总规范](database.md)。
