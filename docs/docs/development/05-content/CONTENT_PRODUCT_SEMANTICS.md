---
status: frozen
phase: 5
phase_name: Content Domain
document: CONTENT_PRODUCT_SEMANTICS
design_only: true
implementation_started: false
last_updated: 2026-09-02
repository_commit_audited: 007d6ad705a9afcc4fefb03442e371b4dec07fad
database_authority:
  - database/migrations/0400_content.sql
  - database/migrations/1240_content_revision.sql
depends_on:
  - ../04-operations/OPERATIONS_DESIGN_AUDIT.md
  - ../03-platform/PLATFORM_IMPLEMENTATION_REPORT.md
lifecycle: historical
derived_from: domains/content/index.md
---


# ZH-LAO  — Content Product Semantics

⚠️ **派生文档（DERIVED）** — 规范归属（canonical owner）：`domains/content/index.md`。本文件为实现轨（implementation-track）文档，**不是产品/领域事实权威**（Constitution 原则 II）。产品/领域事实以规范归属文档为准，请勿在此重复或自行修改事实。




> 本文冻结 Content Domain V1 产品语义。设计必须适配 frozen database contract；不得从 31 张表机械生成 CRUD，不得修改 `0400_content.sql`，不得把 Learning / Audio / Asset / Operations 的 canonical state 搬进 Content。

## 1. Authority and Boundary

Content canonical owner：

- canonical teaching knowledge；
- curriculum definitions；
- canonical human-confirmed teaching translations；
- dictionary relationships / tags；
- practice/question definitions；
- Content revision snapshots and publication semantics。

Content 不拥有：

- user progress / completion / attempt / answer / review / search history / runtime translation result（Learning）；
- audio production workflow / slot / task / review / official version（Audio）；
- provider / bucket / object key / mime / size / checksum（Asset Infrastructure）；
- operator authentication / role / permission assignment（Operations）；
- platform runtime configuration / feature flag semantics（Platform）。

跨域规则固定为：Owner Domain owns canonical facts；Content 只通过 stable UUID logical reference 与 public contract 协作，不建立跨域 physical FK。

## 2. Physical Model

`0400_content.sql` 固定 31 张核心表：

- Knowledge 17；
- Dictionary 4；
- Curriculum 5；
- Practice Definition 5。

`1240_content_revision.sql` 是 frozen baseline 之后的 forward blocker-resolution migration，额外提供 `content.content_revisions`。它不改写 `0400_content.sql`，因此本文口径为：

```text
31 core Content tables
+ 1 revision support table
```

## 3. Content Registry

`content.contents` 是所有 canonical teaching knowledge 的统一 Registry identity。

只有以下 8 类实体必须先取得 Registry identity：

```text
zh_pinyin
zh_hanzi
zh_word
zh_sentence
lo_letter
lo_syllable
lo_word
lo_sentence
```

`meaning / translation / example / pronunciation` 不是新的 Registry type；它们是挂在 Registry Content 上的知识子事实。`content_equivalents / content_relations / tags` 也不是独立教学 Content。

创建规则：

1. 应用生成 immutable `contents.public_id UUID`；
2. 创建 Registry 与对应 subtype row 必须在同一 PostgreSQL transaction；
3. Service 必须校验 `content_type` 与 subtype table 一致；
4. `zh_*` type 只能使用 `language=zh`，`lo_*` type 只能使用 `language=lo`；
5. 失败必须整体 rollback，禁止 orphan Registry 或 orphan subtype。

`content_type` 创建后 immutable。错误类型不能原地 retype；应创建正确的新 Content，并对错误实体执行 lifecycle 退出。

## 4. Knowledge Lifecycle

Physical status：

```text
active
-disabled
-archived
```

V1 产品语义：

- `active`：允许 runtime 作为当前 canonical knowledge 被读取；
- `disabled`：从新的 public/runtime discovery 隐藏，但 Admin、历史解析和 revision resolution 仍可读取；
- `archived`：业务退役，不再进入新的课程/练习编排；历史 logical ID 仍可解析；
- core Knowledge 不物理删除；
- archived → active 的恢复 V1 不提供通用命令；需要恢复时通过明确后续设计裁决。

新建 Knowledge 在首次 publish 前应用层显式保持非公开状态；不得依赖数据库 `active` default 把未审定内容暴露给 runtime。

## 5. Language and Direction

Canonical language code 只有：

```text
zh
lo
```

Course physical contract 只有 `learning_language`，没有 `native_language`。因此 Content V1 的 canonical course direction 是“学习目标语言”，而不是持久化 `(source_language,target_language)` pair：

```text
learning_language=zh -> Chinese-learning course
learning_language=lo -> Lao-learning course
```

