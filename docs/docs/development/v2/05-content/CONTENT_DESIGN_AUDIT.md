---
status: frozen
phase: 5
phase_name: Content Domain
document: CONTENT_DESIGN_AUDIT
design_only: true
implementation_started: false
last_updated: 2026-08-31
repository_commit_audited: 007d6ad705a9afcc4fefb03442e371b4dec07fad
---

# ZH-LAO V2 — Content Independent Design Audit

> 本审计独立检查 `0400_content.sql <-> docs <-> Product Semantics <-> Use Cases <-> API/Public IDs <-> Learning/Audio/Asset/Operations`。不以“为了 PASS”补不存在的 schema 或实现。

## 1. Repository Audit

设计落库前最后一次 remote `main` re-audit：

```text
HEAD = 007d6ad705a9afcc4fefb03442e371b4dec07fad
commit = fix(operations): authorize from one current database snapshot
branch = main
branch protected = false
```

Master Plan frozen baseline记录 17 migrations；Platform 后续 forward migration `1250` 已使当前执行 registry为 18 migrations。Content physical authority包括：

```text
0400_content.sql
1240_content_revision.sql
```

Current CI workflows：

```text
.github/workflows/foundation.yml
```

Upstream status evidence：

- Identity = COMPLETE / PASS / FROZEN；
- Platform = COMPLETE / PASS / FROZEN；
- Admin Foundation = COMPLETE / PASS；
- Mobile Foundation = COMPLETE / PASS；
- Operations design = PASS；
- current code/HEAD 已存在 Operations implementation commits；
- 但 `04-operations/` 尚无 final implementation report，`DEVELOPMENT_PROGRESS.md` 尚未记录 `OPERATIONS_GATE = PASS`。

因此 Content design可以并行完成，但正式 implementation仍依赖 Operations Final Gate。

## 2. Frozen Table Audit

`0400_content.sql` 实际创建：

```text
Knowledge  = 17
Dictionary = 4
Curriculum = 5
Practice   = 5
Total      = 31
```

没有修改该 migration，没有增加 core table。

`1240_content_revision.sql` 额外创建 `content.content_revisions`，属于已存在的 forward blocker-resolution contract。它提供：

```text
revision_public_id UUID UNIQUE
entity_type
entity_id UUID
revision_number
status draft/published/superseded
snapshot JSONB
created_by_operator_id UUID logical ref
supersedes_revision_id domain-internal FK
```

结论：Revision requirement 与当前 physical baseline可以闭环，不需要设计阶段修改 DB。

## 3. Registry / Subtype Audit

`contents.content_type` 只允许 8 registry types，且所有专用 subtype 以 `content_id BIGINT` 域内 FK/PK关联。

Design已冻结：Registry+subtype atomic create、type/language一致性、type immutable、core Knowledge no physical delete。

Meanings/Translations/Examples/Pronunciations 不是 Registry type，与 migration一致。

Result：PASS。

## 4. Language / Direction Audit

Physical language values只有 zh/lo。Course只有 `learning_language`；没有 native/source language field。

Design没有发明新的持久化 direction字段，而是把 Course canonical semantics固定为 target learning language。Translation/equivalent/relation language rules由 Application Service约束。

Result：PASS。

## 5. Public ID Audit

逐项 physical check：

| Entity | Physical stable UUID | Cross-domain strategy | Result |
| --- | --- | --- | --- |
| contents | `public_id` | public root | PASS |
| courses | `public_id` | public root | PASS |
| units | none | Course aggregate-internal；禁止跨域保存 | PASS |
| lessons | `public_id` | public root | PASS |
| lesson_sections | `public_id` | Learning last_section logical ref | PASS |
| lesson_items | none | Lesson aggregate-internal；禁止跨域保存 | PASS |
| exercises | `public_id` | public root | PASS |
| questions | `public_id` | public root | PASS |
| question_contents/options/rules | none | Question aggregate-internal | PASS |
| revisions | `revision_public_id` | immutable cross-domain pin | PASS |

Learning migration实际保存 `course_id / lesson_id / last_section_id / content_id / exercise_id / question_id` UUID；没有 `unit_id` / `lesson_item_id` physical dependency，因此与上述 contract闭环。

`vocabulary_id` / `sentence_id` 等业务词汇统一映射 Registry Content UUID，不发第二套 logical IDs。

