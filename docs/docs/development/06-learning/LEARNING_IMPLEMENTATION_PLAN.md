---
status: frozen
phase: 6
phase_name: Learning Domain
document: LEARNING_IMPLEMENTATION_PLAN
design_only: true
implementation_started: false
last_updated: 2026-09-02
lifecycle: historical
derived_from: domains/learning/index.md
---


# ZH-LAO  — Learning Implementation Plan

⚠️ **派生文档（DERIVED）** — 规范归属（canonical owner）：`domains/learning/index.md`。本文件为实现轨（implementation-track）文档，**不是产品/领域事实权威**（Constitution 原则 II）。产品/领域事实以规范归属文档为准，请勿在此重复或自行修改事实。




> 本计划只冻结未来 Learning Implementation 的执行顺序、依赖、文件边界与 Gate。**本设计任务不得执行以下 implementation tasks。**

## 1. Entry Gate

正式实现前必须重新读取 remote `main` 并证明：

```text
IDENTITY_GATE = PASS
CONTENT_GATE = PASS
```

当前设计时实况：

```text
Identity Gate = PASS
Content Design Gate = PASS
Content Implementation Gate = NOT PASS / implementation not present
Learning Implementation = BLOCKED_BY_CONTENT_GATE
```

Learning Admin support integration另外要求：

```text
OPERATIONS_GATE = PASS
```

如果 `CONTENT_GATE != PASS`：STOP，不创建 `modules/learning` implementation，不 direct SQL `content.*` 补洞。

## 2. Frozen constraints carried into implementation

- `0500_learning.sql` 不修改；
- 10 张 Learning tables，不新增业务表；
- cross-domain reference只用 logical UUID；
- runtime不暴露 internal BIGINT；
- Content scoring只走 server-only trusted public contract；
- Identity只走 `modules/identity/public`；
- completion event只走 shared `infrastructure.system_outbox_events`；
- PostgreSQL first；无 Redis/Kafka/microservice；
- production translation provider未配置时 fail closed；Fake只允许 tests；
- Runtime API user scope只来自 AuthContext；
- Admin V1 read-only diagnostics only。

## 3. Task graph

```text
LRN-00 Design Freeze / Entry Audit
  -> LRN-01 Module Skeleton / Core Types / Token Codec
  -> LRN-02 Repositories / Locking Primitives
  -> LRN-03 Activity Facts
  -> LRN-04 Course & Lesson Progress
  -> LRN-05 Mastery & Review Scheduling
  -> LRN-06 Bookmarks & Dictionary History
  -> LRN-07 Practice Attempts & Trusted Scoring
  -> LRN-08 Runtime Translation Worker
  -> LRN-09 Public Contract & Completion Outbox
  -> LRN-10 Runtime HTTP/API
  -> LRN-11 Operations/Admin Support Integration
  -> LRN-12 Integration / Mobile-contract E2E
  -> LRN-13 Security / Race / Privacy Audit
  -> LRN-14 Final Report / Exit Gate
```

Parallel work只允许在依赖明确且不共享 unfinished contract时进行。

---

## LRN-00 — Design Freeze / Entry Audit

**Goal** 重新确认实现入口没有上游漂移。

**Scope**

- remote `main` HEAD；
- `0500_learning.sql` SHA/10-table count；
- migration registry/count；
- Content final implementation report/Gate + actual `content/public`；
- Identity final Gate + actual public contract；
- Operations final Gate/public permission catalog；
- Foundation TransactionManager/Outbox/Worker conventions；
- current CI。

**Files** no business code。

**Tests/Audit** compare frozen Learning design vs actual upstream public types；field-by-field public UUID check。

**Gate** `CONTENT_GATE != PASS` -> BLOCK and STOP。

---

## LRN-01 — Module Skeleton / Core Types / Token Codec

**Goal** 建立纯 module boundary 与安全 identity/token primitives。

**Scope**

