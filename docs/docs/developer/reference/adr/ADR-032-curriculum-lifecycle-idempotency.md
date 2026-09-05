---
status: frozen
last_updated: 2026-09-05
---

# ADR-032：Course/Lesson 生命周期命令的持久化幂等收据

**状态：** `已接受`

**日期：** `2026-09-05`

**相关：** [ADR-029](ADR-029-curriculum-revision-published-view.md)、[ADR-030](ADR-030-transactional-owner-domain-audit-boundary.md)、[Content 版本复核](../domains/content/versioning-review.md)、[Content 数据库](../domains/content/database.md)、[Content API](../contracts/content/CONTENT_API.md)。

## 背景

Content 的 Course/Lesson revision 提交、审核和发布已要求 `Idempotency-Key`，同时发布还必须原子更新 revision、published/working pointer 和 Operations 成功审计。冻结 Content migration 和既有前向 migration 没有可在该事务中持久化的生命周期命令收据。进程内缓存既不能跨进程/重启，也不能与状态和审计共同回滚。

## 决策

1. Content 增加 forward-only 的 `curriculum_command_receipts`。唯一键是 operator UUID、aggregate 类型（course/lesson）、aggregate UUID、命令种类和 `Idempotency-Key`；只保存 logical/public UUID，内部 BIGINT 不可通过 HTTP 暴露。
2. 收据保存规范化请求的 SHA-256 fingerprint 和仅含公开身份信息的成功 response payload。相同唯一键且 fingerprint 相同必须重放原成功；fingerprint 不同返回既有统一码 `CONFLICT`。
3. 仅覆盖 Course/Lesson revision 的 `submit`、`review`、`publish`。create、structure replace、archive 及其他 Content aggregate 不因此自动获得幂等语义。
4. receipt 的取得/写入、revision 状态流转、published/working pointer 变化（如适用）和 ADR-030 的 Operations 成功审计必须在调用方同一个 Content 本地 PostgreSQL 事务内提交或回滚。失败不得留下一条可重放的成功 receipt。
5. 不复用 Lao letter batch task 的幂等行；它属于异步批任务，不代表 aggregate 生命周期命令。

## 后果

- 网络重试不会重复生命周期状态变更或成功审计。
- 并发相同命令可由数据库唯一键和事务语义收敛为一次执行、随后重放。
- 这不改变 revision 状态机、权限要求、乐观锁要求或 ADR-029 的 published-view 规则。
