---
status: frozen
phase: 6
phase_name: Learning Domain
document: LEARNING_PROGRESS_CONTRACTS
design_only: true
implementation_started: false
last_updated: 2026-08-31
---

# ZH-LAO V2 — Learning Progress / Mastery / Review / Practice Contracts

> 本文是 Learning current-state、attempt/scoring、transaction/concurrency 的 canonical contract。所有规则必须适配 `0500_learning.sql`，不得通过隐藏字段或新表绕过 frozen database contract。

## 1. State ownership matrix

| Fact | Table | Kind | Owner rule |
| --- | --- | --- | --- |
| learning history | `learning_activities` | immutable history | append only |
| course progress | `course_progress` | current state | one row per user+course |
| lesson progress | `lesson_progress` | current state | one row per user+lesson |
| mastery | `content_mastery` | current state | one row per user+content |
| review schedule | `content_reviews` | current state | one row per user+content |
| bookmark | `content_bookmarks` | current preference | one row per user+content |
| exercise attempt | `exercise_attempts` | attempt aggregate root | internal BIGINT only |
| question attempt | `question_attempts` | attempt child fact | internal BIGINT + question UUID |

## 2. Cross-domain identity contract

Physical UUID fields map exactly to Content/Identity public IDs：

```text
user_id         -> Identity UserPublicId
course_id       -> Content CoursePublicId
last_lesson_id  -> Content LessonPublicId
lesson_id       -> Content LessonPublicId
last_section_id -> Content LessonSectionPublicId
content_id      -> Content ContentPublicId
exercise_id     -> Content ExercisePublicId
question_id     -> Content QuestionPublicId
```

No cross-domain physical FK。`question_attempts.exercise_attempt_id` 是合法 same-domain FK。

## 3. Course state machine

```text
virtual absent/not_started
        |
        v
   in_progress
        |
        v
    completed
```

Rules：

- runtime start 不创建持久化 `not_started` row；row一旦创建通常直接 `in_progress`；
- `started_at` 首次进入 in_progress后 immutable；
- `completed_at` 仅 completed时非空；
- completed terminal，不因 Content revision/archive恢复为 in_progress；
- `progress_percent` 由 server计算，range 0..100；
- `last_lesson_id` 只能引用 Course当前/历史可解析 Lesson public UUID。

Course percentage：

```text
completed published lessons / total required published lessons * 100
```

round 到 2 decimals。用户已获得百分比保持 monotonic：

```text
newPercent = max(existingPercent, computedPercent)
```

若 `total required lessons = 0`，Course不能被 learner complete，返回 `LEARNING_COURSE_NOT_COMPLETABLE`；Content publish流程本应阻止不可学习结构，但 Learning仍 fail closed。

## 4. Lesson state machine

```text
virtual absent/not_started
        |
        v
   in_progress
        |
        v
    completed
```

`UpdateLessonProgress(sectionId)`：

1. resolve Lesson current/trusted reference；
2. resolve ordered sections；
3. verify section belongs to lesson；
4. candidate = position / sectionCount * 100；
5. persist `max(existing,candidate)`；
6. update `last_section_id` only if candidate is ahead；
7. touch `updated_at`。

`CompleteLesson` sets exactly 100%。No permanent LessonItem progress。

## 5. Course / Lesson transaction contract

### StartLesson

```text
resolve Content Lesson + Course before write tx
-> BEGIN
-> advisory/row lock course_progress(user,course)
-> upsert/start course if needed
-> lock lesson_progress(user,lesson)
-> upsert/start lesson
-> update forward-only course resume anchor
-> append first-transition activities
-> COMMIT
```

### CompleteLesson

```text
resolve published/trusted Course structure before tx
-> BEGIN
-> lock course_progress(user,course)
-> lock lesson_progress(user,lesson)
-> if already completed: return current state
-> mark lesson completed
-> append lesson_completed activity
-> compute/update course percent from Learning completed rows + resolved structure
-> initialize required knowledge mastery/reviews
-> if all required lessons completed: mark course completed
-> write lesson_completed outbox
-> if first course completion: write course_completed outbox
-> COMMIT
```

Content reads不能与 Learning transaction绑定为 distributed transaction。若 Content在 read后发生 publication change，Learning依据 stable UUID与已经验证的 command snapshot完成本次 transaction；下一次 command再读取新 current structure。

## 6. Content revision semantics

Learning physical rows没有 revision columns，因此：

- current progress/mastery状态跟 stable entity UUID；
- historical completion facts不重写；
- V1 attempt exact scoring revision通过 opaque token携带，不持久化在 `answer_data/metadata`；
- long-term exact replay不是 V1 guarantee。

