---
status: baseline
last_updated: 2026-08-30
---

# 会话覆盖清单

覆盖标准不是逐字复制对话，而是每条有效产品规则、边界、实体、字段、约束、反例和延期项都有唯一事实源。

## “数据库域设计 / 继续设计社交资料”会话

来源：父会话「数据库域设计」（内部 ID `6a92f0c0-90b4-83ea-a43d-cccb1ef2666d`，覆盖产品战略至 Learning）；其延续「设计社交资料」（Social Domain 全部设计）分享 `https://chatgpt.com/share/6a9356bb-36bc-83ea-a835-5551dfb2afc7`，共 52 条消息，正文已导出至 `docs/sources/chatgpt_share_6a9356bb/`。会话包含两次定稿：原始收尾审查（20 表）与「全域审计修正版定稿」（消息 [45] 指令 + [52] 产出，19 表最终版）；另有「在新会话设计 Chat Domain 的提示词」回合（消息 [40]+[44]，其承载的规则已由 Chat 会话正式定稿覆盖）。

| 会话阶段 | 已覆盖内容 | 文档 |
| --- | --- | --- |
| 产品战略问答 | 用户目标、规模、平台、市场、指标、运营约束 | [产品定位](../product/product-overview.md) |
| 产品支柱收敛 | 学习范围、双边价值、商业模式、社交资格、聊天范围 | [产品定位](../product/product-overview.md)、[业务模型](../product/business-model.md) |
| 社交与运营规则 | Follow/Match、Feed、礼物、奖励、推荐、功能开放 | [业务模型](../product/business-model.md)、[功能开放](../product/feature-rollout.md) |
| 一级 Domain Map | 十个域、职责、非职责和依赖 | [Domain Map](../architecture/domain-map.md) |
| 三层实体地图 | Domain、Subdomain、Core Entity | [Domain Map](../architecture/domain-map.md)、[领域入口](../domains/index.md) |
| PostgreSQL 总规范 | 十个 Schema、十二项规则、ID/Public ID（后经全局修订为 9 业务 Schema + Final 十二项，见 [ADR-018](../adr/ADR-018-global-database-design-principles-final.md)） | [数据库规范](../architecture/database.md) |
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
| Social 收尾审查 | 20 首期表、首期不建表、内容/互动/举报边界与缓存原则（后被修正版定稿调整为 19 表） | [Social 数据库](../domains/social/database.md)、[Social 动态](../domains/social/community-content.md) |
| 全域审计修正版定稿（[45]→[52]） | 删 `social_reports`（19 表）；六实体 `public_id` UUID；`user_id`/`media_id` 跨域 logical UUID、零跨域物理 FK；照片/Prompt active partial UNIQUE；Match active partial UNIQUE + 历史保留；单母语 partial UNIQUE；Post/Media/Like/Comment 四表完整字段规格（`visibility` 等）；Exposure 无永久唯一 + 三方向索引 + 90 天 retention；跨表 invariant 归 Application/Domain Service；25 条最终不可违反规则 | [Social 数据库](../domains/social/database.md)、[Social 资料](../domains/social/profile.md)、[Social 发现](../domains/social/discovery-and-relationships.md)、[Social 动态](../domains/social/community-content.md)、[设计台账](design-register.md) D-135~D-138 |
| Chat 域设计提示词回合（[40]+[44]） | 承接规则清单（匹配后聊天永久免费、`paused` 不影响 Match、礼物跨域暂不设计、Media/Notification/Moderation 不进 Chat）——后续均由「设计聊天领域」会话正式定稿 | [Chat](../domains/chat/index.md)、[ADR-011](../adr/ADR-011-chat-conversation-identity-and-direct-uniqueness.md) |
| 明确延期内容 | 支付、礼物兑换、技术栈和未完成字段 | [未决事项](open-questions.md) |

## “数据库域设计”会话（全局规范修订）

来源：分享 `https://chatgpt.com/share/6a9314bc-4ed0-83ea-8127-baf221a1a4ad`（标题「数据库域设计」，共 96 条消息）。用户在消息 [89] 指令：基于已确定的全局架构做一次**全局规范修订**（不重新设计数据库、不推翻已定稿 Domain），把全域审计发现的规范冲突修正为最高级规则；助手在消息 [95] 产出「全局数据库设计原则最终版」。

