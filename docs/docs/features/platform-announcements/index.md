---
feature_id: platform-announcements
title: 平台公告发布与展示
portfolio_status: active
domain:
  - platform
  - operations
status:
  design: done
  backend: done
  admin: ready
  mobile: todo
  integration: ready
  acceptance: todo
mobile_pages: []
admin_pages: []
evidence:
  design:
    - /development/03-platform/PLATFORM_DESIGN_AUDIT.md
  backend:
    - /development/03-platform/PLATFORM_IMPLEMENTATION_REPORT.md
---

# 平台公告发布与展示

## 功能概览

Portfolio Status：`active`。

本 Feature 负责 Platform 全局/范围型公告的 canonical state、发布窗口与客户端展示读取。权威事实见 [客户端与产品范围治理](/domains/platform/client-governance.md)。Announcement 是平台广播，不自动升级为 Push、Email、SMS、Chat System Message、用户 Inbox、已读回执或营销 Campaign。

## 设计

状态：done

范围：冻结 Announcement lifecycle、published active window、Global / Region / Client / Region+Client scope 与确定性排序；V1 数据模型没有 locale/language、priority、push/read-receipt 语义。

Stage / 工件 / Gate：设计事实见 [客户端与产品范围治理](/domains/platform/client-governance.md)、[PLATFORM_API](/development/03-platform/PLATFORM_API.md) 与 [PLATFORM_DESIGN_AUDIT](/development/03-platform/PLATFORM_DESIGN_AUDIT.md)。

Gate / Evidence：`PLATFORM_DESIGN_GATE = PASS`。Design Audit 明确 Announcement contract 与 Notification/Marketing 边界；Design Gate 不代表 Admin/Mobile 已交付。

下一步：保持 frozen scope/time semantics；如未来需要多语言、优先级或通知分发，先确认 owner 与 schema，不在本 Feature V1 中虚构字段。

## Backend

状态：done

范围：实现 active announcement query、draft/create/update/publish/retire/delete 管理、scope/time 过滤、稳定排序、Repository 与 HTTP contract。

Stage / 工件 / Gate：[PLATFORM_IMPLEMENTATION_REPORT](/development/03-platform/PLATFORM_IMPLEMENTATION_REPORT.md) 对 `platform.announcements` 与 Use Cases 给出完成映射；真实源码包括 `apps/backend/src/modules/platform/application/use-cases/announcement-use-cases.ts`、`http/routes.ts`、`http/management-routes.ts` 与 `infrastructure/repositories.ts`。

Gate / Evidence：`PLATFORM_GATE = PASS`。当前有 Announcement 专属 Use Case/route/repository，以及 `apps/backend/test/integration/platform-http.test.ts`、`platform-repositories.test.ts` 的直接回归证据；因此 Backend done 不是由 Domain 完成状态间接推断。

下一步：维持 frozen API；客户端展示未完成应留在 Mobile/Integration Lane，不回退 Backend 状态。

## Admin

状态：ready

范围：运营人员创建 draft、编辑、发布、retire、删除合法 draft，并维护 Region/Client/time scope；不提供 locale、priority 或通知发送能力。

Stage / 工件 / Gate：[PLATFORM_ADMIN_IMPLEMENTATION_REPORT](/development/03-platform/PLATFORM_ADMIN_IMPLEMENTATION_REPORT.md) Stage A 已完成 Announcement 管理；真实页面为 `apps/admin/src/features/platform/pages/announcements.tsx`，并使用统一 Platform API/contracts/queries。

Gate / Evidence：`PLATFORM_ADMIN_UI = COMPLETE_STAGE_A`；Operations 后续 `OPERATIONS_GATE = PASS`，但仓库没有 Platform Admin Stage B 的最终 PASS。[DEVELOPMENT_PROGRESS](/development/DEVELOPMENT_PROGRESS.md) 当前状态为 `READY`。

下一步：执行真实 operator session、exact RBAC 401/403、success-only audit 与 live announcement mutation E2E，再裁决 Admin done。

## Mobile

状态：todo

范围：客户端通过冻结 Announcement HTTP contract 拉取当前有效公告，并按 scope/time 结果展示；不在客户端补造 push、read receipt、priority 或 locale contract。

Stage / 工件 / Gate：[PLATFORM_DESIGN_AUDIT](/development/03-platform/PLATFORM_DESIGN_AUDIT.md) 将 Announcement integration 标为 REFACTOR/REWRITE（按真实 Mobile 页面决定）。当前 `apps/mobile/src/api/` 与 `apps/mobile/src/features/` 没有 Platform Announcement 专属实现证据。

Gate / Evidence：尚无本 Feature 的 Mobile Gate；Mobile Foundation 完成不等于公告展示完成。

下一步：在 Client Integration 阶段实现 Announcement client、页面/入口展示策略、loading/empty/error 与 scope/time 回归测试。

## 集成

状态：ready

范围：串联 Admin publish/retire → Operations RBAC/audit → Platform announcement state → public active query → Mobile 展示。

Stage / 工件 / Gate：Platform Backend 与 Operations `OPS-14` 已 PASS；Admin Stage A 完成且 Stage B 前置依赖解除，因此具备进入端到端集成的条件。

Gate / Evidence：当前没有 Mobile 展示与 Platform Admin Stage B 的完整链路证据，所以 Integration 仍是 ready 而非 done。

下一步：完成 Stage B 和 Mobile 展示接入，验证未授权管理、时间边界、scope 组合及客户端错误路径。

## 验收

状态：todo

范围：验证 published active predicate、四类 scope、确定性排序、生命周期写入、RBAC/audit 与 Mobile 展示；同时验证未支持 locale/priority/push 不被误实现。

Stage / 工件 / Gate：Backend Gate 已 PASS；Admin final Gate 与 Mobile/Integration 尚未完成。

Gate / Evidence：当前没有 `platform-announcements` 的端到端 Acceptance PASS。

下一步：完成跨端集成后执行 Feature 级验收，再更新 acceptance。
