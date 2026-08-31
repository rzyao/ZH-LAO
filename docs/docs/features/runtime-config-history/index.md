---
feature_id: runtime-config-history
title: 运行配置版本与回滚
portfolio_status: deferred
domain:
  - platform
status:
  design: todo
  backend: todo
  admin: todo
  mobile: na
  integration: todo
  acceptance: todo
mobile_pages: []
admin_pages: []
---

# 运行配置版本与回滚

## 功能概览

Portfolio Status：`deferred`。

本 Feature 保存 Runtime Config 的历史、版本与回滚需求，但当前不在开发组合中。现行 [运行参数管理](/features/runtime-config-management/) 只拥有 `platform.runtime_configs` 的 current-state；V1 canonical design 明确没有 history / rollback / publish revision。`deferred` 不应改写成 Lane `blocked`，也不能因为 current-state Backend 已完成就认定本 Feature 已设计或实现。

## 设计

状态：todo

范围：当前仅保留“配置历史/版本/回滚”需求边界，不提前决定 revision 模型、历史表、snapshot/diff、rollback 语义、发布流程、保留策略或审计补偿机制。

Stage / 工件 / Gate：[PLATFORM_DESIGN_AUDIT](/development/03-platform/PLATFORM_DESIGN_AUDIT.md) 与 [Platform 运行控制](/domains/platform/runtime-control.md) 明确 V1 Runtime Config 只有 current-state，并没有本 Feature 的完成设计；这些文档是 defer/边界证据，不是本 Feature Design PASS。

Gate / Evidence：没有独立 `runtime-config-history` Design Gate。

下一步：只有 Portfolio 正式激活后，先设计历史事实所有权、版本状态机、rollback safety 与审计契约，再讨论 schema/API。

## Backend

状态：todo

范围：当前不实现 history repository、revision table、snapshot、rollback command 或 history HTTP/API。

Stage / 工件 / Gate：[PLATFORM_IMPLEMENTATION_REPORT](/development/03-platform/PLATFORM_IMPLEMENTATION_REPORT.md) 完成的是 `platform.runtime_configs` current-state Use Cases；Frozen Platform 仍为 6 张业务表，没有为配置历史新增表。

Gate / Evidence：当前 Runtime Config Backend done 不构成本 Feature Backend 证据，也没有 history/rollback Backend Gate。

下一步：维持 todo；设计 Gate 前不得新增表、事件或回滚 endpoint。

## Admin

状态：todo

范围：当前不提供历史时间线、版本对比、rollback preview/confirm 或恢复操作。

Stage / 工件 / Gate：[PLATFORM_ADMIN_IMPLEMENTATION_REPORT](/development/03-platform/PLATFORM_ADMIN_IMPLEMENTATION_REPORT.md) Stage A 只实现 frozen registry current value 管理与 409 stale-data UX，没有 history/rollback UI，因此不能将其算作本 Feature Admin 完成。

Gate / Evidence：没有本 Feature Admin Stage/Gate。

下一步：Portfolio 激活且设计/Backend contract 冻结后，再确定 Admin 历史浏览和安全回滚交互；不得先复用 current-value 编辑器伪装 rollback。

## Mobile

状态：na

不适用：配置历史/回滚是 Platform/Operations 管理能力；现行 V1 也不提供 generic Runtime Config client HTTP。当前没有独立 Mobile 交付面。

## 集成

状态：todo

范围：尚未定义 history/rollback 与 Operations audit、Platform current-state、Admin 或未来 consumer 的集成语义。

Stage / 工件 / Gate：没有本 Feature Integration Stage。Operations `OPS-14` 只覆盖当前 frozen Platform management mutation，不代表未来 rollback mutation 已纳入 RBAC/Audit contract。

Gate / Evidence：无。

下一步：待设计冻结后再定义 rollback 授权、审计、并发、失败恢复与 E2E，不提前制造跨域 Contract。

## 验收

状态：todo

范围：尚未冻结可验收的版本模型、rollback invariant、权限/审计与恢复策略。

Stage / 工件 / Gate：没有本 Feature Acceptance Gate。

Gate / Evidence：无。

下一步：保持 todo；Portfolio 激活并完成前置 Lane 后再建立验收标准。
