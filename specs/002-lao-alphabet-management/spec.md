# Feature Specification: 老挝语字母内容管理 (Lao Alphabet Management)

**Feature Branch**: `002-lao-alphabet-management`

**Created**: 2026-09-02

**Status**: Draft

**Input**: User description: "Lao Alphabet Domain 规范落地与 LaoCharacter 内容管理功能规范（含字符分类、Unicode 唯一性、IPA 音标、音频槽位绑定、不可变版本修订与审核发布生命周期）"

---

## 1. User Scenarios & Testing *(mandatory)*

### User Story 1 - 内容管理员创建与维护 LaoCharacter (Priority: P1)

作为一名教研内容管理员，我希望在管理控制台中录入和维护老挝文字母（辅音、元音、声调符号及其他正字法标记），精确指定 Unicode 字符、分类体系、IPA 音标、展示排序并配置发音属性，以便为老挝语教学建立标准、权威的基础字符库。

**Why this priority**: 字母（`LaoCharacter`）是老挝语内容体系的最底层叶子节点，音节、词汇与课程均严格构建于其上。没有完整的字母元数据与录入维护能力，后续音节拼读、正字法校验与课程体系均无法启动。

**Independent Test**: 内容管理员可录入一个合法的老挝文字符（如中辅音 `ກ`、短元音 `ະ` 或声调符号 `່`），系统准确校验分类与 Unicode 码点唯一性，生成初始 `Draft` 状态的修订版本，并正确初始化音频槽位绑定规则。

**Acceptance Scenarios**:

1. **Given** 管理员录入一个新的老挝语辅音（如 `ກ`），**When** 提交大类 `consonant`、子分类 `cons_middle`、IPA 音标 `/k/`、发音说明与组内排序号 `sort_order = 1`，**Then** 系统创建 `LaoCharacter` 实体及首个 `Draft` 修订版本，发音属性标记为 `no_audio = false`，并自动按白名单策略初始化 `lo/pronunciation` 单发音槽位。
2. **Given** 管理员录入一个声调符号或其他正字法标记（如声调符 `່` 或连字符 `ຼ`），**When** 提交大类 `tone_mark` 或 `other`、对应子类（如 `symbol_tone` / `symbol_ligature`）且 IPA 标记为 `-`，**Then** 系统创建 `LaoCharacter` 实体，发音属性强制设为 `no_audio = true`，且不创建音频生产槽位。
3. **Given** 已经存在已发布字母，**When** 管理员需要修改其教学说明或组内展示排序号 `sort_order`，**Then** 系统在 Active Work Guard 守卫下基于当前已发布版本克隆派生一个新的 `Draft` 工作版本，原发布版本保持线上稳定。

---

### User Story 2 - 审核员审核字母内容并原子发布 (Priority: P2)

作为一名教学审核员，我希望对提交审核的字母修订版本进行语言学合规性与发音质量审查，执行审核通过、驳回或正式发布上线操作，以便确保交付给学习者的字符内容 100% 权威无误。

**Why this priority**: 依据 ADR-003 不可变版本模型，已发布内容永久冻结。审核与发布生命周期是保障教学数据质量、防止未经核验的草稿泄露到 C 端的绝对安全防线。

**Independent Test**: 审核员可将 `Pending Review` 状态的字母版本执行审核操作（通过/驳回），并在满足音频有效性要求的前提下执行正式发布，系统在单个数据库事务内原子切换 `published_revision_id` 指针并固化版本快照。

**Acceptance Scenarios**:

1. **Given** 处于 `Pending Review` 状态的字母修订版本，**When** 审核员核验发现音标或分类存在笔误并执行驳回（附带驳回原因 `review_remark`），**Then** 该版本状态流转为 `Rejected`，解除审核锁定，管理员可基于此版本重新编辑并重新提交。
2. **Given** 处于 `Approved` 状态的字母修订版本，**When** 审核员执行正式发布（带 `Idempotency-Key`），**Then** 系统在单个事务中将修订版本置为 `Published`，原子更新实体主表的 `published_revision_id`，若存在旧发布版本则将其归档为 `Superseded`，并广播版本发布领域事件。
3. **Given** 某个需要发音的辅音/元音处于 `Approved` 状态但其关联的 `lo/pronunciation` 音频资产尚未审核通过，**When** 尝试执行发布，**Then** 系统允许字母本体发布，但 C 端播放投影守卫自动将音频地址置空，确保不播放未审核或缺失的音频。

