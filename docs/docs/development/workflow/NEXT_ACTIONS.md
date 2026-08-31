---
status: bootstrap_required
last_updated: 2026-08-31
---

# Current Scheduling Snapshot

当前 Stage Registry 仍是 `bootstrap_seed`，尚未经过 Workflow Bootstrap 从最新 `main` 完整计算 Task / Gate / Claim / Feature Stage。

## PRIMARY

```text
▶ WORKFLOW-BOOTSTRAP
```

执行：[WORKFLOW_BOOTSTRAP_BRIEF.md](WORKFLOW_BOOTSTRAP_BRIEF.md)

这是当前唯一被允许标记为 `ready` 的新 Stage。

## PARALLEL SAFE

尚未计算。不得把 AI Stage Matrix 中的 `○ todo` 解释为 READY。

## ACTIVE

尚未建立可验证的 Task Claim Registry。

## BLOCKED

矩阵当前保守展示已知 blocker；Bootstrap 后必须从 Manifest / Gate / Contract 重新计算。

## RECOVERY REQUIRED

Bootstrap 后根据真实 Gate / Report / Drift 状态生成。

## NEXT CONVERSATION PROMPTS

### WORKFLOW-BOOTSTRAP

```text
使用 GitHub 连接器连接远程仓库 `rzyao/ZH-LAO`，读取最新 `main`。

读取并严格执行：
`docs/docs/development/workflow/WORKFLOW_BOOTSTRAP_BRIEF.md`

同时读取：
- `docs/docs/development/workflow/AI_STAGE_MODEL.md`
- `docs/docs/development/workflow/TASK_MANIFEST_SCHEMA.md`
- `docs/docs/development/workflow/AI_STAGE_REGISTRY.json`
- Brief 要求的其它 Workflow / Domain / Feature authority。

本会话只负责 Workflow Control Plane Bootstrap：恢复当前 main 的真实开发状态，把“一段可独立执行并 STOP 的 Prompt”识别为一个 AI Stage，建立/修复 Task Registry、依赖图、Claim 规则、Domain + Feature Stage Registry、AI 开发阶段矩阵和所有 READY Stage 的完整下一会话提示词。

不得依赖任何聊天上下文、记忆、用户口述旧状态或其它会话结论。
不得执行任何 Domain 正式 Design、Backend、Admin、Mobile 或 Feature Implementation。
不得领取业务 Worker Claim。
不得伪造历史上不存在的 Blueprint / Prep / Audit Stage。

完成后必须执行：
`python scripts/generate_ai_stage_matrix.py --write`
`python scripts/generate_ai_stage_matrix.py --check`
并运行文档构建/相关检查。

完成后直接推送 GitHub main，报告 Domain Stages、Feature Stages、READY / PARALLEL SAFE / BLOCKED / ACTIVE / RECOVERY REQUIRED 与下一批完整 Prompt。

完成后 STOP。
```