产品只有两种语言时，客户端可以在会话/用户上下文中推导另一语言，但 Content API 不伪造第二个数据库字段。

`translations.language` 表示 canonical translation text 的语言；Authoring Service 必须拒绝与源 Content language 相同的 canonical translation。`meanings.language` 表示释义文本语言，可由产品用例决定是否与源语言相同。

`content_equivalents` 是两个 canonical Content identity 之间的跨语言业务关系；`content_relations` 是同语言关系。两者都不是 `translations` 文本的替代品。

## 6. Knowledge Read Model

Runtime `ContentDetail` 使用 discriminated union，不向客户端暴露 subtype table、join table 或 internal BIGINT。

公共外壳：

```text
id: UUID
language: zh | lo
type: eight registry types
status: active | disabled | archived (admin/history only; public active only)
revisionId: UUID for the resolved published snapshot
meanings[]
translations[]
examples[]
pronunciation
relations/tags as requested
```

`detail` 按 `type` 返回 type-specific view，例如：

- zh_pinyin: syllable / initial / final / tone / displayForm；
- zh_hanzi: character / traditionalCharacter / strokeCount / radical / pinyin relations；
- zh_word: simplified / traditional / pinyinText / wordClass / ordered Hanzi composition；
- zh_sentence: text / pinyinText；
- lo_letter: character / type / class / name / romanization；
- lo_syllable: text / romanization / tone / ordered letter composition；
- lo_word: text / romanization / wordClass / ordered syllable composition；
- lo_sentence: text / romanization。

关系数组更新采用 aggregate command / complete-set semantics；不得让客户端直接 CRUD join rows。

## 7. Meanings, Translations, Examples, Pronunciation

### Meaning

Meaning 是 Content 的 ordered sense。`sense_order` 在 `(content, language)` 内唯一。Disabled meaning 不出现在默认 public view。

### Translation

`content.translations` 只保存人工确认的 canonical teaching translation。用户即时翻译请求与 AI runtime result 属 Learning。

V1 REQUIRED：translation authoring / validation / publication。

V1 DEFERRED：`Learning translation request -> human review -> promote to Content translation` 的自动工作流；未来只能通过明确跨域 contract 增加。

### Example

Example 将一个 Content/Meaning 关联到 sentence Content；Service 必须验证 `sentence_content_id` 的 Registry type 确为 `zh_sentence` 或 `lo_sentence`。

### Pronunciation

`content.pronunciations` 只存 pronunciation knowledge metadata，如 pronunciation text/key/accent/source；不存音频文件、TTS job 或 official audio pointer。

## 8. Dictionary Semantics

四个概念严格区分：

- `translation`：某 Content 的 canonical 文本翻译；
- `content_equivalent`：两个跨语言 canonical Content 的 identity relationship；
- `content_relation`：同语言 synonym / antonym / related / derived / variant；
- `meaning`：某 Content 的释义 sense。

V1 Dictionary runtime：

1. Exact lookup：按语言与 word form 精确匹配；无匹配为 `404 CONTENT_NOT_FOUND`；
2. Search：只承诺当前 PostgreSQL 能高效支持的 word fields；
3. Chinese 搜索字段：simplified / traditional / pinyin_text；
4. Lao 搜索字段：text / romanization；
5. 排名固定为 exact > prefix > trigram similarity；同分以 display form + public UUID 稳定排序；
6. `limit` default 20, max 50；query 长度 1..128；
7. search 无结果返回 `200` + empty items；
8. public search 只返回 `active` Content；
9. V1 不引入 Elasticsearch / Meilisearch / Redis。

Advanced semantic/fuzzy search、多语言全文索引、搜索个性化 ranking 均 deferred。

## 9. Curriculum Semantics

Canonical hierarchy：

```text
Course -> Unit -> Lesson -> LessonSection -> LessonItem
```

身份边界：

- Course：public UUID aggregate root；
- Unit：Course aggregate-internal ordered node，无 cross-domain UUID；
- Lesson：public UUID aggregate root；
- LessonSection：public UUID，因为 Learning `last_section_id` 需要跨域解析；
- LessonItem：Lesson aggregate-internal ordered node，无 cross-domain UUID。

Course lifecycle：`draft -> published -> archived`。Lesson lifecycle：`draft -> published -> archived`。Unit/Section/Item 跟随上级，不自带 lifecycle status。

Course 的 `learning_language` 是课程目标语言。Unit/Section/Item ordering 由 `(parent, sort_order)` unique constraint + aggregate transaction 保证。

Admin 不获得 Unit / LessonItem 的 table CRUD。结构编辑采用 whole-aggregate replacement：

