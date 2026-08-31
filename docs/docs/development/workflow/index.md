---
status: active
last_updated: 2026-08-31
---

# AI 多会话 Workflow Control Plane

本目录是 ZH-LAO  的 **AI 多角色、多会话并行、无上下文接手** 控制协议。

目标不是让某个 ChatGPT 会话“记住项目”，而是让任何新会话只依靠当前 GitHub `main` 就能恢复：

- 当前项目事实；
- 自己的角色；
- 当前 Task；
- Entry Gate；
- 上下游依赖；
- 并行冲突；
- 允许修改的路径；
- 必须读取的 Brief / Spec / Blueprint / Gate / Report；
- 当前步骤结束后的下一合法动作。

## 1. 核心原则

```text
Conversation Context      = 非权威、可丢失
GitHub main               = 唯一可共享工作事实
Executable Spec           = 可验证的 WHAT / MUST BE TRUE
Task Manifest             = 当前会话工作边界
Execution Brief           = 当前 Task 的实施范围
Implementation Blueprint  = derived HOW / 接近伪代码的实现说明
Gate / Report             = 完成状态证据
Claim                     = 并行占用声明
Handoff                   = 下一会话启动信息
```

新会话不得要求用户复述前情，只要仓库中存在合法 Task Manifest，就必须能够独立恢复并继续。

Implementation Blueprint 遵守 [Executable Spec System](../SPEC_SYSTEM.md) 与 [Implementation Blueprint Template](../IMPLEMENTATION_BLUEPRINT_TEMPLATE.md)。它低于所有 authoritative source，不能反向改写产品事实。

## 2. 强设计 / 弱执行分层

当 AI 能力不对称时，默认把高风险推理集中在上游：

```text
design_worker
= Architect / Spec Compiler
= Repository Audit → Product / Architecture → Spec → Design Gate
  → Execution Brief → Implementation Blueprint

backend_worker / admin_worker / client_worker
= Implementation Worker
= Snapshot Validation → Mechanical Implementation → Tests → Evidence → Gate
```

目标不是取消实现 Worker 的工程判断，而是把它必须自行决定的范围压缩到 private implementation details、局部编译/测试修复与 Blueprint `CONSTRAINED/FREE` 决策。

以下内容默认应在 Blueprint 前裁决，不留给实现 Worker 临场设计：

- API / Public Contract；
- transaction boundary；
- state transition；
- concurrency / idempotency；
- error semantics；
- permission / security invariant；
- cross-domain boundary；
- mandatory test scenarios。

## 3. 新会话标准读取顺序

所有 Worker 会话开始时，按以下顺序读取：

1. 最新 `main` / 当前 HEAD；
2. 本页；
3. [角色模型](ROLE_MODEL.md)；
4. [Executable Spec System](../SPEC_SYSTEM.md)；
5. [会话交接契约](SESSION_HANDOFF_CONTRACT.md)；
6. [并行与 Claim 规则](CONCURRENCY_RULES.md)；
7. 当前 `tasks/<TASK_ID>.yaml`；
8. Task Manifest 指向的 Brief；
9. Task Manifest 指向的 Gate / Report / upstream public contracts / required sources；
10. 如果 `implementation_blueprint.required = true`，读取 Manifest 指向的 Blueprint；
11. 如果 Domain adopted canonical spec，读取当前 spec 并验证 Blueprint/Manifest SHA；
12. 当前 active claims；
13. 重新验证 Entry Gate / Blueprint snapshot 后才允许执行。

如果 `tasks/<TASK_ID>.yaml` 不存在，Worker 不得凭聊天上下文自行创造正式实施权限；应进入 Dispatcher / Bootstrap 流程。

如果 implementation Task 声明 Blueprint required，但 Blueprint 不存在、无法验证或发生 material drift，该 Task 不得进入代码修改阶段。

## 4. 角色与任务是两回事

角色固定，Task 动态。

例如：

```text
role    = backend_worker
task_id = LEARNING-BACKEND
```

同一个 `backend_worker` 可以先后执行 Content、Learning、Audio、Social 等不同 Task。

正式角色见 [ROLE_MODEL.md](ROLE_MODEL.md)。

## 5. 标准 Task 生命周期

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

采用 Blueprint 的 implementation Task 在 `READY → ACTIVE` 之间还要完成：

```text
BLUEPRINT_VALIDATION
  ├─ base/spec/authority valid → PROCEED
  ├─ irrelevant drift → DRIFT_REVALIDATED → PROCEED
  └─ material drift/conflict/gap → STOP
```

