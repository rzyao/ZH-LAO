---
status: frozen
phase: 6
phase_name: Learning Domain
document: LEARNING_PRODUCT_SEMANTICS
design_only: true
implementation_started: false
last_updated: 2026-08-31
repository_commit_audited: f5b3f3f41468036ecbd1544c6a9b3c5fbf9668db
database_authority:
  - database/v2/migrations/0500_learning.sql
---

# ZH-LAO V2 — Learning Product Semantics

> Learning 只拥有“某个用户开始学习后产生的状态与事实”。Content 继续拥有课程、Lesson、知识、练习定义、答案真相与 Revision；Identity 继续拥有用户身份。本文适配 frozen `0500_learning.sql`，不新增表、不修改 migration。

## 1. Repository / dependency reality

设计入口审计：

```text
entry main HEAD = f5b3f3f41468036ecbd1544c6a9b3c5fbf9668db
SQL migrations = 18
Learning authority = database/v2/migrations/0500_learning.sql
Learning tables = 10
```

上游：

- Identity = `COMPLETE / PASS / FROZEN`，已有 `modules/identity/public`；
- Platform = `COMPLETE / PASS / FROZEN`；
- Admin Foundation = `COMPLETE / PASS`；
- Mobile Foundation = `COMPLETE / PASS`；
- Operations 有 implementation/public code，但 current docs 尚无 final implementation report / authoritative `OPERATIONS_GATE = PASS`；
- Content = `CONTENT_DESIGN_GATE = PASS`，API/public/trusted-scoring contract 已冻结；当前没有 `apps/backend/src/modules/content/public` implementation，也没有 `CONTENT_GATE = PASS`。

因此：

```text
Learning Design may PASS
Learning Implementation = BLOCKED_BY_CONTENT_GATE
```

## 2. Frozen physical model

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

Ownership rule：

```text
零用户时仍存在 -> Content
用户开始学习后才产生 -> Learning
```

Cross-domain fields只保存 Owner Domain stable logical UUID，无跨域 physical FK；internal BIGINT永不成为 HTTP/public identity。

## 3. Activity vs current state

`learning_activities` 是 immutable canonical learning history，不是 Event Sourcing，也不是通用 analytics/clickstream。

Frozen types：

```text
course_started
lesson_started
lesson_completed
content_viewed
content_practiced
exercise_started
exercise_completed
review_completed
```

Transition semantics：

- `course_started`：首次进入 `in_progress`；
- `lesson_started`：首次进入 `in_progress`；
- `lesson_completed`：首次进入 `completed`；
- `exercise_started`：真正创建一个新 attempt；
- `exercise_completed`：attempt首次 `in_progress -> completed`；
- `review_completed`：一次 review result被成功接受；
- `content_viewed/content_practiced`：有学习语义的内容交互，不承载 page view/telemetry。

改变 current state 的 command必须在同一 Learning transaction写对应 activity。没有新 transition的 retry不得重复 transition activity。

`metadata` 必须按 activity type allowlist；禁止 raw answer、translation全文、任意客户端 JSON、opaque token、跨域内部 ID。

## 4. Course progress

### 4.1 Start / missing state

`GetCourseProgress` 对不存在 row返回 virtual `not_started / 0%`，纯读不创建行。

`StartCourse`：Content验证 Course当前可学习；当前 authenticated Identity有效；首次创建 `in_progress`、`started_at=now`并写 `course_started`。重复 start返回现有状态。

### 4.2 V1 completion denominator

`content.lessons` 没有 optional/required flag，因此 **V1 published Course structure中的每个 Lesson都属于 completion-required Lesson**。

Course progress：

```text
completed lessons in resolved published course structure
-------------------------------------------------------- * 100
all lessons in resolved published course structure
```

round 2 decimals，且：

```text
persistedPercent = max(existingPercent, computedPercent)
```

Course structure为 0 Lesson时不允许 learner complete，fail closed。

### 4.3 Resume / terminal state

- `last_lesson_id` 是最远推进的 resume anchor，只向课程顺序前方移动；
- 重看旧 Lesson不回退 resume anchor；
- `completed` 是 terminal user-learning fact；
- `completed_at` 首次完成时写入，之后不重写；
- Content后续增加 Lesson/revision不会 retroactively reopen一个已完成 Course；
- archived/unpublished Course不允许新 Start，但既有 progress/history仍保留、可通过 trusted Content resolver展示。

