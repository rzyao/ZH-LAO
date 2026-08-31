---
status: baseline
last_updated: 2026-08-31
---

# 后端架构

ZH-LAO 后端采用 **Node.js + TypeScript + ESM 的模块化单体**。

## 技术基线

| 项目 | 当前选择 |
| --- | --- |
| 运行时 | Node.js 22+ |
| 语言 | TypeScript + ESM |
| HTTP 框架 | Fastify 5 |
| PostgreSQL 客户端 | `pg` |
| 参数与配置校验 | Zod |
| 日志 | Pino |
| 测试 | Vitest + 真实 PostgreSQL 集成测试 |
| 包管理 | pnpm |

## 运行入口

```text
apps/backend/src/main.ts
└─ API Runtime
   ├─ Fastify
   ├─ HTTP Adapter
   ├─ Authentication
   ├─ Application Service
   └─ PostgreSQL

apps/backend/src/worker.ts
└─ Worker Runtime
   ├─ Worker Registry
   ├─ Polling Job
   └─ Outbox Publisher
```

API 与 Worker 共享技术基础，但运行职责分离。异步任务不得阻塞 HTTP 请求生命周期。

## 代码分层

共享技术基础：

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

业务领域模块：

```text
src/modules/<domain>/
├─ domain/
├─ application/
├─ infrastructure/
├─ http/
└─ public/
```

## 模块边界

业务模块必须遵守：

1. 一个领域只能直接访问自己拥有的 PostgreSQL Schema；
2. 跨领域同步依赖只能通过对方 `public/`；
3. 禁止导入其他领域的 `domain/`、`application/`、`infrastructure/`、`http/` 或 repository 实现；
4. Shared technical code 不得反向依赖业务领域；
5. HTTP adapter 不执行 SQL；
6. HTTP handler 不绕过 Application Service 直接操作 Repository；
7. 业务模块不自行创建 PostgreSQL Pool；
8. 共享 Asset 与 Outbox 通过 Foundation Adapter 使用。

这些边界由 architecture audit 自动检查，不只依赖人工约定。

## 请求处理链

典型写请求：

```text
HTTP Request
↓
Fastify Route / Adapter
↓
认证与 Request Context
↓
输入 Contract / Zod Validation
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

## 数据库与事务

数据库访问通过共享 `pg` Pool、Executor 和 Transaction Manager。

规则：

- Repository 通过显式 Executor 执行 SQL；
- 事务由 Application Service / Transaction Manager 协调；
- 同一业务事务内的 Repository 与 Outbox Writer 使用同一个 transaction-scoped executor；
- 数据库约束错误映射为稳定应用错误；
- PostgreSQL 原始约束名和 stack 不直接暴露给客户端；
- Backend 不自动执行生产 Migration。

Migration 唯一物理权威为 `database`。

## Readiness

Readiness 只验证当前数据库能否安全运行，不负责修复数据库。

当前检查包括：

- PostgreSQL 可连接；
- 所需 Migration 已登记；
- Migration 文件名与 SHA256 匹配；
- 必需共享基础设施对象存在。

## 认证与后台授权

用户认证由 Identity 拥有；后台 Operator 与 RBAC 由 Operations 拥有。

典型后台调用：

```text
Identity Authentication
↓
Operations Operator Resolution
↓
Operations Permission Check
↓
Owner Domain Application Service
↓
Operations Audit
```

Operations 的授权结果不能替代 Owner Domain 自己的资源归属与状态机判断。

## 错误、日志与 Request ID

后端使用统一 `AppError` 与安全 HTTP Error Envelope。

系统级要求：

- 每个请求有 Request ID；
- 响应携带可关联 Request ID；
- Pino 使用结构化日志；
- 敏感字段必须脱敏；
- OTP、Raw Refresh Token、Credential、Secret 不进入普通日志；
- 内部 Stack 与数据库错误不直接返回客户端。

## 领域事件与 Outbox

需要可靠异步发布的领域事实采用：

```text
BEGIN
├─ Domain Mutation
└─ infrastructure.system_outbox_events
COMMIT
↓
Outbox Publisher
```

业务事实和对应 Outbox row 必须同事务提交。

事件只表达业务事实，不承担 WebSocket、Push 等传输状态。

详见 [基础设施与集成](../infrastructure/)。

## 状态机位置

业务状态机属于所属 Domain：

```text
Domain Design
↓
Executable Spec（适用时）
↓
Application Service / Domain Logic
↓
Persistence Transaction
↓
Transition Tests
```

数据库负责约束和原子性，但不通过 Trigger 隐式实现跨实体业务流程。

## 测试层次

后端至少区分：

- 单元测试；
- HTTP / Contract 测试；
- 真实 PostgreSQL 集成测试；
- 状态转换测试；
- 安全与权限测试；
- 并发 / 幂等测试；
- Architecture Boundary Audit；
- 全量 Regression。

并发测试应验证最终不变量，避免依赖固定毫秒 sleep。

## 依赖方向

```text
HTTP Adapter
    ↓
Application
    ↓
Domain

Application
    ↓
Ports / Public Contracts

Infrastructure
    ↓
Domain / Application Ports
```

业务核心不反向依赖 Fastify、PostgreSQL Row 或具体外部 Provider。

跨领域规则见 [领域依赖与协作](../domains/dependencies.md)，数据库规则见 [PostgreSQL 架构规范](../data/postgresql.md)。
