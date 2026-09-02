# FEATURE_ARCHITECTURE_RESEARCH：Feature 架构重构研究

> **性质**：Feature 架构研究 —— 分析现有 103 个 Feature Docs，规划从旧 Feature Lane 模型迁移到 Blueprint 产品模型。
> **日期**：2026-09-02
> **重点**：audio-production
> **方法**：基于 `feature-catalog.json`（103 项全量）+ 11 个 Domain frozen 设计 + Git 历史（Lane 模型考古）+ 代码核查，交叉分析。
> **证据标注**：【设计】= frozen 设计意图；【代码】= 代码实现；【缺口】= 设计/实现未覆盖；【风险】= 已知问题。

---

## 一、背景：两种模型的定义

### 1.1 旧 Feature Lane 模型（已退役）

Git 历史考古确认：旧 `scripts/audit_feature_lifecycle.py` 定义了 **六 Lane 生命周期模型**：

```text
LANES = ['design', 'backend', 'admin', 'mobile', 'integration', 'acceptance']
```

每个 feature 有六个 lane，每个 lane 有 `todo/ready/active/blocked/done/na` 状态（`audit_feature_lifecycle.py` 已随 commit `130a17a` 删除）。

**本质问题**：这是**技术实现视角**的划分——它回答"这个功能在 Backend/Admin/Mobile 各完成了多少"，但**不回答"这个功能为用户/运营提供什么端到端价值"**。它导致：
- feature 按"层"碎片化，无法表达端到端交付
- 状态语义混淆（一个 lane `done` 不等于功能可用）
- 与现行 `delivery_layers` 分层证据模型冲突（后者是逐层证据记录，不是产品组织）

### 1.2 Blueprint 产品模型（目标）

Blueprint 产品模型以**产品能力 / 用户价值**为中心组织（参考 FEATURE_RELATIONSHIP_MODEL 的 Domain Capability × Product Feature 二维模型 + audio-production Blueprint 思想）：

```text
Blueprint Product Model
= 以"用户/运营能完成什么端到端能力"组织 Feature
= 每个 Feature 是端到端交付能力（用户目标 → 流程 → 参与系统 → 验收）
= 不与任何单个 Domain 目录绑定
= 是"产品交付地图"，不是"技术实现分层"
```

**迁移方向**：从"按技术层（Lane）组织"→"按产品能力组织（Blueprint）"。

---

## 二、分类所有 Feature（103 项全景）

### 2.1 按 Portfolio 状态

| 状态 | 数量 | 说明 |
| --- | --- | --- |
| active | 80 | 进入产品组合 |
| deferred | 17 | 明确延后 |
| pending_decision | 6 | 待裁决 |

### 2.2 按当前主领域（`domains[0]`）

| 主领域 | Feature 数 | active | deferred | pending |
| --- | --- | --- | --- | --- |
| learning | 17 | 14 | 3 | 0 |
| commerce | 15 | 12 | 3 | 0 |
| chat | 15 | 8 | 4 | 3 |
| social | 14 | 13 | 0 | 1 |
| content | 7 | 7 | 0 | 0 |
| operations | 7 | 6 | 1 | 0 |
| platform | 7 | 5 | 2 | 0 |
| trust | 7 | 5 | 0 | 2 |
| identity | 6 | 5 | 1 | 0 |
| rewards | 3 | 2 | 1 | 0 |
| audio | 1 | 1 | 0 | 0 |
| unassigned | 4 | 2 | 2 | 0 |

### 2.3 关键观察

1. **audio 只有 1 个 feature**（audio-production）——但 audio 域有 5 个完整 frozen 设计文档（index/production/lifecycle/contracts/database）。**设计深度与产品 feature 覆盖严重不匹配**。
2. **learning 17 个但很多是消费侧**（dictionary-search/history、instant-translation、translation-history）——learning 域被过度承载了"消费体验"。
3. **rewards 只有 3 个**（automatic-coin-rewards/reward-operations/advanced-reward-types）——最小域。
4. **identity 被 63 个 feature 引用**——几乎每个 feature 都依赖 identity（用户身份底座），是"隐形依赖"而非独立产品域。

---

## 三、找出重复功能

### 3.1 重复/过度拆分模式

