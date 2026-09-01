---
status: ready
phase: 7
phase_name: Audio Production Domain
artifact: design_recovery_brief
recovery_only: true
implementation_started: false
last_updated: 2026-09-02
contaminated_commit: ab1d4ebe75e79283fc6fab7ca033ee87a9787843
trusted_brief_commit: f98127c421067875f5ae2a0cf4f56703240a17d1
lifecycle: historical
---

# ZH-LAO  — Audio Design Recovery Brief

> 本文件只用于 **Audio Design Recovery**。
>
> 新会话必须通过 GitHub 连接器读取远程仓库当前 `main` 的真实状态，然后清理一次已确认的错误设计产物，并重新基于正确的 frozen Audio Production contract 完成 Audio Design 与 `AUDIO_DESIGN_GATE`。
>
> **本任务不是 Audio Implementation。不得写 Audio backend/worker/Admin UI，不得修改 frozen migration。**

## 1. Recovery Mission

```text
Repository Re-Audit
→ Verify contamination boundary
→ Preserve trusted Audio authorities
→ Remove/quarantine contaminated design artifacts
→ Re-run Audio Product/Contract Design from trusted sources
→ Source-grounded Independent Audit
→ AUDIO_DESIGN_GATE
→ STOP
```

本次 Recovery 的目标不是比较两套 Audio 架构优劣，也不是重新裁决数据库。

当前已确认：此前 `AUDIO_DESIGN_GATE = FAIL` 的核心 DB conflict 建立在对 `AUDIO_DESIGN_BRIEF.md` 的错误引用上。Recovery 必须先恢复 source-of-truth，再重新设计和审计。

## 2. Mandatory GitHub Entry Audit

开始任何文件修改前，使用 GitHub 连接器连接：

```text
repository = rzyao/ZH-LAO
branch = main
```

必须读取：

```text
latest HEAD commit
MASTER_DEVELOPMENT_PLAN.md
DEVELOPMENT_PROGRESS.md
07-audio/AUDIO_DESIGN_BRIEF.md
database/migrations/0600_audio.sql
docs/docs/domains/audio/index.md
docs/docs/domains/audio/database.md
ADR-020 and relevant global DB/Asset ADRs
current Content public/revision contracts
current Operations public/RBAC contracts
current Asset Infrastructure contracts
current Admin Foundation contracts
```

并重新读取/比较：

```text
trusted brief commit:
f98127c421067875f5ae2a0cf4f56703240a17d1

audio contamination commit:
ab1d4ebe75e79283fc6fab7ca033ee87a9787843

contamination parent:
ea0c3f7a7c208aecb0502c52c93580a32184aa69
```

不要依赖本文件写入时的 HEAD；以执行时 current `main` 为准。

## 3. Confirmed Contamination Boundary

Git history 已确认 commit：

```text
ab1d4ebe75e79283fc6fab7ca033ee87a9787843
docs(audio): record blocked design gate
```

相对父 commit：

```text
ea0c3f7a7c208aecb0502c52c93580a32184aa69
```

该 commit 为：

```text
ahead_by = 1
files added = 12
additions = 526
deletions = 0
frozen migration modifications = 0
```

12 个新增文件全部属于本次 contamination set：

```text
AUDIO_ADMIN_WORKFLOW.md
AUDIO_ASSET_DELIVERY_CONTRACT.md
AUDIO_DATA_SCHEMA.md
AUDIO_DESIGN_GATE.md
AUDIO_DICTATION_STREAK_CONTRACT.md
AUDIO_ENTITLEMENT_VOICE_MATRIX.md
AUDIO_IMPLEMENTATION_CHECKLIST.md
AUDIO_MODERATION_REVIEW.md
AUDIO_PRODUCT_CONTRACT.md
AUDIO_QUOTA_BILLING_CONTRACT.md
AUDIO_TEST_MATRIX.md
AUDIO_TTS_PIPELINE.md
```

执行时必须再次用 GitHub compare/commit evidence 验证上述边界。

如果其中任一文件在 `ab1d4ebe...` 之后已经被合法的新 commit 修正，不能盲删；必须先比较后续 diff 并判断是否仍受污染。

