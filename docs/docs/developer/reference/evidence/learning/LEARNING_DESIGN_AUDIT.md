---
status: frozen
phase: 6
phase_name: Learning Domain
document: LEARNING_DESIGN_AUDIT
design_only: true
implementation_started: false
last_updated: 2026-09-02
repository_entry_head: f5b3f3f41468036ecbd1544c6a9b3c5fbf9668db
pre_audit_write_head: e11735eec9521e5bcf9aaefc6ed93d4a73bf8108
lifecycle: historical
---

> 迁移说明：本文是迁移时保留的契约/证据快照，不是当前调度权限。当前产品状态请看 [ZH-LAO 产品开发全景](/developer/)，执行规格请看 `.specify/` 与 `specs/`，真实完成请以代码、测试与 CI 为准。


# ZH-LAO  — Learning Independent Design Audit

> 本审计独立核对 remote repository reality、`0500_learning.sql`、Learning frozen domain docs、Content/Identity/Operations public boundaries、Product Semantics、Use Cases、Progress/Practice、HTTP/Public Contracts 与 Implementation Plan。没有为了 PASS 假装 schema 已经拥有不存在的 revision/public-attempt 字段，也没有进入 implementation。

## 1. Repository audit

设计入口 remote `main`：

```text
HEAD = f5b3f3f41468036ecbd1544c6a9b3c5fbf9668db
commit = docs(platform): sync final audit fixes
branch = main
```

Current migration registry：

```text
SQL migrations = 18
latest forward migration = 1250_platform_override_indexes.sql
Learning authority = 0500_learning.sql
Learning migration changed by this task = NO
```

Current CI source：

```text
.github/workflows/foundation.yml
```

它覆盖 backend verify/build/integration、database test/validate、Admin verify/e2e、docs build，以及 non-blocking mobile verify。

Pre-audit design diff from entry HEAD to `e11735e...` only contains six new Learning design documents；no application code、no migration、no upstream Domain code。

Final seventh document is this audit。

## 2. Upstream Gate reality

### Identity

```text
IDENTITY_GATE = PASS / FROZEN
apps/backend/src/modules/identity/public = PRESENT
```

Current `IdentityPublicQueries`只公开 account status / active / summary；没有 learning-direction API。Learning design没有发明这个字段，runtime user scope来自 AuthContext。

Result：PASS。

### Platform / Foundations

Progress evidence：Platform、Admin Foundation、Mobile Foundation均已 PASS/FROZEN/COMPLETE as applicable。Foundation shared PostgreSQL/outbox/CI可作为未来 implementation dependency。

Result：PASS。

### Operations

Actual `apps/backend/src/modules/operations/public`已经存在；permission catalog当前只包含 Operations/Platform keys。`04-operations` current docs仍没有 final implementation report / authoritative `OPERATIONS_GATE = PASS`。

Learning只冻结未来 requirement：

```text
learning.support.read
```

本设计任务没有修改 Operations catalog。Admin support implementation必须等 Operations final Gate并按 Operations-owned extension path集成。

Result：DESIGN DEPENDENCY FROZEN；not a Learning Design blocker。

### Content

```text
CONTENT_DESIGN_GATE = PASS
Content API/Public/Trusted Scoring design = FROZEN
apps/backend/src/modules/content/public = NOT PRESENT on audited entry state
CONTENT_GATE = NOT PASS / not evidenced
```

因此：

```text
LEARNING_IMPLEMENTATION = BLOCKED_BY_CONTENT_GATE
```

Learning design可以完成，但 Implementation不得开始。

## 3. Frozen table audit

`0500_learning.sql`实际仍是 10 张表：

```text
learning_activities
course_progress
lesson_progress
content_mastery
content_reviews
content_bookmarks
exercise_attempts
question_attempts
dictionary_search_history
translation_requests
```

Design没有新增业务表、没有修改字段/constraint、没有假装存在：

```text
unit_progress
lesson_item_progress
question_reviews
attempt public_id
translation public_id
content_revision_id on Learning tables
idempotency_key
review ease/interval
```