---

### User Story 3 - 学习者查看已发布字母学习库 (Priority: P3)

作为一名老挝语学习者，我希望在客户端查阅标准字母表，按辅音、元音、声调符号及其他标记结构化浏览字母、音标、分类及播放标准真人发音，以便掌握老挝语基础字母发音与拼写。

**Why this priority**: C 端学习者消费是字母内容生产的最终价值体现，必须在严格的多重可见性守卫过滤下提供标准字典序的字母列表与发音播放。

**Independent Test**: 学习者在移动端或 H5 请求字母表数据，系统仅返回已发布（`Published`）且已上线（`online`）的字母，按照「辅音 $\to$ 元音 $\to$ 符号」及组内 `sort_order` 正确排序，且仅对拥有有效音频的条目投影真实音频播放地址。

**Acceptance Scenarios**:

1. **Given** 客户端请求老挝语字母表，**When** 执行数据查询，**Then** 系统应用 C 端多重可见性守卫，按分类结构（29 `consonant`、31 `vowel`、4 `tone_mark`、4 `other`）及 `sort_order` 升序返回已正式发布的字符列表，任何 `Draft`、`Pending Review` 或 `offline` 字符均被完全过滤。
2. **Given** 学习者点击某个已发布辅音（如 `ກ`）试听发音，**When** 请求发音详情，**Then** 仅当该条目 `no_audio == false` 且正式音频资产处于 `valid` 且 `approved` 状态时，返回有效流媒体音频播放地址；对于符号类条目（`no_audio == true`）明确返回无音频标记。

---

### Edge Cases

1. **Unicode 字符冲突与多重码点查重**：
   - 当管理员录入已存在的 Unicode 字符（使用二进制码点精确比对，`utf8mb4_bin` 排序规则）时，系统立即拒绝并返回冲突错误，杜绝同音/形似字符重复建档。
2. **已发布内容防原地修改（Immutable Violation）**：
   - 任何针对处于 `Published` 或 `Superseded` 状态的历史版本的直接 UPDATE / DELETE 操作均被系统拒绝并抛出不可变安全违规异常。
3. **并发编辑分叉守卫（Active Work Guard）**：
   - 当某个字母已经存在一个处于 `Draft` 或 `Pending Review` 的工作版本时，若另一位管理员尝试再次基于发布版创建新修订，系统拒绝操作并提示已有进行中的活动工作版本。
4. **内容修改触发音频失效（Hash Invalidation）**：
   - 当字母新修订版本修改了 Unicode 字符本体或 IPA 音标时，重新计算的 `audio_input_hash` 与历史版本不一致，发布后系统自动将历史音频资产标记为 `stale`，直到新录制音频审核通过前，C 端自动优雅降级为静音展示。
5. **乐观锁并发冲突**：
   - 提交审核或发布时若携带的 `lock_version` 与当前版本不一致，操作被拒绝并要求刷新最新状态。

---

## 2. Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (Unicode 唯一字符)**: 系统必须支持录入原生老挝文字符，存储与唯一性校验必须遵循 Unicode 码点级精确匹配（`utf8mb4_bin` 规则），禁止忽略声调、变音符或空格进行模糊匹配，全局唯一约束字母本体。
- **FR-002 (字母大分类体系)**: 系统必须支持冻结物理大分类的管理：辅音（`consonant`）、元音（`vowel`）、声调符号（`tone_mark`）与其他正字法标记（`other`），分类一经确定在同一生命周期内不可随意跨大类变更。
- **FR-003 (子分类细化管理)**: 系统必须支持基于正字法与声调特征的子分类（`subtype`）管理：
  - 辅音细分：中音组辅音（`cons_middle`）、高音组辅音（`cons_high`）、低音组辅音（`cons_low`）；
  - 元音细分：短元音（`vowel_short`）、长元音（`vowel_long`）；
  - 声调/其他标记细分：声调符号（`symbol_tone`）、连字符/复合符号（`symbol_ligature`）、重复符号（`symbol_repeat`）、特殊符号（`symbol_special`）、其他标记（`symbol_other`）。
