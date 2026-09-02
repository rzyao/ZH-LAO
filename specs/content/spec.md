# Canonical Spec: Content

> **Status**: CANONICAL (baseline) | **Maintained by**: Product Forge spec-merge
> **Last merged**: 2026-09-02
> **Source**: specs/002-lao-alphabet-management (merged as initial baseline)
> This is the living source of truth for how the Content domain behaves NOW.
> Deltas from future features/change-requests are merged here.

## Overview

Content domain owns canonical teaching content — what users learn. This includes
language knowledge (alphabet, syllables, vocabulary, sentences), curriculum
structure, dictionaries, practice definitions, pronunciation knowledge attributes,
content revision & publishing. This canonical spec currently covers the
**LaoCharacter (alphabet) management** baseline (merged from 002-lao-alphabet-management).

> Note: FR-007 crosses into the Audio domain (audio slot policy + input hash
> linkage). The audio *production* facts (Task/Asset Version/Review/Publish) are
> owned by the Audio domain; this FR states the content-side slot strategy and
> stale-linkage behavior. A future `specs/audio/spec.md` will carry audio-side
> canonical requirements.

Canonical fact owners:
- `content.contents`, `content.lo_letters`, `content.lo_syllables`, `content.zh_pinyin`, ... — `database/migrations/0400_content.sql`
- `content.content_revisions` — `database/migrations/1240_content_revision.sql`

## Functional Requirements

### FR-001: Unicode unique character
系统必须支持录入原生老挝文字符，存储与唯一性校验必须遵循 Unicode 码点级精确匹配（`utf8mb4_bin` 规则），禁止忽略声调、变音符或空格进行模糊匹配，全局唯一约束字母本体。

### FR-002: Character classification
系统必须支持三大核心大分类的管理：辅音（`consonant`）、元音（`vowel`）、符号（`symbol`），分类一经确定在同一生命周期内不可随意跨大类变更。

### FR-003: Subtype management
系统必须支持基于正字法与声调特征的子分类（`subtype`）管理：
- 辅音细分：中音组辅音（`cons_middle`）、高音组辅音（`cons_high`）、低音组辅音（`cons_low`）；
- 元音细分：短元音（`vowel_short`）、长元音（`vowel_long`）；
- 符号细分：声调符号（`symbol_tone`）、连字符/复合符号（`symbol_ligature`）、重复符号（`symbol_repeat`）、特殊符号（`symbol_special`）、其他标记（`symbol_other`）。

### FR-004: IPA phonetic & description
系统必须支持维护国际音标（IPA）转写及语言学/教学描述信息；声调符号及无独立发音符号的音标必须标准标记为 `-`。

### FR-005: no_audio symbol rule
系统必须强制实施发音属性门禁：所有 `consonant` 与 `vowel` 分类条目默认 `no_audio = false`；所有 `symbol` 分类条目强制锁定 `no_audio = true`，禁止向符号类实体分派独立音频录制任务。

### FR-006: sort_order display & learning order
系统必须支持为每个字母配置独立的组内整型排序字段 `sort_order`，支持教研团队在不破坏 Unicode 码点与语言学结构的前提下灵活调整展示和推荐学习推进顺序。

### FR-007: Audio Slot policy & hash linkage
系统必须为 `no_audio = false` 的字母自动分配且仅分配 1 个老挝语发音槽位（`lo/pronunciation`）；基于字符本体与 IPA 音标计算 SHA-256 输入哈希（`audio_input_hash`），在发音要素变更时自动联动将历史音频置为陈旧（`stale`）。
> Cross-domain: audio production facts owned by Audio domain; this FR states the content-side slot strategy and stale-linkage behavior.

### FR-008: Immutable revision & review-publish lifecycle
系统必须为 `LaoCharacter` 实施不可变版本模型（`LaoCharacterRevision`），严格支持 `Draft` → `Pending Review` → `Approved` → `Published` → `Superseded` 状态机；支持驳回（`Rejected`）；已发布版本严禁原地修改，修改必须克隆派生新 Working Revision，并遵循 Active Work Guard 守卫。

