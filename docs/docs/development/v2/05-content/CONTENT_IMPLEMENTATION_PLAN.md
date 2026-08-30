---
status: frozen
phase: 5
phase_name: Content Domain
document: CONTENT_IMPLEMENTATION_PLAN
design_only: true
implementation_started: false
last_updated: 2026-08-31
repository_commit_audited: 007d6ad705a9afcc4fefb03442e371b4dec07fad
implementation_dependency: OPERATIONS_GATE
---

# ZH-LAO V2 — Content Implementation Plan

> 本文件只冻结未来执行顺序。本次 Design 会话不得执行任何 CNT implementation task。

## 1. Entry Gate

正式开始 CNT-01 前必须重新读取远程 `main` 并确认：

```text
Identity Gate = PASS
Platform Gate = PASS
Operations Final Gate = PASS
Content Design Gate = PASS
0400_content.sql unchanged
1240_content_revision.sql available
```

当前审计状态：Operations 已出现 implementation commits，但 canonical final `OPERATIONS_GATE = PASS` / implementation report尚不存在。因此：

```text
CONTENT_IMPLEMENTATION_STARTED = NO
CONTENT_IMPLEMENTATION_DEPENDENCY = OPERATIONS_GATE
```

禁止通过复制 RBAC、临时 admin secret、直接查 `operations.*` 绕过依赖。

## 2. Database Rule

- 不修改 frozen `0400_content.sql`；
- 不回写历史 migration；
- 31 core tables不增删；
- revision 使用现有 `1240_content_revision.sql`；
- 若实现发现真正 physical blocker，只能先停止、记录 `DATABASE_CONTRACT_CONFLICT`，经设计审批后新建 forward migration；
- cross-domain FK = 0；
- Content internal BIGINT不得出 module public/API。

## 3. Task Sequence

### CNT-00 — Design Freeze

**Goal**：把本目录六份 canonical design docs作为 implementation authority。

**Scope**：Product semantics / Use Cases / API / Public Contract / Plan / Audit。

**Dependencies**：none for design。

**Files**：`docs/docs/development/v2/05-content/*`。

**Tests**：document cross-check；migration unchanged check。

**Audit**：open decisions=0、DB conflict=0。

**Gate**：`CONTENT_DESIGN_GATE = PASS`。

### CNT-01 — Module Skeleton / Domain Types

**Goal**：建立 `apps/backend/src/modules/content/{domain,application,infrastructure,public,http}` boundary。

**Scope**：UUID brands、language/type/status enums、errors、DTO schemas；不做业务 route。

**Dependencies**：Operations Final Gate；CNT-00。

**Files**：Content module skeleton + import-boundary tests。

**Tests**：forbidden imports、enum/UUID validation、no route registration。

**Audit**：Content不依赖 Learning/Audio persistence。

**Gate**：typecheck/lint/unit PASS。

### CNT-02 — Repository Layer

**Goal**：映射 31 core tables + `content_revisions`，保持 transaction executor scope。

**Scope**：repositories、row mappers、`SELECT FOR UPDATE` primitives、revision repository。

**Dependencies**：CNT-01。

**Files**：`content/infrastructure/postgres/*`。

**Tests**：fresh PostgreSQL integration、FK/unique/rollback/lock behavior。

**Audit**：migration changes=0；cross-domain SQL=0。

**Gate**：repository integration PASS。

### CNT-03 — Knowledge Registry / Knowledge Reads

**Goal**：实现 atomic Registry+subtype、typed discriminated read model。

**Scope**：8 registry types、composition relations、public active reads。

**Dependencies**：CNT-02。

**Files**：domain/application knowledge services + repository mappers。

**Tests**：type/language mismatch、atomic rollback、all 8 type views。

**Audit**：internal BIGINT DTO exports=0。

**Gate**：knowledge read/create core PASS。

### CNT-04 — Knowledge Authoring / Revisions

**Goal**：实现 meanings/translations/examples/pronunciation/relations/tags 与 draft/publish lifecycle。

**Scope**：UC-R13..R18、content/translation-set revisions、status transitions。

