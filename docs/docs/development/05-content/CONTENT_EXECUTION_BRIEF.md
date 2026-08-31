---
status: ready
phase: 5
phase_name: Content Domain
artifact: execution_brief
entry_gate: CONTENT_DESIGN_GATE = PASS
implementation_started: false
last_updated: 2026-08-31
---

# ZH-LAO  — Content Execution Brief

> 本文件是 **Content Domain 正式执行开发会话入口**。
>
> 它不是新的产品设计权威。执行 AI 必须先通过 GitHub 连接器读取远程 `main` 的真实状态，再严格执行当前 canonical Content 文档。
>
> 本会话只负责 Content Backend Implementation、测试、审计、报告与最终 Gate；不要开始 Learning、Audio Production 或 Content Admin 前端页面。

## 1. Mission

```text
Repository Re-Audit
→ Verify Entry Gates
→ Read Frozen Content Design
→ Execute CNT-00 ... CNT-xx
→ Runtime/API + Public Contract
→ Operations RBAC/Admin API Integration
→ PostgreSQL Integration / Security / Race
→ Full Regression
→ Final Audit
→ CONTENT_GATE
→ Freeze Content
→ STOP
```

## 2. Mandatory GitHub Entry Audit

开始任何代码修改前，必须使用 GitHub 连接器连接：

```text
repository = rzyao/ZH-LAO
branch = main
```

读取并记录：

```text
latest HEAD commit
MASTER_DEVELOPMENT_PLAN.md
DEVELOPMENT_PROGRESS.md
current CI workflows
current migration registry/count
04-operations/* current implementation/final reports
05-content/* canonical design docs
0400_content.sql
1240_content_revision.sql
current backend module conventions
identity/public
platform/public
operations/public
```

必须确认：

```text
CONTENT_DESIGN_GATE = PASS
Identity = COMPLETE / PASS / FROZEN
Platform = COMPLETE / PASS / FROZEN
Operations Final Gate = PASS
0400_content.sql unchanged
1240_content_revision.sql present
```

### Upstream status drift handling

如果代码中已经存在 Operations implementation，但：

```text
OPERATIONS_IMPLEMENTATION_REPORT.md missing
或
DEVELOPMENT_PROGRESS.md 未记录 OPERATIONS_GATE = PASS
```

不得仅凭“代码很多”自行推断 Gate。

先标记：

```text
UPSTREAM_GATE_DRIFT = OPERATIONS
CONTENT_IMPLEMENTATION = BLOCKED
```

并报告缺失的 canonical Gate evidence。

只有远程 `main` 已有可验证的 Operations Final Gate PASS，才进入 CNT-01。

如果执行时仓库已经补齐，以当前 `main` 为准继续。

## 3. Design Authority

按以下顺序解释冲突：

```text
1. Frozen PostgreSQL physical contract
2. CONTENT_DESIGN_AUDIT.md
3. CONTENT_PRODUCT_SEMANTICS.md
4. CONTENT_USE_CASES.md
5. CONTENT_PUBLIC_CONTRACTS.md
6. CONTENT_API.md
7. CONTENT_IMPLEMENTATION_PLAN.md
8. Current Foundation / Identity / Platform / Operations public contracts
9. This Execution Brief
```

Canonical docs：

```text
docs/docs/development/05-content/CONTENT_PRODUCT_SEMANTICS.md
docs/docs/development/05-content/CONTENT_USE_CASES.md
docs/docs/development/05-content/CONTENT_PUBLIC_CONTRACTS.md
docs/docs/development/05-content/CONTENT_API.md
docs/docs/development/05-content/CONTENT_IMPLEMENTATION_PLAN.md
docs/docs/development/05-content/CONTENT_DESIGN_AUDIT.md
```

数据库 authority：

```text
database/migrations/0400_content.sql
database/migrations/1240_content_revision.sql
```

## 4. Frozen Content Scope

Content core frozen tables：

```text
Knowledge  = 17
Dictionary = 4
Curriculum = 5
Practice   = 5
Core total = 31
```

以及已存在 forward contract：

```text
content.content_revisions
```

不要把 `content_revisions` 误算成重新设计 31 core tables；它来自已存在的 forward blocker-resolution migration。

禁止：

```text
修改 0400_content.sql
回写任何历史 frozen migration
重新合并 Content + Learning
把 Audio Production tables 放回 Content
新增 generic content JSON table
```

如实现发现真实 physical blocker：

```text
DATABASE_CONTRACT_CONFLICT
```

先停止该路径、给出证据；只允许遵循项目 forward-only migration policy 处理，不得改历史 migration。

