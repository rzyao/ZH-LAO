---
feature_id: admin-auth-hardening
title: 后台 MFA / 邀请 / 登录失败保护
portfolio_status: deferred
domain:
  - operations
  - identity
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

# 后台 MFA / 邀请 / 登录失败保护

## 功能概览

Portfolio Status：`deferred`。

该 Feature 当前仍在延期组合中。Operations V1 canonical 明确不拥有 password / OTP / JWT / session，也没有为 MFA、Operator invitation 或登录失败保护冻结新的 Operations 表、API 或状态机。本页只记录真实边界与下一步，不因 Operations Design/Backend Gate 已 PASS 而提前宣称该 Feature 已设计或实现。

## 设计

状态：todo

- **范围**：未来需要明确后台 MFA、邀请生命周期、登录失败保护分别由 Identity、Operations 与 Admin 承担的责任边界。
- **Stage / Artifact**：当前仅有 Operations V1 authentication boundary，可参考 `OPERATIONS_RBAC_CONTRACTS.md`；尚无本 Feature 的 canonical design artifact。
- **Gate / Evidence**：无本 Feature Design Gate；Operations Design Gate 不覆盖延期的 MFA/邀请/登录失败保护。
- **下一步**：Portfolio 重新激活后，先以 Identity authentication contract 为上游，形成独立需求、威胁模型、状态机与 Design Gate。

## Backend

状态：todo

- **范围**：仅在设计冻结后实现所需 MFA challenge、邀请消费或失败保护服务；不得把现有 Operations RBAC 当成这些能力。
- **Stage / Artifact**：未开始；现有 Operations Backend 只消费已认证 `AuthContext`。
- **Gate / Evidence**：无本 Feature Backend evidence。
- **下一步**：等待 Feature 重新进入 active portfolio 且设计通过后实施。

## Admin

状态：todo

- **范围**：未来可能包含 MFA challenge、邀请接受、失败/锁定提示等后台交互；具体 UI 以未来冻结设计为准。
- **Stage / Artifact**：当前 Admin login 仍是 placeholder，没有 MFA/邀请/登录失败保护 UI implementation。
- **Gate / Evidence**：无 Admin Gate / E2E evidence。
- **下一步**：不得在延期期间根据猜测创建 Admin 页面或流程。

## Mobile

状态：na

- **范围**：该 Feature 面向内部 Admin，不属于 Mobile 客户端交付面。
- **Stage / Artifact**：不适用。
- **Gate / Evidence**：不要求 Mobile Gate。
- **下一步**：无。

## 集成

状态：todo

- **范围**：未来需覆盖 Identity auth、Operations Operator admission 与 Admin UI 之间的强化认证链路。
- **Stage / Artifact**：未开始。
- **Gate / Evidence**：当前无本 Feature integration evidence。
- **下一步**：设计与各实现 Lane 就绪后再建立集成场景。

## 验收

状态：todo

- **范围**：未来验证强化认证的安全行为、恢复路径和用户可见错误处理。
- **Stage / Artifact**：未开始。
- **Gate / Evidence**：无本 Feature Acceptance Gate。
- **下一步**：保持 deferred，不将 Operations V1 Gate 误用为本 Feature 验收结果。
