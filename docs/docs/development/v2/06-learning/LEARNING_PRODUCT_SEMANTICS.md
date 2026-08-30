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

> 本文冻结 Learning Domain V1 产品语义。Learning 只拥有用户开始学习后产生的事实与状态；Content 继续拥有“学什么”，Identity 继续拥有用户身份，Learning 不通过跨域 SQL 复制 canonical fact。

## 1. Repository / dependency reality

设计入口 re-audit 结论：

- audited `main` HEAD：`f5b3f3f41468036ecbd1544c6a9b3c5fbf9668db`；
- current migration registry：18 个 SQL migration；Learning authority 仍为 `0500_learning.sql`；
- Identity：`COMPLETE / PASS / FROZEN`，并已有 `modules/identity/public`；
- Platform：`COMPLETE / PASS / FROZEN`；
- Admin Foundation：`COMPLETE / PASS`；
- Mobile Foundation：`COMPLETE / PASS`；
- Operations：实现代码/public contract 已出现，但 current docs 尚无 final implementation report / authoritative `OPERATIONS_GATE = PASS`；
- Content：`CONTENT_DESIGN_GATE = PASS`，public contract / API / trusted scoring contract 已冻结；`apps/backend/src/modules/content/public` 尚不存在，`CONTENT_IMPLEMENTATION_GATE` 未 PASS；
- 因此 Learning Design 可以 PASS，但 `LEARNING_IMPLEMENTATION = BLOCKED_BY_CONTENT_GATE`。

## 2. Frozen physical model

Learning 保持 10 张 frozen 表，不修改 migration、不新增表：

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

Ownership 判定继续使用：

```text
零用户时仍存在 -> Content
用户开始学习后才产生 -> Learning
```

## 3. Activity vs current state

`learning_activities` 是 immutable canonical learning history，不是 Event Sourcing，也不是通用 analytics warehouse。

允许 activity taxonomy 只使用 migration 已冻结的 8 类：

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

语义：

- `course_started`：course progress 首次从无记录/`not_started` 进入 `in_progress` 时写一次；
- `lesson_started`：lesson progress 首次进入 `in_progress` 时写一次；
- `lesson_completed`：首次完成时写一次；
- `exercise_started`：真正创建新 attempt 时写一次；
- `exercise_completed`：attempt 首次 `in_progress -> completed` 时写一次；
- `review_completed`：一次 review result 成功提交并推进 review state 时写一次；
- `content_viewed/content_practiced` 只记录具有学习语义的内容交互，不承载 page view/clickstream/telemetry。

对会改变 current state 的命令，activity 与 current-state mutation 必须处于同一 Learning transaction。重试如果没有发生新的状态 transition，不重复追加 transition activity。

`metadata` 只允许 activity-type-specific schema，例如来源、review outcome、score summary；不得放 raw answer、translation full text、任意客户端 JSON 或跨域内部 ID。

## 4. Course progress

### 4.1 Row creation

`GetCourseProgress` 在不存在 row 时返回虚拟 `not_started / 0%`，不为纯读创建数据库行。

`StartCourse`：

1. 通过 Content public contract验证 Course UUID 当前可学习；
2. validate current Identity user；
3. 第一次启动创建 `in_progress` row，`started_at=now`，写 `course_started`；
4. 已 `in_progress/completed` 的重复 start 返回现有状态，不重复 activity。

### 4.2 Progress semantics

- `progress_percent` 是 server-owned、持久化 current state；客户端不能直接提交百分比；
- Course 百分比由当前 published Course structure + 该用户已完成 Lesson 计算；V1 只把 completed Lesson 计入 Course 百分比；
- `last_lesson_id` 是“最远已推进的 resume anchor”，只向课程顺序前方移动；用户重看旧 Lesson 不使 resume anchor 回退；
- 用户行为不会降低已获得的 progress；Content 后续 revision 增加结构也不会 retroactively reopen 已完成 course；
- `completed` 是 terminal user-learning fact；`completed_at` 只在首次完成时写入；重复 complete idempotent。

### 4.3 Archived Content

新用户不得 start archived/unpublished Course；已有 progress/history 仍可读。历史展示通过 Content `trusted_current/trusted_history` resolver 获取可解析名称，不删除 Learning fact。

## 5. Lesson progress

`StartLesson` 验证 Lesson published、解析其 Course 关系，然后：

