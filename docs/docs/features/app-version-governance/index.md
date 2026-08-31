---
feature_id: app-version-governance
title: 客户端版本检查与强制升级
portfolio_status: active
domain:
  - platform
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

# 客户端版本检查与强制升级

## 功能概览

Portfolio Status：`active`。

本 Feature 负责客户端 build 的兼容与升级策略：服务端依据 Platform canonical `app_versions` 判断当前 build 是否已知、是否支持、是否存在更新及是否必须升级。权威事实见 [客户端与产品范围治理](/domains/platform/client-governance.md)。它不负责部署、发布渠道编排或应用商店运营。

## 设计

状态：done

范围：冻结 App Version 的平台维度、numeric `build_number` 排序、build lifecycle、update policy、higher-active-target invariant 与客户端检查结果；`version` 仅作为展示/身份字符串，不承担 SemVer 排序。

Stage / 工件 / Gate：设计事实见 [客户端与产品范围治理](/domains/platform/client-governance.md)、[PLATFORM_API](/development/03-platform/PLATFORM_API.md) 与 [PLATFORM_DESIGN_AUDIT](/development/03-platform/PLATFORM_DESIGN_AUDIT.md)。

Gate / Evidence：`PLATFORM_DESIGN_GATE = PASS`。Design Audit 明确 App Version contract 与客户端 rewrite 边界，并明确 V1 不支持 region/channel/store_url 等未冻结字段。

下一步：维持 numeric build ordering 与 frozen HTTP contract；新增 release channel、region rollout 或 store metadata 必须另行设计。

## Backend

状态：done

范围：实现 build 检查、draft/create/update/publish/policy/delete 管理 Use Cases、platform-scoped 并发序列化与 HTTP contract，并保证要求升级时存在更高 active released target。

Stage / 工件 / Gate：[PLATFORM_IMPLEMENTATION_REPORT](/development/03-platform/PLATFORM_IMPLEMENTATION_REPORT.md) 明确映射 `platform.app_versions` 与相关 Use Cases；当前源码包括 `apps/backend/src/modules/platform/application/use-cases/app-version-use-cases.ts`、`http/routes.ts`、`http/management-routes.ts` 与 Platform repositories。

Gate / Evidence：`PLATFORM_GATE = PASS`。直接 Feature 证据包括 `apps/backend/test/integration/platform-http.test.ts`、`platform-race.test.ts` 与 `platform-repositories.test.ts`；Implementation Report 还记录真实 PostgreSQL advisory-lock wait 与更高 active target invariant 回归。因此 Backend done 并非只依据 Platform Domain 总体状态。

下一步：保持 frozen policy；后续只做回归与契约兼容，不把客户端未接入误判成 Backend 未完成。

## Admin

状态：ready

范围：运营人员按平台管理 App Version draft、发布、update policy 与合法删除，并遵守 immutable platform/build number 和 numeric build semantics。

Stage / 工件 / Gate：[PLATFORM_ADMIN_IMPLEMENTATION_REPORT](/development/03-platform/PLATFORM_ADMIN_IMPLEMENTATION_REPORT.md) Stage A 已完成；真实页面为 `apps/admin/src/features/platform/pages/app-versions.tsx`，并复用 `api.ts`、`contracts.ts`、`queries.ts`。Stage A 未增加 release channel、region rollout、store URL 或 scheduled publish。

Gate / Evidence：`PLATFORM_ADMIN_UI = COMPLETE_STAGE_A`。Operations 后续已通过 [OPERATIONS_IMPLEMENTATION_REPORT](/development/04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md)；当前 [DEVELOPMENT_PROGRESS](/development/DEVELOPMENT_PROGRESS.md) 将 Platform Admin 标为 `READY`，但不存在 `PLATFORM_ADMIN_GATE = PASS`。

下一步：执行 Stage B real operator/RBAC/audit/live management E2E，再判断 Admin Lane 是否可完成。

## Mobile

状态：todo

范围：客户端在启动/进入主流程前调用冻结的 App Version check contract，并将 `supported / update_available / update_required` 等结果映射为正常继续、提示更新或强制阻断行为。

Stage / 工件 / Gate：[PLATFORM_DESIGN_AUDIT](/development/03-platform/PLATFORM_DESIGN_AUDIT.md) 明确 `App Version bootstrap = REWRITE`。当前 `apps/mobile/src/bootstrap/useAppBootstrap.ts` 只处理本地环境配置、字体与 Splash，`apps/mobile/src/api/` 也没有 Platform App Version 专属 client，因此没有 Feature 级 Mobile 实现证据。

Gate / Evidence：尚无 App Version Mobile Gate；`MOBILE_FOUNDATION_GATE = PASS` 不能替代该 Feature 的客户端实现与行为测试。

下一步：实现 Platform App Version client、启动流程 decision UI/阻断语义和失败策略，并增加客户端单测/E2E。

## 集成

状态：ready

范围：串联 Admin policy write → Operations RBAC/audit → Platform canonical app_versions → public version-check HTTP → Mobile bootstrap decision。

Stage / 工件 / Gate：Backend `PLATFORM_GATE = PASS`；Operations `OPS-14 = PASS`；Admin Stage A 完成且 Stage B 已具备前置条件，因此可进入真实链路集成。

Gate / Evidence：当前仅有 Backend/Operations 与 Admin Stage A 证据，Mobile 尚未接入，故 Integration 不能标 done。

下一步：完成 Admin Stage B 和 Mobile bootstrap 接入，补授权/未授权、supported/deprecated/blocked、update target 与网络失败的端到端回归。

## 验收

状态：todo

范围：验证 known/unknown build、numeric ordering、update_available/update_required、higher active target invariant、管理并发、RBAC/audit 与 Mobile 强制升级行为。

Stage / 工件 / Gate：Backend Gate 已完成；Admin final Gate 与 Mobile/Integration Gate 尚未完成。

Gate / Evidence：当前没有 `app-version-governance` 的端到端 Acceptance PASS。

下一步：在 Stage B + Mobile 集成完成后执行跨端验收，再决定 acceptance 状态。