## 5. Global Architecture Rules

```text
Modular Monolith
Node.js + TypeScript + ESM
Fastify
PostgreSQL
pg
Zod
Pino
Vitest
```

目标模块：

```text
apps/backend/src/modules/content/
├── domain/
├── application/
├── infrastructure/
├── http/
└── public/
```

Content 不得拥有独立 DB Pool；复用 Foundation `DatabaseExecutor` / `TransactionManager`。

Content repositories 只允许 SQL：

```text
content.*
```

禁止直接 SQL：

```text
identity.*
operations.*
platform.*
learning.*
audio.*
social.*
chat.*
commerce.*
rewards.*
trust.*
```

跨 Domain 调用只能通过对应 `public/` contract。

## 6. Content / Learning Boundary

保持冻结原则：

```text
零用户时仍然存在的数据 → Content
用户开始学习后才产生的数据 → Learning
```

Content owns：

```text
canonical teaching knowledge
canonical teaching translations
curriculum definitions
lesson structure
practice/question definitions
content relationships / tags
content revisions
```

Content 不得写：

```text
user progress
user completion
mastery/review state
bookmarks
exercise/question attempts
search history
runtime user translation request/result
```

这些属于 Learning。

## 7. Content / Audio / Asset Boundary

Content 只保存业务需要的 logical asset references，并提供可被 Audio 使用的 stable Content root/revision contract。

Asset Infrastructure owns：

```text
provider
bucket/object key
mime
size
checksum
physical asset metadata
```

Audio Production owns：

```text
audio slots
generation tasks/attempts
asset versions
review
publication
```

Content 不得创建 TTS job、音频生产状态或存储事实。

如果 Audio 尚未实现，CNT 中只完成 Content 侧 public contract / adapter boundary 和 contract tests，不越界实现 Audio。

## 8. Public IDs / No BIGINT Leak

跨 Domain 永远使用 stable logical/public UUID。

设计审计已经冻结的重要 public roots：

```text
contents.public_id
courses.public_id
lessons.public_id
exercises.public_id
questions.public_id
content_revisions.revision_public_id
lesson_sections.public_id where frozen schema provides it
```

Aggregate-internal entities没有 public UUID时不得被其他 Domain 保存或暴露为跨域 reference。

最终要求：

```text
HTTP internal BIGINT exposure = 0
public contract internal BIGINT exposure = 0
cross-domain BIGINT reference = 0
```

## 9. Execute Current CNT Plan, Do Not Re-number Here

必须读取执行时最新 `CONTENT_IMPLEMENTATION_PLAN.md`，按其中 CNT-xx 顺序连续执行。

当前 frozen plan 已覆盖至少：

```text
CNT-00 Design Freeze
CNT-01 Module Skeleton / Domain Types
CNT-02 Repository Layer
CNT-03 Knowledge Registry / Reads
CNT-04 Knowledge Authoring / Revisions
CNT-05 Dictionary
CNT-06 Curriculum Reads
CNT-07 Curriculum Authoring / Lifecycle
CNT-08 Practice Definitions
CNT-09 Public Cross-Domain Contract
CNT-10 Runtime HTTP/API
CNT-11 Admin Management API + Operations Integration
CNT-12 Asset / Audio Integration Contract
CNT-13+ Integration / E2E / Security / Race / Final Audit
```

如果当前 plan 已增加/合并/重新编号，完全以远程当前 plan 为准。

每一项：

```text
Implement
→ focused tests
→ task audit
→ Gate PASS
→ next task
```

这是连续执行任务；无需每个 CNT task 停下来等待人工回复。

## 10. Knowledge Registry

严格实现 frozen Registry + subtype 模型。

必须保证：

```text
Registry + subtype atomic create
content_type immutable
language/type consistency
8 registry types exact
core knowledge logical identity stable
no physical delete for frozen core knowledge where design forbids
```

不要把 meanings / translations / examples / pronunciations误做成独立 Registry roots，除非当前 canonical docs 明确如此。

Runtime read 使用 typed/discriminated business view，不向客户端暴露 join table/raw row model。

## 11. Knowledge Authoring / Revision

严格使用现有 `content.content_revisions` contract。

Published revision immutable。

需要支持设计已冻结的 revision-capable roots和 translation-set revision semantics。

必须验证：

```text
stale expectedUpdatedAt conflict
publish race
revision numbering
supersedes chain
snapshot schema validation
historic revision resolution
```

不得为了历史记录再建第二套 revision table。

## 12. Dictionary

V1 搜索只实现 frozen PostgreSQL bounded search：

