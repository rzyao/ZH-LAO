---
status: frozen
phase: 6
phase_name: Learning Domain
document: LEARNING_PUBLIC_CONTRACTS
design_only: true
implementation_started: false
last_updated: 2026-09-02
lifecycle: historical
---

# ZH-LAO  — Learning Public / Cross-Domain Contracts

> Target boundary：`apps/backend/src/modules/learning/public/`。Learning public contract只暴露经过最小化的业务事实；不把用户私有学习数据库变成跨域查询接口。

## 1. Forbidden exports

`learning/public` 禁止导出：

```text
repositories
SQL
DatabaseExecutor
TransactionManager
DB row types
internal BIGINT
raw answers
answer_data
translation source/translated text
search history
bookmark rows
opaque learner tokens
raw table names
```

其他 Domain禁止直接 SQL `learning.*`。

## 2. Public identity policy

Learning V1没有新的 stable public aggregate UUID列。跨域 public contract因此只使用 Owner Domain已有 logical UUID组成业务 key：

```ts
type UserPublicId = string;       // Identity UUID
type CoursePublicId = string;     // Content UUID
type LessonPublicId = string;     // Content UUID
type ExercisePublicId = string;   // Content UUID
```

不存在：

```text
LearningProgressId
ExerciseAttemptPublicId
QuestionAttemptPublicId
TranslationRequestPublicId
DictionaryHistoryPublicId
```

V1不得给 BIGINT伪造字符串 public ID。

## 3. V1 synchronous read surface

真正有跨域价值且隐私最小化的同步 contract仅冻结 completion facts。

Conceptual TypeScript：

```ts
export type LearningCompletionStatus = Readonly<{
  completed: boolean;
  completedAt: string | null;
}>;

export interface LearningCompletionReader {
  getCourseCompletion(input: Readonly<{
    userId: UserPublicId;
    courseId: CoursePublicId;
  }>): Promise<LearningCompletionStatus>;

  getLessonCompletion(input: Readonly<{
    userId: UserPublicId;
    lessonId: LessonPublicId;
  }>): Promise<LearningCompletionStatus>;
}
```

Semantics：

- missing progress row -> `{completed:false, completedAt:null}`；
- completed terminal fact不因 Content archive/revision变化消失；
- consumer必须已经有合法业务理由获得 `userId`；Learning contract本身不提供用户搜索/list；
- implementation按 `(user_id, course_id|lesson_id)` natural key读取，不返回 persistence internals。

## 4. Why mastery/progress detail is not public V1

以下信息虽然在 Learning存在，但 V1不开放通用 cross-domain reader：

```text
progressPercent
resume position
masteryScore/status
review schedule
bookmarks
recent activities
attempt/question results
translation data
dictionary history
```

原因：

- 它们是高频 user-private facts；
- 当前没有已冻结跨域 consumer需要通用读取；
- “以后可能用”不构成扩大 privacy surface 的理由；
- Admin support通过受 Operations授权的 Learning Admin API，不通过 cross-domain public reader旁路权限。

未来若 Rewards/Product需要 mastery/progress summary，必须按明确 use case增加最小 DTO，而不是导出 repository。

## 5. Owner event contract

Learning V1产生 3 个跨域 completion owner events。可靠事件通过 Foundation shared transactional outbox发布。

### 5.1 LessonCompleted

```ts
export type LearningLessonCompletedV1 = Readonly<{
  eventType: 'learning.lesson_completed.v1';
  eventId: string; // UUID dedupe identity
  occurredAt: string;
  userId: UserPublicId;
  courseId: CoursePublicId;
  lessonId: LessonPublicId;
}>;
```

Outbox mapping：

```text
source_domain  = learning
event_type     = learning.lesson_completed.v1
aggregate_type = lesson
aggregate_id   = lessonId
```

### 5.2 CourseCompleted

```ts
export type LearningCourseCompletedV1 = Readonly<{
  eventType: 'learning.course_completed.v1';
  eventId: string;
  occurredAt: string;
  userId: UserPublicId;
  courseId: CoursePublicId;
}>;
```

Outbox：`aggregate_type=course`, `aggregate_id=courseId`。

### 5.3 ExerciseCompleted

