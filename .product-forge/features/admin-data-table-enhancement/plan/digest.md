# 技术计划 — Digest

> **Feature:** admin-data-table-enhancement
> **Phase:** plan
> **Generated at:** 2026-09-05T00:53:09+08:00
> **Artifact owner:** speckit.product-forge.plan

## Diff since last approved state

Initial version — no prior state.

- Added：正式 SpecKit 技术计划、实现研究、数据模型与验证指南。
- Changed：将功能范围明确为 `apps/admin`、`apps/backend` 与 `database` 的跨工作区交付。
- Removed：无。

## Key decisions

- 共用 DataTable 采用可选的受控服务端模式，现有客户端模式保持兼容。
- Lao 字母查询、选择预览与任务提交共用严格归一化逻辑，`query_all` 使用服务端 SHA-256 指纹并在提交时冻结 UUID。
- 使用 `1340_content_letter_batch_tasks.sql` 前向迁移创建两张 Content 表，复用现有 WorkerHost 与 PostgreSQL `FOR UPDATE SKIP LOCKED`。
- Content 拥有任务与逐项结果；Operations 仅通过窄公共端口完成实时权限复核和事务内成功审计。
- 核心 NFR 是数据完整性、50/500 服务端分页性能和共享 DataTable 向后兼容；不新增外部服务或事件总线。

## Artifacts produced

- `../../../specs/006-admin-data-table-enhancement/plan.md` — 唯一正式技术计划。
- `../../../specs/006-admin-data-table-enhancement/research.md` — 技术选择及备选方案。
- `../../../specs/006-admin-data-table-enhancement/data-model.md` — 两表、状态机和事务边界。
- `../../../specs/006-admin-data-table-enhancement/quickstart.md` — 分层验证与性能验收指南。

## Open risks

- Mitigated：500 条和宽泛搜索的索引由代表性数据上的 EXPLAIN 与 p95 验证后决定。
- Mitigated：无产品数量上限由活动任务准入、批次和并发配置保护。
- Stop condition：若 Content 写入与 Operations 审计不能共享事务，实施必须停止。

## Handoff notes for next phase

- 任务必须按测试先行、迁移、持久化、Worker/Operations、HTTP、DataTable、页面、E2E/NFR 的依赖顺序拆分。
- 每项任务需标明 workspace 前缀、路径、尺寸，并映射 US、FR、TC、API；不要把数据库、后端和前端合并为一个大任务。
- Prior lessons applied：none。
