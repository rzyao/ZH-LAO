---
status: prepared
phase: 7
phase_name: Audio Production Domain
artifact: design_brief
design_only: true
implementation_started: false
last_updated: 2026-08-31
---

# ZH-LAO V2 — Audio Production Domain Design Brief

> 本文件是 Audio Production Domain 产品方案 / 契约设计会话入口。
>
> 本会话只完成 Repository Audit、Product Semantics、Use Cases、Production/Review/Publish Contracts、TTS/Human Recording Contracts、API/Public Contract、Operations/Admin Requirements、Implementation Plan、Design Audit 与 `AUDIO_DESIGN_GATE`。
>
> **不要开始 Audio Implementation。**
>
> 执行 AI 必须先通过 GitHub 连接器读取远程 `main` 的真实状态；不得根据本文写入时的仓库快照猜测 Content/Learning/Operations 当前 Gate。

## 1. Mission

```text
Audio Production Domain
→ Repository Audit
→ Product Semantics
→ Slot / Task / Attempt / Asset Version Semantics
→ Human Recording / TTS Contracts
→ Review / Publish Contracts
→ Batch / Preset Contracts
→ Content / Asset / Operations Boundaries
→ API / Public Contract
→ Admin Workbench Requirements
→ Outbox / Worker / Concurrency Decisions
→ Implementation Plan
→ Independent Design Audit
→ AUDIO_DESIGN_GATE
→ STOP
```

目标是把 frozen Audio Production 数据模型转化为可执行生产系统，而不是按 9 张表机械生成 CRUD。

## 2. Mandatory GitHub Entry Audit

连接：

```text
repository = rzyao/ZH-LAO
branch = main
```

至少读取：

```text
latest HEAD
MASTER_DEVELOPMENT_PLAN.md
DEVELOPMENT_PROGRESS.md
current CI workflows
current migration registry/count
Content current Gate/public contracts/revision contracts
Operations current Gate/public/RBAC contracts
Learning current design/implementation status
Asset Infrastructure current contracts
Admin Foundation current status
```

Audio 权威至少读取：

```text
database/v2/migrations/0600_audio.sql
docs/docs/domains/audio/index.md
docs/docs/domains/audio/database.md
ADR-020 audio production domain
relevant Asset Infrastructure docs/migrations
Content public/revision docs
Operations RBAC contracts
```

如果已有 `docs/docs/development/v2/07-audio/*` canonical docs，优先更新已有权威，不制造重复体系。

## 3. Parallel Design Rule

Audio Implementation 依赖 Content + Operations 最终可用能力。

本 Brief 允许在 Learning Implementation 同时进行 Audio **设计**，但：

```text
Audio Design = may proceed
Audio Implementation = must obey actual upstream gates
```

不要因为 Learning 正在实现就阻止 Audio 产品/契约设计；Audio 核心主要依赖 Content/Operations/Asset。

## 4. Frozen Physical Contract

数据库 authority：

```text
database/v2/migrations/0600_audio.sql
```

当前 frozen Audio business tables = 9：

```text
audio.audio_slots
audio.audio_tasks
audio.audio_generation_attempts
audio.audio_asset_versions
audio.audio_reviews
audio.audio_task_events
audio.audio_task_batches
audio.audio_task_batch_items
audio.audio_default_presets
```

主链：

```text
slot
→ task
→ generation_attempt (TTS only)
→ asset_version
→ review
→ publish
→ slot.official_asset_version_id
```

设计会话：

```text
不得修改 frozen migration
不得增加第 10 张 core table
不得把旧 pronunciation_audios / tts_jobs 复活
不得把 physical storage metadata 搬回 Audio
```

发现 schema 无法支撑 required product contract：标记 `DATABASE_CONTRACT_CONFLICT`，不要直接改 DB。

## 5. Ownership Boundaries

### Content owns

```text
canonical text/content
pronunciation knowledge metadata
content revision identity/snapshot
source entity status/type/language
```

### Audio owns

```text
audio production intent
production task lifecycle
TTS attempts
human recording production facts
audio asset versions
review history
official publication pointer
batch orchestration
default production preset selection
```

### Asset Infrastructure owns

```text
storage provider
bucket/object key
mime
size
checksum
physical asset lifecycle/storage facts
```

Audio 只保存 `asset_id` logical UUID + 音频业务/技术属性。

### Operations owns

```text
operator identity
RBAC
global operator audit
```

Audio 自己的 `audio_task_events` 是 Task lifecycle append-only audit/history，不替代 Operations operator audit，也不是 Event Sourcing。

## 6. Audio Slot Semantics

必须冻结 Slot 的产品定义：

```text
source_domain
content_entity_type
content_entity_id
language_code
audio_role
required_content_revision_id
required_audio_input_hash
status active/offline
official_asset_version_id
```

