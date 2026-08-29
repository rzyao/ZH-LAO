---
status: baseline
last_updated: 2026-08-30
---

# 功能开放与产品规则

社交不是一个总开关，而是能力矩阵。预期开放顺序：

```text
Learning → Community/Feed → User Profile → Follow
→ Mutual Follow/Match → Chat → Gift → Advanced Entitlements
```

Feature Flag 至少要表达：

```text
community.enabled
social.profile.enabled
social.discover.enabled
social.follow.enabled
social.match.enabled
chat.enabled
commerce.gift.enabled
```

能力可按国家/地区、用户群、客户端版本和运营阶段分别开放。例如可以让两侧先看到 Feed，但只为某一侧开放 Match。

规则配置的已确认示例包括免费 Follow 日额度、社交最低年龄、动态图片数量上限和奖励行为权重。这些具体数字在会话中仅为 `illustrative`，正式值尚未决定。

## 推荐规则

首期不做机器学习推荐：

1. 先以性别、年龄、距离等硬条件筛选。
2. 再以距离、最近活跃、真人认证、资料完整度、照片质量、社区活跃、社交活跃等因素计算可解释分数。
3. 权重由运营配置，不写死在代码。