| 会话阶段 | 已覆盖内容 | 文档 |
| --- | --- | --- |
| 最终 Domain Map | 9 业务域；Community 并入 Social；Notification 非独立域；`system_outbox_events` 属 Platform Infrastructure | [Domain Map](../architecture/domain-map.md)、[ADR-018](../adr/ADR-018-global-database-design-principles-final.md) |
| 最终 ID 策略 | 混合主键（各域自定 BIGINT/UUID）；跨域引用的聚合根/业务实体须有 UUID logical/public ID；跨域永不引用内部 BIGINT PK | [数据库规范](../architecture/database.md)、[ADR-018](../adr/ADR-018-global-database-design-principles-final.md) |
| 最终 FK 策略 | 域内真实 PostgreSQL FK；跨域只存 logical UUID 不建物理 FK | [数据库规范](../architecture/database.md)、[ADR-018](../adr/ADR-018-global-database-design-principles-final.md) |
| Canonical Fact 单一归属 | 一个业务事实一个 authoritative owner；跨域经 logical UUID + Service/Event/Outbox；禁止跨域直接写库与复制事实 | [ADR-018](../adr/ADR-018-global-database-design-principles-final.md)、[Domain Map](../architecture/domain-map.md) |
| 统一删除策略 | 历史事实不物理删除；当前关系按业务语义删除；字典/配置优先 disabled/inactive/retired；临时高容量数据 retention 清理 | [ADR-018](../adr/ADR-018-global-database-design-principles-final.md) |
| Infrastructure 边界 | Outbox 与统一 Asset/Media 基础设施属 Platform Infrastructure，不计入业务 Domain 与业务表数量；业务域只存 asset_id | [ADR-018](../adr/ADR-018-global-database-design-principles-final.md)、[Domain Map](../architecture/domain-map.md) |

## “设计聊天领域”会话

来源：ChatGPT 内部会话 ID `6a9319c2-2204-83ea-9341-7a57757a3082`；可访问的分享副本 `https://chatgpt.com/share/6a9329e5-9f28-83ea-8eb1-f85be6e414fa`（标题「设计聊天领域」，共 71 条消息）。会话以“把 Chat Domain 所有表定稿”收尾后，又追加「Chat 与 Message 域命名」问答与「全域审计后的最终修正版」（消息 [64] 指令 + [71] 产出），本文档按最终修正版为准。以内部会话 ID 直接拼出的分享链接当前返回 `Conversation has been deleted`，回溯请以 share URL 为准。

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
| Chat vs Message 域命名 | 用户询问「Chat 和 message 哪个更适合当本域的名字」；最终固定 **Chat Domain**，明确不建议 Messaging（易与 Kafka/RabbitMQ 消息中间件混淆）；核心聚合 Conversation、核心实体 Message | [Chat 域命名裁决](../domains/chat/index.md)、[ADR-015](../adr/ADR-015-chat-naming-and-sql-adjudication.md) |
| 全域审计最终修正版（[64]→[71]） | `public_id` 定为 **UUID**（取代早期 `varchar(32)`）；内部 BIGINT `id` 保留为 Chat 内部身份；跨域引用统一 logical UUID 且**删除所有跨域物理 FK**（Identity user / Media asset 只存 UUID，无 `match_id`）；移除 `last_message_seq/id/at` 组合 CHECK；`last_message_id` 在 message 建表后补 FK；Direct 两成员不变量升级为 application-level cross-row invariant；37 条 application-level invariants 定稿 | [Chat 数据库](../domains/chat/database.md)、[会话模型](../domains/chat/conversation.md)、[消息模型](../domains/chat/message.md)、[设计台账](design-register.md) D-130~D-134 |

## “设计 Commerce Domain”会话

来源：`6a933931-27f8-83ea-9df3-b054d2bca5fe`（分享 URL 同名），共 77 条消息。会话先按 Product → Price → Gift → Wallet → Ledger → Order → Payment → GiftSend → Refund 逐张设计，以“把所有表都定稿”产出 **Commerce Schema V1（16 张业务表）**；随后用户追加一次「全域审计后的确认性修订」（消息 [70] 指令 + [77] 产出「Commerce Domain 最终确认版 / Final Audited Contract」）：**主体模型与 16 表不变，只正式确立跨域 logical UUID 契约、把 `reward_grant` 改名 `reward_delivery`、加强 Gift/Rewards/Media 边界与原子性不变量。**

