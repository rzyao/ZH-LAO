---
status: control-center
last_updated: 2026-08-31
---

# 开发流程控制中心

本页是开发控制面的**导航与裁决入口**，不再复制每个 Domain 的详细进度和排期。

它回答：

- 当前状态应该去哪里看；
- 哪种证据优先级最高；
- 什么条件允许 Task 开始；
- 哪些轨道可以并行；
- Gate FAIL、Spec Conflict 或 Repository Drift 时怎么处理。

## 一、控制面入口

| 问题 | 查看 |
| --- | --- |
| 现在最应该启动什么 | [当前下一动作](workflow/NEXT_ACTIONS.md) |
| 某个 Domain 处于生命周期哪一步 | [领域生命周期矩阵](DOMAIN_LIFECYCLE_MATRIX.md) |
| 某个阶段有哪些详细证据和历史 | [开发进度记录](DEVELOPMENT_PROGRESS.md) |
| 新会话如何恢复角色、Task、Claim、依赖 | [Workflow Control Plane](workflow/) |
| Executable Spec / Blueprint 怎么工作 | [Executable Spec System](SPEC_SYSTEM.md) |
| Blueprint 应包含什么 | [Implementation Blueprint Template](IMPLEMENTATION_BLUEPRINT_TEMPLATE.md) |
| 当前 Task 能不能开始 | 读取该 Task Manifest + Entry Gate + required sources |

本页不保存另一份“当前 Task 排期表”。动态调度只在 `workflow/NEXT_ACTIONS.md` 维护，避免多份全局页面互相漂移。

## 二、Source of Truth 优先级

### 产品 / 架构 / 领域事实

```text
Frozen Physical Migration（涉及物理 DB 时）
→ Accepted ADR / Frozen Architecture Contract
→ Canonical Product / Domain Docs
→ Upstream Frozen Public Contracts
→ Canonical Executable Spec（已采用时）
→ Execution Brief
→ Implementation Blueprint
→ Implementation Notes
```

Implementation Blueprint 是 derived HOW，不能覆盖上游 WHAT / MUST BE TRUE。

### 完成状态

```text
Final Gate / Final Audit
→ Implementation Report
→ Current Code + Tests / CI Evidence
→ Task Manifest / Task Events
→ DEVELOPMENT_PROGRESS
→ NEXT_ACTIONS / Matrix / Control Center summary
```

因此：

- 有代码 commit 不等于 Gate PASS；
- Matrix 显示 PASS 但 Final Gate 显示 FAIL 时，以 Final Gate 为准；
- Blueprint Ready 不等于实现完成；
- 聊天上下文不属于 authority。

## 三、标准领域生命周期

完整说明见[开发执行入口](index.md)。控制面使用以下状态骨架：

```text
Baseline / Repository Grounding
→ Domain Design
   ├─ Product Semantics
   ├─ Use Cases / Workflow
   ├─ State Machine
   ├─ API / Public / Cross-domain / Event Contract
   └─ Security / Permission / Transaction / Concurrency / Idempotency
→ Executable Spec（采用时）
→ DESIGN_GATE
→ Execution Brief
→ Implementation Blueprint
→ IMPLEMENTATION_READY_VALIDATION
→ Backend Implementation
→ BACKEND_VERIFICATION_GATE
→ Admin / Client / Cross-domain Integration（按适用范围并行）
→ DOMAIN_ACCEPTANCE_GATE
→ DOMAIN_ACCEPTED
→ System Integration / Production Readiness / Release
```

### 不能混用的状态

```text
DB_CONTRACT_FROZEN      ≠ Backend Implemented
DESIGN_GATE PASS        ≠ Backend Verified
BACKEND_VERIFIED        ≠ Domain Accepted
ADMIN_GATE PASS         ≠ Client Complete
DOMAIN_ACCEPTED         ≠ Production Ready
```

任何全局页面都不得把这些状态压缩成一个模糊的 `FROZEN`。

