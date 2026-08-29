---
status: baseline
last_updated: 2026-08-30
---

# Domain Map

## 一级域边界

| Domain | 负责 | 明确不负责 |
| --- | --- | --- |
| Identity | 用户根、登录身份、基础资料、Locale、学习方向、OTP、Session、Device | 社交资料、真人认证、会员、学习进度、Follow、聊天 |
| Learning | 中文/老挝语知识、课程、练习、进度、收藏、学习记录、词典、发音、TTS、翻译 | 社交关系 |
| Social | 社交资料、照片、偏好、发现、Follow、Match、Block、社区/动态能力（公开动态/点赞/评论/Feed/举报入口） | 消息内容、礼物交易、审核历史、媒体文件存储 |
| Chat | 会话实体与 Direct 身份、成员与已读游标、消息身份与会话内顺序、文本内容、图片资源引用、用户侧会话状态（置顶/免打扰/隐藏/清空）、撤回事实、聊天领域事件发布 | 媒体文件存储与 URL、礼物交易与资产变化、推送与 WebSocket 传输实现、社交关系与匹配状态、翻译结果存储 |
| Commerce | 商品、价格、会员、权益、订单、支付、退款、礼物和虚拟资产账本 | 贡献评分 |
| Rewards | 奖励计划/活动与生命周期、规则版本、接收其他域可信事件、奖励决定（Grant）、幂等发放编排（V1 奖励资产 Coin 经 Commerce 入账） | 钱包/余额/账本、调整/冲正/退款、礼物/订单/支付、计分/积分/任务/徽章（V1）、反向查询其他域验证事实、权益消费判定、独立 Outbox 表（统一 `system_outbox_events`） |
| Trust & Safety | 真人认证、审核案件、证据、审核决定、内容处置指令、跨域限制、封禁、申诉（只产生治理处置与处置历史，经领域事件由属主域执行） | 用户根状态、`social_blocks` 当前关系事实、被审核业务对象正文 |
| Operations | 后台运营主体、RBAC 后台授权（角色/权限 key/关系）、后台操作审计（append-only） | 各业务实体所有权、业务域状态机（封禁/退款/补发）、认证凭据（登录/MFA/Session）、业务内容、Feature Flag/系统参数（归 Platform） |
| Platform | Product Runtime Control Plane：Feature Flag 定义与地区/客户端覆盖、真正跨域的运行参数（仅 current state）、客户端版本与升级策略、平台公告、产品支持地区（六张业务表；Media/Asset 与 Outbox 属 Platform Infrastructure，不计入业务域） | 可明确归属业务域的配置与规则（各 Domain）、用户/账号/权限/封禁（Identity/Trust）、后台操作者与操作审计（Operations）、Push/Chat 系统消息/营销 Campaign、GIS/行政区划、发布包与部署 |

## Domain → Subdomain → Core Entity

