---
status: prepared
phase: 5
phase_name: Content Domain
artifact: design_brief
design_only: true
implementation_started: false
last_updated: 2026-09-02
lifecycle: historical
derived_from: domains/content/index.md
---


# ZH-LAO  — Content Domain Design Brief

⚠️ **派生文档（DERIVED）** — 规范归属（canonical owner）：`domains/content/index.md`。本文件为实现轨（implementation-track）文档，**不是产品/领域事实权威**（Constitution 原则 II）。产品/领域事实以规范归属文档为准，请勿在此重复或自行修改事实。




> 本文件是 **Content Domain 产品方案 / 契约设计会话的入口文档**。
>
> 本会话只完成 Repository Audit、Product Semantics、Use Cases、API/Public Contract、Admin/Permission Requirements、Implementation Plan、Design Audit 与 `CONTENT_DESIGN_GATE`。
>
> **不要开始 Content Implementation。**
>
> 执行 AI 必须先使用 GitHub 连接器读取远程 `main` 的真实仓库状态；不得根据本文写入时的历史信息猜测 Operations、Platform、Migration 或 CI 当前状态。

## 1. Mission

完成：

```text
Content Domain
→ Repository Audit
→ Product Semantics
→ Domain Boundaries
→ Runtime / Authoring Use Cases
→ API Contract
→ Public / Cross-Domain Contract
→ Admin & Permission Requirements
→ Outbox / Cache / Concurrency Decisions
→ Implementation Plan
→ Independent Design Audit
→ CONTENT_DESIGN_GATE
→ STOP
```

目标不是从 31 张表机械生成 CRUD，而是把 frozen Content 数据模型转化为清晰、可实施、可供 Mobile/Admin/Learning/Audio 使用的产品能力。

## 2. Mandatory GitHub Entry Audit

