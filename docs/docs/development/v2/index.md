---
status: active
last_updated: 2026-08-31
---

# ZH-LAO V2 开发计划

本区是 ZH-LAO V2 从 PostgreSQL 数据库基线进入完整产品开发、全系统验证和上线准备的正式执行入口。

## 推荐阅读顺序

1. [开发流程控制中心](DEVELOPMENT_CONTROL_CENTER.md)：回答“现在该做什么、哪些能并行、哪些 Gate 没关、是否存在 Recovery/Drift”。
2. [Domain 全生命周期矩阵](DOMAIN_LIFECYCLE_MATRIX.md)：全宽查看每个 Domain 从 DB / Spec / Backend / Admin / Client 到 Integration / Release 的完整状态。
3. [开发进度记录表](DEVELOPMENT_PROGRESS.md)：查看各 Phase 的详细状态、Gate、验证证据、阻塞项和历史。
4. [ZH-LAO V2 全量开发总计划](MASTER_DEVELOPMENT_PLAN.md)：查看冻结的全局 Phase 顺序、依赖和开发原则。

## 四类控制文档

| 文档 | 作用 | 是否直接决定 Gate |
| --- | --- | --- |
| `MASTER_DEVELOPMENT_PLAN.md` | 全局 Phase / Dependency / Architecture 规则 | 定义 Gate 规则，但不记录单次执行结果 |
| `DEVELOPMENT_CONTROL_CENTER.md` | 当前流程、并行窗口、Gate / Recovery / Drift 控制 | 否，必须回到实际 Gate/Report |
| `DOMAIN_LIFECYCLE_MATRIX.md` | 每个 Domain 的全生命周期横向状态矩阵 | 否，是派生控制视图 |
| `DEVELOPMENT_PROGRESS.md` | 当前状态、证据、阻塞、历史台账 | 记录状态；若与更高优先级 Final Gate/Report 冲突，需要同步修正 |

## 标准执行模型

```text
Frozen DB / Architecture
→ Product Semantics / Use Cases
→ API / Public Contract
→ Design Audit
→ DESIGN_GATE
→ Backend Execution
→ Implementation Audit
→ DOMAIN_GATE / FROZEN
→ Admin + Mobile / Client Incremental Integration
→ ADMIN / CLIENT Gate
→ Cross-Domain Integration
→ Full-System Validation
→ Production Readiness
→ Launch
```

每个工作会话必须先读取自己对应的 Brief 和当前 `main` 真实状态；不得仅凭入口页、矩阵页或进度页判断实施权限。

## 维护规则

1. 每个 Phase 必须按“计划 → 审核 → 实施 → 测试 → 审计 → 报告 → Exit Gate”推进。
2. 依赖阶段只有在 Gate 为 `PASS` 时才能继续；`PASS_WITH_BLOCKERS` 不满足严格依赖准入。
3. Backend、Admin、Mobile/Client 是独立完成轨，不能互相代替。
4. Design 可以按 Brief 的 Parallel Rule 错位并行；Implementation 不得绕过上游 Gate。
5. 任何 `BLOCKER/HIGH/DB_CONFLICT` 必须二次 Grounding 到当前 `main` 的真实 source。
6. Phase 状态变化时同步更新进度表和生命周期矩阵；流程结构、并行窗口或 Recovery 状态变化时同步更新控制中心。
7. Master Plan 的冻结规则发生变化时，必须记录 `MASTER PLAN REVISION`，不得由单个 Phase 隐式修改。
