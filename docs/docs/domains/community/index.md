---
status: deferred
last_updated: 2026-08-30
---

# Community 域（历史归档）

> **归档说明**：Community 已正式并入 Social Domain（全局最终版 [ADR-018](../../adr/ADR-018-global-database-design-principles-final.md)），**不再是独立 Domain、不再拥有独立 PostgreSQL Schema**。动态、点赞、评论、Feed 等社区能力归 Social。本页仅作为迁移记录/历史文档保留，不得与 11 个正式业务 Domain 并列使用。

Community 保留为未来独立社区能力的评估入口。最新 Social 设计已将首期公开动态、点赞、评论和举报入口冻结为 `social_*` 表，因此 Community 当前不重复拥有这些事实。

## 子域与实体

- Future Community：CommunityPolicy、CommunitySpace、专属内容/互动模型（均 `designing`）。

## 业务基线

- 首期文字/图片动态、点赞、评论和 Social 举报入口的唯一事实源是 [Social 动态规格](../social/community-content.md)。
- 后续若出现独立社区场景，再定义其内容所有权和与 Social 的关系；不得复制 `social_posts` 等模型。

## 数据库状态

独立 Community 的业务模型和数据库均为 `deferred`。