| # | 重复模式 | Feature 组 | 本质 | 判断 |
| --- | --- | --- | --- | --- |
| 1 | **社交资料三件套** | `social-profile`（创建编辑）、`social-profile-view`（查看）、`social-profile-media`（照片/兴趣/语言/Prompt） | 同一"社交资料聚合"的不同面 | **过度拆分**，应合并为"社交资料" |
| 2 | **发现三件套** | `social-discovery`（发现筛选推荐）、`social-discovery-preferences`（偏好设置）、`social-distance`（距离筛选） | 同一"发现"能力 | **过度拆分**，偏好/距离是发现的子能力 |
| 3 | **申诉/认证前后台拆分** | `user-appeal`（用户）+ `appeal-review`（后台）；`real-person-verification`（用户）+ `verification-review`（后台） | 同一链路的两个视角 | **合理但可合并表达**，应作为同一 feature 的"用户侧/后台侧" |
| 4 | **钱包展示碎片** | `wallet-balance`（余额）、`wallet-history`（账本）、`order-payment-history`（订单）、`wallet-adjustment-admin`（调整）、`commerce-transaction-admin`（监控） | Commerce 钱包的展示面 | **过度拆分**，应收敛为"钱包" + "交易后台" |
| 5 | **关系列表重叠** | `social-match`（互关 Match）、`social-relationships`（关注我的/我关注的/已匹配列表） | 关系展示 | 重叠，可合并 |
| 6 | **词典内容/搜索/历史拆分** | `dictionary-content-management`（content）、`dictionary-search` + `dictionary-history`（learning） | D-150 明确"内容归 content、历史归 learning"，但产品面拆成 3 个 | **与 D-150 不一致**，应表达为"词典"的完整能力 |
| 7 | **翻译拆分** | `instant-translation`、`translation-history`（learning）+ `chat-translation`（chat） | 学习翻译 vs 聊天翻译 | 产品场景不同但底层复用，可表达为"翻译"能力组 |
| 8 | **登录系列** | `login`、`login-devices`、`admin-login`、`first-admin-bootstrap` | 用户/后台登录 | 前后台合理拆分，但 admin-login + first-admin-bootstrap 可合并 |

### 3.2 重复根因

- **Feature 粒度按"数据库表/层"而非"用户任务"划分**——旧 Lane 模型的遗产。
- **前后台视角被拆成独立 feature**——但 Blueprint 产品模型下，一个端到端能力应同时覆盖用户侧与后台侧。

---

## 四、找出不存在价值的 Feature

### 4.1 明确不建/被取代（无当前价值）

> 依据：open-questions.md 明确不建的表、design-register 中 `superseded`/`deferred` 项、ADR 决策。

| Feature | 对应决策 | 判断 |
| --- | --- | --- |
| `chat-message-receipts` | open-questions 明确不建 `chat_delivery_receipt` | **无价值**（被决策否决） |
| `chat-own-delete` | open-questions 明确不建 `chat_message_user_state` | **无价值**（被决策否决） |
| `chat-reactions` | open-questions 明确不建 `chat_message_reaction` | **无价值**（被决策否决） |
| `group-chat` | open-questions 明确不建 `chat_group` | **无价值**（被决策否决） |
| `promotions-coupons` | D-075 明确不建 | **无价值**（被决策否决） |
| `creator-earnings` | D-075 明确不建 creator_earnings | **无价值**（被决策否决） |
| `push-notifications` | ADR-014 不建 Notification 域 | **无价值**（被决策否决，应作为 Platform 的延伸而非独立 feature） |
| `guest-cloud-sync` | open-questions 延后 | **暂缓**（有未来价值但明确延后） |
| `social-membership-entitlements` | D-075 entitlement 落表延后 | **暂缓**（有未来价值） |

### 4.2 暂缓但有未来价值（非无价值）

| Feature | 未来价值 | 判断 |
| --- | --- | --- |
| `admin-auth-hardening` | 后台 MFA/邀请（open-questions designing） | 暂缓价值 |
| `advanced-feature-rollout` | 高级灰度（V1 明确不支持，未来扩展） | 暂缓价值 |
| `advanced-learning-entitlements` / `advanced-reward-types` | 商业演进 | 暂缓价值 |
| `ads-monetization` | 收入方向存在但未启动 | 暂缓价值 |
| `runtime-config-history` | D-122 明确 V1 不做版本历史 | 暂缓价值 |
| `wrong-answer-notebook` | 学习功能，有未来价值 | 暂缓价值 |
| `admin-dashboard` | 运营看板 | 暂缓价值 |

### 4.3 空壳/占位（无实质内容）