## 4. Trusted Authority — Do Not Replace

以下为 Recovery 的 source-of-truth：

```text
1. database/migrations/0600_audio.sql
2. docs/docs/domains/audio/database.md
3. docs/docs/domains/audio/index.md
4. docs/docs/development/07-audio/AUDIO_DESIGN_BRIEF.md
5. current global architecture / ADR / Asset / Operations / Content public contracts
```

`AUDIO_DESIGN_BRIEF.md` 的 trusted introduction commit：

```text
f98127c421067875f5ae2a0cf4f56703240a17d1
```

Git history 已确认该 commit 只新增：

```text
docs/docs/development/07-audio/AUDIO_DESIGN_BRIEF.md
```

不要把它与 `ab1d4ebe...` 的 12 个污染文件一起删除或回滚。

## 5. Frozen Audio Physical Contract

Audio physical database authority 固定为：

```text
database/migrations/0600_audio.sql
```

Frozen core tables = exactly 9：

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

Recovery 必须保持：

```text
0600_audio.sql modifications = 0
Audio core table additions = 0
Audio core table removals = 0
Entry/Variant/Speech replacement model = rejected as unsourced contamination
pronunciation_audios / tts_jobs resurrection = forbidden
```

除非执行时 current `main` 已出现一个**明确、合法、后来的正式 architecture decision + forward migration**推翻上述 frozen contract，否则不得自行改变。

## 6. Known Invalid Findings to Re-audit

此前 contaminated `AUDIO_DESIGN_GATE.md` 中至少以下 finding 不能继承：

### Invalid Claim A — Brief requires Entry/Variant/Speech model

错误 claim：

```text
AUDIO_DESIGN_BRIEF requires:
audio_entries
audio_variants
speech_audio
+ six new tables
```

Recovery 必须 exact-search current `AUDIO_DESIGN_BRIEF.md`。

若这些要求不存在：

```text
DB_CONFLICT based on this claim = INVALID
AUDIO-DESIGN-B01 = REMOVE
```

### Invalid Claim B — Brief uses stale frontend/supabase paths

此前声称 Brief 指向：

```text
frontend/app/admin/**
frontend/features/admin/**
supabase/migrations/0600_audio.sql
v2/00-global
02-content-library
```

Recovery 必须 exact-search真实 Brief。

不存在则：

```text
AUDIO-DESIGN-H01 = INVALID
```

不得继续引用。

### Invalid Claim C — Content/Operations Gate automatically blocks Audio Design

正确区分：

```text
Audio Design may proceed in parallel
Audio Implementation must obey actual upstream final gates
```

因此 Content/Operations 尚未最终 PASS，如果属实，应记录为：

```text
implementation dependency
```

而不是自动作为 `AUDIO_DESIGN_GATE` 的 Design blocker，除非 current trusted Brief 明确规定相反。

执行时必须读取 current Content/Operations implementation reports/Gates，不能只根据 stale `DEVELOPMENT_PROGRESS.md` 判断事实状态。

## 7. Unsourced Requirement Rejection

此前 contamination package 引入的概念包括但不限于：

```text
audio_entries
audio_variants
speech_audio
audio_voice_profiles
audio_selected_variants
tts_billing_events
tts_quota_events
Plus 180s/day
Pro 1200s/month
subscription entitlement matrix
dictation_attempts as Audio design concern
listening_streaks as Audio design concern
Audio-specific feature flag exact key
route kill-switch exact key
Supabase-specific object path assumptions
```

Recovery 必须逐项执行 source test：

```text
Is this required by AUDIO_DESIGN_BRIEF?
OR frozen Audio docs/schema?
OR current global/Content/Operations/Asset contract?
```

如果答案都是 NO：

```text
UNSOURCED_REQUIREMENT
→ do not carry forward
→ do not use as Gate condition
```

不要因为某个概念“听起来合理”就继续保留。

## 8. Cleanup Procedure

### Step 1 — Re-verify each contaminated file

对 12 个文件逐个检查：

```text
origin commit
later modifications
trusted-source alignment
unsourced concepts
```