### FR-009: C-end multi visibility guard
客户端查询接口必须应用多重可见性过滤：仅当实体未软删除（`online_status != 'deleted'`）、处于上线状态（`online_status == 'online'`）且具有合法的 `published_revision_id` 时对外可见；仅当关联音频资产审核通过且哈希一致时投影真实播放地址。

## Key Entities

- **LaoCharacter (字母主实体)**:
  - 核心属性：`id`（业务唯一标识）、`unicode_char`（老挝文原生字符）、`classification`（大类：consonant/vowel/symbol）、`subtype`（子分类）、`sort_order`（组内排序序号）、`no_audio`（无音频标志）、`online_status`（上线状态：online/offline/deleted）、`published_revision_id`（当前正式发布修订指针）、`working_revision_id`（当前活动工作版本指针）。
- **LaoCharacterRevision (字母不可变修订版本)**:
  - 核心属性：`id`、`character_id`、`revision_no`（版本号，单调自增）、`unicode_char`、`ipa_phonetic`（IPA 音标）、`description`（教学说明）、`audio_input_hash`（发音输入 SHA-256 哈希）、`review_status`（审核状态：draft/pending_review/approved/published/rejected/superseded）、`review_remark`（审核意见）、`lock_version`（乐观锁版本号）、`created_by`、`reviewed_by`。

## State Machines

### State Machine: LaoCharacterRevision Lifecycle

- **States**: `Draft`, `Pending Review`, `Rejected`, `Approved`, `Published`, `Superseded`
- **Initial**: `Draft`
- **Terminal**: `Superseded`
- **Owning FR**: FR-008

#### 1. 合法状态流转矩阵 (Legal Transitions)

| Current State (From) | Target State (To) | Guard Condition (守卫条件) | Event / Action |
| :--- | :--- | :--- | :--- |
| *(None)* | `Draft` | 提供了合法的 Unicode 字符与分类元数据 | `CREATE_REVISION` (新建或克隆派生) |
| `Draft` | `Pending Review` | 必填字段完整（字符、分类、IPA、排序号）；符合 Active Work Guard | `SUBMIT_FOR_REVIEW` (提交审核) |
| `Pending Review` | `Approved` | 审核员具备审核权限；字符分类与 IPA 音标无误 | `APPROVE` (审核通过) |
| `Pending Review` | `Rejected` | 附带非空的驳回原因说明（`review_remark`） | `REJECT` (审核驳回) |
| `Rejected` | `Draft` | 编辑人重新修改内容并保存 | `RE_EDIT` (重新编辑) |
| `Approved` | `Published` | 审核员或管理员触发发布；事务内原子更新指针 | `PUBLISH` (正式发布上线) |
| `Approved` | `Draft` | 撤回已通过的待发布版本以进行补充修改 | `REVOKE_APPROVAL` (撤回通过) |
| `Published` | `Superseded` | 后继新修订版本成功执行 `PUBLISH` | `SUPERSEDE` (新版发布自动归档) |

#### 2. 禁止的非法流转 (Illegal Transitions)

- ❌ 严禁 `Draft` → `Published`（禁止绕过审核直接发布）。
- ❌ 严禁 `Draft` → `Approved`（禁止未提交直接标记通过）。
- ❌ 严禁 `Rejected` → `Published`（已驳回内容绝对不可上线）。
- ❌ 严禁 `Published` → `Draft` / `Pending Review`（已发布版本不可逆流转，必须派生新版本）。
- ❌ 严禁 `Superseded` → 任何状态（终态归档历史版本物理冻结，不可复活）。

## Contract References

### Contract: Alphabet Domain Model & Principles
- **Path**: `docs/docs/developer/reference/domains/content/alphabet.md`
- **Kind**: `markdown`
- **Symbol**: `LaoCharacter`, `cons_*`, `vowel_*`, `symbol_*`, `Rule 4404`
- **Notes**: 约束字符原子性、三大分类与细分子分类语义、IPA 音标标准及 Unicode 精确比较规则。

