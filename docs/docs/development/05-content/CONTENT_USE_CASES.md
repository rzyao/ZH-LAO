---
status: frozen
phase: 5
phase_name: Content Domain
document: CONTENT_USE_CASES
design_only: true
implementation_started: false
last_updated: 2026-09-02
repository_commit_audited: 007d6ad705a9afcc4fefb03442e371b4dec07fad
lifecycle: historical
---

# ZH-LAO  — Content Use Cases

> Use Cases 从产品能力推导，不是一表一 CRUD。Runtime 与 Admin/Authoring 明确分离；用户学习事实全部留在 Learning。

## 1. Classification Summary

```text
REQUIRED      = 34
DEFERRED      = 10
NOT_SUPPORTED = 14
```

## 2. Actors

- Runtime Client：Mobile/Web，只消费 published/safe views；
- Content Operator：经 Operations 认证和 exact permission 授权的后台操作者；
- Learning Domain：trusted consumer，需要稳定 UUID、revision 与 scoring definition；
- Audio Domain：trusted consumer，需要 Content source validation / revision snapshot；
- Asset Infrastructure：asset logical UUID / delivery owner。

## 3. REQUIRED — Runtime / Mobile

### UC-R01 BrowseCourses

Goal：按 `learningLanguage` 获取 published course catalog。

Rules：只返回 `published`；稳定排序 `sortOrder + publicId`；bounded cursor pagination；不返回 internal BIGINT。

### UC-R02 GetCourse

按 Course UUID 获取 published course summary/detail。Draft/archived 对 public path 均表现为 not found；Admin/history view 另行处理。

### UC-R03 GetCourseStructure

一次返回 Mobile 课程目录所需的 ordered structure：Course -> embedded Unit groups -> Lesson public views。Unit 不暴露数据库 id，也不成为跨域 logical reference。

### UC-R04 GetLesson

按 Lesson UUID 获取 published lesson metadata、current published revision ID。

### UC-R05 GetLessonContent

一次返回学习页稳定 read model：ordered Sections + Items + referenced knowledge/exercise/media descriptors，避免客户端对 31 张表 N+1 拼装。Section 暴露 public UUID；LessonItem 不暴露 internal id。

### UC-R06 GetContentDetail

按 Registry UUID 返回 discriminated union detail，以及需要的 meanings/translations/examples/pronunciation metadata。Public 只允许 active/current-published content。

### UC-R07 LookupDictionaryEntry

精确 lookup word form。输入 language + query；命中返回 canonical ContentDetail 摘要；不存在为 404。

### UC-R08 SearchDictionary

有界 word search：language/filter/query/cursor/limit；ranking = exact > prefix > trigram similarity。无结果为 200 + empty list。

### UC-R09 GetRelatedContent

按 Content UUID 返回 canonical equivalents、same-language relations、tags；只返回 public-safe active targets。

### UC-R10 GetExerciseDefinition

按 Exercise UUID 返回 client-safe ordered practice definition。必须删除正确答案与 answer rules；仅 published revision 可 public resolve。

### UC-R11 GetQuestionDefinition

按 Question UUID 返回 client-safe single-question view，用于 deep-link/debuggable runtime composition；同样执行 answer-redaction。它不替代 Exercise aggregate endpoint。

## 4. REQUIRED — Knowledge Authoring

### UC-R12 CreateKnowledge

Permission：`content.knowledge.write`。

Transaction：生成 UUID -> Registry -> subtype -> initial draft revision。Service 校验 type/language/subtype；首次 publish 前不可 public discovery。

### UC-R13 UpdateKnowledge

Permission：`content.knowledge.write`。输入 `expectedUpdatedAt`；写入 draft working state/snapshot，不允许改 public ID、language/type identity。

### UC-R14 ChangeKnowledgeStatus

Permission：`content.knowledge.write`。支持 active/disabled/archive 的受控 lifecycle；core content 不物理删除；archive 后不得用于新编排。

### UC-R15 ManageMeanings

Permission：`content.knowledge.write`。以 complete ordered set 或明确 add/update commands 管理 sense，保证 `(content,language,senseOrder)` 唯一。

### UC-R16 ManageTranslations

Permission：`content.knowledge.write`。只接受 canonical human-confirmed translation；target language 必须合法且与 source content language 不同；primary translation 在 `(content,target language)` 最多一个。

### UC-R17 ManageExamplesAndPronunciationMetadata

Permission：`content.knowledge.write`。Example sentence 必须是 sentence Registry type；Pronunciation 只写知识 metadata，不写 Audio production state。

### UC-R18 ManageKnowledgeRelationsAndTags

Permission：`content.knowledge.write`。Equivalent 必须跨语言；Relation 必须同语言；通过 aggregate set semantics 管理，不暴露 join row ID。

## 5. REQUIRED — Curriculum Authoring

### UC-R19 CreateCourse

Permission：`content.curriculum.write`。创建 UUID Course，初始 `draft`，learningLanguage 仅 zh/lo；coverMediaId 只接 Asset logical UUID。

### UC-R20 UpdateCourse

Permission：`content.curriculum.write`。更新 scalar draft fields；`expectedUpdatedAt` 防 stale write；public ID immutable。

### UC-R21 ReplaceCourseStructure

Permission：`content.curriculum.write`。锁 Course，提交完整 ordered Unit groups + Lesson references/definitions；Unit 是 aggregate-internal，不提供独立 REST CRUD。最终 sortOrder 必须 dense/deterministic 且 unique。

### UC-R22 PublishCourse

Permission：`content.curriculum.publish`。校验 Course、Unit、Lesson、Section、Item、Knowledge/Exercise refs、asset refs、ordering 与所需 revisions；transaction 内发布新 course revision、supersede old current revision、将 Course 标记 published。