```text
Internal BIGINT cross-domain leak = 0 by design
DATABASE_CONTRACT_CONFLICT = 0
```

## 6. Revision Audit

Revision-capable stable roots：content/course/lesson/exercise/question 都有 public UUID。

`translation` base row没有 public UUID，但 Design没有引用 translation BIGINT：V1 将 `entity_type=translation` 定义成“parent Content 的 canonical translation set”，使用 parent `contents.public_id` 作为 `entity_id`。一个 Content 的 translation collection拥有自己的 revision stream，物理 contract合法且无需 schema change。

Published revision immutable；Learning/Audio可 pin revision UUID。Current-only `published_at` 的历史时间线不是 V1 required feature。

Result：PASS。

## 7. Knowledge / Dictionary Audit

Search physical support存在于：

```text
zh_words.simplified trigram
zh_words.traditional trigram
zh_words.pinyin_text trigram
lo_words.text trigram
lo_words.romanization trigram
```

Design只承诺这些 word fields 的 bounded exact/prefix/trigram V1 search，没有虚构 sentence full-text、semantic search、Redis或Elasticsearch。

Translation ownership：canonical teaching translation -> Content；runtime user translation -> Learning。Result：PASS。

## 8. Curriculum Audit

Physical hierarchy与 design一致：Course -> Unit -> Lesson -> Section -> Item。

Course/Lesson有 lifecycle status；Unit/Section/Item无独立 status。Design没有给内部节点虚构 status/public ID，而用 aggregate replacement + parent lifecycle。

Ordering unique constraints：

```text
(course_id, unit.sort_order)
(unit_id, lesson.sort_order)
(lesson_id, section.sort_order)
(section_id, item.sort_order)
```

Design通过 root lock + expectedUpdatedAt + transactional deterministic reorder解决 collision/race。

Result：PASS。

## 9. Practice / Answer Leakage Audit

Physical answer truth存在于 `question_options.is_correct` 和 `answer_rules`。如果直接把 DB row DTO 发给 Mobile会产生 HIGH security issue。

Design已分离：

```text
PublicPracticeView = answer-redacted
TrustedScoringView = server-only via Content public contract
```

No Option/Rule row CRUD/public IDs。Attempt/result仍在 Learning。

Result：PASS。

## 10. Learning Boundary Audit

Content owns definitions；Learning owns user facts。Content public contract提供 entity/revision validation与 server-side scoring definition，Learning不 direct SQL Content。

Disabled/archived不删除 logical identity；historical replay按 revision UUID。

Result：PASS。

## 11. Audio Boundary Audit

Audio migration要求 `content_entity_id UUID` 与 `content_revision_id/required_content_revision_id UUID`。Content的 allowed Audio source roots限定为具有 stable public UUID + revision support 的 content/course/lesson/exercise/question。

Audio owns Slot/Task/Attempt/AssetVersion/Review/Publish；Content只提供 source validation/snapshot并消费 official audio read。

Result：PASS。

## 12. Asset Boundary Audit

`cover_media_id / lesson_items.media_id / question_contents.media_id / question_options.media_id` 均是 UUID logical refs且没有 physical cross-domain FK。

Content不复制 provider/bucket/key/mime/size/checksum。

Result：PASS。

## 13. Operations / Permission Audit

Operations frozen grammar为严格三段 `<domain>.<resource>.<action>`、exact membership、无 wildcard。Content提出 8 keys：

```text
content.knowledge.read
content.knowledge.write
content.curriculum.read
content.curriculum.write
content.curriculum.publish
content.practice.read
content.practice.write
content.practice.publish
```

它们按 capability而非 table设计，满足 grammar。Design phase不修改 Operations code/catalog。

Result：PASS。

## 14. API Audit

Runtime/API映射到 Use Cases而非 tables：course aggregate、lesson aggregate、knowledge discriminated view、bounded dictionary、safe practice definition。

Admin mutation同样以 aggregate capability设计；Unit/Item/Option/Rule不获得独立 row CRUD endpoint。

Unknown-field rejection、stable UUID、not-found/conflict、pagination、answer visibility均已冻结。

Result：PASS。

## 15. Outbox / Cache Audit

没有已冻结的异步消费者必须订阅 Content mutation，因此：

```text
Required Content V1 Outbox events = none
```

没有性能证据要求额外 cache/search infrastructure，因此：

