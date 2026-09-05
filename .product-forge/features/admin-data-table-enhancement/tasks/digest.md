# 任务拆解 — Digest

> **Feature:** admin-data-table-enhancement
> **Phase:** tasks
> **Generated at:** 2026-09-05T01:06:23+08:00
> **Artifact owner:** speckit.product-forge.tasks

## Diff since last approved state

Initial version — no prior state.

- Added：58 个实施任务、8 个依赖阶段及需求到任务的实时追踪行。
- Changed：追踪矩阵由桥接期索引扩展为 12 个 `planned` 需求行，严格校验 0 错误、0 警告。
- Removed：无。

## Key decisions

- 任务分布为 Setup 3、Foundation 8、US-001 11、US-002 4、US-003 7、US-004 11、US-005 10、Polish 4。
- 19 个单元、契约和集成测试任务带 `Test-first: true`，并严格位于对应实现之前；浏览器 E2E 保留在故事和收尾验证中。
- 依赖主链为 migration → Content persistence → Operations/Worker → HTTP → shared DataTable → Lao-letter page → E2E/NFR；US-002 可与 US-003 后端分支并行。
- 尺寸为 S 6、M 21、L 31、XL 0；所有任务均声明 workspace 路径或明确 `unknown`。

## Artifacts produced

- `../../../specs/006-admin-data-table-enhancement/tasks.md` — 唯一正式、可执行任务清单。
- `../traceability.yml` — 5/5 Must Have、FR-010～FR-021、6 个 API 与 58/58 任务的实时映射。

## Open risks

- Accepted：跨 admin、backend、database 的交付面较大，需按阶段提交并在每个 checkpoint 验证。
- Mitigated：31 个 L 任务均限制在单一主要层或事务能力内，没有 XL 任务。
- Stop condition：权威、冻结迁移、API operationId 或事务审计边界发生实质漂移时停止实施。

## Handoff notes for next phase

- 先执行迁移规划；实施从 T001 权威复核开始，随后按 T004→T005→T006 和测试先行链推进。
- 推荐按 migration、backend foundation/query、worker/API、shared table、feature UI、verification 分批提交。
- 不得把 Product Forge 工件当作产品或技术权威，也不得在实现中新增上线/下线、取消或物理删除。
