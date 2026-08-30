---
status: frozen
phase: 6
phase_name: Learning Domain
document: LEARNING_USE_CASES
design_only: true
implementation_started: false
last_updated: 2026-08-31
---

# ZH-LAO V2 — Learning Use Cases

> Use Cases 从 Mobile 学习路径与用户事实语义推导，不是一表一 CRUD。所有 runtime use case 默认 authenticated、user-owned；客户端不提交 `userId`。

## 1. Classification Summary

```text
REQUIRED      = 25
DEFERRED      = 12
NOT_SUPPORTED = 14
```

## 2. Actors

- Learner：authenticated Mobile/Web user；
- Learning Worker：translation execution/retention cleanup；
- Content Domain：trusted dependency，提供 entity/revision/scoring contract；
- Identity Domain：trusted dependency，提供 user active-state contract；
- Rewards：未来消费 completion owner events；
- Operations/Admin Support：只读 diagnostics，经 exact permission授权。

## 3. REQUIRED — Home / progress

### LRN-R01 GetMyLearningHome

返回最多 3 个 continue courses、resume anchors、due review count/preview、recent activities。Application query聚合现有 Learning tables + batched Content public reads，不新增 read-model table。

### LRN-R02 GetCourseProgress

Input：`courseId` UUID。不存在 row时返回虚拟 `not_started/0`。只能查当前用户。

### LRN-R03 StartCourse

验证 active/published Course；首次创建 `in_progress` + `course_started` activity。重复调用返回现状，不重复 fact。

### LRN-R04 ResumeCourse

返回 server-owned `lastLessonId` 及可解析的 current/historical Content summary。没有 progress则返回 not-started state，不擅自 start。

### LRN-R05 CompleteCourse

Server验证所有 required published Lessons 已完成。首次完成写 terminal state + completion outbox；重复 complete idempotent。

### LRN-R06 GetLessonProgress

按 Lesson UUID返回当前用户 progress；缺行返回虚拟 not_started。

### LRN-R07 StartLesson

验证 Lesson及其 Course关系；确保 Course progress 已 started；首次 Lesson start写 activity。不会让 Course resume anchor向后退。

### LRN-R08 UpdateLessonProgress

输入 `lessonId + sectionId`，不接收 percentage。Server验证 Section parent/order并计算 monotonic progress。

### LRN-R09 CompleteLesson

首次完成 Lesson；同 transaction更新 Course progress，必要时自动 complete Course；写 activity + lesson/course outbox。重复调用 idempotent。

## 4. REQUIRED — Mastery / review

### LRN-R10 GetContentMastery

支持单个或 batch（max 100）Content UUID。无 row返回 `new` virtual view。

### LRN-R11 GetDueReviews

仅当前用户；`next_review_at <= now`；排序 `priority DESC, next_review_at ASC, content_id`；cursor pagination，limit default 20/max 50。Content metadata batched resolve。

### LRN-R12 SubmitReviewResult

Input：`contentId`, `outcome=again|hard|good|easy`, `expectedUpdatedAt`。锁 mastery/review，应用 deterministic V1 policy，同 transaction写 mastery + review + `review_completed` activity。Stale concurrent submit -> 409。

## 5. REQUIRED — Bookmarks

### LRN-R13 ListBookmarks

`created_at DESC, content_id` cursor pagination；disabled/archived历史 bookmark保留并返回 availability。

### LRN-R14 AddBookmark

验证 Content current-public；idempotent add。

### LRN-R15 RemoveBookmark

不要求 Content仍 active；idempotent remove。

### LRN-R16 ResolveBookmarkStatus

Batch max 100 UUID，返回当前用户 `isBookmarked` map，避免 Mobile N+1。

## 6. REQUIRED — Practice

### LRN-R17 StartExerciseAttempt

验证 current published Exercise并读取 current published revision。对 `(userId,exerciseId)` advisory-lock；已有 in-progress则复用，否则创建 attempt + activity。返回 opaque `attemptToken` + safe exercise revision context。

### LRN-R18 SubmitQuestionAnswer

使用 attemptToken定位 owner + pinned exercise revision。Typed validate user answer；通过 Content trusted scoring contract评分；insert `question_attempts`。同 question相同 normalized answer重试返回已有结果，不同答案冲突。

### LRN-R19 CompleteExerciseAttempt

锁 attempt；校验状态/required questions；汇总 decimal scores；`in_progress -> completed`；写 `exercise_completed` activity + owner outbox。重复 complete返回同一 final result。

### LRN-R20 AbandonExerciseAttempt

`in_progress -> abandoned`；重复 abandon成功；completed -> conflict。

### LRN-R21 GetAttemptResult

只通过 current-user-bound opaque attemptToken获取。返回 stored answers/result + safe explanation（如 Content pinned revision仍可由 token解析）。不暴露 attempt/question attempt BIGINT。

## 7. REQUIRED — Dictionary history

### LRN-R22 RecordDictionarySearch

Content继续负责真正 dictionary search；本 use case只记录一次用户 search intent。Input `queryText` + optional `selectedContentId`。selected ID须经 Content验证。零结果/未选择允许 null。

### LRN-R23 ListDictionaryHistory

当前用户、cursor pagination，limit default 20/max 50。History entries无 public row identity，不提供按 entry ID detail/update/delete。

