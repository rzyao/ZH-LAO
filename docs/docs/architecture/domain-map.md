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
| Messaging | 会话、参与者、文字/图片/语音消息、送达、已读、撤回、翻译、礼物消息引用 | 礼物商品、支付和资产变化 |
| Commerce | 商品、价格、会员、权益、订单、支付、退款、礼物和虚拟资产账本 | 贡献评分 |
| Rewards | 贡献事件、评分规则、得分记录、奖励和活动 | 订单、支付、权益消费判定 |
| Trust & Safety | 真人认证、审核案件、内容处置、跨域限制、封禁、申诉 | 用户根状态、`social_blocks` 当前关系事实 |
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
| Messaging | Conversation / Message / Content | Conversation, Participant, Message, TextMessage, ImageMessage, VoiceMessage |
| Messaging | Delivery / Recall / Translation / Gift Message | MessageReceipt, MessageRecall, MessageTranslation, GiftMessageReference |
| Commerce | Product / Membership / Entitlement | Product, Price, MembershipPlan, Subscription, EntitlementDefinition, UserEntitlement |
| Commerce | Order / Payment / Refund | Order, OrderItem, Payment, PaymentTransaction, Refund |
| Commerce | Gift / Wallet | Gift, GiftTransaction, Wallet, WalletTransaction |
| Rewards | Contribution / Scoring / Reward / Campaign | ContributionEvent, ContributionRule, ScoreRecord, RewardDefinition, RewardGrant, RewardCampaign |
| Trust & Safety | Verification / Review / Report | VerificationCase, VerificationMedia, ReviewTask, ReviewDecision, Report |
| Trust & Safety | Moderation / Ban / Block / Appeal | ModerationCase, ModerationAction, Restriction, Ban, UserBlock, Appeal |
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
Commerce.GiftTransaction → Messaging.GiftMessageReference
```

- 首期公开动态、点赞、评论和举报入口属于 Social；Community 不重复拥有这些事实表。
- Match 是双向 Follow 的业务结果，由应用服务创建，不由数据库触发器隐式生成。
- `social_blocks` 是 Social 的用户主动 Block 关系；Trust & Safety 的 Restriction/Moderation 可跨域限制 Discover、Follow、公开互动和 Messaging。
- Gift 交易属于 Commerce，展示引用属于 Messaging。
