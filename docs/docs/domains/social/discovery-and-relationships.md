---
status: frozen
last_updated: 2026-08-30
---

# Social 偏好、发现与关系

## 偏好是双向硬条件

`social_preferences` 与 Profile 逻辑 1:1，创建 Profile 时同步创建：`profile_id BIGINT PRIMARY KEY`、可空 `min_age/max_age SMALLINT`、审计时间。每个年龄值为 NULL 或 `18..100`，且双值存在时 `min_age<=max_age`。

多选条件正规化为 `social_preference_genders(profile_id, gender)`、`social_preference_countries(profile_id, country_code)`、`social_preference_goals(profile_id, relationship_goal)`；均以 `(profile_id, value)` 为复合主键并引用 Profile。某子表零记录统一表示该维度“不限”，绝不使用 `all/any` 伪值。

Discovery 必须同时满足 A 接受 B **且** B 接受 A；偏好只负责筛除，不保存算法权重。首期产品仅暴露有限筛选（性别、年龄、国家、目标），避免小规模候选池被筛空。

## Discovery 与 Exposure

候选资格由现有事实实时计算，不建永久 `social_discovery_candidates`。最低条件：不是自己、双方资料可参与发现、任一方向均无 Block、双向硬偏好兼容、没有必须排除的关系。已 Match、以及已有任一方向 Follow 的对象从普通 Discovery 移除。

唯一持久化的发现行为是：

```sql
social_discovery_exposures (
  id BIGINT identity PK,
  viewer_profile_id BIGINT NOT NULL,
  candidate_profile_id BIGINT NOT NULL,
  source VARCHAR(30) NOT NULL DEFAULT 'discovery',
  exposed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (viewer_profile_id <> candidate_profile_id)
)
```

它回答“谁何时真正被展示过”，用于短期去重和线上业务；首期不存 score、rank、算法版本、请求/会话 ID。返回候选不等于曝光：仅客户端实际展示卡片后才写入该表。可重复展示必须产生多行，不能以 viewer/candidate pair 作主键。

首期 cooldown 是“最近 7 天不重复展示”，但它是产品配置，按最后曝光时间计算，不存 `next_show_at`。优先排除顺序为 Block → 当前 Follow/Match → 硬偏好 → Exposure cooldown → 软排序。索引冻结为 `(viewer_profile_id, exposed_at DESC)` 和 `(viewer_profile_id, candidate_profile_id, exposed_at DESC)`；这是高增长行为表，未来可将 90 天外数据归档/聚合，但首期不做分区或归档系统。

## Follow、Match、Block

`social_follows` 是单向事实；行包含 `follower_profile_id`、`followed_profile_id`、`created_at`，以 pair 为主键/唯一约束且 `CHECK` 禁止自关注。为“我关注的人”和“关注我的人”建立相反方向读取索引。Follow 直接生效，没有请求、Like、Dislike 或 Favorite 的平行图谱。

`social_matches` 保存二元关系历史：`id` identity PK、两个 profile FK、`status`（当前匹配与结束状态）、`matched_at`、`ended_at` 和审计。服务层将 pair 规范化（低 ID 在前）并以当前有效 pair 的 partial unique index 防止重复；互关时建立、取消任何一方 Follow 时结束，但绝不删除历史。Match 永远两人，不建成员表，不存 `conversation_id/last_message_at/unread_count`。

`social_blocks` 保存单向 Block 的事实（blocker 与 blocked profile 的 pair、时间；pair 主键并禁止自 Block）。生效后服务层在 Discover、Follow、公共互动和 Messaging 发送入口统一拒绝双方新动作。它不删除历史 Follow/Match/消息；当前表由 Social 维护，Trust & Safety 拥有跨域 restriction、处罚、申诉及完整执法历史。

## 生命周期规则

- `paused`：只退出普通 Discovery，既有 Match 与聊天继续。
- `closed`：关闭 Social 功能，不等同于账号注销或物理删除；未来是否恢复原资料仍为 deferred。
- Match 后聊天免费，聊天建立方式/Conversation 生命周期留给 Messaging 规格。
- 推荐可使用共同兴趣、语言互补、完整度、社交活跃度、新用户适度加权和小范围随机扰动作可配置软排序；没有持久候选真相、模型训练数据或算法分数表。语言互补是强信号而不是资格门槛。
- 普通 Discovery 排除已有任一 Follow；关系 UI 必须另提供“我关注的、关注我的、已匹配”入口，均由 Follow/Match 查询得出，不建新表。
