# Change Log: 管理端通用数据表增强

## CR-001: 修正数据库派生表计数 — 2026-09-05

| Field | Value |
|-------|-------|
| **Status** | ACCEPTED |
| **Priority** | Must Have |
| **Requested at phase** | Phase 6 implementation, T006 |
| **Rationale** | 技术发现：当前 1330 基线已有 129 张业务表与 2 张 infrastructure 表；原计划误把旧计数写成新增后的总数。 |
| **Impact** | 6 个既有工件，+0 任务，small effort |
| **Phase rollback** | No；仅修正派生计数，不改变功能、FR、API 或两表契约。 |

### Artifact Impact

| Artifact | Impact | Applied change |
|----------|:------:|----------------|
| `product-spec/product-spec.md` | None | 用户行为与范围不变。 |
| `product-spec/journeys/journeys.yml` | None | 旅程不变。 |
| `specs/006-admin-data-table-enhancement/spec.md` | None | FR、AC、NFR 不变。 |
| `specs/006-admin-data-table-enhancement/plan.md` | Minor | 129 total 更正为 133 total / 131 business。 |
| `specs/006-admin-data-table-enhancement/quickstart.md` | Minor | 验证期望计数同步更正。 |
| `specs/006-admin-data-table-enhancement/tasks.md` | Minor | T006 验收计数同步更正。 |
| `migrations/migration-plan.md` | Minor | 迁移后 catalog 计数同步更正。 |
| `migrations/digest.md` | Minor | 下游摘要同步更正。 |
| `database/test/validate.test.mjs` | Minor | 静态断言改为 133 total / 131 business / 38 Content。 |

### Effort Delta

- Current state at discovery: 58 total, 4 completed, 54 remaining.
- New tasks: 0; modified tasks: 1 (T006); removed tasks: 0; net change: 0.
- No phase rollback is required because the change corrects a derived inventory count only.

### Risk Assessment

- Scope creep: low likelihood / low impact.
- Schedule delay: low likelihood / low impact.
- Regression: low likelihood / medium impact if a wrong catalog assertion were retained.
- Test invalidation: certain but limited to the new T006 inventory assertion.

### Decision Notes

用户明确批准采用 133 total / 131 business / 38 Content。不得通过删除既有表来满足过期的 129 total 断言。