### Step 2 — Remove contaminated authority

如果文件仍然只来源于 `ab1d4ebe...` 且整体被错误 Spec 污染：

```text
delete it from current main
```

如果某文件存在可验证的正确内容，也不要把污染文件直接保留为 canonical；优先在重新设计阶段从 trusted sources 重新生成干净版本。

### Step 3 — Do not history-rewrite

禁止：

```text
force push
reset main backwards
rewrite Git history
edit old commit
```

使用正常 forward commits 删除/重建文档。

保留 Git 历史作为事故证据。

## 9. Re-run Correct Audio Design

清理后，重新严格执行 current：

```text
docs/docs/development/07-audio/AUDIO_DESIGN_BRIEF.md
```

必须围绕 frozen Audio Production 模型设计：

```text
Slot semantics
Task state machine
TTS generation attempts
Human recording
Asset versioning
Review append-only history
Publish / official pointer
Regeneration / successor tasks
Task events
Batch orchestration
Default preset mapping
Content revision/input freshness
Asset Infrastructure boundary
Operations RBAC/audit requirements
Admin production workbench requirements
Worker/idempotency/concurrency
Public/API contracts
Implementation Plan
Test Matrix
Independent Design Audit
```

不要重新创建 Entry/Variant/Speech、quota/billing、dictation/streak 体系。

## 10. Expected Canonical Design Package

不要机械恢复污染的 12 个文件名。

根据当前项目其他 Domain 的 canonical convention，优先生成最小、清晰、不重叠的 Audio design docs，例如：

```text
AUDIO_PRODUCT_SEMANTICS.md
AUDIO_USE_CASES.md
AUDIO_PRODUCTION_CONTRACTS.md
AUDIO_API.md
AUDIO_PUBLIC_CONTRACTS.md
AUDIO_IMPLEMENTATION_PLAN.md
AUDIO_DESIGN_AUDIT.md
```

如真实设计需要额外独立文档（例如 state machine / worker contract），可以增加，但必须说明为什么单独成文。

最终不要同时保留两套互相竞争的 canonical authority。

## 11. Grounding Gate — Mandatory

这是本次 Recovery 最重要的新增流程。

任何准备写入最终 Design Audit 的：

```text
BLOCKER
HIGH
DATABASE_CONTRACT_CONFLICT
DESIGN_CONTRACT_CONFLICT
UNRESOLVED_DECISION
```

必须执行以下二次验证：

```text
1. 标出 source file path
2. 标出 exact heading / table / field / statement
3. 重新 fetch current main 的 source file
4. exact-search finding 依赖的关键字符串/contract
5. 与 frozen migration/public contract cross-check
6. 保存 evidence
7. 才允许形成 finding
```

如果 finding 声称：

```text
"Brief requires X"
```

但 exact-search current Brief 找不到 X：

```text
finding = INVALID
不得进入 Gate severity count
```

任何 unsourced inference 都不得升级成数据库冲突。

## 12. Source Precedence

发生冲突时按以下顺序审计：

```text
1. current frozen physical migration
2. current frozen domain DB docs / accepted ADR
3. current Phase Design Brief
4. current upstream frozen public contracts
5. newly generated design documents
```

新生成的设计文档不能反过来推翻 1~4，除非任务本身明确授权 architecture change。

本 Recovery 没有该授权。

## 13. Upstream Gate Drift Handling

重新检查：

```text
OPERATIONS_GATE
CONTENT_GATE
LEARNING status
```

必须优先读取：

```text
actual implementation report
actual final audit/gate evidence
actual current code/tests
```

`DEVELOPMENT_PROGRESS.md` 如果落后于实际 Gate：

```text
DOCUMENTATION_DRIFT
```

这不等价于 implementation 未完成。

只有真实 upstream capability 缺失且 Audio **Implementation** 依赖它时，才记录 implementation blocker/dependency。

Audio Design 本身按 trusted Brief 的 Parallel Design Rule 判断。

## 14. Database Rule

本 Recovery：

```text
0600_audio.sql modifications = 0
historical migration rewrites = 0
new Audio migration = 0
```