## 8. REQUIRED — Runtime translation

### LRN-R24 RequestTranslation

Authenticated only。Input zh->lo/lo->zh、sourceText <=1000 code points。Rate limit后创建 pending row，返回 `202 + translationToken`；worker异步执行 provider。

### LRN-R25 GetTranslationRequest

通过 header中的 translationToken查询当前 user-owned request状态。Succeeded返回 translatedText；failed返回 stable errorCode；不返回 provider内部错误/DB id。

## 9. Internal application capabilities

以下不是独立 public CRUD endpoint，但 Implementation必须有明确 application service：

- InitializeMasteryAndReviewFromCompletedLesson；
- RecalculateCourseProgressAfterLessonCompletion；
- WriteLearningActivity；
- EmitLearningCompletionOutbox；
- Claim/ProcessTranslationRequest；
- CleanupDictionaryHistory；
- CleanupTranslationRequests。

## 10. REQUIRED — Admin support read

Admin不纳入普通 learner API计数，属于同一 Learning phase的 support integration：

- GetUserLearningSupportSummary；
- ListUserLearningActivities；
- InspectUserProgressAndReviews；
- InspectExerciseAttemptSummaries / nested question result；

全部要求 `learning.support.read`。不允许通过 user runtime ownership shortcut访问其他用户。

## 11. DEFERRED — 12

| ID | Capability | Decision |
| --- | --- | --- |
| D01 | Persisted exercise attempt public UUID | frozen schema无字段；opaque token满足 V1 runtime |
| D02 | Persisted Content revision pin on Learning rows | V1不要求 long-term exact replay |
| D03 | Long-term exact historical question replay/explanation | requires persisted revision pin or new contract |
| D04 | Cross-device recovery of lost in-progress attempt token | requires persistent external attempt identity |
| D05 | Offline answer/progress sync | needs separate conflict model |
| D06 | Cross-device merge beyond server-current-state semantics | no V1 need |
| D07 | Manual progress correction | only if support evidence creates real need; must be narrow audited command |
| D08 | Manual mastery correction | same as above |
| D09 | Adaptive mastery algorithm | deterministic V1 policy first |
| D10 | FSRS / SM-2 advanced scheduling | schema lacks ease/interval state |
| D11 | Question review notebook / question_reviews table | explicitly excluded first phase |
| D12 | Translation Request -> Review -> Promote to Content | Content contract marks automation deferred |

## 12. NOT_SUPPORTED — 14

| ID | Capability | Reason |
| --- | --- | --- |
| N01 | Client supplies arbitrary `userId` for runtime reads/writes | IDOR risk |
| N02 | Public/internal attempt BIGINT | global public-ID rule |
| N03 | Public question_attempt BIGINT | aggregate internal fact |
| N04 | Public dictionary-history BIGINT | no external identity needed |
| N05 | Public translation-request BIGINT | opaque token only |
| N06 | Learning direct SQL/repository access to Content | owner boundary |
| N07 | Learning direct SQL/repository access to Identity | owner boundary |
| N08 | Client-side trusted scoring / answer key delivery | answer leakage |
| N09 | Generic table CRUD API | product/use-case architecture |
| N10 | Generic Admin editing of score/mastery/progress | user-fact integrity |
| N11 | Streak / XP / coins as Learning canonical tables | Rewards/product-later ownership |
| N12 | Generic analytics/clickstream in learning_activities | activity boundary |
| N13 | Anonymous dictionary history | physical `user_id NOT NULL` |
| N14 | Redis/Kafka/microservice for V1 Learning | no evidence / hard-stop |

## 13. Idempotency matrix

| Operation | V1 behavior |
| --- | --- |
| StartCourse | idempotent by PK/state |
| StartLesson | idempotent by PK/state |
| CompleteLesson | terminal state; repeat returns same completion |
| CompleteCourse | terminal state; repeat returns same completion |
| AddBookmark | ON CONFLICT no-op |
| RemoveBookmark | missing row is success |
| StartExerciseAttempt | advisory-lock + reuse active attempt |
| SubmitQuestionAnswer | unique attempt+question; identical retry returns stored result; different answer 409 |
| CompleteExerciseAttempt | terminal state; repeat returns stored result |
| AbandonExerciseAttempt | repeated abandoned success; completed conflicts |
| SubmitReviewResult | expectedUpdatedAt first-wins; stale retry 409 + refetch |
| RecordDictionarySearch | separate user intents may duplicate; no false semantic dedupe |
| RequestTranslation | each accepted call is independent; no schema-backed transport idempotency |

## 14. Authorization / ownership

Every learner repository query includes current `AuthContext.userPublicId` in the predicate. Opaque tokens are additionally cryptographically bound to that same UUID.

Rules：

```text
404 for invalid/not-owned opaque resource handles
409 for valid owned resource in incompatible state
401 for missing/invalid authentication
403 only where authenticated admin lacks Operations permission
```

Admin support path uses Operations authorization, not learner ownership shortcuts。

## 15. Freeze

```text
REQUIRED = 25
DEFERRED = 12
NOT_SUPPORTED = 14
Use Cases = FROZEN
Implementation = NOT_STARTED
Implementation dependency = CONTENT_GATE
```
