---
feature_id: social-lifecycle
title: 暂停 / 关闭社交资料
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
    - /domains/social/discovery-and-relationships/
    - /governance/design-register/
---

# 暂停 / 关闭社交资料

## 功能概览

Portfolio Status：`active`。

`social-lifecycle` 只负责 Social Profile 自身的暂停与关闭语义。`paused` / `closed` 是 Social 生命周期状态，不是 Trust restriction / enforcement，也不等同于 Identity 账号注销。

## 设计

状态：done

范围：`social_profiles.profile_status` 使用 `draft / active / paused / closed`。`paused` 只退出普通 Discovery，既有 Match 与聊天继续；`closed` 关闭 Social 功能，但不是账号注销或资料物理删除。关闭后未来是否恢复原资料仍为 deferred，本 Feature 不提前裁决。Social 生命周期不得被解释为 Trust 封禁或处罚状态。

Stage / 工件：canonical 已冻结：[Social 偏好、发现与关系](/domains/social/discovery-and-relationships/)；物理状态契约见 `database/v2/migrations/0700_social.sql` 的 `social.social_profiles.profile_status`。

Gate / Evidence：canonical frontmatter 为 `status: frozen`，并明确 `paused` / `closed` 的当前语义；Design Register D-135～D-138 是 Social 全域审计最终冻结证据。仓库未发现独立 `SOCIAL_DESIGN_GATE` 文件，本页不制造额外 Gate 结论。

Next Action：Backend 实现 Social Profile pause / resume / close use case 与发现资格检查，并以测试证明 paused 不结束既有 Match/Chat、closed 不触发 Identity 注销或 Trust enforcement；关闭后恢复策略保持 deferred。

## Backend

状态：ready

范围：实现暂停、恢复与关闭 Social Profile 的状态迁移及相关读写资格检查；`paused` 必须退出普通 Discovery 但保留既有 Match/Chat，`closed` 必须关闭 Social 功能而不删除资料/关系历史，也不得写入 Trust `enforcement_actions` 或修改 Identity 账号生命周期。

Stage / 工件：`database/v2/migrations/0700_social.sql` 已落地 `profile_status IN ('draft', 'active', 'paused', 'closed')` 的数据库前置契约。当前 `backend/src/modules/` 尚无 Social module、lifecycle service/routes 或 Social tests。

Gate / Evidence：数据库 schema 已存在，但仓库没有 Social Lifecycle Implementation Report / Backend Gate，也没有 API、Service 或测试证明上述状态迁移语义，因此状态仅为 `ready`。

Next Action：建立 Social lifecycle repository/service/routes，补齐状态迁移、Discovery 排除、paused 保留 Match/Chat、closed 与 Identity/Trust 解耦的测试；不要为 deferred 的关闭后恢复策略自行补设计。

## Admin

状态：na

范围：当前暂停/关闭是用户侧 Social 生命周期能力，不要求独立运营后台。

Stage / 工件：无 Social Lifecycle 专用 Admin Stage / 页面；`admin_pages: []`。

Gate / Evidence：Trust/Operations 的 restriction、处罚或账号治理后台属于其它 Domain / Feature，不能作为本 Feature Admin Lane 的完成证据。

Next Action：无；若未来正式增加运营侧 Social 生命周期管理，需先建立独立 scope、权限与审计契约后再调整状态。

## Mobile

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## 集成

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## 验收

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。
