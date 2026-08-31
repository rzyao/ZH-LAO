---
feature_id: admin-login
title: 后台登录与操作员认证
portfolio_status: active
domain:
  - operations
  - identity
status:
  design: done
  backend: done
  admin: todo
  mobile: na
  integration: todo
  acceptance: todo
evidence:
  design:
    - docs/docs/domains/operations/index.md
    - docs/docs/development/04-operations/OPERATIONS_RBAC_CONTRACTS.md
    - docs/docs/development/04-operations/OPERATIONS_API.md
  backend:
    - docs/docs/development/04-operations/OPERATIONS_IMPLEMENTATION_REPORT.md
    - apps/backend/src/modules/operations/http/routes.ts
    - apps/backend/test/integration/operations-e2e.test.ts
mobile_pages: []
admin_pages: []
---

# 后台登录与操作员认证

## 功能概览

Portfolio Status：`active`。

本 Feature 是 Identity 认证与 Operations Operator 授权边界的交汇点：Identity 负责凭证、OTP、JWT 与会话真实性；Operations 只把已认证的 Identity `subjectId` 解析为 active Operator，并计算角色与精确 Permission。`Operations Backend capability done` 不等于 `Admin 登录 UI done`，也不等于本 Feature 已端到端交付。

## 设计

状态：done

- **范围**：冻结后台请求的认证/授权边界：先由 Identity 产出 `AuthContext`，再由 Operations 解析 Operator、检查状态并计算 RBAC；Operations 不拥有 password / OTP / JWT / session。
- **Stage / Artifact**：Operations Domain Design；`domains/operations/index.md`、`OPERATIONS_RBAC_CONTRACTS.md`、`OPERATIONS_API.md`。
- **Gate / Evidence**：`OPERATIONS_DESIGN_GATE = PASS`；canonical contract 明确 `Identity authentication -> Operations operator resolution -> exact permission`。
- **下一步**：设计 Lane 保持冻结；若未来后台采用不同于现有 Identity 的认证方式，先在 Identity/Operations 边界重新裁决，不在 Feature Page 发明第二套管理员认证系统。

## Backend

状态：done

- **范围**：Operations 已提供认证后的 Operator admission：`GET /api/v1/admin/operations/me`、active Operator 校验、角色/权限解析与精确权限授权；底层认证仍由 Identity AuthenticationProvider 完成。
- **Stage / Artifact**：Operations Implementation；`apps/backend/src/modules/operations/http/routes.ts`、Operations public contracts/service、`OPERATIONS_IMPLEMENTATION_REPORT.md`。
- **Gate / Evidence**：`OPERATIONS_GATE = PASS`；真实 PostgreSQL E2E 已覆盖 `Identity JWT -> Operator -> role permission -> Operations mutation -> Audit -> immediate revocation`。
- **下一步**：保持 Backend contract/regression；不要把 Admin 登录页面尚未接线的问题回写成 Operations Backend 未完成。

## Admin

状态：todo

- **范围**：真实后台登录交互、会话恢复/退出、加载当前 Operator 与 permissions，并把结果接入 Admin `AuthProvider`/guards。
- **Stage / Artifact**：Admin Foundation 只提供认证骨架；当前 `apps/admin/src/pages/login.tsx` 明确仍是 login placeholder，`AuthContext` 仍使用 `setAuthenticated` skeleton seam。
- **Gate / Evidence**：当前 main 未发现真实 Operator login/session 与 `/api/v1/admin/operations/me` 的 Admin 接线验收证据。
- **下一步**：在独立 Operations Admin/Identity Admin 实施阶段接入真实认证与 `/operations/me`；完成前不得把 placeholder 计为 Admin done。

## Mobile

状态：na

- **范围**：内部后台 Operator 登录不属于 Mobile 客户端交付面。
- **Stage / Artifact**：不适用。
- **Gate / Evidence**：不要求 Mobile Gate。
- **下一步**：无。

## 集成

状态：todo

- **范围**：Admin 登录页与 Identity 认证、Operations `/me`、permission-aware navigation/guards 的完整接线。
- **Stage / Artifact**：Backend integration 已有；Admin 侧真实认证 seam 尚未替换。
- **Gate / Evidence**：Operations Backend E2E 不能替代 Admin 登录端到端证据；当前无该 Feature 的 Admin+Backend E2E。
- **下一步**：完成真实登录后增加成功、无 Operator、disabled Operator、无权限、session 失效等集成场景。

## 验收

状态：todo

- **范围**：从 Operator 真实登录到进入后台、权限加载、权限拒绝与退出的用户可见闭环。
- **Stage / Artifact**：Feature acceptance 尚未开始；Operations Backend Gate 已 PASS，仅作为前置证据。
- **Gate / Evidence**：当前无可证明 Admin UI + Identity + Operations 端到端交付的 Feature Gate。
- **下一步**：Admin 与集成 Lane 完成后执行 Feature E2E/验收，再决定是否标记 done。
