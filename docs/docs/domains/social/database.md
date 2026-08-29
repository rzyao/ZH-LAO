---
status: frozen
last_updated: 2026-08-30
schema: social
---

# Social 数据库总览

Social Schema 第一阶段冻结为 **20 张表**。字段和约束的唯一事实源在各规格页；本页只维护表清单和跨章节关系。

| 组 | 表 | 规格 |
| --- | --- | --- |
| 资料 | `social_profiles`、`social_profile_photos`、`social_interests`、`social_profile_interests`、`social_profile_languages`、`social_prompt_templates`、`social_profile_prompts` | [资料](profile.md) |
| 偏好/发现 | `social_preferences`、`social_preference_genders`、`social_preference_countries`、`social_preference_goals`、`social_discovery_exposures` | [偏好与关系](discovery-and-relationships.md) |
| 关系 | `social_follows`、`social_matches`、`social_blocks` | [偏好与关系](discovery-and-relationships.md) |
| 内容/互动 | `social_posts`、`social_post_media`、`social_post_likes`、`social_post_comments`、`social_reports` | [动态](community-content.md) |

## 完整性与服务边界

- 外键、复合主键、CHECK 和 partial unique index 守护可由数据库表达的完整性；表均位于 `social` Schema，跨 Schema FK 遵循[数据库总规范](../../architecture/database.md)。
- Follow 互关生成/结束 Match、审核后的资料发布资格、候选的双向偏好兼容、位置重排、内容可见性和 Block 的跨域拦截均由应用服务在事务中执行，不使用 Trigger。
- `media_id` 是对 Platform `media_assets` 的引用契约；Social 不保存 URL、桶或文件元数据。
- 当前审核列只表示业务对象的展示资格；完整审核历史、案件、限制和申诉属于 Trust & Safety。

## 索引意图

已冻结的关键索引为：Profile 的 `UNIQUE(user_id)`；照片和 Prompt 的活动记录 partial unique index；兴趣/语言/偏好关系复合主键；Follow 的双向读取索引；当前 Match 的规范化 pair partial unique index；Block pair 主键；Post `(profile_id, published_at)`；Like `(post_id, profile_id)`；Comment `(post_id, created_at)`；Exposure `(viewer_profile_id, candidate_profile_id, exposed_at)`。实际 migration 时再对查询计划复核，禁止机械添加低选择性单列索引。

## 明确不建

首期不建 `social_profile_views`、`social_favorites`、`social_follow_requests`、`social_dislikes`、`social_discovery_candidates`、`social_discovery_dismissals`、`social_events`、`social_match_members`、`social_gift_sends` 或 `social_profile_stats`。后者仅是未来缓存概念，真相仍来自 Follow、Match、Post 和 Like。
