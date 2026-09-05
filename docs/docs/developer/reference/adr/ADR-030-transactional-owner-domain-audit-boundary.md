---
status: frozen
last_updated: 2026-09-05
---

# ADR-030：Owner Domain 的事务内 Operations 审计边界

**状态：** `已接受`

**日期：** `2026-09-05`

**相关：** [ADR-019](ADR-019-operations-backoffice-control-plane.md)、[ADR-029](ADR-029-curriculum-revision-published-view.md)、[Operations 公共契约](../domains/operations/contracts.md)、[Operations 审计](../domains/operations/audit.md)。

## 背景

ADR-029 要求 Course/Lesson 发布的 canonical mutation 与 Operations 成功审计在同一 Content 本地事务中提交或回滚。既有 `OperationsAuditRecorder` 使用调用方外部 executor；已有事务内方法又仅服务老挝字母批任务，输入固定为 batch task 语义。Content 直接写 `operations.operator_audit_logs` 会越过 Operations ownership。

## 决策

1. Operations 增加窄的 `OperationsTransactionalAuditBoundary` public contract。它只接受调用方提供的同库 `DatabaseExecutor`、Operator UUID、action key、logical UUID target、请求上下文与安全 details，并只执行 append-only Audit INSERT。
2. `DatabaseExecutor` 仅作为 caller-owned transaction 的受限执行上下文暴露给该边界；它不代表向 Owner Domain 暴露 Operations repository、表、SQL builder 或 `TransactionManager`。
3. target 必须是稳定 logical UUID，`target.domain='content'`，`target.type` 仅可为 `course` 或 `lesson`；不得传递任何 Content BIGINT。
4. details 继续适用 Operations 的敏感字段拒绝与大小限制。审计插入失败必须使 Owner Domain transaction 回滚。
5. 既有批处理专用事务方法保持兼容；可内部委托至本边界，但不能以假 batch task 记录课程发布。

## 后果

- Content publish 可在一个本地 PostgreSQL 事务中原子写入 revision 状态、published/working pointer、旧 revision supersede、availability projection 与 audit。
- 这不是跨域 Distributed Transaction，也不允许 Operations 读取或修改 Content canonical state。
- 其他 Owner Domain 只有在其权威明确要求同一事务审计并符合该窄输入边界时才能复用；不得把它扩展为通用跨域写入口。
