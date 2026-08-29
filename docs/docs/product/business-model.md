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

## Contribution 与 Rewards

贡献候选包括真人认证、资料完善、每日活跃、收到关注、有效 Match、回复、有效聊天、优质动态和社区互动。

```text
Contribution Event × Rule/Weight × Condition × Cap
→ Score → Reward Rule → Reward → Entitlement
```

权重、条件和上限由运营配置。具体分值仅为 `illustrative`，不能写死；尤其不能只按消息数量奖励，避免刷消息。
