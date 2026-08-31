---
feature_id: reward-operations
title: 奖励计划 / 规则 / 发放监控后台
portfolio_status: active
domain:
  - rewards
  - commerce
  - operations
status:
  design: done
  backend: todo
  admin: todo
  mobile: na
  integration: todo
  acceptance: todo
evidence:
  design:
    - docs/docs/domains/rewards/index.md
    - docs/docs/domains/rewards/application-and-events.md
    - docs/docs/domains/rewards/database.md
    - docs/docs/adr/ADR-017-rewards-boundary-and-event-driven-grant.md
mobile_pages: []
admin_pages: []
---

# 奖励计划 / 规则 / 发放监控后台

## 功能概览

Portfolio Status：`active`。

本 Feature 是 Rewards 的运营控制面，围绕奖励计划、规则、事件、Grant 与 Delivery 的查询、生命周期管理和异常处置提供后台能力。它负责管理 Rewards 决策与投递，不负责直接修改用户 Coin 余额、Wallet Ledger、充值、退款或其它 Commerce 资产事实。

后台必须沿用 canonical 五表：`reward_programs`、`reward_rules`、`reward_events`、`reward_grants`、`reward_deliveries`。其中 `reward_grants` 表示奖励权益 / 决策已成立，**不是最终资产到账事实**；Delivery 成功后可以关联 Commerce 返回的资产交易引用，但 Rewards Admin 不因此取得修改 Commerce Wallet / Ledger 的职责。

## 设计

状态：done

- **Scope**：定义 Program / Rule 管理、Event / Grant / Delivery 查询、异常投递重试 / 取消，以及必要的 Grant void 约束；同时明确禁止“后台直接发 Coin”或从 Rewards 后台直接改用户余额。
- **Stage / Artifact**：有效设计工件为 `docs/docs/domains/rewards/application-and-events.md` 的 Admin API / Console 设计、Rewards canonical 数据契约与 `ADR-017`。其中首版后台模块定义为奖励计划、奖励规则、奖励记录、发放异常，Event 查询属于高级排障能力。
- **Gate / Evidence**：canonical 已明确 Program / Rule 生命周期、Grant / Delivery 分离、Delivery 异常操作和 Commerce 边界；仓库当前未发现独立 Rewards Admin Design Gate，因此不把设计工件误写成 Admin 实现 Gate。
- **Next Action**：Backend / Admin 实现必须直接复用 canonical 语义；涉及用户资产调整时跳转或调用 Commerce 的受控能力，而不是在 Rewards 中新增 Wallet / Ledger 操作。

## Backend

状态：todo

- **Scope**：实现后台所需 Program / Rule CRUD 与生命周期接口、Event / Grant / Delivery 查询、允许条件下的 Event 重试、Grant void、Delivery retry / cancel，并接入 Operations 身份、RBAC 与审计基础设施。
- **Stage / Artifact**：`database/migrations/1000_rewards.sql` 已提供五张 Rewards 表的数据库基线，但当前未发现 Rewards Backend Stage、Admin API 实现、Service / Repository、Delivery Worker 或对应测试。
- **Gate / Evidence**：migration 只能证明持久化结构已落盘，不能证明后台 API、权限校验、审计或异常操作已经实现。
- **Next Action**：先建立 Rewards Backend Stage，按 canonical 实现只读查询与受控命令；为所有写操作补权限、审计和状态前置条件，并完成 Backend Gate。

## Admin

状态：todo

- **Scope**：提供奖励计划、奖励规则、奖励记录、发放异常的真实后台页面；页面可展示 Grant 与 Delivery 状态及 Commerce 交易引用，但不得把 Grant `GRANTED` 显示成资产“已到账”，也不得提供直接余额修改入口。
- **Stage / Artifact**：当前 `admin_pages` 为空；仓库未发现 Rewards Admin Page、Rewards Admin Stage 或实现 Gate。canonical 中的 Admin API / 模块设计仅是设计证据，不是页面完成证据。
- **Gate / Evidence**：暂无 Admin 页面、路由、权限绑定、交互测试或验收证据，因此保持 `todo`。Rewards Design `done` 不自动升级 Admin Lane。
- **Next Action**：在 Rewards Backend API 可用后创建真实 Admin Page 与 Stage，绑定 Operations 权限 / 审计，完成 Program / Rule 生命周期操作、记录查询和 Delivery 异常处置，再回填 `admin_pages` 与 Gate。

## Mobile

状态：na

- **Scope**：本 Feature 是 Operator / Admin 运营能力，不承担终端用户 Mobile 页面。
- **Stage / Artifact**：`mobile_pages` 为空，且 canonical 后台职责面向运营人员。
- **Gate / Evidence**：不适用；用户侧奖励记录属于其它交付面，不应复制本后台功能到 Mobile。
- **Next Action**：无 Mobile 实现动作。

## 集成

状态：todo

- **Scope**：打通 Rewards Backend、Admin UI、Operations RBAC / 审计，以及 Delivery 到 Commerce 资产交易引用的只读关联；异常处置需遵守 Rewards / Commerce 边界。
- **Stage / Artifact**：canonical 已定义后台命令与跨域边界，但当前未发现对应 Integration Stage 或集成测试。
- **Gate / Evidence**：暂无真实 Admin → Rewards API → 数据库 / Worker / Commerce 引用链路证据。
- **Next Action**：Backend 与 Admin 完成后补集成测试，至少覆盖权限拒绝、审计记录、非法状态转换、Delivery retry / cancel，以及成功 Delivery 的 Commerce reference 展示。

## 验收

状态：todo

- **Scope**：验证运营人员能安全管理计划 / 规则并排查奖励发放，同时不能绕过 Commerce 直接改资产，也不会把 Reward Grant 当作最终到账事实。
- **Stage / Artifact**：当前无本 Feature 的 Acceptance Stage、验收报告或 Gate。
- **Gate / Evidence**：暂无 E2E / UAT 证据。
- **Next Action**：完成 Admin + Backend + Integration 后执行权限、审计、生命周期、异常投递和跨域边界验收；只有真实证据存在后才能把相应 Lane 标记为 `done`。
