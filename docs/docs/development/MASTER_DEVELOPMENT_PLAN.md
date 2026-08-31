---
status: superseded
last_updated: 2026-08-31
---

# 旧全量开发总计划（兼容入口）

这条路径曾承载基于“单一正式 Phase 串行推进”的全量开发计划。

该模型已经被当前 Workflow Control Plane、Executable Spec、Implementation Blueprint、并行 Task / Claim 与领域验收模型取代，因此**不再作为开发 authority，也不再维护原 40KB Phase 计划正文**。

旧内容仍可通过 Git 历史追溯；当前任务不得根据旧版本的 Phase 顺序获得实施权限。

## 当前开发 authority

按以下顺序读取：

1. [开发入口](index.md)
2. [AI 多会话 Workflow Control Plane](workflow/)
3. [当前下一动作](workflow/NEXT_ACTIONS.md)
4. [Executable Spec System](SPEC_SYSTEM.md)
5. [开发流程控制中心](DEVELOPMENT_CONTROL_CENTER.md)
6. 当前 Task Manifest、Execution Brief、Implementation Blueprint、Gate / Report

## 当前流程原则

```text
基线 / Repository Grounding
→ 领域设计
   ├─ 产品语义
   ├─ 用例与工作流
   ├─ 状态机
   ├─ API / Public / Cross-domain / Event Contract
   └─ 安全 / 权限 / 事务 / 并发 / 幂等
→ Executable Spec（采用时）
→ Design Gate
→ Execution Brief
→ Implementation Blueprint
→ Implementation Ready Validation
→ Backend Implementation
→ Backend Verification Gate
→ Admin / Client / Cross-domain Integration（按适用范围并行）
→ Domain Acceptance Gate
→ Domain Accepted
→ 系统级集成 / Production Readiness / Release
```

严格的是**依赖与 Gate 顺序**，不是“整个项目任何时刻只能有一个 Phase”。依赖已经满足、路径和契约不冲突的 Task 可以按 Workflow Claim 规则并行。

## 状态语义

```text
Backend Verified ≠ Domain Accepted
Contract Frozen  ≠ Domain Implemented
Blueprint Ready  ≠ Implementation Complete
Domain Accepted  ≠ Production Ready
```

Recovery / Spec Conflict / Repository Drift 可以从任意阶段触发，修复后必须重新验证原 Gate。

> 本页只为历史链接兼容保留，不应被新文档作为 canonical 计划引用。
