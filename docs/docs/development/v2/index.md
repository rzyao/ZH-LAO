---
status: frozen
last_updated: 2026-08-30
---

# ZH-LAO V2 开发计划

本区是 ZH-LAO V2 从 PostgreSQL 数据库基线进入完整产品开发、全系统验证和上线准备的正式执行入口。

## 当前状态

- PostgreSQL V2 Baseline：`COMPLETE / PASS`
- 当前唯一下一阶段：`PHASE 1 — Application Foundation`
- Application Foundation 当前状态：`NEXT`
- 本区当前只建立总计划与进度记录；Phase 1 仍须单独制定详细分计划并审核后才能实施。

## 权威文档

- [ZH-LAO V2 全量开发总计划](MASTER_DEVELOPMENT_PLAN.md)：`MASTER / FROZEN`，约束全部 Phase。
- [开发进度记录表](DEVELOPMENT_PROGRESS.md)：记录各 Phase 状态、Gate、证据、阻塞项和更新历史。

## 维护规则

1. 每个 Phase 必须按“计划 → 审核 → 实施 → 测试 → 审计 → 报告 → Exit Gate”推进。
2. 依赖阶段只有在 Gate 为 `PASS` 时才能继续；`PASS_WITH_BLOCKERS` 不满足依赖准入。
3. Phase 状态变化时同步更新进度表，并在更新历史中追加记录，不删除旧记录。
4. 新建 Phase 计划或报告后再把“待创建”替换为有效链接，禁止预先放置死链接。
5. Master Plan 的冻结规则发生变化时，必须记录 `MASTER PLAN REVISION`，不得由单个 Phase 隐式修改。

## 后续目录

后续按总计划建立 `00-database/` 至 `17-launch/` 的 Phase 目录。未进入的 Phase 不提前创建空计划、空报告或臆测性 API 文档。