Result：PASS。

## 4. Public ID / cross-domain audit

| Learning field | Physical type | Owner logical ID | Result |
| --- | --- | --- | --- |
| `user_id` | UUID | Identity UserPublicId | PASS |
| `course_id` | UUID | Content CoursePublicId | PASS |
| `last_lesson_id` | UUID | Content LessonPublicId | PASS |
| `lesson_id` | UUID | Content LessonPublicId | PASS |
| `last_section_id` | UUID | Content LessonSectionPublicId | PASS |
| `content_id` | UUID | Content ContentPublicId | PASS |
| `exercise_id` | UUID | Content ExercisePublicId | PASS |
| `question_id` | UUID | Content QuestionPublicId | PASS |

Internal BIGINT：

- `learning_activities.id`：never public；
- `exercise_attempts.id`：only inside Learning persistence / encrypted attempt token；
- `question_attempts.id`：never public；
- `dictionary_search_history.id`：only opaque cursor tie-break, not visible contract；
- `translation_requests.id`：only persistence / encrypted translation token。

No cross-domain BIGINT leak。No cross-domain physical FK。

Result：PASS。

## 5. Activity audit

Frozen 8 activity types exactly match migration。Design separates：

```text
immutable learning history
!= current progress/mastery/review state
!= event sourcing
!= generic clickstream/analytics
```

Transition activities occur only on first real state transition and share transaction with current-state mutation。Metadata allowlist excludes answers、translation text、tokens、internal IDs。

Result：PASS。

## 6. Course progress audit

Physical Course/Lesson schema has no optional Lesson flag。Design closes this ambiguity：

```text
all Lessons in resolved published Course structure are completion-required V1
```

- no-row read -> virtual not_started；
- Start idempotent；
- percentage server-owned, monotonic, round2；
- resume anchor forward-only；
- 0-Lesson Course not completable；
- completed terminal；Content revision does not reopen completed Course。

No client percentage trust。No Unit progress。

Result：PASS。

## 7. Lesson progress / completion audit

Physical Section has public UUID；LessonItem没有 public ID but has `is_required` and Exercise/Knowledge internal refs that Content can translate to stable public roots in a trusted view。

Design completion guard：

```text
lastSection == final Section
AND every required Exercise item has a completed Learning attempt
```

Required Knowledge items initialize Mastery/Review at first Lesson completion；no per-item progress table。

### Content contract implementation dependency

Learning cannot direct SQL `content.lesson_items`。Content final public module therefore must provide a typed trusted Lesson learning-structure view exposing：

```text
ordered Section public UUIDs
required Knowledge Content UUIDs
required Exercise UUIDs
```

Current Content design already owns Lesson structure and exposes Lesson/Content read semantics, but final public implementation is not present。Learning LRN-00 must verify this exact capability；if absent, implementation BLOCKS until Content owner exposes it through a compatible public contract。

This is an explicit upstream implementation dependency, not an unresolved Learning product decision and not a database conflict。

Result：PASS WITH ENTRY-GATE DEPENDENCY。

## 8. Revision audit

Important physical fact：`0500_learning.sql` has **zero revision UUID columns**。

Also `content.content_revisions` superseded rows do not retain a reusable `published_at` history value under the current physical check；therefore Learning cannot reconstruct “which revision was active at attempt start” from timestamps after losing the token。

Design does not fake this capability：

- progress/mastery/review/bookmark use stable entity UUID；
- historical question answer/result is preserved；
- long-term exact old-question replay is explicitly Deferred；
- in-progress exact revision is carried only by encrypted attempt token；
- revision ID is not hidden inside `answer_data`/generic metadata。

Result：

```text
DATABASE_CONTRACT_CONFLICT = 0
PERSISTED_REVISION_PIN = NOT_SUPPORTED_BY_CURRENT_SCHEMA
V1_LONG_TERM_EXACT_REPLAY = DEFERRED
```

PASS。

## 9. Mastery audit

