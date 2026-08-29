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
| 三层实体地图 | Domain、Subdomain、Core Entity | [Domain Map](../architecture/domain-map.md)、[领域入口](../domains/README.md) |
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

来源：`6a9329e5-9f28-83ea-8eb1-f85be6e414fa`，共 58 条消息、19 个有效助手回合。会话以“把 Chat Domain 所有表定稿”收尾。

| 会话阶段 | 已覆盖内容 | 文档 |
| --- | --- | --- |
| Chat 领域边界与定位 | 只负责会话与消息；不维护社交关系、不持有媒体、不记账、不实现推送 | [Messaging](../domains/messaging/README.md) |
| `chat_conversation` | 极简聚合根、type/status 枚举、明确不存在的字段、生命周期、CLOSED 语义 | [会话模型](../domains/messaging/conversation.md) |
| `chat_direct_conversation` | low/high canonical ordering、用户对唯一、不存 match_id/initiator/status、getOrCreate 算法 | [会话模型](../domains/messaging/conversation.md)、[ADR-011](../adr/ADR-011-chat-conversation-identity-and-direct-uniqueness.md) |
| `chat_conversation_member` | 成员真相、last_read_seq 单调游标、不建 status/left_at/unread_count、Block 不进 member | [会话模型](../domains/messaging/conversation.md)、[ADR-013](../adr/ADR-013-read-state-as-cursor-not-receipt-table.md) |
| `chat_message` | id 与 seq 双职责、sender 复合 FK、type/status 枚举、reply、撤回、client_message_id 幂等 | [消息模型](../domains/messaging/message.md)、[ADR-012](../adr/ADR-012-message-seq-ordering-and-idempotency.md) |
| 消息内容与附件体系 | text/image subtype、多图、asset_id 引用 Media、上传与事务分离、subtype 一致性责任 | [消息模型](../domains/messaging/message.md) |
| 礼物范围收缩 | 用户明确“先不设计礼物，礼物以后在设计” | [消息模型](../domains/messaging/message.md)、[未决事项](open-questions.md) |
| 撤回/删除/隐藏/清空 | 四件事区分、cleared_before_seq 可见边界、hidden_at 命名、隐藏恢复规则 | [会话模型](../domains/messaging/conversation.md)、[消息模型](../domains/messaging/message.md) |
| 已读与未读 | 游标模型、GREATEST 更新、markRead 校验、不建 receipt/delivery 表 | [ADR-013](../adr/ADR-013-read-state-as-cursor-not-receipt-table.md) |
| 聊天列表查询模型 | last_message_* 派生字段、置顶排序、空会话不进列表、未读聚合、摘要不落库 | [会话模型](../domains/messaging/conversation.md) |
| 发送事务与并发 | 十步事务、seq 原子分配、幂等优先、服务器时间、TOCTOU 取舍、多图全有或全无 | [消息模型](../domains/messaging/message.md) |
| 不新建 Notification 域 | 用户明确否决临时扩域；推送归基础设施 | [ADR-014](../adr/ADR-014-no-notification-domain-events-outbox-infra.md) |
| 领域事件与 Outbox | 三个事件、提交后发布、outbox 同事务、partial index、命名待统一 | [应用服务与事件](../domains/messaging/application-and-events.md) |
| 索引设计 | 两条主动索引、UNIQUE 自带索引、明确不建的四个索引 | [Messaging 数据库](../domains/messaging/database.md) |
| 总审查与定稿 | 7 张表定稿、删除 member.status、新增 sender member 复合 FK、明确不建表清单 | [Messaging 数据库](../domains/messaging/database.md) |
| 全局规范差异 | 表名、枚举类型、主键生成方式三处偏差提交主会话裁决 | [Messaging 数据库](../domains/messaging/database.md)、[未决事项](open-questions.md) |
