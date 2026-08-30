---
status: frozen
phase: 6
phase_name: Learning Domain
document: LEARNING_API
design_only: true
implementation_started: false
last_updated: 2026-08-31
---

# ZH-LAO V2 — Learning HTTP/API Contract

> 本文冻结 Learning V1 HTTP contract，不实现 route。API 从用户学习 Use Cases 推导，不按 10 张表生成 CRUD。

## 1. Conventions

Base paths：

```text
Runtime: /api/v1/learning/...
Admin:   /api/v1/admin/learning/...
```

Runtime 通用规则：

- 全部 learner endpoint 要求 authenticated user；
- `AuthContext.userPublicId` 是唯一 user scope 来源，request body/query/path 不接受 `userId`；
- JSON 使用 camelCase；时间为 RFC3339 UTC；
- Content/Identity references 只使用 stable UUID；
- `exercise_attempts.id`、`question_attempts.id`、`dictionary_search_history.id`、`translation_requests.id` 永不出现在 URL/body/response；
- request object strict parse，unknown field -> `400`；
- invalid UUID/schema -> `400`；owner resource不可访问/opaque token无效 -> `404`；状态/stale conflict -> `409`；rate limit -> `429`；
- response不得返回数据库 constraint、SQL、provider stack trace、internal BIGINT；
- list endpoint使用 opaque cursor；cursor不得泄漏 raw BIGINT/offset；
- no Redis/Kafka requirement。

Sensitive opaque capability token：

```text
X-Learning-Attempt-Token
X-Learning-Translation-Token
```

规则：

- token是 authenticated-encrypted secret capability；
- header值 max 2048 chars；
- request/access/application logs必须 redact上述 headers；
- token不能进入 URL、analytics、outbox；
- invalid/tampered/not-owned统一返回 `404 LEARNING_RESOURCE_NOT_FOUND`，避免枚举。

## 2. Learning home

```http
GET /api/v1/learning/home
```

Response：

```json
{
  "continueCourses": [
    {
      "courseId": "uuid",
      "title": "...",
      "progressPercent": 42.86,
      "lastLessonId": "uuid|null",
      "lastSectionId": "uuid|null",
      "updatedAt": "2026-08-31T00:00:00Z"
    }
  ],
  "dueReviews": {
    "count": 12,
    "items": [
      {
        "contentId": "uuid",
        "masteryStatus": "familiar",
        "nextReviewAt": "...",
        "priority": 50,
        "expectedUpdatedAt": "...",
        "content": { "id": "uuid", "language": "zh", "type": "zh_word", "display": "..." }
      }
    ]
  },
  "recentActivities": []
}
```

Limits：continue courses <=3, review preview <=5, recent activities <=10。Content display metadata由 server batch resolve，客户端不 N+1 拼装。

## 3. Course progress

### Get

```http
GET /api/v1/learning/courses/{courseId}/progress
```

Response：

```json
{
  "courseId": "uuid",
  "status": "not_started|in_progress|completed",
  "progressPercent": 0,
  "lastLessonId": null,
  "startedAt": null,
  "completedAt": null,
  "updatedAt": null
}
```

缺数据库 row 仍返回 `200` virtual `not_started`。

### Start / Resume / Complete

```http
POST /api/v1/learning/courses/{courseId}/start
GET  /api/v1/learning/courses/{courseId}/resume
POST /api/v1/learning/courses/{courseId}/complete
```

Start/Complete body必须为空 object `{}`；unknown fields rejected。

`resume` response：

```json
{
  "courseId": "uuid",
  "status": "in_progress",
  "progressPercent": 42.86,
  "resume": {
    "lessonId": "uuid|null",
    "sectionId": "uuid|null"
  }
}
```

Start/Complete都是 idempotent state commands。

## 4. Lesson progress

```http
GET  /api/v1/learning/lessons/{lessonId}/progress
POST /api/v1/learning/lessons/{lessonId}/start
POST /api/v1/learning/lessons/{lessonId}/progress
POST /api/v1/learning/lessons/{lessonId}/complete
```

