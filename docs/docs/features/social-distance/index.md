---
feature_id: social-distance
title: 距离筛选与模糊距离展示
portfolio_status: pending_decision
domain:
- social
- identity
mobile_pages: []
admin_pages: []
delivery_notes:
- SOCIAL_LOCATION_SCOPE_DECISION
---

# 距离筛选与模糊距离展示

## 功能概览

Portfolio Status：`pending_decision`。

本 Feature 保留当前正式清单中的“距离筛选与模糊距离展示”需求，但不代表该能力已获准进入实现。现有 Social canonical location 只有 `country_code / region / city` 粗粒度位置，并明确首期不引入经纬度 / PostGIS；因此仓库当前没有足以支撑真实距离计算或模糊距离展示的 canonical 数据契约。

NEEDS_DECISION：`SOCIAL_LOCATION_SCOPE_DECISION`。本文档只记录这一阻塞，不裁决是否上线、不发明坐标来源、精度、隐私规则或距离算法。