- **FR-004 (IPA 音标与描述维护)**: 系统必须支持维护国际音标（IPA）转写及语言学/教学描述信息；声调符号及无独立发音符号的音标必须标准标记为 `-`。
- **FR-005 (no_audio 非发音标记规则)**: 系统必须强制实施发音属性门禁：所有 `consonant` 与 `vowel` 分类条目默认 `no_audio = false`；所有 `tone_mark` 与 `other` 条目强制锁定 `no_audio = true`，禁止分派独立音频录制任务。
- **FR-006 (sort_order 展示与学习序)**: 系统必须支持为每个字母配置独立的组内整型排序字段 `sort_order`，支持教研团队在不破坏 Unicode 码点与语言学结构的前提下灵活调整展示和推荐学习推进顺序。
- **FR-007 (Audio Slot 策略与哈希联动)**: 系统必须为 `no_audio = false` 的字母自动分配且仅分配 1 个老挝语发音槽位（`lo/pronunciation`）；基于字符本体与 IPA 音标计算 SHA-256 输入哈希（`audio_input_hash`），在发音要素变更时自动联动将历史音频置为陈旧（`stale`）。
- **FR-008 (不可变修订版本与审核发布生命周期)**: 系统必须为 `LaoCharacter` 实施不可变版本模型（`LaoCharacterRevision`），严格支持 `Draft` $\to$ `Pending Review` $\to$ `Approved` $\to$ `Published` $\to$ `Superseded` 状态机；支持驳回（`Rejected`）；已发布版本严禁原地修改，修改必须克隆派生新 Working Revision，并遵循 Active Work Guard 守卫。
- **FR-009 (C 端多重可见性守卫)**: 客户端查询接口必须应用多重可见性过滤：仅当实体未软删除（`online_status != 'deleted'`）、处于上线状态（`online_status == 'online'`）且具有合法的 `published_revision_id` 时对外可见；仅当关联音频资产审核通过且哈希一致时投影真实播放地址。

---

### Key Entities

- **LaoCharacter (字母主实体)**:
  - 核心属性：`id`（业务唯一标识）、`unicode_char`（老挝文原生字符）、`classification`（大类：consonant/vowel/tone_mark/other）、`subtype`（子分类）、`sort_order`（组内排序序号）、`no_audio`（无音频标志）、`online_status`（上线状态：online/offline/deleted）、`published_revision_id`（当前正式发布修订指针）、`working_revision_id`（当前活动工作版本指针）。
- **LaoCharacterRevision (字母不可变修订版本)**:
  - 核心属性：`id`、`character_id`、`revision_no`（版本号，单调自增）、`unicode_char`、`ipa_phonetic`（IPA 音标）、`description`（教学说明）、`audio_input_hash`（发音输入 SHA-256 哈希）、`review_status`（审核状态：draft/pending_review/approved/published/rejected/superseded）、`review_remark`（审核意见）、`lock_version`（乐观锁版本号）、`created_by`、`reviewed_by`。

---

## 3. State Machines *(mandatory)*

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

- ❌ 严禁 `Draft` $\to$ `Published`（禁止绕过审核直接发布）。
- ❌ 严禁 `Draft` $\to$ `Approved`（禁止未提交直接标记通过）。
- ❌ 严禁 `Rejected` $\to$ `Published`（已驳回内容绝对不可上线）。
- ❌ 严禁 `Published` $\to$ `Draft` / `Pending Review`（已发布版本不可逆流转，必须派生新版本）。
- ❌ 严禁 `Superseded` $\to$ 任何状态（终态归档历史版本物理冻结，不可复活）。

---

## 4. Contract References

### Contract: Alphabet Domain Model & Principles
- **Path**: `docs/docs/developer/reference/domains/content/alphabet.md`
- **Kind**: `markdown`
- **Symbol**: `LaoCharacter`, `cons_*`, `vowel_*`, `symbol_*`, `Rule 4404`
- **Notes**: 约束字符原子性、三大分类与细分子分类语义、IPA 音标标准及 Unicode 精确比较规则。

