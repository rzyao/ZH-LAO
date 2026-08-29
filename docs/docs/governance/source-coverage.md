---
status: baseline
last_updated: 2026-08-30
---

# “数据库域设计”会话覆盖清单

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

覆盖标准不是逐字复制对话，而是每条有效产品规则、边界、实体、字段、约束、反例和延期项都有唯一事实源。
