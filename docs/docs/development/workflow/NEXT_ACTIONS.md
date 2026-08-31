---
status: bootstrap_required
last_updated: 2026-08-31
---

# Next Actions

当前还没有经过 Workflow Bootstrap 计算的调度快照。

## PRIMARY

`BOOTSTRAP REQUIRED`

执行 [WORKFLOW_BOOTSTRAP_BRIEF.md](WORKFLOW_BOOTSTRAP_BRIEF.md)。

## PARALLEL SAFE

尚未计算。不得凭聊天上下文或旧进度表猜测。

## ACTIVE

尚未建立 Task Claim Registry。

## BLOCKED

将在 Bootstrap 后根据真实 Entry Gate / dependencies / claims 生成。

## RECOVERY REQUIRED

将在 Bootstrap 后根据真实 Gate / Report / Grounding 状态生成。

## NEXT CONVERSATION PROMPT

```text
使用 GitHub 连接器连接远程仓库 `rzyao/ZH-LAO`，读取最新 `main`。

读取并严格执行：
`docs/docs/development/workflow/WORKFLOW_BOOTSTRAP_BRIEF.md`

同时必须读取该 Brief 要求的整个 `docs/docs/development/workflow/` 控制协议。

本会话只负责 Workflow Control Plane Bootstrap：恢复当前 main 的真实开发状态、建立 Task Registry、依赖图、并发 Claim 规则、NEXT_ACTIONS，并为所有 READY Task 生成完整的新会话提示词。

不得依赖任何聊天上下文、记忆、用户口述的旧状态或其它会话结论。
不得执行任何 Domain 正式 Design / Backend / Admin / Client Implementation。
不得领取业务 Worker Claim。

完成后直接推送 GitHub main，并报告 READY / PARALLEL SAFE / BLOCKED / ACTIVE / RECOVERY REQUIRED 与下一批完整会话提示词。

完成后 STOP。
```