Progress body：

```json
{ "sectionId": "uuid" }
```

禁止客户端提交：

```text
progressPercent
status
startedAt
completedAt
lastSection internal ID
```

Response统一返回 server current state：

```json
{
  "lessonId": "uuid",
  "status": "in_progress",
  "progressPercent": 50,
  "lastSectionId": "uuid",
  "startedAt": "...",
  "completedAt": null,
  "updatedAt": "..."
}
```

重复完成返回同一 completion state，不重复 owner event。

## 5. Mastery

### Single/batch resolve

```http
GET  /api/v1/learning/mastery/{contentId}
POST /api/v1/learning/mastery/resolve
```

Batch body：

```json
{ "contentIds": ["uuid"] }
```

`contentIds` 1..100，去重后处理。

View：

```json
{
  "contentId": "uuid",
  "masteryStatus": "new|learning|familiar|mastered",
  "masteryScore": 55,
  "correctCount": 4,
  "incorrectCount": 1,
  "firstLearnedAt": "...",
  "lastPracticedAt": "...",
  "masteredAt": null,
  "updatedAt": "..."
}
```

无 row返回 virtual `new`，`masteryScore=null`、timestamps null，不为读创建 row。

## 6. Reviews

### Due list

```http
GET /api/v1/learning/reviews/due?cursor=<opaque>&limit=20
```

`limit` default 20/max 50。

Response：

```json
{
  "items": [
    {
      "contentId": "uuid",
      "nextReviewAt": "...",
      "priority": 50,
      "reviewCount": 2,
      "lastReviewedAt": "...",
      "expectedUpdatedAt": "...",
      "mastery": { "status": "familiar", "score": 55 },
      "content": { "id": "uuid", "language": "zh", "type": "zh_word", "display": "..." }
    }
  ],
  "nextCursor": null
}
```

### Submit result

```http
POST /api/v1/learning/reviews/{contentId}/results
```

Body：

```json
{
  "outcome": "again|hard|good|easy",
  "expectedUpdatedAt": "2026-08-31T00:00:00.000Z"
}
```

Success `200`：

```json
{
  "contentId": "uuid",
  "outcome": "good",
  "mastery": { "status": "familiar", "score": 70 },
  "review": {
    "reviewCount": 3,
    "lastReviewedAt": "...",
    "nextReviewAt": "...",
    "priority": 50,
    "updatedAt": "..."
  }
}
```

Stale `expectedUpdatedAt` -> `409 LEARNING_REVIEW_CONFLICT`。不自动把 uncertain retry当作第二次 review。

## 7. Bookmarks

```http
GET    /api/v1/learning/bookmarks?cursor=<opaque>&limit=20
PUT    /api/v1/learning/bookmarks/{contentId}
DELETE /api/v1/learning/bookmarks/{contentId}
POST   /api/v1/learning/bookmarks/resolve
```

PUT body `{}`，idempotent。DELETE不存在也 `204`。

Batch resolve：

```json
{ "contentIds": ["uuid"] }
```

Response：

```json
{
  "items": [
    { "contentId": "uuid", "isBookmarked": true }
  ]
}
```

List item包含 Content safe summary与：

```text
availability = current | disabled | archived | unavailable
```

历史 bookmark不因 Content下架自动删除。

## 8. Practice attempts

### Start

```http
POST /api/v1/learning/exercises/{exerciseId}/attempts
```

Body `{}`。

Success `201` when created / `200` when existing in-progress reused：

```json
{
  "exerciseId": "uuid",
  "exerciseRevisionId": "uuid",
  "attemptToken": "opaque-secret",
  "status": "in_progress",
  "startedAt": "...",
  "exercise": { "id": "uuid", "revisionId": "uuid", "questions": [] }
}
```

`exercise.questions` 是 Content public-safe definition，不含 correct answer/answer rules。

### Submit question

```http
POST /api/v1/learning/exercise-attempt/questions/{questionId}/answers
X-Learning-Attempt-Token: <opaque>
```

