---
status: frozen
phase: 6
phase_name: Learning Domain
document: LEARNING_PROGRESS_CONTRACTS
design_only: true
implementation_started: false
last_updated: 2026-09-02
lifecycle: historical
derived_from: domains/learning/progress.md
---


# ZH-LAO  — Learning Progress / Mastery / Review / Practice Contracts

⚠️ **派生文档（DERIVED）** — 规范归属（canonical owner）：`domains/learning/progress.md`。本文件为实现轨（implementation-track）文档，**不是产品/领域事实权威**（Constitution 原则 II）。产品/领域事实以规范归属文档为准，请勿在此重复或自行修改事实。




> Canonical current-state、attempt/scoring、transaction/concurrency contract。所有规则适配 frozen `0500_learning.sql`；不得用 generic JSON/hidden metadata伪造缺失字段。

## 1. State ownership matrix

| Fact | Table | Kind | Key / identity |
| --- | --- | --- | --- |
| learning history | `learning_activities` | append history | BIGINT internal |
| course progress | `course_progress` | current state | `(user UUID, course UUID)` |
| lesson progress | `lesson_progress` | current state | `(user UUID, lesson UUID)` |
| mastery | `content_mastery` | current state | `(user UUID, content UUID)` |
| review | `content_reviews` | current state | `(user UUID, content UUID)` |
| bookmark | `content_bookmarks` | current preference | `(user UUID, content UUID)` |
| exercise attempt | `exercise_attempts` | aggregate root | BIGINT internal only |
| question attempt | `question_attempts` | child fact | BIGINT internal + question UUID |

## 2. Cross-domain UUID mapping

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

No cross-domain physical FK。Only `question_attempts.exercise_attempt_id -> learning.exercise_attempts.id` is same-domain physical FK。

## 3. Course state machine

```text
virtual absent/not_started
        |
        v
   in_progress
        |
        v
    completed (terminal)
```

Rules：

- read-miss返回 virtual not_started，不写 row；
- first Start -> in_progress + immutable started_at；
- completed_at只在首次 completed写入；
- completed不因 Content revision/archive回退；
- percent server-owned、0..100、round2、monotonic；
- resume last_lesson forward-only。

### 3.1 Denominator

Content Course/Lesson schema没有 optional Lesson flag，因此：

```text
all Lessons in the resolved published Course structure are completion-required
```

Percentage：

```text
completed lesson UUIDs / all lesson UUIDs * 100
```

0-Lesson published structure -> `LEARNING_COURSE_NOT_COMPLETABLE`。

## 4. Lesson state machine

```text
virtual absent/not_started
        |
        v
   in_progress
        |
        v
    completed (terminal)
```

`UpdateLessonProgress(sectionId)`：

1. Content trusted view resolves Lesson + ordered Sections；
2. verify Section belongs to Lesson；
3. `candidate = position / sectionCount * 100`；
4. persist `max(existing,candidate)`；
5. lastSection moves only forward；
6. touch updated_at。

No permanent LessonItem progress。

### 4.1 CompleteLesson preconditions

Before first completion，Content trusted Lesson learning-structure view must prove：

- sectionCount > 0；
- current `last_section_id` = final Section UUID；
- every `lesson_item` with `item_type=exercise AND is_required=true` has at least one completed Learning attempt for its Exercise UUID；
- required Knowledge items are resolvable Content UUIDs。

No client-supplied “completed=true” bypass。

If Content final public module cannot expose the required typed learning-structure view, Learning implementation is blocked; direct SQL `content.*` is forbidden。

## 5. Progress transaction contracts

### StartCourse

```text
resolve Content Course before tx
-> BEGIN
-> lock/upsert course_progress(user,course)
-> first transition only: in_progress + course_started activity
-> COMMIT
```

### StartLesson

```text
resolve Lesson + parent Course + ordering before tx
-> BEGIN
-> lock course_progress(user,course)
-> start course if absent
-> lock lesson_progress(user,lesson)
-> start lesson if absent
-> move course resume anchor forward if needed
-> append only first-transition activities
-> COMMIT
```

### CompleteLesson

```text
resolve trusted Lesson/Course structure before tx
-> BEGIN
-> lock course_progress(user,course)
-> lock lesson_progress(user,lesson)
-> if already completed: return current state
-> validate completion preconditions against resolved structure + Learning attempts
-> mark Lesson completed/100%
-> append lesson_completed
-> initialize required Knowledge mastery/review rows
-> recompute Course percent from all Lessons
-> if every Lesson completed: first-transition Course completed
-> insert lesson_completed outbox
-> if Course first completed: insert course_completed outbox
-> COMMIT
```

Content reads are not a distributed transaction. The command uses the already validated stable UUID snapshot for that transaction；next command resolves current Content again。