| 会话阶段 | 已覆盖内容 | 文档 |
| --- | --- | --- |
| Commerce 边界与资金真相 | 不让 Social/Chat 处理钱；Chat 送礼只展示；账务真相归 Commerce | [ADR-016](../adr/ADR-016-commerce-money-and-append-only-ledger.md)、[Commerce](../domains/commerce/index.md) |
| 虚拟币钱包模型 | 真钱充值→Coins→送礼消费；V1 单资产、无冻结、无分桶 | [Commerce](../domains/commerce/index.md)、[Commerce 数据库](../domains/commerce/database.md) |
| 五大内部模块与 16 表清单 | Catalog/Ordering/Payment/Wallet/Gifting；Refund 归入 Payment 组落 2 表 | [Commerce](../domains/commerce/index.md)、[Commerce 数据库](../domains/commerce/database.md) |
| Catalog 三表 | 商品类型 CHECK、价格区间与渠道唯一、不存 total；Product 与 Gift 分离 | [Commerce 数据库](../domains/commerce/database.md) |
| Ordering 三表 | 订单幂等与金额 CHECK、Snapshot、履约类型与状态 | [Commerce 数据库](../domains/commerce/database.md) |
| Payment 两表 | Provider 枚举、服务端验证、Webhook 原始事实与幂等 | [Commerce 数据库](../domains/commerce/database.md) |
| Wallet 与 Ledger | 余额快照、append-only、before/after 平衡、六类 business_type、统一 WalletService | [Commerce 数据库](../domains/commerce/database.md)、[ADR-016](../adr/ADR-016-commerce-money-and-append-only-ledger.md) |
| Reward 边界问答 + 审计修订 | Reward 独立域，经 `RewardDelivery` 请求 Commerce 发放、不直写钱包；`business_type` `reward_grant`→`reward_delivery` | [Commerce 数据库](../domains/commerce/database.md)、D-067 |
| Adjustment / Reversal 问答与建模 | 二者语义差异、只存成功事实、冲正不变量 | [Commerce 数据库](../domains/commerce/database.md)、D-065 |
| `commerce_gift_sends` | 只存成功/冲正、快照、跨域 conversation_id、送礼事务四合一 | [Commerce 数据库](../domains/commerce/database.md)、D-071 |
| Refund / RefundRecovery | 全额退款规则、与 Refund 不合并、回收仅在退款成功后 | [Commerce 数据库](../domains/commerce/database.md)、D-070 |
| 金额与两套单位 | 真钱 amount_minor+currency，Coins bigint，不用 currency='COIN' | [Commerce 数据库](../domains/commerce/database.md)、D-072 |
| 总体收口审查 | 状态机分列、删除策略、跨表应用层规则、明确不建表清单 | [Commerce 数据库](../domains/commerce/database.md)、D-074~D-076 |
| 全域审计确认修订（[70]→[77]） | 16 表不变；跨域引用统一 logical/public UUID（禁引他域内部 BIGINT PK）、域内 FK 保留、跨域不建 physical FK；`reward_grant`→`reward_delivery`；Rewards 经 RewardDelivery 不直写钱包；gift_sends 唯一 canonical、Chat 只引用；Media 只存 asset_id；受控冗余保留+一致性；原子 Wallet+Ledger 升为强制不变量 | [Commerce 数据库](../domains/commerce/database.md)「与全局 SQL 规范的关系 / Final Audited Contract」、[ADR-016](../adr/ADR-016-commerce-money-and-append-only-ledger.md)、[ADR-018](../adr/ADR-018-global-database-design-principles-final.md)、D-066/D-067/D-077/D-078 |

## “设计奖励域”会话