必须回答：

```text
哪些 Content entity type 可建立 Slot？
一个实体允许哪些 audio_role？
language_code 如何校验？
何时创建 Slot：内容创建时还是首次生产时？
Content revision 更新后如何标记 Slot stale / needs production？
required_audio_input_hash 如何规范化计算？
Slot offline 与 Content retired/archived 如何协作？
```

不得凭 UI 发明 schema 不支持的 Slot status。

## 7. Task Lifecycle

当前 frozen Task statuses：

```text
pending_assignment
assigned
producing
pending_review
production_failed
approved
rejected
published
canceled
```

必须冻结所有合法 transition、actor、precondition、side effect。

重点：

```text
每 Slot 同时最多一个 active Task
approved 仍属于 active set
rejected + successor task 表达重新生产
production_failed 可在同 Task 下继续 attempt
published 是 Task 最终业务完成状态
canceled 的允许来源状态
```

设计必须产出明确状态机，不允许实现阶段自行猜 transition。

## 8. TTS Production Contract

`audio_generation_attempts` 仅用于 TTS。

必须冻结：

```text
when attempt is created
attempt_no sequencing
request_id idempotency
external_job_id handling
queued/submitting/processing/retry_wait/succeeded/failed/dead_letter/canceled
transport retry vs new generation attempt
worker lease / lease_until
next_retry_at
provider callback or polling model
failure mapping
```

不要把一个 HTTP retry 当成新 Task。

不要在 Audio DB 保存 TTS provider 的长期配置权威；外部 TTS service 自维护模型/voice/provider 细节，Audio 只保存 frozen Task/Preset usage facts。

## 9. Human Recording Contract

人工录音不写 generation_attempt。

必须设计：

```text
assignment
recording start
upload/register asset
producer_operator_id
technical metadata validation
asset version creation
pending review transition
retry/re-record semantics
```

必须明确浏览器/Admin Workbench 录音和后端业务 contract 的边界，但本会话不开发 Admin 页面。

不要让前端直接写 Audio DB 或绕过 Asset Infrastructure。

## 10. Asset Version Semantics

`audio_asset_versions` 是不可变实际产物事实。

冻结：

```text
one Task -> at most one Asset Version
version increments per Slot
one Asset Version -> one asset_id
TTS source => generation_attempt_id required
Human source => producer_operator_id required
content_revision_id/audio_input_hash immutable snapshot
review_status is current projection
first_published_at semantics
```

必须设计版本号分配并发策略。

不得把 storage_key/mime/size/checksum/codec 存回 Audio；只有 schema明确的 duration/sample_rate/channels 等音频业务技术属性留在 Audio。

## 11. Review Contract

`audio_reviews` append-only。

Decision：

```text
approved
rejected
approval_revoked
```

Reject reason按 frozen enum。

必须冻结：

```text
谁能审核？
producer 是否可以审核自己的资产？
是否需要四眼原则？
approved 后何时允许 revoke？
已 published Asset 的 review revoke 如何处理？
review request_id 幂等
review_status projection如何与 append-only history一致
```

如果 V1 不做严格四眼原则，要明确写 `DEFERRED/NOT_SUPPORTED`，不要含糊。

## 12. Publish / Official Pointer

Publish 是核心业务动作。

必须冻结：

```text
asset must be approved
asset belongs to same slot
content revision/input hash freshness check
slot official pointer switch
previous official version retained
first_published_at first-write-only
Task -> published
slot official pointer transactionality
```

重点讨论 stale revision：

```text
Task based on old Content revision but review刚通过
```

是否允许 publish？默认应以 frozen required revision/hash contract裁决，不能仅凭 review approved。

需要真实并发模型：两个 approved candidate 同时 publish 只能产生确定结果。

## 13. Successor / Regeneration

拒绝后不复活旧 Task。

使用：

```text
rejected Task
→ successor Task(predecessor_task_id)
```

必须冻结：

```text
哪些字段继承
是否继承 assignee/preset
client idempotency
old asset/review history immutable
one active task invariant
```

## 14. Task Events

`audio_task_events` append-only Task lifecycle history，不是 canonical current state。

必须冻结 event mapping：

```text
task_created
assigned
production_started
production_retry
production_failed
asset_created
review_approved
review_rejected
review_revoked
successor_created
published
canceled
```

回答：

```text
哪些 state change 必须写 event？
event + current-state mutation 是否 same Audio transaction？
actor_type / actor_id rules
payload允许什么，禁止什么敏感信息
request_id idempotency
```

不要用 events 重建 Task current state 作为 V1 主路径。

## 15. Batches

设计 `audio_task_batches` / `audio_task_batch_items` 的真实产品用途：

```text
批量生成某课程/某筛选范围的音频任务？
批量任务创建是 snapshot 还是动态 query？
partial failure 如何表示？
重复 slot 如何去重？
取消 batch 是否取消已创建 Task？
progress/count 如何查询？
```

