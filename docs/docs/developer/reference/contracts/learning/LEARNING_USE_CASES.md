---
status: frozen
phase: 6
phase_name: Learning Domain
document: LEARNING_USE_CASES
design_only: true
implementation_started: false
last_updated: 2026-09-02
lifecycle: historical
derived_from: domains/learning/model.md
---

> 迁移说明：本文是迁移时保留的契约/证据快照，不是当前调度权限。当前产品状态请看 [ZH-LAO 产品开发全景](/developer/)，执行规格请看 `.specify/` 与 `specs/`，真实完成请以代码、测试与 CI 为准。



# ZH-LAO  — Learning Use Cases

⚠️ **派生文档（DERIVED）** — 规范归属（canonical owner）：`domains/learning/model.md`。本文件为实现轨（implementation-track）文档，**不是产品/领域事实权威**（Constitution 原则 II）。产品/领域事实以规范归属文档为准，请勿在此重复或自行修改事实。




> Use Cases 从 learner journey 与用户事实推导，不是一表一 CRUD。Runtime全部 authenticated + user-owned；客户端不提交 `userId`。

## 1. Classification

```text
REQUIRED      = 25
DEFERRED      = 12
NOT_SUPPORTED = 14
```

## 2. Actors

- Learner：authenticated Mobile/Web user；
- Learning Worker：translation execution / retention cleanup；
- Content Domain：trusted entity/structure/revision/scoring owner；
- Identity Domain：trusted account owner；
- Rewards：future completion-event consumer；
- Operations/Admin Support：exact-permission read-only diagnostics。

## 3. REQUIRED — Home / Course / Lesson

### LRN-R01 GetMyLearningHome

聚合最多3个 continue Courses、resume anchors、due review count/preview、recent activities；batched Content enrichment；不新增 read-model table。

### LRN-R02 GetCourseProgress

Input Course UUID；只查 current user；missing row -> virtual `not_started/0`。

### LRN-R03 StartCourse

验证 current published Course；首次 `in_progress + course_started`；repeat idempotent。

### LRN-R04 ResumeCourse

返回 server-owned progress + lastLesson/lastSection；无 progress不自动 Start。

### LRN-R05 CompleteCourse

V1 published Course structure中的 **全部 Lessons** 都是 completion-required（Content无 optional Lesson flag）。全部完成后首次 terminal transition + outbox；repeat idempotent；0-Lesson Course fail closed。

### LRN-R06 GetLessonProgress

Lesson UUID；missing -> virtual not_started。

### LRN-R07 StartLesson

验证 Lesson + parent Course；确保 Course started；首次写 lesson_started；resume anchor forward-only。

### LRN-R08 UpdateLessonProgress

Input Lesson UUID + Section UUID；server验证 parent/order并计算 monotonic percent；客户端不能提交 percentage。

### LRN-R09 CompleteLesson

要求 lastSection已到最后 Section，并验证所有 `is_required=true` Exercise lesson items均有 completed attempt。首次完成同 transaction：Lesson terminal state、activity、required Knowledge mastery/review初始化、Course recalc、Lesson/Course completion outbox。Repeat idempotent。

## 4. REQUIRED — Mastery / Review

### LRN-R10 GetContentMastery

Single/batch max100 Content UUID；no row -> virtual `new`。

### LRN-R11 GetDueReviews

Current user；`next_review_at <= now`；sort `priority DESC,next_review_at ASC,content_id`；cursor；default20/max50；batch Content metadata。

### LRN-R12 SubmitReviewResult

Input contentId + `again|hard|good|easy` + expectedUpdatedAt。Review row必须已存在且 due；mastery then review lock；apply frozen deterministic policy；same tx update mastery/review + review_completed activity。Stale -> 409。

## 5. REQUIRED — Bookmarks

### LRN-R13 ListBookmarks

Sort `created_at DESC,content_id`；historical disabled/archived bookmark保留 availability。

### LRN-R14 AddBookmark

Content current-public validation；idempotent add。

### LRN-R15 RemoveBookmark

不要求 Content仍 active；idempotent remove。

### LRN-R16 ResolveBookmarkStatus

Batch max100 UUID；返回 current user status map。

## 6. REQUIRED — Practice

### LRN-R17 StartExerciseAttempt

Validate current published Exercise + revision；advisory-lock `(user,exercise)`；如果已有 in-progress -> `409 LEARNING_ATTEMPT_ALREADY_IN_PROGRESS`，**不重签 token**；否则 enforce Content `maxAttempts`（所有已创建 rows，包括 abandoned，都计数）、创建 attempt + activity，返回 encrypted attemptToken + safe pinned revision context。

### LRN-R18 SubmitQuestionAnswer

Attempt token提供 owner + exact Exercise revision；typed answer validation；Content trusted scoring；每 `(attempt,question)` 一次 canonical answer。Same normalized retry -> stored result；different -> 409。

### LRN-R19 CompleteExerciseAttempt

Pinned Exercise中的 **全部 Questions** 都是 completion-required（Content Question无 optional flag）。锁 attempt，验证全部 answers，decimal-safe aggregate，首次 completed + activity + outbox；repeat returns same final result。

### LRN-R20 AbandonExerciseAttempt

支持：

- token-specific abandon；
- lost-token recovery：authenticated user + Exercise UUID abandon current active attempt under advisory lock。

Repeated abandoned is idempotent；completed conflicts。Abandoned row仍计入 maxAttempts。

### LRN-R21 GetAttemptResult

