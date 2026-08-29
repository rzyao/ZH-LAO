---
status: baseline
last_updated: 2026-08-30
---

# Rewards 域

Rewards 回答“用户为平台创造了多少有效价值，以及应该奖励什么”。

## 子域与实体

- Contribution：ContributionEvent。
- Scoring：ContributionRule、ScoreRecord。
- Reward：RewardDefinition、RewardGrant。
- Campaign：RewardCampaign。

## 业务基线

```text
Contribution Event → Configurable Rule/Weight/Condition/Cap
→ Score → Reward Rule → Reward Grant → Commerce Entitlement
```

候选贡献行为包括真人认证、资料完善、每日活跃、收到关注、有效 Match、回复、有效聊天、优质动态和社区互动。具体分值均为 `illustrative`。

奖励可以是会员天数、Follow 额度、曝光或特殊权益。不能只按消息数量奖励；规则权重和上限由运营配置。

## 数据库状态

模型为 `baseline`；事件幂等、计分周期、防刷、规则版本、撤销、表名和字段均为 `designing`。