必须严格核对 schema字段后裁决，不要发明队列表。

## 16. Default Presets

`audio_default_presets` 只保存 Audio 业务层默认 preset mapping。

必须冻结：

```text
preset key 的语义
按 language/audio_role/source type 的匹配维度（仅 schema支持）
missing default behavior
operator override是否允许
Task创建后 preset snapshot/immutability
disabled/invalid preset handling
```

不要把完整 TTS 模型参数塞进 Audio DB，如果 canonical owner 是 TTS service。

## 17. Content Public Contract Dependency

Audio 不得 direct SQL `content.*`。

必须通过 `modules/content/public` 获取至少：

```text
source entity existence/type/status
stable public UUID
content revision existence
revision snapshot / production text
language/pronunciation input required for audio
```

Audio Slot/Task 创建前必须验证 source/revision。

Content 更新后的 stale detection contract必须明确。

## 18. Asset Infrastructure Contract

设计：

```text
create/register asset
validate asset existence/ownership/type
read asset metadata needed by Audio
physical cleanup request if business artifact discarded
```

通过 Infrastructure/Asset contract，不 direct SQL infrastructure assets table，除非 Foundation明确把它作为 shared infrastructure repository contract。

明确临时上传、最终注册、失败清理的生命周期，但不要在 Audio 表复制 physical storage facts。

## 19. Operations / Permission Requirements

Audio Admin/Workbench 需要 exact Operations permissions。

从真实 Use Cases 推导最小 permission catalog，例如能力维度可能是：

```text
audio.tasks.read
audio.tasks.manage
audio.production.execute
audio.review.decide
audio.publish.execute
audio.presets.manage
audio.batches.manage
```

这里只是示意；最终 key 必须满足当前 Operations grammar且由实际 Use Cases推导。

不要每张表一个 permission，不要 wildcard。

本设计只提出 requirement；不要在本会话实现 Operations catalog extension。

## 20. Admin Workbench Contract

Audio Production 是高度 Admin-oriented Domain。

本设计必须冻结未来 Workbench 所需 API/read model：

```text
production queue
assignment
recording/TTS task detail
attempt timeline
asset playback
review queue
review decision
publish action
successor generation
batch view
preset defaults
filters/status/search
```

避免 Admin 为一个页面发十几个表 CRUD 请求；设计 aggregate/workbench read model。

本会话不写 React 页面。

## 21. Public Cross-Domain Contract

设计：

```text
apps/backend/src/modules/audio/public/
```

消费者主要是 Content/runtime clients or future learning read composition。

至少评估：

```text
resolve official audio for source entity/revision/role/language
get official asset_id/version
check slot freshness
```

Public contract禁止暴露 repositories/DB executor/internal implementation。

## 22. HTTP/API Design

分：

### Runtime read

只暴露真实产品需要的 official audio resolution；如果 Content runtime response已经组合 official audio，则可以不额外暴露 generic Audio public HTTP。

### Admin management/workbench

建议：

```text
/api/v1/admin/audio/...
```

由 Operations exact RBAC保护。

### Worker/internal integration

TTS submit/callback/polling若需要 internal endpoint，必须单独安全设计，不与 public/Admin API混淆。

API必须定义 stable UUID、idempotency、expected lock version/conflict、filter/pagination、errors。

## 23. Idempotency

必须系统冻结：

```text
Task create client_idempotency_key
Review request_id
Task event request_id
TTS attempt request_id
external callback dedupe
batch create/action idempotency if schema supports
publish idempotency
```

不能只靠 UI 防重复点击。

## 24. Concurrency

设计真实 PostgreSQL race策略：

```text
same Slot concurrent Task create
Task assign/update races
TTS worker lease races
attempt number allocation
asset version number allocation
review-vs-publish
approval revoke-vs-publish
two candidates publish same Slot
Content revision changes during production
batch duplicate task creation
```

使用 unique constraint / transaction / SELECT FOR UPDATE / lock_version 等 frozen能力。

不得新增 Redis lock。

## 25. Worker Model

TTS asynchronous execution需要 worker。

复用 Foundation worker/job infrastructure。

必须设计：

```text
poll eligible attempts
lease acquire
submit/poll/callback state
retry scheduling
dead letter
shutdown/recovery
idempotency
```

不要引入 Kafka/RabbitMQ/Redis queue，除非仓库更晚 canonical architecture已经改变。

## 26. Outbox Decision

Audio Task Events ≠ infrastructure Outbox。

必须单独裁决是否需要 system outbox events供其他 Domain消费，例如 official audio published。

只有存在真实 consumer/contract才定义。

如果 V1 无 required consumer，允许：

```text
Required Audio Outbox = none
```

