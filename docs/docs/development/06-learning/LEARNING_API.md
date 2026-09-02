---
status: frozen
phase: 6
phase_name: Learning Domain
document: LEARNING_API
design_only: true
implementation_started: false
last_updated: 2026-09-02
lifecycle: historical
derived_from: domains/learning/progress.md
---


# ZH-LAO  — Learning HTTP/API Contract

⚠️ **派生文档（DERIVED）** — 规范归属（canonical owner）：`domains/learning/progress.md`。本文件为实现轨（implementation-track）文档，**不是产品/领域事实权威**（Constitution 原则 II）。产品/领域事实以规范归属文档为准，请勿在此重复或自行修改事实。




> Frozen Learning V1 HTTP contract。No routes are implemented by this design task。API从 Use Cases推导，不暴露 10-table CRUD。

## 1. Conventions

```text
Runtime base = /api/v1/learning
Admin base   = /api/v1/admin/learning
```

Runtime rules：

- authenticated only；
- user scope only from `AuthContext.userPublicId`；request path/query/body不接受 userId；
- JSON camelCase；RFC3339 UTC；strict unknown-field rejection；
- cross-domain identities = stable UUID；
- attempt/question/history/translation internal BIGINT = never HTTP identity；
- lists use opaque cursor；
- invalid input 400；unauthenticated 401；foreign/invalid opaque owner handle 404；state/stale conflict 409；rate limit 429；required upstream/provider unavailable 503；
- no SQL/constraint/provider stack/internal key leakage。

Sensitive headers：

```text
X-Learning-Attempt-Token
X-Learning-Translation-Token
```

Token：authenticated-encrypted；max2048 chars；never URL；all access/application logs redact them；invalid/tampered/foreign token -> same `404 LEARNING_RESOURCE_NOT_FOUND`。

Learning current-state response default：

```http
Cache-Control: private, no-store
```

## 2. Home

```http
GET /api/v1/learning/home
```

Returns：

```json
{
  "continueCourses": [
    {
      "courseId": "uuid",
      "title": "...",
      "progressPercent": 42.86,
      "lastLessonId": "uuid|null",
      "lastSectionId": "uuid|null",
      "updatedAt": "..."
    }
  ],
  "dueReviews": {
    "count": 12,
    "items": []
  },
  "recentActivities": []
}
```

Limits：continue<=3, due preview<=5, recent activities<=10。Content metadata server-side batch resolve。

## 3. Course progress

```http
GET  /api/v1/learning/courses/{courseId}/progress
POST /api/v1/learning/courses/{courseId}/start
GET  /api/v1/learning/courses/{courseId}/resume
POST /api/v1/learning/courses/{courseId}/complete
```

Start/Complete body `{}`。

Progress view：

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

No DB row -> 200 virtual not_started。

Completion semantics：all Lessons in resolved published Course structure are required；0-Lesson course -> `409 LEARNING_COURSE_NOT_COMPLETABLE`。

Resume：

```json
{
  "courseId": "uuid",
  "status": "in_progress",
  "progressPercent": 42.86,
  "resume": { "lessonId": "uuid|null", "sectionId": "uuid|null" }
}
```

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

Never accepted from client：`progressPercent/status/timestamps/internal IDs`。

Complete checks server-side：final Section reached + all required Exercise lesson items completed。Failure -> `409 LEARNING_LESSON_NOT_COMPLETABLE`。

State response：

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

Repeat complete returns same state and does not duplicate owner event。

## 5. Mastery

```http
GET  /api/v1/learning/mastery/{contentId}
POST /api/v1/learning/mastery/resolve
```

Batch body：

```json
{ "contentIds": ["uuid"] }
```

1..100 unique IDs。

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

No row -> virtual `new`, score/timestamps null。

## 6. Reviews

```http
GET  /api/v1/learning/reviews/due?cursor=<opaque>&limit=20
POST /api/v1/learning/reviews/{contentId}/results
```

Due list default20/max50；sort priority DESC, nextReviewAt ASC, contentId。

Item includes：

```json
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
```

Submit body：

