# ZH-LAO 产品考古研究报告

> **性质**：产品考古（product archaeology）—— 只建立产品事实，不提出代码修改建议。
> **日期**：2026-09-02
> **方法**：并行深挖 4 个方向（项目定位 / 文档体系 / Feature 架构与 Blueprint / 产品边界）+ 代码库真实状态核验 + Git 历史追溯。所有"实现/未实现"判断以代码、测试、CI 和数据库为证据，不采纳文档单方面声称。

---

## 一、项目定位与核心价值

### 1.1 产品是什么

**ZH-LAO 是面向中文用户和老挝语用户的双语学习与跨语言社交应用**（`docs/docs/developer/product.md:10`）。

> 以中老双语学习获取用户，以跨语言社交建立关系，以中国用户购买社交效率和虚拟礼物作为主要商业化方向。（`reference/product/product-overview.md:13`）

它**不是**简单把学习和交友拼在一起，而是一个**双边平台**：学习负责获客与留存，社交负责关系形成，商业化围绕社交效率和虚拟礼物。

### 1.2 价值路径（业务飞轮）

```text
学习内容 → 用户增长与留存 → 双边用户池
→ 动态 / 发现 / 主页 → Follow → Mutual Follow → Match
→ 免费聊天与跨语言辅助 → 关系和活跃
→ 社交权益与虚拟礼物
```
（`product.md:15-19`、`reference/product/business-model.md:12-16`）

Community 形成另一条关系入口：发布内容 → 曝光 → 关注 → 互动 → 互相关注 → Match → 聊天 → 持续发布。（`business-model.md:18`）

### 1.3 核心用户与价值主张

| 用户侧 | 首要认知 | 价值路径 |
| --- | --- | --- |
| 老挝用户 | 学中文的应用，也能认识中国朋友 | 学中文 → 真人练习 → 认识中国朋友 → 社交 → 贡献获得权益 |
| 中文用户 | 认识老挝人的应用，也能学习老挝语 | 学老挝语 → 认识老挝人 → 建立关系 → 免费聊天 → 付费提高社交效率 |

- 两侧首页、营销表达、功能重点可以不同，但**账户、学习、社交与商业底层共用同一平台**（`product-overview.md:20`）。
- **重点关系供给：中国男性与老挝女性**，但底层数据模型不排除其他用户（`product-overview.md:40`）。
- 学习对全年龄开放；社交有独立准入与安全体系，成为 Learning User 不代表自动获得社交资格（`product-overview.md:61`）。

### 1.4 四大产品支柱

| 支柱 | 核心能力 | 明确不做 |
| --- | --- | --- |
| **Learning** | 课程、词汇、词典、发音、TTS、练习、听说读写、翻译 | 游戏化 |
| **Social** | 交友资料、发现、筛选、位置距离、Follow、互关 Match、Match 后聊天 | — |
| **Monetization** | 学习（免费+高级+广告）、社交会员（建联效率）、虚拟礼物 | 具体定价未设计 |
| **Operations** | 运营后台（用户/审核/举报/课程/商业/奖励/配置/权限/看板），非简单 CRUD | 只做后台控制平面 |

### 1.5 约束基线

- 首发平台为 **Android**；中老用户同时服务，不以中国大陆应用商店为主要发行渠道。
- 第一阶段规模按约 **10,000 注册用户**设计；核心指标为注册量，其次观察 DAU/MAU。
- **单人主导开发**，资金和人力有限。
- 架构追求低成本、低运维与可扩展，**不以大型分布式系统或机器学习推荐为目标**。
- **Match 后正常聊天永久免费**，不以消息次数或聊天权限阻断已建立关系。

---

## 二、当前文档体系

### 2.1 全景（`docs/docs/developer/`）

```
docs/docs/developer/
├── index.md                # 产品开发全景：唯一人读入口
├── DOCUMENT_CONTRACT.md    # 文档契约：功能页结构、状态词汇、分层交付证据枚举
├── capabilities.md         # 能力地图（按用户/运营"能完成什么"）
├── delivery-status.md      # 交付状态：103 页功能的分层证据聚合
├── development-workflow.md # 开发方式：四类来源职责边界
├── current-focus.md        # 当前重点
├── journeys.md             # 用户旅程（学习者/跨语言社交/内容运营）
├── system-map.md           # 系统地图（Mobile/Admin→模块化单体→PostgreSQL）
├── product.md              # 产品画像
├── feature-catalog.json    # 机器可读功能目录（103 页，派生）
├── feature-manifest.json   # canonical 功能清单（103 页）
├── features/               # 103 个 Feature detail 页面 + index.md
├── evidence/               # 迁移基线、迁移记录、阶段历史、退役清单
└── reference/              # 事实源（adr/architecture/contracts/domains/evidence/
                            #   governance/admin/mobile/product）
```

