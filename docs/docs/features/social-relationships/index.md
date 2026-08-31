---
feature_id: social-relationships
title: 关注我的 / 我关注的 / 已匹配列表
portfolio_status: active
domain:
  - social
  - identity
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
    - /domains/social/discovery-and-relationships/
    - /governance/design-register/
---

# 关注我的 / 我关注的 / 已匹配列表

## 功能概览

Portfolio Status：`active`。

`social-relationships` 提供“我关注的、关注我的、已匹配”三个关系入口。列表事实直接来自 Social 的 Follow / Match 当前状态，不建立第二套关系表或列表真相。

## 设计

状态：done

范围：`我关注的`由 `social_follows.follower_profile_id = current profile` 查询，`关注我的`由 `following_profile_id = current profile` 查询，`已匹配`由当前 `social_matches.status='active'` 查询。普通 Discovery 排除已有任一 Follow / Match；关系 UI 独立提供上述列表。Block 会在 Social Domain Service 事务内删除双方当前 Follow 并结束 active Match，因此列表不得自行维护重复关系状态。

Stage / 工件：canonical 已冻结：[Social 偏好、发现与关系](/domains/social/discovery-and-relationships/)；表与索引物理契约见 `database/v2/migrations/0700_social.sql`。

Gate / Evidence：canonical `status: frozen` 明确关系列表“均由 Follow/Match 查询得出，不建新表”；Design Register D-135～D-138 冻结 Social 关系模型与跨表 invariant。仓库未发现独立 `SOCIAL_DESIGN_GATE`，不虚构 Gate 名称。

Next Action：Backend 设计稳定的分页/排序 DTO 与查询 contract，复用 Follow / active Match 当前事实，并统一应用 Social profile 可见性与关系状态规则。

## Backend

状态：ready

范围：实现 following / followers / active matches 列表查询、分页排序、必要的 profile projection 与关系状态返回；不创建新的 relationship-list 持久表。

Stage / 工件：`database/v2/migrations/0700_social.sql` 已提供 `social_follows`、`social_matches` 与相关索引作为查询前置。当前 `backend/src/modules/` 尚无 Social module、关系查询 service、HTTP routes 或对应测试。

Gate / Evidence：DB schema 已具备，但没有 Social Backend Implementation Report / Gate，也没有关系列表 API 的实现证据；因此 Backend 仅 `ready`，不能写 `done`。

Next Action：实现关系列表 repository/service/routes 与分页、权限、Block/生命周期过滤测试；形成可验证的 Backend Gate 后再提升状态。

## Admin

状态：na

范围：当前三个关系列表是用户侧能力，不要求独立运营后台。

Stage / 工件：无独立 Admin Stage / 页面；`admin_pages: []`。

Gate / Evidence：Social canonical 未定义关系列表专用后台；Trust/Operations 的治理视图不能反向当作本 Feature Admin 完成证据。

Next Action：无；若未来正式增加运营查询能力，应单独建立 Admin 交付事实后再调整状态。

## Mobile

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## 集成

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## 验收

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。
