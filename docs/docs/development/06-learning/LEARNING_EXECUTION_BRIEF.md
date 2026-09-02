---
status: ready
phase: 6
phase_name: Learning Domain
artifact: execution_brief
entry_gate: LEARNING_DESIGN_GATE = PASS
implementation_started: false
last_updated: 2026-09-02
lifecycle: historical
derived_from: domains/learning/index.md
---


# ZH-LAO  — Learning Execution Brief

⚠️ **派生文档（DERIVED）** — 规范归属（canonical owner）：`domains/learning/index.md`。本文件为实现轨（implementation-track）文档，**不是产品/领域事实权威**（Constitution 原则 II）。产品/领域事实以规范归属文档为准，请勿在此重复或自行修改事实。




> 本文件是 Learning Domain 正式执行开发会话入口。
>
> 执行 AI 必须先使用 GitHub 连接器读取远程 `main` 的真实 Gate、代码与 canonical Learning 文档，再按当前 `LEARNING_IMPLEMENTATION_PLAN.md` 连续执行。
>
> 本会话不重新做 Learning 产品设计，不开始 Audio Production，不开发 Learning Admin 前端。

## 1. Mission

```text
Repository Re-Audit
→ Verify Entry Gates
→ Read Frozen Learning Design
→ Execute LRN-00 ... LRN-xx
→ Progress / Mastery / Review
→ Practice Attempts / Scoring
→ Dictionary History / Bookmarks
→ Runtime Translation
→ Public / HTTP Contract
→ Security / Concurrency
→ Full Regression
→ Final Audit
→ LEARNING_GATE
→ Freeze Learning
→ STOP
```

## 2. Mandatory GitHub Entry Audit

连接：

```text
repository = rzyao/ZH-LAO
branch = main
```

至少读取：

```text
latest HEAD
MASTER_DEVELOPMENT_PLAN.md
DEVELOPMENT_PROGRESS.md
06-learning/* canonical docs
0500_learning.sql
current migration registry/count
Identity public contract
Content public contract + Content final report
Operations public/RBAC contracts
Platform current status
current CI workflows
```

必须确认：

```text
LEARNING_DESIGN_GATE = PASS
Identity = COMPLETE / PASS / FROZEN
Content = COMPLETE / PASS / FROZEN
required Content public/scoring contract available
```

如果 Content final Gate 尚未正式收口，Learning Implementation 必须 BLOCKED；不得直接 SQL Content 或复制其 scoring logic 绕过依赖。

## 3. Design Authority

按当前仓库真实内容读取并执行：

```text
LEARNING_PRODUCT_SEMANTICS.md
LEARNING_USE_CASES.md
LEARNING_PROGRESS_CONTRACTS.md
LEARNING_PUBLIC_CONTRACTS.md
LEARNING_API.md
LEARNING_IMPLEMENTATION_PLAN.md
LEARNING_DESIGN_AUDIT.md
```

数据库 authority：

```text
database/migrations/0500_learning.sql
```

Learning frozen core tables = 10：

```text
learning.learning_activities
learning.course_progress
learning.lesson_progress
learning.content_mastery
learning.content_reviews
learning.content_bookmarks
learning.exercise_attempts
learning.question_attempts
learning.dictionary_search_history
learning.translation_requests
```

不得增加第 11 张 core table。

## 4. Global Boundaries

Learning owns user learning facts/state only。

Content owns：

```text
canonical knowledge
course/lesson definitions
practice/question definitions
canonical translations
```

Identity owns user/account/auth。

Audio owns audio production。

禁止 Learning：

```text
write content.*
copy Content canonical definitions
write identity.*
write audio.*
create cross-domain FK
store other Domain internal BIGINT
```

跨 Domain 只能通过 stable logical UUID + public contract。

## 5. Progress / Activity Semantics

严格区分：

```text
learning_activities = historical canonical facts
course_progress / lesson_progress = current progress projections/state
content_mastery = current mastery state
content_reviews = review scheduling state
```

不要通过每次请求扫描 activity history 重新计算 current state，除非 frozen design明确要求某个离线重建路径。

必须保持用户隔离和幂等语义。

## 6. Course / Lesson Progress

执行当前 frozen progress contract：

```text
start/resume learning
update lesson progress
complete lesson
update course progress
last section/content position
completion timestamps
```

所有 Content references 必须通过 Content logical UUID / public contract 校验。

需要真实 PostgreSQL concurrency tests 验证：

```text
concurrent progress updates
complete-vs-progress race
stale update handling
monotonic/completion invariants defined by frozen design
```

不要引入 trigger。

## 7. Mastery / Review

实现 current frozen mastery/review model：

```text
mastery update
review schedule update
review due query
review result application
```

评分/掌握度算法只实现设计文档已冻结部分；不要自行引入复杂 SRS/FSRS 算法或新字段。

如果 V1 只是简单状态机/调度模型，就严格保持简单。

## 8. Bookmarks

`content_bookmarks` 属 Learning user fact。

必须保证：

```text
user-scoped idempotent add/remove
Content UUID validation
no duplicate bookmark invariant
no cross-user access
```

不要把 bookmark 写回 Content。

## 9. Practice Attempts / Scoring

这是本轮关键安全边界。

Learning owns：

```text
exercise_attempts
question_attempts
answer_data
score/result user facts
```

Content owns question definition / correct answer truth。

评分必须通过冻结 Content trusted/server-side contract获取必要定义，不能：

```text
direct SQL content.*
trust client-provided is_correct/score
copy correct answers into public Mobile DTO
```

必须验证：

```text
start attempt
submit answer
single question unique per attempt according to DB
complete attempt
abandon attempt
score totals/percent consistency
attempt lifecycle
```

对客户端返回的题目定义保持 answer-redacted。