## 6. Revision semantics

No Learning table has a Content revision column。

Therefore：

- Progress/Mastery/Review/Bookmark persist stable entity UUID only；
- completed facts remain immutable；
- long-term exact historical practice replay is not guaranteed；
- in-progress practice exact revision lives only in encrypted attempt token；
- revision UUID cannot be smuggled into `answer_data`/generic activity metadata。

Future permanent replay requires forward migration / explicit design revision。

## 7. Mastery contract

### 7.1 Initialization

On first successful Lesson completion, for every required Knowledge Content UUID：

```text
missing row:
  status = learning
  score = 0
  first_learned_at = now
  last_practiced_at = now
  correct_count = 0
  incorrect_count = 0
existing row:
  preserve score/status/counters/first_learned_at
  last_practiced_at = now
```

Existing review/mastery rows never reset from Lesson replay。

### 7.2 Review-driven score

| Outcome | Score delta | correct_count | incorrect_count |
| --- | ---: | ---: | ---: |
| again | -20 | +0 | +1 |
| hard | +5 | +1 | +0 |
| good | +15 | +1 | +0 |
| easy | +25 | +1 | +0 |

Score: `clamp(previous ?? 0 + delta, 0, 100)`。

```text
no row -> virtual new
0..39 -> learning
40..79 -> familiar
80..100 -> mastered
```

`mastered_at` set on transition into mastered；clear on transition below 80；do not rewrite while remaining mastered。

Generic Exercise result does not update mastery absent a frozen Content mastery-target mapping。

## 8. Review contract

First required Knowledge learning initializes：

```text
next_review_at = learnedAt + 1 day
priority = 50
review_count = 0
last_reviewed_at = null
```

SubmitReviewResult requires：

```text
review row exists
next_review_at <= now
request.expectedUpdatedAt == row.updated_at
```

Otherwise：not scheduled/not due/stale -> conflict/error；no ad-hoc review creation。

Transaction lock order for one content：mastery then review。

Accepted result：apply mastery delta；`review_count += 1`；set lastReviewed；compute next schedule；append `review_completed`。

For `n=new review_count`：

```text
again -> +10 minutes, priority 100
hard  -> +1 day, priority 75
good  -> +min(30, 2^(min(n-1,5))) days, priority 50
easy  -> +min(60, 2 * 2^(min(n-1,5))) days, priority 25
```

Same stale `expectedUpdatedAt` cannot be accepted twice。

## 9. Bookmark concurrency

Add：`INSERT ... ON CONFLICT (user_id,content_id) DO NOTHING`。

Remove：delete by `(current user, content UUID)`；missing is success。

Concurrent add/remove follows DB commit order；API does not invent cross-network ordering semantics。

## 10. Exercise attempt lifecycle

```text
in_progress -> completed
in_progress -> abandoned
```

No reverse transition。

### 10.1 Active-attempt lock

Application invariant：same `(user,exercise)` at most one in-progress row。

Start uses deterministic PostgreSQL transaction advisory lock derived from user UUID + exercise UUID。

### 10.2 maxAttempts

Content Exercise `max_attempts`：

```text
null -> unlimited by this rule
N -> total created Learning attempt rows for (user,exercise) may not exceed N
```

Completed + abandoned + current all count。If active exists, Start does not create another。If terminal count already reaches N, new Start -> `LEARNING_MAX_ATTEMPTS_REACHED`。

### 10.3 Start and token

```text
resolve current published Exercise + current published revision
-> BEGIN
-> advisory_xact_lock(user,exercise)
-> if active exists: 409 LEARNING_ATTEMPT_ALREADY_IN_PROGRESS
-> count prior attempts; enforce maxAttempts
-> insert attempt(status=in_progress)
-> append exercise_started
-> COMMIT
-> return encrypted attemptToken
```

Token payload conceptually：

```ts
{
  v: 1,
  attemptInternalId: bigint,
  userId: UserPublicId,
  exerciseId: ExercisePublicId,
  exerciseRevisionId: ContentRevisionId,
  issuedAt: string
}
```

Token requirements：authenticated encryption；versioned key；never URL/log/outbox/cross-domain persistence；AuthContext user must equal token user。

### 10.4 Why active tokens cannot be reissued

DB row has no revision ID，and superseded Content revisions do not preserve enough publication-time history to infer the exact revision。Therefore an active row found by a later Start cannot safely receive a newly guessed token。

V1 recovery：

```text
POST abandon-active by authenticated user + exercise UUID
-> advisory lock
-> locate current active row
-> in_progress -> abandoned
```

Then user may Start a new attempt if maxAttempts allows。This recovery is destructive by design；non-destructive lost-token/cross-device resume = Deferred。

## 11. Trusted scoring boundary

Content owns answer truth；Learning owns user answer/result。