- **101 个未核验 feature** 中，大量正文"使用者或受益者：未明确"、"范围与边界：现有资料未明确"——**模板骨架**。
- **48 页无 evidence 条目**。
- 但这些是"待补证据"而非"无价值"——价值在于它们是产品范围记录。

### 4.4 无价值判断汇总

**9 个明确无价值**（被决策否决）：chat-message-receipts、chat-own-delete、chat-reactions、group-chat、promotions-coupons、creator-earnings、push-notifications（独立 feature 形式）+ guest-cloud-sync、social-membership-entitlements（暂缓）。

---

## 五、找出缺失领域

### 5.1 Domain ↔ Feature 覆盖缺口

| 领域 | 设计成熟度 | Feature 覆盖 | 缺口 |
| --- | --- | --- | --- |
| **audio** | **5 个完整 frozen 文档** | **2 个 feature** | **严重不匹配——音频生产域在产品层孤立** |
| rewards | 完整（5 表） | 3 个 | 覆盖偏少但核心完整 |
| content | 完整（32 表） | 7 个（+learning 交叉 22） | 内容生产/消费边界在产品层混乱 |
| learning | 完整（10 表） | 17 个 | 过度承载消费体验，粒度过细 |

### 5.2 产品需要的缺失领域

| 缺失领域 | 说明 | 当前状态 |
| --- | --- | --- |
| **音频生产平台的产品面** | audio 域设计完整但产品面只有 1 个 feature，缺"音频质量门/发音正确性/批量生产/内容联动"作为独立产品能力表达 | **最大缺失** |
| **配音人员/录音工作流** | 人工录音是 audio 域核心生产方式，但无专门 feature 表达"录音→试听→提交"工作流 | 缺失 |
| **内容-音频联动** | `audio_input_hash` 触发"内容变更→音频重产"是核心机制，但无 feature 表达"发音联动/重产编排" | 缺失 |
| **数据分析/看板** | 学习/运营数据洞察（admin-dashboard 是 deferred 空壳） | 缺失 |

---

## 六、建立新的 Feature Domain（Blueprint 产品模型）

### 6.1 新模型原则

```text
Blueprint Product Model 的 Feature Domain
= 以"用户/运营端到端能完成什么"为分组
= 每个 Feature 是一个完整交付能力（含用户侧 + 后台侧 + 跨域）
= 与数据库 Domain 解耦（一个产品 Feature 可跨多个业务 Domain）
= 粒度 = 用户可理解的一个完整任务
```

### 6.2 新 Feature Domain 分组（13 簇，覆盖 103 项）

| # | 新 Feature Domain | 成员 Feature（合并后） | 原数量 → 新数量 |
| --- | --- | --- | --- |
| 1 | **身份与会话** | login（含 login-devices）、account（含 account-lifecycle + account-profile + interface-language + theme-settings）、identity-admin（含 identity-user-admin） | 8 → 3 |
| 2 | **内容生产与发布** | knowledge-content、alphabet、curriculum、practice-content、dictionary-content、content-revision | 6 → 6 |
| 3 | **学习体验** | lesson-learning、practice、progress、mastery-review、dictionary（search+history）、translation（instant+history）、pronunciation-playback、bookmarks | 16 → 8 |
| 4 | **社交资料与关系** | social-profile（含 view + media）、discovery（含 preferences + distance）、follow/match（含 relationships）、social-lifecycle、social-block | 11 → 5 |
| 5 | **动态社区** | posting、post-interactions、feed | 3 → 3 |
| 6 | **聊天** | conversation（list+settings+direct）、messaging（text+image+realtime+read-state+recall）、voice-translation（voice-message+translation+stt，pending） | 15 → 3（+deferred 4） |
| 7 | **商业与钱包** | wallet（balance+history）、commerce（buy-coins+catalog+order+refund+transaction）、gift（catalog+send+admin）、entitlements（membership+advanced，deferred） | 16 → 4 |
| 8 | **奖励激励** | auto-rewards、reward-ops、advanced-reward-types | 3 → 3 |
| 9 | **信任与安全** | reporting（user-reporting+moderation-workbench）、enforcement、appeal（user-appeal+appeal-review）、verification（pending） | 7 → 4 |
| 10 | **运营后台** | operator（login+bootstrap+management+role+permission+audit）、admin-dashboard | 8 → 2 |
| 11 | **平台控制** | feature-flag（control+advanced）、runtime-config（mgmt+history）、app-version、announcements、regions、ads、push（延伸） | 8 → 7 |
| 12 | **音频生产平台** | **见下节（重点）** | 1 → 6 |
| 13 | **游客/引导** | guest（browse+cloud-sync） | 2 → 1 |