**Dependencies**：CNT-03。

**Files**：application commands/revision snapshot codecs。

**Tests**：primary translation, sense ordering, relation language, example sentence type, stale update, publish race。

**Audit**：runtime translation facts=0；audio workflow facts=0。

**Gate**：Knowledge contract PASS。

### CNT-05 — Dictionary

**Goal**：实现 bounded exact/prefix/trigram word lookup。

**Scope**：zh simplified/traditional/pinyin；lo text/romanization；filters/ranking/cursor。

**Dependencies**：CNT-03。

**Files**：dictionary query repository/application。

**Tests**：exact ranking、prefix、trigram、language filters、limit/query bounds、empty result。

**Audit**：Redis/ES=0；unbounded search=0。

**Gate**：Dictionary contract PASS。

### CNT-06 — Curriculum Reads

**Goal**：提供 Mobile-oriented aggregate read model。

**Scope**：BrowseCourses/GetCourse/GetCourseStructure/GetLesson/GetLessonContent。

**Dependencies**：CNT-02、CNT-03。

**Files**：curriculum query services/DTO mappers。

**Tests**：published visibility、ordering、Unit/Item no ID leak、N+1 query budget/integration。

**Audit**：table CRUD API=0。

**Gate**：runtime curriculum reads PASS。

### CNT-07 — Curriculum Authoring / Lifecycle

**Goal**：实现 Course/Lesson/Section/Item authoring、aggregate replacement、publish/archive。

**Scope**：UC-R19..R26；Course/Lesson revisions；asset/content/exercise refs validation。

**Dependencies**：CNT-04、CNT-06。

**Files**：curriculum commands/repositories/revision codecs。

**Tests**：reorder unique collision、expectedUpdatedAt、publish-vs-edit、archive/history、invalid refs rollback。

**Audit**：published logical UUID不可破坏；Unit/Item remain internal。

**Gate**：Curriculum contract PASS。

### CNT-08 — Practice Definitions

**Goal**：实现 Exercise/Question aggregate与 safe/scoring 双 view。

**Scope**：8 question types、contents/options/rules、revisions、publish。

**Dependencies**：CNT-04。

**Files**：practice domain/application/repository/snapshot codecs。

**Tests**：option cardinality、answer rule compatibility、ordering、media/content refs、all type fixtures。

**Audit**：attempt/result writes to Content=0。

**Gate**：Practice contract PASS。

### CNT-09 — Public Cross-Domain Contract

**Goal**：实现 `modules/content/public` typed queries。

**Scope**：entity resolution、revision resolution、Learning scoring resolver、Audio source validation。

**Dependencies**：CNT-03/07/08。

**Files**：`apps/backend/src/modules/content/public/*`。

**Tests**：consumer-facing contract tests、forbidden export tests、historic revision resolution。

**Audit**：repositories/DB executors/SQL/BIGINT exports=0。

**Gate**：Public Contract PASS。

### CNT-10 — Runtime HTTP/API

**Goal**：实现 frozen safe runtime endpoints。

**Scope**：course/lesson/knowledge/dictionary/practice read paths。

**Dependencies**：CNT-05/06/08/09；Platform HTTP foundation。

**Files**：Content HTTP routes/schemas/mappers/composition。

**Tests**：schema strictness、404 visibility、pagination、ETag、no internal IDs、no answers。

**Audit**：direct repository access from route=0；SQL in HTTP=0。

**Gate**：Runtime API PASS。

### CNT-11 — Admin Management API + Operations Integration

**Goal**：实现 frozen admin endpoints并接入 Operations authorization/audit。

**Scope**：8 Content permission requirements；knowledge/curriculum/practice admin routes。

**Dependencies**：**OPERATIONS_GATE PASS**；CNT-04/07/08/09。

**Files**：Operations permission catalog extension + Content admin routes/composition；只按 Operations extension contract修改，不改变 RBAC semantics。

**Tests**：permission matrix 8 keys、inactive operator、role changes、unknown field、success-only audit、last-super-admin不受破坏。