如果未来产品要求“任何历史 attempt 永久可按原题定义重放”，必须新增 forward migration / explicit design change；当前设计不假装数据库已经支持。

## 7. Mastery contract

### 7.1 Initialization

Required knowledge Content在 Lesson首次 completion 时：

```text
if no mastery row:
  status = learning
  score = 0
  first_learned_at = now
  last_practiced_at = now
else:
  preserve score/counters/status
  last_practiced_at = now
```

Lesson re-completion不会 reset mastery。

### 7.2 Review-driven update

Outcome matrix：

| Outcome | Score delta | Correct | Incorrect |
| --- | ---: | ---: | ---: |
| again | -20 | +0 | +1 |
| hard | +5 | +1 | +0 |
| good | +15 | +1 | +0 |
| easy | +25 | +1 | +0 |

Score：`clamp(previous ?? 0 + delta, 0, 100)`。

Status：

```text
no row/no learning fact -> new
0..39   -> learning
40..79  -> familiar
80..100 -> mastered
```

`mastered_at`：进入 mastered时写 now；mastered -> lower 时清空；mastered内保持原值。

No generic admin mutation。No DB trigger。No ML/AI adaptive policy in V1。

## 8. Review schedule contract

One current row guaranteed by PK `(user_id, content_id)`。

### Initial schedule

First lesson-based learning initializes：

```text
next_review_at = learnedAt + 1 day
priority = 50
review_count = 0
last_reviewed_at = null
```

Existing row is not reset。

### Submit outcome

Request must carry `expectedUpdatedAt` returned by the due-review/read API。

Transaction：

```text
BEGIN
-> lock mastery(user,content), create if required
-> lock review(user,content), create if absent only when domain semantics allow
-> compare expectedUpdatedAt
-> apply mastery delta
-> review_count += 1
-> set last_reviewed_at = now
-> compute next_review_at/priority
-> append review_completed activity(metadata: outcome only)
-> COMMIT
```

Schedule after accepted result (`n = new review_count`)：

```text
again = +10 minutes, priority 100
hard  = +1 day, priority 75
good  = +min(30, 2^(min(n-1,5))) days, priority 50
easy  = +min(60, 2 * 2^(min(n-1,5))) days, priority 25
```

Concurrent submissions：first committed `expectedUpdatedAt` wins；stale command -> 409。Client refetches；服务端绝不把两个 uncertain retries都算成两次 review。

## 9. Bookmark concurrency

Add：

```sql
INSERT ... ON CONFLICT (user_id, content_id) DO NOTHING
```

Remove：

```sql
DELETE ... WHERE user_id=? AND content_id=?
```

Add vs Remove race采用 database serialization order；最后成功提交的 command定义 current state。API不承诺跨网络乱序请求合并。

## 10. Exercise attempt lifecycle

```text
in_progress -> completed
in_progress -> abandoned
```

No reverse transition。

Application invariant：same `(userId, exerciseId)` at most one in-progress attempt。Database没有对应 unique index，因此 Start必须使用 deterministic transaction advisory lock key derived from user UUID + exercise UUID。

Start：

```text
resolve exercise + current published revision from Content
-> BEGIN
-> advisory_xact_lock(user,exercise)
-> find in_progress attempt
-> if found: issue/reuse API context for that row
-> else insert exercise_attempt + activity
-> COMMIT
-> return opaque attemptToken
```

## 11. Opaque attempt token contract

Token必须 authenticated + encrypted，不能只是 base64/raw signed JSON。Conceptual payload：

```ts
type AttemptTokenPayload = {
  v: 1;
  attemptInternalId: bigint; // only inside encrypted payload
  userId: UserPublicId;
  exerciseId: ExercisePublicId;
  exerciseRevisionId: ContentRevisionId;
  issuedAt: string;
};
```

Rules：

- token不作为 Domain public ID；
- 不写 Learning DB；
- 不写 logs/outbox/analytics；
- runtime所有 attempt command同时校验 AuthContext user = token user；
- invalid/tampered/not-owned统一按 not-found处理；
- secret/key version由 server runtime configuration/environment管理；
- token lost -> V1不保证 cross-device restore。

## 12. Trusted scoring contract

Content owns answer truth；Learning owns submitted answer/result。

Flow：

```text
attemptToken gives pinned exercise revision
-> Content resolvePracticeForScoring(pinned revision)
-> locate question under that exact exercise snapshot
-> validate typed answer
-> deterministic trusted scoring
-> Learning persists only user answer + result
```

No client answer key。

### Typed answer schemas

```ts
single_choice/listen_choice/content_choice:
  { selectedOptionPosition: int >= 1 }

multiple_choice:
  { selectedOptionPositions: int[] sorted unique }

true_false:
  { value: boolean }

fill_blank:
  { text: string }

ordering:
  { orderedOptionPositions: int[] unique }

matching:
  { pairs: { leftPosition:int; rightPosition:int }[] }
```