- 确保 Course progress 至少 `in_progress`；
- 创建/推进 Lesson 到 `in_progress`；
- 首次启动写 `lesson_started`；
- Course `last_lesson_id` 仅在顺序向前时更新。

`UpdateLessonProgress` 不接收客户端 percent，只接收 Content `lessonSectionId`：

1. Content 验证 Section 属于该 Lesson；
2. 读取当前 Lesson ordered sections；
3. 计算 candidate percent；
4. `progress_percent = max(existing, candidate)`；
5. `last_section_id` 仅向前移动。

`CompleteLesson`：

- Course progress row先锁、Lesson progress row后锁；
- 首次完成写 `status=completed, progress_percent=100, completed_at=now`；
- 写 `lesson_completed` activity；
- 重新计算 Course completed-lesson percentage；
- 若 Course required published lessons 全部完成，同 transaction 自动完成 Course；显式 `CompleteCourse` 仍保留为 idempotent verification command。

V1 不保存 Unit progress 或 LessonItem progress。

## 6. Revision / historical semantics

Content 已拥有 immutable revision UUID，但 `0500_learning.sql` 没有任何 persisted revision UUID column。

V1 明确裁决：

- progress/mastery/bookmark facts 引用 stable Content entity UUID，而不是 revision UUID；
- 已完成 progress 不因 Content 新 revision 回退；
- generic historical attempt row以其已保存 `answer_data/is_correct/earned_score` 为最终结果事实；V1 不承诺仅凭数据库 row重放“当时的完整题目/答案解释”；
- in-progress Exercise 的 exact scoring revision 通过短期 opaque `attemptToken` 绑定，见 Practice Contract；token 不是跨域 public ID，也不写入 Learning table；
- 持久化 revision pin / long-term exact historical replay 是 `DEFERRED`，不是 V1 必需正确性，因此 `DATABASE_CONTRACT_CONFLICT = 0`。

不得把 revision UUID 偷塞进 `answer_data` 或无类型 `metadata` 充当隐式字段。

## 7. Content mastery

`content_mastery` 是 current state，不是神秘模型分数。

### 7.1 Initialization

用户完成包含 required knowledge item 的 Lesson 时，可对该 Lesson 的稳定 Content UUID初始化 mastery：

```text
mastery_status = learning
mastery_score = 0
first_learned_at = now (if null)
last_practiced_at = now
correct_count/incorrect_count unchanged
```

已有 mastery 不因再次完成 Lesson 被重置。

### 7.2 Deterministic V1 policy

Review outcome 是：

```text
again | hard | good | easy
```

一次 accepted review result 对 mastery 的 delta：

```text
again -> -20, incorrect_count + 1
hard  -> +5,  correct_count + 1
good  -> +15, correct_count + 1
easy  -> +25, correct_count + 1
```

`mastery_score` 从 null 按 0 起算，clamp 到 `0..100`。

Status thresholds：

```text
new      = 尚未产生学习事实
learning = 0..39
familiar = 40..79
mastered = 80..100
```

`first_learned_at` 首次进入 learning 时固定；`last_practiced_at` 每次 accepted targeted practice/review 更新；`mastered_at` 表示“当前这一次进入 mastered 的时间”，跌破 80 时清空，再次进入 mastered 时重新写入。

Mastery 允许因错误结果回退。V1 不提供人工修改 mastery 的通用后台命令。

Generic Exercise completion **不自动猜测 mastery target**。当前 Content trusted scoring contract没有冻结“每题唯一 mastery target”的语义；从 prompt/reference/answer rule 猜 target 会把 Content definition 误解为 Learning ownership。未来若 Content contract明确 target mapping，再以增量设计接入。

## 8. Review scheduling

`content_reviews` 是每个 `(user, content)` 唯一 current schedule。

首次学习 required knowledge 后，若无 review row，默认：

```text
next_review_at = now + 1 day
priority = 50
review_count = 0
```

`SubmitReviewResult` 使用 row lock + `expectedUpdatedAt` 防并发重复提交。accepted 后 `review_count = review_count + 1`，`last_reviewed_at=now`，并写 `review_completed`。

令 `n = new review_count`，V1 schedule：