### UC-R23 ArchiveCourse

Permission：`content.curriculum.publish`。Course 退出新的 public discovery；不删除 UUID/revisions，不破坏 Learning history。

### UC-R24 CreateOrUpdateLesson

Permission：`content.curriculum.write`。创建/更新 Lesson root；UUID immutable；必须隶属 Course 内某 Unit；使用 root optimistic concurrency。

### UC-R25 ReplaceLessonStructure

Permission：`content.curriculum.write`。锁 Lesson 后整体提交 ordered Section/Item tree。Section public UUID 对已存在 section 保持不变；Item 是内部节点。引用 knowledge/exercise/media 必须验证。

### UC-R26 PublishLesson

Permission：`content.curriculum.publish`。校验完整结构与引用，发布 Lesson revision；旧 published revision superseded。Published lesson 的破坏性历史重写禁止。

## 6. REQUIRED — Practice Authoring

### UC-R27 CreateOrUpdateExercise

Permission：`content.practice.write`。创建/更新 Exercise UUID root、type/passingScore/maxAttempts；`expectedUpdatedAt` concurrency。

### UC-R28 ReplaceExerciseQuestions

Permission：`content.practice.write`。锁 Exercise，提交完整 ordered Question public roots；question sortOrder deterministic；禁止跨 Exercise 偷换内部 BIGINT。

### UC-R29 CreateOrUpdateQuestionDefinition

Permission：`content.practice.write`。管理 Question + QuestionContents + Options + AnswerRules 作为一个 aggregate mutation；验证题型、内容、媒体、正确答案 cardinality 与 rule compatibility。

### UC-R30 PublishPracticeDefinition

Permission：`content.practice.publish`。发布 Question revisions，再发布 Exercise revision pinning exact question revision IDs；public client view必须经过 answer-redaction。

## 7. REQUIRED — Cross-Domain Public Contract

### UC-R31 ResolveEntityReference

Consumer：Learning/Audio/other trusted domain。按 stable UUID resolve `content/course/lesson/section/exercise/question` 的 existence/type/status；不导出 repositories/SQL/rows。

### UC-R32 ResolvePublishedRevision

按 revision UUID 或 entity UUID 获取 immutable published snapshot。Disabled/archived current entity的历史 revision 仍可 trusted resolve。

### UC-R33 ValidateAudioSource

Audio 提交 `(entityType, entityId, revisionId, languageCode, audioRole)`；Content 验证 entity/revision 一致、revision published、source 可导出 deterministic audio input。允许 source root：content/course/lesson/exercise/question。

### UC-R34 ResolvePracticeForScoring

Learning server-side 按 Exercise/Question + pinned revision 获取 trusted scoring view，包含 correct options/answer rules；这个 capability 绝不能直接映射成 public Mobile response。

## 8. Shared Preconditions / Outcomes

所有 Admin mutation：

1. authenticated Identity context；
2. active Operations operator；
3. exact Content permission；
4. request schema strict，unknown fields rejected；
5. transaction/lock as required；
6. success 后按 Operations audit contract 记录 operator action；
7. failure 不伪造 success audit；
8. 不修改跨域 canonical facts。

所有 Runtime read：

- public IDs only；
- public current published/active visibility only；
- bounded pagination；
- no answer leakage；
- no storage internals。

## 9. DEFERRED — 10

| ID | Capability | Decision |
| --- | --- | --- |
| D01 | Advanced full-text / semantic / fuzzy search | PostgreSQL V1 evidence insufficient for broader promise |
| D02 | Bulk import/export | defer until authoring workflow requires it |
| D03 | CSV authoring | defer; no separate ingestion contract now |
| D04 | AI auto-generation | no canonical auto-write in V1 |
| D05 | AI translation Request->Review->Promote automation | Learning-to-Content promotion flow deferred |
| D06 | Multi-step content approval workflow | V1 publish permission is sufficient |
| D07 | Scheduled publish | no scheduler requirement in V1 |
| D08 | Real-time multi-editor collaborative locking | optimistic conflict only in V1 |
| D09 | Localization beyond zh/lo | schema only supports zh/lo |
| D10 | Public revision-history browsing UI/API | trusted revision resolution exists; history browser deferred |

## 10. NOT_SUPPORTED — 14

| ID | Capability | Reason |
| --- | --- | --- |
| N01 | Physical delete of core Knowledge | lifecycle uses disabled/archived |
| N02 | Content-owned user progress/completion | Learning-owned |
| N03 | Content-owned attempts/answers/reviews | Learning-owned |
| N04 | Content-owned runtime AI translation | Learning-owned |
| N05 | Content-owned TTS/audio production | Audio-owned |
| N06 | Content-owned storage metadata | Asset-owned |
| N07 | Cross-domain/internal BIGINT references | global contract forbids |
| N08 | Standalone Unit public identity/API | no UUID; Course aggregate-internal |
| N09 | Standalone LessonItem public identity/API | no UUID; Lesson aggregate-internal |
| N10 | Standalone Option/AnswerRule public identity/API | Question aggregate-internal |
| N11 | Public draft/disabled/archived discovery | security/lifecycle violation |
| N12 | Unbounded dictionary search | abuse/performance risk |
| N13 | Wildcard/per-table Content permissions | Operations exact minimal capability model |
| N14 | Client-visible scoring answer keys | answer leakage violation |

## 11. Exit

```text
Use Cases = FROZEN
REQUIRED = 34
DEFERRED = 10
NOT_SUPPORTED = 14
Implementation = NOT_STARTED
Implementation dependency = OPERATIONS_GATE
```