### 2.2 真实规范（authoritative / baseline / frozen）

按 **Constitution**（`.specify/memory/constitution.md`，v1.0.0，Ratified 2026-09-02，**不可协商**）的来源优先级：

```text
Constitution
→ Frozen Physical Migration（数据库物理事实）
→ Accepted ADR / Frozen Architecture Contract
→ Canonical Product / Domain Docs
→ Upstream Frozen Public Contracts
→ Spec Kit spec/plan/tasks（宪法工作流工件）
```

**真实规范的核心清单**：

| 层 | 权威文件 | 状态 |
| --- | --- | --- |
| 最高规范 | `.specify/memory/constitution.md`（11 条原则） | Ratified |
| 文档治理 | `reference/governance/DOMAIN_DOCUMENT_STANDARD.md` | active |
| 文档契约 | `DOCUMENT_CONTRACT.md` | baseline |
| 架构 | `reference/architecture/`（overview、domains/、data/postgresql.md、applications/） | baseline |
| 域设计 | `reference/domains/`（11 域，每域 index/database/model 等） | frozen |
| 设计决策 | `reference/governance/design-register.md`（**D-001 ~ D-154**） | baseline |
| 未决事项 | `reference/governance/open-questions.md` | designing |
| 会话覆盖 | `reference/governance/source-coverage.md`（11 个 ChatGPT 主会话溯源） | baseline |
| 产品 | `reference/product/`（product-overview、business-model、feature-rollout、business-plan） | baseline |
| 契约快照 | `reference/contracts/`（identity/operations/learning/content/audio） | frozen / historical |
| 功能清单 | `feature-manifest.json`（canonical）+ `feature-catalog.json`（派生） | — |

**ADR 体系（ADR-001 ~ ADR-021，14 个 frozen）**：21 个 ADR 覆盖从模块化单体（ADR-001）到全局数据库原则（ADR-018）、Operations 控制平面（ADR-019）、Audio 独立成域（ADR-020）、Learning 拆分 Content+Learning（ADR-021）。ADR-018/020/021 是当前 **11 域、11 Schema** 格局的权威来源。

**Constitution 取代旧系统**：Constitution 明确宣告采用 GitHub **Spec Kit** 作为唯一 Feature Spec 工作流，自建 "Executable Spec System"（SPEC_SYSTEM.md）已 `superseded`，仅保留作历史。D-154 记录该决策。

### 2.3 过时 / 冲突 / 冗余

#### A. 明确退役（superseded / 删除）

| 项 | 现状 | 证据 |
| --- | --- | --- |
| 旧 `docs/docs/development/` 树（含 SPEC_SYSTEM、Blueprint 模板） | 随 `5c898e0` 删除 | Git 历史 |
| 旧 `docs/docs/features/`（105 项） | 迁为 103 个 canonical 页 | `evidence/document-migration.md` |
| `evidence/history.md` | `status: superseded` | frontmatter |
| 旧 Phase 0–17 串行开发模型 + "全量开发总计划" | `superseded`，被当前开发方式取代 | `source-coverage.md` |
| 旧自建 Executable Spec System | `superseded`，被 Constitution/Spec Kit 取代 | Constitution |
| 旧贡献计分（Contribution/Scoring）Rewards 模型 | D-017 superseded | design-register |
| 旧 Learning 音频表 `pronunciation_audios`/`tts_jobs` | D-028/145 superseded，由 Audio 取代 | design-register |
| 旧 Platform 实体（FeatureRule/ConfigItem/MediaAsset 等） | D-128 superseded | design-register |
| `social_reports` | D-115 删除，举报唯一归 `trust.reports` | design-register |
| 旧 Operations `varchar(20)` ID | D-153 superseded，统一 UUID | design-register |
| `architecture/domain-map.md`、`overview.md`、`database.md` | `status: moved`（兼容旧链接） | frontmatter |

**退役清单**：`evidence/final-retirement-inventory.json` 记录 34 个文件/目录退役，其中 9 个 Git 不可恢复（`docs/_exports` 4 个 transcript、一次性 builder 等）。

#### B. 冲突（当前文档体系的真实问题）