```text
again -> now + 10 minutes, priority 100
hard  -> now + 1 day,      priority 75
good  -> now + min(30, 2^(min(n-1, 5))) days, priority 50
easy  -> now + min(60, 2 * 2^(min(n-1, 5))) days, priority 25
```

高级 SM-2 / FSRS / ease-factor 持久化均 Deferred。当前 schema 没有 interval/ease 字段，不伪造这些状态。

## 9. Bookmarks

Bookmark 是 user preference current state：

- Add：Content 必须可 current-public resolve；`INSERT ... ON CONFLICT DO NOTHING`；
- Remove：不要求 Content 当前仍 active；不存在也成功；
- List：按 `created_at DESC, content_id` 稳定分页；
- disabled/archived Content 的旧 bookmark 保留并返回 availability，不静默删除；
- batch bookmark status最多 100 Content UUID。

Bookmark 不写 Content，也不是 learning activity。

## 10. Practice attempts

状态机：

```text
in_progress -> completed
in_progress -> abandoned
completed/abandoned = terminal
```

V1 每个 user + exercise 同时只允许一个 application-level active attempt。因为 DB 无 partial unique，`StartExerciseAttempt` 对 `(userId, exerciseId)` 使用 transaction-scoped advisory lock，先查现有 `in_progress`；有则返回同一 attempt context，无则创建。

### Opaque attempt token

`exercise_attempts.id BIGINT` 永不出 HTTP/public contract。Start 返回 versioned authenticated-encrypted `attemptToken`，逻辑绑定：

```text
internal attempt id
current user public UUID
exercise public UUID
pinned exercise revision UUID
issued-at / token version
```

token 是短期 user-owned API capability，不是 stable public ID，不得被其他 Domain持久化，不得进入 logs/outbox。丢失 token 的 in-progress attempt 不承诺跨设备恢复；用户可 abandon/restart。Persisted public attempt UUID 属未来增强。

### Question submit

- user answer先按 question type typed schema验证；
- Content trusted scoring view按 token pinned revision解析；
- Learning server计算/委托 deterministic score，客户端永远不拿 answer truth；
- `question_attempts` 每个 `(attempt, question)` 只接受一次答案；
- 第二次提交 normalized answer完全相同可返回已有结果；不同答案 -> `409 LEARNING_ANSWER_ALREADY_SUBMITTED`；
- 不 UPDATE 已提交答案；completed/abandoned attempt拒绝提交。

Answer payload：

```text
single_choice/listen_choice/content_choice -> selectedOptionPosition
multiple_choice -> selectedOptionPositions[] sorted unique
true_false -> value boolean
fill_blank -> text
ordering -> orderedOptionPositions[]
matching -> pairs[{leftPosition,rightPosition}]
```

`answer_data` 只保存上述 typed user answer，不放 revision、answer key、日志 metadata。

Partial credit由 Content trusted scoring definition决定；Learning只保存最终 `earned_score`。`is_correct=true` 仅表示 full-correct，partial credit可为 `is_correct=false` 且 `earned_score>0`。金额式 decimal helper计算并最终 round 到 2 decimals，禁止 binary-float 漂移。

`CompleteExerciseAttempt` 锁 attempt，验证 required questions，汇总 total/earned/percent，首次完成后 immutable；重复 complete返回同一结果。Abandon重复调用 idempotent；completed 后 abandon冲突。

## 11. Dictionary search history

Content 仍拥有实际 dictionary lookup/search；Learning只记录 history。

- `user_id NOT NULL`，因此 V1 dictionary history仅 authenticated user；
- 在一次 dictionary user intent 完成时记录 query，`selected_content_id` 可空；零结果也可记录；
- 若 selectedContentId 非空，必须由 Content public contract验证为本次可解析 Content；
- 相同 query 的不同用户行为不 dedupe；低风险 transport retry可能形成重复 history；
- List limit default 20, max 50，排序 `searched_at DESC` + internal id仅作为 opaque cursor tie-breaker；
- V1 retention：保留最近 180 天且每用户最多最近 500 条，后台 cleanup可物理删除超出记录。

## 12. Runtime translation

`translation_requests` 是 runtime user request/result，不是 `content.translations`。

V1：authenticated only；nullable `user_id` 保留给未来 guest mode，当前不开放匿名翻译。

状态机：

```text
pending -> processing -> succeeded
pending -> processing -> failed
processing may be reclaimed after worker crash
```