```text
Chinese simplified/traditional/pinyin
Lao text/romanization
exact/prefix/trigram where physical indexes support
language/type filters
bounded result/pagination
```

禁止主动引入：

```text
Redis
Elasticsearch
Meilisearch
semantic/vector search
```

除非当前 frozen design 已发生明确变更。

测试 ranking、query bounds、empty result 和避免 unbounded scan。

## 13. Curriculum

按 aggregate 而不是 row CRUD 实现：

```text
Course
→ Unit
→ Lesson
→ Section
→ Item
```

必须覆盖：

```text
published visibility
ordering
aggregate replacement/reorder
Course/Lesson lifecycle
expectedUpdatedAt conflict
publish-vs-edit race
archive/history semantics
content/exercise/asset reference validation
```

Unit / LessonItem 等 internal entity 不因 Admin 便利而获得跨 Domain/public BIGINT contract。

## 14. Practice / Answer Safety

实现：

```text
Exercise
→ Question
→ Question Content
→ Options
→ Answer Rules
```

严格分离：

```text
PublicPracticeView = answer-redacted
TrustedScoringView = server-only public contract for trusted backend consumer
```

Mobile/runtime HTTP 不得返回：

```text
question_options.is_correct
answer_rules truth
任何可直接恢复正确答案的内部 scoring data
```

必须做 answer leakage security tests。

Attempt/result 写入 Content = 0。

## 15. Content Public Contract

最终下游 Domain 只能依赖：

```text
modules/content/public
```

主要消费者：

```text
Learning
Audio Production
Operations/Admin integration where needed
```

Public contract 按 frozen design 提供：

```text
entity resolution / validation
revision resolution
safe course/lesson/content reads
trusted scoring definition for Learning server-side
Audio source/revision validation
```

不得暴露：

```text
repositories
DatabaseExecutor
TransactionManager
Postgres row types
internal BIGINT
SQL adapter
```

Architecture tests 必须验证：

```text
other-domain -> content/public = allowed
other-domain -> content/application = forbidden
other-domain -> content/infrastructure = forbidden
```

## 16. Runtime HTTP/API

严格实现当前 `CONTENT_API.md`，由 Use Cases 推导，不从 31 张表生成 CRUD。

HTTP layer：

```text
validation
auth when required
application invocation
presentation
```

要求：

```text
HTTP SQL = 0
HTTP repository access = 0
unknown fields rejected
Foundation error envelope reused
stable UUID only
answer leakage = 0
```

重点优化 Mobile read model，避免客户端通过几十个 row endpoint 拼接页面。

## 17. Admin Management API + Operations

Content 的管理 API 必须接当前已经实现并冻结的 Operations authorization/audit contract。

Content 设计提出 8 个 exact permission requirements：

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

执行时必须从当前 Content/Operations docs 再次 exact-verify。

如果 Operations catalog 尚未包含 Content keys，应按 Operations 已冻结的 extension mechanism 扩展 catalog；不得改变 RBAC grammar/semantics。

管理请求：

```text
Identity/Foundation authentication
→ Operations operator resolution
→ exact permission enforcement
→ Content application use case
→ Operations success audit per frozen contract
```

禁止：

```text
Content direct SQL operations.*
复制一套 RBAC
wildcard permission
per-table permission explosion
```

本任务只实现 Backend Admin API，不开发 Content Admin 前端页面。

## 18. Outbox / Cache

Design Audit 当前冻结：

```text
Required Content V1 Outbox events = none
PostgreSQL first
Redis = 0 required
Kafka = 0 required
External search service = 0 required
```

不要因为 Foundation 有 Outbox 就自动为每个 Content mutation 发事件。

如果执行时出现真实 consumer requirement 与 frozen design 冲突，标记 `DESIGN_CONTRACT_CONFLICT`，不要自行扩大事件体系。

## 19. Concurrency / Race

使用真实 PostgreSQL。

至少覆盖 frozen plan 中的：

```text
atomic Registry + subtype creation
revision publish race
stale authoring update
curriculum reorder collision
publish vs edit
practice publish/update race
primary/canonical relation conflicts where applicable
```

验证业务 invariant和最终数据库状态；不要依赖窄毫秒 timing assertion。

不得用 mock DB / SQLite 替代 race test。

## 20. Security Audit

专项检查：

```text
answer leakage
internal BIGINT leak
mass assignment
unknown field acceptance
IDOR in admin endpoints
permission bypass
published revision mutation
cross-domain SQL/import
storage metadata leakage
unbounded dictionary queries
sensitive data logging
```

搜索：