```text
attemptToken exact revision
-> Content resolvePracticeForScoring(exerciseId, revisionId)
-> find question under pinned exercise snapshot
-> validate typed answer
-> deterministic score
-> persist user answer + result only
```

Runtime never receives `is_correct` source fields/answer rules before evaluation。

Typed answer forms：

```text
single_choice/listen_choice/content_choice:
  { selectedOptionPosition }
multiple_choice:
  { selectedOptionPositions[] sorted unique }
true_false:
  { value:boolean }
fill_blank:
  { text:string }
ordering:
  { orderedOptionPositions[] unique }
matching:
  { pairs[{leftPosition,rightPosition}] }
```

Unknown fields rejected；array/cardinality limits derive from trusted question definition。

`earned_score` range `0..question.maxScore`；`is_correct` means full-correct；partial credit may be false + positive earned score。Use decimal-safe calculation, round2。

## 12. Question submission

```text
resolve/decrypt token + trusted scoring view
-> BEGIN
-> SELECT exercise_attempt FOR UPDATE
-> verify current user/exercise/status=in_progress
-> existing question_attempt?
   same normalized answer -> return stored result
   different answer -> 409
-> insert question_attempt
-> COMMIT
```

Once inserted, answer immutable。

## 13. Exercise completion

Content Question schema has no optional flag，so every Question in pinned Exercise revision is required for completion。

```text
resolve trusted pinned exercise
-> BEGIN
-> lock exercise_attempt
-> completed? return stored final result
-> abandoned? 409
-> verify every pinned question has one question_attempt
-> aggregate max/earned score
-> update attempt completed + scores + completed_at
-> append exercise_completed
-> insert learning.exercise_completed.v1 outbox
-> COMMIT
```

Late answer vs Complete both lock the attempt row：answer-first may be counted；complete-first makes late answer fail。

`passing_score` remains Content definition；when pinned view is available API may derive `passed` but Learning does not persist a new pass column。

### Abandon

Token-specific abandon locks target attempt。Recovery abandon-active locks `(user,exercise)` then active row。Repeated abandoned is idempotent；completed cannot be abandoned。

## 14. Outbox mapping

Shared table：`infrastructure.system_outbox_events`。

```text
learning.lesson_completed.v1
 aggregate_type=lesson
 aggregate_id=lessonId
 payload={userId,courseId,lessonId,occurredAt}

learning.course_completed.v1
 aggregate_type=course
 aggregate_id=courseId
 payload={userId,courseId,occurredAt}

learning.exercise_completed.v1
 aggregate_type=exercise
 aggregate_id=exerciseId
 payload={userId,exerciseId,scorePercent,occurredAt}
```

Canonical transition + outbox insert same transaction。No BIGINT/token/raw answer/translation text。

## 15. Translation worker concurrency

`translation_requests.id` remains internal。

Claim：

1. select pending or processing candidate；
2. acquire PostgreSQL **session** advisory lock on internal request id；
3. short tx CAS to `processing`；
4. provider call outside DB transaction while session lock held；
5. short tx CAS `processing -> succeeded|failed`；
6. release lock。

Worker crash releases session lock；another worker may reclaim。If DB session is lost while a provider call still physically completes, provider invocation can be at-least-once；terminal row CAS is first-terminal-wins。Translation is not treated as an exactly-once external side effect。

## 16. Global lock order

Within use cases that need these states：

```text
1 course_progress
2 lesson_progress
3 exercise_attempt (or user+exercise advisory lock before its row)
4 question_attempt child operation under attempt lock
5 content_mastery (UUID ascending for batch)
6 content_reviews (same UUID order)
7 single bookmark PK operation
```

Never lock review then mastery when another path uses mastery then review。

## 17. Required race tests

- concurrent StartCourse；
- Start/Complete Lesson races；
- CompleteLesson vs progress update；
- two ReviewResult submissions same expectedUpdatedAt；
- Bookmark add/remove race；
- two StartExercise same user/exercise -> one created, one 409；
- maxAttempts boundary；
- lost-token recovery abandon-active；
- same-question duplicate same answer；
- same-question duplicate different answer；
- CompleteExercise vs late answer；
- duplicate CompleteExercise；
- translation double claim；
- translation worker crash/reclaim；
- completion outbox exactly once。

## 18. Freeze

```text
Progress = FROZEN
Course denominator = ALL PUBLISHED STRUCTURE LESSONS
Lesson completion guard = FROZEN
Mastery policy = FROZEN
Review policy = FROZEN
Practice lifecycle = FROZEN
maxAttempts = FROZEN
Attempt active-token no-reissue = FROZEN
All pinned questions required = FROZEN
Trusted scoring = FROZEN
Transactions/lock order = FROZEN
Outbox = FROZEN
Migration changes = 0
```