| Domain | Subdomain | Core Entity |
| --- | --- | --- |
| Identity | Account / Auth | User, Account, AuthIdentity, OtpChallenge, Session, Device |
| Identity | Locale / Learning Identity / Basic Profile | LocalePreference, LearningProfile, BasicProfile |
| Learning | Chinese Content | Pinyin, Hanzi, Vocabulary, Sentence |
| Learning | Lao Content | LaoLetter, Syllable, Word, Sentence |
| Learning | Course / Practice / Progress | Course, Unit, Lesson, LessonItem, Exercise, Question, Option, Answer, LearningProgress, LessonProgress, PracticeAttempt |
| Learning | Dictionary / Pronunciation / Translation | DictionaryEntry, Meaning, Example, Pronunciation, AudioAsset, TranslationRequest, TranslationResult |
| Social | Social Profile / Discovery | SocialProfile, SocialPhoto, Interest, SocialLanguage, Prompt, Preference, DiscoveryExposure |
| Social | Follow / Match / Safety | Follow, Match, SocialBlock（~~Report~~ 已删除：举报事实唯一归 `trust.reports`，D-115/D-135） |
| Social | Public Content / Interaction | SocialPost, SocialPostMedia, SocialPostLike, SocialPostComment |
| Chat | Conversation | Conversation, DirectConversation, ConversationMember, ConversationUserState |
| Chat | Message / Content | Message, TextMessage, ImageMessage |
| Chat | Future Extensions（`deferred`，无实体、无表、无字段） | 礼物集成、逐条已读/送达回执、单条仅自己删除、Message Reaction、聊天翻译与语音转文字、群聊 |
| Commerce | Product / Membership / Entitlement | Product, Price, MembershipPlan, Subscription, EntitlementDefinition, UserEntitlement |
| Commerce | Order / Payment / Refund | Order, OrderItem, Payment, PaymentTransaction, Refund |
| Commerce | Gift / Wallet | Gift, GiftTransaction, Wallet, WalletTransaction |
| Rewards | Program / Rule / Event / Grant / Delivery | RewardProgram, RewardRule, RewardEvent, RewardGrant, RewardDelivery |
| Trust & Safety | Report / Moderation / Evidence / Decision / Enforcement / Appeal（治理链路 6 表，`baseline`） | Report, ModerationCase, ModerationEvidence, ModerationDecision, EnforcementAction, Appeal |
| Trust & Safety | Verification（真人认证，本会话未重新设计，`designing`） | VerificationCase, VerificationMedia |
| Trust & Safety | _旧实体名 `ReviewTask`/`ReviewDecision`/`ModerationAction`/`Restriction`/`Ban`/`UserBlock` 已被 6 表模型取代（`superseded`）；`UserBlock` 归 Social（`social_blocks`，D-034）_ | — |
| Operations | 运营主体 / RBAC / 操作审计 | Operator, Role, OperatorRole, RolePermission, OperatorAuditLog |
| Platform | Feature Flags / Runtime Config | FeatureFlag, FeatureFlagOverride, RuntimeConfig |
| Platform | App Version / Announcement / Region | AppVersion, Announcement, Region |
| Platform | _旧实体名 `FeatureRule`/`ConfigItem`/`ConfigVersion`/`RegionPolicy`/`VersionPolicy`/`AuditLog`/`Notification`/`NotificationTemplate`/`MediaAsset` 已被六表模型取代（`superseded`）：覆盖规则归 `feature_flag_overrides`；V1 无配置版本模型；Audit 归 Operations（`operator_audit_logs`）；Notification 不建；Media/Asset 归 Platform Infrastructure_ | — |
| Platform Infrastructure（非业务域，不计入业务表数量） | Outbox / Media / Asset | `system_outbox_events`（全系统唯一一套，`source_domain` 区分来源，不按域分表）；统一 Asset/Media 基础设施（asset_id UUID、storage provider、bucket、object key、checksum 等；业务域只存 `asset_id`） |

实体名称是业务模型基线，不自动等同于一实体一张表；只有已进入数据库设计的实体才能形成字段契约。

## 关键协作链

```text
User → LearningProfile → Course → Lesson → Exercise → Progress
User → SocialProfile → Follow → Mutual Follow → Match → Conversation → Message
SocialProfile → SocialPost → Like / Comment
User → Verification
Commerce / Rewards / Promotion → Entitlement
Learning / Social / Identity → RewardEvent → RewardRule → RewardGrant → RewardDelivery → Commerce → Wallet（V1）
```

