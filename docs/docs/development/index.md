---
status: active
last_updated: 2026-08-31
---

# 开发执行入口

本区回答两个问题：

> 当前任务**如何合法开发**？
>
> 当前任务**开发到哪里、有什么证据**？

长期产品、架构和领域事实分别属于 `product/`、`architecture/`、`domains/`；这里保存 Workflow、Task、Brief、Spec、Blueprint、Gate、Report、Recovery 与进度控制信息。

## 推荐阅读顺序

1. [AI 多会话 Workflow Control Plane](workflow/)：角色、Task、Claim、并发、Handoff 与无上下文接手协议。
2. [当前下一动作](workflow/NEXT_ACTIONS.md)：PRIMARY / PARALLEL SAFE / BLOCKED / RECOVERY REQUIRED 调度快照。
3. [Executable Spec System](SPEC_SYSTEM.md)：Requirement ID、machine-readable contract、traceability、evidence 与 machine gate 规范。
4. [Implementation Blueprint Template](IMPLEMENTATION_BLUEPRINT_TEMPLATE.md)：实现级 HOW、Decision Budget、snapshot 与 drift 协议。
5. [开发流程控制中心](DEVELOPMENT_CONTROL_CENTER.md)：当前 Gate、并行窗口、Recovery / Drift 与依赖判断。
6. [领域生命周期矩阵](DOMAIN_LIFECYCLE_MATRIX.md)：各 Domain 当前设计、实现、消费者轨与验收状态。
7. [开发进度记录](DEVELOPMENT_PROGRESS.md)：详细验证证据、阻塞和历史状态。
8. 当前 Task Manifest 指向的 Brief、Spec、Blueprint、Gate、Report 与 required sources。

不要根据聊天上下文、旧 Master Plan、矩阵单元格或“看起来差不多完成”自行获得实施权限。

## 控制文档职责

| 文档 / 工件 | 职责 | Authority 说明 |
| --- | --- | --- |
| `workflow/index.md` | 多角色、多会话、Task / Claim / Handoff 执行协议 | 当前执行协议 authority |
| `workflow/tasks/<TASK>.yaml` | 当前 Task 边界、依赖、路径、Blueprint / Spec 绑定 | 当前任务 authority |
| Execution Brief | 本次任务必须完成 / 不得完成什么 | 任务范围 authority |
| `SPEC_SYSTEM.md` | Executable Spec 与 Blueprint 采用、traceability、conflict 规则 | 规范 authority |
| Implementation Blueprint | 在绑定 snapshot 上具体如何实现 | derived HOW；不能覆盖上游 authority |
| Final Gate / Audit / Report | 是否实际完成、是否允许下游继续 | 完成状态 authority |
| `DEVELOPMENT_CONTROL_CENTER.md` | 当前流程控制、依赖、并行与恢复视图 | 派生控制视图 |
| `DOMAIN_LIFECYCLE_MATRIX.md` | Domain 生命周期横向状态 | 派生状态视图 |
| `DEVELOPMENT_PROGRESS.md` | 证据、阻塞与历史台账 | 汇总记录；不得覆盖 Final Gate |

旧 `MASTER_DEVELOPMENT_PLAN.md` 只保留历史兼容入口，不再定义当前开发权限或全局串行 Phase 顺序。

## 领域标准生命周期

```text
一、基线与现状核验
   ├─ Frozen DB / Architecture / ADR
   ├─ Upstream Contracts
   └─ Repository Grounding

二、领域设计
   ├─ 产品语义
   ├─ 用例与工作流
   ├─ 状态机
   ├─ API / Public / Cross-domain / Event Contract
   └─ 安全 / 权限 / 事务 / 并发 / 幂等

三、可执行规格（采用时）

四、设计门禁

五、实现准备
   ├─ Execution Brief
   ├─ Implementation Blueprint
   ├─ base commit / spec SHA / authority snapshot
   └─ Implementation Ready Validation

六、后端实现与验证
   ├─ Code
   ├─ Unit / Integration / State Transition Tests
   ├─ Security / Concurrency / Idempotency Tests
   └─ Backend Verification Gate

七、消费者与跨域集成
   ├─ Admin Track（适用时）
   ├─ Client Track（适用时）
   └─ Cross-domain Integration Track

八、领域验收门禁

九、Domain Accepted

十、系统级 Integration / Production Readiness / Release
```

