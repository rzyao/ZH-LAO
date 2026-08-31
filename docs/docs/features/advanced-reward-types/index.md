---
feature_id: advanced-reward-types
title: 会员天数 / POINT / BADGE 等新奖励类型
portfolio_status: deferred
domain:
  - rewards
  - commerce
status:
  design: todo
  backend: todo
  admin: todo
  mobile: todo
  integration: todo
  acceptance: todo
mobile_pages: []
admin_pages: []
---

# 会员天数 / POINT / BADGE 等新奖励类型

## 功能概览

Portfolio Status：`deferred`。

本 Feature 只代表未来扩展奖励类型的开发入口，不表示这些类型已经进入当前 Rewards canonical。当前冻结的 Rewards V1 **只支持 Coin**；`ADR-017` 明确把会员天数、POINT / EXP / BADGE / GIFT / COUPON 等奖励形态延后。

因此本 Feature 不提前设计统一的“新奖励资产模型”，也不假设所有奖励最终都由 Commerce Wallet 承接。未来每种奖励类型都必须先明确事实归属、目标 Domain、交付语义与幂等契约，再决定是否复用现有 Reward Grant / Delivery 模式。

## 设计

状态：todo

- **Scope**：未来对会员天数、POINT、BADGE 等非 Coin 奖励逐类确认产品语义、事实所有权、目标 Domain、授予 / 撤销语义、展示方式和跨域交付边界。
- **Stage / Artifact**：当前没有该 Feature 的独立 Design Stage 或 final contract；现有 canonical 只记录“V1 不支持并延期”，不是新奖励类型设计完成的证据。
- **Gate / Evidence**：`ADR-017` 明确延期；当前 `reward_rules.reward_type` 的数据库约束仅允许 `COIN`。这说明当前实现边界仍是 Coin-only，而不是扩展能力已就绪。
- **Next Action**：Feature 被重新纳入开发组合后，先逐类型完成 ownership / contract 裁决，再建立独立 Design Stage；不得先修改表结构或把所有非 Coin 类型默认映射到 Commerce Wallet。

## Backend

状态：todo

- **Scope**：仅在新类型设计通过后，按确认后的目标 Domain / value model 扩展规则、Grant / Delivery 或新增必要模型，并保持幂等与状态机约束。
- **Stage / Artifact**：当前没有 Advanced Reward Types Backend Stage。现有 `database/v2/migrations/1000_rewards.sql` 明确限制 V1 `reward_type='COIN'`，未实现会员天数、POINT、BADGE 等类型。
- **Gate / Evidence**：暂无 Backend 实现或测试证据；现有五表基线不能被解释为已经支持任意奖励类型。
- **Next Action**：等待设计决策完成后再创建 migration / service / delivery adapter，并针对每种目标 Domain 建立真实 Backend Gate。

## Admin

状态：todo

- **Scope**：未来仅在对应奖励类型存在真实运营需求后，扩展规则配置、记录查询和异常处置 UI；Admin 不能替代目标 Domain 的资产 / 权益管理后台。
- **Stage / Artifact**：当前 `admin_pages` 为空，未发现该 Feature 的 Admin Stage、页面或权限契约实现。
- **Gate / Evidence**：暂无 Admin 证据；Rewards V1 的后台设计不能自动证明新奖励类型的配置和运营能力已支持。
- **Next Action**：等新类型 canonical 与 Backend API 稳定后，再决定需要哪些 Admin 页面、权限和审计动作并建立对应 Stage。

## Mobile

状态：todo

- **Scope**：未来根据具体奖励类型决定用户侧展示、领取或状态可见性；不预设统一 UI。
- **Stage / Artifact**：当前 `mobile_pages` 为空，未发现相关 Mobile Stage 或页面工件。
- **Gate / Evidence**：暂无 Mobile 设计 / 实现证据。
- **Next Action**：在每种奖励类型的产品语义和公开 Contract 明确后，再定义真实 Mobile 交付面。

## 集成

状态：todo

- **Scope**：未来按奖励类型连接 Rewards 与正确的目标 Domain；只有资产型奖励且契约明确时才可能走 Commerce，权益型 / 身份型 / 展示型奖励不能默认套用 Commerce Wallet delivery。
- **Stage / Artifact**：当前没有该 Feature 的 Integration Stage；现有 V1 Delivery 仅定义 `ASSET_CREDIT` → `COMMERCE` 的 Coin 路径。
- **Gate / Evidence**：暂无非 Coin 类型跨域集成证据。
- **Next Action**：设计完成后为每类奖励定义明确 target domain、idempotency key、成功事实和补偿 / 撤销语义，再实现集成测试。

## 验收

状态：todo

- **Scope**：未来按已批准的新类型逐项验证业务语义、归属边界、幂等、异常恢复和用户可见结果。
- **Stage / Artifact**：当前无 Acceptance Stage / Gate。
- **Gate / Evidence**：Feature 仍为 `deferred`，暂无可执行验收基线。
- **Next Action**：待 Portfolio 重新激活并完成设计、Backend、交付面与集成后，再建立按类型的 E2E 验收；在此之前不制造“支持新奖励类型”的完成结论。
