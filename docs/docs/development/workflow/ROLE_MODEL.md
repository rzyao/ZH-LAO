---
status: active
last_updated: 2026-08-31
---

# AI Role Model

本页定义 ZH-LAO V2 多会话工作流中的固定角色。角色定义“这个 AI 会话可以做什么”，Task Manifest 定义“这个角色这一次具体做什么”。

本模型允许不同 AI 能力、不同执行环境分工：**高推理能力会话优先承担 Architect / Spec Compiler；本地编码能力更强但推理较弱的会话优先承担 Implementation Worker。** 角色仍是权限边界，不是模型品牌或人格标签。

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

## 3. `design_worker` — Architect / Spec Compiler

职责：

```text
Repository Audit
→ Product Semantics
→ Use Cases / Workflows
→ HTTP API / Public Contract
→ Executable Spec（若该 Domain adopted）
→ Implementation Plan
→ Design Audit
→ DESIGN_GATE
→ Execution Brief
→ Implementation Blueprint（当下游 Task 要求）
```

可以：

- 创建/修改当前 Task 明确允许的设计文档；
- Grounding 当前 main；
- 创建/维护 canonical spec 与 Requirement mapping（仅在 Task 授权时）；
- 输出下游 Execution Brief；
- 在 Design Gate PASS 后，把冻结设计“编译”为接近伪代码的 Implementation Blueprint；
- 明确 exact file/symbol map、事务、并发、错误、安全、测试与 Decision Budget。

Blueprint 规则：

- 必须遵守 `../SPEC_SYSTEM.md` 与 `../IMPLEMENTATION_BLUEPRINT_TEMPLATE.md`；
- 必须绑定 `base_commit`，以及 adopted Domain 的 canonical spec SHA-256；
- 必须区分 `LOCKED / CONSTRAINED / FREE`；
- 不得为了让 Blueprint 看起来完整而虚构仓库中不存在的现有 symbol；需要新建的 symbol 必须明确写 `CREATE`；
- Blueprint 是 derived guidance，不得借机改写已冻结的产品/架构事实。

禁止：

- 正式 Backend Implementation；
- Admin/Mobile Implementation；
- 绕过 frozen migration / public contract；
- 把 Design PASS 或 Blueprint ready 当作 Backend PASS；
- 把实现便利性反向升级为新 requirement。

## 4. `backend_worker` — Implementation Worker

职责：

```text
Entry Audit
→ Blueprint / Spec Snapshot Validation（若 required）
→ Backend Implementation
→ Integration / Security / Concurrency
→ Tests / CI
→ Final Audit
→ DOMAIN_GATE
```

可以修改 Task Manifest 允许的 backend/module/test/docs 路径。

当 Manifest 指向 Implementation Blueprint 时，必须：

1. 在第一处代码修改前验证 `base_commit`、canonical spec SHA、authority snapshot；
2. 按 Blueprint 的 File Change Map / Symbol Contracts / Implementation Order 实现；
3. 只在 Decision Budget 的 `CONSTRAINED / FREE` 范围内自行决策；
4. 将实际 diff / tests / evidence 与 Requirement Trace 对齐。

禁止：

- 未经授权修改其它 Domain canonical owner；
- 直接跨 Domain 写库；
- 自动进入 Admin / Client；
- 当前 Gate FAIL 后继续下游 dependent task；
- 修改 Blueprint 的 `LOCKED` 决策以迁就本地实现；
- 碰到设计缺口时自行重做架构。

遇到设计/仓库问题必须使用：

```text
SPEC_CONFLICT
IMPLEMENTATION_BLOCKER
REPOSITORY_DRIFT
```

然后按 `SPEC_SYSTEM.md` 停止或 revalidate。

## 5. `admin_worker` — Implementation Worker

职责：