## 状态机是一级设计事实

任何存在业务生命周期的 Domain，都必须在设计阶段显式定义：

```text
states
initial state
terminal states
legal transitions
guards
triggers / effects
failure semantics
concurrency
idempotency / retry
```

实现阶段必须验证合法迁移、非法迁移、guard、终态安全、并发与重试行为。

状态机不是“后期补测试”，也不是一个与领域设计无关的末尾阶段。

## 并行原则

严格顺序约束的是**同一依赖链的 Gate**，不是整个项目只能串行推进一个 Phase。

允许并行：

```text
依赖已经满足
+ path scope 不冲突
+ public contract snapshot 不冲突
+ Claim / conflicts_with 检查通过
```

因此可以存在：

```text
Backend Track
+ Admin Track
+ Client Track
+ Design / Spec Compiler Track
+ Recovery / Audit Track
```

具体并发规则见 [CONCURRENCY_RULES](workflow/CONCURRENCY_RULES.md)。

## 冻结、验证与验收必须区分

```text
DB Contract Frozen
Design Frozen
API / Public Contract Frozen
Backend Verified
Admin Verified
Client Verified
Integration Verified
Domain Accepted
Release Ready
```

其中：

- `Backend Verified` 不等于整个 Domain 完成；
- `Contract Frozen` 不等于已经实现；
- `Blueprint Ready` 不等于代码完成；
- `Domain Accepted` 不等于系统已经 Production Ready。

## Recovery / Drift

Recovery 不是线性生命周期的最后一步，而是任意阶段都可能发生的异常转移：

```text
ANY STATE
→ SPEC_CONFLICT / IMPLEMENTATION_BLOCKER / REPOSITORY_DRIFT / GATE_FAIL
→ RECOVERY_REQUIRED
→ Recovery / Revalidation
→ 重新运行原 Gate
```

Implementation Worker 不得通过改变需求、公共契约、冻结 migration 或扩大 Task Scope 来“修掉”冲突。

## 系统级发布

Production Readiness 属于**整个系统**的发布生命周期，而不是每个 Domain 最后各自完成一次生产门禁。

只有所有 release-required Domain / Admin / Client / Integration 轨满足要求后，才进入：

```text
Full-System E2E
Performance
Security
Observability
Migration / Deploy Validation
Backup / Restore
Secrets / Configuration
Disaster Recovery
Production Readiness Gate
Release
```

## 维护规则

1. Worker 从最新 `main`、Task Manifest、required sources 和 Entry Gate 恢复任务，不依赖聊天记忆。
2. 新的 implementation Task 如果协议要求 Blueprint，未生成或 snapshot 无法验证时不得编码。
3. 下游依赖只有在要求的 Gate 为 `PASS` 时才能进入 READY。
4. Backend、Admin、Client、Integration 是独立验证轨，按 Domain 实际适用范围组合。
5. 并行 Worker 必须遵守 Claim、owned/shared/exclusive path 和 pre-push revalidation。
6. `SPEC_CONFLICT / IMPLEMENTATION_BLOCKER / REPOSITORY_DRIFT` 必须 STOP 并进入 Design / Recovery，而不是临场重设计。
7. Worker 首先更新自己 Task 的 Report / Gate / Manifest / Event；Matrix、Progress、Control Center 由 Dispatcher / Reconciliation 汇总。
8. 任何完成状态都必须有实际代码、测试、CI、Gate 或 Report 证据；入口页不能自证 PASS。