### Contract: Alphabet Inventory & Learning Sequence Decisions
- **Path**: `docs/docs/developer/reference/domains/content/decisions/alphabet-decisions.md`
- **Kind**: `markdown`
- **Symbol**: `Decision A1`, `Decision A2`, `RULE-ALPHA-01` ~ `RULE-ALPHA-04`
- **Notes**: 约束 68 项字符纳管范围、符号类 `no_audio = true` 强制策略及 `sort_order` 解耦规则。

### Contract: Content Versioning & Review State Machine
- **Path**: `docs/docs/developer/reference/domains/content/versioning-review.md`
- **Kind**: `markdown`
- **Symbol**: `Immutable Content Revision`, `Active Work Guard`, `Published Pointer`, `Visibility Guard`
- **Notes**: 约束不可变修订版本流转、正式指针原子切换、乐观锁及 C 端可见性守卫。

### Contract: Audio Binding & Input Hash Policy
- **Path**: `docs/docs/developer/reference/domains/content/audio-binding.md`
- **Kind**: `markdown`
- **Symbol**: `Audio Slot Policy`, `audio_input_hash`, `lo/pronunciation`, `Stale Invalidation`
- **Notes**: 约束 6 类白名单建槽策略、输入哈希联动失效机制及 C 端音频播放投影规则。

## Success Criteria

- **SC-001 (发布数据可查率)**: 100% 处于 `Published` 状态且 `online_status == 'online'` 的字母能够被客户端精确查询并按「大分类 + `sort_order`」升序正确展示。
- **SC-002 (草稿零泄露)**: 0% 的未发布数据（`Draft` / `Pending Review` / `Rejected` / `offline`）能够穿透 C 端接口被学习者感知。
- **SC-003 (Unicode 冲突 100% 拦截)**: 录入重复 Unicode 老挝文字符时的系统拦截成功率达到 100%，杜绝同码点重复数据建档。
- **SC-004 (不可变性保证)**: 对已发布的历史版本执行直接写操作的拦截率为 100%，版本修改必须 100% 通过克隆派生工作版本完成。
- **SC-005 (音频白名单合规率)**: 符号类字符（`symbol`）拥有发音槽位的数量严格为 0；辅音/元音字符拥有的发音槽位数量严格为 1。
- **SC-006 (陈旧音频拦截率)**: 文本/IPA 发生变更后，旧音频资产的陈旧标记（`stale`）置位与 C 端音频屏蔽生效准确率达到 100%。

## Known Drift (spec/code vs database schema)

> **Recorded during initial baseline merge (2026-09-02).** This is a known
> divergence between the domain model implemented in code (and described here)
> and the frozen database schema. It is recorded for honesty, not resolved here.

| Dimension | Code / Spec (this file) | Database (`content.lo_letters`) |
| --- | --- | --- |
| Entity | `LaoCharacter` (domain object) | `content.lo_letters` table |
| Classification | `classification`: consonant/vowel/**symbol** | `letter_type`: consonant/vowel/**tone_mark**/other |
| Extra fields | `noAudio`, `onlineStatus`, `publishedRevisionId`, `workingRevisionId` | not present in table |
| Uniqueness | Unicode + classification/subtype | `UNIQUE(character, letter_type)` |

- The code repository (backend repository) actually operates `content.lo_letters`, mapping to the `LaoCharacter` domain model.
- The alphabet feature page self-documents this as a risk: "数据库基线的 `lo_letters` 与新实体/Spec 的字段语义需要在实现 Gate 前完成逐字段核验" (`features/lao-alphabet-management.md`).
- **Resolution status**: OPEN — to be reconciled before the Content implementation Gate.

## Change Log

| Date | Source | FR-* Added | FR-* Modified | FR-* Removed |
| --- | --- | --- | --- | --- |
| 2026-09-02 | 002-lao-alphabet-management (initial baseline) | FR-001 ~ FR-009 | — | — |
