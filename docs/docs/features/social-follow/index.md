---
feature_id: social-follow
title: 关注与取消关注
portfolio_status: active
domain:
  - social
  - identity
  - trust
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

# 关注与取消关注

## 功能概览

Portfolio Status：`active`。

`social-follow` 负责 Social 内单向关注关系的建立与取消。唯一领域事实源为 [Social 偏好、发现与关系](/domains/social/discovery-and-relationships)；Identity 只提供跨域用户身份，Trust & Safety 不拥有 Follow 关系事实。

## 设计

状态：done

范围：冻结单向 Follow 当前关系事实。`social_follows` 以 `(follower_profile_id, following_profile_id)` 表示一条当前关注边，禁止自关注；取消关注是 physical DELETE。首期没有关注请求、Like/Dislike/Favorite 平行关系图谱。互关产生 Match、取消任一方向 Follow 结束 active Match，属于 Social Domain Service 的关系不变量。

Stage / 工件：canonical 已冻结：[Social 偏好、发现与关系](/domains/social/discovery-and-relationships)；物理契约见 `database/v2/migrations/0700_social.sql`。

Gate / Evidence：canonical frontmatter 为 `status: frozen`；Design Register 的 D-135～D-138 为 Social 全域审计最终冻结证据，其中 D-138 明确 Follow 单向及跨表 invariant 由 Social Application/Domain Service 事务保证。仓库未发现独立 `SOCIAL_DESIGN_GATE` 文件，本页不制造额外 Gate 结论。

Next Action：Backend 按冻结关系语义实现 Follow/Unfollow repository、Domain Service 与 HTTP contract，并以事务测试覆盖 Follow→Match 与 Unfollow→结束 active Match 的联动。

## Backend

状态：ready

范围：实现关注/取消关注写路径、按关注方向读取关系、必要的事务并发约束，以及与 Match / Block 的 Social 域内联动；不得把 Trust enforcement 当作 Follow 写路径的一部分。

Stage / 工件：数据库前置工件已落地：`database/v2/migrations/0700_social.sql` 已包含 `social.social_follows`、pair 主键、自关注 CHECK 与反向读取索引。当前 `backend/src/modules/` 仅存在 Identity、Operations、Platform 等模块，尚无 Social module / repository / service / HTTP routes / Social tests。

Gate / Evidence：具备 frozen design + DB schema 前置证据，但仓库尚无 Social Backend Implementation Report 或 Backend Gate，也没有可证明 Follow API/Service 已实现的代码与测试，因此状态仅为 `ready`，不是 `active/done`。

Next Action：建立 `backend/src/modules/social`，实现并测试 Follow/Unfollow 事务、重复请求语义、并发边界以及 Match / Block 联动，再形成 Social Backend Gate 证据。

## Admin

状态：na

范围：本 Feature 是用户侧关系操作，不要求独立运营后台。

Stage / 工件：无独立 Admin Stage / 页面；`admin_pages: []`。

Gate / Evidence：Social canonical 未定义 Follow 专用后台操作；运营侧 Trust enforcement 属其它 Feature/Domain，不能作为本 Lane 的完成证据。

Next Action：无；除非未来正式新增 Follow 运营能力并进入 Feature 清单，否则保持 `na`。

## Mobile

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## 集成

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## 验收

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。