1. **Content 域两条并行文档线（最实质冲突）**
   - **A 线（frozen）**：`domains/content/knowledge.md` + `database.md`，Content Registry 模型，用 `lo_letters` 表（`content_id bigint PK`、`character`、`letter_type`、`sort_order`），`letter_type` 枚举 `consonant/vowel/tone_mark/other`。来自 ADR-021/D-150 拆分学习域裁决。
   - **B 线（baseline 草稿）**：`domains/content/alphabet.md` 等 "Domain Framework Draft"，定义 `LaoCharacter` 实体（68 项：27 辅音+30 元音+4 声调+7 特殊）、`LaoSyllable`、`AudioSlot`/`AudioRole`、Rule 4404、VIP 等级、`published_revision_id`/`working_revision_id` 指针。
   - **试点实现基于 B 线**：代码 domain 模型 `LaoCharacter`（classification `consonant/vowel/symbol`、subtype、`noAudio`、`onlineStatus`、revision 指针）用的是 B 线概念。
   - **数据库实际是 A 线**：migrations 建的是 `content.lo_letters`，没有 `LaoCharacter` 表；后端 repository 实际操作 `lo_letters`。
   - **枚举都不一致**：DB `letter_type` = `consonant/vowel/tone_mark/other`，domain `classification` = `consonant/vowel/symbol`。
   - **官方自认**：`features/lao-alphabet-management.md:81` 明示"数据库基线的 `lo_letters` 与新实体/Spec 的字段语义需要在实现 Gate 前完成逐字段核验；本页只记录风险，不自行裁决。"

2. **API 契约命名冲突**：`architecture/applications/api-standard.md`（active）规定严格 `snake_case` + `{"data":{}}` 包装；但 `contracts/learning/LEARNING_API.md`、`contracts/identity/IDENTITY_API.md`（frozen）用 camelCase / 不包装。**两方都是"当前有效"文档**。

3. **产品范围 vs 数据库冻结范围（已记录为未决）**：`product-overview.md` 首期功能边界表把 Chat 的"语音消息、翻译、语音转文字"列为**包含**（产品范围）；但 Chat 数据库首期只到 `TEXT`/`IMAGE`，`open-questions.md` 明示"由主架构会话裁决"。feature-catalog 中 `chat-voice-message`/`chat-translation`/`chat-speech-to-text` 均为 `pending_decision`。

4. **数量口径残留**：ADR-018 正文仍写"9 个业务域"（后被 ADR-020/021 改为 10/11）；`architecture/domains/index.md` 已写 11 域。演进后未统一刷新。

5. **audio-production 页引用已删除文件**：feature page 的 `delivery_evidence` 引用 `AUDIO_DESIGN_RECOVERY_BRIEF.md`、`AUDIO_IMPLEMENTATION_PLAN.md`、`AUDIO_PRODUCTION_CONTRACTS.md`、`AUDIO_PRODUCTION_ADMIN_DESIGN_BRIEF.md`——**全部在当前文件树中不存在**（随 `5c898e0` 删除）。

6. **audio-production 页正文结构重复**：内嵌旧"功能规则与背景"（含三套状态机、权限模型、Gate 表），与上方通用模板段之间出现**两个 `# 音频生产` 一级标题**；且该内容与 `DOCUMENT_CONTRACT.md` / `DOMAIN_DOCUMENT_STANDARD.md`"功能页不得复制状态机/Blueprint"的禁令有张力。

#### C. 冗余 / 未收敛

- **48 页 `delivery_evidence` 为空**（`without_evidence: 48`）。
- **101 页未完成人工分层核验**，多数正文"使用者或受益者"写"未明确"、"范围与边界"写"现有资料未明确"——**内容上是模板骨架/占位**。
- `reference/contracts/` 各域契约均标 `lifecycle: historical`（快照性质），`OPERATIONS_API.md` 等标 `implementation_started: false`——它们是迁移保留的快照，非当前调度权限。

### 2.4 演进时间线（从文档与 Git 推断）

| 时期 | 事件 |
| --- | --- |
| 2026-08-30 | 各域经 **ChatGPT 主架构会话**逐域设计冻结（11 个会话，见 source-coverage）；ADR-001~018 定稿；各域 database.md frozen；Social 20→19 表、Chat 全域审计修正 |
| 2026-08-31 | 架构/产品/安全层刷新；设计审计（Platform/Learning/Audio）完成 |
| 2026-09-01 | F21 总集成审计（Feature lanes 状态机、SPEC_SYSTEM v2）；登录 Feature 对齐 FEATURE_DOCUMENT_STANDARD V4 |
| 2026-09-02 | **Spec Kit 治理激活**（Constitution 签署）；文档体系整体收口迁移（旧 105→103 页、退役清单）；Identity/Platform/Operations 三域 IMPLEMENTATION COMPLETE；Content/Learning/Audio DESIGN GATE PASS 但 IMPLEMENTATION 阻塞 |

**域数演进**：9 域 → 10 域（+Audio，ADR-020）→ **11 域**（Learning 拆 Content+Learning，ADR-021）。Community 并入 Social；Notification 始终不独立成域。

---

## 三、Feature 架构与 Blueprint

### 3.1 当前 Feature 架构：Domain Capability × Product Feature 二维模型

