---
status: active
last_updated: 2026-08-31
---

# AI 开发阶段模型

本协议定义 ZH-LAO 的 AI 开发原子单位、阶段矩阵与 Task Manifest 的映射关系。

## 1. 原子单位

```text
一个 AI Stage
= 一段完整、无聊天上下文依赖的提示词
→ 一个明确角色
→ 一组明确输入
→ 一组明确输出
→ 一个明确 Gate / Report / 状态结果
→ Push GitHub
→ STOP
```

如果两项工作需要分别开启两个 AI 会话，它们就是两个 Stage。不得因为都属于“设计”“后台”或“实现”就合并。

例如：

```text
PLATFORM-ADMIN-STAGE-A
PLATFORM-ADMIN-STAGE-B
```

是两个独立 Stage。

## 2. Matrix Lane

AI 开发阶段矩阵固定使用：

```text
design
backend
admin
mobile
integration
acceptance
```

含义：

| Lane | 主要职责 |
| --- | --- |
| `design` | Domain / Feature 设计、Design Recovery、Spec Compiler 工作 |
| `backend` | Backend 准备、实现、独立审计，以及 Feature 的 Backend 依赖 |
| `admin` | Admin 页面 / Workbench 设计与实现 |
| `mobile` | Mobile Screen / Flow 设计与实现 |
| `integration` | 跨层、跨 Domain、真实 API / Infrastructure 集成 |
| `acceptance` | Feature E2E、最终用户/运营流程验收 |

Recovery 是异常 Stage，放回发生问题的 Lane，不增加永久 Recovery 列。

## 3. Domain 与 Feature 行

Domain 行主要展示：

```text
领域设计 Stage
Backend Prep Stage
Backend Implementation Stage
Backend Independent Audit Stage
必要的历史 Admin / Recovery Stage
```

Feature 行展示在其 `primary_domain` 下方：

```text
Feature Design
Backend dependencies
Admin stages
Mobile stages
Integration stages
Acceptance stage
```

Feature 只出现一次，不因为有多个 participating Domain 而重复多行。

## 4. 状态

矩阵只使用以下视觉状态：

```text
✅ done      已有足够完成证据
▶ ready     Task Manifest READY，可直接启动对应 Prompt
⏳ active    存在真实 active Claim
○ todo      适用，但尚未进入 READY
⛔ blocked   有明确 blocked_by
🟣 recovery 当前合法下一步是 Recovery
— na        不适用
```

`ready` 不能根据人工感觉填写，必须满足 Task Manifest Entry Gate、Claim、依赖与 Blueprint 要求。

## 5. 非追溯历史

历史任务不伪造当时不存在的 Stage。

例如某 Domain 在 Blueprint 协议采用前已经完成 Backend，可以记录：

```text
✅ 后端实现（历史）
✅ 后端验证
```

但不得补写：

```text
✅ Backend Blueprint
```

除非历史上真实存在该工件。

## 6. Task Manifest 映射

所有新 Task 必须声明：

```yaml
matrix:
  object_type: domain | feature | system
  object_id: content
  lane: backend
  sequence: 20
  stage_id: CONTENT-BACKEND-PREP
  label_zh: 后端实现准备
  parent_object_id: null
```

`stage_id` 是矩阵中的稳定原子编号，同时也是下一会话 Prompt 的身份。

一个 Task Manifest 默认只能代表一个 Stage。若一个 Brief 内明确要求执行者完成多个必须独立 STOP 的会话步骤，应拆成多个 Task Manifest。

## 7. Stage Registry

`AI_STAGE_REGISTRY.json` 是**派生控制快照**，不是新的完成事实源。

其状态必须来源于：

```text
Gate / Final Audit
→ Implementation Report
→ current code/tests/CI
→ Task Manifest / Claim / Event
→ Bootstrap/Reconciliation
```

初次迁移时允许使用 `snapshot_status = bootstrap_seed` 保守映射已有历史证据；此时未建立 READY Manifest 的未来 Stage 必须保持 `todo` 或 `blocked`，不得冒充 `ready`。

Workflow Bootstrap 完成后应将快照更新为 grounded registry。

## 8. Matrix 生成

`DOMAIN_LIFECYCLE_MATRIX.md` 保留旧物理路径以避免历史死链，但页面语义正式改为 **AI 开发阶段矩阵**。

它由：

```text
docs/docs/development/workflow/AI_STAGE_REGISTRY.json
        ↓
scripts/generate_ai_stage_matrix.py
        ↓
docs/docs/development/DOMAIN_LIFECYCLE_MATRIX.md
```

生成。

禁止手工修改生成后的 Matrix 状态。CI 必须执行：

```text
python scripts/generate_ai_stage_matrix.py --check
```

Registry 和 Matrix 不一致时 docs job FAIL。

## 9. 下一段提示词

矩阵最后一列只表达下一原子 Stage：

```text
▶ <STAGE_ID>     已 READY，可以直接启动
○ <STAGE_ID>     已识别，但 Bootstrap/Entry Gate 尚未使其 READY
⛔ <DEPENDENCY>   被明确依赖阻塞
🟣 <RECOVERY>     应先执行 Recovery
✅ 主链完成      当前对象没有未完成主链 Stage
```

完整 Prompt 不复制进 Matrix。READY Task 的 Prompt 由 `NEXT_ACTIONS.md` / Task Manifest / New Session Prompt 机制提供。