不要为了“以后可能有用”发一堆事件。

## 27. Required / Deferred / Not Supported

最终明确分类。

至少裁决：

```text
TTS production
human recording
manual assignment
auto assignment
review
approval revoke
publish/switch official
batch generation
preset defaults
waveform processing
transcoding
loudness normalization
speech recognition QA
automatic pronunciation scoring
multi-review approval workflow
scheduled publish
external webhook notifications
```

不要全部实现。

## 28. Errors

复用 Foundation error envelope。

冻结稳定业务错误，例如类别：

```text
AUDIO_SLOT_NOT_FOUND
AUDIO_ACTIVE_TASK_EXISTS
AUDIO_INVALID_TRANSITION
AUDIO_STALE_CONTENT_REVISION
AUDIO_ASSET_NOT_APPROVED
AUDIO_VERSION_CONFLICT
AUDIO_ATTEMPT_CONFLICT
AUDIO_REVIEW_CONFLICT
AUDIO_PRESET_UNAVAILABLE
```

最终列表由设计裁决，不建第二套 envelope。

## 29. Implementation Plan

最终生成：

```text
docs/docs/development/v2/07-audio/AUDIO_IMPLEMENTATION_PLAN.md
```

建议任务链：

```text
AUD-00 Design Freeze
AUD-01 Module Skeleton / Types
AUD-02 Repositories
AUD-03 Content / Asset / Operations Adapters
AUD-04 Slot Management
AUD-05 Task Lifecycle
AUD-06 TTS Attempt Worker
AUD-07 Human Recording Flow
AUD-08 Asset Versioning
AUD-09 Review
AUD-10 Publish / Official Resolution
AUD-11 Successor / Regeneration
AUD-12 Batch / Preset
AUD-13 Public Contract
AUD-14 Admin/Workbench API
AUD-15 Worker/Integration E2E
AUD-16 Security/Race
AUD-17 Final Audit / Report / Exit Gate
```

最终编号以设计结果为准。

每项至少：Goal / Scope / Dependencies / Files / Tests / Audit / Gate。

## 30. Canonical Docs

最终应生成/更新：

```text
AUDIO_PRODUCT_SEMANTICS.md
AUDIO_USE_CASES.md
AUDIO_PRODUCTION_CONTRACTS.md
AUDIO_API.md
AUDIO_PUBLIC_CONTRACTS.md
AUDIO_IMPLEMENTATION_PLAN.md
AUDIO_DESIGN_AUDIT.md
```

避免重复权威。

## 31. Design Audit

独立审计：

```text
0600_audio.sql ↔ product semantics
Content boundary
Asset boundary
Operations boundary
Slot/task/attempt state machines
human/TTS source invariants
review append-only history
publish transactionality
idempotency
worker recovery
batch/preset semantics
public/API contract
Admin workbench readiness
concurrency
```

重点找：

```text
revived old tts_jobs design
storage metadata duplication
cross-domain SQL/FK
Task/Attempt confusion
review history overwrite
published stale revision
multiple active Task race
cross-slot official asset pointer
implicit admin auth
unbounded worker retry
Event Sourcing creep
Redis/Kafka premature infrastructure
```

Severity：BLOCKER/HIGH/MEDIUM/LOW。

## 32. Design Gate

只有：

```text
BLOCKER = 0
HIGH = 0
Unresolved product decisions = 0
Database contract conflicts = 0
```

才允许：

```text
AUDIO_DESIGN_GATE = PASS
```

否则 FAIL，不强行进入开发。

## 33. Hard Stop

本设计会话不要：

```text
start Audio implementation
modify frozen migrations
build Admin UI
modify Content internals
implement Learning
add Audio table
add Redis/Kafka/message broker
```

Design Gate 后 STOP。

## 34. Final Response

```text
AUDIO DESIGN RESULT
Repository commit = ...
Frozen tables = 9
Slot Semantics = FROZEN/BLOCKED
Task Lifecycle = FROZEN/BLOCKED
TTS Contract = FROZEN/BLOCKED
Human Recording = FROZEN/BLOCKED
Asset Version = FROZEN/BLOCKED
Review = FROZEN/BLOCKED
Publish = FROZEN/BLOCKED
Batch/Preset = FROZEN/BLOCKED
Content Boundary = PASS/FAIL
Asset Boundary = PASS/FAIL
Operations Boundary = PASS/FAIL
Public Contract = FROZEN/BLOCKED
API Contract = FROZEN/BLOCKED
Required/Deferred/Not Supported = ?/?/?
Outbox decision = ...
Worker decision = ...
BLOCKER/HIGH/MEDIUM/LOW = ...
AUDIO_DESIGN_GATE = PASS/FAIL
```

列出 canonical docs、Implementation Plan、TECH_DEBT、implementation dependencies，然后 STOP。
