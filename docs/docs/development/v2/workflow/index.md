---
status: active
last_updated: 2026-08-31
---

# AI 多会话 Workflow Control Plane

本目录是 ZH-LAO V2 的 **AI 多角色、多会话并行、无上下文接手** 控制协议。

目标不是让某个 ChatGPT 会话“记住项目”，而是让任何新会话只依靠当前 GitHub `main` 就能恢复：

- 当前项目事实；
- 自己的角色；
- 当前 Task；
- Entry Gate；
- 上下游依赖；
- 并行冲突；
- 允许修改的路径；
- 必须读取的 Brief / Gate / Report；
- 当前步骤结束后的下一合法动作。

## 1. 核心原则

```text
Conversation Context = 非权威、可丢失
GitHub main          = 唯一可共享工作事实
Task Manifest        = 当前会话工作边界
Brief                = 当前任务执行规范
Gate / Report        = 完成状态证据
Claim                = 并行占用声明
Handoff              = 下一会话启动信息
```

新会话不得要求用户复述前情，只要仓库中存在合法 Task Manifest，就必须能够独立恢复并继续。

## 2. 新会话标准读取顺序

所有 Worker 会话开始时，按以下顺序读取：

1. 最新 `main` / 当前 HEAD；
2. 本页；
3. [角色模型](ROLE_MODEL.md)；
4. [会话交接契约](SESSION_HANDOFF_CONTRACT.md)；
5. [并行与 Claim 规则](CONCURRENCY_RULES.md)；
6. 当前 `tasks/<TASK_ID>.yaml`；
7. Task Manifest 指向的 Brief；
8. Task Manifest 指向的 Gate / Report / upstream public contracts；
9. 当前 active claims；
10. 重新验证 Entry Gate 后才允许执行。

如果 `tasks/<TASK_ID>.yaml` 不存在，Worker 不得凭聊天上下文自行创造正式实施权限；应进入 Dispatcher / Bootstrap 流程。

## 3. 角色与任务是两回事

角色固定，Task 动态。

例如：

```text
role    = backend_worker
task_id = LEARNING-BACKEND
```

同一个 `backend_worker` 可以先后执行 Content、Learning、Audio、Social 等不同 Task。

正式角色见 [ROLE_MODEL.md](ROLE_MODEL.md)。

## 4. 标准 Task 生命周期

```text
PLANNED
  ↓
READY
  ↓ claim
ACTIVE
  ↓
VALIDATING
  ├─ Gate PASS → COMPLETE / FROZEN / unlock downstream
  └─ Gate != PASS → RECOVERY_REQUIRED / BLOCKED
```

任何依赖当前 Gate 的下游 Task，在当前 Gate `!= PASS` 时都不能进入 READY。

## 5. 多会话并行模型

默认允许的主要并行轨：

```text
Admin Track
+
Backend Track
+
Design Track
+
必要时 Recovery / Audit Track
```

并行安全不只看 Domain 名称，还必须检查：

- `conflicts_with`；
- `owned_paths`；
- `shared_paths`；
- `exclusive_paths`；
- upstream contract snapshot；
- active claims。

详细规则见 [CONCURRENCY_RULES.md](CONCURRENCY_RULES.md)。

## 6. Gate FAIL 后的调度原则

如果当前 Gate 没有 PASS：

```text
Primary Next Action = 修复当前 Gate 的最短合法 Recovery / Fix / Re-audit
Dependent Downstream = BLOCKED
Independent Parallel Tasks = 可继续 READY
```

禁止：

```text
CONTENT_GATE = FAIL
→ 推荐 Learning Backend READY
```

允许：

```text
CONTENT_GATE = FAIL
→ Primary: Content Backend Recovery
→ Blocked: Content Admin / Learning Backend / Audio Backend
→ Parallel Safe: Operations Admin / Social Design（若各自依赖满足）
```

## 7. 全局状态页面不是 Worker 的主要写入点

以下页面是全局控制视图：

- `DEVELOPMENT_CONTROL_CENTER.md`
- `DOMAIN_LIFECYCLE_MATRIX.md`
- `DEVELOPMENT_PROGRESS.md`

Worker 首先写自己 Task 的事实：

```text
Domain Report / Audit
Task Manifest
Task Event
Claim release
```

全局页面应由 Reconciliation / Dispatcher 汇总更新，避免多个并行 Worker 同时覆盖共享大文件。

## 8. 下一会话不是“继续上一会话”

每次最终回复必须给出完整、可复制的新会话 Prompt。Prompt 不能使用：

- “继续上一步”；
- “按照我们刚才讨论的”；
- “你知道当前状态”；
- 仅依赖旧 commit 或聊天记忆的指令。

Prompt 必须明确：

- repository；
- branch；
- Task ID；
- 首先读取本 workflow 入口；
- 重新验证 latest main / claims / Entry Gate；
- 不依赖聊天上下文；
- 完成后再次输出下一合法动作与下一会话 Prompt。

模板见 [NEW_SESSION_PROMPT_TEMPLATE.md](NEW_SESSION_PROMPT_TEMPLATE.md)。

## 9. 第一会话如何点火

如果 Workflow Registry 尚未建立或当前 Task manifests 不完整，先执行：

[WORKFLOW_BOOTSTRAP_BRIEF.md](WORKFLOW_BOOTSTRAP_BRIEF.md)

Bootstrap 只建立控制面、恢复真实状态、创建 Task Registry、计算 READY / BLOCKED / ACTIVE / RECOVERY_REQUIRED，不执行任何业务 Domain 工作。

## 10. Source of Truth

架构 / 数据库优先级：

```text
Frozen Physical Migration
→ Frozen Domain DB Docs / Accepted ADR
→ Current Phase Design Brief
→ Upstream Frozen Public Contracts
→ Newly Generated Docs
```

完成状态优先级：

```text
Final Gate / Final Audit
→ Implementation Report
→ Current Code + Tests / CI
→ Task Manifest / Events
→ DEVELOPMENT_PROGRESS
→ Control Center / Matrix Summary
```

## 11. Human Controller

Human Controller 决定“同时启动几个 READY Task”，但不负责替 AI 维护上下文。

AI 必须给 Human Controller 清晰输出：

```text
PRIMARY
PARALLEL SAFE
BLOCKED
ACTIVE
RECOVERY REQUIRED
```

以及每个 READY Task 的完整新会话 Prompt。

> 这套系统的最终目标：**会话可以随时丢失，开发状态不能丢失。**
