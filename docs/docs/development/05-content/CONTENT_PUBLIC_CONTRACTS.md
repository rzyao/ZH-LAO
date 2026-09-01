---
status: frozen
phase: 5
phase_name: Content Domain
document: CONTENT_PUBLIC_CONTRACTS
design_only: true
implementation_started: false
last_updated: 2026-09-02
repository_commit_audited: 007d6ad705a9afcc4fefb03442e371b4dec07fad
lifecycle: historical
---

# ZH-LAO  — Content Public / Cross-Domain Contracts

> Target module boundary: `apps/backend/src/modules/content/public/`. Public contract 暴露业务 read/validation capability，不暴露 persistence。

## 1. Forbidden Exports

`content/public` 禁止导出：

```text
repositories
SQL
DatabaseExecutor
TransactionManager
DB row types
internal BIGINT
raw table names
mutable domain internals
```

其他 Domain 禁止直接 SQL `content.*`。

## 2. Public Identity Types

Conceptual TypeScript：

```ts
type ContentPublicId = string;        // UUID
type CoursePublicId = string;         // UUID
type LessonPublicId = string;         // UUID
type LessonSectionPublicId = string;  // UUID
type ExercisePublicId = string;       // UUID
type QuestionPublicId = string;       // UUID
type ContentRevisionId = string;      // UUID
type AssetId = string;                // external logical UUID

type ContentEntityType =
  | 'content'
  | 'course'
  | 'lesson'
  | 'lesson_section'
  | 'exercise'
  | 'question';
```

Unit / LessonItem / QuestionContent / QuestionOption / AnswerRule 无 public ID type。

## 3. ContentPublicQueries

Canonical conceptual surface：

```ts
interface ContentPublicQueries {
  resolveContent(id: ContentPublicId, options?: ResolveOptions): Promise<ContentPublicView | null>;
  resolveCourse(id: CoursePublicId, options?: ResolveOptions): Promise<CoursePublicView | null>;
  resolveLesson(id: LessonPublicId, options?: ResolveOptions): Promise<LessonPublicView | null>;
  resolveLessonSection(id: LessonSectionPublicId, options?: ResolveOptions): Promise<LessonSectionPublicView | null>;
  resolveExercise(id: ExercisePublicId, options?: ResolveOptions): Promise<ExercisePublicView | null>;
  resolveQuestion(id: QuestionPublicId, options?: ResolveOptions): Promise<QuestionPublicView | null>;

  resolveRevision(id: ContentRevisionId): Promise<ContentRevisionView | null>;
  resolveCurrentPublishedRevision(ref: RevisionEntityRef): Promise<ContentRevisionView | null>;

  validateReference(request: ValidateContentReferenceRequest): Promise<ValidatedContentReference>;
  resolvePracticeForScoring(request: ResolvePracticeForScoringRequest): Promise<PracticeScoringView>;
  validateAudioSource(request: ValidateAudioSourceRequest): Promise<ValidatedAudioSource>;
}
```

Implementation 可以拆成多个更小 interface，但语义必须等价；禁止消费者拿到 repository。

## 4. ResolveOptions

```ts
type ResolveOptions = {
  visibility?: 'public_current' | 'trusted_current' | 'trusted_history';
  revisionId?: ContentRevisionId;
};
```

Semantics：

- `public_current`：只返回可 public 使用的 current published/active entity；
- `trusted_current`：允许 domain integration resolve disabled/archived current metadata；
- `trusted_history`：必须指定或通过 history link resolve immutable revision；
- unknown UUID -> null / typed not-found，由调用方 Use Case决定；
- caller 不能要求 internal BIGINT。

## 5. Public Views

所有 view 必须是 persistence-independent DTO。

### ContentPublicView

```ts
type ContentPublicView = {
  id: ContentPublicId;
  language: 'zh' | 'lo';
  type:
    | 'zh_pinyin' | 'zh_hanzi' | 'zh_word' | 'zh_sentence'
    | 'lo_letter' | 'lo_syllable' | 'lo_word' | 'lo_sentence';
  status: 'active' | 'disabled' | 'archived';
  revisionId: ContentRevisionId | null;
  detail: unknown; // actual implementation is a typed discriminated union, not arbitrary DB JSON
};
```

### Course/Lesson/Section

Course/Lesson public view含 stable UUID、lifecycle、learning language/structure summary、current revision。Course structure可嵌入 Unit values，但 Unit没有跨域 identity。

Section public view存在是因为 `learning.lesson_progress.last_section_id` 保存 UUID logical reference。

## 6. Revision Contract

```ts
type RevisionEntityType =
  | 'content'
  | 'course'
  | 'lesson'
  | 'exercise'
  | 'question'
  | 'translation';

type ContentRevisionView = {
  revisionId: ContentRevisionId;
  entityType: RevisionEntityType;
  entityId: string;       // stable UUID logical id
  revisionNumber: number;
  status: 'draft' | 'published' | 'superseded';
  snapshot: unknown;      // decoded/validated by entity-specific schema
  createdAt: string;
};
```