来源：分享 `https://chatgpt.com/share/6a933fa4-8d30-83ea-a28f-5d8c39fb5fac`（标题「设计奖励域」，共 39 条消息：32 条定稿 + 7 条全域审计确认修订）。会话以「Rewards Domain 审计通过，可以按本版正式冻结」收尾。正文已导出至 `_session/shares/6a933fa4-v3/`。

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
| 明确不建 / 延期 | 13 类表不建、无 claim、Manual Grant 不做、权益型奖励与新资产延后（Outbox 统一方式已由审计确认） | [Rewards](../domains/rewards/index.md)、[未决事项](open-questions.md) |
| 与全局 SQL 规范 | `bigint identity` 主键与全局规范一致；**审计后跨域引用统一 `uuid` logical reference 且不建跨域 FK**，全局政策仍待裁决（D-077/D-078） | [Rewards 数据库](../domains/rewards/database.md)「与全局 SQL 规范的关系」 |
| 全域审计确认修订（[33]-[39]） | 跨域 5 字段改 `uuid`（source_event_id/subject_user_id/source_reference_id/user_id/target_reference_id）；Rewards 不建独立 outbox 表（统一 `system_outbox_events`）；Grant=奖励权益事实非到账事实；Program 不新增 INACTIVE；确认 7 条幂等规则与删除策略 | [Rewards 数据库](../domains/rewards/database.md)「跨 Domain Logical Reference」、[设计台账](design-register.md) D-096 |
| 与旧模型关系 | 早期 Contribution/Scoring（ScoreRecord 计分）模型被 5 表模型取代 | [设计台账](design-register.md) D-017 `superseded` |

## "设计 Trust & Safety Domain"会话

来源：分享 `https://chatgpt.com/share/6a93401c-51bc-83ea-aa6e-ac314a5af8c8`（标题「设计安全治理域」）。用户以「继续设计 Trust & Safety Domain。请承接之前已经确定的整体架构和数据库设计原则。不能越过域边界」开场，并连续以「依次完成所有表的设计」「做一次最终审计定稿」「全域审计后的最终确认」推进且未反对，会话以「Trust & Safety Domain 全域审计后的最终确认定稿」+「`trust.reports` 是系统唯一举报事实源」收尾。正文已导出至 `docs/sources/chatgpt_share_6a93401c/`。

> **重抓记录（2026-08-30）**：用户在原会话中继续做了修订并重新保存分享链接，导出正文由 28 条消息增至 **37 条消息**（新增「全域审计后的最终确认定稿」共 40 节，含最终 6 表确认清单与 24 条最终跨域原则）。ChatGPT 分享页是快照，仅在重新保存分享后才反映改动；本清单与 Trust 文档已按重抓正文更新。

| 会话阶段 | 已覆盖内容 | 文档 |
| --- | --- | --- |
| 总体原则承袭 | 分域、跨域只引用不侵入、UUID+域内FK+跨域逻辑ID（原与旧全局规范冲突，已由 ADR-018 裁决为标准写法，D-092）、varchar+CHECK、timestamptz、核心事实不可变、无 Trigger | [数据库规范](../architecture/database.md)、[Trust 数据库](../domains/trust/database.md) |
| Trust 域边界 | 只拥有举报→审核→证据→决定→处置→申诉链路；不拥有资料/动态/关注/会话/消息/订单/礼物/奖励；不直改他域（T&S-12） | [Domain Map](../architecture/domain-map.md)、[Trust 域](../domains/trust/index.md) |
| 6 表逻辑模型 | reports/moderation_cases/moderation_evidence/moderation_decisions/enforcement_actions/appeals 字段、约束、索引、状态枚举 | [Trust 数据库](../domains/trust/database.md) |
| 最终审计定稿 | 删/改 12 处（reports 不可变、evidence 类型/来源拆开、decision 去重复时间、enforcement active→applied、加 cancelled、细化社交/聊天限制、appeal_id 保留处罚修改史） | [Trust 数据库](../domains/trust/database.md)、[设计台账](design-register.md) D-090/D-091 |
| 统一 subject 协议（**已升级**） | 由 `subject_type+subject_id` 升级为三元组 `subject_domain+subject_type+subject_id`（域白名单 identity/social/chat/commerce）；证据侧 `reference_domain+reference_type+reference_id`；enforcement 内容级目标加 `subject_domain`；索引前缀同步改写 | [Trust 数据库](../domains/trust/database.md)、[设计台账](design-register.md) D-113（取代 D-093） |
| 治理参与方身份（**新增**） | moderator/reviewer/operator 字段统一引用 Operations logical ID `operations.operators.id`（assigned/added_by/decided_by/reviewer_operator_id）；普通用户仍用 Identity ID；evidence actor 拆为 submitted_by_user_id + added_by_operator_id | [Trust 数据库](../domains/trust/database.md)「跨域逻辑 ID 清单」、[设计台账](design-register.md) D-114 |
| 唯一举报事实源（**新增**） | `trust.reports` 冻结为全系统唯一 canonical user report fact；他域只提供举报入口 API；原 Social `social_reports`/`post_reports`/`profile_reports` 正式删除 | [Trust 数据库](../domains/trust/database.md)、[Social 动态](../domains/social/community-content.md)、[设计台账](design-register.md) D-115 |
| Block 与处罚分离（**新增**） | `social_blocks ≠ enforcement_actions` 正式冻结；Trust 不拥有 Social Follow/Block/Match、Chat 会话消息、Commerce 钱包账本订单 | [Trust 域](../domains/trust/index.md)、[设计台账](design-register.md) D-116（冻结 D-034） |
| 域边界事件（**细化**） | 处置由属主域执行；跨域传播统一走项目级 `system_outbox_events`（enforcement.applied/expired/revoked/cancelled/failed，按 enforcement_action_id 幂等），不建 Trust 专属 Outbox | [Trust 域](../domains/trust/index.md)、[设计台账](design-register.md) D-095/D-117 |
| 最终不可违反规则 | Invariants T&S-01..20（T&S-04/T&S-13 已按三元组改写）+ 24 条最终跨域原则 | [Trust 数据库](../domains/trust/database.md) |
| 真人认证未设计 | Verification 子域本会话未重新设计；旧实体 superseded | [Trust 域](../domains/trust/index.md)、[设计台账](design-register.md) D-094 |

