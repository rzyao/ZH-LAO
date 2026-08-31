---
feature_id: social-block
title: 用户 Block / Unblock
portfolio_status: active
domain:
  - social
  - identity
  - trust
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

# 用户 Block / Unblock

## 功能概览

Portfolio Status：`active`。

`social-block` 是 Social 隐私/关系层的用户 Block / Unblock 能力。**Social Block ≠ Trust Enforcement**：`social_blocks` 保存当前用户关系事实；Trust & Safety 独立拥有 restriction、处罚、申诉与 `enforcement_actions` 执法历史。

## 设计

状态：done

范围：`social_blocks(blocker_profile_id, blocked_profile_id)` 保存单向当前 Block，禁止自 Block；Unblock 可 physical DELETE。Block 触发“删除双方当前 Follow、结束 active Match、禁止新互动”属于 Social Domain Service 的事务 invariant，不由 DB CHECK 伪装，也不得写入或复用 Trust `enforcement_actions`。跨域 Chat 只消费允许/禁止互动的业务结果，不拥有 Block 真相。

Stage / 工件：canonical 已冻结：[Social 偏好、发现与关系](/domains/social/discovery-and-relationships)；物理契约见 `database/v2/migrations/0700_social.sql` 的 `social.social_blocks`。

Gate / Evidence：Design Register D-034 冻结 `social_blocks` 为 Social 当前用户 Block 关系，D-138 冻结 Block→删除双方 Follow / 结束 active Match 的 application-level invariant；canonical 明确写出 `social_blocks ≠ enforcement_actions`。仓库未发现独立 `SOCIAL_DESIGN_GATE`，本页不编造 Gate。

Next Action：Backend 实现 Block/Unblock Domain Service、事务联动与所有关系/互动读写路径的统一策略检查，并通过测试证明没有误用 Trust enforcement 表。

## Backend

状态：ready

范围：实现 Block/Unblock repository、Domain Service 与 HTTP contract；Block 事务内清理当前 Follow、结束 active Match，并在后续关注/互动入口拒绝被 Block 的 pair。Trust restriction/enforcement 由 Trust & Safety 自身服务处理，不与本写路径合并。

Stage / 工件：`database/v2/migrations/0700_social.sql` 已提供 `social.social_blocks` pair 主键与自 Block CHECK；同一 migration 也提供 Follow / Match 表作为联动前置。当前 `backend/src/modules/` 尚无 Social module、Block service/routes 或 Social tests。

Gate / Evidence：DB schema 已存在，但仓库没有 Social Block Implementation Report / Backend Gate，也没有可验证的 Block 事务与过滤实现，所以 Backend 仅为 `ready`。`database/v2/migrations/1100_trust.sql` 等 Trust 工件不能作为 Social Block Backend 完成证据。

Next Action：建立 Social Block repository/service/routes，补齐 Block→Follow DELETE、Match ended、禁止新互动、Unblock 与并发场景测试；单独验证没有向 `enforcement_actions` 写入 Social Block。

## Admin

状态：na

范围：用户 Block / Unblock 本身不需要独立运营后台。

Stage / 工件：无 Social Block 专用 Admin Stage / 页面；`admin_pages: []`。

Gate / Evidence：Trust/Operations 的执法后台属于 Trust Enforcement，不属于 Social Block Admin Lane，不能据此把本 Lane 标为 `done`。

Next Action：无；若未来需要运营查看 Social Block 关系，应先建立独立 Admin scope、权限和审计契约。

## Mobile

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## 集成

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## 验收

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。
