---
status: baseline
last_updated: 2026-08-30
---

# Social 动态、互动与举报

此会话将公开动态和互动纳入 Social 第一阶段。表族、边界和查询路径为 `frozen`；下列少量字段枚举/长度未在会话中逐项给出，保留 `designing`，不得补造。

## 表族与职责

| 表 | 已冻结职责与引用 | 字段级状态 |
| --- | --- | --- |
| `social_posts` | Profile 发表的文字/图片动态；保存当前审核展示状态；按 `profile_id, published_at` 读取 | `designing` |
| `social_post_media` | 一条 Post 关联多份 Platform Media；不保存 URL | `designing` |
| `social_post_likes` | Profile 对 Post 的一次点赞；`(post_id, profile_id)` 唯一/主键 | `designing` |
| `social_post_comments` | Profile 对 Post 的公开评论；按 `post_id, created_at` 读取；保存当前审核展示状态 | 核心字段 `frozen` |
| ~~`social_reports`~~ | **已删除（`superseded`）**：举报事实统一归 `trust.reports`；Social 只保留举报入口 API | `superseded`（[D-115](../../governance/design-register.md)） |

Post、Comment 与 Profile/Photo/Prompt 一样只保存当前审核状态，不保存 reviewer、模型分、处罚或审核历史。媒体实际存储归 Platform；Feed、推荐训练、分析与通知不是这些表的职责。

### `social_reports` 字段契约（`superseded`，仅存历史）

> **本表已删除，不再作为最终设计存在。** Trust & Safety 会话的全域审计最终确认把 `trust.reports` 冻结为**全系统唯一** canonical user report fact：Social（以及 Chat / Commerce）只提供「举报入口 API」，校验对象存在与权限后调用 Trust 举报能力，举报事实只落 `trust.reports`；原 `social_reports` / `post_reports` / `profile_reports` 全部删除（[D-115](../../governance/design-register.md)）。
>
> 迁移映射：`reporter_profile_id` → `trust.reports.reporter_user_id`（Identity logical UUID）；`target_type + target_id` → `trust.reports.subject_domain('social') + subject_type + subject_id`；`reason_code` / `description` 语义保留；`status` **不再存在**（Report 改为不可变事实，处理状态由 `trust.moderation_cases` 表达）。目标类型映射见 [Trust 数据库](../trust/database.md) 的 `subject_type` 字典。
>
> 以下字段表仅作为历史记录保留，不得据此建表：

| 字段 | 类型/规则 |
| --- | --- |
| `id` | `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| `reporter_profile_id` | `BIGINT NOT NULL`，FK `social_profiles` |
| `target_type` / `target_id` | `VARCHAR(30) NOT NULL` / `BIGINT NOT NULL`；类型为 `profile/profile_photo/profile_prompt/post/comment` |
| `reason_code` | `VARCHAR(50) NOT NULL`；平台代码如 `spam/harassment/sexual_content/fraud/hate/violence/fake_profile/underage/illegal_content/other` |
| `description` | `VARCHAR(500)` |
| `status` | `VARCHAR(20) NOT NULL DEFAULT 'pending'`；`pending/reviewing/resolved/dismissed` |
| 审计 | `created_at`、`updated_at` 为 `TIMESTAMPTZ NOT NULL DEFAULT now()` |

（历史说明）`target_type + target_id` 曾是本表唯一允许的多态引用例外，Report Service 必须先验证目标存在；`UNIQUE(reporter_profile_id,target_type,target_id) WHERE status IN ('pending','reviewing')` 用于防重复刷举报。

仍然有效的业务结论（已迁移到 Trust）：`resolved` 只表示举报流程结束，不表示违规成立（现由 `trust.moderation_cases.status` 与 `trust.moderation_decisions.outcome` 分别表达）；**Block 与 Report 独立**，可同时发生但互不自动触发（`social_blocks ≠ enforcement_actions`，[D-116](../../governance/design-register.md)）；举报人身份仅供后台风控，不能通过 API 泄露给被举报者；防重复举报改由 `trust.reports` 侧约束表达。

### 点赞与评论细则

`social_post_likes(post_id, profile_id, created_at)` 使用复合主键；点赞取消直接物理删除，因为它是当前关系态。Like 不做 Reaction 类型、软删除或计数列。只有能看到且未被 Block 的用户才能点赞/评论；取消 Follow 不追溯删除旧互动。

`social_post_comments` 的冻结字段为：`id` identity PK、`post_id`、`profile_id`、可空 `parent_comment_id`、可空 `reply_to_profile_id`、`content VARCHAR(1000)`、`moderation_status`（`pending/approved/rejected`）、`moderated_at`、审计时间和 `deleted_at`。UI 首期限 500 字符，发布后不可编辑，只能删除。仅支持两层：根评论 `parent_comment_id=NULL`，任何回复都归属根评论；Service 必须验证 parent 属于同一 Post 且确为根评论。

根评论删除但有回复时保留“该评论已删除”占位；无回复或二级回复删除则隐藏。Post 作者可以删除其动态下的评论，但首期统一写 `deleted_at`，操作者历史留给审计。Post 删除不级联物理删除 Likes/Comments。首期不建 `social_comment_likes`。点赞/评论成功后的通知由 Notification Domain 异步处理，业务表不存 `notification_sent`。

## 边界与反例

公开动态的所有权由本次 Social 设计基线确定；先前将 Post/Like/Comment 全部归 Community 的域图已被这一结论取代。Community 已正式并入 Social（[ADR-018](../../adr/ADR-018-global-database-design-principles-final.md)），不重复定义这些 `social_*` 表。

首期不建泛化 `social_events`；曝光之所以保留，是因为它直接参与去重推荐，而不是纯分析日志。Block 与举报可能影响内容展示和互动，但 **Trust & Safety 是审核、限制、申诉与举报事实的唯一事实源**——Social 不再持有 `social_reports`，只保留举报入口 API（[D-115](../../governance/design-register.md)）。
