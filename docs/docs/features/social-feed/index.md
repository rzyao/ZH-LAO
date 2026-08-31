---
feature_id: social-feed
title: 关注 Feed 与动态浏览
portfolio_status: active
domain:
  - social
  - identity
  - trust
status:
  design: done
  backend: todo
  admin: na
  mobile: todo
  integration: todo
  acceptance: todo
mobile_pages: []
admin_pages: []
evidence:
  design:
    - /domains/social/community-content
    - /domains/social/database
    - /governance/design-register
---

# 关注 Feed 与动态浏览

## 功能概览

Portfolio Status：`active`。

`social-feed` 负责关注 Feed 与动态浏览的端到端交付跟踪。Social 的 Post、关系、Block 与展示资格事实以 [Social 动态](/domains/social/community-content) 和 [Social 数据库](/domains/social/database) 为准；举报事实不属于 Social，`trust.reports` 是全系统唯一 canonical user report fact。

当前真实状态是：Social 内容设计已经冻结，`database/migrations/0700_social.sql` 已包含 Post/Like/Comment 等 Social 数据结构；但 `apps/backend/src/main.ts` 尚未注册 Social Module/API，`apps/mobile/src/features` 也没有 Social Feature 实现。因此本页只将 Design Lane 标记为完成，其余实现 Lane 不提前升级。

## 设计

状态：done

范围：确认关注 Feed 与动态浏览所依赖的 Social 内容与关系边界，包括已发布动态的展示资格、`public/followers` 可见性、Follow / Block 对可见性的约束，以及跨域只使用稳定 logical UUID。Feed 的排序、分页、缓存或推荐算法不在当前 canonical 设计中追加事实；举报入口可以来自 Social，但举报事实只写入 `trust.reports`。

Stage / 工件：当前有效 canonical 工件为 [Social 动态](/domains/social/community-content) 与 [Social 数据库](/domains/social/database)；[设计决策台账](/governance/design-register) 的 D-135～D-138 将 Social 内容四表、跨域 ID、约束与 application-level invariants 定稿为 `frozen`。

Gate / 完成证据：仓库当前没有独立的 `SOCIAL_DESIGN_GATE` 文件，因此不虚构 Gate。Design 完成依据是上述 canonical 文档的 `status: frozen` 与 D-135～D-138 的 `frozen` 决策；`database/migrations/0700_social.sql` 已机械落地 `social_posts`、`social_post_media`、`social_post_likes`、`social_post_comments`，且未创建 `social_reports`；`database/migrations/1100_trust.sql` 实际创建 `trust.reports`，与 canonical fact 归属一致。

下一步：进入正式 Social Backend Stage 后，以冻结的 Social canonical contract 为输入实现 Feed 查询 API / Service / Repository，并产出真实 Backend Stage、测试与 Gate；在该 Stage 出现前不把 Backend 标为 active 或 done。

## Backend

状态：todo

范围：尚未进入 F12 Backend 实现；本页不提前定义 Feed API、Service、Repository、分页或缓存契约。

Stage / 工件 / Gate：当前仓库没有 F12 Social Backend Stage / Brief / Gate；`apps/backend/src/modules` 仅有 Identity、Operations、Platform，`apps/backend/src/main.ts` 也没有 Social Module/API 注册。现有 `0700_social.sql` 只证明冻结数据库契约已落地，不等于 Feed Backend 已实现。

下一步：等待正式 Social Backend Stage 启动后，再基于 canonical design 实现并补真实代码、测试和 Gate evidence。

## Admin

状态：na

不适用：F12 Feed 是用户侧消费能力，不定义独立 Social Feed Admin 交付面。当前 Admin `src/features` 也没有 Social Feature；内容审核、案件、限制与举报事实属于 Trust & Safety / Operations 边界，尤其不得把 `trust.reports` 复制成 Social Admin 事实。

## Mobile

状态：todo

范围：尚未进入 F12 Mobile 实现；当前不预先定义 Feed 页面、导航或交互细节。

Stage / 工件 / Gate：当前没有 F12 Mobile Stage / Brief / Gate，`apps/mobile/src/features` 当前只有 Foundation Feature，没有 Social Feed 实现证据。

下一步：Backend contract 与正式 Mobile Stage 就绪后，再实现真实页面并补页面 ID、测试与设备验证 evidence。

## 集成

状态：todo

范围：Backend 与 Mobile 均未进入 F12 实现，因此当前没有可执行的 Feed 端到端联调对象。

Stage / 工件 / Gate：当前无 F12 Integration Stage、联调报告或 Gate。

下一步：待 Backend 与 Mobile 产生真实交付物后再进入集成，不提前制造接口联调事实。

## 验收

状态：todo

范围：当前尚无可验收的 F12 Feed 端到端实现。

Stage / 工件 / Gate：当前无 F12 Acceptance Stage、验收报告或 Gate。

下一步：待实现与集成完成后，依据真实用户路径、权限/Block 可见性和错误场景建立验收证据。