- `apps/backend/src/modules/learning/` skeleton；
- domain value types/enums；
- application ports；
- `public/` boundary shell；
- attempt/translation token authenticated-encryption codec；
- strict token redaction hooks。

**Dependencies** LRN-00 PASS；Foundation crypto/config/log conventions。

**Files** expected：

```text
apps/backend/src/modules/learning/domain/**
apps/backend/src/modules/learning/application/**
apps/backend/src/modules/learning/public/**
apps/backend/src/modules/learning/infrastructure/token/**
```

**Tests** enum/schema tests；token tamper/user binding/key-version/redaction tests；architecture import-boundary tests。

**Audit** no SQL/routes/repos yet；no BIGINT public type。

**Gate** `LRN-01 = PASS`。

---

## LRN-02 — Repositories / Locking Primitives

**Goal** 对 10 张 frozen table建立 Learning-only persistence layer。

**Scope**

- activity repository；
- course/lesson progress repos；
- mastery/review/bookmark repos；
- exercise/question attempt repos；
- dictionary/translation repos；
- transaction-scoped advisory lock helper for user+exercise；
- session advisory lock helper for translation worker；
- ordered row-lock helpers。

**Dependencies** LRN-01；Foundation DatabaseExecutor/TransactionManager。

**Files** `modules/learning/infrastructure/postgres/**`。

**Tests** real PostgreSQL repository mapping/constraint/rollback/lock tests。

**Audit** SQL schema prefix只能 `learning.*`，shared outbox exception在 owner event writer；`content.*`/`identity.*` SQL occurrence = 0。

**Gate** repository contract maps exactly to `0500_learning.sql`。

---

## LRN-03 — Activity Facts

**Goal** 实现 frozen 8-type learning history contract。

**Scope** typed activity payload/metadata validation；append helper；query recent activity。

**Dependencies** LRN-02。

**Files** application activity service + repo tests。

**Tests** allowed enum；typed metadata；transition retry不重复 activity；no raw answers/translation text in metadata。

**Audit** generic telemetry/pageview API = 0。

**Gate** Activity Contract PASS。

---

## LRN-04 — Course & Lesson Progress

**Goal** 实现 Start/Resume/Advance/Complete与联动。

**Scope**

- Get/Start/Resume/Complete Course；
- Get/Start/Update/Complete Lesson；
- Content entity/parent/structure validation through `content/public`；
- monotonic percent/resume anchor；
- Lesson completion auto Course recalc/completion；
- Lesson/Course owner-event transaction hook；
- Learning Home progress slice。

**Dependencies** LRN-03；Content Gate/public contract。

**Files** application use cases + repositories/tests。

**Tests** missing-as-virtual-not-started；duplicate start/complete；Content archived history；concurrent devices；lock order；no client percent trust。

**Audit** no Unit/Item persistence；no revision fake field。

**Gate** Progress Contract PASS。

---

## LRN-05 — Mastery & Review Scheduling

**Goal** 实现 deterministic V1 mastery + spaced review。

**Scope** initialization from completed Lesson required knowledge；Get mastery；Get due reviews；SubmitReviewResult；batch Content enrichment。

**Dependencies** LRN-04 + Content Lesson read model能解析 required knowledge UUID。

**Files** mastery/review policy pure functions + application use cases。

**Tests** score clamp/threshold transitions/mastered_at reset；review schedule exact boundary；expectedUpdatedAt stale race；due ordering/pagination。

**Audit** no hidden ease/interval fields；no generic exercise guessed mastery target；no manual mutation。

**Gate** Mastery/Review Contract PASS。

---

## LRN-06 — Bookmarks & Dictionary History

**Goal** 实现低复杂度 user-owned preference/history能力。

**Scope** list/add/remove/batch bookmark；record/list dictionary history；retention cleanup command/job。

**Dependencies** LRN-02 + Content public resolver。

**Files** application/repo/HTTP schemas later reused。

