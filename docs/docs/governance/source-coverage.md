---
status: baseline
last_updated: 2026-08-30
---

# 会话覆盖清单

覆盖标准不是逐字复制对话，而是每条有效产品规则、边界、实体、字段、约束、反例和延期项都有唯一事实源。

## “数据库域设计 / 继续设计社交资料”会话

| 会话阶段 | 已覆盖内容 | 文档 |
| --- | --- | --- |
| 产品战略问答 | 用户目标、规模、平台、市场、指标、运营约束 | [产品定位](../product/product-overview.md) |
| 产品支柱收敛 | 学习范围、双边价值、商业模式、社交资格、聊天范围 | [产品定位](../product/product-overview.md)、[业务模型](../product/business-model.md) |
| 社交与运营规则 | Follow/Match、Feed、礼物、奖励、推荐、功能开放 | [业务模型](../product/business-model.md)、[功能开放](../product/feature-rollout.md) |
| 一级 Domain Map | 十个域、职责、非职责和依赖 | [Domain Map](../architecture/domain-map.md) |
| 三层实体地图 | Domain、Subdomain、Core Entity | [Domain Map](../architecture/domain-map.md)、[领域入口](../domains/index.md) |
| PostgreSQL 总规范 | 十个 Schema、十二项规则、ID/Public ID | [数据库规范](../architecture/database.md) |
| Identity 核心 SQL | users、auth_identities、basic_profiles、learning_profiles | [Identity 数据库](../domains/identity/database.md) |
| Identity 补全 | OTP、Session、状态、Device、游客转正式用户 | [Identity 模型](../domains/identity/model.md)、[流程](../domains/identity/flows.md) |
| Learning 骨架 | Knowledge/Curriculum/Practice/Progress/Dictionary/Pronunciation | [Learning 模型](../domains/learning/model.md) |
| Learning Knowledge DDL | Registry、中文/老挝语知识、Meaning/Translation/Example/Pronunciation 的字段、约束、索引、删除策略 | [Knowledge](../domains/learning/knowledge.md) |
| Learning Curriculum DDL | Course → Unit → Lesson → Section → LessonItem、发布与版本原则 | [Curriculum](../domains/learning/curriculum.md) |
| Learning Practice DDL | 七张练习表、题型、JSONB 答案、评分和历史不可破坏性 | [Practice](../domains/learning/practice.md) |
| Learning Progress DDL | Activity、Progress、Mastery、Review、Bookmark，以及不建的状态表 | [Progress](../domains/learning/progress.md) |
| Learning Dictionary DDL | Meaning/Example 升级、Equivalent、Relation、Tag、Search History 与 pg_trgm | [Dictionary](../domains/learning/dictionary.md) |
| Learning AI/Media DDL | PronunciationAudio、TTS Job、Translation Request、MediaAsset 与 Entitlement 边界 | [AI & Media](../domains/learning/ai-media.md) |
| Learning 第一版表清单 | 43 张必建表、1 张 optional question_reviews、替代关系；会话口述 44 的算术差异已记录 | [Learning 数据库](../domains/learning/database.md) |
| Social Profile | 唯一公开资料、照片、兴趣、语言、Prompt、审核可见性、软删除和 partial unique index | [Social 资料](../domains/social/profile.md) |
| Social Preferences / Discovery | 多选偏好、零记录不限、双向硬兼容、实时候选、Exposure | [Social 发现](../domains/social/discovery-and-relationships.md) |
| Social Relationships | 直接 Follow、互关 Match、取消关注结束历史、Block 与免费聊天边界 | [Social 关系](../domains/social/discovery-and-relationships.md) |
| Social 收尾审查 | 20 首期表、首期不建表、内容/互动/举报边界与缓存原则 | [Social 数据库](../domains/social/database.md)、[Social 动态](../domains/social/community-content.md) |
| 明确延期内容 | 支付、礼物兑换、技术栈和未完成字段 | [未决事项](open-questions.md) |

## “设计聊天领域”会话

来源：ChatGPT 内部会话 ID `6a9319c2-2204-83ea-9341-7a57757a3082`；可访问的分享副本 `https://chatgpt.com/share/6a9329e5-9f28-83ea-8eb1-f85be6e414fa`（标题「设计聊天领域」，共 58 条消息、19 个有效助手回合）。会话以“把 Chat Domain 所有表定稿”收尾。以内部会话 ID 直接拼出的分享链接当前返回 `Conversation has been deleted`，回溯请以 share URL 为准。

