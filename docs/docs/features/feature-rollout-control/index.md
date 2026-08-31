---
feature_id: feature-rollout-control
title: 功能开关与范围灰度管理
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

# 功能开关与范围灰度管理

## 功能概览

Portfolio Status：`active`。

本 Feature 负责 Platform 的 Feature Flag 定义、生命周期、运行时求值，以及 Region / Client / Region+Client 范围覆盖。权威产品事实来自 [Platform 运行控制](/domains/platform/runtime-control.md) 与 [Platform Domain](/domains/platform/)。V1 的范围灰度只覆盖冻结的范围模型；用户、分群、百分比、时间窗、版本表达式等高级策略属于 [高级灰度发布](/features/advanced-feature-rollout/)，不得回填到本 Feature。

## 设计

状态：done

范围：冻结 Feature Flag 的 owner、状态语义、默认值、Override 范围和求值优先级；`inactive / retired` 必须 fail-closed，范围覆盖不能绕过 master status，也不能把 Feature Flag 当作授权系统或业务状态机。

Stage / 工件 / Gate：设计事实见 [Platform 运行控制](/domains/platform/runtime-control.md)；实施前审计见 [PLATFORM_DESIGN_AUDIT](/development/03-platform/PLATFORM_DESIGN_AUDIT.md)。

Gate / Evidence：`PLATFORM_DESIGN_GATE = PASS`。Design Audit 对 Feature Flag contract、Override 物理唯一性修复路径、Client rewrite 边界均已给出明确结论；该 PASS 只证明本 Feature 的 V1 设计冻结，不代表后续 Lane 自动完成。

下一步：保持冻结语义；任何新增 user / segment / percentage / schedule / version-expression rollout 必须进入“高级灰度发布”重新设计，而不是扩写本 Feature 的 V1 contract。

## Backend

状态：done

范围：实现 Feature Flag 管理、生命周期变更、范围 Override set/remove、单项/批量求值、Repository 与 HTTP 边界，并落实并发唯一性与 fail-closed 语义。

Stage / 工件 / Gate：[PLATFORM_IMPLEMENTATION_REPORT](/development/03-platform/PLATFORM_IMPLEMENTATION_REPORT.md) 将 `platform.feature_flags` 与 `platform.feature_flag_overrides` 映射到已实现 Use Cases；当前真实源码包括 `apps/backend/src/modules/platform/application/use-cases/feature-flag-use-cases.ts`、`apps/backend/src/modules/platform/http/routes.ts`、`apps/backend/src/modules/platform/http/management-routes.ts` 与 `apps/backend/src/modules/platform/infrastructure/repositories.ts`。

Gate / Evidence：`PLATFORM_GATE = PASS`，且不是仅凭 Domain 总体完成推断：当前仓库存在 Feature Flag 专属 Use Case、HTTP/Repository 实现，以及 `apps/backend/test/integration/platform-http.test.ts`、`platform-race.test.ts`、`platform-repositories.test.ts` 的直接回归证据；Implementation Report 还记录 Backend verify/build/integration 与数据库 Gate PASS。

下一步：Backend V1 保持 frozen。Admin 若要展示完整 Override inventory，必须先由真实 Backend read-model contract 提供，不在 Feature 文档中臆造 endpoint 或返回字段。

## Admin

状态：ready

范围：运营人员在 Admin 中查看、创建、编辑、停用/退役 Feature Flag，并对已明确的 Region / Client scope 执行 Override set/remove；权限只使用 Operations 冻结的 exact permission。

Stage / 工件 / Gate：[PLATFORM_ADMIN_IMPLEMENTATION_REPORT](/development/03-platform/PLATFORM_ADMIN_IMPLEMENTATION_REPORT.md) 已完成 Stage A；真实实现位于 `apps/admin/src/features/platform/api.ts`、`contracts.ts`、`queries.ts` 与 `pages/feature-flags.tsx`。Stage A 已覆盖 lifecycle confirmation、exact permission guard 和显式 scope override 操作。

Gate / Evidence：Stage A 为 `COMPLETE_STAGE_A`，但该报告没有 `PLATFORM_ADMIN_GATE = PASS`。随后 [OPERATIONS_IMPLEMENTATION_REPORT](/development/04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md) 已给出 `OPERATIONS_GATE = PASS` 与 `OPS-14 Platform Management Integration = PASS`；[DEVELOPMENT_PROGRESS](/development/DEVELOPMENT_PROGRESS.md) 因而把 Platform Admin 标为 `READY`，不是 COMPLETE。另有已知 read-model 限制：管理端响应不保证返回完整 Override inventory。

下一步：执行 Platform Admin Stage B：真实 operator authentication、exact RBAC 401/403、授权写入、success-only audit 与 live E2E；在此之前不得把 Admin Lane 写成 done。

## Mobile

状态：todo

范围：客户端消费 Feature Flag runtime resolve contract，按冻结 fail-closed / scope 语义决定产品能力是否展示或启用；Flag 结果不能代替服务端授权。

Stage / 工件 / Gate：[PLATFORM_DESIGN_AUDIT](/development/03-platform/PLATFORM_DESIGN_AUDIT.md) 的 Client Contract Audit 明确 `Feature Flag client = REWRITE`。当前 `apps/mobile/src/api/` 未形成 Platform Feature Flag 专属接入层，现有 `apps/mobile/src/bootstrap/useAppBootstrap.ts` 也只负责本地配置、字体与 Splash，不是 Platform runtime flag 集成，因此没有 Mobile 完成证据。

Gate / Evidence：尚无本 Feature 的 Mobile Gate；`MOBILE_FOUNDATION_GATE = PASS` 只能证明客户端基础设施可用，不能证明 Feature Flag 已接入。

下一步：在 Client Integration 阶段实现稳定的 Platform Feature Flag client、缓存/刷新策略（如有明确需求）与行为测试，并验证服务端与客户端求值语义一致。

## 集成

状态：ready

范围：把 Platform owner write、Operations operator/RBAC/audit guard、Admin Stage B 与 Mobile runtime consumer 串成同一条可验证链路，同时保持 Platform canonical state 仍只由 Platform 拥有。

Stage / 工件 / Gate：[OPERATIONS_IMPLEMENTATION_REPORT](/development/04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md) 已验证 `OPS-14 = PASS`，Platform management mutation 已接入 Operations exact RBAC/Audit；Platform Backend Gate 也已 PASS。Admin Stage A 完成且前置依赖已经解除，因此该 Lane 具备继续集成的进入条件。

Gate / Evidence：`OPERATIONS_GATE = PASS` 是前置集成证据，不等于本 Feature 的最终 Integration/Acceptance PASS；Mobile runtime 接入与 Platform Admin Stage B 尚未执行。

下一步：完成 Stage B live E2E 与 Mobile Feature Flag 接入后，再形成 Feature 级端到端集成证据。

## 验收

状态：todo

范围：验证 default / Region / Client / Region+Client 优先级、inactive/retired fail-closed、Override set/remove 回退、并发唯一性、Admin RBAC/Audit、客户端行为及负向路径。

Stage / 工件 / Gate：Backend 已有 Platform Gate，Admin 与 Mobile 仍缺 Feature 级最终 Gate，因此尚不能进入完成态。

Gate / Evidence：当前没有 `feature-rollout-control` 的端到端 Acceptance PASS 证据。

下一步：等待 Admin Stage B 与 Mobile/集成完成，补齐真实 E2E/安全/回归证据后再裁决 acceptance。