Frozen deterministic V1 policy：

```text
again -20 / incorrect+1
hard  +5 / correct+1
good +15 / correct+1
easy +25 / correct+1
```

Score clamp 0..100；status thresholds：learning 0..39, familiar 40..79, mastered 80..100；no row = virtual new。`mastered_at` tracks current mastered entry and clears on regression。

Design intentionally does **not** infer mastery target from arbitrary Exercise prompt/reference/answer rule because Content trusted scoring contract has no frozen unique mastery-target mapping。

Result：PASS。

## 10. Review scheduling audit

No ease/interval columns exist，so V1 uses schema-compatible deterministic scheduling only：

```text
initial = +1 day / priority 50
again   = +10m / 100
hard    = +1d / 75
good    = exponential days capped 30 / 50
easy    = doubled exponential days capped 60 / 25
```

Submit requires existing due review + `expectedUpdatedAt`；lock mastery then review；stale concurrent submission cannot double-count。

FSRS/SM-2 deferred rather than hidden in metadata。

Result：PASS。

## 11. Practice attempt audit

### Lifecycle

```text
in_progress -> completed
in_progress -> abandoned
```

### Active attempt

DB has no partial unique `(user,exercise) WHERE in_progress`，so design uses transaction advisory lock + application invariant one active attempt。

### maxAttempts

Content physical `max_attempts` is enforced at Start。All created attempt rows (completed/abandoned/current) count，so abandon cannot bypass the limit。

### Critical no-reissue finding resolved

Early draft wording considered “reuse active attempt”。Independent audit rejected that because persisted Learning row has no revision pin。Final canonical contract is：

```text
Start finds active -> 409 LEARNING_ATTEMPT_ALREADY_IN_PROGRESS
server never guesses revision / never reissues token
```

Lost-token recovery explicitly abandons current active attempt by authenticated user + Exercise UUID under advisory lock，then starts a new attempt if maxAttempts allows。

This avoids false correctness at the cost of a known V1 UX limitation。

Result：PASS。

## 12. Question answer / scoring audit

Content Question has no optional flag，so all Questions in pinned Exercise revision are completion-required。

Trusted flow：

```text
encrypted attempt token exact revision
-> Content resolvePracticeForScoring
-> typed user answer validation
-> server-side deterministic scoring
-> Learning stores answer_data/result only
```

One canonical answer per `(attempt,question)` matches DB UNIQUE。Same normalized answer retry returns stored result；different answer conflicts。Answer immutable。

No answer key before evaluation；public mapper cannot serialize trusted scoring fields。

Partial credit semantics align with nullable `is_correct` + decimal `earned_score`；full-correct only sets true。

Result：PASS。

## 13. Attempt completion concurrency audit

Complete and answer both lock ExerciseAttempt root。Commit order determines outcome：

- answer obtains root first -> answer can be included；
- complete obtains root first -> terminal state causes late answer conflict。

Duplicate Complete returns same persisted final result；owner event emitted only on first terminal transition。

Result：PASS。

## 14. Dictionary history audit

Physical `user_id NOT NULL` -> V1 authenticated history only。Actual dictionary search stays Content-owned。Learning records query intent + optional selected Content UUID；no public history row identity；bounded pagination；retention 180 days / max500 per user is compatible with disposable history facts。

Result：PASS。

## 15. Translation audit

Physical status supports pending/processing/succeeded/failed，but no retry counter/lease timestamp/idempotency key。

Design therefore uses：

- encrypted owner token, not BIGINT；
- server-selected provider/model；
- unconfigured production provider fail closed；
- PostgreSQL session advisory lock across provider call；
- short transactions before/after provider call；
- processing candidate reclaim only after acquiring lock；
- final state CAS first-terminal-wins；
- bounded adapter-local transient retry；
- no fake durable retry state；
- 10/min,200/day bounded rate policy；
- 30-day retention；
- no translation history list。

If DB session is lost while an external provider call still completes，provider invocation can be at-least-once；translation generation is treated as a replayable computation, while canonical final row remains one terminal state。Current schema cannot truthfully promise exactly-once provider invocation。

