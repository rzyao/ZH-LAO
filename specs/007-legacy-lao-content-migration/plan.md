# Implementation Plan: 旧老挝语内容迁移

**Branch**: `007-legacy-lao-content-migration` | **Date**: 2026-09-05 | **Spec**: [spec.md](spec.md)

## Summary

实现一个仅由运维人员在受控环境运行的 Node.js 迁移命令。命令从旧 MySQL 读取有效 Lao 内容的当前 published revision，按规范文本选择 canonical source，预检并引用 R2 对象，然后在 PostgreSQL 的单一受 advisory lock 保护的事务中创建新的 Content draft、组成关系、基础设施 Asset 和待审核 Audio 工作流记录。非 canonical 版本与缺失句子关系写入报告；任何资产访问、目标冲突或结构文本校验失败在写入前或事务中失败安全。

## Technical Context

**Language/Version**: Node.js 22 ESM  
**Primary Dependencies**: `mysql2/promise`、`pg`、Cloudflare R2 的 S3-compatible client  
**Storage**: MySQL（只读源）；PostgreSQL Content/Audio/Infrastructure（目标）；Cloudflare R2（对象读取验证）  
**Testing**: Node `node:test`、临时 PostgreSQL、MySQL fixture / query adapter mock、R2 client mock  
**Target Platform**: 受控运维命令行  
**Project Type**: 数据迁移 CLI  
**Performance Goals**: 当前约 666 条内容/音频在一个受控窗口内完成；默认批量预读、单事务写入  
**Constraints**: 源库零写入；目标 draft-only；不改冻结 migration；不得输出凭据或公开完整私有对象 URL  
**Scale/Scope**: 261 音节、239 词语、166 句子及最多 666 个源音频；目标资产数以 canonical 去重后的实体数为准，后续增长以流式读取和批次预检支持

## Constitution Check

| Check | Status | Plan response |
| --- | --- | --- |
| 事实权威优先，代码不覆盖 Domain/Architecture | ✅ | 以 Content、Audio Binding、Asset Infrastructure 文档和冻结 migration 为约束。 |
| 不修改冻结迁移 | ✅ | 只增加迁移脚本、测试和报告；不改 `0400`、`0600`、`1200` 等迁移。 |
| 外部服务失败安全 | ✅ | R2 `HeadObject` 超时/失败在目标事务开始前中止；不进行降级写入。 |
| 敏感配置保护 | ✅ | 从忽略的 `.env` 读取；报告仅记录 provider/bucket/key 摘要与对象校验结果。 |
| 单元与集成测试 | ✅ | 映射、去重、隔离报告、R2 映射和 PostgreSQL 原子性分别测试。 |
| EDA | 不适用 | 不增事件或异步消费者。 |

## Architecture and Data Flow

```text
Legacy MySQL (read-only)
  → canonicalize + validate + isolation report (memory / temp output)
  → R2 HeadObject preflight
  → PostgreSQL advisory lock + one write transaction
      → content.contents + content_revisions (new draft)
      → lo_* materialized rows + ordered relationships
      → infrastructure.assets
      → audio_slots + new pending-review Audio task/version
  → committed migration report
```

### Source selection and canonicalization

1. Query only source entities that are non-deleted, `online`, and have a `published_revision_id`.
2. Load fields, source revision composition and processed audio in stable source-ID order.
3. Normalize Lao display text with Unicode NFC + trim. Group by content type plus normalized text.
4. Select the lexicographically smallest stable source ID in each group as canonical.
5. Retain only the canonical record's composition and processed audio for target creation. Emit one isolation record for every other member, including field, relation and audio-key differences.
6. For sentence relations whose word source ID is absent, emit an isolation record and omit only that relationship; preserve source positions for valid relationships.

### Target creation order

1. Load and validate the existing 68 target Lao letters, deriving the legacy letter-ID→Content UUID mapping from their stable legacy UUID namespace. Fail if a canonical syllable cannot resolve a letter.
2. Allocate deterministic UUIDs using a distinct migration namespace and `{type}:{canonical-source-id}` input for Content, revision, Asset, Slot, Task and Audio Asset Version identities.
3. Insert target `content.contents` as `active`, specialized `lo_syllables` / `lo_words` / `lo_sentences` rows, and `content.content_revisions` with one `draft` snapshot. Create Chinese word meanings and sentence translations from canonical source text where present.
4. Insert composition relations in the required parent order, validate positions and Rule 4404 string reconstruction.
5. For each canonical processed audio URL, map the confirmed public URL prefix to `r2` / `zh-lao` / pathname-without-leading-slash. Insert a ready `infrastructure.assets` record using R2 HeadObject metadata.
6. Create a `pronunciation` audio slot tied to the new draft revision and a new `pending_review` Audio Task/Asset Version. Do **not** set the Slot's official pointer or inherit source audio review/publish history.