## "设计运营域"会话

来源：分享 `https://chatgpt.com/share/6a9351a6-17b8-83ea-b172-5f58121a431f`（标题「设计运营域」，共 34 条消息，其中多个助手回合为插件被 redacted / 空内容）。用户以「继续设计 Operations Domain。请承接之前已经确定的整体架构和数据库设计原则。不能越过域边界」开场，并连续以「逐张定稿这 5 张表」「继续完成所有表的审计」「全域审计后的最终确认修订」推进且未反对；会话以「Operations Domain 可以正式视为数据库层设计定稿」+「最终 5 表确认版」收尾。正文已导出至 `docs/sources/chatgpt_share_6a9351a6/`。

| 会话阶段 | 已覆盖内容 | 文档 |
| --- | --- | --- |
| 域边界与定位 | Operations = 后台运营主体 + RBAC + 操作审计（Backoffice Control Plane）；不承接业务域状态机；C 端 User ≠ Operator；不建 16 类后台表 | [Operations 域](../domains/operations/index.md)、[设计台账](design-register.md) D-105 |
| 权限模型 | 不建 `permissions` 表；代码 Permission Registry 定义能力；key 格式 `<domain>.<resource>.<action>`；有效权限 = active Role 权限并集；无层级/无 deny/`super_admin` 只是 Role | [Operations 数据库](../domains/operations/database.md)、[设计台账](design-register.md) D-106 |
| `operations.operators` | 6 字段定稿：`id varchar(20)` 稳定系统 ID、`auth_subject_id` UNIQUE 跨域逻辑引用无 FK、status active/disabled、不软删不硬删只 disabled | [Operations 数据库](../domains/operations/database.md)、[设计台账](design-register.md) D-107 |
| `operations.roles` | 7 字段定稿：`code` UNIQUE + lower_snake_case 不可改、status active/disabled、无 is_system/无角色层级 | [Operations 数据库](../domains/operations/database.md)、[设计台账](design-register.md) D-108 |
| `operations.operator_roles` | PK(operator_id,role_id) + 反向索引 + 域内 FK RESTRICT；无 status；解绑即删关系、历史进审计；active 校验由应用服务强制 | [Operations 数据库](../domains/operations/database.md)、[设计台账](design-register.md) D-109 |
| `operations.role_permissions` | PK(role_id,permission_key)；仅 role FK；CHECK 三段 key；应用层校验 Registry | [Operations 数据库](../domains/operations/database.md)、[设计台账](design-register.md) D-110 |
| `operations.operator_audit_logs` | 10 字段定稿：append-only 永久、target 三元组 polymorphic logical reference 无跨域 FK、details jsonb object、ip `inet`、4 索引、无 status/result、不建 Trigger | [Operations 数据库](../domains/operations/database.md)、[设计台账](design-register.md) D-111 |
| 全域审计最终确认 | 5 表保持不变；删除策略矩阵；Audit 与 Trust 职责划分（Operations 记录轨迹、Trust 保存事实）；18 条不可违反规则 | [Operations 域](../domains/operations/index.md)、[设计台账](design-register.md) D-112、[ADR-019](../adr/ADR-019-operations-backoffice-control-plane.md) |
| 与旧模型关系 | 旧 StaffAccount/StaffRole/Permission/WorkQueue/ContentPublishTask/UserOperation/MetricDefinition/Dashboard 草案被 5 表模型取代 | [设计台账](design-register.md) D-105 `superseded` |