Privacy：source/result full text excluded from ordinary logs、outbox、default Admin；token header redacted。

Result：PASS。

## 16. Ownership / IDOR audit

Runtime user scope only from AuthContext；no userId request override。Repository predicates always include current user。Attempt/Translation token additionally cryptographically binds current user。

Foreign/tampered token is externally indistinguishable from not-found。Admin support is separate Operations-authorized context with explicit target Identity UUID。

Result：PASS。

## 17. Public contract audit

V1 cross-domain synchronous surface is intentionally minimal：Course/Lesson completion natural-key reader only。

Versioned owner events：

```text
learning.lesson_completed.v1
learning.course_completed.v1
learning.exercise_completed.v1
```

No generic cross-domain mastery/progress reader without a real consumer。No raw answer、translation、bookmark、search history export。No attempt public ID invented。

Result：PASS。

## 18. Outbox / future Rewards audit

Shared `infrastructure.system_outbox_events` can transactionally store completion events。Payload uses stable UUID + occurredAt + optional scorePercent；no attempt BIGINT/answer/token。

Rewards owns grant/rule/wallet semantics；Learning only publishes owner facts。

Result：PASS。

## 19. Admin / Operations permission audit

V1 proposes only：

```text
learning.support.read
```

Capability is read-only support diagnostics，not table-by-table edit permissions。Current Operations code catalog does not yet contain it；design correctly defers catalog mutation to formal implementation after Operations Gate。

Result：PASS WITH IMPLEMENTATION DEPENDENCY。

## 20. Cache / infrastructure audit

No evidence requires Redis、Kafka、search engine or separate Learning service。

```text
PostgreSQL first
Redis = 0 required
Kafka = 0 required
Learning microservice = 0
```

Result：PASS。

## 21. Concurrency audit

Frozen mechanisms cover：

- concurrent StartCourse/StartLesson；
- CompleteLesson vs progress update；
- ReviewResult double submit；
- Bookmark add/remove；
- simultaneous StartExercise；
- maxAttempts boundary；
- same/different answer retry；
- CompleteExercise vs late answer；
- lost-token recovery abandon；
- translation double claim / crash reclaim；
- terminal completion outbox exactly once。

Lock order is explicit；no DB trigger/distributed transaction introduced。

Result：PASS。

## 22. API audit

Runtime endpoints map to product capabilities：Home、Course/Lesson progress、Mastery/Review、Bookmarks、Practice、Dictionary History、Translation。No table CRUD smell。

Security-sensitive decisions are explicit：

- attempt active -> 409, no token reissue；
- abandon-active recovery endpoint；
- all pinned Questions required；
- token headers never URL/log；
- answer truth not returned；
- no runtime userId input；
- Learning current state `private,no-store`。

Admin endpoints are read-only support diagnostics。

Result：PASS。

## 23. Implementation plan audit

LRN-00~LRN-14 defines Goal/Scope/Dependency/Files/Tests/Audit/Gate and stops at design。

Critical entry rules：

```text
CONTENT_GATE != PASS -> STOP
Content trusted Lesson learning-structure capability missing -> STOP
Content trusted scoring implementation missing -> STOP
Admin support requires OPERATIONS_GATE = PASS
```

No implementation task was executed by this design session。

Result：PASS。

## 24. Independent smell checklist

```text
table-driven CRUD                       = PASS
Learning owns Content definitions       = PASS (NO)
Learning direct SQL Content/Identity     = PASS (FORBIDDEN)
cross-domain BIGINT leak                 = PASS (0)
fake public IDs for internal rows        = PASS (0)
revision field invented in Learning      = PASS (0)
active attempt revision guessed/reissued = PASS (FORBIDDEN)
answer leakage                           = PASS
client-owned progress percentage         = PASS (FORBIDDEN)
review race ambiguity                    = PASS
maxAttempts ambiguity                    = PASS
Lesson completion ambiguity              = PASS
Exercise completion ambiguity            = PASS
translation fake provider prod default   = PASS (FORBIDDEN)
translation plaintext logging            = PASS (FORBIDDEN)
generic Learning analytics bucket        = PASS (FORBIDDEN)
premature Redis/Kafka                    = PASS (0)
```

