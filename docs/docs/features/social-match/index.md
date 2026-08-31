---
feature_id: social-match
title: 互关 Match 与聊天资格
portfolio_status: active
domain:
  - social
  - identity
  - chat
status:
  design: done
  backend: ready
  admin: na
  mobile: todo
  integration: todo
  acceptance: todo
mobile_pages: []
admin_pages: []
evidence:
  design:
    - /domains/social/discovery-and-relationships
    - /governance/design-register/
---

# 互关 Match 与聊天资格

## 功能概览

Portfolio Status：`active`。

`social-match` 负责 Social 内由互相关注触发的 Match 当前状态与历史；Match 后聊天资格属于 Social→Chat 的业务前置，Chat 仍独立拥有 Conversation / Message 生命周期。

## 设计

状态：done

范围：当双方 Follow 同时存在时，Social Domain Service 建立 `social_matches` active 记录；取消任一方向 Follow 或发生 Block 时结束 active Match，但保留历史。Match pair 规范化为 `profile_a_id < profile_b_id`，同一 pair 允许结束后再次 Match；跨域引用只能使用 Match `public_id`，当前 V1 Chat 不保存 `match_id`。Match 后聊天免费，但会话建立方式与 Conversation 生命周期由 Chat 规格负责。

Stage / 工件：canonical 已冻结：[Social 偏好、发现与关系](/domains/social/discovery-and-relationships)；物理表见 `database/migrations/0700_social.sql` 的 `social.social_matches`。

Gate / Evidence：Design Register D-136 冻结 Match 的跨域 UUID 契约，D-137 冻结 active-pair partial unique 与历史保留，D-138 冻结 Mutual Follow→Match 及跨表事务 invariant；canonical frontmatter 为 `status: frozen`。仓库未发现独立 `SOCIAL_DESIGN_GATE` 文件，因此不制造额外 Gate 结论。

Next Action：Backend 按 frozen invariant 实现“第二条 Follow 建立 Match、Unfollow/Block 结束 Match”的事务服务，并仅向 Chat 暴露稳定的业务资格/逻辑标识契约。

## Backend

状态：ready

范围：实现 active Match 的创建、结束、查询与历史保护，以及 Follow/Unfollow/Block 触发的事务一致性；与 Chat 的集成只传业务资格/稳定 logical UUID，不让 Chat 持有 Social 内部 BIGINT。

Stage / 工件：`database/migrations/0700_social.sql` 已落地 `social_matches` 的 `public_id`、pair CHECK、`active/ended` 状态与 active-pair partial unique index。当前 `backend/src/modules/` 尚无 Social module、Match Domain Service、routes 或 Match tests。

Gate / Evidence：这里只存在 frozen design 与数据库 schema 前置，没有 Social Match implementation report / backend gate / service/API/test 证据；因此明确保持 `ready`，绝不以设计或建表事实写成 `done`。

Next Action：实现并测试 Mutual Follow→Match、Unfollow→ended、Block→ended、重复 Match 并发保护与跨域 `public_id` contract，随后形成真实 Backend Gate。

## Admin

状态：na

范围：Match 是用户关系状态，不需要独立运营后台写入口。

Stage / 工件：无独立 Admin Stage / 页面；`admin_pages: []`。

Gate / Evidence：Social canonical 没有 Match 专用 Admin 能力；Trust enforcement / Operations 审计不是 Match Admin Lane。

Next Action：无；只有未来正式新增运营 Match 查询/处置 Feature 时才重新评估。

## Mobile

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## 集成

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## 验收

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。