Body 是 question-type discriminated union：

```json
{ "type": "single_choice", "selectedOptionPosition": 2 }
```

```json
{ "type": "multiple_choice", "selectedOptionPositions": [1, 3] }
```

```json
{ "type": "true_false", "value": true }
```

```json
{ "type": "fill_blank", "text": "..." }
```

```json
{ "type": "ordering", "orderedOptionPositions": [2, 1, 3] }
```

```json
{
  "type": "matching",
  "pairs": [
    { "leftPosition": 1, "rightPosition": 2 }
  ]
}
```

Response：

```json
{
  "questionId": "uuid",
  "isCorrect": false,
  "earnedScore": 0.5,
  "maxScore": 1,
  "explanation": "post-answer safe explanation or null"
}
```

不得返回 `correctOptionPosition(s)`、expectedText、answerRules或matching solution。

同 question：相同 normalized answer retry返回 same result；不同 answer -> `409 LEARNING_ANSWER_ALREADY_SUBMITTED`。

### Complete / abandon / result

```http
POST /api/v1/learning/exercise-attempt/complete
POST /api/v1/learning/exercise-attempt/abandon
GET  /api/v1/learning/exercise-attempt/result
X-Learning-Attempt-Token: <opaque>
```

Complete/abandon body `{}`。

Final result：

```json
{
  "exerciseId": "uuid",
  "exerciseRevisionId": "uuid",
  "status": "completed",
  "totalScore": 10,
  "earnedScore": 8.5,
  "scorePercent": 85,
  "startedAt": "...",
  "completedAt": "...",
  "questions": [
    {
      "questionId": "uuid",
      "answer": { "type": "single_choice", "selectedOptionPosition": 2 },
      "isCorrect": true,
      "earnedScore": 1
    }
  ]
}
```

No attempt ID。No raw answer key。

## 9. Dictionary history

### Record

```http
POST /api/v1/learning/dictionary/history
```

Body：

```json
{
  "queryText": "你好",
  "selectedContentId": "uuid|null"
}
```

`queryText` trimmed length 1..256。This endpoint does not perform dictionary search；actual search remains Content API。Recommended Mobile flow：Content search/lookup -> record user intent/selection。

Success `204`。History write failure should not retroactively change a successful Content search result at client layer；client may treat it as non-critical telemetry-like UX failure, but server仍把它作为 Learning canonical history operation rather than clickstream。

### List

```http
GET /api/v1/learning/dictionary/history?cursor=<opaque>&limit=20
```

Response不含 history row id：

```json
{
  "items": [
    {
      "queryText": "你好",
      "selectedContentId": "uuid|null",
      "searchedAt": "..."
    }
  ],
  "nextCursor": null
}
```

limit max 50。

## 10. Runtime translation

### Request

```http
POST /api/v1/learning/translations
```

Body：

```json
{
  "sourceLanguage": "zh",
  "targetLanguage": "lo",
  "sourceText": "..."
}
```

Only `zh->lo` / `lo->zh`。`sourceText` 1..1000 Unicode code points。Client cannot choose provider/model。

Success `202`：

```json
{
  "translationToken": "opaque-secret",
  "status": "pending",
  "createdAt": "..."
}
```

Rate limit violation：`429 LEARNING_TRANSLATION_RATE_LIMITED`。

### Status/result

```http
GET /api/v1/learning/translation
X-Learning-Translation-Token: <opaque>
```

Response pending/processing：

```json
{ "status": "processing", "createdAt": "...", "completedAt": null }
```

Succeeded：

```json
{
  "status": "succeeded",
  "sourceLanguage": "zh",
  "targetLanguage": "lo",
  "translatedText": "...",
  "createdAt": "...",
  "completedAt": "..."
}
```

Failed：

```json
{
  "status": "failed",
  "errorCode": "PROVIDER_UNAVAILABLE",
  "createdAt": "...",
  "completedAt": "..."
}
```

No provider/model/raw provider error in public response by default。No list/history endpoint in V1。