**项目中不存在 "Feature Lane" 模型。** 全量 grep `lane|Lane|LANE` 的命中全部是 "control-plane / backplane" 中 "plane" 的子串误匹配；精确搜索 `feature lane` / `\blane\b` 零命中。

现行有效模型是 **`reference/domains/FEATURE_RELATIONSHIP_MODEL.md`（status: frozen）**：

```text
Domain Capability = 某个领域稳定拥有的业务能力（纵向事实）
Product Feature  = 用户或运营人员能够完成的端到端产品能力（横向交付地图）
```

- 二维关系，不是目录父子关系。
- Feature 物理存放于 `docs/docs/developer/features/<feature>.md`，**不得复制**进任何 Domain 目录。
- 每个 Domain 维护"领域能力地图 + 参与的产品功能"；每个 Feature 声明 `primary_domain` / `participating_domains`。
- 明确禁止：Feature 复制数据库字段、API schema、状态机、Public Contract、Implementation Blueprint、第二份业务规则。

### 3.2 用户记忆中的 "Feature Lane" —— 考古解释

"Feature Lane" 确实**曾经存在**，但属于**已退役的旧 SPEC_SYSTEM 时代**概念：

- Git 历史中的 F21 审计提交（`ce76fab`、`0c484d8`、`5bcaa2c`、`964ebe7` 等）揭示了旧模型：**六 Lane 生命周期**，`LANES = ['design', 'backend', 'admin', 'mobile', 'integration', 'acceptance']`，每个 lane 有 `todo/ready/active/blocked/done/na` 状态。
- 该模型由旧 `scripts/audit_feature_lifecycle.py` 强制（已被 `130a17a` 删除）。
- 现行 `DOCUMENT_CONTRACT.md` 用 **`delivery_layers` 六层**（数据库/Backend/Admin/Mobile/Integration/Acceptance）取代了旧六 Lane，状态词汇改为 `not_evidenced/evidenced/evidenced_limited/not_applicable/verified`，由 `scripts/validate_feature_pages.py`（现委托 `build_developer_feature_catalog.py`）强制。

**结论**：旧"Feature Lane"模型已被新的"分层交付证据（delivery_layers）"模型取代；旧脚本已删除；当前文档树无任何 Lane 痕迹。

### 3.3 audio-production Blueprint —— 考古解释

"Blueprint" 是旧自建 Executable Spec System（SPEC_SYSTEM.md）的一部分，**已被 Constitution 明确宣告 superseded**。旧体系定义派生链：

```text
Execution Brief → Implementation Blueprint → Implementation
```

Blueprint 是 **derived guidance（派生指导）**，不是新的产品事实源（旧 SPEC_SYSTEM 原文）。

**audio-production 的 Blueprint 现状**：

- 曾存在 `AUDIO_DESIGN_BRIEF.md`、`AUDIO_DESIGN_RECOVERY_BRIEF.md`、`AUDIO_IMPLEMENTATION_PLAN.md`、`AUDIO_PRODUCTION_CONTRACTS.md`、`AUDIO_PRODUCTION_ADMIN_DESIGN_BRIEF.md` 等文件（位于旧 `docs/docs/development/07-audio/` 与 `docs/docs/development/admin/audio-production/`）。
- **全部随 `5c898e0` 删除**，未迁入当前树。
- 其中 `AUDIO_PRODUCTION_ADMIN_IMPLEMENTATION_BLUEPRINT.md` 被 Admin Design Brief 列为 Required Output，但在**任何 Git 历史中都不存在**（可能从未生成）。
- 幸存者仅 `AUDIO_PUBLIC_CONTRACTS.md`（迁入 `reference/contracts/audio/`，标 `derived_from: domains/audio/contracts.md`）。
- Blueprint 承载的设计内容目前以"**功能规则与背景**"大段形式**内嵌在 `features/audio-production.md` 正文**（三套状态机 + 权限模型 + Gate 表），与 `domains/audio/*`（frozen）并存。

### 3.4 判断：应保留 / 过时 / 需重新生成

> 以下为基于证据的**事实归纳**，不构成修改建议。

**应保留（真实、有效、被引用）**：
- 103 个 Feature Page —— 被 manifest/catalog/index/capabilities/delivery-status/DOCUMENT_CONTRACT/DOMAIN_DOCUMENT_STANDARD 广泛引用；校验脚本硬性要求 103 页匹配。
- `feature-manifest.json` + `feature-catalog.json` + `build_developer_feature_catalog.py` + `validate_feature_pages.py` —— canonical/派生关系 + CI 校验。
- 两个试点页（`login`、`lao-alphabet-management`）—— 唯一带 `last_verified_at`/`delivery_layers`/`manual`。
- `FEATURE_RELATIONSHIP_MODEL.md`（frozen）、`DOCUMENT_CONTRACT.md`（baseline）、`DOMAIN_DOCUMENT_STANDARD.md`（active）—— 当前权威模型。
- Audio 域事实源（`domains/audio/*` frozen、`ADR-020` frozen、`contracts/audio/AUDIO_PUBLIC_CONTRACTS.md` frozen）。