Unknown fields rejected。Maximum array lengths derived from trusted question definition。

### Scoring authority

- option/rule semantics与 normalization来自 Content `TrustedScoringView`；
- Learning scoring adapter执行 deterministic compare/partial-credit calculation；
- Content不写 Learning tables；
- `earned_score` must be `0..question.score`；
- `is_correct` 表示 full correctness；
- aggregate `total_score` = sum question max scores；
- `earned_score` = sum persisted child earned scores；
- `score_percent = total=0 ? 0 : earned/total*100`，decimal-safe round 2。

## 13. Question submission contract

Within one attempt/question only one canonical answer fact。

Pseudo flow：

```text
resolve/decrypt token + trusted scoring view before write boundary
-> BEGIN
-> SELECT exercise_attempt FOR UPDATE
-> verify user/exercise/status=in_progress
-> find existing question_attempt
   -> same normalized answer: return stored result
   -> different answer: 409
-> insert question_attempt
-> COMMIT
```

Question answer is immutable once inserted。No “edit answer until complete” in V1。

## 14. Exercise completion atomicity

```text
resolve trusted scoring snapshot/questions
-> BEGIN
-> SELECT exercise_attempt FOR UPDATE
-> if completed: return stored final result
-> if abandoned: 409
-> verify required question attempts
-> aggregate scores from persisted question_attempts
-> update attempt completed + scores + completed_at
-> append exercise_completed activity
-> write learning.exercise_completed.v1 outbox
-> COMMIT
```

Generic exercise completion不自动更新 mastery/review，因为 current Content contract没有唯一 mastery-target mapping。Lesson completion + explicit review flow承担 V1 mastery/review updates。

Late answer submit与 Complete race都先锁 same exercise_attempt row，因此只能按 commit order出现：

- answer先拿锁 -> answer提交后 completion可计入；
- completion先拿锁 -> completed后 late answer 409。

## 15. Outbox contract

Shared outbox：`infrastructure.system_outbox_events`，same transaction。

### LessonCompleted

```text
event_type: learning.lesson_completed.v1
aggregate_type: lesson
aggregate_id: lessonId UUID
payload: { userId, courseId, lessonId, occurredAt }
```

### CourseCompleted

```text
event_type: learning.course_completed.v1
aggregate_type: course
aggregate_id: courseId UUID
payload: { userId, courseId, occurredAt }
```

### ExerciseCompleted

```text
event_type: learning.exercise_completed.v1
aggregate_type: exercise
aggregate_id: exerciseId UUID
payload: { userId, exerciseId, scorePercent, occurredAt }
```

No attempt BIGINT / raw answers。Consumer dedupe uses outbox `event_id`。

## 16. Translation worker concurrency

`translation_requests.id BIGINT` stays internal。

Claim pattern：

1. select pending, or reclaim processing candidate；
2. acquire PostgreSQL session advisory lock derived from internal id；
3. short tx CAS state to `processing`；
4. commit；
5. provider call outside transaction；
6. short tx CAS `processing -> succeeded|failed`；
7. release session lock。

Worker crash releases advisory lock。No long-running DB transaction across provider call。No durable retry counter exists in schema, so V1 only performs bounded adapter-local transient retries; terminal provider error -> failed。

## 17. Global lock order

To avoid cycles：

```text
1. course_progress
2. lesson_progress
3. exercise_attempts
4. question_attempts (insert/find under attempt lock)
5. content_mastery (content UUID ascending if batch)
6. content_reviews (same UUID order)
7. bookmark uses single-row PK operation
```

A use case that does not need earlier locks must not acquire them gratuitously。No transaction may lock review then mastery if another path uses mastery then review。

## 18. Race test matrix required for implementation

- concurrent StartCourse；
- concurrent Start/Complete Lesson；
- CompleteLesson vs second device progress update；
- same review two submissions with same expectedUpdatedAt；
- concurrent Add/Remove bookmark；
- concurrent StartExerciseAttempt same user/exercise；
- duplicate question submit same answer；
- duplicate question submit different answer；
- CompleteExercise vs late answer；
- CompleteExercise duplicate；
- translation worker double claim；
- translation worker crash/reclaim；
- outbox emitted once for terminal lesson/course completion。

## 19. Freeze

```text
Progress contract = FROZEN
Mastery policy = FROZEN
Review policy = FROZEN
Practice lifecycle = FROZEN
Trusted scoring boundary = FROZEN
Transaction order = FROZEN
Concurrency strategy = FROZEN
Outbox contract = FROZEN
Migration changes = 0
```
