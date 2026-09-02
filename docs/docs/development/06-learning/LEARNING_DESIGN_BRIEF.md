---
status: prepared
phase: 6
phase_name: Learning Domain
artifact: design_brief
design_only: true
implementation_started: false
last_updated: 2026-09-02
lifecycle: historical
derived_from: domains/learning/index.md
---


# ZH-LAO  — Learning Domain Design Brief

⚠️ **派生文档（DERIVED）** — 规范归属（canonical owner）：`domains/learning/index.md`。本文件为实现轨（implementation-track）文档，**不是产品/领域事实权威**（Constitution 原则 II）。产品/领域事实以规范归属文档为准，请勿在此重复或自行修改事实。




> 本文件是 **Learning Domain 产品方案 / 契约设计会话入口**。
>
> 本会话只完成 Repository Audit、Product Semantics、Use Cases、Progress/Mastery/Review Contracts、Practice/Scoring Contracts、Translation Runtime Contract、API/Public Contract、Implementation Plan、Design Audit 与 `LEARNING_DESIGN_GATE`。
>
> **不要开始 Learning Implementation。**
>
> 执行 AI 必须先使用 GitHub 连接器读取远程 `main` 的真实状态，不得根据本文写入时的仓库快照猜测 Content/Operations/Gate 状态。

## 1. Mission

```text
Learning Domain
→ Repository Audit
→ Product Semantics
→ User Learning Fact Model
→ Progress / Mastery / Review Contracts
→ Practice Attempt / Scoring Contracts
→ Dictionary History / Bookmark Contracts
→ Runtime Translation Contract
→ Content / Identity Boundaries
→ API / Public Contract
→ Admin / Permission Requirements
→ Outbox / Concurrency Decisions
→ Implementation Plan
→ Independent Design Audit
→ LEARNING_DESIGN_GATE
→ STOP
```