```text
TODO
FIXME
HACK
as any
@ts-ignore
@ts-expect-error
console.log
```

命中必须审查并在最终报告分类。

## 21. Database / Migration Verification

禁止把 migration 数量写死。

最终始终读取当前 registry，并报告：

```text
Frozen 0400 changes = 0
Frozen historical migration changes = 0
Forward migration added by this phase = YES/NO
Fresh migrations = current actual count
Second run = 0
Database audit = PASS
Cross-domain FK = 0
Logical UUID violations = 0
```

如果确实新增合法 forward migration，必须说明原因与审计证据。

## 22. Full Regression

完成 Content 后运行当前仓库所有 mandatory gates：

```text
Backend typecheck
Backend lint
Architecture audit
Backend build
Unit tests
Real PostgreSQL integration
Content HTTP/E2E
Security
Race
Database validation lifecycle
Fresh migration
Second migration no-op
Database audit
Identity regression
Platform regression
Operations regression
Admin Foundation regression
Mobile Foundation regression if current CI requires
Docs / VitePress build
CI workflow validation
```

不得用：

```text
|| true
--passWithNoTests
continue-on-error
```

绕过 mandatory failure。

## 23. Documentation / Final Report

最终至少生成：

```text
docs/docs/development/05-content/CONTENT_IMPLEMENTATION_REPORT.md
```

并更新：

```text
CONTENT_IMPLEMENTATION_PLAN.md task status
DEVELOPMENT_PROGRESS.md
相关 Content domain docs only when implementation reveals factual drift
```

保留 Design Audit 历史，不伪造“从未出现过问题”。

## 24. Final Independent Audit / Gate

最终重新审计：

```text
Frozen DB contract
31 core + existing revision contract
Product semantics
Required Use Cases
Runtime API
Admin API
Operations permission integration
Public contract
Learning boundary
Audio/Asset boundary
Answer safety
Security
Concurrency
Migration freeze
Full regression
```

Severity：

```text
BLOCKER
HIGH
MEDIUM
LOW
```

只有：

```text
BLOCKER = 0
HIGH = 0
all mandatory gates = PASS
```

才允许：

```text
CONTENT_IMPLEMENTATION = COMPLETE
CONTENT_GATE = PASS
CONTENT_DOMAIN = FROZEN
```

MEDIUM/LOW 如保留必须记录 owner / rationale / removal condition / target phase。

## 25. Hard Stop

本执行会话不要：

```text
start Learning Implementation
start Audio Production Implementation
build Content Admin frontend
redesign Operations
redesign Platform
modify Identity internals
add Redis/Kafka/search cluster
create microservice
```

通过 Content Gate 后必须 STOP。

## 26. Final Response Format

```text
CONTENT IMPLEMENTATION RESULT

Repository HEAD = ...
CNT-xx = COMPLETE / BLOCKED
...

Entry Gates:
CONTENT_DESIGN_GATE = PASS/FAIL
OPERATIONS_GATE = PASS/FAIL

Database:
Core frozen tables = 31
Revision contract = PASS/FAIL
0400 changes = 0/...
Forward migration added = YES/NO
Fresh migrations = actual current count
Second run = 0
Database audit = PASS/FAIL
Cross-domain SQL = 0/...

Knowledge = PASS/FAIL
Dictionary = PASS/FAIL
Curriculum = PASS/FAIL
Practice = PASS/FAIL
Answer Safety = PASS/FAIL
Public Contract = PASS/FAIL
Runtime API = PASS/FAIL
Admin API/RBAC = PASS/FAIL
Asset/Audio Boundary = PASS/FAIL

Architecture:
Content DB Pool = 0/...
Foundation TransactionManager reused = YES/NO
HTTP SQL = 0/...
HTTP Repository access = 0/...
Internal BIGINT exposure = 0/...

Tests:
Unit = ?
Integration = ?
HTTP = ?
E2E = ?
Security = ?
Race = ?

Full Backend Regression = PASS/FAIL
Identity Regression = PASS/FAIL
Platform Regression = PASS/FAIL
Operations Regression = PASS/FAIL
Docs = PASS/FAIL

Findings:
BLOCKER = ?
HIGH = ?
MEDIUM = ?
LOW = ?

CONTENT_IMPLEMENTATION = COMPLETE/IN_PROGRESS/BLOCKED
CONTENT_GATE = PASS/FAIL
CONTENT_DOMAIN = FROZEN/NOT_FROZEN
```

列出修改文件、测试、migration 变化、报告路径、TECH_DEBT 与 OUT_OF_SCOPE_FINDING。

**STOP。**