- ReplaceCourseStructure：锁 Course，提交完整 ordered Unit shell 与 Lesson public IDs；
- ReplaceLessonStructure：锁 Lesson，提交完整 ordered Section/Item tree；
- 每次结构 mutation 都必须触碰 aggregate root `updated_at`，以 root `expectedUpdatedAt` 作为 optimistic conflict token。

Draft 内部结构可在 RESTRICT 允许且无历史依赖时重排/移除；已经发布并形成 Learning history 的 public roots/sections不得通过破坏性删除使 logical UUID 失效。重大变更通过新 revision；需要完全替代的 public entity 使用新 UUID。

## 10. Practice Definition Semantics

Structure：

```text
Exercise -> Question -> QuestionContent / QuestionOption / AnswerRule
```

Exercise 与 Question 是 public UUID roots；Option / Rule / QuestionContent 是 aggregate-internal nodes，不对其他 Domain 暴露 row identity。

Question taxonomy 固定为：

```text
single_choice
multiple_choice
true_false
fill_blank
ordering
matching
listen_choice
content_choice
```

Exercise type：`practice | review | test`。

Service invariants：

- question sort order 在 exercise 内 deterministic；
- option sort order 在 question 内 deterministic；
- display row 至少有一种 content/text/media source；
- choice question 必须满足对应正确答案 cardinality；
- answer rule 必须与 question type 匹配；
- referenced content 必须存在且类型允许；
- media UUID 是 Asset logical reference；
- user answer/attempt/result 永远写 Learning，不写 Content。

## 11. Answer Leakage Rule

Public/Mobile practice definition 只返回“作答所需信息”：prompt、display contents、options、media、score metadata；绝不返回：

```text
question_options.is_correct
answer_rules.expected_text
answer_rules.content_id when it represents the answer key
answer_rules.metadata containing answer keys
explanation before evaluation when it reveals answer
```

Learning server-side scoring 通过 trusted `ContentPublicQueries.resolvePracticeForScoring()` 获取 scoring view。HTTP client 与 cross-domain trusted scoring contract 是两个不同 view。

## 12. Revision and Publication

`content.content_revisions` 是 V1 revision authority。Revision public ID 为 immutable UUID。

支持的 revision entity type：

```text
content
course
lesson
exercise
question
translation
```

其中 `translation` V1 解释为“某 Content 的 canonical translation set”，`entity_id = parent content.public_id`，不是单个 translation row ID；这样不要求向 `content.translations` 暴露 internal BIGINT。

Revision lifecycle：

```text
draft -> published -> superseded
```

规则：

- 一个 `(entity_type, entity_id)` 同时最多一个 current published revision；
- draft 可以在发布前替换 snapshot；published snapshot immutable；
- 发布新 revision 时，同一 transaction 先 supersede previous current revision，再发布 new revision；
- runtime 默认读取 current published contract；
- Learning/Audio 可以 pin `revision_public_id` 读取 immutable historical snapshot；
- `created_by_operator_id` 是 Operations logical UUID，无 cross-domain FK；
- DB 的 `published_at` 只表示 current published row；superseded row 的发布时间历史不是 V1 产品要求。

Aggregate snapshot 规则：

- content snapshot：Registry + subtype + meanings/examples/pronunciation + relation references；translation set 可独立 version；
- course snapshot：course scalars + ordered units + lesson public references/revision pins；
- lesson snapshot：lesson scalars + sections/items + referenced public IDs/assets；
- exercise snapshot：exercise scalars + ordered question public IDs/revision pins；
- question snapshot：question contents/options/answer rules，属于 sensitive trusted snapshot。

## 13. Public ID Contract

Never expose Content internal BIGINT outside the module.

Stable cross-domain UUID roots：

```text
contents.public_id
courses.public_id
lessons.public_id
lesson_sections.public_id
exercises.public_id
questions.public_id
content_revisions.revision_public_id
```

`units` / `lesson_items` / `question_contents` / `question_options` / `answer_rules` 没有 public UUID，必须保持 aggregate-internal，不得被 Learning/Audio/Trust/Operations 保存为跨域 logical reference。

`vocabulary_id` / `sentence_id` 等历史业务名若出现在消费者语义中，统一解析为对应 Registry `contents.public_id`，不创建第二套 UUID namespace。

## 14. Learning Contract

Learning 可保存：course UUID、lesson UUID、section UUID、content UUID、exercise UUID、question UUID，以及需要历史可重放时的 revision UUID。

Content status 变化不删除 Learning history：

- disabled/archived entity 仍可通过 trusted historical resolver 解析；
- new runtime discovery 不再推荐 retired content；
- historical scoring/replay 按 pinned revision，不按当前 live row 猜测旧题定义。

