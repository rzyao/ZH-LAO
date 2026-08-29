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
| Social | 社交资料、照片、偏好、发现、Follow、Match、Block、首期公开动态/点赞/评论/举报入口 | 消息内容、礼物交易、审核历史、媒体文件存储 |
| Community | 未来独立社区能力及其规则（当前不拥有首期 `social_*` 动态表） | Social 的 Profile/关系/首期公开动态事实 |
| Chat | 会话实体与 Direct 身份、成员与已读游标、消息身份与会话内顺序、文本内容、图片资源引用、用户侧会话状态（置顶/免打扰/隐藏/清空）、撤回事实、聊天领域事件发布 | 媒体文件存储与 URL、礼物交易与资产变化、推送与 WebSocket 传输实现、社交关系与匹配状态、翻译结果存储 |
| Commerce | 商品、价格、会员、权益、订单、支付、退款、礼物和虚拟资产账本 | 贡献评分 |
| Rewards | 奖励计划/活动与生命周期、规则版本、接收其他域可信事件、奖励决定（Grant）、幂等发放编排（V1 奖励资产 Coin 经 Commerce 入账） | 钱包/余额/账本、调整/冲正/退款、礼物/订单/支付、计分/积分/任务/徽章（V1）、反向查询其他域验证事实、权益消费判定 |
| Trust & Safety | 真人认证、审核案件、证据、审核决定、内容处置指令、跨域限制、封禁、申诉（只产生治理处置与处置历史，经领域事件由属主域执行） | 用户根状态、`social_blocks` 当前关系事实、被审核业务对象正文 |
| Operations | 运营人员、RBAC、工作队列、内容/用户运营、数据看板 | 各业务实体所有权 |
| Platform | Feature Flag、产品配置、地区规则、媒体、通知、版本和审计基础设施 | 具体业务规则的执行 |

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
| Social | Follow / Match / Safety | Follow, Match, SocialBlock, Report |
| Social | Public Content / Interaction | SocialPost, SocialPostMedia, SocialPostLike, SocialPostComment |
| Community | Future Community | CommunityPolicy, CommunitySpace（`designing`；不重复定义当前 Social 内容） |
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
| Operations | Staff / RBAC / Workbench | StaffAccount, Role, Permission, StaffRole, WorkQueue, WorkAssignment |
| Operations | Content Ops / User Ops / Analytics | ContentPublishTask, UserOperation, MetricDefinition, Dashboard |
| Platform | Feature / Config / Region | FeatureFlag, FeatureRule, ConfigItem, ConfigVersion, Region, RegionPolicy |
| Platform | Media / Notification / App Version / Audit | MediaAsset, Notification, NotificationTemplate, AppVersion, VersionPolicy, AuditLog |

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

- 首期公开动态、点赞、评论和举报入口属于 Social；Community 不重复拥有这些事实表。
- Match 是双向 Follow 的业务结果，由应用服务创建，不由数据库触发器隐式生成。
- `social_blocks` 是 Social 的用户主动 Block 关系；Trust & Safety 的 Restriction/Moderation 可跨域限制 Discover、Follow、公开互动和 Chat。
- Gift 交易属于 Commerce。**Chat 与礼物的集成属 `deferred`，当前不存在 `GiftMessageReference` 或任何 Chat 侧礼物实体；**领域边界原则仍然成立——礼物交易真相属于 Commerce，Chat 最多只消费已完成的送礼结果，但该原则在集成被正式设计前不产生任何 Chat 实体或字段。
- Chat 的 Conversation 与 Social Match 解耦：Match 授予聊天权限，会话身份由用户对唯一确定；取消关注、解除匹配、重新互关都不改变会话身份，历史消息仍然存在。
- 聊天权限在发送时由 `canChat()` 读取 Social 与 Trust & Safety 暴露的事实判断；Chat 表不保存 `match_id`、`follow_id` 或 relationship status。完整契约见 [Chat 应用服务与事件](../domains/chat/application-and-events.md)。
- 实时推送不形成独立业务域：Chat 在事务提交后发布领域事件，WebSocket/App Push 由 Application/Infrastructure 负责。主方案已明确否决为推送临时新增 Notification Domain。
- Rewards 与 Commerce 的边界：Rewards 只产生奖励决定（Grant）与幂等发放（Delivery），资产入账（V1 奖励资产 Coin）由 Commerce 执行；跨域引用（`grant_no`、`source_reference_id`、`idempotency_key` 等）一律是逻辑业务引用，Rewards 表不建跨域 FK。完整契约见 [Rewards 应用服务与事件](../domains/rewards/application-and-events.md)。
- Trust & Safety 的域边界（设计 Trust & Safety 会话）：Trust 只拥有举报→审核案件→证据→决定→处置→申诉的治理事实，只引用跨域对象稳定逻辑 ID（`subject_type + subject_id`），不建跨域 FK、不持有被审核业务对象正文；`content_remove` / `social_post_restrict` / `chat_send_restrict` 等处置经领域事件由 Social / Chat 自行变更自身状态，Trust 不直接 `UPDATE` 他域。完整契约见 [Trust & Safety 域](../domains/trust/index.md) 与 [Trust 数据库](../domains/trust/database.md)。
