---
status: frozen
phase: 5
phase_name: Content Domain
document: CONTENT_API
design_only: true
implementation_started: false
last_updated: 2026-08-31
repository_commit_audited: 007d6ad705a9afcc4fefb03442e371b4dec07fad
---

# ZH-LAO  — Content HTTP/API Contract

> 本文冻结 HTTP contract，不实现 route。API 从 Use Cases 推导，禁止把 31 张表暴露成 CRUD。

## 1. Conventions

Base paths：

```text
Runtime: /api/v1/content/...
Admin:   /api/v1/admin/content/...
```

规则：

- JSON field 使用 camelCase；
- URL 中所有 Content identity 使用 UUID；
- 任何 response 不返回 internal BIGINT；
- request object strict parsing，unknown field -> 400；
- invalid UUID/schema -> 400；not found/不可见 -> 404；stale write/lifecycle race -> 409；
- Admin authn 使用现有 Identity authentication，authz 使用 Operations exact permission；
- Feature Flag 不替代 permission；
- public runtime 默认只读取 current published/active view；
- Admin read 可读取 draft/disabled/archived；
- Asset 只返回 logical `assetId`，不返回 storage provider/key。

## 2. Runtime Endpoints

### 2.1 Course

```http
GET /api/v1/content/courses?learningLanguage=zh|lo&cursor=<opaque>&limit=20
GET /api/v1/content/courses/{courseId}
GET /api/v1/content/courses/{courseId}/structure
```

Catalog item：

```json
{
  "id": "uuid",
  "learningLanguage": "zh",
  "title": "...",
  "subtitle": "...",
  "description": "...",
  "coverAssetId": "uuid|null",
  "revisionId": "uuid"
}
```

`structure` 返回：

```json
{
  "course": { "id": "uuid", "revisionId": "uuid", "title": "..." },
  "units": [
    {
      "title": "...",
      "description": "...",
      "position": 1,
      "lessons": [
        { "id": "uuid", "title": "...", "position": 1, "status": "published" }
      ]
    }
  ]
}
```

Unit 不返回 DB id，也不伪造 public UUID。

### 2.2 Lesson

```http
GET /api/v1/content/lessons/{lessonId}
GET /api/v1/content/lessons/{lessonId}/content
```

Lesson content 一次返回 ordered sections/items。Section 返回 UUID；Item 只返回 position/type/value，不返回 internal row id。

Item reference examples：

```json
{ "type": "knowledge", "position": 1, "contentId": "uuid", "required": true }
{ "type": "exercise", "position": 2, "exerciseId": "uuid", "required": true }
{ "type": "image", "position": 3, "assetId": "uuid", "required": false }
```

`audio` item 可以返回 authored `assetId`；对 canonical official Audio Slot，应用可通过 Audio delivery/public resolver生成 client-safe audio descriptor，不在 Content response 暴露 slot/task/storage internals。

### 2.3 Knowledge

```http
GET /api/v1/content/knowledge/{contentId}
GET /api/v1/content/knowledge/{contentId}/related
```

Knowledge response：

```json
{
  "id": "uuid",
  "language": "zh",
  "type": "zh_word",
  "revisionId": "uuid",
  "detail": { "simplified": "你好", "pinyinText": "ni3 hao3" },
  "meanings": [],
  "translations": [],
  "examples": [],
  "pronunciation": null
}
```

`detail` 是 discriminated union；不存在 `tableName`、`contentInternalId`。

### 2.4 Dictionary

```http
GET /api/v1/content/dictionary/lookup?language=zh&query=你好
GET /api/v1/content/dictionary/search?language=zh&query=ni&cursor=<opaque>&limit=20
```

Query contract：

```text
language required: zh|lo
query trimmed length: 1..128
limit default: 20
limit max: 50
cursor: opaque
```

V1 search scope：Chinese word simplified/traditional/pinyin；Lao word text/romanization。

Ranking：exact > prefix > trigram similarity；stable tie break by display value + UUID。Exact lookup miss -> 404；Search miss -> 200 `{items:[],nextCursor:null}`。

### 2.5 Practice

```http
GET /api/v1/content/exercises/{exerciseId}
GET /api/v1/content/questions/{questionId}
```

Public question view：

```json
{
  "id": "uuid",
  "type": "single_choice",
  "prompt": "...",
  "score": 1,
  "contents": [],
  "options": [
    { "position": 1, "text": "...", "contentId": "uuid|null", "assetId": "uuid|null" }
  ]
}
```

禁止字段：

```text
isCorrect
expectedText
answerRules
correctContentId
matchingSolution
sequenceSolution
```

`explanation` 只有在不泄漏答案且产品 flow 明确允许时才可 public；默认在提交答案后的 Learning response 中提供，不由 Content pre-answer endpoint 返回。

## 3. Runtime Pagination and Caching

List/search response：

```json
{
  "items": [],
  "nextCursor": "opaque|null"
}
```

禁止 unbounded `pageSize`。Opaque cursor 绑定 filters/sort version，客户端不得构造 DB offset/key。

Published immutable revision response 可使用：

```http
ETag: "content-revision:<revision-uuid>"
Cache-Control: private/public policy determined by endpoint data sensitivity
```

Content V1 不要求 Redis。

## 4. Admin Knowledge API

Permissions：read=`content.knowledge.read`，mutation=`content.knowledge.write`。

