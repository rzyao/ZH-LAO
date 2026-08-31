---
status: active
last_updated: 2026-08-31
---

# AI Role Model

本页定义 ZH-LAO V2 多会话工作流中的固定角色。角色定义“这个 AI 会话可以做什么”，Task Manifest 定义“这个角色这一次具体做什么”。

## 1. Human Controller

不是 AI Worker。

职责：

- 决定同时开启哪些 READY Task；
- 接受或拒绝建议的并行窗口；
- 对需要产品/架构人工裁决的事项做最终决定；
- 不负责向新会话复述上下文。

## 2. `workflow_dispatcher`

职责：

- 读取最新 main；
- 汇总 Gate / Report / Task / Claim；
- 计算 READY / BLOCKED / ACTIVE / RECOVERY_REQUIRED；
- 识别 newly unlocked tasks；
- 生成下一批可独立启动的 Prompt；
- 必要时协调 Reconciliation。

禁止：

- 领取业务 Worker Claim；
- 修改 Domain 业务实现；
- 伪造 Gate；
- 因为“应该完成了”而修改状态。

## 3. `design_worker`

职责：

```text
Repository Audit
→ Product Semantics
→ Use Cases / Workflows
→ HTTP API / Public Contract
→ Implementation Plan
→ Design Audit
→ DESIGN_GATE
```

可以：

- 创建/修改当前 Task 明确允许的设计文档；
- Grounding 当前 main；
- 输出下游 Execution Brief 候选。

禁止：

- 正式 Backend Implementation；
- Admin/Mobile Implementation；
- 绕过 frozen migration / public contract；
- 把 Design PASS 当作 Backend PASS。

## 4. `backend_worker`

职责：

```text
Entry Audit
→ Backend Implementation
→ Integration / Security / Concurrency
→ Tests / CI
→ Final Audit
→ DOMAIN_GATE
```

可以修改 Task Manifest 允许的 backend/module/test/docs 路径。

禁止：

- 未经授权修改其它 Domain canonical owner；
- 直接跨 Domain 写库；
- 自动进入 Admin / Client；
- 当前 Gate FAIL 后继续下游 dependent task。

## 5. `admin_worker`

职责：

```text
Admin Entry Audit
→ Admin UI / Workflow
→ Real API Integration
→ Operations RBAC / Audit
→ E2E
→ ADMIN_GATE
```

必须区分：

- UI/Contract Stage A；
- Real Operator/RBAC/Audit Stage B；
- 最终 Admin Gate。

Backend PASS 不代表 Admin PASS。

## 6. `client_worker`

职责：

- Mobile / C-end client contract integration；
- 用户旅程；
- API wiring；
- loading/error/empty states；
- Client E2E / evidence；
- Client Gate 或 Phase 14 收口证据。

禁止：

- 伪造未实现的 Backend API；
- 直连业务数据库；
- 把 Mobile Foundation PASS 当作业务功能完成。

## 7. `recovery_worker`

只在异常路径使用。

适用：

- Design Gate FAIL；
- Implementation Gate FAIL；
- Test/Regression FAIL；
- Contract conflict；
- dependency drift；
- concurrent conflict；
- Grounding failure / invalid Gate；
- 文档污染或错误 Spec 扩散。

任务边界：

```text
确认真实失败原因
→ 修最短合法问题
→ 重跑原测试 / Audit / Gate
→ 报告结果
→ STOP
```

禁止自动推进原 Gate 之后的下游阶段。

## 8. `reconciliation_worker`

职责：

- 汇总多个 Worker 已写入的 Task/Gate/Report/Event；
- 修复全局控制页面漂移；
- 更新 Matrix / Progress / Control Center；
- 检查遗漏 Admin/Client/Recovery track；
- 识别并发会话产生的状态不一致。

禁止：

- 业务实现；
- 自行把未 PASS 的 Gate 改为 PASS；
- 用全局页面覆盖更高优先级 Report/Gate。

## 9. 角色权限矩阵

| Role | Design Docs | Backend Code | Admin Code | Client Code | Gate Fix | Global Control Views |
| --- | --- | --- | --- | --- | --- | --- |
| workflow_dispatcher | 只读/调度 | 否 | 否 | 否 | 否 | 可协调更新 |
| design_worker | 是 | 否 | 否 | 否 | Design only | 否 |
| backend_worker | 必要时 | 是 | 否 | 否 | Backend Gate | 仅任务事实 |
| admin_worker | 必要时 | 仅必要 wiring | 是 | 否 | Admin Gate | 仅任务事实 |
| client_worker | 必要时 | 否 | 否 | 是 | Client Gate | 仅任务事实 |
| recovery_worker | 按原失败范围 | 按失败范围 | 按失败范围 | 按失败范围 | 是 | 仅恢复事实 |
| reconciliation_worker | 否 | 否 | 否 | 否 | 否 | 是 |

## 10. 角色选择规则

Task Manifest 必须显式写：

```yaml
role: backend_worker
```

新会话不得自行升级角色权限。

例如 `design_worker` 发现“顺手实现几个 API 很简单”也不得开始实现；必须完成 Design Gate 后输出新的 `backend_worker` Task。

> Role 是权限边界，不是人格标签。