**Tests** add/remove idempotency；concurrent add/remove；disabled/archived bookmark；selectedContent validation；cursor stability；180-day/500-row cleanup。

**Audit** Content dictionary runtime remains Content-owned；anonymous history rejected。

**Gate** Bookmark/History PASS。

---

## LRN-07 — Practice Attempts & Trusted Scoring

**Goal** 实现最敏感的 server-trusted practice workflow。

**Scope**

- Start attempt + active-attempt advisory lock；
- pinned revision in opaque attempt token；
- typed answer validators for 8 question types；
- Content `resolvePracticeForScoring()` adapter；
- one canonical answer/question；
- complete/abandon/result；
- decimal-safe aggregate scoring；
- completion event hook。

**Dependencies** LRN-02/03；**Content final trusted scoring implementation required**。

**Files** application/practice/**, scoring adapter, schemas, tests。

**Tests** answer leakage negative tests；all question types；partial credit；same-answer retry/different-answer conflict；complete-vs-late-answer race；active attempt race；token tamper/foreign user；revision exactness during in-progress attempt。

**Audit** public mapper cannot serialize trusted answer keys；answer_data typed only；BIGINT never leaves module/token ciphertext。

**Gate** Trusted Scoring Boundary PASS。

---

## LRN-08 — Runtime Translation Worker

**Goal** 低运维地执行 runtime zh<->lo translation。

**Scope**

- RequestTranslation/GetTranslationRequest；
- provider interface + Fake test provider + Unavailable production fallback；
- PostgreSQL worker claim/session advisory lock/CAS；
- source length/rate limit；
- 30-day cleanup；
- privacy/redaction；
- metrics只记录 counts/latency/status，不记录全文。

**Dependencies** LRN-01/02；Foundation worker lifecycle/logging/config。

**Files** `application/translation/**`, `infrastructure/translation/**`, worker composition。

**Tests** success/failure/unconfigured provider；double-claim；worker crash/reclaim；provider call outside DB transaction；foreign token；rate limit；no plaintext logs。

**Audit** Redis/Kafka=0；Fake production default=0；provider/model not client-controlled。

**Gate** Translation Contract PASS。

---

## LRN-09 — Public Contract & Completion Outbox

**Goal** 落地最小 cross-domain surface与可靠 completion events。

**Scope** `LearningCompletionReader`；3 versioned event types；shared outbox writer mapping。

**Dependencies** LRN-04/07；Foundation outbox。

**Files** `modules/learning/public/**`, owner event mapper/writer。

**Tests** public export boundary；completion natural keys；event allowlist；terminal retry event exactly once；rollback removes both canonical write and outbox。

**Audit** raw answers/mastery/translation/history not public；outbox no BIGINT。

**Gate** Public Contract / Outbox PASS。

---

## LRN-10 — Runtime HTTP/API

**Goal** 按 `LEARNING_API.md` 暴露稳定 authenticated API。

**Scope** routes/controllers/Zod schemas/mappers；AuthContext ownership；opaque cursor；error mapping；token header redaction；Learning Home aggregation。

**Dependencies** LRN-04~09。

**Files** `modules/learning/http/**`, composition root wiring。

**Tests** route contract；strict unknown fields；401/404/409/429/503；IDOR；no BIGINT；no answer leakage；no secret-token logging。

**Audit** table CRUD endpoints = 0；userId runtime input = 0。

**Gate** Runtime API PASS。

---

## LRN-11 — Operations / Admin Support Integration

**Goal** 提供最小只读 support diagnostics。

**Scope**

- only after `OPERATIONS_GATE=PASS`；
- add exact catalog permission `learning.support.read` through Operations-owned approved integration path；
- Admin support HTTP endpoints；
- no Learning business mutation；
- translation plaintext excluded。

**Dependencies** Operations final public authorization implementation；LRN-10。

**Files** Learning Admin routes；Operations permission catalog change **only in the formal implementation task and only if Operations contract permits extension**；Admin UI implementation remains separate client phase unless Master Plan explicitly schedules it。

**Tests** 401/403/exact permission；target user lookup；no mutation routes；no plaintext translation exposure。

**Audit** no wildcard/per-table permission explosion。

**Gate** Admin Support Contract PASS。

---

## LRN-12 — Integration / Mobile-contract E2E

**Goal** 用真实 PostgreSQL与真实 Content/Identity public adapters验证主要 learner journey。

**Scope**

```text
start course
-> start/update/complete lesson
-> course progress/home
-> due review/result
-> bookmark
-> start exercise/answer/complete
-> dictionary history
-> translation request/worker/result
```

**Dependencies** LRN-10/11。

**Tests** PostgreSQL integration + Fastify API E2E；Content trusted scoring integration；Identity auth context；outbox rows。

**Audit** Mobile contract只使用 UUID/opaque tokens；no direct DB coupling。

**Gate** end-to-end backend contract PASS。

---

## LRN-13 — Security / Race / Privacy Audit

**Goal** 独立破坏性测试关键边界。

**Scope**

- IDOR across every user-owned resource；
- token tamper/replay/foreign user；
- answer leakage；
- stale/concurrent progress/review；
- attempt races；
- translation double worker/crash；
- log/outbox privacy；
- SQL/import boundary scan；
- no new migration/table/cache/broker。

**Dependencies** LRN-12。

**Tests** race/security suites required by Progress/API docs。

**Audit** BLOCKER/HIGH must be zero before exit。

**Gate** `LRN-13 = PASS`。

---

## LRN-14 — Final Report / Exit Gate

**Goal** 证明 Learning实现与 frozen design/DB/upstream contracts一致。

**Scope** final repository re-audit；all tests/CI；fresh DB migration validation；database audit；contract diff；implementation report；DEVELOPMENT_PROGRESS authoritative sync only if phase owner confirms all requirements。

**Expected report**：

```text
docs/docs/development/06-learning/LEARNING_IMPLEMENTATION_REPORT.md
```

**Required validation**：

```text
pnpm --dir apps/backend verify
pnpm --dir apps/backend build
pnpm --dir apps/backend test:integration
pnpm --dir database test
pnpm --dir database validate
pnpm --dir docs docs:build
```

plus Learning security/race suites and any current CI-required jobs。

**Gate** only when：

```text
BLOCKER = 0
HIGH = 0
migration/database contract = PASS
public-ID/IDOR/answer-leakage/privacy = PASS
Content/Identity integration = PASS
required tests = PASS
```

then：

```text
LEARNING_GATE = PASS
LEARNING_DOMAIN = FROZEN
```

## 4. Explicit implementation dependencies

| Capability | Upstream required before implementation |
| --- | --- |
| Course/Lesson progress | Content entity/structure public implementation |
| Mastery init | Content lesson required-knowledge read semantics |
| Practice | Content `resolvePracticeForScoring()` final implementation |
| Identity validation | Identity public contract already PASS |
| Admin support | Operations final Gate + exact authorization/catalog |
| Outbox | Foundation shared outbox already present |
| Translation worker | Foundation worker/database lifecycle |

## 5. TECH_DEBT / deferred implementation hooks

Do not accidentally implement these as hidden scope：

- persisted attempt public UUID；
- persisted Content revision pin in Learning rows；
- long-term exact historical practice replay；
- offline sync / lost-token cross-device recovery；
- adaptive mastery / FSRS；
- manual progress/mastery correction；
- question review notebook；
- translation promotion to Content；
- anonymous translation；
- Rewards grants/XP/streak business logic。

## 6. Exit from this design task

```text
Implementation Plan = FROZEN
Learning Implementation Started = NO
Current blocker = CONTENT_GATE
```

Do not execute LRN-01+ in the Learning Design session。
