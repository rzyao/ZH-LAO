---
status: frozen
last_updated: 2026-08-31
---

# 公共契约与集成

本页定义 Operations 与 Identity、Owner Domain、后台客户端之间的稳定协作边界。

## Identity Contract

Operations 不实现后台独立认证系统。

认证链：

```text
Identity AuthenticationProvider
↓
AuthContext(subjectId)
↓
OperationsOperatorResolver
↓
Operator
```

Operations 只消费 Identity Public Contract，并使用稳定 Auth Subject UUID。

禁止：

```text
Operations SQL → identity.*
Operations Repository → Identity Repository
Operations import → Identity internal application/infrastructure
```

## Owner Domain Contract

后台管理动作始终由事实拥有者完成业务写入：

```text
Operations Authorizer
↓
Owner Domain Application Service
↓
Owner Domain Transaction / State Machine
↓
Canonical Mutation
```

Operations 不复制 Platform、Content、Trust & Safety、Commerce、Rewards 等领域的管理状态，也不因为后台需要操作这些对象就获得其数据库写权限。

## Public Backend Boundary

Operations 的跨模块公共边界位于：

```text
apps/backend/src/modules/operations/public/
```

稳定概念包括：

```text
OperationsAuthorizer
OperationsOperatorResolver
OperationsAuditRecorder
AuthorizedOperatorContext
OperatorPermissionKey / Permission Catalog
```

Public Contract 不暴露：

```text
Repository
Database Row
SQL
DB Executor
TransactionManager
Operations internal BIGINT / implementation detail
```

## 后台 HTTP 边界

Operations 后台管理接口统一位于：

```text
/api/v1/admin/operations/**
```

具体 Endpoint、Request/Response 与 Error Contract 以冻结 API Contract 为准。

HTTP 层负责协议适配、认证上下文和输入校验；RBAC 由 Operations Application 层裁决，不能只依赖前端隐藏按钮。

## 后台客户端

典型链路：

```text
Identity Token
↓
Operations /me / Operator Context
↓
有效 Permission
↓
前端 PermissionGuard / can() 改善 UX
↓
后端 OperationsAuthorizer 做真正 Enforcement
```

后台客户端只使用稳定 logical/public UUID，不感知数据库内部主键。

## Platform 管理集成

Platform 的 Feature Flag、Runtime Config、App Version、Announcement、Region 等 canonical state 由 Platform 自己拥有。

Operations 可以：

```text
授权某 Operator 是否拥有 platform.* 管理权限
记录成功的 Platform 后台操作 Audit
```

Operations 不可以：

```text
直接 SQL 写 platform.*
复制 Platform current state
通过 Operations 表实现第二套 Feature Flag / Config
```

同样原则适用于其他 Owner Domain。

## Permission 扩展规则

某业务领域需要新的后台管理能力时：

```text
Owner Domain 先定义并冻结管理能力 / API / Public Contract
↓
Operations Permission Catalog 增加 exact key
↓
Role 可以分配该 Permission
↓
Admin UI 根据 Contract 接入
```

不能先在数据库里创建一个看起来合理的 Permission，再倒逼代码实现。

## 跨领域标识

所有跨领域 target / subject 引用使用稳定 logical UUID。

Audit 多态目标使用：

```text
target_domain
target_type
target_id UUID
```

不得记录另一个领域的 internal BIGINT PK。

## 明确不支持

Operations V1 不提供：

```text
Independent Admin Authentication
Custom Runtime Permission Creation
Wildcard Permission
Direct Operator Permission
ABAC / Resource ACL
Approval Workflow Platform
Cross-domain SQL Management
Business State Machine Ownership
```

这些能力未来如确有需求，必须重新进行架构/领域设计，而不是在现有 RBAC 中临时扩张。

全局安全模型见 [安全与权限](../../architecture/infrastructure/security.md)。
