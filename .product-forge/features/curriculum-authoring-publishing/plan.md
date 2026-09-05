# Technical Plan：课程编排与发布

> Spec: [spec.md](spec.md) · Product context: [product-spec](product-spec/README.md) · Authority: ADR-029

## Architecture

保持 Content 模块边界。在 `domain/` 定义 Course/Lesson revision aggregate、snapshot schema 与 state guards；在 `application/` 定义 authoring、structure replacement、review/publish 与 runtime query use cases；在 `infrastructure/` 定义 Postgres repository；在 `http/` 投影 Admin/Runtime DTO。Operations 只通过 public contract 提供 exact permission 和 audit。

## Data model and migration

新增一个前向 migration：为 `content.courses` 与 `content.lessons` 添加 nullable `published_revision_id`、`working_revision_id`（域内 FK 至 `content.content_revisions(id)`，RESTRICT）；不修改 `0400`、`1240`、`1290`。snapshot 的 JSON schema 由 application validation 管理：Course pin Unit order + Lesson public/revision UUID，Lesson pin Section/Item order + Content/Exercise public/revision UUID。migration 需包含 backfill/validation strategy，但不得把不存在的 legacy course row 标为 published。

## Backend sequence

1. 建立 aggregate/snapshot schemas、typed Content errors 和 repository ports。
2. 实现 forward migration/repository pointer reads/writes、row locks、expected timestamps/lock versions、idempotency and pointer invariants。
3. 实现 Course/Lesson authoring、structure validation、revision lifecycle and atomic publish use cases。
4. 注册 Admin/Runtime routes，复用 unified envelope、Operations permission/audit and Content public boundary。
5. 编写 unit/integration/HTTP contract tests，覆盖 lifecycle, races, reference pins, visibility and UUID DTOs。

## Frontend and mobile sequence

1. 在 `admin/src/features/content/courses` 创建 contracts/api/queries/list/editor/revision-history；只复用现有 DataTable、StatusBadge、ConfirmDialog、EditPageLayout。
2. 创建 `mobile/src/features/courses` 的 catalog/structure/lesson read client/screens；没有 write, progress or local snapshot mutation。
3. 添加 Admin E2E 与 Mobile/API integration coverage from JRN-001..004。

## Transaction and security rules

Every mutation authenticates then checks `content.curriculum.read/write/review/publish` as appropriate. Structure and publish lock the aggregate root; publish validates every pinned revision and writes revision state, pointers, availability projection, audit and event in one transaction. `Idempotency-Key` protects transition retries; stale writes receive the unified typed conflict response. No DTO contains BIGINT, raw snapshot internals, or an includeDraft bypass.

## Verification matrix

| Story | Plan coverage |
|---|---|
| US-001 | Course CRUD working revisions, Admin list/editor, concurrency tests |
| US-002 | Aggregate snapshot/reorder/reference validation, editor and P0 invalid-reference test |
| US-003 | Review state machine, atomic publish, audit and P0 rollback test |
| US-004 | Runtime pointer-only reads, mobile views and P0 draft-leakage test |

## Risks

- Shared Content/Admin files are dirty due to existing Features; implementation must re-inspect diff before each edit and avoid unrelated changes.
- Forward migration needs an explicit empty/legacy data validation report.
- No external service is introduced; EDA event payload name remains an implementation detail under existing Content event conventions, but must be persisted before emission.