目标是把 frozen Learning 用户事实模型转化为明确的学习产品行为，不是按 10 张表机械生成 CRUD。

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
Identity current Gate/public contract
Operations current Gate/public contract
Content current Design/Implementation/Gate status
Platform current status
Mobile Foundation current status
Admin Foundation current status
```

Learning 权威至少读取：

```text
database/migrations/0500_learning.sql
docs/docs/domains/learning/index.md
docs/docs/domains/learning/database.md
docs/docs/domains/learning/model.md
docs/docs/domains/learning/progress.md
ADR-021 content-learning split and later relevant ADRs
```

同时必须读取当前 Content canonical design/implementation artifacts：

```text
docs/docs/development/05-content/CONTENT_PRODUCT_SEMANTICS.md
docs/docs/development/05-content/CONTENT_USE_CASES.md
docs/docs/development/05-content/CONTENT_PUBLIC_CONTRACTS.md
docs/docs/development/05-content/CONTENT_API.md
docs/docs/development/05-content/CONTENT_IMPLEMENTATION_REPORT.md if present
apps/backend/src/modules/content/public/** if implemented
```

不要把早期 Learning 文档里已被后续 Content split 取代的定义当成最终方案。

## 3. Parallel Design Rule

Master Plan 正式 Learning Implementation 依赖：

```text
Identity PASS
Content PASS
```

本 Design Brief 可以在 Content Implementation 进行时并行执行产品/契约设计。

如果执行时：

```text
CONTENT_GATE != PASS
```

允许继续 Learning Design，但必须：

```text
Learning Implementation = BLOCKED_BY_CONTENT_GATE
```

并在 Implementation Plan 中标出所有需要 frozen Content public contract 的步骤。

不得为了提前实现而 direct SQL `content.*` 或复制 Content 逻辑。

## 4. Frozen Learning Physical Contract

Learning database authority：

```text
database/migrations/0500_learning.sql
```

当前 canonical docs 定义 **10 张 frozen Learning 用户事实表**：

```text
1. learning_activities
2. course_progress
3. lesson_progress
4. content_mastery
5. content_reviews
6. content_bookmarks
7. exercise_attempts
8. question_attempts
9. dictionary_search_history
10. translation_requests
```

设计会话禁止：

```text
修改 frozen migration
增加 Learning table
把 Content definition tables 移回 Learning
把 Audio Production tables 移回 Learning
新增 question_reviews 第一阶段表
```

如产品设计无法与 physical contract 闭环：

```text
DATABASE_CONTRACT_CONFLICT
```

记录证据，不在设计会话改 DB。

## 5. Ownership Principle Is Frozen

```text
零用户时仍然存在的数据 → Content
用户开始学习后才产生的数据 → Learning
```

Learning owns：

```text
user learning activity facts
course progress
lesson progress
content mastery
review scheduling state
bookmarks
exercise/question attempts
search history
runtime translation requests/results
```

Learning 不 owns：

```text
canonical word/sentence/content definition
canonical teaching translation
course/unit/lesson definition
exercise/question definition
answer rules/options
content revisions
audio production workflow
physical asset metadata
Identity profile/auth
```

## 6. Cross-Domain Reference Rule

所有跨 Domain references 使用 stable logical UUID：

```text
user_id → Identity public UUID
content_id → Content public UUID
course_id → Content course public UUID
lesson_id → Content lesson public UUID
last_section_id → Content section public UUID
exercise_id → Content exercise public UUID
question_id → Content question public UUID
```

不得建立跨 Domain physical FK。

不得保存 Content/Identity internal BIGINT。

同 Learning Domain 内部关系，例如 `question_attempts.exercise_attempt_id`，可以继续使用真实 same-domain FK/BIGINT。

Design Audit 必须逐字段对照 `0500_learning.sql` 和当前 Content public-ID contract，确认没有 logical-ID drift。

## 7. Learning Product Semantics

本会话首先回答：

```text
什么算一次 learning activity？
Activity 是 immutable history 还是 mutable state？
Course/Lesson progress 如何开始、推进、完成？
Progress 是否允许回退？
Content mastery 如何计算与更新？
Review scheduling 是事实还是算法缓存状态？
Bookmark 是用户偏好状态还是 activity？
Exercise attempt 与 question attempt 的生命周期是什么？
Dictionary search history 何时记录？
Translation request 的产品入口、状态机与隐私边界是什么？
```

禁止仅把 10 张表翻译成 10 组 CRUD endpoint。

## 8. Activity vs Current State

冻结原则：

```text
learning_activities = canonical history facts
progress/mastery/review = current state
```

当前状态不应每次通过扫描全量 Activity 重算。

必须设计：

```text
Activity event taxonomy
activity occurrence timestamp
idempotency/deduplication where needed
Activity 与 progress/mastery/review 的事务关系
哪些 use case 写 Activity + current state
哪些只写 current state
```

不要引入 Event Sourcing 架构；`learning_activities` 是业务历史事实，不等于系统 event log。

## 9. Course Progress Contract

必须冻结真实学习体验：

```text
StartCourse
GetCourseProgress
AdvanceCourseProgress
CompleteCourse
ResumeCourse
```

具体 Use Case 名称可调整。

需要明确：

```text
course progress 创建时机
progress status/state values
percentage/position 是否由 DB 存储还是应用计算
last lesson / last section semantics
completed_at semantics
Content Course archived/retired 后历史 progress 如何读取
重复 complete 是否 idempotent
```

只能使用 schema 当前字段能力，不凭空增加字段。

## 10. Lesson Progress Contract

必须定义：

```text
StartLesson
UpdateLessonProgress
CompleteLesson
GetLessonProgress
```

以及：

```text
Course progress 与 Lesson progress 如何联动
完成 Lesson 是否自动推进 Course
跨设备重复提交如何去重/幂等
内容 revision 变化时已有 Lesson progress 如何解释
```

如果 frozen schema 没有 revision pin 字段，必须明确 V1 语义，不隐含假设。

## 11. Content Mastery

必须从产品语义定义 mastery，不要把它做成神秘 score。

回答：

```text
mastery level/status 有哪些值？
什么行为触发 mastery update？
练习结果如何影响 mastery？
review result 如何影响 mastery？
是否支持人工修改？
mastery 是否可回退？
last practiced/updated time 语义？
```

如果具体算法尚无产品需求，可冻结：

```text
V1 deterministic simple policy
```

并把高级自适应算法标记 Deferred，而不是把算法逻辑塞入数据库。

## 12. Review Scheduling

`content_reviews` 是用户复习调度当前状态。

必须设计：

```text
GetDueReviews
RecordReviewResult
ScheduleNextReview
Reset/ResumeReview if needed
```

明确：

```text
due_at semantics
interval/repetition/ease fields if schema has them
review outcome taxonomy
same content one current review state invariant
concurrent review submission behavior
```

不要默认引入复杂 SM-2/FSRS，除非当前 schema/docs/产品已明确支持。

若 V1 采用简单 spaced repetition，要给出可测试 contract；高级算法可 Deferred。

## 13. Bookmark Contract

Bookmark 是用户当前状态，不是内容定义。

必须裁决：

```text
AddBookmark
RemoveBookmark
ListBookmarks
IsBookmarked / batch resolve if needed
```

考虑：

```text
idempotent add/remove
Content disabled/archived 后 bookmark 历史如何显示
pagination/order
```

不要把 bookmark 写入 Content。

## 14. Practice Attempt Contract

结构：

```text
Exercise Attempt
→ many Question Attempts
```

必须定义：

```text
StartExerciseAttempt
SubmitQuestionAnswer
CompleteExerciseAttempt
AbandonExerciseAttempt
GetAttemptResult
```

具体名称根据产品设计冻结。

需要明确状态机：

```text
in_progress
completed
abandoned
```

并规定合法 transition、重复提交、完成后修改、异常恢复。

## 15. Trusted Scoring Boundary

Content owns question definitions and answer truth。

Learning owns user answers/results。

评分流程必须设计成：

```text
Learning receives user answer
→ Content trusted server-side scoring definition/public contract
→ Learning computes or delegates deterministic score according to frozen boundary
→ Learning stores answer_data / is_correct / earned_score
→ update exercise total
→ update mastery/review if required
```

不得：

```text
Learning direct SQL content.*
把正确答案发给 Mobile 再让客户端评分
复制 answer rules 到 Learning canonical tables
```

需要冻结：

```text
who owns scoring algorithm
partial credit semantics
question type handling
score rounding
retry semantics
Content revision pinning if available
```

并与 Content `TrustedScoringView` 最终实现对齐。

## 16. Question Attempt Rules

`question_attempts` same attempt + question UNIQUE。

因此 V1 必须明确：

```text
单次 Exercise Attempt 内每个 question 是否只保留最终一次答案？
是否允许修改未完成 attempt 中的答案？
如果允许，UPDATE 还是拒绝第二次提交？
completed attempt 后是否 immutable？
```

不要与数据库 UNIQUE 约束冲突。

`answer_data JSONB` 仅用于用户答案 payload，不能演化成任意业务垃圾桶。

必须按 question type 使用 typed validation schema。

## 17. Exercise Completion / Atomicity

必须明确一次完成操作涉及哪些事实：

```text
question attempts
exercise attempt score/status/completed_at
learning activity
mastery update
review state update
possibly course/lesson progress
```

尽量保持同 Learning transaction 内原子。

跨 Content 只能先 read/resolve public contract，不能把 Content DB transaction 与 Learning transaction绑定成 distributed transaction。

需要设计失败重试和 idempotency strategy。

## 18. Dictionary Search History

字段是用户搜索事实。

必须冻结：

```text
什么时候写 history
匿名用户是否写（当前 user_id not null/nullable 以 migration 为准）
selected_content_id 的含义
搜索无结果是否记录
重复搜索是否 dedupe
历史列表是否 V1 required
retention/limit behavior
```

不要让 Dictionary Search runtime capability归 Learning；搜索内容本身由 Content，Learning只保存 user history。

## 19. Runtime Translation Contract

Learning owns `translation_requests`：

```text
zh -> lo
lo -> zh
```

它不是 canonical teaching translation。

必须设计状态机：

```text
pending
processing
succeeded
failed
```

根据 migration 当前字段确认。

需要回答：

```text
谁触发 translation provider？
同步还是异步 V1？
provider/model 由谁决定？
超时/失败如何表示？
重复请求是否 dedupe？
是否允许匿名 user_id null？
source_text / translated_text 日志与隐私边界？
是否需要 rate limit？
```

不得自动把 AI/runtime translation 写入 `content.translations`。

Future Request → Review → Promote 属 Deferred，除非更晚 canonical design 已改变。

## 20. Identity Boundary

Learning 只保存 Identity stable UUID logical refs。

必须使用：

```text
modules/identity/public
```

当需要验证 active user / learning direction 等冻结能力时使用 public contract。

禁止：

```text
Identity SQL
Identity repository
Identity internal BIGINT
修改 Identity learning_profile
```

Identity 的 learning direction 是身份/配置事实；Learning 负责实际学习运行事实。

需要设计两者如何协作而不复制 canonical ownership。

## 21. Content Boundary

Content 是 Learning 最重要的 owner dependency。

Learning 需要的能力至少评估：

```text
resolve content by public UUID
resolve course/lesson/section
validate active/published state
resolve exercise/question definition
trusted scoring definition
historic revision if contract supports
```

这些必须通过 `content/public`。

如果执行 Design 时 Content public implementation 尚未完成，可依赖 frozen interface contract设计；Implementation Plan 中标记 Content Gate dependency。

## 22. Revision / Historical Semantics

Content 已引入 revision contract；Learning 需要明确：

```text
哪些 Learning facts需要 pin Content revision？
当前 Learning schema 是否真的有 revision UUID字段？
如果没有，V1 如何解释历史 progress/attempt？
Content 更新后旧 attempt result 是否仍可解释？
```

不得在 Learning 设计中凭空增加 revision fields。

若 schema 无法满足必要历史正确性，标记 `DATABASE_CONTRACT_CONFLICT`；如果只是未来增强，则明确 Deferred。

## 23. Runtime / Mobile Use Cases

从 Mobile 学习体验推导 REQUIRED use cases，至少评估：

```text
GetMyLearningHome / summary
GetCourseProgress
Start/ResumeCourse
GetLessonProgress
Start/CompleteLesson
GetContentMastery
GetDueReviews
SubmitReviewResult
ListBookmarks
Add/RemoveBookmark
StartExerciseAttempt
SubmitQuestionAnswer
CompleteExerciseAttempt
GetExerciseResult
RecordDictionarySelection/SearchHistory if client-facing needed
RequestTranslation
GetTranslationRequest
```

不要全部机械采用；根据产品路径合并/裁决。

重点是 Mobile 能用少量稳定 API 完成：

```text
学习首页
继续学习
课程/lesson进度
练习作答
复习
收藏
词典历史
即时翻译
```

而不是客户端操作 10 张表。

## 24. Learning Home / Read Model

必须讨论是否需要聚合 read model：

```text
current course
continue lesson
progress summary
due reviews
recent activity
```

如果需要，优先 Application query 聚合当前 Learning tables + Content public reads。

不要为此新增 `learning_home` table。

避免 N+1 / 大量客户端 round trips。

## 25. Admin Requirements

Learning Admin 是否需要完整 CRUD 必须谨慎裁决。

Learning 的大部分数据是用户事实，不应该被后台随意编辑。

至少区分：

```text
read/support visibility
safe corrective/admin action
analytics/read-only
business mutation
```

优先 V1：

```text
read-only user learning diagnostics
attempt/progress inspection where support needs真实存在
```

不要默认提供“修改用户分数/掌握度/进度”的万能后台。

如果确有修正需求，必须是显式、审计、受 Operations permission保护的 narrow command。

## 26. Operations Permission Requirements

Learning Design 需要提出最小 Admin permission requirements，但不要在设计会话修改 Operations code。

必须满足 Operations exact grammar：

```text
<domain>.<resource>.<action>
```

按 capability而非 table设计。

不要 wildcard，不要每张表一组权限。

若 V1 Learning Admin 仅 read/support，则权限也应保持最小。

## 27. Public Cross-Domain Contract

设计：

```text
apps/backend/src/modules/learning/public/
```

潜在消费者：

```text
Rewards
Operations/Admin support
possibly Social/Product read models if later justified
```

Public contract只暴露真正跨域需要的业务事实，例如：

```text
learning completion facts
progress summaries
mastery summary
```

不要因为“以后可能用”就公开所有 user learning data。

禁止导出：

```text
repositories
DatabaseExecutor
TransactionManager
internal BIGINT
raw answers
translation source text by default
DB rows
SQL
```

需要考虑 privacy/minimization。

## 28. HTTP/API Contract

从 Use Cases 推导：

```text
/api/v1/learning/...
```

具体 prefix 先核对仓库 convention。

Runtime API必须定义：

```text
auth requirement
stable logical IDs
request/response schemas
idempotency
pagination
conflict semantics
not-found semantics
status transitions
answer payload validation
privacy
unknown-field rejection
```

Learning API 几乎都应是 authenticated user-owned资源；必须做 ownership/IDOR设计。

不要暴露 internal BIGINT attempt IDs，除非已有 stable public UUID；如果 schema 只有 BIGINT，则必须设计 API-safe strategy并审计是否需要 cross-domain/public stable ID。不能擅自修改 migration。

## 29. Critical Public-ID Audit

这是 Design Audit 的重点。

逐表检查：

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

哪些实体会：

```text
被 Mobile URL/API直接标识
被 Admin查询
被 Rewards/其他 Domain引用
需要异步任务定位
```

如果只有 internal BIGINT 且产品契约需要 stable external identity，必须标记：

```text
DATABASE_CONTRACT_CONFLICT
```

不要把 internal BIGINT 暴露出去，也不要在文档里假装有 UUID。

如果实体根本不需要外部引用，可保持内部 BIGINT并通过 natural/composite user-owned lookup处理。

## 30. Authorization / IDOR

Learning 是强 user-owned Domain。

必须设计：

```text
AuthContext.userPublicId
→ all user-scoped query/write constrained to current user
```

客户端不得通过传 `user_id` 来读取其他用户学习事实。

重点审计：

```text
attempt ID enumeration
progress ID enumeration
translation request access
bookmark access
search history access
```

Admin support API 走 Operations authorization，不复用普通 user ownership shortcut。

## 31. Translation Privacy / Safety

`source_text` / `translated_text` 可能包含用户自由文本。

必须定义：

```text
application logs是否允许记录全文
error logs如何脱敏
Admin是否默认可见全文
retention策略是否已有需求
provider request logging边界
```

优先 data minimization；不要把全文塞入普通 request log/outbox。

## 32. Outbox Decision

逐项判断是否存在真实跨 Domain consumers，例如：

```text
LessonCompleted
CourseCompleted
ExerciseCompleted
MasteryChanged
```

Rewards 未来可能需要 completion/event contract，但不能因为“未来可能”就自动发所有事件。

必须裁决 V1：

```text
required events
payload
idempotency key
consumer ownership
same-transaction outbox
```

如果当前 Rewards 尚未设计且事件契约不足，可冻结最小 owner event或明确 Deferred，但必须考虑后续 Rewards dependency，避免到 Rewards 阶段发现 Learning 无法稳定产生必要事实。

若发 event，必须写 Foundation `infrastructure.system_outbox_events`，与 Learning canonical write 同 transaction；不得新建 Learning outbox table。

## 33. Idempotency

重点设计：

```text
StartCourse duplicate
CompleteLesson duplicate
SubmitQuestion duplicate
CompleteExercise retry
ReviewResult retry
Bookmark add/remove retry
Translation request retry
```

利用 frozen unique constraints / state machines / application idempotency。

不要添加全局 Idempotency-Key 机制，除非确有必要且与 Foundation convention一致。

## 34. Concurrency

至少设计：

```text
same lesson concurrent completion
course progress concurrent update
same content mastery concurrent update
same review concurrent submission
same bookmark concurrent add/remove
same question answer concurrent submission
complete exercise vs late question submit
translation status concurrent worker update
```

决定何处使用：

```text
SELECT FOR UPDATE
unique constraint
atomic UPDATE
compare-and-set
```

不得增加 DB 字段。

## 35. Scoring / Progress Transaction Boundaries

必须画出关键 transaction contract：

### Question submit

```text
lock/resolve Learning attempt
→ fetch trusted Content scoring definition outside or before write boundary as appropriate
→ validate state
→ write/update question attempt
→ update exercise aggregate if required
→ activity/mastery/review updates if frozen
→ commit
```

### Lesson completion

```text
lock lesson/course progress
→ validate Content published/logical identity
→ complete lesson progress
→ update course progress
→ activity/outbox if required
→ commit
```

避免锁顺序循环，Design Audit 要给出一致 lock order。

## 36. Translation Execution Architecture

如果 `translation_requests` 有 pending/processing状态，必须决定由谁驱动：

```text
HTTP synchronous provider call
worker job
Foundation worker polling
external adapter
```

V1 优先低运维；不要引入 Kafka/Redis queue。

如果用 PostgreSQL worker：

```text
claim
processing
provider call
success/failure
retry semantics
```

必须考虑 provider call 不应长期持有 DB transaction。

设计 provider interface、fake/unavailable behavior、production fail-closed，不实现真实 provider。

## 37. Rate Limiting

评估：

```text
translation request
search history write
answer submission abuse
```

只对真正需要的 expensive/abuse-prone operation设计限制。

优先 Foundation/in-process/PostgreSQL 能力，不引入 Redis。

## 38. Cache Decision

V1 默认：

```text
PostgreSQL first
```

Learning current state是 user-specific mutable data，不应轻率加长 TTL cache。

如果需要短 cache，只能有明确性能证据和 invalidation规则。

禁止在设计阶段默认 Redis。

## 39. Analytics Boundary

`learning_activities` 可以支持产品行为历史，但 Learning 不应变成通用 analytics warehouse。

不要把：

```text
page view
clickstream
marketing events
technical telemetry
```

全部塞进 `learning_activities`。

只记录与学习业务语义有关的 canonical activity facts。

## 40. Use Case Classification

最终必须生成：

```text
REQUIRED
DEFERRED
NOT_SUPPORTED
```

明确裁决至少这些候选：

```text
course progress
lesson progress
mastery
review scheduling
bookmarks
exercise attempts
question attempts
dictionary history
runtime translation
learning home
manual progress correction
manual mastery correction
offline sync
cross-device conflict merge
streaks
XP/rewards
adaptive learning algorithm
FSRS/SM-2 advanced scheduling
question review notebook
translation promote-to-content
```

Streak/XP/rewards 如果属于 Rewards/Product later，不要塞入 Learning canonical tables。

## 41. Canonical Design Documents

本会话最终应生成/更新：

```text
docs/docs/development/06-learning/LEARNING_PRODUCT_SEMANTICS.md
docs/docs/development/06-learning/LEARNING_USE_CASES.md
docs/docs/development/06-learning/LEARNING_PROGRESS_CONTRACTS.md
docs/docs/development/06-learning/LEARNING_API.md
docs/docs/development/06-learning/LEARNING_PUBLIC_CONTRACTS.md
docs/docs/development/06-learning/LEARNING_IMPLEMENTATION_PLAN.md
docs/docs/development/06-learning/LEARNING_DESIGN_AUDIT.md
```

如果会话发现更合理的合并文档方式可以调整，但必须只有一套 canonical authority，避免重复文档。

必要时同步更新 `docs/docs/domains/learning/*`，但不要改 frozen事实来迎合新设计。

## 42. Implementation Plan

最终 Implementation Plan 建议按真实依赖拆分，例如：

```text
LRN-00 Design Freeze
LRN-01 Module Skeleton / Types
LRN-02 Repositories
LRN-03 Activity Facts
LRN-04 Course/Lesson Progress
LRN-05 Mastery
LRN-06 Review Scheduling
LRN-07 Bookmarks / Dictionary History
LRN-08 Practice Attempts / Trusted Scoring Integration
LRN-09 Runtime Translation
LRN-10 Public Contracts
LRN-11 HTTP/API
LRN-12 Operations/Admin Support Integration
LRN-13 Outbox / Rewards-facing Events if frozen
LRN-14 Integration/E2E
LRN-15 Security/Race
LRN-16 Final Audit / Report / Exit Gate
```

最终编号以设计结果为准。

每个 task 至少包含：

```text
Goal
Scope
Dependencies
Files
Tests
Audit
Gate
```

## 43. Independent Design Audit

完成方案后独立审计：

```text
0500_learning.sql ↔ Product Semantics
Product ↔ Use Cases
Use Cases ↔ API
API ↔ ownership/IDOR
Learning ↔ Content
Learning ↔ Identity
Learning ↔ Rewards future event needs
Practice ↔ trusted scoring
Translation ↔ privacy/provider
Public IDs
Transactions
Concurrency
Outbox
Admin permissions
```

Severity：

```text
BLOCKER
HIGH
MEDIUM
LOW
```

重点寻找：

```text
table-driven CRUD
cross-domain SQL/FK
internal BIGINT public exposure
user ownership bypass
answer leakage
progress state ambiguity
mastery algorithm ambiguity
review state ambiguity
duplicate attempt semantics
translation privacy leak
Content definition duplication
Learning activity becoming generic analytics log
premature Redis/Kafka
future Rewards event contract gap
```

## 44. Design Gate

只有：

```text
BLOCKER = 0
HIGH = 0
Unresolved product decisions = 0
DATABASE_CONTRACT_CONFLICT = 0
```

才允许：

```text
LEARNING_DESIGN_GATE = PASS
```

如果 Content Implementation 尚未 PASS，Learning Design Gate仍可 PASS，只要设计契约本身完整；但必须记录：

```text
LEARNING_IMPLEMENTATION_DEPENDENCY = CONTENT_GATE
LEARNING_IMPLEMENTATION_STARTED = NO
```

不要把上游 implementation dependency误判成 Learning design failure。

## 45. Hard Stop

本会话禁止：

```text
start Learning implementation
modify frozen migrations
add Learning table
start Audio Production
modify Content implementation
modify Identity internals
implement Rewards
build Learning Admin pages
build Mobile Learning pages
add Redis
add Kafka
add microservice
```

Design Gate 后必须 STOP。

## 46. Final Response Format

```text
LEARNING DESIGN RESULT

Repository HEAD = ...
Frozen Learning tables = 10

Ownership = FROZEN/BLOCKED
Activity Contract = FROZEN/BLOCKED
Course Progress = FROZEN/BLOCKED
Lesson Progress = FROZEN/BLOCKED
Mastery = FROZEN/BLOCKED
Review Scheduling = FROZEN/BLOCKED
Bookmarks = FROZEN/BLOCKED
Practice Attempts = FROZEN/BLOCKED
Trusted Scoring Boundary = FROZEN/BLOCKED
Dictionary History = FROZEN/BLOCKED
Runtime Translation = FROZEN/BLOCKED
Privacy/IDOR = PASS/FAIL
Public ID Strategy = PASS/FAIL
Public Contract = FROZEN/BLOCKED
HTTP/API Contract = FROZEN/BLOCKED
Outbox/Event Decision = ...
Cache Decision = ...

Use Cases:
REQUIRED = ?
DEFERRED = ?
NOT_SUPPORTED = ?

Dependencies:
Identity Gate = ?
Content Design Gate = ?
Content Implementation Gate = ?
Learning Implementation blocker = YES/NO

Findings:
BLOCKER = ?
HIGH = ?
MEDIUM = ?
LOW = ?
DATABASE_CONTRACT_CONFLICT = ?

LEARNING_DESIGN_GATE = PASS/FAIL
LEARNING_IMPLEMENTATION_STARTED = NO
```

列出 canonical docs、Implementation Plan、TECH_DEBT、IMPLEMENTATION_DEPENDENCY 与 OUT_OF_SCOPE_FINDING。

**STOP。**