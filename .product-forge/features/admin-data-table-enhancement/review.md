# Review Log: 管理端通用数据表增强

> Feature: `admin-data-table-enhancement` | Status: APPROVED
> Started: 2026-09-05

## Current Status: APPROVED

## Open Questions Resolution

| # | Question | Decision | Rationale | Resolved in Revision |
| --- | --- | --- | --- | --- |
| 1 | 异步任务归谁所有，如何冻结、重试、取消和保留？ | Content 所有；提交时冻结目标；失败项可重试；不可取消；长期保留 | 避免跨域业务真相，并保证跨页批量操作可追溯 | #1 |
| 2 | 批量任务如何持久化？ | Content 任务表 + 逐项结果表，前向 migration | 支持大批量、部分成功和逐项重试，且不修改冻结迁移 | #2 |
| 3 | 字母列表的查询和分页边界是什么？ | 搜索/筛选/排序严格白名单；默认 50、最大 500；稳定并列键 | 让跨页选择范围可复现，并满足管理员高密度操作需求 | #3 |
| 4 | 谁可以查看和重试任务？ | 仅创建任务的 Operator | 避免跨操作员泄露原因和处理结果，首期不新增管理权限 | #3 |

## Decision Log

| Date | Decision | Rationale |
| --- | --- | --- |
| 2026-09-05 | 产品规格进入再验证 | 用户明确批准进入阶段；尚未构成最终锁定。 |
| 2026-09-05 | 接受异步批量任务产品基线 | Content 拥有任务及冻结目标；Operations 只授权与审计；分批处理、失败项可重试、任务不可取消、结果长期保留。 |
| 2026-09-05 | 批准两表持久化基线 | Content 使用任务表与逐项结果表持久化，采用新的前向 migration，不改冻结 migration。 |
| 2026-09-05 | 接受查询与可见性基线，并调整分页 | 搜索、筛选、排序和任务仅创建者可见按提案采用；字母列表分页改为默认 50、最大 500。 |
| 2026-09-05 | 批准再验证规格 v1.3 | 三项 Gate finding 全部关闭，允许进入 SpecKit Bridge。 |

## Change History

- Initial review — no previous approved version.
- v1.0 → v1.1: 明确异步批量任务的所有权、目标冻结、分批处理、重试、取消和保留策略。
- v1.1 → v1.2: 固化两表与批量 API 契约，补齐 Must Have 用户故事验收标准，并把开放问题收敛到字母列表查询白名单。
- v1.2 → v1.3: 冻结字母列表查询白名单、规范化选择 hash、50/500 分页与任务可见性。

## Revision History

## Revision #1 — 2026-09-05

**User feedback:**
> 同意采用以下基线

**Changes applied:**

| File | Change Type | Description |
| --- | --- | --- |
| `product-spec/product-spec.md` | Modify | 写入 Content/Operations 所有权、目标冻结、分批处理、失败重试、不可取消和长期保留基线。 |
| `product-spec/digest.md` | Modify | 同步下游交接摘要与剩余风险。 |

**Agent notes:**数据库/API 字段、队列准入、处理批次大小与任务可见性仍需 canonical authority 决定。

---

## Revision #2 — 2026-09-05

**User feedback:**
> 批准

**Changes applied:**

| File | Change Type | Description |
| --- | --- | --- |
| `reference/adr/ADR-028-content-letter-batch-operations.md` | Add | 接受 Content-owned 异步批量任务架构。 |
| `reference/domains/content/database.md` | Modify | 登记任务表与逐项结果表目标契约。 |
| `reference/domains/content/versioning-review.md` | Modify | 登记字母批量动作、状态机和边界。 |
| `reference/contracts/content/CONTENT_LANGUAGE_ADMIN_API.md` | Modify | 登记任务创建、查询、重试、权限、幂等与陈旧选择语义。 |
| `product-spec/product-spec.md` | Modify | 补齐逐故事验收标准并同步已接受契约。 |

**Agent notes:** 字母列表精确查询白名单仍需用户批准，之后才能关闭再验证的最后一个高风险项。

---

## Revision #3 — 2026-09-05

**User feedback:**
> 分页：默认 50 条，最大 500 条

**Changes applied:**

| File | Change Type | Description |
| --- | --- | --- |
| `reference/contracts/content/CONTENT_LANGUAGE_ADMIN_API.md` | Modify | 冻结搜索、筛选、排序、规范化查询和字母列表 50/500 分页契约。 |
| `product-spec/product-spec.md` | Modify | 同步查询字段、分页决策、风险与决策日志。 |
| `product-spec/digest.md` | Modify | 更新再验证下游摘要。 |

**Agent notes:** 用户只修改分页参数，上一轮其余推荐基线按原提案采用。

---