| 会话阶段 | 已覆盖内容 | 文档 |
| --- | --- | --- |
| Chat 领域边界与定位 | 只负责会话与消息；不维护社交关系、不持有媒体、不记账、不实现推送 | [Chat](../domains/chat/index.md) |
| `chat_conversation` | 极简聚合根、type/status 枚举、明确不存在的字段、生命周期、CLOSED 语义 | [会话模型](../domains/chat/conversation.md) |
| `chat_direct_conversation` | low/high canonical ordering、用户对唯一、不存 match_id/initiator/status、getOrCreate 算法 | [会话模型](../domains/chat/conversation.md)、[ADR-011](../adr/ADR-011-chat-conversation-identity-and-direct-uniqueness.md) |
| `chat_conversation_member` | 成员真相、last_read_seq 单调游标、不建 status/left_at/unread_count、Block 不进 member | [会话模型](../domains/chat/conversation.md)、[ADR-013](../adr/ADR-013-read-state-as-cursor-not-receipt-table.md) |
| `chat_message` | id 与 seq 双职责、sender 复合 FK、type/status 枚举、reply、撤回、client_message_id 幂等 | [消息模型](../domains/chat/message.md)、[ADR-012](../adr/ADR-012-message-seq-ordering-and-idempotency.md) |
| 消息内容与附件体系 | text/image subtype、多图、asset_id 引用 Media、上传与事务分离、subtype 一致性责任 | [消息模型](../domains/chat/message.md) |
| 礼物范围收缩 | 用户明确“先不设计礼物，礼物以后在设计” | [消息模型](../domains/chat/message.md)、[未决事项](open-questions.md) |
| 撤回/删除/隐藏/清空 | 四件事区分、cleared_before_seq 可见边界、hidden_at 命名、隐藏恢复规则 | [会话模型](../domains/chat/conversation.md)、[消息模型](../domains/chat/message.md) |
| 已读与未读 | 游标模型、GREATEST 更新、markRead 校验、不建 receipt/delivery 表 | [ADR-013](../adr/ADR-013-read-state-as-cursor-not-receipt-table.md) |
| 聊天列表查询模型 | last_message_* 派生字段、置顶排序、空会话不进列表、未读聚合、摘要不落库 | [会话模型](../domains/chat/conversation.md) |
| 发送事务与并发 | 十步事务、seq 原子分配、幂等优先、服务器时间、TOCTOU 取舍、多图全有或全无 | [消息模型](../domains/chat/message.md) |
| 不新建 Notification 域 | 用户明确否决临时扩域；推送归基础设施 | [ADR-014](../adr/ADR-014-no-notification-domain-events-outbox-infra.md) |
| 领域事件与 Outbox | 三个事件、提交后发布、outbox 同事务、partial index、命名待统一 | [应用服务与事件](../domains/chat/application-and-events.md) |
| 索引设计 | 两条主动索引、UNIQUE 自带索引、明确不建的四个索引 | [Chat 数据库](../domains/chat/database.md) |
| 总审查与定稿 | 7 张表定稿、删除 member.status、新增 sender member 复合 FK、明确不建表清单 | [Chat 数据库](../domains/chat/database.md) |
| 全局规范差异 | 表名/枚举类型/主键生成方式/`public_id` 四项裁决：枚举回归 `varchar(32)+CHECK`、主键回归 `identity`、补 `public_id`、表名 `chat_*` 为已裁决例外 | [Chat 数据库](../domains/chat/database.md)、[ADR-015](../adr/ADR-015-chat-naming-and-sql-adjudication.md) |

## “设计 Commerce Domain”会话

来源：`6a933931-27f8-83ea-9df3-b054d2bca5fe`（分享 URL 同名），共 69 条消息。会话从领域边界出发，按 Product → Price → Gift → Wallet → Ledger → Order → Payment → GiftSend → Refund 逐张设计，以“把所有表都定稿”收尾，产出 **Commerce Schema V1 冻结版（16 张业务表）**。