## "设计 Platform Domain"会话

来源：分享 `https://chatgpt.com/share/6a9351eb-de4c-83e9-80fe-18dba4fd6eda`（标题「设计平台域」，共 33 条消息，其中多个助手回合为插件被 redacted / 空内容）。用户以「继续设计 Platform Domain。请承接之前已经确定的整体架构和数据库设计原则。不能越过域边界」开场，以「逐张定稿」「继续完成所有表」推进，最后以明确的全域审计修订指令（固定 6 表、`runtime_configs` 能力边界裁决、删除策略补齐、Outbox/Media 基础设施归位）收尾；会话结论为「可以把本版本作为 Platform Domain 最终审计定稿 / authoritative schema specification」。正文已导出至 `docs/sources/chatgpt_share_6a9351eb/`。

| 会话阶段 | 已覆盖内容 | 文档 |
| --- | --- | --- |
| 域定位与边界 | Platform = Product Runtime Control Plane；逐域列出不负责清单（Identity/Social/Chat/Commerce/Rewards/Trust/Operations）；5 类能力、6 张候选表；明确不建的万能表清单 | [Platform 域](../domains/platform/index.md)、[设计台账](design-register.md) D-118/D-119 |
| `platform.feature_flags` 定稿 | 8 字段；`key` 格式与不可修改/不复用；`name` 不 UNIQUE；`default_enabled` 为 fallback 非总开关；`status` active/inactive/retired（inactive = master kill switch，retired 终态）；求值规则；0 FK、仅 UNIQUE(key)、不建低基数索引、禁 JSONB | [Platform 数据库](../domains/platform/database.md)、[设计台账](design-register.md) D-120 |
| 其余五表定稿 | `feature_flag_overrides`（三 scope、禁 Global Override、partial UNIQUE×3、优先级）、`runtime_configs`（JSONB + value_type）、`app_versions`（status×policy 合法组合、build 唯一）、`announcements`（public_id、时间窗口、不建 scheduled/expired）、`regions`（code 格式、不建 GIS） | [Platform 数据库](../domains/platform/database.md)、[设计台账](design-register.md) D-121~D-125 |
| 全域审计最终修正版 | ① `feature_flags` 增加 `status = 'active' OR default_enabled = FALSE` 一致性约束；② `runtime_configs` 裁决为仅 current-state，不得宣称版本历史/回滚；③ `app_versions`/`announcements` 补齐删除策略（发布历史保留）；④ `regions` 跨域只认 `region_code` 逻辑引用，他域不建 FK；⑤ `system_outbox_events` 归共享基础设施且全系统唯一一套；⑥ Media/Asset Infrastructure 冻结为 `asset_id` 权威技术属主 | [Platform 数据库](../domains/platform/database.md)、[设计台账](design-register.md) D-120~D-127 |
| 统一删除策略 | 状态化退役 / 当前关系可 DELETE / 保留发布历史 / infrastructure append-oriented + retention 四分类 | [Platform 数据库](../domains/platform/database.md)、[设计台账](design-register.md) D-126 |
| 最终不可违反规则 | PLATFORM-01..17（六表不变、key 不复用、禁 Global Override、runtime config 能力边界、发布历史保留、region 非 GIS、outbox 唯一、asset_id 单一属主、删除策略分类） | [Platform 数据库](../domains/platform/database.md) |
| 与旧模型关系 | 旧 FeatureRule/ConfigItem/ConfigVersion/RegionPolicy/VersionPolicy/MediaAsset/Notification/NotificationTemplate/AuditLog 实体被六表模型取代 | [设计台账](design-register.md) D-128 `superseded` |
| 明确遗留 | Media/Asset 物理表与生命周期枚举、`system_outbox_events` 物理字段、`regions.name` 多语言（Localization）、TTS 路由配置归 Learning（该遗留已由 D-142 解决：TTS 参数归 TTS 服务自维护，Audio 域存 `audio_default_presets`，Learning 不落路由表） | [未决事项](open-questions.md)、[设计台账](design-register.md) D-129 |