## 25. Findings

### LOW-01 — Repository progress-state drift

`DEVELOPMENT_PROGRESS.md` does not fully reflect actual Operations implementation activity / Content design artifacts present on current main。This does not prove missing Gates are PASS；therefore Learning correctly relies on explicit final Gate evidence rather than optimistic inference。

Action：phase owners synchronize authoritative progress only when their final reports/Gates exist。Out of scope for this Learning Design task。

### LOW-02 — CI Mobile comment drift

`foundation.yml` comments still describe Mobile Foundation as IN_PROGRESS/non-formal while current progress evidence says Mobile Foundation completed/pass。CI job itself remains non-blocking。Documentation comment drift only；not a Learning contract blocker。

Action：Foundation/Mobile owner may synchronize wording separately。

## 26. Accepted V1 limitations / TECH_DEBT

These are explicit scope decisions, not unresolved product questions：

- no persisted Content revision pin in Learning rows；
- no long-term exact historical practice replay；
- no ExerciseAttempt stable public UUID；
- StartExercise transport success cannot be safely reissued after response/token loss；recovery is abandon-active + new attempt；
- no non-destructive cross-device active-attempt resume；
- generic Exercise result does not update mastery until Content freezes explicit mastery-target mapping；
- no FSRS/SM-2 persistent state；
- no translation transport idempotency key；
- external translation provider invocation can be at-least-once in extreme session-loss recovery；
- no manual progress/mastery correction V1；
- no question-review notebook；
- no automated Translation Request -> Content promotion。

## 27. Severity / Gate inputs

```text
BLOCKER = 0
HIGH = 0
MEDIUM = 0
LOW = 2

UNRESOLVED_PRODUCT_DECISIONS = 0
DATABASE_CONTRACT_CONFLICT = 0
CROSS_DOMAIN_OWNERSHIP_AMBIGUITY = 0
INTERNAL_BIGINT_PUBLIC_LEAK = 0
LEARNING_MIGRATION_CHANGES = 0
```

## 28. Learning Design Result

```text
LEARNING DESIGN RESULT

Repository entry HEAD = f5b3f3f41468036ecbd1544c6a9b3c5fbf9668db
Learning frozen tables = 10
0500 migration changes = 0
New business tables = 0

Product Semantics = FROZEN
Use Cases = FROZEN
Progress Contract = FROZEN
Mastery Contract = FROZEN
Review Contract = FROZEN
Practice/Scoring Contract = FROZEN
Runtime Translation Contract = FROZEN
HTTP API = FROZEN
Public Contract / Events = FROZEN
Implementation Plan = FROZEN

Use Cases:
REQUIRED = 25
DEFERRED = 12
NOT_SUPPORTED = 14

Identity boundary = PASS
Content ownership boundary = PASS
Operations permission requirement = FROZEN
Public ID audit = PASS
IDOR/privacy audit = PASS
Answer leakage audit = PASS
Concurrency audit = PASS
Outbox audit = PASS
Database Contract Conflict = 0

Findings:
BLOCKER = 0
HIGH = 0
MEDIUM = 0
LOW = 2

Content Design Gate = PASS
Content Implementation Gate = NOT EVIDENCED
Learning Implementation dependency = CONTENT_GATE
Learning Implementation started = NO

LEARNING_DESIGN_GATE = PASS
```

## 29. STOP

Design Gate complete。This task must stop here。

Do not continue in this session with：

```text
apps/backend/src/modules/learning implementation
Learning routes/repositories/workers
0500 migration changes
Operations permission catalog code change
Content/Identity code change
Admin/Mobile feature implementation
LEARNING_GATE declaration
```

Formal implementation begins only in a separate execution task after remote `main` proves required upstream Gates。