**过时 / 冗余（重复、被取代、无当前引用）**：
- **被删除且仍被引用的 Audio Blueprint/Brief/Plan 文件**（8 个，feature page 仍引用裸文件名 = 死链接）。
- **`features/audio-production.md` 内嵌的旧设计正文** —— 与"功能页不得复制状态机/Blueprint"禁令有张力，与 frozen `domains/audio/*` 构成潜在重复，且有两个 `# 音频生产` 一级标题。
- **Audio 页旧 Gate 状态表**（"音频实现 Gate 阻塞"）与现行分层词汇（101 页未核验）两类状态体系并存。
- design-register / source-coverage 中大量 `superseded` 项（仅作溯源）。

**需重新生成 / 未完成（空壳、占位）**：
- **101 个未核验 Feature Page** —— 分层状态默认 `not_evidenced`，多数正文是"未明确"模板骨架。
- **48 页无 evidence 条目**。
- **`AUDIO_PRODUCTION_ADMIN_IMPLEMENTATION_BLUEPRINT.md`** —— 被列为 Required Output 但从未存在。
- **Audio canonical package 7 文件中的 6 个** —— AUDIT 仍把它们列为 canonical，但当前树缺失。
- **Spec Kit 工件覆盖远未完整** —— 仅 `specs/001-user-login`、`specs/002-lao-alphabet-management` 两个，对照 103 个 Feature Page。

### 3.5 试点 Feature 与正式 Domain 的字段级错位（关键事实）

**`LaoCharacter` 领域模型 vs `lo_letters` 数据库表**：

| 维度 | 代码/试点（B 线） | 数据库/冻结规范（A 线） |
| --- | --- | --- |
| 实体 | `LaoCharacter`（domain 对象） | `content.lo_letters` 表 |
| 分类 | `classification`: consonant/vowel/**symbol** | `letter_type`: consonant/vowel/**tone_mark**/other |
| 扩展 | `noAudio`、`onlineStatus`、`publishedRevisionId`、`workingRevisionId` | DB 无这些字段 |
| 唯一性 | Unicode 唯一性 + 子分类 | `UNIQUE(character, letter_type)` |
| 子类型 | `cons_middle/cons_high/cons_low`、`vowel_short/vowel_long`、`symbol_tone/ligature/...` | `letter_class` varchar（无约束） |

后端 repository 实际操作 `lo_letters`（INSERT/UPDATE `content.lo_letters`），但 domain 模型携带的是 B 线字段——**代码在"冻结表结构"与"旧领域概念"之间做映射，映射的精确性正是功能页自认"未完成逐字段核验"的**。这是当前项目最核心的未收敛事实。

---

## 四、当前产品边界

### 4.1 核心能力（已定义）

**11 个正式业务 Domain**（`reference/architecture/domains/index.md`）：

| 域 | 核心职责 | 已建正式 Feature |
| --- | --- | --- |
| Identity | 用户根、认证、Session、Device、资料、账号状态 | 登录与会话 |
| Content | Canonical 教学内容、课程、词汇、练习定义、内容版本 | 音频生产（参与） |
| Learning | 用户学习进度、掌握、复习、作答、活动与统计 | — |
| Audio Production | 业务音频生产、版本、审核、重试、批量、审计 | 音频生产（主要） |
| Social | 社交资料、发现、Follow、Match、Block、动态、Feed | — |
| Chat | 会话、成员、消息、用户侧会话状态、聊天事件 | — |
| Commerce | 商品、订单、支付、退款、礼物、钱包、资产账本 | — |
| Rewards | 奖励计划、规则、事件、Grant、幂等交付 | — |
| Trust & Safety | 举报、审核、证据、处罚、限制、申诉、真人认证 | — |
| Operations | Operator、RBAC、角色权限、后台操作审计 | 音频生产（参与） |
| Platform | Feature Flag、Runtime Config、App Version、公告、地区 | — |

**用户与资格生命周期**（`product-overview.md:54-61`）：

```text
打开 App → 选择中文/老挝语界面 → 游客浏览学习内容
→ 手机号/Facebook 注册 → 固定学习方向 → Learning User
→ 申请 Social Profile → 完善资料/照片 → 真人认证 → 人工审核
→ Social Eligible → 发现/关注/Match/聊天
```

### 4.2 首期功能边界表（明确排除 = frozen 产品边界）