### Contract: Alphabet Inventory & Learning Sequence Decisions
- **Path**: `docs/docs/developer/reference/domains/content/decisions/alphabet-decisions.md`
- **Kind**: `markdown`
- **Symbol**: `Decision A1`, `Decision A2`, `RULE-ALPHA-01` ~ `RULE-ALPHA-04`
- **Notes**: 约束 68 项字符纳管范围、`tone_mark` / `other` 的 `no_audio = true` 强制策略及 `sort_order` 解耦规则。

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

---

## 5. Traceability

| Requirement | Domain Source Reference | User Story / Use Case | Acceptance Scenario | State Machine Transition |
| :--- | :--- | :--- | :--- | :--- |
| **FR-001** (Unicode 唯一性) | `alphabet.md` §1.2 | US-001 (P1) | US-001 AS-1, Edge Case 1 | N/A (Entity Level Constraint) |
| **FR-002** (三大分类体系) | `alphabet.md` §2.1 | US-001 (P1) | US-001 AS-1, AS-2 | `CREATE_REVISION` |
| **FR-003** (Subtype 细分子类) | `alphabet.md` §2.2 | US-001 (P1) | US-001 AS-1, AS-2 | `CREATE_REVISION` |
| **FR-004** (IPA 音标管理) | `alphabet.md` §1.2, §3.2 | US-001 (P1) | US-001 AS-1, AS-2 | `CREATE_REVISION` / `SUBMIT` |
| **FR-005** (no_audio 符号规则) | `alphabet-decisions.md` (A1) | US-001 (P1) | US-001 AS-2 | `CREATE_REVISION` |
| **FR-006** (sort_order 展示序) | `alphabet-decisions.md` (A2) | US-001 (P1), US-003 (P3) | US-001 AS-1, US-003 AS-1 | `CREATE_REVISION` |
| **FR-007** (Audio Slot & Hash) | `audio-binding.md` §1.1, §3.1 | US-001 (P1), US-002 (P2) | US-001 AS-1, Edge Case 4 | `PUBLISH` (Trigger Hash Guard) |
| **FR-008** (不可变版本与生命周期) | `versioning-review.md` §1~§3 | US-001 (P1), US-002 (P2) | US-001 AS-3, US-002 AS-1~AS-3 | `Draft` $\to$ `Published` 全流转 |
| **FR-009** (C 端多重可见性守卫) | `versioning-review.md` §4 | US-003 (P3) | US-003 AS-1, AS-2 | Filter (`published_revision_id`) |

---

## 6. Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001 (发布数据可查率)**: 100% 处于 `Published` 状态且 `online_status == 'online'` 的字母能够被客户端精确查询并按「大分类 + `sort_order`」升序正确展示。
- **SC-002 (草稿零泄露)**: 0% 的未发布数据（`Draft` / `Pending Review` / `Rejected` / `offline`）能够穿透 C 端接口被学习者感知。
- **SC-003 (Unicode 冲突 100% 拦截)**: 录入重复 Unicode 老挝文字符时的系统拦截成功率达到 100%，杜绝同码点重复数据建档。
- **SC-004 (不可变性保证)**: 对已发布的历史版本执行直接写操作的拦截率为 100%，版本修改必须 100% 通过克隆派生工作版本完成。
- **SC-005 (音频白名单合规率)**: `tone_mark` 与 `other` 字符拥有发音槽位的数量严格为 0；辅音/元音字符拥有的发音槽位数量严格为 1。
- **SC-006 (陈旧音频拦截率)**: 文本/IPA 发生变更后，旧音频资产的陈旧标记（`stale`）置位与 C 端音频屏蔽生效准确率达到 100%。

---

## 7. Assumptions

- **语言学标准**: 辅音与元音分类遵循老挝语国家官方正字法标准字典序，存量 68 项字符涵盖老挝语基础拼写所需的全部字符集。
- **操作权限**: 内容录入（Admin/Editor）、审核通过与驳回（Reviewer）、正式发布（Publisher/Admin）受后台 RBAC 权限体系严格管控。
- **资产托管**: 音频实际物理二进制文件的存储与降噪编码由外部 Media/Asset 服务统一托管，本 Feature 仅负责槽位策略绑定与有效性状态联动。
- **幂等机制**: 关键写操作依赖客户端或管理后台在 Header 中携带 `Idempotency-Key` 以防止网络抖动导致的重复提交。