| 会话阶段 | 已覆盖内容 | 文档 |
| --- | --- | --- |
| Commerce 边界与资金真相 | 不让 Social/Chat 处理钱；Chat 送礼只展示；账务真相归 Commerce | [ADR-016](../adr/ADR-016-commerce-money-and-append-only-ledger.md)、[Commerce](../domains/commerce/index.md) |
| 虚拟币钱包模型 | 真钱充值→Coins→送礼消费；V1 单资产、无冻结、无分桶 | [Commerce](../domains/commerce/index.md)、[Commerce 数据库](../domains/commerce/database.md) |
| 五大内部模块与 16 表清单 | Catalog/Ordering/Payment/Wallet/Gifting；Refund 归入 Payment 组落 2 表 | [Commerce](../domains/commerce/index.md)、[Commerce 数据库](../domains/commerce/database.md) |
| Catalog 三表 | 商品类型 CHECK、价格区间与渠道唯一、不存 total；Product 与 Gift 分离 | [Commerce 数据库](../domains/commerce/database.md) |
| Ordering 三表 | 订单幂等与金额 CHECK、Snapshot、履约类型与状态 | [Commerce 数据库](../domains/commerce/database.md) |
| Payment 两表 | Provider 枚举、服务端验证、Webhook 原始事实与幂等 | [Commerce 数据库](../domains/commerce/database.md) |
| Wallet 与 Ledger | 余额快照、append-only、before/after 平衡、六类 business_type、统一 WalletService | [Commerce 数据库](../domains/commerce/database.md)、[ADR-016](../adr/ADR-016-commerce-money-and-append-only-ledger.md) |
| Reward 边界问答 | Reward 独立域，Commerce 只经 `reward_grant` 记账、不含规则 | [Commerce 数据库](../domains/commerce/database.md)、D-067 |
| Adjustment / Reversal 问答与建模 | 二者语义差异、只存成功事实、冲正不变量 | [Commerce 数据库](../domains/commerce/database.md)、D-065 |
| `commerce_gift_sends` | 只存成功/冲正、快照、跨域 conversation_id、送礼事务四合一 | [Commerce 数据库](../domains/commerce/database.md)、D-071 |
| Refund / RefundRecovery | 全额退款规则、与 Refund 不合并、回收仅在退款成功后 | [Commerce 数据库](../domains/commerce/database.md)、D-070 |
| 金额与两套单位 | 真钱 amount_minor+currency，Coins bigint，不用 currency='COIN' | [Commerce 数据库](../domains/commerce/database.md)、D-072 |
| 总体收口审查 | 状态机分列、删除策略、跨表应用层规则、明确不建表清单 | [Commerce 数据库](../domains/commerce/database.md)、D-074~D-076 |
| 全局规范差异（本会话新增冲突） | UUID 主键、跨域不建 FK 两项物理约定与 D-007/D-055/ADR-015 及四域基线冲突，提交主会话裁决 | [Commerce 数据库](../domains/commerce/database.md)「与全局 SQL 规范的关系」、[未决事项](open-questions.md)、D-077/D-078 |

## “设计奖励域”会话

来源：分享 `https://chatgpt.com/share/6a933fa4-8d30-83ea-a28f-5d8c39fb5fac`（标题「设计奖励域」，共 32 条消息）。会话以「Rewards Domain 最终定稿清单（5 张表）」收尾。正文已导出至 `_session/shares/6a933fa4-8d30-83ea-a28f-5d8c39fb5fac/`。