任何依赖当前 Gate 的下游 Task，在当前 Gate `!= PASS` 时都不能进入 READY。

## 6. Blueprint 冲突协议

Implementation Worker 遇到超出 Decision Budget 的问题，不得自行升级成 Architect。

正式状态：

```text
SPEC_CONFLICT
IMPLEMENTATION_BLOCKER
REPOSITORY_DRIFT
```

- `SPEC_CONFLICT`：authority/spec/brief/blueprint 存在不可同时满足的语义冲突；
- `IMPLEMENTATION_BLOCKER`：缺失实施所必需且超出 Decision Budget 的设计决定；
- `REPOSITORY_DRIFT`：Blueprint 绑定的 base/spec/authority/target symbols 已发生实质变化。

处理细则见 [SPEC_SYSTEM.md](../SPEC_SYSTEM.md)。

## 7. 多会话并行模型

默认允许的主要并行轨：

```text
Admin Track
+
Backend Track
+
Design / Spec Compiler Track
+
必要时 Recovery / Audit Track
```

并行安全不只看 Domain 名称，还必须检查：

- `conflicts_with`；
- `owned_paths`；
- `shared_paths`；
- `exclusive_paths`；
- upstream contract snapshot；
- Blueprint base/spec snapshot；
- active claims。

详细规则见 [CONCURRENCY_RULES.md](CONCURRENCY_RULES.md)。

## 8. Gate FAIL 后的调度原则

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

同样，如果 implementation Task 因 `SPEC_CONFLICT / IMPLEMENTATION_BLOCKER / REPOSITORY_DRIFT` STOP，Dispatcher 应优先生成最短 Design/Recovery/Revalidation Task，而不是让同一 Worker继续猜。

## 9. 全局状态页面不是 Worker 的主要写入点

以下页面是全局控制视图：

- `DEVELOPMENT_CONTROL_CENTER.md`
- `DEVELOPMENT_PROGRESS.md`

Worker 首先写自己 Task 的事实：

```text
Domain Report / Audit
Task Manifest
Task Event
Claim release
Blueprint conformance / conflict evidence（若适用）
```

全局页面应由 Reconciliation / Dispatcher 汇总更新，避免多个并行 Worker 同时覆盖共享大文件。

Blueprint ready 不能被全局页面解释为 implementation COMPLETE 或 Gate PASS。

## 10. 下一会话不是“继续上一会话”

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
- 若 Blueprint required，验证 base commit / spec SHA / Decision Budget；
- 不依赖聊天上下文；
- 完成后再次输出下一合法动作与下一会话 Prompt。

模板见 [NEW_SESSION_PROMPT_TEMPLATE.md](NEW_SESSION_PROMPT_TEMPLATE.md)。

## 11. 第一会话如何点火

如果 Workflow Registry 尚未建立或当前 Task manifests 不完整，先执行：

[WORKFLOW_BOOTSTRAP_BRIEF.md](WORKFLOW_BOOTSTRAP_BRIEF.md)

Bootstrap 只建立控制面、恢复真实状态、创建 Task Registry、计算 READY / BLOCKED / ACTIVE / RECOVERY_REQUIRED，不执行任何业务 Domain 工作。

对于新采用 Executable Spec 的 implementation Task，Bootstrap/Dispatcher 还应检查是否需要先创建 Design/Spec Compiler Task 生成 Blueprint。

## 12. Source of Truth

架构 / 数据库 /产品事实优先级：

```text
Frozen Physical Migration
→ Frozen Domain DB Docs / Accepted ADR
→ Current Phase Design Brief / authoritative Domain docs
→ Upstream Frozen Public Contracts
→ canonical executable spec mapping
→ Execution Brief
→ Implementation Blueprint
→ newly generated implementation notes
```

完成状态优先级：

```text
Final Gate / Final Audit
→ Implementation Report
→ Current Code + Tests / CI
→ Task Manifest / Events
→ DEVELOPMENT_PROGRESS
→ Control Center summary
```

Blueprint 只回答“在当前 snapshot 上应如何实现”，不回答“实现已经完成”。

## 13. Human Controller

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

当本地 Implementation Worker 能力弱于上游 Spec Compiler 时，Human Controller 不需要把设计讨论复制给本地 Worker；只需要让它拉取 Task Manifest + Blueprint + required sources。

> 这套系统的最终目标：**会话可以随时丢失，开发状态不能丢失；AI 能力可以不同，关键设计不能因此漂移。**