## "设计音频生产域"会话

来源：分享 `https://chatgpt.com/share/6a93716e-8a28-83ea-abbd-355679b38fe2`（标题「设计音频生产域」，提取定稿）。正文已导出至 `docs/sources/chatgpt_share_6a93716e/`。会话定稿 Audio Production Domain 为第 10 个业务域（Schema `audio`，9 张业务表字段级定稿），并以 [ADR-020](../adr/ADR-020-audio-production-domain.md) 记录独立成域决策。（业务域计数此后经 [ADR-021](../adr/ADR-021-content-and-learning-domain-split.md)/D-147 拆分 Learning 为 Content + Learning，现为 **11** 个。）

| 会话阶段 | 已覆盖内容 | 文档 |
| --- | --- | --- |
| 域定位与边界 | 业务音频的生产/版本/审核/发布/重试/批量/审计统一归 Audio；非通用媒体文件域；与 Content 为 C 模式协作（canonical 内容与规范发音归 Content，Audio 独立生产并保存输入快照——「Learning 拥有」的会话原表述已由 D-148 修订为 Content 拥有） | [Audio 域](../domains/audio/index.md)、[ADR-020](../adr/ADR-020-audio-production-domain.md) |
| 核心对象模型 | Slot → Task → Generation Attempt（仅 TTS）→ Asset Version → Review；`audio_slots.official_asset_version_id` 唯一 canonical pointer；fresh/stale 判定（stale 不清空 official pointer） | [Audio 域](../domains/audio/index.md)、[设计台账](design-register.md) D-140 |
| 9 表字段级定稿 | `audio_slots`/`audio_tasks`/`audio_generation_attempts`/`audio_asset_versions`/`audio_reviews`/`audio_task_events`/`audio_task_batches`/`audio_task_batch_items`/`audio_default_presets` 的字段、约束、索引、状态枚举 | [Audio 数据库](../domains/audio/database.md) |
| 生产与失败语义 | V1 `tts`（主）+`human_recording`（兜底）；技术失败 = 同 Task 新 Attempt；审核 Reject = 旧 Task 结束 + successor Task（`predecessor_task_id`）；每次生产一个候选；一个 Asset Version 一个文件；人工录音不伪造 Attempt | [Audio 域](../domains/audio/index.md)、[设计台账](design-register.md) D-141 |
| TTS 契约 | Provider/Model/Voice/Preset 归 TTS 服务自维护；只存 `tts_preset_key` 使用事实与 `audio_default_presets` 默认映射；TTS 异步执行、自行上传 Cloudflare R2、不留原始生成文件 | [Audio 域](../domains/audio/index.md)、[设计台账](design-register.md) D-142（解决 D-129 TTS 路由遗留） |
| 审核与发布 | `audio_reviews` append-only（decision/reject_reason CHECK）；approved ≠ published；发布原子事务；曾发布文件永久保留；未发布 rejected 文件异步清理（不建 cleanup jobs 表） | [Audio 数据库](../domains/audio/database.md)、[设计台账](design-register.md) D-143 |
| 幂等/并发/批处理 | 三层并发（业务唯一约束 + Idempotency Key/request_id + `lock_version`）；同 Slot 至多一个 active Task（partial UNIQUE 六状态）；Attempt 唯一约束与 worker/callback 并发控制；Batch 只批量创建 Task（key+`request_hash` 幂等） | [Audio 数据库](../domains/audio/database.md)、[设计台账](design-register.md) D-144 |
| 取代 Learning 旧音频表 | 旧 `pronunciation_audios`/`tts_jobs`（D-028 表级）`superseded`；Learning 必建表计数（43）相应调整；明确不建清单（TTS 参数历史表、cleanup jobs 表、Publish History/current-official/regeneration/human recording attempt/多格式 variant 表、`is_current` 类字段） | [设计台账](design-register.md) D-145、[Learning AI & Media](../domains/learning/ai-media.md) |
| 边界衔接遗留 | `audio_asset_versions` 自持文件事实（R2 直连、`storage_key` 全表 UNIQUE）与 D-127「Media/Asset Infrastructure 为 asset_id 权威技术属主」的边界冲突待主会话裁决；Audio operator 字段引用 Operations logical ID 的类型口径沿用 D-107 未决项 | [未决事项](open-questions.md)、[设计台账](design-register.md) D-146 |