| 范围 | 包含 | 不包含（明确排除） |
| --- | --- | --- |
| 学习 | 中/老语知识、课程、练习、词典、发音、进度、AI 翻译 | **游戏化** |
| Community | 朋友圈式文字、图片、点赞、评论、关注后 Feed、举报 | **视频动态** |
| Chat | 文字、Emoji、图片、语音消息、撤回、已读、翻译、语音转文字 | **文件、视频通话、语音通话** |
| 位置 | 服务端用于距离计算，前台模糊显示 | **对用户暴露精确坐标** |
| 审核 | 前期人工，后期自动化辅助与人工复核 | **首期完全自动化** |

### 4.3 明确排除（frozen 边界，跨文档）

- **游戏化**（学习）；**视频动态**（Community）；**文件/视频通话/语音通话**（Chat）；**精确坐标**（位置）。
- **不做机器学习推荐**（首期硬条件筛选 + 可解释评分，`feature-rollout.md:33`）。
- **V1 高级灰度策略不支持**：feature_flag_overrides 仅 region/client_platform/region+client 三 scope；禁 Global Override、用户群、百分比、版本表达式、时间窗（`feature-rollout.md:27`、Platform DB frozen）。
- **Rewards V1 不建计分/积分/任务/成长系统**；奖励资产仅 `COIN`；禁 C 端直报事件、禁后台手动发币（Manual Reward Grant V1 不实现）；禁只按消息数量奖励。
- **逐消息送达回执不建**（`chat_delivery_receipt`）；已读用游标 `last_read_seq`（ADR-013）。
- **群聊不建**（`chat_group`/`chat_group_member`）。
- **独立 Notification Domain 不建**（ADR-014）。
- **游客云同步 deferred**。
- **Chat 首期明确不建**：`chat_message_gift`、`chat_message_receipt`、`chat_delivery_receipt`、`chat_message_user_state`、`chat_message_reaction`、`chat_group`/`chat_group_member`、`chat_message_translation`、`chat_message_attachment`（`open-questions.md:15`）。
- **礼物接收者收益/提现/结算/Creator Economy 不预设**。
- **广告**：方向存在但**未启动**（`ads-monetization` deferred）。

### 4.4 暂不开发（deferred，完整 17 项）

`admin-auth-hardening`（后台 MFA/邀请）、`admin-dashboard`（后台数据总览）、`ads-monetization`（广告变现）、`advanced-feature-rollout`（高级灰度）、`advanced-learning-entitlements`（高级学习权益）、`advanced-reward-types`（会员天数/POINT/BADGE 等新奖励类型）、`chat-message-receipts`（送达/已读回执）、`chat-own-delete`（单条仅自己删除）、`chat-reactions`（消息 Reaction）、`creator-earnings`（礼物收益/提现/结算）、`group-chat`（群聊）、`guest-cloud-sync`（游客云同步）、`promotions-coupons`（促销/优惠券）、`push-notifications`（推送通知）、`runtime-config-history`（配置版本回滚）、`social-membership-entitlements`（社交会员/高级权益）、`wrong-answer-notebook`（错题本）。

> 与产品边界直接相关的关键 deferred：广告变现、社交会员落表、礼物目录、礼物收益/提现、促销优惠券、群聊、推送通知、高级权益、新奖励类型。

### 4.5 待裁决（pending_decision，6 项）

`chat-speech-to-text`（语音转文字）、`chat-translation`（聊天翻译）、`chat-voice-message`（语音消息）—— 与产品范围 vs 数据库范围差异直接相关，裁决前并存记录；`real-person-verification`（真人认证）、`social-distance`（距离筛选）、`verification-review`（认证审核）。

另 `open-questions.md` 的 designing 项：后台 MFA/邀请流程、Trust 真人认证 Verification 子域、`moderation_evidence.storage_key` 迁移 asset_id、`regions.name` 多语言、正式部署/发布/回滚/监控/客服方案等。**未决项只能由主架构会话决定，文档维护阶段不得自行填充。**

---

## 五、代码库真实实现状态（对照）

> 本节是"文档声称 vs 代码事实"的核心对照，全部以代码为准。

### 5.1 数据库层：完整（125 张表，11 域全覆盖）

19 个 migration（0000~1260）覆盖全部 11 个业务 Schema + 基础设施：

| Migration | 表数 | 域 |
| --- | --- | --- |
| 0100_identity | 4+3 | identity（users/auth_identities/basic_profiles/learning_profiles + otp/devices/sessions） |
| 0200_operations | 5 | operations |
| 0300_platform | 6 | platform |
| 0400_content | 31+1 | content（含 lo_letters 等） |
| 0500_learning | 10 | learning |
| 0600_audio | 9 | audio |
| 0700_social | 19 | social |
| 0800_chat | 7 | chat |
| 0900_commerce | 16 | commerce |
| 1000_rewards | 5 | rewards |
| 1100_trust | 5+1 | trust |
| 1200~1260 | 1+1+1+1+1 | asset infra、outbox、revision、admin creds |