## 5. Lesson progress

`StartLesson`：验证 published Lesson及其 Course关系；确保 Course progress至少 started；首次 Lesson start写 `lesson_started`。

`UpdateLessonProgress` 只接收 `lessonSectionId`，不接收 percentage：

1. Content验证 Section属于该 Lesson；
2. 读取 ordered Sections；
3. candidate = section position / section count * 100；
4. `progress_percent=max(existing,candidate)`；
5. `last_section_id`只向前移动。

### 5.1 Completion guard

`CompleteLesson` 不是“客户端说完成就完成”。V1要求：

- published Lesson至少有 1 个 Section；
- `last_section_id` 已到该 Lesson最后一个 Section；
- Content Lesson structure中 `is_required=true` 的 Exercise items，都至少存在该用户一个 `completed` ExerciseAttempt；
- required Knowledge items不建立 item-progress；到达其 Section即可视为已学习，并在首次 Lesson completion初始化 Mastery/Review；
- Content final public implementation必须给 Learning一个 typed trusted Lesson learning-structure view，能得到 ordered Sections及 required Knowledge/Exercise UUID。若 final `content/public` 不能提供，LRN-00必须阻塞实现，不能 direct SQL `content.*` 补洞。

首次完成：Lesson `status=completed, progress_percent=100, completed_at=now`，写 activity，同 transaction更新 Course progress；如果该 published Course所有 Lessons均已完成，则自动完成 Course。显式 CompleteCourse只是 idempotent verification command。

V1不建 Unit progress / LessonItem progress。

## 6. Revision / historical semantics

Content拥有 immutable revision UUID，但 `0500_learning.sql` 没有 persisted revision UUID column。

V1裁决：

- progress/mastery/review/bookmark跟 stable entity UUID；
- completed user facts不因 Content新 revision改写；
- historical `question_attempts.answer_data/is_correct/earned_score` 是最终 user-result fact；
- **不承诺**仅凭持久化 Learning rows永久重放当时完整题目/答案解释；
- in-progress Exercise exact revision由 opaque attempt token绑定；
- persisted revision pin / long-term exact historical replay = `DEFERRED`；
- revision UUID不得偷塞进 `answer_data`/generic activity metadata当隐式 schema。

所以当前：

```text
DATABASE_CONTRACT_CONFLICT = 0
```

前提是 V1不虚假承诺 long-term exact replay。

## 7. Content Mastery

`content_mastery` 是 current user state。

### 7.1 Initialization

Lesson首次成功 completion时，对其 required Knowledge item的 Content UUID：

```text
if missing:
  mastery_status = learning
  mastery_score = 0
  first_learned_at = now
  last_practiced_at = now
  correct_count = 0
  incorrect_count = 0
if existing:
  preserve score/status/counters/first_learned_at
  last_practiced_at = now
```

重复 Lesson completion不 reset mastery。

### 7.2 Deterministic V1 update

Review outcome：

```text
again | hard | good | easy
```

Delta：

```text
again -> score -20, incorrect_count +1
hard  -> score +5,  correct_count +1
good  -> score +15, correct_count +1
easy  -> score +25, correct_count +1
```

Score从 null按 0起算并 clamp `0..100`。

Status：

```text
new      = no persisted learning fact
learning = 0..39
familiar = 40..79
mastered = 80..100
```

`mastered_at` 是“当前这一次进入 mastered”的时间：首次跨入 >=80写 now；跌破 80清空；保持 mastered不重写。

Generic Exercise completion **不自动猜 mastery target**。Current Content contract没有冻结“一道 Question唯一对应哪个 mastery Content”的 target semantics；不得从 prompt/reference/answer rule猜测。

## 8. Review scheduling

`content_reviews` 是每 `(user,content)` 唯一 current schedule。

首次 required Knowledge learning初始化：

```text
next_review_at = now + 1 day
priority = 50
review_count = 0
last_reviewed_at = null
```

已有 row不 reset。

`SubmitReviewResult`：

- review row必须已经存在且 `next_review_at <= now`；V1不允许 ad-hoc创建 review；
- request携带 current `expectedUpdatedAt`；
- mastery/review row lock；
- accepted后 `review_count += 1`、`last_reviewed_at=now`、写 `review_completed`；
- stale concurrent submit -> `409`。