## 10. Translation Runtime

`translation_requests` 是用户发起的运行事实。

实现 frozen contract：

```text
zh -> lo
lo -> zh
pending / processing / succeeded / failed
provider/model result metadata where schema supports
```

即时翻译结果不得自动写入 `content.translations`。

如果真实 translation provider 尚未集成，按 frozen provider strategy处理；不要伪造成功结果。

安全审计：

```text
source_text / translated_text logging
PII/sensitive-content retention
provider failure mapping
idempotency/retry semantics
```

## 11. Dictionary Search History

搜索内容能力本身归 Content；Learning 只记录用户搜索行为事实。

实现：

```text
record search history
optional selected_content_id
list/clear only if frozen use cases require
```

不要复制 Content search engine/query logic。

## 12. Public Contract

最终其他 Domain 只能依赖：

```text
modules/learning/public
```

Public contract 不得暴露：

```text
repositories
DatabaseExecutor
TransactionManager
raw DB rows
internal BIGINT
SQL
```

若未来 Rewards 需要学习事件/事实，必须按 frozen Learning public/event contract提供，不允许 Rewards direct SQL Learning。

## 13. HTTP/API

严格实现 `LEARNING_API.md`。

HTTP layer只做：

```text
validation
auth context
application invocation
presentation
```

要求：

```text
HTTP SQL = 0
HTTP direct repository access = 0
unknown fields rejected
user identity taken from auth context, not arbitrary body user_id
internal BIGINT exposure = 0
Foundation error envelope reused
```

重点做 IDOR 审计。

## 14. Transactions / Outbox

同 Learning Domain 的事实+状态更新按冻结 design transaction 完成。

例如一次答题若同时更新：

```text
question_attempt
exercise aggregate score
mastery/review/progress
learning activity
```

只在 frozen contract 要求时同 tx 原子完成。

Outbox 只实现设计审计已经冻结的必要事件；不要为了未来 Rewards 猜事件。

如果设计冻结了某些 event，Learning mutation + outbox 同 transaction。

## 15. Repository Layer

只允许 SQL：

```text
learning.*
```

不得 SQL：

```text
identity.*
content.*
audio.*
operations.*
platform.*
```

复用 Foundation executor/transaction manager；不得创建 Learning DB Pool。

## 16. Security Audit

至少检查：

```text
IDOR / cross-user reads
body user_id impersonation
client score/is_correct tampering
correct-answer leakage
translation text/token logging
mass assignment
internal BIGINT leakage
cross-domain SQL/imports
unbounded history query
JSON answer_data validation
```

专项搜索 TODO/FIXME/HACK/as any/ts-ignore/console.log 并分类。

## 17. Concurrency / Race

使用真实 PostgreSQL，至少覆盖 frozen design relevant races：

```text
same lesson progress concurrent updates
complete vs update
same bookmark concurrent add/remove
same question submit duplicate race
attempt complete vs answer submit
mastery/review concurrent updates
translation state transitions where asynchronous
```

验证 invariant，不依赖窄毫秒 timing。

## 18. Database Freeze

默认：

```text
0500_learning.sql changes = 0
Learning core tables = 10
cross-domain FK = 0
```

Migration 数量不得写死；读取当前 registry。

如果遇到真实 physical blocker：

```text
DATABASE_CONTRACT_CONFLICT
```

停止该路径并给出证据；历史 migration 不可修改。

## 19. Execute Actual LRN Plan

不要根据本 Brief 重新编号。

必须读取当前 `LEARNING_IMPLEMENTATION_PLAN.md`，按最新 `LRN-xx` 顺序连续执行。

每项：

```text
Implement
→ focused unit/integration
→ audit invariant
→ Gate PASS
→ next task
```

不需要每个 task 等人工确认。

## 20. Full Regression

最终至少：

```text
backend typecheck/lint/architecture/build
Learning unit/integration/HTTP/E2E/security/race
fresh migration validation + second-run 0
DB audit
Identity regression
Content regression
Operations/Platform regression as current CI requires
Admin/Mobile Foundation mandatory checks
Docs build
CI validation
```

不得用忽略错误参数掩盖 mandatory failure。

## 21. Documentation / Final Gate

最终生成：

```text
docs/docs/development/06-learning/LEARNING_IMPLEMENTATION_REPORT.md
```

更新 plan status 与 `DEVELOPMENT_PROGRESS.md`。

只有：

```text
BLOCKER = 0
HIGH = 0
all mandatory gates = PASS
```

才允许：

```text
LEARNING_IMPLEMENTATION = COMPLETE
LEARNING_GATE = PASS
LEARNING_DOMAIN = FROZEN
```

MEDIUM/LOW如保留，记录 owner/rationale/removal condition/target phase。

## 22. Out of Scope

不要：

```text
start Audio Production
build Learning Admin
redesign Content
modify Identity internals
add Learning table
add Redis/Kafka
invent advanced recommendation/SRS systems
```

完成 Learning Gate 后 STOP。

## 23. Final Response

```text
LEARNING IMPLEMENTATION RESULT
Repository HEAD = ...
LRN-xx = COMPLETE/BLOCKED
Database core tables = 10
Migration changes = 0/...
Progress = PASS/FAIL
Mastery/Review = PASS/FAIL
Practice/Scoring = PASS/FAIL
Bookmarks/History = PASS/FAIL
Translation = PASS/FAIL
Public Contract = PASS/FAIL
HTTP = PASS/FAIL
Security = PASS/FAIL
Concurrency = PASS/FAIL
Tests = ...
BLOCKER/HIGH/MEDIUM/LOW = ...
LEARNING_GATE = PASS/FAIL
LEARNING_DOMAIN = FROZEN/NOT_FROZEN
```

列出修改文件、报告与 TECH_DEBT，然后 STOP。