```text
Admin Entry Audit
→ Blueprint / Contract Snapshot Validation（若 required）
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

若 Manifest 指向 Blueprint，同样受 `LOCKED / CONSTRAINED / FREE` 与三类 Conflict Protocol 约束。Admin Worker 不得通过前端临时逻辑修补缺失的 Backend/Public Contract 语义。

## 6. `client_worker` — Implementation Worker

职责：

- Mobile / C-end client contract integration；
- Blueprint / API snapshot validation（若 required）；
- 用户旅程；
- API wiring；
- loading/error/empty states；
- Client E2E / evidence；
- Client Gate 或 Phase 14 收口证据。

禁止：

- 伪造未实现的 Backend API；
- 直连业务数据库；
- 把 Mobile Foundation PASS 当作业务功能完成；
- 自行改变 public API / error semantics / auth contract；
- 以本地 UI 实现便利为理由修改 Blueprint `LOCKED` 决策。

## 7. `recovery_worker`

只在异常路径使用。

适用：

- Design Gate FAIL；
- Implementation Gate FAIL；
- Test/Regression FAIL；
- Contract conflict；
- dependency drift；
- concurrent conflict；
- `SPEC_CONFLICT`；
- `IMPLEMENTATION_BLOCKER`；
- `REPOSITORY_DRIFT`；
- Grounding failure / invalid Gate；
- 文档污染或错误 Spec/Blueprint 扩散。

任务边界：

```text
确认真实失败原因
→ 修最短合法问题
→ 必要时重生成/重验证 Blueprint
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
- 用全局页面覆盖更高优先级 Report/Gate；
- 把 Blueprint ready 误报为 Implementation COMPLETE。

## 9. 角色权限矩阵

| Role | Design Docs | Blueprint | Backend Code | Admin Code | Client Code | Gate Fix | Global Control Views |
| --- | --- | --- | --- | --- | --- | --- | --- |
| workflow_dispatcher | 只读/调度 | 只读 | 否 | 否 | 否 | 否 | 可协调更新 |
| design_worker | 是 | 创建/维护 | 否 | 否 | 否 | Design only | 否 |
| backend_worker | 必要时 | 只读/报告漂移 | 是 | 否 | 否 | Backend Gate | 仅任务事实 |
| admin_worker | 必要时 | 只读/报告漂移 | 仅必要 wiring | 是 | 否 | Admin Gate | 仅任务事实 |
| client_worker | 必要时 | 只读/报告漂移 | 否 | 否 | 是 | Client Gate | 仅任务事实 |
| recovery_worker | 按原失败范围 | 按恢复范围 | 按失败范围 | 按失败范围 | 按失败范围 | 是 | 仅恢复事实 |
| reconciliation_worker | 否 | 只读 | 否 | 否 | 否 | 否 | 是 |

Implementation Worker 原则上不直接改 Blueprint。若只发现 private implementation detail 与实际仓库略有不同、且完全处于 `CONSTRAINED/FREE`，可按 Blueprint 允许范围实现并在 Report 记录；若会影响 `LOCKED` 或 authority mapping，必须停止并升级。

## 10. 推荐能力映射

当存在“一个 AI 推理强但主要通过 GitHub 修改仓库、另一个 AI 能编辑本地代码但推理较弱”的组合时，推荐：

```text
Strong reasoning / GitHub AI
  → design_worker
  → Spec Compiler
  → canonical spec / Execution Brief / Implementation Blueprint

Local coding AI
  → backend_worker / admin_worker / client_worker
  → checkout exact base_commit
  → mechanical implementation
  → local tests
  → report actual deviations and evidence
```

目标不是让本地 Worker 完全“不思考”，而是把它必须承担的设计自由度限制到：

```text
private implementation details
local compilation/test repair
CONSTRAINED/FREE decisions
```

事务边界、状态机、API、Public Contract、错误、安全、跨域语义等高风险决策应在 Blueprint 前完成。

## 11. 角色选择规则

Task Manifest 必须显式写：

```yaml
role: backend_worker
```

新会话不得自行升级角色权限。

例如 `design_worker` 发现“顺手实现几个 API 很简单”也不得开始实现；必须完成 Design Gate / Blueprint 后输出新的 `backend_worker` Task。

同样，`backend_worker` 发现 Blueprint 缺了一项产品裁决时，不得把自己升级成 `design_worker`；应返回 `IMPLEMENTATION_BLOCKER` 或对应 Recovery/Design Task。

> Role 是权限边界，不是人格标签；能力更强的 AI 应承担更多上游推理，而不是获得绕过 Gate 的权限。
