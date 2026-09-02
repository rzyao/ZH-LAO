# Research & Technical Decisions: 老挝语字母内容管理 (Lao Alphabet Management)

**Feature Branch**: `002-lao-alphabet-management` | **Date**: 2026-09-02 | **Spec**: [spec.md](./spec.md)

本文档记录 Phase 0 技术决策、架构约束与设计依据。严格遵守项目宪法（Constitution Principles I–XI），所有决策均锚定自现有的冻结数据库迁移（`0400_content.sql`, `0600_audio.sql`, `1240_content_revision.sql`）、已审计领域事实（`domains/content/alphabet.md`, `decisions/alphabet-decisions.md`, `versioning-review.md`, `audio-binding.md`）、已接受 ADR（ADR-004, ADR-006, ADR-020, ADR-021）以及现有工程事实。

---

## 架构分析重点解答

### 1. 当前系统是否已有 Content Domain 架构支持 LaoCharacter？
**答：有。**
- **实体注册机制 (ADR-004)**：物理表 `content.contents`（`0400_content.sql`）已统一建立 `content_type = 'lo_letter'`，并由专用表 `content.lo_letters` 承载字母专有属性（`character`, `letter_type`, `letter_class`, `name`, `romanization`, `sort_order`）。
- **不可变版本治理 (1240_content_revision.sql)**：`content.content_revisions` 统一支持 `entity_type = 'content'` 的多版本修订快照（`snapshot` JSONB）、`draft / published / superseded` 状态机流转与 `published_at` 冻结。
- **音频槽位模型 (0600_audio.sql / ADR-020)**：`audio.audio_slots` 严格支持以 `(source_domain='content', content_entity_type='lo_letter', content_entity_id, language_code='lo', audio_role='pronunciation')` 定位单槽发音。

### 2. 能力划分与跨端职责边界
- **Backend Domain (`apps/backend`)**:
  - `LaoCharacter` 聚合根生命周期与不可变修订（`LaoCharacterRevision`）版本管理。
  - 严格校验 Unicode 码点唯一性（`utf8mb4_bin` 精确比对）。
  - 分类（`consonant`/`vowel`/`symbol`）与正字法子分类（`cons_*`, `vowel_*`, `symbol_*`）业务规则校验。
  - 基于发音要素生成 `audio_input_hash`，并与 `AudioRolePolicy` 联动建槽或标记失效。
  - 提供 Admin 管理 CRUD、提交审核、审核通过/驳回、原子发布接口。
  - 提供 C 端（Mobile/H5）多重可见性守卫过滤的高性能缓存查询接口。
- **Admin Content Management (`apps/admin`)**:
  - 提供老挝文字母录入与多维属性维护工作台（分类选择、IPA 音标、教学说明、组内 `sort_order` 排序维护）。
  - 修订版本对比与 Active Work Guard 守卫状态展示。
  - 审核工作台（审核通过、驳回批注录入、正式发布触发）。
- **Mobile Learning Consumption (`apps/mobile`)**:
  - 字母表标准视图展示（辅音 27 组、元音 30 组、符号组），按 `sort_order` 升序渲染。
  - 字母详情与发音交互：结合 Audio 投影契约播放流媒体音频（无有效音频时优雅降级为静音态）。

### 3. 是否复用已有架构资产？
**答：完全复用。**
- **复用 Content Versioning**: 复用 `content.content_revisions`（`1240_content_revision.sql`）作为不可变版本存储与状态机物理承载。
- **复用 Review Workflow**: 复用 `versioning-review.md` 规范的审核流与状态机（`Draft` $\to$ `Pending Review` $\to$ `Approved` $\to$ `Published` $\to$ `Superseded`）。
- **复用 Audio Binding Policy**: 严格依循 `audio-binding.md`、ADR-020 与 `0600_audio.sql` 的音频白名单、输入哈希联动（`audio_input_hash`）与 C 端投影守卫。

### 4. 是否需要新增 ADR？
**答：不需要。**
- 现有的 `ADR-004`（Learning Content Registry）、`ADR-006`（Content Lifecycle 不物理删除）、`ADR-018`（全局数据库设计原则）、`ADR-020`（Audio Production 独立成域）以及 `ADR-021`（Content 与 Learning 拆分）已经完整覆盖并冻结了本 Feature 所需的全部架构决策。

---

## 技术决策清单

### 决策 1: 字母数据持久化与版本快照映射
- **Decision**: 字母基本元数据与当前正式发布态映射至 `content.contents` + `content.lo_letters`，不可变修订历史统一持久化于 `content.content_revisions`。
- **Rationale**:
  1. 符合 ADR-004 及物理迁移 `0400_content.sql` 与 `1240_content_revision.sql`。
  2. `content.contents` 维护 `status = 'active'`（对应领域 `online`）或 `'disabled'`（对应 `offline`），`content_type = 'lo_letter'`。
  3. `content.lo_letters` 存储当前正式生效的 `character`, `letter_type`, `letter_class`, `name`, `romanization`, `sort_order`。
  4. `content.content_revisions` 存储 `snapshot`（包含完整 payload：unicode, classification, subtype, ipa_phonetic, description, sort_order, no_audio, audio_input_hash）。

---

### 决策 2: 字母音频槽位策略与无音频门禁 (Audio Slot Policy & Gate)
- **Decision**: 
  - 当字母分类为 `consonant` 或 `vowel` 时，发音属性标记为 `no_audio = false`，通过 Domain Service 确保在 `audio.audio_slots` 中存在唯一的 `lo/pronunciation` 槽位，并写入由 `(unicode_char + ipa_phonetic)` 计算出的 SHA-256 `audio_input_hash`。
  - 当字母分类为 `symbol` 时，强制 `no_audio = true`，绝对不向 `audio.audio_slots` 发起建槽或生产任务。
- **Rationale**: 严格依循 `alphabet-decisions.md` (Decision A1) 与 `audio-binding.md` §1.1 白名单契约。

---

### 决策 3: C 端查询多重可见性守卫 (Visibility Guard)
- **Decision**: 客户端公开接口仅查询同时满足 `contents.status = 'active'` 且存在 `content_revisions.status = 'published'` 的字母。
- **Rationale**: 杜绝草稿（Draft）、待审（Pending Review）或已下线内容被学习端读取，确保 C 端呈现 100% 官方正式教学数据。

---

### 决策 4: 冲突与风险分析 (Conflict & Drift Verification)
- **Conflict Status**: **NO CONFLICT (无冲突)**。
- **审查确认**:
  - `spec.md` 中的所有需求（FR-001 ~ FR-009, SC-001 ~ SC-006）与 `docs/docs/developer/reference/domains/content/alphabet.md`、`alphabet-decisions.md` 及物理迁移完全吻合，无需变更已冻结 schema。
