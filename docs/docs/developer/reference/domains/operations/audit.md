---
status: frozen
last_updated: 2026-08-31
---

# 操作审计与 Bootstrap

本页定义 Operations 的后台成功操作审计和首个 Operator 初始化规则。

## 操作审计

`operations.operator_audit_logs` 是后台管理成功动作的 canonical Audit Trail。

它回答：

```text
谁          → operator_id
做了什么    → action_key
对什么对象  → target_domain / target_type / target_id
什么时候    → created_at
请求上下文  → request_id / ip_address / safe details
```

Audit Log 是 append-only 历史事实：

```text
INSERT only
NO business UPDATE
NO business DELETE
```

## 成功语义

当前数据库契约没有 `result` 字段。

因此一条 canonical Audit Row 的语义就是：

```text
该后台管理动作已被接受并成功完成
```

以下情况不伪造为成功 Audit：

- Authentication Failure；
- Authorization Denial；
- Validation Failure；
- Owner Domain Business Failure；
- Unhandled Exception。

这些失败进入安全日志、应用日志和可观测性系统。

也不在 `details` 中人为塞入 `result=failed` 来制造第二套语义。

## Operations 自有 Mutation

Operations 自己拥有的数据修改应与 Audit 同事务：

```text
BEGIN
├─ Operations State Mutation
└─ Operations Audit INSERT
COMMIT
```

例如创建/禁用 Operator、Role 修改、Role Assignment 修改等。

## 跨领域管理动作

跨领域动作不能为了 Audit 原子性而让 Operations 直接写 Owner Schema。

默认链路：

```text
Operations authorize
↓
Owner Domain canonical mutation
↓
Owner Domain commit
↓
Operations success Audit
```

V1 不引入跨领域 Distributed Transaction。

这意味着 Owner Domain 已提交而后续 Audit 写入失败时存在可靠性交付缺口。对于 [ADR-030](../../adr/ADR-030-transactional-owner-domain-audit-boundary.md) 明确批准的同库本地事务动作，Owner Domain 通过 `OperationsTransactionalAuditBoundary` 在自己的事务中写入 Operations append-only Audit；审计失败则整个 Owner mutation 回滚。它不是 Operations 直接写 Owner Schema，也不是 Distributed Transaction。

## Audit Details 安全

`details` 只保存安全、必要的管理上下文。

不得写入：

```text
Password
OTP
Access / Refresh Token
Credential
Secret
完整敏感个人数据
Provider Secret
```

Audit 的目标是解释管理动作，不是复制业务对象完整快照。

## Bootstrap 目标

系统第一次部署时需要建立首个具有完整管理能力的 Operator，但不能提供永久公开后门。

因此使用一次性、受控的 CLI Bootstrap。

## Bootstrap 前置条件

```text
目标 Identity Subject = active
当前 operators 数量 = 0
```

只有同时满足时才允许初始化。

## Bootstrap 结果

```text
创建 reserved super_admin Role（若契约要求创建）
↓
写入当前完整 Permission Catalog
↓
创建首个 Operator
↓
建立 super_admin assignment
↓
写入 bootstrap Audit
```

整个 Operations 本地状态变化必须在事务内保持一致。

## 禁止的 Bootstrap 方式

不允许：

- Public Bootstrap HTTP Endpoint；
- 默认 `admin/admin`；
- 默认密码；
- 长期可重复使用的 Bootstrap Backdoor；
- 在已有 Operator 时再次执行首个管理员初始化；
- 绕过 Identity Active Subject 检查。

## 并发 Bootstrap

两个并发 Bootstrap 请求不能产生两个“首个管理员”。

实现必须利用数据库唯一性、锁和事务保证：

```text
zero operators
→ exactly one successful bootstrap
```

失败的竞争请求必须安全拒绝。