- 首期公开动态、点赞、评论和举报入口属于 Social；**Community 不再作为独立 Domain**，其能力已并入 Social，不重复拥有这些事实表（全局最终版 [ADR-018](../adr/ADR-018-global-database-design-principles-final.md)）。
- Match 是双向 Follow 的业务结果，由应用服务创建，不由数据库触发器隐式生成。
- `social_blocks` 是 Social 的用户主动 Block 关系（Social relationship fact）；Trust & Safety 的 `enforcement_actions` 是平台处罚事实（Ban / Suspend / Restrict），可跨域限制 Discover、Follow、公开互动和 Chat。**`social_blocks ≠ enforcement_actions`，两者永不合并、不互为实现**（D-034，正式冻结于 D-116）。
- Gift 交易属于 Commerce。**Chat 与礼物的集成属 `deferred`，当前不存在 `GiftMessageReference` 或任何 Chat 侧礼物实体；**领域边界原则仍然成立——礼物交易真相属于 Commerce，Chat 最多只消费已完成的送礼结果，但该原则在集成被正式设计前不产生任何 Chat 实体或字段。
- Chat 的 Conversation 与 Social Match 解耦：Match 授予聊天权限，会话身份由用户对唯一确定；取消关注、解除匹配、重新互关都不改变会话身份，历史消息仍然存在。
- 聊天权限在发送时由 `canChat()` 读取 Social 与 Trust & Safety 暴露的事实判断；Chat 表不保存 `match_id`、`follow_id` 或 relationship status。完整契约见 [Chat 应用服务与事件](../domains/chat/application-and-events.md)。
- Chat 全域审计最终修正版（会话消息 [64]+[71]）：`chat_conversation` / `chat_message` 使用 `public_id uuid` 作为跨域 logical ID；Chat 内部保留 `bigint identity` PK（不对外）；`user_id` / `sender_user_id` / `asset_id` 一律存 logical UUID 且**不建跨域物理 FK**；`chat_conversation.last_message_id` 在 message 建表后追加域内 FK。完整清单与 37 条 application-level invariants 见 [Chat 数据库](../domains/chat/database.md)。
- 实时推送不形成独立业务域：Chat 在事务提交后发布领域事件，WebSocket/App Push 由 Application/Infrastructure 负责。主方案已明确否决为推送临时新增 Notification Domain。
- Rewards 与 Commerce 的边界：Rewards 只产生奖励决定（Grant）与幂等发放（Delivery），资产入账（V1 奖励资产 Coin）由 Commerce 执行；跨域引用（`grant_no`、`source_reference_id`、`idempotency_key` 等）一律是逻辑业务引用，Rewards 表不建跨域 FK。完整契约见 [Rewards 应用服务与事件](../domains/rewards/application-and-events.md)。
- Trust & Safety 的域边界（设计 Trust & Safety 会话，全域审计最终确认）：Trust 只拥有举报→审核案件→证据→决定→处置→申诉的治理事实，只引用跨域对象稳定逻辑 ID（**`subject_domain + subject_type + subject_id` 三元组**，证据侧对应 `reference_domain + reference_type + reference_id`），不建跨域 FK、不持有被审核业务对象正文；**`trust.reports` 是全系统唯一举报事实源**，Social / Chat / Commerce 只提供举报入口 API，原 Social `social_reports` / `post_reports` / `profile_reports` 已删除；所有 moderator / reviewer / operator 字段引用 **Operations logical UUID（`operations.operators.id`）**，普通用户字段引用 Identity logical UUID；`content_remove` / `social_post_restrict` / `chat_send_restrict` 等处置统一经 **`system_outbox_events`**（不建 Trust 专属 Outbox）由 Social / Chat 自行变更自身状态，Trust 不直接 `UPDATE` 他域。完整契约见 [Trust & Safety 域](../domains/trust/index.md) 与 [Trust 数据库](../domains/trust/database.md)。
- Operations 的域边界（设计运营域会话）：Operations 是后台控制平面（Backoffice Control Plane），只负责「后台运营主体 + RBAC 后台授权 + 后台操作审计」，**不承接任何业务域状态机**（封禁/举报归 Trust、退款归 Commerce、奖励补发归 Rewards）；C 端 User 与后台 Operator 是两个主体；权限能力由应用代码 Permission Registry 定义（不建 `permissions` 表），数据库只配置 Role ↔ permission key；`operators.auth_subject_id` 引用 Identity/Auth 认证主体逻辑 ID、`operator_audit_logs.target_*` 引用他域实体逻辑 ID，均不建跨域 FK。完整契约见 [Operations 域](../domains/operations/index.md) 与 [Operations 数据库](../domains/operations/database.md)。
- Platform 的域边界（设计 Platform Domain 会话）：Platform 是产品运行控制面，只拥有跨业务域的产品运行控制数据；**能明确归属某业务域的配置一律回该域**（Business Rule ≠ Platform Config）；Feature Flag 不代替领域状态机（`user_123_banned` 属错误设计）；Operations 管理 Platform 但不拥有 Platform 数据，`created_by`/`updated_by` 等审计字段不进 Platform；V1 冻结六表（`feature_flags`/`feature_flag_overrides`/`runtime_configs`/`app_versions`/`announcements`/`regions`），`runtime_configs` 仅 current-state（无版本/回滚），其他域不建指向 `platform.regions` 的跨域 FK（跨域用 `region_code` 逻辑引用）。完整契约见 [Platform 域](../domains/platform/index.md) 与 [Platform 数据库](../domains/platform/database.md)。
- 全局最终版（[ADR-018](../adr/ADR-018-global-database-design-principles-final.md)）：9 个业务 Domain；**一个业务事实只有一个 authoritative owner**；跨域只通过 logical UUID + Domain Service / Event / Outbox 协作，禁止跨域直接写库与跨域物理 FK；历史事实不物理删除、当前关系按业务语义删除、字典/配置优先 `disabled`/`inactive`/`retired`、临时高容量数据按 retention 清理；Media/Asset 与 `system_outbox_events` 属 Platform Infrastructure，不侵占业务 Domain ownership。
