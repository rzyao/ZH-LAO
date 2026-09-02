---
status: baseline
last_updated: 2026-08-30
source: 数据库域设计
---

# 业务与商业模型

## 双边业务飞轮

```text
学习内容 → 用户增长与留存 → 双边用户池
→ 动态/发现/主页 → Follow → Mutual Follow → Match
→ 免费聊天与跨语言翻译 → 关系和活跃
→ 社交权益与虚拟礼物
```

Community 形成另一条关系入口：发布内容 → 曝光 → 关注 → 互动 → 互相关注 → Match → 聊天 → 持续发布。

## 社交关系

- Follow 是唯一单向关系源，不同时维护 Like、Favorite 等重复关系。
- A Follow B 且 B Follow A 时，由应用服务产生 Match。
- Match 是业务结果；Conversation 在 Match 之后建立。
- Match 后正常聊天永久免费，不以消息次数或聊天权限阻断已建立关系。
- 用户主动 Block 的当前关系事实归 Social `social_blocks`；Trust & Safety 负责跨域 restriction、审核与处罚历史。两者均可限制发现、关注、公开互动和消息。

## 收入模型

### 学习收入

采用基础免费与多种增值方式组合：高级学习功能、AI 翻译、TTS、广告等。具体定价和能力组合尚未设计。

### 社交会员

中国用户付费购买“建立关系的效率”，包括更多 Follow 次数、更多推荐机会、高级筛选、信息查看或曝光提升等权益。

### 虚拟礼物

礼物可以从聊天、主页或动态触发，但商品、定价、购买、赠送、接收和资产变化全部归 Commerce；Chat 侧如何展示送礼结果属于 `deferred`，当前 Chat 域不存在 GIFT 消息类型、`chat_message_gift` 表或 `GiftMessageReference` 实体。

礼物接收者能否获得积分、兑换或收益属于 `deferred`，不得预设为 Creator Economy。

## Entitlement 中心

业务能力不判断 `user.vip`，而判断用户是否拥有具体 Entitlement。相同权益可以来自：

```text
Commerce 购买 ─┐
Rewards 奖励 ──┼→ User Entitlement → 业务能力
Promotion ─────┘
```

这样中国用户购买会员、老挝用户通过有效贡献获得奖励时，可以得到完全相同的权益，业务功能不关心来源。

> V1 说明：Rewards 奖励以 Coin 写入 Commerce 资产账户，不走 Entitlement；「Rewards → User Entitlement」方向不变，但 Entitlement 落表与权益型奖励（会员天数、Follow 额度、曝光等）延后到真实需求出现（见 [未决事项](/developer/reference/governance/open-questions.md)）。

## Contribution 与 Rewards

Rewards 采用「事件 → 规则 → 奖励决定 → 幂等发放」链路（[Rewards 域](/developer/reference/domains/rewards/index.md) V1 已定稿 5 张表）。早期草案的「贡献计分（Contribution/Scoring + ScoreRecord）」模型已被取代（`superseded`）：V1 不建计分、积分、任务或成长系统。

```text
源域可信事件（LEARNING_DAILY_GOAL_COMPLETED / PROFILE_COMPLETED / INVITE_SUCCEEDED …）
→ reward_events → reward_rules（条件/限额/奖励额，按版本管理）
→ reward_grants（奖励决定）→ reward_deliveries（幂等发放）
→ Commerce 资产入账（V1 奖励资产仅 Coin）
```

- 分层职责：源域决定「事实是否发生」，Rewards 决定「是否值得奖励」，Commerce 决定「资产如何入账」。Rewards 不维护钱包/账本，不创建退款/调账/冲正。
- V1 奖励资产仅 `COIN`（经 Commerce 钱包入账）；会员天数、Follow 额度、曝光等权益型奖励以及 POINT/EXP/BADGE/GIFT/COUPON 资产均**延后**，待真实需求出现再设计（仍遵守 Entitlement 中心的原有方向）。
- 候选奖励场景（每日签到、完成学习目标、连续学习、完善资料、首次发布动态、邀请用户、运营/节日活动、新用户奖励等）为 `illustrative` 示例，最终以 `reward_rules` 配置为准；尤其禁止只按消息数量奖励，避免刷量。
- 奖励事件必须来自可信内部 Domain（consumer），禁止 C 端直接上报事件或后台手动发币（Manual Reward Grant V1 不实现）。