| 会话阶段 | 已覆盖内容 | 文档 |
| --- | --- | --- |
| Rewards 边界与三层职责 | 源 Domain 定事实、Rewards 定奖励、Commerce 执行入账；不碰 Wallet/Ledger、不创建 Refund/Adjustment/Reversal、不负责 Gift | [Rewards](../domains/rewards/index.md)、[ADR-017](../adr/ADR-017-rewards-boundary-and-event-driven-grant.md) |
| 5 张表定稿 | programs/rules/events/grants/deliveries 的字段、可空性、默认值、FK/UNIQUE/CHECK/INDEX、状态枚举、删除规则；event_id NOT NULL 修正 | [Rewards 数据库](../domains/rewards/database.md) |
| 状态机与流程 | 标准奖励流程、Event/Rule/Grant/Delivery 状态机、PROCESSED/IGNORED 区分、崩溃恢复与任务租约 | [Rewards 应用服务与事件](../domains/rewards/application-and-events.md) |
| 时间规则 | 一律用 `event.occurred_at`、产品业务时区、晚到事件匹配历史有效 Rule 版本、RETIRED 可处理历史窗口迟到事件、PAUSED 只拦其后新事件 | [Rewards 应用服务与事件](../domains/rewards/application-and-events.md) |
| 幂等与并发 | 三级幂等（event/grant/delivery）、`pg_advisory_xact_lock`、`dedupe_key` 生成策略、不建 Counter 表 | [Rewards 数据库](../domains/rewards/database.md)、[Rewards 应用服务与事件](../domains/rewards/application-and-events.md) |
| 事务边界 | Grant+Delivery 同一本地事务、禁止跨域大事务、Commerce 调用在提交后异步执行、超时 → RETRY_WAIT 复用原幂等键 | [Rewards 应用服务与事件](../domains/rewards/application-and-events.md) |
| Commerce 合同 | `creditAsset` 参数与返回 `target_reference_id`、Port/Adapter、禁止 SQL JOIN 跨域 | [Rewards 应用服务与事件](../domains/rewards/application-and-events.md) |
| Admin/API/Service | 后台 API、Domain/Application Service、Policy、错误码、后台权限、日志/指标、C 端 `GET /api/me/rewards` | [Rewards 应用服务与事件](../domains/rewards/application-and-events.md) |
| 明确不建 / 延期 | 13 类表不建、无 claim、Manual Grant 不做、权益型奖励与新资产延后、Outbox 项目级统一延后 | [Rewards](../domains/rewards/index.md)、[未决事项](open-questions.md) |
| 与全局 SQL 规范 | `bigint identity` 主键与全局规范一致；本域不建跨域 FK 与 Commerce 会话倾向一致，但全局政策仍待裁决（D-077/D-078） | [Rewards 数据库](../domains/rewards/database.md)「与全局 SQL 规范的关系」 |
| 与旧模型关系 | 早期 Contribution/Scoring（ScoreRecord 计分）模型被 5 表模型取代 | [设计台账](design-register.md) D-017 `superseded` |

## "设计 Trust & Safety Domain"会话

来源：分享 `https://chatgpt.com/share/6a93401c-51bc-83ea-aa6e-ac314a5af8c8`（标题「设计安全治理域」，共 28 条消息）。用户以「继续设计 Trust & Safety Domain。请承接之前已经确定的整体架构和数据库设计原则。不能越过域边界」开场，并连续以「依次完成所有表的设计」「做一次最终审计定稿」推进且未反对，会话以「Trust & Safety Domain 可以正式冻结」收尾。正文已导出至 `docs/sources/chatgpt_share_6a93401c/`。

| 会话阶段 | 已覆盖内容 | 文档 |
| --- | --- | --- |
| 总体原则承袭 | 分域、跨域只引用不侵入、UUID+域内FK+跨域逻辑ID（与全局规范冲突，D-092）、varchar+CHECK、timestamptz、核心事实不可变、无 Trigger | [数据库规范](../architecture/database.md)、[Trust 数据库](../domains/trust/database.md) |
| Trust 域边界 | 只拥有举报→审核→证据→决定→处置→申诉链路；不拥有资料/动态/关注/会话/消息/订单/礼物/奖励；不直改他域（T&S-12） | [Domain Map](../architecture/domain-map.md)、[Trust 域](../domains/trust/index.md) |
| 6 表逻辑模型 | reports/moderation_cases/moderation_evidence/moderation_decisions/enforcement_actions/appeals 字段、约束、索引、状态枚举 | [Trust 数据库](../domains/trust/database.md) |
| 最终审计定稿 | 删/改 12 处（reports 不可变、evidence 类型/来源拆开、decision 去重复时间、enforcement active→applied、加 cancelled、细化社交/聊天限制、appeal_id 保留处罚修改史） | [Trust 数据库](../domains/trust/database.md)、[设计台账](design-register.md) D-090/D-091 |
| 统一 subject 协议 | subject_type+subject_id 稳定公共类型，不建跨域 FK | [Trust 数据库](../domains/trust/database.md)、[设计台账](design-register.md) D-093 |
| 域边界事件 | 处置经领域事件由 Social/Chat 执行 | [Trust 域](../domains/trust/index.md)、[设计台账](design-register.md) D-095 |
| 真人认证未设计 | Verification 子域本会话未重新设计；旧实体 superseded | [Trust 域](../domains/trust/index.md)、[设计台账](design-register.md) D-094 |