`translation` 的 `entityId` V1 定义为 parent `ContentPublicId`，表示该 Content 的 canonical translation set；不引用 `translations.id BIGINT`。

Published revision immutable。下游保存 revision ID 后，Content 后续 publish/disable/archive不得改变该 revision snapshot。

## 7. Learning Contract

Learning currently persists logical UUID fields for course/lesson/section/content/exercise/question。Content public contract保证这些 UUID可以不依赖 internal PK 被验证/解析。

Recommended Learning interactions：

```text
start course       -> validate Course UUID/current visibility
start lesson       -> validate Lesson UUID + course relation
last section       -> validate Section UUID + lesson relation
content mastery    -> validate Content UUID/type
exercise attempt   -> pin Exercise UUID + current published revision
question attempt   -> pin/validate Question UUID under pinned Exercise definition
historical replay  -> resolve revision UUID, not current mutable state
```

Learning 不保存 Unit/Item/Option/Rule BIGINT；也不让 Content 写 progress。

## 8. Practice Scoring Contract

`resolvePracticeForScoring()` 只允许 backend trusted consumer，返回：

```text
exercise id/revision
question id/revision/type/score
ordered options including correctness
answer rules
normalization/scoring inputs
explanation as appropriate
```

该 type 放在 server-only public contract，不复用 Runtime HTTP DTO。测试必须验证 safe HTTP mapper 无法序列化 trusted scoring-only fields。

## 9. Audio Production Contract

Audio physical contract要求：

```text
content_entity_id UUID
required_content_revision_id UUID
content_revision_id UUID
```

因此 Content 提供：

```ts
type ValidateAudioSourceRequest = {
  entityType: 'content' | 'course' | 'lesson' | 'exercise' | 'question';
  entityId: string;
  revisionId: ContentRevisionId;
  languageCode: 'zh' | 'lo';
  audioRole: string;
};

type ValidatedAudioSource = {
  entityType: ValidateAudioSourceRequest['entityType'];
  entityId: string;
  revisionId: ContentRevisionId;
  languageCode: 'zh' | 'lo';
  textSnapshot: string;
  pronunciationSnapshot: unknown | null;
  audioInputHashMaterial: unknown;
};
```

Validation：entity存在；revision属于该 entity；revision已 published；language 与 entity/snapshot一致；audioRole 支持；input可 deterministic 生成。

Content 不调用 Audio repository，也不管理 Slot/Task。Audio发布后，Content/runtime需要 official audio 时通过 Audio public read keyed by source tuple 获取 official asset descriptor。

## 10. Asset Contract

Content 持有的 media UUID字段只是 Asset logical ref。Content public view最多暴露：

```ts
type ContentAssetRef = {
  assetId: AssetId;
  role: 'cover' | 'image' | 'audio' | 'option_media' | 'question_media';
};
```

不暴露 provider/bucket/objectKey/checksum。URL签名/可访问性由 Asset/Audio owner contract负责。

## 11. Operations Contract

Content Admin requires exact permission keys：

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

Content 不读取 `operations.*` SQL；HTTP integration使用 Operations public authorization capability。成功 mutation产生的 operator audit按 Operations contract写入；Content只提供 action/target/request metadata，不复制 audit table。

Target logical reference：

- Knowledge target -> Content UUID；
- Course -> Course UUID；
- Lesson -> Lesson UUID；
- Exercise -> Exercise UUID；
- Question -> Question UUID；
- aggregate internal Unit/Item/Option/Rule操作的 audit target使用所属 public root UUID，并在 metadata描述 subresource position/type。

## 12. Platform Contract

Content 复用 Platform 已冻结的 HTTP/runtime infrastructure和可选 config/feature evaluation，不复制 Platform state。

Feature Flag 只能控制 capability rollout/display，不得替代 Operations permission或 Content lifecycle validation。

## 13. Reference Validation

`validateReference()` 可表达：

```ts
type ValidateContentReferenceRequest = {
  entityType: ContentEntityType;
  id: string;
  requireStatus?: 'active' | 'published' | 'resolvable';
  allowedContentTypes?: string[];
  parent?: { type: ContentEntityType; id: string };
};
```

用途：

- Learning验证实体；
- Audio验证 source；
- future Trust记录 subject logical reference；
- Content自身编排验证。

它只返回业务 validation，不返回 DB PK。

## 14. Compatibility

Public UUID 永不回收给另一实体。Published revision snapshot 永不就地改写。

新增 optional DTO field可以向后兼容；改变 enum/meaning/answer visibility需要 versioned contract或明确 migration plan。

Cross-domain caller不得依赖 Content内部 table shape；只依赖这里冻结的业务 types/capabilities。

## 15. Freeze

```text
Public Contract = FROZEN
BIGINT exports = 0
Cross-domain physical FK = 0
Learning boundary = PASS
Audio boundary = PASS
Asset boundary = PASS
Operations requirement = FROZEN
Implementation = NOT_STARTED
```