```json
{
  "outcome": "again|hard|good|easy",
  "expectedUpdatedAt": "2026-08-31T00:00:00.000Z"
}
```

Rules：review must exist and be due；not scheduled -> `409 LEARNING_REVIEW_NOT_SCHEDULED`；not due -> `409 LEARNING_REVIEW_NOT_DUE`；stale token -> `409 LEARNING_REVIEW_CONFLICT`。

Success returns updated mastery + review schedule。

## 7. Bookmarks

```http
GET    /api/v1/learning/bookmarks?cursor=<opaque>&limit=20
PUT    /api/v1/learning/bookmarks/{contentId}
DELETE /api/v1/learning/bookmarks/{contentId}
POST   /api/v1/learning/bookmarks/resolve
```

PUT body `{}` and idempotent。DELETE missing -> 204。Batch resolve body `{contentIds:[...]}` max100。

List item returns Content safe summary + `availability=current|disabled|archived|unavailable`。Old bookmark not silently deleted on Content retirement。

## 8. Practice

### 8.1 Start

```http
POST /api/v1/learning/exercises/{exerciseId}/attempts
```

Body `{}`。

Created -> `201`：

```json
{
  "exerciseId": "uuid",
  "exerciseRevisionId": "uuid",
  "attemptToken": "opaque-secret",
  "status": "in_progress",
  "startedAt": "...",
  "exercise": {
    "id": "uuid",
    "revisionId": "uuid",
    "maxAttempts": 3,
    "passingScore": 80,
    "questions": []
  }
}
```

`exercise.questions` is client-safe Content definition；no answer keys。

Start semantics：

- active attempt already exists -> `409 LEARNING_ATTEMPT_ALREADY_IN_PROGRESS`；
- server **must not reissue** a token for that row because frozen DB does not persist its exact revision；
- total prior created rows >= Content maxAttempts -> `409 LEARNING_MAX_ATTEMPTS_REACHED`；
- Start is therefore not transport-idempotent in V1 after a lost success response。

### 8.2 Submit answer

```http
POST /api/v1/learning/exercise-attempt/questions/{questionId}/answers
X-Learning-Attempt-Token: <opaque>
```