**Audit**：wildcard=0；per-table permission=0；RBAC copy=0。

**Gate**：Admin authorization integration PASS。

### CNT-12 — Asset / Audio Integration Contract

**Goal**：把 logical asset refs 与 official Audio source/revision bridge落地。

**Scope**：asset validation/resolution boundary；Audio source validation；official audio read composition。

**Dependencies**：CNT-09；Audio implementation只在其 Phase 允许时接真实 provider，否则以 contract test/fake boundary完成 Content side。

**Files**：public adapters/interfaces/composition wiring。

**Tests**：invalid asset/source/revision、revision mismatch、no storage facts、no Audio repository import。

**Audit**：cross-domain FK/SQL=0。

**Gate**：boundary contract PASS。

### CNT-13 — Integration / Domain E2E

**Goal**：在真实 PostgreSQL跑完整 Content workflows。

**Scope**：knowledge publish -> course/lesson compose -> practice -> runtime reads -> historical revision。

**Dependencies**：CNT-10/11/12。

**Files**：Content PostgreSQL integration/E2E suites。

**Tests**：fresh DB、real repositories、auth integration、rollback、public UUID consistency。

**Audit**：core mocks=0 for domain E2E。

**Gate**：E2E PASS。

### CNT-14 — Security / Answer Leakage

**Goal**：独立安全审计与 regression suite。

**Scope**：answer leakage、draft exposure、IDOR/authz、mass assignment、search bounds、asset/storage leakage、log redaction。

**Dependencies**：CNT-10/11。

**Files**：security test suite。

**Tests**：all forbidden fields/paths；permission negative matrix。

**Audit**：HIGH/BLOCKER security finding=0。

**Gate**：Security PASS。

### CNT-15 — Concurrency / Race

**Goal**：证明 frozen mutation semantics在并发下成立。

**Scope**：duplicate create、registry+subtype、edit-vs-edit、publish-vs-edit、publish-vs-publish、reorder-vs-reorder、archive-vs-read、question mutation races。

**Dependencies**：CNT-04/07/08/11。

**Files**：PostgreSQL race suite。

**Tests**：barrier-driven deterministic races，不以 sleep 猜时序。

**Audit**：lost update=0；unique/lock failures typed mapping。

**Gate**：Race PASS。

### CNT-16 — Final Audit / Report / Exit Gate

**Goal**：独立验证实现与本文六份设计、0400/1240、跨域 contracts一致。

**Scope**：typecheck/lint/tests/build/fresh migrations/database audit/API/public contract/security/race/scope。

**Dependencies**：CNT-01..15 complete。

**Files**：`CONTENT_IMPLEMENTATION_REPORT.md` + progress sync。

**Tests**：全量 backend regression + Content E2E/security/race。

**Audit**：migration changes reviewed；forbidden dependency scans；docs drift scan。

**Gate**：只有 BLOCKER/HIGH=0 且所有 required Use Cases完成时才允许 `CONTENT_GATE = PASS` / Domain frozen。

## 4. Permission Catalog Extension Sequence

CNT-11 必须遵循 Operations 已冻结 catalog evolution：

1. Content owner contract已经冻结 8 keys；
2. 扩 `OPERATOR_PERMISSION_CATALOG`；
3. 在开放新 route前 reconciliation 所有 active `super_admin` exact permission set；
4. 验证 custom roles不自动获权；
5. 再注册/开放 Content management capability。

禁止 wildcard或启动时后台偷偷 seed。

## 5. Testing Baseline

每一 CNT task 都必须保持现有 Identity/Platform/Operations regressions通过。Fresh database必须执行当前完整 migration registry；不得只跑 `0400` 创建私有测试 schema而错过 1240 revision contract。

## 6. Hard Stop for This Design Task

本文件创建时：

```text
CNT-00 = DESIGN ARTIFACT ONLY
CNT-01..CNT-16 = NOT_EXECUTED
CONTENT_IMPLEMENTATION_STARTED = NO
```

不得因 Plan 已冻结而在同一设计任务继续写 Content backend、Admin或Mobile。