## 四、Task 准入

Implementation Worker 开始代码修改前至少必须确认：

1. 当前 Task Manifest 存在；
2. Role 与 Task 匹配；
3. Entry Gate 满足；
4. required sources 可读取；
5. upstream dependency snapshot 仍有效；
6. active Claim 不冲突；
7. 如果 Blueprint required：Blueprint 存在且 `base_commit`、spec SHA、authority snapshot 可验证；
8. 没有 material repository drift。

任何一项不满足，都不能通过“根据当前代码猜一下”绕过。

## 五、并行规则

严格的是**依赖链上的 Gate 顺序**，不是整个项目只能串行推进一个 Phase。

可并行 Task 必须同时满足：

```text
upstream dependency satisfied
+ conflicts_with check passed
+ owned/shared/exclusive paths compatible
+ public contract snapshot compatible
+ active claims compatible
```

典型并行轨：

```text
Backend Worker
+ Admin Worker
+ Client Worker
+ Design / Spec Compiler
+ Recovery / Audit Worker
```

详细规则见 [CONCURRENCY_RULES](workflow/CONCURRENCY_RULES.md)。

## 六、Gate FAIL / Recovery / Drift

异常不是生命周期末尾的一列，而是任意状态都可能触发的转移：

```text
ANY STATE
→ GATE_FAIL
  / SPEC_CONFLICT
  / IMPLEMENTATION_BLOCKER
  / REPOSITORY_DRIFT
→ RECOVERY_REQUIRED
→ Recovery / Design Fix / Revalidation
→ 重新运行原 Gate
```

### 下游调度

```text
当前 Gate != PASS
→ dependent downstream = BLOCKED
→ shortest legal Recovery = PRIMARY
→ independent parallel-safe Task = 可继续
```

Implementation Worker 不得自行：

- 改 frozen migration；
- 改公共契约来迁就实现；
- 扩大 Task Scope；
- 把缺失设计解释成自己的自由决策。

## 七、Grounding Gate

准备记录以下严重 finding 时：

```text
BLOCKER
HIGH
DATABASE_CONTRACT_CONFLICT
DESIGN_CONTRACT_CONFLICT
SPEC_CONFLICT
REPOSITORY_DRIFT
```

必须重新 grounding 到当前 `main`，至少给出：

1. source path；
2. exact heading / symbol / field；
3. current commit；
4. 与 frozen authority / public contract 的交叉验证；
5. 可复现 evidence。

无法在当前 source 中重新找到的 finding 不得进入 Gate 计数。

## 八、全局视图维护

Worker 的主要写入对象是自己的 Task 事实：

```text
Task Manifest
Task Event
Domain Report / Audit
Gate Evidence
Claim release
Blueprint conformance / conflict evidence
```

以下属于派生全局视图：

```text
workflow/NEXT_ACTIONS.md
DOMAIN_LIFECYCLE_MATRIX.md
DEVELOPMENT_PROGRESS.md
DEVELOPMENT_CONTROL_CENTER.md
```

它们应由 Dispatcher / Reconciliation 汇总，不应由多个并行 Worker 同时把同一状态抄写到四个大文件。

## 九、Production Readiness

Production Readiness 是系统级生命周期，不是单个 Domain 在 Backend Gate 后自行宣布。

只有 release-required 的 Domain、Admin、Client、Integration 全部满足要求后，才进入：

```text
Full-System E2E
Performance
Security
Observability
Migration / Deploy Validation
Backup / Restore
Secrets / Configuration
Disaster Recovery
PRODUCTION_READINESS_GATE
Release
```

## 十、当前下一动作

不要在本页维护静态“当前执行窗口”。

直接读取：

**[workflow/NEXT_ACTIONS.md →](workflow/NEXT_ACTIONS.md)**

然后对准备启动的 Task 重新验证最新 `main`、Manifest、Claim 和 Entry Gate。