令 `n=new review_count`：

```text
again -> +10 minutes, priority 100
hard  -> +1 day, priority 75
good  -> +min(30, 2^(min(n-1,5))) days, priority 50
easy  -> +min(60, 2 * 2^(min(n-1,5))) days, priority 25
```

FSRS/SM-2/ease/interval持久化均 Deferred；schema没有这些字段，不伪造。

## 9. Bookmarks

- Add要求 Content current-public，可 `ON CONFLICT DO NOTHING`；
- Remove不要求 Content仍 active，不存在也成功；
- List按 `created_at DESC, content_id`；
- disabled/archived Content的历史 bookmark保留并返回 availability；
- batch status最多100 UUID；
- Bookmark不是 learning activity。

## 10. Practice attempts

State：

```text
in_progress -> completed
in_progress -> abandoned
completed/abandoned = terminal
```

### 10.1 One active attempt / maxAttempts

同一 `(userId,exerciseId)` V1最多一个 in-progress attempt；DB没有 partial unique，Start使用 transaction advisory lock。

Content `max_attempts` 语义：

- null = no configured maximum；
- non-null = 该 user + exercise **累计创建的 attempt rows最大数量**；
- completed、abandoned都计数，避免 abandon绕过 attempt limit；
- 已有 active attempt时不创建新 row；
- count达到 maxAttempts -> `LEARNING_MAX_ATTEMPTS_REACHED`。

### 10.2 Opaque attempt token and the no-reissue rule

Start在“无 active + 未达 maxAttempts”时：

1. resolve current published Exercise + current published revision；
2. create `exercise_attempts` row；
3. append `exercise_started`；
4. 返回 authenticated-encrypted `attemptToken`，绑定：internal attempt id、user UUID、exercise UUID、exact exercise revision UUID、issuedAt/token version。

因为 frozen Learning schema **没有 revision column**，server无法仅凭已有 in-progress row安全重建原 revision token。因此：

- Start发现 active attempt -> `409 LEARNING_ATTEMPT_ALREADY_IN_PROGRESS`；**不得“猜 revision 后重新签 token”**；
- client持有 token时直接继续 answer/result/complete，不再调用 Start；
- token丢失时可调用 recovery abandon-active（按 authenticated user + exercise UUID），将当前 active attempt标记 abandoned，再尝试 Start；
- recovery abandon会计入 maxAttempts；
- “无损 token reissue / cross-device resume / transport-start idempotency”属于 Deferred；
- token不是 stable public ID，不可被其他 Domain持久化，不进 URL/log/outbox。

这是一项由 frozen schema决定的明确 V1限制，不用隐藏字段假装解决。

### 10.3 Question answers

Content trusted scoring view按 token pinned revision解析。`question_attempts`每 `(attempt,question)`只接受一次 canonical answer。

Typed answer：

```text
single_choice/listen_choice/content_choice -> selectedOptionPosition
multiple_choice -> selectedOptionPositions[] sorted unique
true_false -> value boolean
fill_blank -> text
ordering -> orderedOptionPositions[] unique
matching -> pairs[{leftPosition,rightPosition}]
```

- answer_data只保存 typed user answer；
- same normalized answer retry返回 stored result；
- different answer retry -> `409 LEARNING_ANSWER_ALREADY_SUBMITTED`；
- 不 UPDATE 已提交答案；
- `is_correct=true`只表示 full-correct；partial credit允许 `false + earned_score>0`；
- decimal-safe score，round 2。

### 10.4 Complete / abandon

`content.questions` 没有 optional flag，因此 **pinned Exercise revision中的全部 Questions都属于 completion-required Questions**。

Complete：锁 attempt；要求全部 pinned Questions已有 question attempt；汇总 total/earned/percent；首次 `completed` 后 immutable；重复 complete返回相同结果。

`passing_score` 不在 Learning持久化；当 token/pinned Content view可用时 response可计算 `passed = scorePercent >= passingScore`。Stored canonical fact仍是 score/result。

Abandon：

- token path：abandon token指向的 active attempt；
- recovery path：authenticated user + exercise UUID，在 advisory lock下 abandon该 exercise当前 active attempt；
- repeated abandon idempotent；completed后 abandon conflict。

