---
status: frozen
last_updated: 2026-08-30
schema: social
---

# Social 数据库总览

Social Schema 第一阶段冻结为 **19 张表**（原 20 张，`social_reports` 已删除，见下）；「全域审计修正版定稿」（消息 [45] 指令 + [52] 产出，[D-135~D-138](../../governance/design-register.md)）为本版最终依据。字段和约束的唯一事实源在各规格页；本页只维护表清单和跨章节关系。

| 组 | 表 | 规格 |
| --- | --- | --- |
| 资料 | `social_profiles`、`social_profile_photos`、`social_interests`、`social_profile_interests`、`social_profile_languages`、`social_prompt_templates`、`social_profile_prompts` | [资料](profile.md) |
| 偏好/发现 | `social_preferences`、`social_preference_genders`、`social_preference_countries`、`social_preference_goals`、`social_discovery_exposures` | [偏好与关系](discovery-and-relationships.md) |
| 关系 | `social_follows`、`social_matches`、`social_blocks` | [偏好与关系](discovery-and-relationships.md) |
| 内容/互动 | `social_posts`、`social_post_media`、`social_post_likes`、`social_post_comments` | [动态](community-content.md) |

> **`social_reports` 已删除（`superseded`）。** Trust & Safety 会话的全域审计最终确认将 `trust.reports` 冻结为**全系统唯一** canonical user report fact；Social 只保留举报入口 API，不再持有举报事实表（[D-115](../../governance/design-register.md)，与 [D-099](../../governance/design-register.md) Canonical Fact 单一归属、[ADR-018](../../adr/ADR-018-global-database-design-principles-final.md)「对已有定稿 Domain 的机械性修订指引」一致；Social 会话修正版定稿从 Social 侧正式确认，[D-135](../../governance/design-register.md)）。表数量因此由 20 → 19。

## 跨域 ID 契约（修正版定稿）

- Social 内部继续使用 `BIGINT GENERATED ALWAYS AS IDENTITY` 主键与域内真实 FK；**BIGINT 不允许作为跨域契约暴露**（[D-136](../../governance/design-register.md)，与 [D-097/D-098](../../governance/design-register.md)、ADR-018 一致）。
- 六个可被 Trust/Chat/Operations 引用的实体拥有稳定 `public_id UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE`：Profile、Profile Photo、Profile Prompt、Match、Post、Post Comment。
- 跨域字段一律 logical UUID 且**无物理 FK**：`social_profiles.user_id UUID`（Identity）、`social_profile_photos.media_id UUID` 与 `social_post_media.media_id UUID`（Media/Asset）。Chat 引用 Match 只能存 `match_public_id`；Trust 举报 Social 内容用 `subject_domain='social' + subject_type + public_id`。

## 完整性与服务边界

- 外键、复合主键、CHECK 和 partial unique index 守护可由数据库表达的完整性；**跨 Domain 引用一律 logical UUID、零物理 FK**，表均位于 `social` Schema（[数据库总规范](../../architecture/database.md)）。
- Follow 互关生成/结束 Match、审核后的资料发布资格（含 approved 主照片）、候选的双向偏好兼容、位置重排、内容可见性、Post「文字或图片至少一个」、评论 parent 归属和 Block 的联动拦截均由应用服务在事务中执行，不使用 Trigger，也不伪装成跨表 CHECK（[D-138](../../governance/design-register.md)）。
- `media_id` 是对 Media/Asset Infrastructure 的 logical UUID 引用契约；Social 不保存 URL、桶或文件元数据。
- 当前审核列只表示业务对象的展示资格；完整审核历史、案件、限制和申诉属于 Trust & Safety。

## 索引意图

已冻结的关键索引为：Profile 的 `UNIQUE(user_id)` 与 `UNIQUE(public_id)`；照片和 Prompt 的活动记录 partial unique index；母语 partial unique index（`profile_id WHERE is_native`）；兴趣/语言/偏好关系复合主键；Follow 的双向读取索引（`(following_profile_id, created_at DESC)`）；当前 Match 的规范化 pair partial unique index（`WHERE status='active'`）；Block pair 主键；Post `(profile_id, published_at DESC)` partial（未删+approved+已发布）；Like `(post_id, profile_id)` 主键与 `(profile_id, created_at DESC)`；Comment `(post_id, created_at)` 与二级回复 partial index；Exposure 三个方向索引（viewer 时间线、candidate 时间线、viewer+candidate+时间）且**无永久唯一约束**。实际 migration 时再对查询计划复核，禁止机械添加低选择性单列索引。

## Retention

`social_discovery_exposures` 为高增长行为事实：在线热数据保留最近 **90 天**，超期可归档或删除，第一阶段由定时清理任务实现；不做数据库 CHECK 或自动分区；长期统计需求进分析系统（[D-137](../../governance/design-register.md)）。

## 明确不建

首期不建 `social_profile_views`、`social_favorites`、`social_follow_requests`、`social_dislikes`、`social_discovery_candidates`、`social_discovery_dismissals`、`social_events`、`social_match_members`、`social_gift_sends` 或 `social_profile_stats`。后者仅是未来缓存概念，真相仍来自 Follow、Match、Post 和 Like。
