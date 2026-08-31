---
feature_id: region-management
title: 产品支持地区管理
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

# 产品支持地区管理

## 功能概览

Portfolio Status：`active`。

本 Feature 负责产品当前支持哪些 Region，以及 Region 的稳定 code、名称、默认 locale/timezone 与 active/retired 管理。权威事实见 [客户端与产品范围治理](/domains/platform/client-governance.md)。Platform Region 是产品 reference/control data；Identity 用户资料里的地区是 Identity-owned profile fact，两者不建立跨 Domain 物理 FK。

## 设计

状态：done

范围：冻结 Region 的 stable public identity `code`、生命周期、active list/get 语义、locale/timezone validation 与 Identity 边界；Region 不是 Geography/GIS Domain，也不允许 Platform 修改用户资料。

Stage / 工件 / Gate：设计事实见 [客户端与产品范围治理](/domains/platform/client-governance.md)、[Platform Domain](/domains/platform/) 与 [PLATFORM_DESIGN_AUDIT](/development/03-platform/PLATFORM_DESIGN_AUDIT.md)。

Gate / Evidence：`PLATFORM_DESIGN_GATE = PASS`。Design Audit 明确 Platform/Identity ownership、无跨域物理 FK、client selection 使用 active Region list，并给出 Region client integration 边界。

下一步：保持 stable code 与 owner 边界；任何完整行政区划/GIS 需求不得在本 Feature 内扩张。

## Backend

状态：done

范围：实现 Region get/listActive、create/update/retire/list management、验证与 Repository/HTTP contract，同时只暴露稳定 code，不泄漏内部 BIGINT id。

Stage / 工件 / Gate：[PLATFORM_IMPLEMENTATION_REPORT](/development/03-platform/PLATFORM_IMPLEMENTATION_REPORT.md) 对 `platform.regions` 与 Region Use Cases 给出完成映射；当前源码包括 `apps/backend/src/modules/platform/application/use-cases/region-use-cases.ts`、`http/routes.ts`、`http/management-routes.ts` 与 `infrastructure/repositories.ts`。

Gate / Evidence：`PLATFORM_GATE = PASS`。直接 Feature 证据还包括 `apps/backend/test/integration/platform-http.test.ts` 与 `platform-repositories.test.ts`；因此 Backend done 基于 Region 实现/测试，而不是“Platform Backend 已完成所以全部完成”的泛化判断。

下一步：保持 public code 与 logical relation；客户端未接入应由 Mobile/Integration Lane推进。

## Admin

状态：ready

范围：运营人员查看、创建、编辑、停用/退役 Region，并维护 name/default locale/timezone；code 在创建后保持 immutable，Admin 不修改 Identity profile。

Stage / 工件 / Gate：[PLATFORM_ADMIN_IMPLEMENTATION_REPORT](/development/03-platform/PLATFORM_ADMIN_IMPLEMENTATION_REPORT.md) Stage A 已完成 Region 管理；真实页面是 `apps/admin/src/features/platform/pages/regions.tsx`，并复用 Platform API/contracts/queries 与 exact permission guard。

Gate / Evidence：`PLATFORM_ADMIN_UI = COMPLETE_STAGE_A`；[OPERATIONS_IMPLEMENTATION_REPORT](/development/04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md) 已解除 Operations 依赖，但没有 `PLATFORM_ADMIN_GATE = PASS`。[DEVELOPMENT_PROGRESS](/development/DEVELOPMENT_PROGRESS.md) 当前将 Platform Admin 标为 `READY`。

下一步：执行 Stage B 的 operator/RBAC/audit/live Region mutation E2E，再更新 Admin Lane。

## Mobile

状态：todo

范围：客户端消费 active Region list/get contract，用于当前产品可选择/可用地区；不得把 Identity 历史 profile region 自动覆盖，也不得把 Region API扩展成 GIS 数据源。

Stage / 工件 / Gate：[PLATFORM_DESIGN_AUDIT](/development/03-platform/PLATFORM_DESIGN_AUDIT.md) 明确 Region integration 需按真实 Mobile 页面 REFACTOR/REWRITE。当前 `apps/mobile/src/api/` 没有 Platform Region 专属 client，故没有本 Feature 的 Mobile 完成证据。

Gate / Evidence：尚无 Region Mobile Gate；Mobile Foundation PASS 仅是基础设施证据。

下一步：实现 Region client 与真实选择/展示场景的接入，并补 active/inactive、未知 code、网络错误与 Identity logical-value 边界测试。

## 集成

状态：ready

范围：串联 Admin Region 管理 → Operations RBAC/audit → Platform canonical Region → public Region reader/HTTP → Mobile/Identity consumer 的 logical validation，同时维持跨域无物理 FK。

Stage / 工件 / Gate：Platform Backend PASS，Operations `OPS-14 = PASS`，Admin Stage A complete，Stage B 前置依赖已解除。

Gate / Evidence：现有证据证明管理写链的 Platform/Operations integration 已建立，但 Mobile Region consumer 与 Platform Admin Stage B 尚未形成完整 Feature Gate。

下一步：完成 Stage B + Mobile/consumer integration，再补跨域逻辑关系回归。

## 验收

状态：todo

范围：验证 stable code、active list/get、locale/timezone validation、生命周期、RBAC/audit、Mobile 选择与 Identity ownership 边界。

Stage / 工件 / Gate：Backend Gate 已 PASS；Admin/Mobile/Integration 尚未形成最终 Feature Gate。

Gate / Evidence：当前没有 `region-management` 的端到端 Acceptance PASS。

下一步：完成剩余 Lane 后执行 Feature 级验收，确保无跨域 FK/写入与无 GIS scope creep。