数据库层与 design-register 设计**完全一致**（11 域、125 表）。

### 5.2 后端：只实现 4/11 域

`apps/backend/src/modules/` 只有 **4 个业务模块**（identity、operations、platform、content），采用 `domain/application/infrastructure/http/public` 分层。

**main.ts 实际挂载**：只注册 **identity、operations、platform 三个模块**。

- **Identity**：Phone OTP 登录/注册、Facebook 登录（`UnavailableFacebookCredentialVerifier` 降级占位）、会话（refresh 轮换/30 天滑动/全端登出）、设备、资料、管理员登录。✅ 完整
- **Operations**：RBAC 操作员/角色/权限/审计日志，含并发 gate 与安全不变式。✅ 完整
- **Platform**：feature flags/runtime configs/app versions/announcements/regions 全套运行时 + 管理 API。✅ 完整
- **Content**：LaoCharacter 生命周期 use-cases 真实，**但 HTTP 路由从未挂载**——main.ts 无任何 `modules/content` 引用。路由代码存在但永远不会被 Fastify 实例化。⚠️ 半接线

**未实现域**：learning、audio、social、chat、commerce、rewards、trust —— **只有数据库表，无任何业务代码**。

**测试**：47 个后端测试文件（17 unit + 22 integration + 8 modules），主要覆盖 identity/operations/platform；content 仅 2 个（revision-state-machine、unicode-conflict）。

### 5.3 Admin：3 个 feature

- **operations**（RBAC 控制台）：成熟度最高，完整 CRUD + 角色分配 + 权限门控 + 审计日志。✅
- **platform**：5 个管理页（feature-flags/runtime-configs/app-versions/announcements/regions）。✅
- **content/alphabet**：AlphabetPage + 表单 + 表格 + 审核对话框，但**前端 API 指向 `/api/v1/admin/content/letters` 而后端 content 路由未挂载** → UI 存在但端到端不可达。⚠️
- `/learning`、`/audio`、`/identity`、`/social`、`/chat`、`/commerce`、`/rewards`、`/trust`：**占位页**（`placeholder: true`，无功能）。

### 5.4 Mobile：Foundation 级

- **已实现**：手机号登录流程（LoginScreen + OtpScreen 真实对接 identity API）、会话 bootstrap、主题/语言设置、能力实验室（home/lab/settings 三个 tab）。
- **字母表学习视图**（`features/alphabet/screens/AlphabetScreen.tsx`）：**存在但未挂载**——RootNavigator 无 Alphabet，HomeScreen 无入口，是"孤儿实现"。
- CI 中 mobile job `continue-on-error: true`（明确非阻塞）。

### 5.5 Spec Kit 工件：后向文档化，tasks 勾选存在虚报

- `specs/001-user-login/`、`specs/002-lao-alphabet-management/` 是真实 Spec Kit 工件（spec/plan/tasks/data-model/contracts/checklists）。
- 两份 spec 均自标 **Status: Draft**，但 tasks.md 均 **42/42 全勾选**。
- Git 历史显示：**实现 commit 先于 specs 目录出现**（`4d87b56`、`8f3237e`），即这些 spec 是**围绕已存在代码生成的后向文档**，不是驱动开发的前置计划。
- **tasks 勾选虚报证据**（002）：
  - 声称创建的 `audio-slot-sync-service.ts`、`audio-projection-service.ts`、`get-published-alphabet.contract.test.ts`、`audio-hash-invalidation.integration.test.ts`、`AlphabetSectionList.test.tsx`、`modules/content/README.md` —— **6 个文件全部不存在**。
  - 声称"挂载公开 C 端路由 GET /api/v1/content/letters" —— **content 路由从未挂载**。
  - 声称"挂载 Alphabet 页面至 RootNavigator" —— **无 Alphabet 导航**。
- **001 虚报较轻**：功能真实存在，但独立文件（`advisory-lock.ts` 等）合并到 `infrastructure/repositories.ts`，路径漂移。

### 5.6 代码 vs 文档一致性总评

**文档层是诚实且克制的**：
- `delivery-status.md` 明示只有 2 页完成核验，101 页默认 not_evidenced。
- `delivery-baseline.md` 明示"阶段 COMPLETE 不等于用户功能可用"。
- `features/lao-alphabet-management.md` 自认 lo_letters 与 LaoCharacter 字段错位风险。
- 未发现"代码有但文档完全没提"的实质功能。