## 11. Dictionary search history

Content负责真实 dictionary lookup/search；Learning只记 history。

- physical `user_id NOT NULL` -> V1 authenticated only；
- query intent完成时记录；零结果允许；`selected_content_id`可空；
- selected UUID非空时由 Content验证；
- 不做错误 semantic dedupe；
- list default20/max50，`searched_at DESC` + internal id仅作为 opaque cursor tie-break；
- retention：180天且每 user最多最近500条，后台 cleanup物理删除超出记录。

## 12. Runtime translation

`translation_requests` = runtime request/result，不是 canonical `content.translations`。

V1 authenticated only；nullable `user_id`保留未来 guest可能性但当前不开放。

```text
pending -> processing -> succeeded
pending -> processing -> failed
```

- Create返回 `202 + translationToken`；token encrypted绑定 internal request id + user UUID；
- provider/model server-selected；生产未配置 -> fail closed `PROVIDER_UNAVAILABLE`；
- PostgreSQL/Foundation worker；no Redis/Kafka；
- session advisory lock跨 provider call，DB transaction不跨网络调用；
- crash释放 session lock；任何 processing candidate只有拿到 lock才可 reclaim；
- provider call可能在极端连接丢失下 at-least-once，final DB transition用 CAS first-terminal-wins；
- bounded in-process transient retry，不伪造 durable retry counter；
- source max1000 Unicode code points；rate limit 10/min、200/day，以 PostgreSQL recent count + bounded in-process burst guard实现。

Privacy：

- logs/outbox/admin默认不记录/返回 source_text或translated_text全文；
- provider adapter禁止全文 debug logging；
- row retention 30天后 cleanup；
- V1无 translation history list；
- 每个 accepted RequestTranslation是独立 fact，frozen schema没有 transport idempotency key，因此不承诺跨 HTTP retry semantic dedupe。

## 13. Identity / user ownership

Runtime route只从 authenticated `AuthContext.userPublicId`取 user scope，客户端不得提交 userId。

显式 identity active-state check只用 `IdentityPublicQueries`，不读 Identity SQL。现有 Identity public contract不暴露 learning direction，因此 Learning不复制/发明该事实；Course `learningLanguage`继续由 Content定义。

## 14. Learning Home

不新增 read-model table。`GetMyLearningHome`聚合：

- up to3 in-progress courses by `updated_at DESC`；
- resume lesson/section；
- due review count + preview <=5；
- recent learning activities <=10；
- Content metadata batched resolve。

多个 in-progress Courses合法；不存在“唯一 current course”事实。

## 15. Admin semantics

V1 Learning Admin = support diagnostics only。

唯一新增 permission requirement：

```text
learning.support.read
```

可读 progress/mastery/review/bookmark、activity、attempt summary/user answers；translation全文默认不可见。No generic progress/mastery correction。未来 correction必须 narrow audited command + exact permission，不能 table edit。

## 16. Completion owner events

Same transaction写 shared `infrastructure.system_outbox_events`：

```text
learning.lesson_completed.v1
learning.course_completed.v1
learning.exercise_completed.v1
```

Payload只允许 stable UUID、occurredAt及 exercise可选 scorePercent；禁止 answer_data、token、translation text、attempt BIGINT。

MasteryChanged/ReviewCompleted目前没有已冻结跨域 consumer，V1不发。

## 17. Cache / analytics

```text
PostgreSQL first
Redis = not required
Kafka = not required
Learning current-state long TTL cache = not required
```

Learning Activity不是 generic analytics warehouse。

## 18. Freeze

```text
Ownership = FROZEN
Activity semantics = FROZEN
Course/Lesson progress = FROZEN
All published Course Lessons required = FROZEN
Mastery = FROZEN
Review scheduling = FROZEN
Bookmarks = FROZEN
Practice/scoring = FROZEN
Attempt no-reissue rule = FROZEN
Exercise maxAttempts semantics = FROZEN
All pinned Exercise Questions required = FROZEN
Dictionary history = FROZEN
Runtime translation = FROZEN
Privacy/IDOR = FROZEN
Outbox = FROZEN
Database migration changes = 0
Learning implementation started = NO
Implementation dependency = CONTENT_GATE
```