### 6.3 重点：audio-production 的 Blueprint 产品模型

> **这是本次重构的核心**。audio 域设计完整（5 文档、9 表、六状态机）但产品面只有 1 个 feature，必须按 Blueprint 产品模型拆解为完整的产品能力簇。

#### 6.3.1 现状分析

| 维度 | 现状 |
| --- | --- |
| 设计完整度 | **极高**（Slot/Task/Attempt/AssetVersion/Review/Batch 六状态机 + fresh/stale + 幂等 + 批量） |
| 产品 feature | **仅 1 个**（audio-production，且为未核验骨架页） |
| 消费 feature | 1 个（pronunciation-playback，归 learning） |
| 实现状态 | `implementation_started: false`（9 表已建，无业务代码） |

**问题**：一个完整的生产平台被压缩成单个 feature，导致：
- 无法表达"配音人员"这个独立角色（无专门工作流）
- 无法表达"音频质量门/发音正确性"这个独立能力
- 无法表达"内容-音频联动/重产编排"
- 无法表达"批量生产管线"

#### 6.3.2 新的 audio-production Blueprint（6 个产品能力）

| # | 产品能力 | 用户/运营目标 | 涉及 Audio 域机制 | 原 feature 映射 |
| --- | --- | --- | --- | --- |
| 1 | **音频槽位管理**（audio-slot-management） | 运营人员建立/维护业务对象的发音槽位，配置默认 TTS preset | `audio_slots` + `audio_default_presets` | audio-production 的一部分 |
| 2 | **音频生产编排**（audio-production-orchestration） | 运营人员创建/分配生产任务，选择 TTS/人工录音，处理技术失败重试 | `audio_tasks` + `audio_generation_attempts` + 状态机 | audio-production 主体 |
| 3 | **人工录音工作流**（audio-recording） | **配音人员**接收任务、试听规范、录制、试听重录、提交 | `human_recording` + `producer_operator_id` | **新增**（配音人员角色） |
| 4 | **音频审核发布**（audio-review-publish） | 审核人员审听、通过/驳回（8 类 reject reason）、发布正式音频 | `audio_reviews` + `official_asset_version_id` + 原子发布 | audio-production 的一部分 |
| 5 | **内容-音频联动**（audio-content-sync） | 内容变更（audio_input_hash 变化）自动触发 stale 判定与重产需求 | `audio_input_hash` + fresh/stale + `syncRequirement` | **新增**（联动机制） |
| 6 | **批量音频生产**（audio-batch-production） | 运营人员对大量词条批量创建生产任务 | `audio_task_batches` + `audio_task_batch_items` + 幂等 | **新增**（批量能力） |

**设计依据**（全部来自 frozen `domains/audio/`）：
- `audio_slots` 唯一键 `(source_domain, content_entity_type, content_entity_id, language_code, audio_role)`【设计】
- 技术失败 vs 质量失败分离（同 Task 重试 Attempt vs successor Task）【设计】
- 人工录音 `generation_attempt_id = NULL` + `producer_operator_id NOT NULL`【设计】
- `approved ≠ published`，原子发布事务【设计】
- `audio_input_hash` 联动 + stale 不清空 official pointer【设计】
- Batch 幂等（同 key + 同 hash 返回原 Batch）【设计】

#### 6.3.3 角色 ↔ 产品能力映射

| 角色 | 使用的能力 | 说明 |
| --- | --- | --- |
| 内容创作者 | 音频槽位管理（触发）、内容-音频联动 | 内容变更驱动音频需求 |
| 配音人员 | **人工录音工作流（新增）** | 独立角色，当前无 feature 表达 |
| 音频制作人员 | 音频生产编排、批量音频生产、音频审核发布 | 核心运营角色 |
| 普通用户 | pronunciation-playback（消费） | 通过 `resolveOfficialAudio` 获取 |

---

## 七、迁移建议（从旧 Lane 到 Blueprint）

> 以下为基于分析的**架构迁移方向**，非实施指令。

### 7.1 迁移步骤

