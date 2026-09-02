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

Feature Flag 至少要表达（key 命名遵循 `platform.feature_flags` 冻结的 `lower_snake_case` 规范，以下仅为示意）：

```text
social_feed
social_profile
social_discovery
social_follow
social_match
chat
commerce_gift_sending
```

产品预期能力可按国家/地区、用户群、客户端版本和运营阶段分别开放（例如让两侧先看到 Feed，但只为某一侧开放 Match）。**V1 落地范围（已冻结）**：`feature_flag_overrides` 只支持 region / client_platform / region+client_platform 三种 scope；用户群灰度、版本表达式、百分比与时间阶段开放不在 V1 支持范围，属延期能力（见 [Platform 数据库](/developer/reference/domains/platform/database.md)）。

规则配置的已确认示例包括免费 Follow 日额度、社交最低年龄、动态图片数量上限，以及奖励金额/条件/限额（`reward_rules` 配置）。这些具体数字在会话中仅为 `illustrative`，正式值尚未决定（Rewards V1 不采用「贡献行为权重」计分，见[业务模型](/developer/reference/product/business-model.md)）。

## 推荐规则

首期不做机器学习推荐：

1. 先以性别、年龄、距离等硬条件筛选。
2. 再以距离、最近活跃、真人认证、资料完整度、照片质量、社区活跃、社交活跃等因素计算可解释分数。
3. 权重由运营配置，不写死在代码。