```http
GET    /api/v1/admin/content/knowledge
GET    /api/v1/admin/content/knowledge/{contentId}
POST   /api/v1/admin/content/knowledge
PATCH  /api/v1/admin/content/knowledge/{contentId}
POST   /api/v1/admin/content/knowledge/{contentId}/publish
POST   /api/v1/admin/content/knowledge/{contentId}/disable
POST   /api/v1/admin/content/knowledge/{contentId}/archive
PUT    /api/v1/admin/content/knowledge/{contentId}/meanings
PUT    /api/v1/admin/content/knowledge/{contentId}/translations
PUT    /api/v1/admin/content/knowledge/{contentId}/examples
PUT    /api/v1/admin/content/knowledge/{contentId}/pronunciation
PUT    /api/v1/admin/content/knowledge/{contentId}/relationships
PUT    /api/v1/admin/content/knowledge/{contentId}/tags
```

Create body 必须使用 discriminated union：

```json
{
  "language": "zh",
  "type": "zh_hanzi",
  "detail": { "character": "你" }
}
```

服务端生成 `id/publicId/revisionId/timestamps`；客户端不能赋值。

Update body 带：

```json
{ "expectedUpdatedAt": "RFC3339", "patch": { ...allowed fields... } }
```

Identity fields (`id`, `publicId`, `type`, canonical language) 不可 mass-assign。

## 5. Admin Curriculum API

Read permission=`content.curriculum.read`；write=`content.curriculum.write`；publish/archive lifecycle=`content.curriculum.publish`。

```http
GET   /api/v1/admin/content/courses
GET   /api/v1/admin/content/courses/{courseId}
POST  /api/v1/admin/content/courses
PATCH /api/v1/admin/content/courses/{courseId}
PUT   /api/v1/admin/content/courses/{courseId}/structure
POST  /api/v1/admin/content/courses/{courseId}/publish
POST  /api/v1/admin/content/courses/{courseId}/archive

GET   /api/v1/admin/content/lessons/{lessonId}
POST  /api/v1/admin/content/lessons
PATCH /api/v1/admin/content/lessons/{lessonId}
PUT   /api/v1/admin/content/lessons/{lessonId}/structure
POST  /api/v1/admin/content/lessons/{lessonId}/publish
POST  /api/v1/admin/content/lessons/{lessonId}/archive
```

No endpoints：

```text
/api/.../units/{bigint}
/api/.../lesson-items/{bigint}
```

Structure replace 使用 aggregate document，必须携带 `expectedUpdatedAt`。Server transaction：lock root -> compare -> validate complete structure -> reorder/update -> touch root updated_at -> create/update draft revision。

## 6. Admin Practice API

Read=`content.practice.read`；write=`content.practice.write`；publish=`content.practice.publish`。

```http
GET   /api/v1/admin/content/exercises
GET   /api/v1/admin/content/exercises/{exerciseId}
POST  /api/v1/admin/content/exercises
PATCH /api/v1/admin/content/exercises/{exerciseId}
PUT   /api/v1/admin/content/exercises/{exerciseId}/questions
POST  /api/v1/admin/content/exercises/{exerciseId}/publish

GET   /api/v1/admin/content/questions/{questionId}
PUT   /api/v1/admin/content/questions/{questionId}
```

Question `PUT` 是 aggregate replacement，body 同时描述 contents/options/answerRules；不提供 option/rule table CRUD endpoints。

Admin response 可以返回 scoring definition，但只在 authorized admin path；日志必须避免记录完整 answer key body。

## 7. Revision API Semantics

V1 不提供 generic public `/revisions` browser。

Admin publish command response统一包含：

```json
{
  "entityId": "uuid",
  "revisionId": "uuid",
  "revisionNumber": 3,
  "status": "published"
}
```

Trusted cross-domain revision resolution走 module public contract，不通过公开 HTTP 管理 endpoint。

## 8. Error Contract

Content-specific codes：

```text
CONTENT_NOT_FOUND
CONTENT_NOT_PUBLIC
CONTENT_TYPE_MISMATCH
CONTENT_LANGUAGE_MISMATCH
CONTENT_INVALID_RELATION
CONTENT_INVALID_STRUCTURE
CONTENT_INVALID_QUESTION
CONTENT_ANSWER_RULE_INVALID
CONTENT_REVISION_NOT_FOUND
CONTENT_REVISION_NOT_PUBLISHED
CONTENT_CONFLICT
CONTENT_ALREADY_ARCHIVED
CONTENT_REFERENCE_INVALID
CONTENT_SEARCH_QUERY_INVALID
```

HTTP mapping：

- 400: schema/domain validation；
- 401: unauthenticated admin request；
- 403: authenticated but exact permission missing；
- 404: UUID does not exist or public visibility intentionally hidden；
- 409: stale write, unique/lifecycle/order conflict；
- 500: unexpected invariant/infrastructure failure。

不要把 database constraint names/SQL 文本返回给客户端。

## 9. Concurrency Contract

Admin mutable root requests必须携带 current concurrency token。V1 使用 frozen schema已有 `updated_at`：

```text
expectedUpdatedAt != current updated_at -> 409 CONTENT_CONFLICT
```

Server 同时对 aggregate root行锁；`expectedUpdatedAt` 是 UX/API stale-write contract，row lock + unique constraint是事务级 race protection。

Publish：lock root + revision set；不允许 publish 与 concurrent edit 都成功覆盖彼此。

## 10. Security Contract

- public route 不接受 `includeDraft=true` 一类旁路；
- answer redaction 在 application mapper层强制，而不是靠客户端隐藏；
- Admin route 逐 Use Case 检查 exact permission；
- Content API 不返回 operator role details；
- search query bounded；
- body/meta JSON 只接受 allowlisted schema；
- asset/audio URL 必须走 owner mechanism；
- internal BIGINT occurrence in HTTP DTO tests must be zero。

## 11. API Freeze

```text
Runtime API = FROZEN
Admin API = FROZEN
Answer visibility = FROZEN
Pagination/search semantics = FROZEN
Stable ID policy = FROZEN
Implementation = NOT_STARTED
Admin implementation dependency = OPERATIONS_GATE
```