```text
Step 1: 清理无价值 feature（9 个被决策否决项）→ 从 active/deferred 移除或合并
Step 2: 合并过度拆分（社交资料三件套、钱包碎片、登录系列等）
Step 3: 建立 13 个 Blueprint Feature Domain 分组
Step 4: 拆解 audio-production 为 6 个产品能力（重点）
Step 5: 补充缺失领域（配音人员工作流、内容-音频联动、批量生产）
Step 6: 以"用户任务"而非"技术层"重新定义每个 feature 的边界
```

### 7.2 迁移映射表（旧 Lane → 新 Blueprint）

```text
旧：LANES = [design, backend, admin, mobile, integration, acceptance]  ← 技术层
新：Blueprint Feature = {用户目标, 用户流程, 参与系统, 验收标准}        ← 产品能力

旧：feature 按"哪个层完成了多少"标注
新：feature 按"用户/运营能完成什么端到端能力"组织
旧：delivery_layers（六层证据）作为状态记录
新：delivery_layers 保留作为"逐层证据记录"，但不再是产品组织方式
```

---

## 八、重点总结：audio-production 重构要点

### 8.1 为什么 audio-production 是重点

1. **设计-产品落差最大**：5 个完整 frozen 设计文档 vs 1 个 feature 骨架页。
2. **实现完全未开始**：`implementation_started: false`，9 表已建但无代码。
3. **角色覆盖缺失**：配音人员是独立角色但无 feature 表达。
4. **联动机制未产品化**：内容-音频联动（audio_input_hash）是核心差异化，但无 feature 表达。
5. **市场差异化验证**（前轮 MARKET_RESEARCH）：音频生产管线是市场空白，正是 ZH-LAO 差异化所在。

### 8.2 audio Blueprint 的 6 能力（最终）

| 能力 | 新 feature 建议 slug | 角色 |
| --- | --- | --- |
| 音频槽位管理 | `audio-slot-management` | 运营 |
| 音频生产编排 | `audio-production-orchestration` | 音频制作人员 |
| 人工录音工作流 | `audio-recording` | **配音人员** |
| 音频审核发布 | `audio-review-publish` | 审核人员 |
| 内容-音频联动 | `audio-content-sync` | 内容创作者/系统 |
| 批量音频生产 | `audio-batch-production` | 运营 |

---

## 九、结论

1. **当前 103 个 feature 是旧 Lane 模型（技术分层）的产物**，粒度按"数据库表/前后台视角"而非"用户任务"划分，导致大量过度拆分与碎片化。

2. **重复功能集中在 4 类**：社交资料/发现三件套、钱包/交易碎片、申诉/认证前后台拆分、词典/翻译内容与学习拆分。

3. **9 个明确无价值**（被设计决策否决）：chat-message-receipts、chat-own-delete、chat-reactions、group-chat、promotions-coupons、creator-earnings、push-notifications、guest-cloud-sync、social-membership-entitlements。

4. **最大缺失领域是音频生产平台的产品面**——audio 域设计完整但只有 1 个 feature，必须按 Blueprint 产品模型拆解为 6 个产品能力（含新增的配音人员工作流、内容-音频联动、批量生产）。

5. **新 Feature Domain 模型为 13 簇**，以"用户/运营端到端能力"为分组原则，与数据库 Domain 解耦，103 项可收敛到约 50 个完整产品能力。

6. **audio-production 是迁移的最佳试点**：设计完整、实现空白、角色清晰、差异化明确，适合作为从旧 Lane 到 Blueprint 模型的首个完整重构对象。

---

## 附录：关键数据与来源

| 数据 | 来源 |
| --- | --- |
| 103 feature 全量 | `docs/docs/developer/feature-catalog.json` |
| Portfolio 状态 | 同上（active 80 / deferred 17 / pending 6） |
| 11 域设计 | `docs/docs/developer/reference/domains/` |
| 六 Lane 模型（已退役） | Git 历史 `scripts/audit_feature_lifecycle.py`（commit `130a17a` 删除） |
| 决策台账 | `docs/docs/developer/reference/governance/design-register.md`（D-075/122 等） |
| 未决事项 | `docs/docs/developer/reference/governance/open-questions.md`（不建表清单） |
| audio 域 5 文档 | `docs/docs/developer/reference/domains/audio/{index,production,lifecycle,contracts,database}.md` |
| audio 公共契约 | `docs/docs/developer/reference/contracts/audio/AUDIO_PUBLIC_CONTRACTS.md` |
| 市场差异化 | `MARKET_RESEARCH.md`（音频生产管线为市场空白） |