HTTP 创建返回 `202` + opaque `translationToken`；token authenticated-encrypted绑定 internal request id + user UUID，不暴露 BIGINT。状态查询必须同时通过 token验证与 current user ownership。

Provider/model由 server adapter决定，客户端不能指定。生产未配置 provider时 fail-closed，request进入 `failed`，返回/记录稳定 `PROVIDER_UNAVAILABLE`，不使用 fake provider。

执行采用 Foundation/PostgreSQL worker，不引入 Redis/Kafka：

1. claim candidate；
2. 对 request internal id持有 session advisory lock；
3. 短事务设置 `processing` 后提交；
4. provider call在 DB transaction外执行；
5. 新短事务 CAS `processing -> succeeded/failed`；
6. worker crash释放 advisory lock，后续 worker可 reclaim processing row；provider adapter只做 bounded in-process transient retry。

V1 API source text max 1000 Unicode code points；per-user限制 10/min、200/day，以 PostgreSQL recent-request count + bounded in-process burst guard实现。无 Redis。

Privacy：

- application/request/error log不记录 `source_text/translated_text` 全文；
- outbox 不包含全文；
- Admin默认无全文读取能力；
- provider adapter不得启用额外全文 debug logging；
- translation row V1 retention 30 天，之后 cleanup物理删除；
- 不提供长期 translation history API。

每个 accepted RequestTranslation 是独立运行事实；V1不承诺跨 HTTP transport retry 的 semantic dedupe，因为 frozen schema没有 idempotency key。Rate limit控制滥用/重复成本。

## 13. Identity boundary

Runtime route从 AuthContext取得 `userPublicId`；客户端不得提交 `user_id`。

需要显式 active-state validation时只使用 `IdentityPublicQueries`；Learning 不访问 Identity SQL/repository/internal BIGINT。

当前 Identity public contract不暴露 learning direction，因此 Learning V1 **不依赖或复制** Identity learning direction。Course 的 `learningLanguage` 由 Content定义，Mobile可通过自己的 authenticated profile flow选择学习入口。

## 14. Learning home read model

不新增 `learning_home` table。

`GetMyLearningHome` application query聚合：

- up to 3 `continueCourses`：`in_progress` course按 `updated_at DESC`；
- 每个 course 的 resume lesson/section；
- due review count + preview最多 5；
- recent canonical learning activities最多 10；
- Content display metadata通过 batched public reads补齐。

不存在“唯一 current course”事实；多个 in-progress Course 合法。

## 15. Admin semantics

V1 Learning Admin = support diagnostics only，不是用户事实万能编辑器。

唯一新增 permission requirement：

```text
learning.support.read
```

Admin可读 user progress/mastery/review/bookmark、attempt summary/answers（必要时脱敏）、activity timeline；translation full text默认不读。

Manual progress/mastery correction均 Deferred。未来若确需 correction，必须是 narrow command + exact permission + Operations success-only audit，而不是任意 row edit。

## 16. Outbox / Rewards-facing owner events

V1冻结 3 个 owner events：

```text
learning.lesson_completed.v1
learning.course_completed.v1
learning.exercise_completed.v1
```

它们与对应 canonical Learning completion在同 transaction写入 `infrastructure.system_outbox_events`。Payload只含 stable logical UUID、user UUID、occurredAt，以及 exercise可选 scorePercent；不含 answer_data、translation text、internal attempt id。

`aggregate_id` 使用 Lesson/Course/Exercise public UUID；每条 outbox `event_id` 是 consumer dedupe identity。MasteryChanged/ReviewCompleted跨域 event没有已确认 consumer，V1不发。

## 17. Cache / analytics

```text
PostgreSQL first
Redis = not required
Kafka = not required
user-current-state long TTL cache = not required
```

Learning activity不是 clickstream；通用产品 analytics/telemetry继续由独立 observability/analytics能力承担。

## 18. Freeze

```text
Ownership = FROZEN
Activity semantics = FROZEN
Course/Lesson progress = FROZEN
Mastery = FROZEN
Review scheduling = FROZEN
Bookmarks = FROZEN
Practice/scoring = FROZEN
Dictionary history = FROZEN
Runtime translation = FROZEN
Privacy/IDOR = FROZEN
Outbox = FROZEN
Database migration changes = 0
Learning implementation started = NO
Implementation dependency = CONTENT_GATE
```
