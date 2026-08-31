---
status: bootstrap_required
last_updated: 2026-08-31
---

# Workflow Task Index

当前 Workflow Control Plane **规范文档已建立，但 Task Registry 尚未执行首次 Bootstrap**。

因此本页现在不声明任何 Task 为 READY / ACTIVE / BLOCKED。

## 下一合法动作

执行：

[WORKFLOW_BOOTSTRAP_BRIEF.md](WORKFLOW_BOOTSTRAP_BRIEF.md)

由 `workflow_dispatcher` 基于执行时最新 `main`：

1. 重新审计全局 Gate / Report / Brief / code / tests；
2. 创建真实 `workflow/tasks/*.yaml`；
3. 生成本页的 Task Index；
4. 计算 READY / BLOCKED / ACTIVE / RECOVERY_REQUIRED；
5. 生成 `NEXT_ACTIONS.md`；
6. 为所有 READY Task 生成无上下文新会话 Prompt；
7. STOP，不执行任何业务 Task。

> 在 Bootstrap 完成前，不得根据本页猜测当前开发任务状态。