### Audio lifecycle assumption requiring approval

Because imported Content is explicitly new `draft` and source audio review history is not retained, the plan treats migrated audio as a new target asset awaiting review: it is stored and linked to the draft's Slot, but has no official pointer and is not publicly playable. A new-system reviewer may approve and publish it later. This is the conservative implementation of “按新建处理”.

## Transaction, Idempotency and Failure Handling

- Acquire one dedicated PostgreSQL advisory lock before any target mutation.
- Generate all reports and run all source, canonicalization, composition and R2 object preflights before `BEGIN`.
- During the transaction, re-read target IDs and verify each deterministic UUID either does not exist or exactly matches the expected type, text, snapshot and storage location. A mismatch is a conflict and rolls back.
- Insert all Content, materializations, relations, Assets and Audio records in dependency order. Use no `ON CONFLICT DO UPDATE`; a changed input must be diagnosed, never overwrite target facts.
- On any error, roll back the complete target transaction, release the lock and emit a failed report with no successful-run marker.
- On success, commit once and atomically publish a report containing counts, canonical decisions, isolated duplicates, omitted sentence relations, R2 validation and deterministic IDs.

## Module Design

```text
database/
├── scripts/
│   ├── import-legacy-lao-content.mjs       # CLI orchestration: --dry-run / --apply
│   ├── legacy-lao-content-source.mjs       # read-only MySQL queries and source DTOs
│   ├── legacy-lao-content-mapping.mjs      # NFC, canonical selection, snapshots, UUIDs
│   ├── legacy-lao-content-r2.mjs           # R2 config, URL parsing, HeadObject adapter
│   └── legacy-lao-content-report.mjs       # JSON/CSV report generation
├── test/
│   ├── legacy-lao-content-mapping.test.mjs
│   ├── legacy-lao-content-import.test.mjs
│   └── legacy-lao-content-r2.test.mjs
└── reports/
    └── legacy-lao-content-migration/       # ignored/generated run reports
```

No backend HTTP endpoint, admin UI, public contract, database migration or schema change is introduced.

## Verification Plan

1. **Unit tests**: normalization, min-ID canonical choice, duplicate isolation serialization, missing-relation omission, deterministic UUIDs, R2 URL mapping and secret-free error rendering.
2. **Database integration tests**: empty target success, exact draft revision state, relation ordering, Rule 4404 failures, idempotent rerun, all-or-nothing rollback on conflict, and no source MySQL writes.
3. **R2 adapter tests**: public-domain prefix matching, endpoint timeout/error behavior and metadata conversion; no live credentials in tests.
4. **Dry run**: run against the live source and target with no mutations; produce counts and isolation report for manual review.
5. **Apply verification**: compare committed target counts and report to dry-run output; re-run the importer and assert zero new records.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Duplicate parents have divergent structure/audio | Canonical min-source-ID policy plus complete isolation report. |
| Two sentence relations reference missing words | Omit only those relations and report them. |
| R2 object is missing or unreadable | Preflight HeadObject before target transaction; fail without writes. |
| R2 key mapping drift | Require configured public domain/bucket and exact prefix mapping; reject unmatched URL. |
| Partial cross-schema records | One PostgreSQL transaction and rollback on any error. |
| Rerun overwrites content | Deterministic IDs plus exact-match conflict checks; never upsert changed content. |

## Plan-to-Spec Coverage

| Spec requirement | Plan location |
| --- | --- |
| FR-001 source read-only selection | Source selection and canonicalization |
| FR-002 / FR-006 dedup and isolation | Source selection; reporting module |
| FR-003 draft-only new content | Target creation order |
| FR-004 / FR-005 ordered relations and exception | Target creation order; verification |
| FR-007 / FR-008 R2 and operator validation | Audio lifecycle; preflight; R2 module |
| FR-009 idempotency | Transaction, Idempotency and Failure Handling |
| FR-010 reports | Reporting module; Verification Plan |