Content 永远不写 user progress / attempt / answer。

## 15. Audio Contract

Audio Slot source 必须使用 Content stable logical UUID + required Content revision UUID。

V1 可作为 Audio source root 的 Content entity type：

```text
content
course
lesson
exercise
question
```

前提是对应 entity 有 public UUID、当前 revision 可解析，且该 audio role 能从 snapshot 导出 deterministic input。Audio 不直接读取 `content.*` SQL，而通过 Content public contract 校验 source、读取 revision snapshot/input。

Content 展示 official audio 时通过 Audio public read / official slot resolution 获取当前 official asset；Content 不复制 Audio slot/task/review/publish state。

## 16. Asset Contract

`cover_media_id`、`lesson_items.media_id`、`question_contents.media_id`、`question_options.media_id` 都是 Asset Infrastructure logical UUID，无 cross-domain FK。

Content 只保存 asset UUID 及业务用途；不保存 provider/bucket/object key/mime/size/checksum。若客户端需要 URL，由 Asset/Audio delivery mechanism 解析，Content API 不泄漏 storage internals。

## 17. Outbox Decision

```text
Content V1 required Outbox events = none
```

当前真实下游需求可由同步 public contract + immutable revision pin 满足；没有已冻结的异步消费者要求 `ContentPublished` 等事件。未来若出现搜索索引、cache invalidation 或外部订阅者，再以真实消费者为依据添加事件，不因 Foundation 已有 Outbox 就预先广播全量 mutation。

## 18. Cache/Search Infrastructure

```text
PostgreSQL first
Redis = NOT_REQUIRED
Elasticsearch/Meilisearch = NOT_REQUIRED
Kafka = NOT_REQUIRED
```

Published immutable revision 可使用 HTTP ETag/conditional GET；V1 不要求 server-side in-process cache。先通过 PostgreSQL indexes、bounded query 和 aggregate reads 满足 runtime。

## 19. Concurrency

- Registry + subtype create：single transaction；
- root mutation：`SELECT ... FOR UPDATE` + `expectedUpdatedAt` compare；
- course/lesson structure replacement：lock root, validate complete ordered tree, write changes atomically；
- reorder：先使用 collision-free temporary positions或 delete/reinsert draft-only internal nodes，再写 final dense order；最终 invariant 为 parent 内 unique deterministic order；
- exercise/question mutation：lock Exercise/Question root；
- publish vs edit：publish locks root and current revision set；stale expectedUpdatedAt -> `409 CONTENT_CONFLICT`；
- retire vs read：new public reads require current visibility；trusted historical resolver remains available；
- unique constraints are final race protection，不用应用层先查后写替代约束。

## 20. Security

必须保证：

- public path 不返回 draft/disabled/archived current content，除历史专用 contract 外；
- public practice view 不泄漏 answer key；
- Admin mutation 必须由 Operations exact permission 授权；Feature Flag 不是权限；
- unknown fields rejected；禁止 mass assignment status/public_id/internal_id；
- dictionary query bounded；
- rich/body text 按客户端安全渲染策略处理，Content API 不声明 HTML trusted；
- responses/logs 不输出 SQL/internal BIGINT/storage credentials。

## 21. Content Admin Permission Requirements

遵循 Operations strict three-segment exact grammar，Content V1 只要求 8 个 keys：

```text
content.knowledge.read
content.knowledge.write

content.curriculum.read
content.curriculum.write
content.curriculum.publish

content.practice.read
content.practice.write
content.practice.publish
```

`knowledge.write` 覆盖 meanings/translations/examples/pronunciation metadata/relationships/tags；不按 table 拆 permission。Audit 查看继续使用 Operations 自有 `operations.audit_logs.read`。

这些 keys 只是 Content canonical requirement；本 Design Phase 不修改 Operations catalog。正式扩展必须等 `OPERATIONS_GATE = PASS` 后按 Operations catalog evolution contract reconciliation `super_admin`，再开放依赖新 key 的管理 route。

## 22. Final Product Decisions

```text
Product Semantics                 = FROZEN
Knowledge Contract                = FROZEN
Dictionary Contract               = FROZEN
Curriculum Contract               = FROZEN
Practice Contract                 = FROZEN
Translation Ownership             = FROZEN / PASS
Learning Boundary                 = PASS
Audio Boundary                    = PASS
Asset Boundary                    = PASS
Outbox                            = NONE REQUIRED V1
Cache/Search                      = POSTGRESQL FIRST
Content Implementation            = NOT_STARTED
Content Implementation Dependency = OPERATIONS_GATE
```
