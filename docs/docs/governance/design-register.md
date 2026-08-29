---
status: baseline
last_updated: 2026-08-30
source_conversation: 数据库域设计；继续设计社交资料
source_conversation_id: 6a92f0c0-90b4-83ea-a43d-cccb1ef2666d；6a931551-8a30-83e9-8caf-60e529abce68
---

# 设计决策台账

来源：ChatGPT 会话“数据库域设计”。用户明确选择，以及方案提出后以“继续/继续下一步”推进且未反对，均视为当前基线。

| ID | 结论 | 状态 | 事实源 | 备注 |
| --- | --- | --- | --- | --- |
| D-001 | 学习获客留存，社交建立关系，社交效率与礼物为主要商业化 | `baseline` | [产品定位](../product/product-overview.md) | 双边平台 |
| D-002 | Android 首发，中老同时服务，约 10,000 注册用户 | `baseline` | [产品定位](../product/product-overview.md) | 注册量与 DAU/MAU |
| D-003 | 学习全年龄，社交资格/资料/认证独立 | `baseline` | [产品定位](../product/product-overview.md) | 前期人工审核 |
| D-004 | 主要能力提前建设，以 Flag 和配置逐层开放 | `baseline` | [功能开放](../product/feature-rollout.md) | 非单一 social 开关 |
| D-005 | 十个一级 Domain | `baseline` | [Domain Map](../architecture/domain-map.md) | Language 合并进 Learning |
| D-006 | 模块化单体、一个主库、十个 Schema | `baseline` | [ADR-001](../adr/ADR-001-modular-monolith-and-domain-schemas.md) | 允许跨 Schema FK |
| D-007 | PostgreSQL 十二项全局规范 | `baseline` | [数据库规范](../architecture/database.md) | 数据库守完整性 |
| D-008 | User、AuthIdentity、BasicProfile、LearningProfile 分离 | `frozen` | [ADR-002](../adr/ADR-002-separate-user-identities-and-profiles.md) | 避免万能 users |
| D-009 | 游客不创建 User；手机号 E.164；学习方向固定 | `frozen` | [Identity 模型](../domains/identity/model.md) | 游客云同步 deferred |
| D-010 | Identity 七张表 | `frozen` | [Identity 数据库](../domains/identity/database.md) | 辅助表类型局部 designing |
| D-011 | User Status 为 active/disabled/closed | `frozen` | [Identity 数据库](../domains/identity/database.md) | suspended 已被取代 |
| D-012 | Follow 单向，互关由应用服务生成 Match | `baseline` | [ADR-003](../adr/ADR-003-follow-mutual-follow-match.md) | Match 后免费聊天 |
| D-013 | Block 归 Trust & Safety | `superseded` | [Social 关系](../domains/social/discovery-and-relationships.md) | 被 D-034 取代；Trust 仍拥有执法历史 |
| D-014 | 礼物交易归 Commerce，消息只引用交易 | `baseline` | [Commerce](../domains/commerce/README.md) | 支持多入口送礼 |
| D-015 | Commerce/Rewards 通过 Entitlement 统一授予能力 | `baseline` | [ADR-005](../adr/ADR-005-entitlement-centered-authorization.md) | 不使用 is_vip |
| D-016 | 推荐采用硬筛选 + 可配置解释性评分 | `baseline` | [功能开放](../product/feature-rollout.md) | 不做 ML 推荐 |
| D-017 | Rewards 使用贡献事件、规则、条件、上限和奖励 | `baseline` | [Rewards](../domains/rewards/README.md) | 示例分值 illustrative |
| D-018 | Learning 知识分语言，课程/练习/进度统一 | `baseline` | [Learning 模型](../domains/learning/model.md) | 不强求语言学对称 |
| D-019 | Learning 使用 Content Registry | `baseline` | [ADR-004](../adr/ADR-004-learning-content-registry.md) | 禁止万能多态 FK |
| D-020 | Learning 第一版 43 张必建表与可选 question_reviews | `frozen` | [Learning 数据库](../domains/learning/database.md) | 会话口述 44，最终表名去重后为 43 |
| D-021 | `users.status=suspended` | `superseded` | [Identity 模型](../domains/identity/model.md) | 被 D-011 与 Restriction 替代 |
| D-022 | UserBlock 属于 Social | `superseded` | [Social 关系](../domains/social/discovery-and-relationships.md) | 中间曾移入 Trust；最终由 D-034 明确为 Social 当前关系事实 |
| D-023 | Knowledge Content 不物理删除；Registry 类型匹配由 Learning Service 校验 | `frozen` | [Knowledge](../domains/learning/knowledge.md) | 关系表可编辑 |
| D-024 | 课程层采用 Course → Unit → Lesson → Section → LessonItem | `frozen` | [Curriculum](../domains/learning/curriculum.md) | 仅 Course/Lesson 有发布状态 |
| D-025 | Practice 结构化定义，用户答案 JSONB | `frozen` | [Practice](../domains/learning/practice.md) | 题型按交互方式建模 |
| D-026 | Activity 历史与 Progress/Mastery/Review 当前状态分离 | `frozen` | [Progress](../domains/learning/progress.md) | 非 Event Sourcing |
| D-027 | Dictionary 复用 Knowledge；Equivalent、Relation、Tag 与 PostgreSQL pg_trgm 搜索 | `frozen` | [Dictionary](../domains/learning/dictionary.md) | 不建 dictionary_entries |
| D-028 | Pronunciation 与 Audio 拆分；TTS 使用异步 Job | `frozen` | [AI & Media](../domains/learning/ai-media.md) | Media 归 Platform |
| D-029 | 正式 Translation 与即时 Translation Request 分离 | `frozen` | [AI & Media](../domains/learning/ai-media.md) | 即时结果不自动入知识库 |
| D-030 | pronunciations.audio_media_id/voice | `superseded` | [Learning 数据库](../domains/learning/database.md) | 被 pronunciation_audios 取代 |
| D-031 | meanings.meaning 与仅 Content 级 examples | `superseded` | [Learning 数据库](../domains/learning/database.md) | 分别改为 definition/status 和可选 meaning_id |
| D-032 | Social 首期 20 张表与 Social Profile 聚合 | `frozen` | [Social 数据库](../domains/social/database.md) | 来源“继续设计社交资料”；资料、偏好、关系和曝光完整冻结 |
| D-033 | Discovery 实时算候选，只持久化 Exposure | `frozen` | [Social 发现](../domains/social/discovery-and-relationships.md) | 双向硬偏好；候选缓存不是事实源 |
| D-034 | `social_blocks` 为 Social 当前用户 Block 关系 | `frozen` | [Social 关系](../domains/social/discovery-and-relationships.md) | Trust & Safety 保留 restriction、审核和处罚所有权 |
| D-035 | 首期公开动态/互动/举报入口归 Social | `baseline` | [Social 动态](../domains/social/community-content.md) | 具体字段仍 `designing`；先前 Community 所有权被取代 |
| D-036 | 首期不建访客、收藏、关注请求、Candidate、事件或统计缓存表 | `frozen` | [Social 数据库](../domains/social/database.md) | `social_profile_stats` 仅未来缓存概念 |

新增主会话结论时，先更新本台账，再更新唯一事实源和覆盖清单。