```text
PostgreSQL first
Redis = 0 required
Elasticsearch/Meilisearch = 0 required
Kafka = 0 required
```

Result：PASS。

## 16. Concurrency Audit

Covered races：

- duplicate Registry create；
- Registry+subtype partial failure；
- concurrent content update；
- publish vs edit / publish vs publish；
- course/lesson reorder；
- practice/question aggregate mutation；
- retire vs runtime read。

Mechanisms只使用现有 transaction/row lock/unique/updated_at，不新增 DB field。

Result：PASS。

## 17. Independent Smell Checklist

```text
table-driven CRUD smell             = PASS
Content/Learning ownership overlap   = PASS
Audio production leakage             = PASS
Asset storage duplication            = PASS
canonical translation ambiguity      = PASS
public UUID gap                       = PASS (internal nodes explicitly non-cross-domain)
internal BIGINT cross-domain leak     = PASS
draft/unpublished exposure            = PASS
answer leakage                        = PASS
unsupported search promise            = PASS
revision/version assumption           = PASS via 1240
ordering concurrency ambiguity        = PASS
permission per-table explosion        = PASS
premature Redis/search infra           = PASS
```

## 18. Findings

### LOW-01 — Repository documentation state drift

Two non-blocking documentation observations were found during re-audit：

1. `DEVELOPMENT_PROGRESS.md` still says Operations Implementation has not started, while current `main` HEAD is already an Operations implementation fix commit. This does **not** prove final Gate PASS; no Operations final report/Gate is present.
2. older Content database narrative uses broad examples such as `unit_id` as a possible logical cross-domain name, while actual `0400_content.sql` gives Unit no UUID and actual `0500_learning.sql` stores no Unit ID. This design resolves the canonical contract as “Unit is aggregate-internal; no cross-domain Unit ID in V1”.

Impact：documentation synchronization only；no runtime/schema conflict；does not block Content Design Gate。

## 19. Severity / Gate Inputs

```text
BLOCKER = 0
HIGH = 0
MEDIUM = 0
LOW = 1

UNRESOLVED_PRODUCT_DECISIONS = 0
DATABASE_CONTRACT_CONFLICT = 0
CROSS_DOMAIN_OWNERSHIP_AMBIGUITY = 0
```

## 20. Content Design Result

```text
CONTENT DESIGN RESULT

Repository HEAD = 007d6ad705a9afcc4fefb03442e371b4dec07fad
Content frozen core tables = 31
Content revision support table = 1 via 1240 forward migration
0400 migration changes = 0

Product Semantics = FROZEN
Knowledge Contract = FROZEN
Dictionary Contract = FROZEN
Curriculum Contract = FROZEN
Practice Contract = FROZEN
Translation Ownership = PASS
Learning Boundary = PASS
Audio Boundary = PASS
Asset Boundary = PASS

Public ID Audit = PASS
Database Contract Conflict = 0

Use Cases:
REQUIRED = 34
DEFERRED = 10
NOT_SUPPORTED = 14

Runtime API = FROZEN
Admin API = FROZEN
Public Contract = FROZEN
Operations Permission Requirements = FROZEN

Outbox decision = NONE REQUIRED V1
Cache/Search decision = POSTGRESQL FIRST

Operations status = DESIGN PASS; IMPLEMENTATION ACTIVITY PRESENT; FINAL GATE NOT PRESENT
Content implementation dependency = OPERATIONS_GATE

Findings:
BLOCKER = 0
HIGH = 0
MEDIUM = 0
LOW = 1

CONTENT_DESIGN_GATE = PASS
CONTENT_IMPLEMENTATION_STARTED = NO
```

## 21. TECH_DEBT / Deferred Follow-up

- sync `DEVELOPMENT_PROGRESS.md` when Operations execution owner publishes authoritative status；
- sync older domain narrative wording around Unit logical IDs to this canonical aggregate-internal decision when normal docs synchronization is performed；
- advanced search, bulk/CSV, AI promotion, approval workflow, scheduled publish, collaborative locking remain deferred；
- no Content implementation may start until `OPERATIONS_GATE = PASS` is explicitly evidenced。

## 22. STOP

Design Gate complete。不要在本任务继续：backend implementation、migration edit、Admin page、Mobile page、Learning/Audio implementation、Operations RBAC code change。