## "拆分学习域"会话

来源：分享 `https://chatgpt.com/share/6a937088-e570-83e9-912e-11cc3de27eba`（标题「拆分学习域」，共 11 条消息）。用户消息 [03] 指令「全域数据库最终审计把学习域拆分为内容域和学习域」，助手消息 [11] 产出「全域数据库最终审计修订：Learning 拆分为 Content + Learning」的**最终裁决**（`:::writing` 文档）。会话结论为正式裁决：原 Learning Domain 按职责拆分，**不重新设计已定稿数据模型**。正文已导出至 `docs/sources/chatgpt_share_6a937088/`。

| 会话阶段 | 已覆盖内容 | 文档 |
| --- | --- | --- |
| 拆分裁决 | Learning 正式拆为 **Content Domain**（Canonical Learning Content：课程/单元/Lesson/词汇/句子/教学文本/内容组织/语言信息/标准答案/标准发音要求/内容版本/Content Revision/发布状态，「零用户时依然存在」）与 **Learning Domain**（User Learning State & Facts：课程/Lesson/Unit 进度、词汇/句子学习状态、完成记录、掌握状态、学习历史、复习状态、学习统计 facts，「用户开始学习后才产生」）；依赖 `Identity → Learning → Content`（逻辑箭头）；Learning 可存 `content_id/course_id/lesson_id/unit_id/vocabulary_id/sentence_id` logical references；被跨域引用的 Content 实体须有稳定 UUID logical/public ID；Learning→Content、Learning→Identity 不建物理 FK；事实严格分离（Learning 不复制第二份 canonical 内容）；Content Revision 归 Content、Learning 只记录学习时对应的 revision；Schema 拆 `content.*`/`learning.*`；不因拆分重新设计已定稿表 | [Domain Map](../architecture/domain-map.md)、[Content 域](../domains/content/index.md)、[Content 数据库](../domains/content/database.md)、[Learning 数据库](../domains/learning/database.md)、[设计台账](design-register.md) D-147、[ADR-021](../adr/ADR-021-content-and-learning-domain-split.md) |
| Audio Production 契约同步 | 文本/正确发音要求/Content Revision 由 Content 拥有；依赖 `Audio Production → Content`（而非 → Learning）；Content 提供 `content_entity_id/content_revision_id` 稳定 logical UUID；Audio 仍只负责生产 | [Audio 域](../domains/audio/index.md)、[设计台账](design-register.md) D-148、[ADR-020](../adr/ADR-020-audio-production-domain.md) |
| 事件归属与跨域引用 | 内容事件归 Content（content_created/updated/published/revision_created、lesson_published）；学习行为事件归 Learning（learning_started/lesson_completed/vocabulary_learned/review_completed/progress_updated）；他域引用教学内容 → Content logical UUID、引用学习事实 → Learning logical UUID；`content_id` 与 `learning_record_id/progress_id` 不得混用 | [Content 域](../domains/content/index.md)、[Domain Map](../architecture/domain-map.md)、[设计台账](design-register.md) D-149 |
| 显式保留 | 原有已定稿业务模型继续有效；除 Domain ownership / Schema 名 / 跨域 logical reference 调整外，不增加、删除或重新设计业务表；全域其他已定稿 Domain 保持不变 | [设计台账](design-register.md) D-147、[未决事项](open-questions.md) |