Discriminated bodies：

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
  "pairs": [{ "leftPosition": 1, "rightPosition": 2 }]
}
```

Response after server trusted scoring：

```json
{
  "questionId": "uuid",
  "isCorrect": false,
  "earnedScore": 0.5,
  "maxScore": 1,
  "explanation": "safe post-answer explanation or null"
}
```

Never return correctOption(s), expectedText, answerRules, matching/sequence solution。

Same normalized answer retry -> same stored result；different answer -> `409 LEARNING_ANSWER_ALREADY_SUBMITTED`。

### 8.3 Result / complete

```http
GET  /api/v1/learning/exercise-attempt/result
POST /api/v1/learning/exercise-attempt/complete
X-Learning-Attempt-Token: <opaque>
```

Complete body `{}`。All Questions in pinned revision are required。Missing answer -> `409 LEARNING_EXERCISE_INCOMPLETE`。

Final result：

```json
{
  "exerciseId": "uuid",
  "exerciseRevisionId": "uuid",
  "status": "completed",
  "totalScore": 10,
  "earnedScore": 8.5,
  "scorePercent": 85,
  "passed": true,
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

`passed` is derived from pinned Content `passingScore`; it is not a new persisted Learning column。If passingScore null, `passed=null`。

### 8.4 Abandon

Normal token path：

```http
POST /api/v1/learning/exercise-attempt/abandon
X-Learning-Attempt-Token: <opaque>
```

Lost-token recovery path：

```http
POST /api/v1/learning/exercises/{exerciseId}/attempts/abandon-active
```

Both body `{}`。Recovery uses current AuthContext + exercise UUID + advisory lock and never needs the lost revision token。Abandoned attempt remains counted against maxAttempts。

Repeated abandoned -> success；completed -> `409 LEARNING_ATTEMPT_ALREADY_COMPLETED`。

## 9. Dictionary history

Actual dictionary query remains Content API。

Record：

```http
POST /api/v1/learning/dictionary/history
```

```json
{ "queryText": "你好", "selectedContentId": "uuid|null" }
```

query trimmed 1..256；success 204。selected ID non-null requires Content validation。History failure must not change an already successful Content search response semantics。

List：

```http
GET /api/v1/learning/dictionary/history?cursor=<opaque>&limit=20
```

max50；no history row ID in response。

## 10. Runtime translation

Request：

```http
POST /api/v1/learning/translations
```

```json
{
  "sourceLanguage": "zh",
  "targetLanguage": "lo",
  "sourceText": "..."
}
```

Only zh->lo/lo->zh；source 1..1000 Unicode code points；provider/model not client-selectable。

Success 202：

```json
{
  "translationToken": "opaque-secret",
  "status": "pending",
  "createdAt": "..."
}
```

Rate limit -> 429 `LEARNING_TRANSLATION_RATE_LIMITED`。

Status/result：

```http
GET /api/v1/learning/translation
X-Learning-Translation-Token: <opaque>
```

Pending/processing returns status/times；succeeded returns sourceLanguage,targetLanguage,translatedText,times；failed returns stable errorCode/times。No provider/model/raw provider error by default。No V1 list/history endpoint。

## 11. Admin support

All require exact permission：

```text
learning.support.read
```

```http
GET /api/v1/admin/learning/users/{userId}/summary
GET /api/v1/admin/learning/users/{userId}/activities?cursor=&limit=50
GET /api/v1/admin/learning/users/{userId}/progress
GET /api/v1/admin/learning/users/{userId}/reviews?cursor=&limit=50
GET /api/v1/admin/learning/users/{userId}/attempts?cursor=&limit=20
```

Here `userId` is explicitly target Identity public UUID in support context。Identity auth + active Operations operator + exact permission。No Learning mutation route。No translation plaintext。Support answer data, if exposed, is user-submitted answer only, never trusted answer key。

## 12. Pagination

Envelope：

```json
{ "items": [], "nextCursor": "opaque|null" }
```

Cursor signed/encrypted or otherwise opaque；raw internal IDs not contractually visible。

```text
reviews/bookmarks/dictionary default/max = 20/50
admin activities/reviews = 50/100
admin attempts = 20/50
```

## 13. Error codes

```text
LEARNING_RESOURCE_NOT_FOUND
LEARNING_CONTENT_NOT_AVAILABLE
LEARNING_COURSE_NOT_COMPLETABLE
LEARNING_LESSON_SECTION_INVALID
LEARNING_LESSON_NOT_COMPLETABLE
LEARNING_PROGRESS_CONFLICT
LEARNING_REVIEW_NOT_SCHEDULED
LEARNING_REVIEW_NOT_DUE
LEARNING_REVIEW_CONFLICT
LEARNING_ATTEMPT_ALREADY_IN_PROGRESS
LEARNING_MAX_ATTEMPTS_REACHED
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

Mapping：400 validation；401 unauthenticated；403 Admin permission；404 hidden/foreign opaque resource；409 lifecycle/stale；429 rate limit；503 required upstream/provider unavailable；500 unexpected invariant/infrastructure。

## 14. Required security tests

Implementation must prove：

- runtime userId override impossible；
- user A attempt/translation token unusable by B；
- invalid token and foreign token externally indistinguishable；
- every progress/mastery/review/bookmark/history query scopes current user；
- token headers redacted；
- translation source/result absent from ordinary logs；
- trusted scoring fields cannot serialize through runtime mapper；
- no internal BIGINT appears in HTTP contracts。

## 15. API Freeze

```text
Runtime API = FROZEN
Admin Support API = FROZEN
Course all-Lesson completion = FROZEN
Lesson completion guard = FROZEN
Attempt Start active=409/no-reissue = FROZEN
maxAttempts = FROZEN
Exercise all-Question completion = FROZEN
Ownership/IDOR = FROZEN
Answer visibility = FROZEN
Stable ID strategy = FROZEN
Implementation = NOT_STARTED
Implementation dependency = CONTENT_GATE
```
