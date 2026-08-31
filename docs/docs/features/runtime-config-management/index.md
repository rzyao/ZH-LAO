---
feature_id: runtime-config-management
title: 运行参数管理
portfolio_status: active
domain:
  - platform
  - operations
status:
  design: done
  backend: done
  admin: ready
  mobile: na
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

# 运行参数管理

## 功能概览

Portfolio Status：`active`。

本 Feature 负责真正跨领域的 Platform Runtime Config **当前值**治理。权威事实来自 [Platform 运行控制](/domains/platform/runtime-control.md)。Runtime Config 不是万能 `system_settings`：key 必须进入代码注册表并具有明确 owner / type / visibility / validation / fallback；历史、版本与回滚属于独立且延期的 [运行配置版本与回滚](/features/runtime-config-history/)。

## 设计

状态：done

范围：冻结 current-state Runtime Config 模型、代码注册表、类型/可见性、fallback、retired/missing 行为与跨领域读取边界；V1 不开放任意 key + JSON，也不提供 generic client/runtime config dump。

Stage / 工件 / Gate：设计事实见 [Platform 运行控制](/domains/platform/runtime-control.md)、[PLATFORM_CONFIG_CONTRACTS](/development/03-platform/PLATFORM_CONFIG_CONTRACTS.md) 与 [PLATFORM_DESIGN_AUDIT](/development/03-platform/PLATFORM_DESIGN_AUDIT.md)。

Gate / Evidence：`PLATFORM_DESIGN_GATE = PASS`。Design Audit 明确 `DB = current value store`、`Code registry = typed usage/schema contract`，并明确 history / rollback 不在 V1；Design PASS 不自动代表 Backend/Admin 完成。

下一步：保持 current-state 边界；若需要历史/回滚，转入对应 deferred Feature，不给 `platform.runtime_configs` 偷加 revision/history 语义。

## Backend

状态：done

范围：实现注册 key 的读取/解析、fallback、management set/retire/list、Repository/并发控制和 Platform-owned typed public handle；拒绝未注册 key、错误 value type 与越权 generic dump。

Stage / 工件 / Gate：[PLATFORM_IMPLEMENTATION_REPORT](/development/03-platform/PLATFORM_IMPLEMENTATION_REPORT.md) 对 `platform.runtime_configs` 与 Use Cases 给出完成映射。直接源码证据包括 `apps/backend/src/modules/platform/application/use-cases/runtime-config-use-cases.ts`、`services/platform-public-service.ts`、`services/platform-management-service.ts` 与 `infrastructure/repositories.ts`。

Gate / Evidence：`PLATFORM_GATE = PASS`，并有 Feature 级直接证据：`apps/backend/test/unit/platform-runtime-config-registry.test.ts`、`platform-public-runtime-config-types.test.ts`、`apps/backend/test/integration/platform-http.test.ts` 与 `platform-repositories.test.ts`。因此 Backend done 来自实现与测试，不是从 Platform Domain 完成状态机械推导。

下一步：维持 frozen registry 与 typed handle；新增 key 必须有明确 Platform owner 语义，历史/回滚不能混进本 Backend Lane。

## Admin

状态：ready

范围：Admin 维护 frozen registry 中的 current value，展示状态/更新时间，校验类型，并用 `expected_updated_at` 处理并发冲突；不提供任意 key editor、历史浏览或回滚 UI。

Stage / 工件 / Gate：[PLATFORM_ADMIN_IMPLEMENTATION_REPORT](/development/03-platform/PLATFORM_ADMIN_IMPLEMENTATION_REPORT.md) 的 Stage A 已实现 Runtime Config 管理及 409 stale-data UX；源码位于 `apps/admin/src/features/platform/pages/runtime-configs.tsx`、`api.ts`、`contracts.ts`、`queries.ts`，并有对应 contract/component 测试。

Gate / Evidence：`PLATFORM_ADMIN_UI = COMPLETE_STAGE_A`；[OPERATIONS_IMPLEMENTATION_REPORT](/development/04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md) 后续已解除 Operations 前置条件，但仓库没有 `PLATFORM_ADMIN_GATE = PASS`。当前 [DEVELOPMENT_PROGRESS](/development/DEVELOPMENT_PROGRESS.md) 明确 Platform Admin 为 `READY`。

下一步：执行 Stage B 的真实 operator/RBAC/audit/live E2E；只验收 current-state 管理，不把 deferred history/rollback 当成本 Feature 的缺口或临时实现。

## Mobile

状态：na

不适用：V1 Runtime Config 的跨域读取通过 Backend `PlatformRuntimeConfigReader` 与 Platform-owned typed handles；Design Gate 明确不开放 generic Runtime Config HTTP，当前也没有独立 Mobile 页面/客户端配置浏览能力。把服务端 current-state 配置治理强行映射成 Mobile Lane 会扩大冻结范围。

## 集成

状态：ready

范围：验证 Backend owner state、Operations exact RBAC/audit、Admin Stage B，以及真实 Backend consumer 通过 `PlatformRuntimeConfigReader` 读取已注册配置时的类型与 fallback 行为。

Stage / 工件 / Gate：Platform Backend Gate PASS；[OPERATIONS_IMPLEMENTATION_REPORT](/development/04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md) 的 `OPS-14 = PASS` 已完成管理写入的 Operations wiring；Admin Stage A 完成且 Stage B 前置依赖已解除。

Gate / Evidence：当前证据证明“可进入集成”，不是 Feature 级 Integration PASS；Platform Admin Stage B 与真实 consumer 回归尚未形成独立完成 Gate。

下一步：完成 Stage B live E2E，并在出现真实跨域 consumer 时以 typed public contract 补充集成回归；不建立 generic config API。

## 验收

状态：todo

范围：验证 registered-key-only、value type/schema、fallback、retire/missing、并发冲突、Admin exact permission/audit，以及禁止 generic arbitrary config 的负向路径。

Stage / 工件 / Gate：Backend 已完成；Admin 最终 Gate 未执行；历史/回滚不属于本 Feature 的 V1 验收范围。

Gate / Evidence：当前没有 `runtime-config-management` 的端到端 Acceptance PASS。

下一步：Stage B 完成后执行 Feature 级验收，并确保任何“版本/回滚”诉求继续由 deferred Feature 承载。