```ts
export type LearningExerciseCompletedV1 = Readonly<{
  eventType: 'learning.exercise_completed.v1';
  eventId: string;
  occurredAt: string;
  userId: UserPublicId;
  exerciseId: ExercisePublicId;
  scorePercent: number | null;
}>;
```

Outbox：`aggregate_type=exercise`, `aggregate_id=exerciseId`。

## 6. Event guarantees

- completion canonical write与 outbox insert同一 PostgreSQL transaction；
- terminal transition只产生一次 owner event；
- consumer以 `eventId` dedupe；
- replay同一个 outbox event不能被解释为第二次 completion；
- payload schema version固定在 event type `.v1`；breaking change使用新 event type/version；
- payload只包含 owner事实所需 UUID/time/score summary。

禁止 event payload：

```text
exercise_attempts.id
question_attempts.id
answer_data
correct answer rules
translation text
bookmark/search history
Content internal BIGINT
Identity internal BIGINT
```

## 7. Rewards boundary

Rewards未来可优先消费：

```text
learning.lesson_completed.v1
learning.course_completed.v1
learning.exercise_completed.v1
```

Learning不决定 reward eligibility、grant、wallet/coin fact；Rewards owner根据自己的 program/rule判断。

如果 Rewards需要在消费时二次验证 completion，可使用 `LearningCompletionReader` 的 Course/Lesson能力。Exercise V1没有 stable Learning attempt public ID，因此事件表达的是“用户完成了 Content Exercise UUID 的一次 attempt”，不是可跨域引用 attempt aggregate。

## 8. Operations/Admin boundary

Learning提出唯一 V1 Admin permission requirement：

```text
learning.support.read
```

它必须通过 Operations exact catalog/authorization contract集成。Learning public module不暴露自定义 role evaluator，也不读取 `operations.*` SQL。

Support API获得 target `userId` 后，仅返回最小 diagnostics；translation full text默认不可见。No generic mutation permission。

## 9. Identity boundary

Learning依赖现有：

```ts
IdentityPublicQueries.isIdentityActive(userId)
IdentityPublicQueries.getIdentityAccountStatus(userId)
```

Learning不要求 Identity在本阶段新增 public method。尤其不复制或推断未暴露的 learning-direction state。

Runtime正常 user scope来自 authenticated `AuthContext.userPublicId`；public completion reader只给 trusted backend consumer使用。

## 10. Content boundary consumed by Learning

Learning implementation必须只通过 frozen Content public contract取得：

```text
resolve/validate Course
resolve/validate Lesson + parent relation
resolve LessonSection + parent relation
resolve Content
resolve Exercise/Question
resolve current/pinned revision
resolvePracticeForScoring (server-only trusted view)
```

Learning禁止 direct SQL `content.*`，禁止把 answer rules复制为 Learning canonical data。

V1 persisted Learning schema没有 revision UUID；only in-progress scoring token carries an exact Content revision context。此 token不属于 public cross-domain contract。

## 11. Compatibility

- Completion natural key semantics `(user UUID, Content UUID)` 是 V1 stable contract；
- Content UUID不复用；Identity UUID稳定；
- 新增 optional event payload field必须保持 consumer backward compatibility；
- event semantic change需要 version bump；
- 不得后续把 internal BIGINT加入已冻结 public DTO；
- 如果未来增加 stable Learning public UUID，必须通过 forward migration + explicit contract revision，而不是改变现有 token语义。

## 12. Public contract tests required

Implementation必须有 architecture/type/runtime tests证明：

```text
learning/public exports repository = 0
learning/public exports DB executor/tx = 0
learning/public exports BIGINT identity = 0
learning/public exports raw answer = 0
learning/public exports translation text = 0
completion reader respects natural logical keys
owner event payload contains only allowlisted fields
outbox event emitted exactly once for first terminal transition
```

## 13. Freeze

```text
LearningCompletionReader = FROZEN
LessonCompleted event = FROZEN
CourseCompleted event = FROZEN
ExerciseCompleted event = FROZEN
Generic mastery/progress public reader = NOT EXPOSED V1
Raw user-private data export = 0
Public BIGINT = 0
Implementation = NOT_STARTED
Implementation dependency = CONTENT_GATE
```