如果正确设计真的发现 frozen schema 无法支撑 required contract：

```text
DATABASE_CONTRACT_CONFLICT
```

必须给出 source-grounded evidence，并在 Design Gate 中 STOP；本 Recovery 不自行添加 migration。

但不得再次使用已经证伪的 Entry/Variant/Speech claim 作为 DB conflict。

## 15. Final Independent Audit

最终至少审计：

```text
Frozen 9-table alignment
Slot/Task/Attempt/Asset/Review/Publish semantics
Content ownership boundary
Asset ownership boundary
Operations ownership boundary
TTS provider/config ownership
Human recording flow
Task state machine
Review/publish invariants
Revision/input freshness
Idempotency
Concurrency
Worker recovery
Batch semantics
Preset semantics
Admin workbench contract
Public/API contract
Internal UUID/BIGINT boundaries
No cross-domain SQL/FK
No unsourced requirements
No contaminated authority remaining
```

## 16. Design Gate

只有真实审计满足：

```text
BLOCKER = 0
HIGH = 0
UNRESOLVED_DECISIONS = 0
DATABASE_CONTRACT_CONFLICTS = 0
DESIGN_CONTRACT_CONFLICTS = 0
CONTAMINATED_CANONICAL_DOCS = 0
UNSOURCED_REQUIRED_CONTRACTS = 0
```

才能：

```text
AUDIO_DESIGN_GATE = PASS
AUDIO_IMPLEMENTATION_AUTHORIZED = according to actual upstream implementation gates
```

注意：

```text
AUDIO_DESIGN_GATE = PASS
```

不自动等于：

```text
AUDIO_IMPLEMENTATION may start immediately
```

Implementation 仍需满足 current Master Plan / implementation plan 的真实 upstream Gates。

## 17. Documentation Updates

只有在 Recovery 后得到真实 PASS 时，才更新：

```text
DEVELOPMENT_PROGRESS.md
相关 Master/phase status（若项目流程要求）
```

必须明确记录：

```text
previous failed gate at ab1d4ebe was invalidated by recovery
reason = source-grounding/spec contamination
frozen migration remained unchanged
```

不要删除 Git 历史，不要伪装事故从未发生。

## 18. Hard Stop / Scope

本 Recovery 不允许：

```text
Audio backend implementation
Audio worker implementation
Audio Admin React implementation
Content implementation
Operations implementation
Learning implementation
DB redesign
0600 migration edit
new Audio tables
subscription/billing product design
dictation/streak product design
feature flag invention
route kill-switch invention
```

Recovery + correct Design Gate 完成后 STOP。

## 19. Final Report Format

```text
AUDIO DESIGN RECOVERY RESULT

Repository HEAD before recovery = ...
Repository HEAD after recovery = ...
Trusted Brief = f98127c... / current verified equivalent
Contaminated commit = ab1d4ebe...
Contamination parent = ea0c3f7a...

Contaminated files audited = 12
Deleted/replaced = ...
Unexpected later legitimate edits preserved = ...

Frozen DB:
0600_audio.sql changes = 0
Core tables = 9
Slot/Task model = CONFIRMED/FAIL
Cross-domain FK = 0/...

Grounding:
Invalid prior B01 removed = YES/NO
Invalid prior H01 removed = YES/NO
Unsourced Entry/Variant/Speech requirements remaining = 0/...
Unsourced quota/billing/dictation/streak requirements remaining = 0/...

Canonical docs regenerated:
...

Upstream facts:
Operations Gate = ...
Content Gate = ...
Documentation drift = ...

Audit:
BLOCKER = ?
HIGH = ?
MEDIUM = ?
LOW = ?
UNRESOLVED_DECISIONS = ?
DATABASE_CONTRACT_CONFLICTS = ?
DESIGN_CONTRACT_CONFLICTS = ?
CONTAMINATED_CANONICAL_DOCS = ?

AUDIO_DESIGN_GATE = PASS/FAIL
AUDIO_IMPLEMENTATION = NOT_STARTED
```

完成后直接推送到 GitHub `main`，汇报实际 commit，然后 **STOP**。