## 11. Admin support API

Permission for every endpoint：

```text
learning.support.read
```

Admin base：

```http
GET /api/v1/admin/learning/users/{userId}/summary
GET /api/v1/admin/learning/users/{userId}/activities?cursor=&limit=50
GET /api/v1/admin/learning/users/{userId}/progress
GET /api/v1/admin/learning/users/{userId}/reviews?cursor=&limit=50
GET /api/v1/admin/learning/users/{userId}/attempts?cursor=&limit=20
```

Rules：

- Identity authentication + active Operations operator + exact permission；
- `userId` here is explicitly the target Identity public UUID because this is support context, not learner self-service；
- no mutation endpoint；
- attempt list uses opaque cursor and nested result summaries, never returns raw attempt BIGINT；
- raw translation source/translated text excluded；
- dictionary history may be omitted from default summary unless support use case explicitly requests it；
- any answer payload shown to support UI must be user-submitted answer only, never trusted answer rule/key。

## 12. Pagination

Generic list envelope：

```json
{
  "items": [],
  "nextCursor": "opaque|null"
}
```

Cursor is authenticated/encrypted or signed opaque state containing only what server requires for resume；raw internal ID must not be human-readable or contractually meaningful。

Default/max：

```text
reviews/bookmarks/dictionary = 20 / 50
admin activities/reviews     = 50 / 100
admin attempts               = 20 / 50
```

## 13. Error contract

Learning-specific codes：

```text
LEARNING_RESOURCE_NOT_FOUND
LEARNING_CONTENT_NOT_AVAILABLE
LEARNING_COURSE_NOT_COMPLETABLE
LEARNING_LESSON_SECTION_INVALID
LEARNING_PROGRESS_CONFLICT
LEARNING_REVIEW_NOT_SCHEDULED
LEARNING_REVIEW_CONFLICT
LEARNING_ATTEMPT_NOT_IN_PROGRESS
LEARNING_ATTEMPT_ALREADY_COMPLETED
LEARNING_ATTEMPT_ABANDONED
LEARNING_ANSWER_INVALID
LEARNING_ANSWER_ALREADY_SUBMITTED
LEARNING_EXERCISE_INCOMPLETE
LEARNING_SCORING_UNAVAILABLE
LEARNING_TRANSLATION_INVALID_PAIR
LEARNING_TRANSLATION_RATE_LIMITED
LEARNING_TRANSLATION_UNAVAILABLE
PROVIDER_UNAVAILABLE
```

Mapping：

- 400：input/domain validation；
- 401：runtime/admin unauthenticated；
- 403：admin authenticated但缺 exact permission；
- 404：Content/public logical ref不可用，或 opaque user-owned resource不存在/不属于当前用户；
- 409：state/stale/concurrent conflict；
- 429：translation rate limit；
- 503：required upstream/provider temporarily unavailable when operation cannot safely proceed；
- 500：unexpected invariant/infrastructure failure。

## 14. IDOR / privacy tests required

Implementation tests必须证明：

- runtime route不能通过 body/query覆盖 userId；
- user A attempt token对 user B永远不可用；
- user A translation token对 user B永远不可用；
- bookmark/mastery/progress/history全部 repository predicate包含 current user；
- invalid token与foreign token response不可区分；
- sensitive token headers从 logs redacted；
- translation source/result不进 ordinary logs；
- trusted scoring fields无法被 Runtime mapper序列化。

## 15. Cache contract

Learning current-state response默认：

```http
Cache-Control: private, no-store
```

Published Content metadata由 Content自行决定 cache semantics。Learning API不建立 Redis long-TTL current-state cache。

## 16. API Freeze

```text
Runtime API = FROZEN
Admin support API = FROZEN
Ownership/IDOR = FROZEN
Stable ID strategy = FROZEN
Attempt/Translation token strategy = FROZEN
Answer visibility = FROZEN
Pagination = FROZEN
Implementation = NOT_STARTED
Implementation dependency = CONTENT_GATE
```