首先使用 GitHub 连接器连接：

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
Operations current Design/Implementation/Gate status
Platform current frozen status
Admin Foundation current status
Mobile Foundation current status
```

重点读取 Content 权威：

```text
database/migrations/0400_content.sql
docs/docs/domains/content/index.md
docs/docs/domains/content/database.md
docs/docs/domains/content/knowledge.md
docs/docs/domains/content/dictionary.md
docs/docs/domains/content/curriculum.md
docs/docs/domains/content/practice.md
```

同时读取边界 Domain：

```text
docs/docs/domains/learning/**
docs/docs/domains/audio/** or current Audio Production docs
infrastructure asset docs / migrations
ADR-021 content-learning split and relevant later ADRs
current operations/public and RBAC contract
current platform/public contract
```

不要假定 05-content 目录中除本 Brief 外已有设计文档；以当前仓库为准。

## 3. Parallel-Design Rule

Master Plan 的正式 Content Implementation 依赖 Operations 最终 PASS。

本 Design Brief 允许在用户明确授权下与 Operations Implementation **并行做设计**，但必须保持：

```text
Content Design = may proceed
Content Implementation = blocked until required upstream Gate is satisfied
```

如果执行时：

```text
OPERATIONS_GATE != PASS
```

不要阻止 Product/Use Case/API 设计；但在 `CONTENT_IMPLEMENTATION_PLAN.md` 中把实际需要 Operations authorization 的管理 HTTP 集成标记为 implementation dependency。

不得为了提前实现而复制/绕过 Operations RBAC。

## 4. Frozen Content Physical Contract

Content database authority：

```text
database/migrations/0400_content.sql
```

当前 canonical database docs 定义 **31 张 Content 表**，分为：

```text
Knowledge = 17
Dictionary = 4
Curriculum = 5
Practice Definition = 5
Total = 31
```

设计会话：

```text
不得修改 frozen migration
不得增加 Content table
不得重新合并 Content + Learning
不得把 Audio Production table 放回 Content
```

如果产品契约与 physical schema 无法闭环：

```text
DATABASE_CONTRACT_CONFLICT
```

记录证据，不在设计会话直接改 DB。

## 5. Content / Learning Ownership Is Frozen

核心边界：

```text
零用户时仍然存在的数据 → Content
用户开始学习后才产生的数据 → Learning
```

Content owns：

```text
canonical teaching knowledge
curriculum definitions
lesson structure
practice/question definitions
canonical teaching translation
content relationships/tags
```

Learning owns：

```text
user progress
user completion
user review state
attempts / answers
search history
user translation request/runtime result
user-content learning facts
```

禁止 Content 接管：

```text
exercise_attempts
question_attempts
user progress
review state
user learning history
user translation runtime request
```

设计 Runtime API 时必须保持这个边界。

## 6. Audio / Asset Ownership Is Frozen

Content 可以拥有：

```text
pronunciation knowledge metadata
asset logical references where frozen schema supports them
content facts describing media usage
```

Audio Production owns：

```text
audio production workflow
slot/version/review/publication
canonical production state
```

Asset Infrastructure owns：

```text
storage provider
bucket/object key
mime/size/checksum
canonical physical asset metadata
```

Content 不得复制 storage facts，也不得重新创建 TTS job / pronunciation audio production tables。

设计必须说明 Content 如何消费最终正式 audio/asset logical IDs，但不要实现 Audio Domain。

## 7. Canonical Content Model Semantics

先明确 `content.contents` Registry 的产品语义。

必须回答：

```text
什么实体必须先拥有 Content Registry identity？
各 subtype table 与 contents.type 如何对应？
Registry status 的完整 lifecycle 是什么？
类型一旦创建是否 immutable？
核心 Content 是否允许物理删除？
下架/停用语义是什么？
创建 Registry + subtype 是否必须原子？
```

专用知识类型至少审计：

```text
Chinese: pinyin / hanzi / word / sentence
Lao: letter / syllable / word / sentence
meaning
translation
example
pronunciation
```

不得因为表多就把每张表都暴露成独立 CRUD 产品。

## 8. Language / Direction Semantics

ZH-LAO 是双向学习产品。

必须从当前 schema/docs 裁决：

```text
语言 code 的 canonical 值
课程 native/learning language 是否由 schema 表示
zh → lo 与 lo → zh 内容如何复用或区分
meaning/translation source-target direction
跨语言 equivalent 与 translation 的区别
sentence/word/knowledge 的语言归属
```

不要凭 UI 想象增加数据库不支持的 language/direction 字段。

如果 docs 与 `0400_content.sql` 有差异，以更晚 canonical decision + physical contract 审计解决并记录。

## 9. Knowledge Product Semantics

设计真正需要的读取和管理能力，而不是 table CRUD。

至少回答：

```text
如何获取一个 canonical Content detail？
如何返回 subtype-specific detail？
Word 如何组合 Hanzi/Syllable？
Meaning / Translation / Example 如何组织？
Pronunciation metadata 如何返回？
如何防止无效 Registry-type combination？
关系变更是否允许部分更新？
```

需要定义 API 输出是否使用 discriminated union / type-specific views；禁止向客户端暴露 internal BIGINT join model。

## 10. Dictionary Semantics

区分：

```text
canonical translation
cross-language content_equivalent
same-language content_relation
meaning
tag
```

必须冻结这些概念在产品上的不同用途。

Dictionary runtime 需要讨论：

```text
exact lookup
prefix/search behavior
language filter
content type filter
result ranking
result size/pagination
not-found semantics
```

搜索能力必须基于当前 PostgreSQL indexes/physical contract。

不要因为“词典需要搜索”就在设计中默认 Elasticsearch/Meilisearch/Redis。

如果当前 DB 只能支持 V1 有界搜索，就明确冻结 V1 范围，并把未来高级搜索标记 deferred。

## 11. Translation Ownership

保持 frozen decision：

```text
canonical human-confirmed teaching translation → content.translations
user runtime translation request/result → Learning
```

Content V1 是否提供 canonical translation authoring / review / publish Use Case 要明确裁决。

已经明确 deferred 的 Request → Review → Promote 流程不得在本设计中偷偷实现，除非当前更晚 canonical docs 已改变。

## 12. Curriculum Semantics

围绕真实产品路径设计：

```text
Course
→ Unit
→ Lesson
→ Lesson Section
→ Lesson Item
```

必须回答：

```text
Course lifecycle / publish semantics
Lesson lifecycle / publish semantics
Unit/Section/Item ordering
reorder 行为与并发语义
published 内容哪些字段可继续修改
是否需要 draft/published distinction
课程语言方向
Lesson Item 能引用哪些 content types
删除已发布课程结构的规则
```

全部只能使用 frozen schema 能支持的状态/字段。

如果 docs 中提到 revision/version，必须核对 schema 真实支持形式，不得凭概念发明 revision tables。

## 13. Practice Definition Semantics

结构：

```text
Exercise
→ Question
→ Question Content
→ Question Options
→ Answer Rules
```

必须冻结：

```text
Exercise/Question lifecycle
question type taxonomy
option ordering
correct answer representation
answer rule semantics
content references
validation invariants
published exercise mutation rules
```

Content 只定义练习；用户 attempt/result 属 Learning。

Runtime API 应给 Learning/Mobile 足够的不可歧义定义，但不得把正确答案无条件暴露给不该看到的客户端路径。

需要专门做 **answer leakage/security design**。

## 14. Public IDs / Cross-Domain Logical References

全局规则：

```text
cross-domain internal BIGINT = forbidden
cross-domain stable logical/public UUID = required
```

当前 Content docs 已明确部分重要实体拥有 `public_id UUID`。

本 Design Audit 必须逐项检查 `0400_content.sql`：

```text
contents
courses
units
lessons
lesson_sections
lesson_items
exercises
questions
以及任何 Learning / Audio / Trust / Operations 未来会引用的 Content entity
```

判断它们是否都有合法稳定 logical/public reference strategy。

特别检查文档中出现的：

```text
content_id
course_id
unit_id
lesson_id
vocabulary_id
sentence_id
exercise_id
question_id
```

是否与实际 physical UUID contract 一致。

发现跨 Domain logical ID 缺口：

```text
DATABASE_CONTRACT_CONFLICT
```

不要在设计阶段偷偷改 migration，也不要允许其他 Domain 引用 Content internal BIGINT。

## 15. Runtime / Mobile Use Cases

从用户学习体验推导 REQUIRED runtime Use Cases。

至少评估：

```text
BrowseCourses
GetCourse
GetCourseStructure
GetLesson
GetLessonContent
GetContentDetail
LookupDictionaryEntry
SearchDictionary
GetRelatedContent
GetExerciseDefinition
GetQuestionDefinition / ResolvePracticeDefinition
```

具体名称、粒度和是否 REQUIRED 必须通过产品设计裁决。

不要创建重复 endpoint 让客户端自己拼 31 张表。

重点优化 Mobile 消费模型：一次学习页面需要的数据应由稳定 read contract 提供，而不是 N+1 CRUD API。

## 16. Admin / Authoring Use Cases

Content 后续需要 Admin，但本会话只冻结 contract，不开发页面。

至少评估：

```text
Create/Update canonical knowledge
Manage meanings/translations/examples
Manage content relationships/tags
Create/Update Course
Manage Unit/Lesson/Section/Item ordering
Publish/Unpublish/Retire where schema supports
Create/Update Exercise
Manage Questions/Options/Answer Rules
```

不要机械提供 DeleteEverything。

所有 destructive/lifecycle semantics 必须与 frozen deletion/status rules一致。

## 17. Operations Permission Requirements

Operations initial permission catalog 不应提前包含未设计的 Content keys。

Content Design 现在应提出 **Content Admin permission requirements**，但不要直接改 Operations implementation。

推荐从资源/动作最小化，例如需要设计：

```text
content.knowledge.read/write
content.curriculum.read/write/publish
content.practice.read/write/publish
```

这里只是示意，最终 key 必须满足 Operations 当前 exact grammar，并由 Content 实际管理 Use Cases 推导。

目标：

```text
最小、稳定、可解释
```

不要每张 DB 表一个 permission，也不要 wildcard。

将最终要求记录在 Content canonical docs，供 Content Implementation / Operations catalog extension 集成。

## 18. Public Cross-Domain Contract

设计：

```text
apps/backend/src/modules/content/public/
```

主要消费者至少考虑：

```text
Learning
Audio Production
possibly Trust / Operations admin integration
```

Public contract 暴露业务 read/validation capability，不暴露 persistence。

禁止导出：

```text
repositories
DatabaseExecutor
TransactionManager
internal BIGINT
DB rows
SQL
```

需要重点冻结：

```text
resolve content by public UUID
content existence/type/status validation
course/lesson public reads needed by Learning
source entity validation needed by Audio Production
```

不要让 Learning/Audio 直接 SQL `content.*`。

## 19. HTTP/API Contract

从 Use Cases 推导两类 API。

### Runtime API

面向 Mobile/client 的只读能力：

```text
course/catalog
lesson/content
dictionary
practice definitions
```

### Admin Management API

建议统一：

```text
/api/v1/admin/content/...
```

由 Operations operator authorization 保护。

不要提前实现。

HTTP 契约必须定义：

```text
stable IDs
request/response schemas
pagination/search semantics
sorting
lifecycle errors
not-found behavior
conflict behavior
answer visibility
unknown-field rejection
```

禁止 public response 暴露 internal BIGINT。

## 20. Learning Boundary Contract

Learning 是 Content 最大的下游之一。

必须明确：

```text
Learning 如何获取/校验 course/lesson/content/exercise/question
Learning 保存哪些 logical UUID
Content status 变化对既有 learning history 的影响
retired content 是否还能被历史记录解析
published content 是否 immutable enough for progress semantics
```

不要在 Content 里写用户 progress。

如需历史可重放/内容版本语义而 frozen schema 支持不足，必须作为 design finding 明确，而不是隐含假设。

## 21. Audio Production Boundary

必须冻结：

```text
哪些 Content entities 可以有 Audio slot
Audio 如何用 Content logical ID 标识 source entity
Content 如何读取/展示 official published audio
Content 本身保存什么 pronunciation knowledge vs asset reference
```

不要进入 Audio workflow 设计；只定义双方 contract requirement。

## 22. Asset Contract

所有 media/audio asset 引用：

```text
stable asset UUID logical reference
no cross-domain physical FK
```

Content 不保存 provider/bucket/object-key 等 infrastructure canonical facts。

如果客户端需要 URL，设计应通过现有 Asset/Audio read mechanism 获取，不把 storage internals塞进 Content API。

## 23. Outbox Decision

逐项判断是否真的需要事件。

候选只能从真实消费者推导，例如：

```text
ContentPublished
ContentRetired
CoursePublished
LessonPublished
```

不要因为 Foundation 有 Outbox 就全量发事件。

必须回答：

```text
谁消费？
为什么同步 public call 不够？
事件 payload 的 stable logical IDs 是什么？
是否包含 snapshot？
```

如果 V1 没有真实异步消费者，明确：

```text
Content V1 required Outbox events = none
```

也是合法结论。

## 24. Cache / Search Infrastructure Decision

默认低运维：

```text
PostgreSQL first
no Redis by default
no Elasticsearch by default
no Kafka
```

讨论：

```text
course/catalog read frequency
dictionary search requirements
in-process cache 是否必要
cache invalidation
published content caching
```

只有有实际性能证据/契约需要才增加复杂度。

## 25. Concurrency / Consistency Design

至少设计：

```text
concurrent content update
registry + subtype atomic create
course/lesson lifecycle race
section/item reorder race
exercise/question structure update race
publish vs edit
retire vs downstream read
admin optimistic conflict handling
```

优先使用现有：

```text
transaction
row lock
unique constraint
expected_updated_at if schema supports
```

不得为方便新增 DB 字段。

必须定义 ordering 操作的 deterministic invariant。

## 26. Security / Data Exposure Design

重点：

```text
practice correct answer leakage
internal BIGINT leakage
unpublished/draft content public exposure
admin write authorization
mass assignment
unbounded dictionary search
unsafe rich text / content rendering if applicable
asset URL/storage leakage
```

不要把 Feature Flag 当成权限；Admin mutation 由 Operations authorization 保护。

## 27. REQUIRED / DEFERRED / NOT_SUPPORTED

最终 `CONTENT_USE_CASES.md` 必须把每项能力分类：

```text
REQUIRED
DEFERRED
NOT_SUPPORTED
```

必须明确裁决至少：

```text
advanced full-text/fuzzy search
content revision/history
bulk import/export
CSV authoring
AI auto-generation
AI translation promotion workflow
content approval workflow
scheduled publish
multi-editor locking
soft delete vs retire
content localization beyond schema
```

不要把“以后可能有用”全部塞进 V1。

## 28. Implementation Plan

最终生成：

```text
docs/docs/development/05-content/CONTENT_IMPLEMENTATION_PLAN.md
```

任务粒度可按最终设计调整，建议至少覆盖：

```text
CNT-00 Design Freeze
CNT-01 Module Skeleton / Domain Types
CNT-02 Repository Layer
CNT-03 Knowledge Registry / Knowledge Reads
CNT-04 Knowledge Authoring
CNT-05 Dictionary
CNT-06 Curriculum Reads
CNT-07 Curriculum Authoring / Lifecycle
CNT-08 Practice Definitions
CNT-09 Public Cross-Domain Contract
CNT-10 Runtime HTTP/API
CNT-11 Admin Management API + Operations Integration
CNT-12 Asset / Audio Integration Contract
CNT-13 Integration/E2E
CNT-14 Security / Answer Leakage
CNT-15 Concurrency/Race
CNT-16 Final Audit / Report / Exit Gate
```

这只是规划骨架；最终以产品设计后的真实依赖排序为准。

每个任务写：

```text
Goal
Scope
Dependencies
Files
Tests
Audit
Gate
```

不要在本设计会话执行这些 CNT implementation tasks。

## 29. Canonical Design Artifacts

本会话最终应创建/更新：

```text
docs/docs/development/05-content/CONTENT_PRODUCT_SEMANTICS.md
docs/docs/development/05-content/CONTENT_USE_CASES.md
docs/docs/development/05-content/CONTENT_API.md
docs/docs/development/05-content/CONTENT_PUBLIC_CONTRACTS.md
docs/docs/development/05-content/CONTENT_IMPLEMENTATION_PLAN.md
docs/docs/development/05-content/CONTENT_DESIGN_AUDIT.md
```

如果设计证明单独的 permission requirement 文档有价值，可增加：

```text
CONTENT_ADMIN_CONTRACTS.md
```

但避免重复权威源；能放入 Use Cases/API/Public Contract 的内容不额外拆文件。

必要时修正现有：

```text
docs/docs/domains/content/*
```

只做最终定稿同步，不推翻 frozen DB design。

## 30. Independent Design Audit

设计完成后必须独立审计：

```text
0400_content.sql ↔ domain docs
31 tables ↔ Product Semantics
Product Semantics ↔ Use Cases
Use Cases ↔ Runtime/Admin API
API ↔ Public IDs
Content ↔ Learning boundary
Content ↔ Audio boundary
Content ↔ Asset boundary
Content ↔ Operations permission requirements
Public Contract ↔ cross-domain architecture
```

重点找：

```text
table-driven CRUD smell
Content/Learning ownership overlap
Audio production leakage into Content
asset infrastructure duplication
canonical translation ambiguity
public UUID gap
internal BIGINT cross-domain leak
draft/unpublished exposure
answer leakage
unsupported search semantics
unsupported revision/version assumptions
ordering concurrency ambiguity
permission per-table explosion
premature Redis/search infrastructure
```

Severity：

```text
BLOCKER
HIGH
MEDIUM
LOW
```

## 31. Design Gate

只有：

```text
BLOCKER = 0
HIGH = 0
Unresolved product decisions = 0
Database contract conflicts = 0
Cross-domain ownership ambiguity = 0
```

才允许：

```text
CONTENT_DESIGN_GATE = PASS
```

否则：

```text
CONTENT_DESIGN_GATE = FAIL
```

如果 Operations Implementation 尚未 PASS，但 Content 本身设计已经闭环，可以：

```text
CONTENT_DESIGN_GATE = PASS
CONTENT_IMPLEMENTATION_DEPENDENCY = OPERATIONS_GATE
```

不要把上游 implementation dependency 错算成 Content design failure。

## 32. Hard Stop

本会话绝对不要：

```text
implement Content backend
modify 0400_content.sql
add Content table
start Learning implementation
start Audio implementation
build Content Admin pages
build Mobile Content pages
change Operations RBAC code
add Redis
add Elasticsearch
add Kafka
split Content microservice
```

Design Gate 完成后 STOP。

## 33. Final Response Format

```text
CONTENT DESIGN RESULT

Repository HEAD = ...
Content frozen tables = 31
0400 migration changes = 0

Product Semantics = FROZEN/BLOCKED
Knowledge Contract = FROZEN/BLOCKED
Dictionary Contract = FROZEN/BLOCKED
Curriculum Contract = FROZEN/BLOCKED
Practice Contract = FROZEN/BLOCKED
Translation Ownership = PASS/FAIL
Learning Boundary = PASS/FAIL
Audio Boundary = PASS/FAIL
Asset Boundary = PASS/FAIL

Public ID Audit = PASS/FAIL
Database Contract Conflict = ?

Use Cases:
REQUIRED = ?
DEFERRED = ?
NOT_SUPPORTED = ?

Runtime API = FROZEN/BLOCKED
Admin API = FROZEN/BLOCKED
Public Contract = FROZEN/BLOCKED
Operations Permission Requirements = FROZEN/BLOCKED

Outbox decision = ...
Cache/Search decision = ...

Operations status = ...
Content implementation dependency = ...

Findings:
BLOCKER = ?
HIGH = ?
MEDIUM = ?
LOW = ?

CONTENT_DESIGN_GATE = PASS/FAIL
CONTENT_IMPLEMENTATION_STARTED = NO
```

列出 canonical docs、Implementation Plan、TECH_DEBT、IMPLEMENTATION_DEPENDENCY。

**STOP。不要开始 Content Implementation。**