仅 current-user-bound attemptToken；返回 stored user answers/result与 token仍可解析时的 safe post-answer explanation；no attempt/question BIGINT；no answer key。

## 7. REQUIRED — Dictionary History

### LRN-R22 RecordDictionarySearch

Actual lookup/search仍由 Content执行；Learning记录一次 authenticated user intent。`queryText + optional selectedContentId`；零结果可记录；selected ID由 Content验证。

### LRN-R23 ListDictionaryHistory

Current user；cursor；default20/max50；entry没有 public row ID，不提供 entry CRUD。

## 8. REQUIRED — Runtime Translation

### LRN-R24 RequestTranslation

Authenticated only；zh->lo / lo->zh；source <=1000 Unicode code points；rate limit后创建 pending row，返回 `202 + translationToken`；worker异步执行。每个 accepted HTTP request是独立 fact，V1不承诺 transport semantic dedupe。

### LRN-R25 GetTranslationRequest

Token + current AuthContext ownership；succeeded返回 translatedText；failed返回 stable code；no provider raw error/DB id。

## 9. Internal application capabilities

不是独立 table CRUD endpoint：

```text
InitializeMasteryAndReviewFromCompletedLesson
RecalculateCourseProgressAfterLessonCompletion
WriteLearningActivity
EmitLearningCompletionOutbox
ClaimProcessTranslationRequest
CleanupDictionaryHistory
CleanupTranslationRequests
```

Content final public module必须提供 typed trusted Lesson learning-structure view；若没有，implementation entry audit必须 BLOCK，而不是 direct SQL Content。

## 10. Admin support reads

不计入 learner REQUIRED=25：

```text
GetUserLearningSupportSummary
ListUserLearningActivities
InspectUserProgressAndReviews
InspectExerciseAttemptSummaries
```

全部要求：

```text
learning.support.read
```

No generic user-fact mutation；translation plaintext excluded by default。

## 11. DEFERRED — 12

| ID | Capability | Decision |
| --- | --- | --- |
| D01 | Persisted ExerciseAttempt public UUID | frozen schema无字段 |
| D02 | Persisted Content revision pin in Learning rows | no physical field |
| D03 | Long-term exact historical practice replay | requires persisted revision pin/new contract |
| D04 | Non-destructive lost-token / cross-device attempt resume and Start transport idempotency | cannot safely reissue exact revision token from current schema |
| D05 | Offline answer/progress sync | separate conflict model required |
| D06 | Cross-device merge beyond server current-state semantics | no V1 requirement |
| D07 | Manual progress correction | future narrow audited command only |
| D08 | Manual mastery correction | future narrow audited command only |
| D09 | Adaptive mastery algorithm | deterministic V1 first |
| D10 | FSRS / SM-2 | schema lacks interval/ease state |
| D11 | Question review notebook / `question_reviews` | first phase excluded |
| D12 | Translation Request -> Review -> Promote to Content automation | Content marks deferred |

## 12. NOT_SUPPORTED — 14

| ID | Capability | Reason |
| --- | --- | --- |
| N01 | Runtime client supplies arbitrary userId | IDOR |
| N02 | Public attempt BIGINT | global ID rule |
| N03 | Public question_attempt BIGINT | internal child fact |
| N04 | Public dictionary-history BIGINT | no external identity needed |
| N05 | Public translation-request BIGINT | opaque capability only |
| N06 | Learning direct SQL/repository Content | owner boundary |
| N07 | Learning direct SQL/repository Identity | owner boundary |
| N08 | Client trusted scoring/answer key | answer leakage |
| N09 | Generic table CRUD API | product architecture |
| N10 | Generic Admin edit progress/mastery/result | fact integrity |
| N11 | XP/streak/coins as Learning canonical tables | separate product/Rewards ownership |
| N12 | Generic clickstream in learning_activities | activity boundary |
| N13 | Anonymous dictionary history | `user_id NOT NULL` |
| N14 | Redis/Kafka/Learning microservice V1 | no evidence / hard-stop |

## 13. Idempotency / retry matrix

| Operation | V1 behavior |
| --- | --- |
| StartCourse | idempotent by natural state |
| StartLesson | idempotent by natural state |
| CompleteLesson | first terminal transition; repeat same result |
| CompleteCourse | first terminal transition; repeat same result |
| SubmitReviewResult | expectedUpdatedAt first-wins; stale retry 409 |
| AddBookmark | ON CONFLICT no-op |
| RemoveBookmark | missing = success |
| StartExerciseAttempt | **not transport-idempotent** without persisted revision/request key; active -> 409, never guessed reissue |
| SubmitQuestionAnswer | same normalized answer repeat same result; different 409 |
| CompleteExerciseAttempt | terminal; repeat same result |
| AbandonExerciseAttempt | abandoned repeat success; completed conflict |
| RequestTranslation | each accepted request independent; rate-limit duplicates |

## 14. Authorization / ownership

Every learner query/write predicate includes current `AuthContext.userPublicId`。Attempt/Translation token additionally binds same UUID。

```text
401 missing/invalid authentication
404 invalid/tampered/foreign opaque handle
409 owned resource incompatible state/stale write
403 only Admin authenticated but exact permission missing
```

Admin support uses Operations authorization, never learner ownership shortcut。

## 15. Freeze

```text
REQUIRED = 25
DEFERRED = 12
NOT_SUPPORTED = 14
Use Cases = FROZEN
Attempt no-reissue = FROZEN
Course all-Lesson completion = FROZEN
Exercise all-Question completion = FROZEN
Implementation = NOT_STARTED
Implementation dependency = CONTENT_GATE
```