**真实的成熟度画像**：
- **数据库层**：成熟（125 表、11 域、schema 校验）。
- **Identity/Operations/Platform 三域**：后端 + Admin 接近生产可用的后台实现，测试较全。
- **Content 域**：半接线（领域/仓库/use-cases 真实，HTTP 未挂载）。
- **Mobile**：Foundation 级（登录、主题、会话基础；字母表未接入）。
- **Learning/Audio/Social/Chat/Commerce/Rewards/Trust**：仅数据库有表，无业务代码。
- **SpecKit**：后向文档化，tasks 勾选虚报。

**一句话总结**：这是一个"**数据库完备、三个核心后台域（Identity/Operations/Platform）真实成熟、Content 半途未接线、其余域只有表没有代码**"的项目。文档体系清晰且诚实地记录了这种状态。

---

## 六、核心考古结论（汇总结论）

1. **产品定位清晰且一贯**：双边平台，学习获客、社交建关系、社交效率+礼物商业化；这一核心从 D-001 到 business-plan 全部一致，是文档体系中最稳定的部分。

2. **文档体系刚完成一次大规模收口迁移**（2026-09-02），处于"迁移后初生期"：顶层文档日期集中在迁移日，大量引用 commit `8f3237e` 作为证据基线，尚未经历真实实现反哺。Constitution 刚刚签署，Spec Kit 治理刚激活。

3. **"存在 ≠ 实现"是全文档反复强调的核心纪律**，且被代码验证为真实——101 页只有记录、只有 2 页核验、7 个域只有表。文档没有过度声称。

4. **最实质的未收敛冲突是 Content 域双轨**：试点实现（LaoCharacter 概念）与冻结数据库规范（lo_letters 表）在实体、枚举、字段上不一致，功能页自己记为风险、等待实现 Gate 前逐字段核验。

5. **用户记忆中的 "Feature Lane" 和 "audio-production Blueprint" 都是旧自建 Spec 系统（SPEC_SYSTEM）时代的概念**：Feature Lane（六 Lane 生命周期）被新的 delivery_layers 分层证据模型取代；Blueprint 被 Constitution 宣告 superseded，相关文件已删除，其内容内嵌进 feature page 正文。

6. **代码真实成熟度远低于文档规模**：125 张表 vs 4 个后端模块 vs 3 个 Admin feature vs 2 个 Mobile feature。数据库是"设计先行、落地完整"；业务代码是"三个核心后台域成熟、Content 半途、其余未动"。

7. **历史进程清晰**：从 ChatGPT 设计会话（11 个）→ 逐域 frozen → F21 审计 → 文档收口迁移 + Spec Kit 激活。这是一个由 AI 会话驱动设计、再逐步实现的单人或小团队项目。

---

## 附录：关键文件速查

| 用途 | 路径 |
| --- | --- |
| 产品画像 | `docs/docs/developer/product.md` |
| 产品定位与范围 | `docs/docs/developer/reference/product/product-overview.md` |
| 业务与商业模型 | `docs/docs/developer/reference/product/business-model.md` |
| 功能开放 | `docs/docs/developer/reference/product/feature-rollout.md` |
| 12 个月业务规划 | `docs/docs/developer/reference/product/business-plan.md` |
| 产品开发全景 | `docs/docs/developer/index.md` |
| 文档契约 | `docs/docs/developer/DOCUMENT_CONTRACT.md` |
| 交付状态 | `docs/docs/developer/delivery-status.md` |
| 领域文档规范 | `docs/docs/developer/reference/governance/DOMAIN_DOCUMENT_STANDARD.md` |
| 设计决策台账 | `docs/docs/developer/reference/governance/design-register.md`（D-001~D-154） |
| 未决事项 | `docs/docs/developer/reference/governance/open-questions.md` |
| 会话覆盖清单 | `docs/docs/developer/reference/governance/source-coverage.md` |
| 域×Feature 关系模型 | `docs/docs/developer/reference/domains/FEATURE_RELATIONSHIP_MODEL.md` |
| 领域入口 | `docs/docs/developer/reference/domains/index.md` |
| ADR 索引 | `docs/docs/developer/reference/adr/index.md` |
| Constitution | `.specify/memory/constitution.md` |
| 功能清单 | `docs/docs/developer/feature-manifest.json` + `feature-catalog.json` |
| 功能页 | `docs/docs/developer/features/`（103 页） |
| 迁移记录 | `docs/docs/developer/evidence/document-migration.md` |
| 退役清单 | `docs/docs/developer/evidence/final-retirement-inventory.json` |
| 数据库迁移 | `database/migrations/`（19 个） |
| 后端模块 | `apps/backend/src/modules/`（identity/operations/platform/content） |
| Spec Kit 工件 | `specs/001-user-login/`、`specs/002-lao-alphabet-management/` |
