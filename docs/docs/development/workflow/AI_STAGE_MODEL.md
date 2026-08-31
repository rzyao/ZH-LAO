---
status: active
last_updated: 2026-08-31
---

# AI 开发阶段模型

本协议定义 ZH-LAO 的 Development Node、AI 开发原子单位、阶段矩阵、完整 Feature Inventory 与 Task Manifest 的映射关系。

> 规范入口：[Development Node 模型](DEVELOPMENT_NODE_MODEL.md) 与 [Node 生命周期](NODE_LIFECYCLE.md)。Node = `object_id × lane`；Stage 归属 Node，Node 状态只能由 Stage 派生。

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

| Lane | 主要职责 |
| --- | --- |
| `design` | Domain / Feature 设计、Design Recovery、Spec Compiler 工作 |
| `backend` | Backend 准备、实现、独立审计，以及 Feature 所需 Backend capability/dependency |
| `admin` | Admin 页面 / Workbench 设计与实现 |
| `mobile` | Mobile Screen / Flow 设计与实现 |
| `integration` | 跨层、跨 Domain、真实 API / Infrastructure 集成 |
| `acceptance` | Feature E2E、最终用户/运营流程验收 |

Recovery 是异常 Stage，放回发生问题的 Lane，不增加永久 Recovery 列。

## 3. Domain、System 与 Feature 行

Domain 行主要展示领域设计与 Backend 主链。System 行用于 Application/Admin/Mobile Foundation 以及没有单一业务 Domain owner 的产品级体验。

Feature 行表示用户或运营人员可以感知的端到端能力，并在矩阵中只出现一次：

```text
Feature
→ parent（用于矩阵分组）
→ primary_domain（存在明确主要业务领域时）
→ participating_domains
→ Design / Backend / Admin / Mobile / Integration / Acceptance
```

`parent` 可以是 Domain 或 System；导航分组不改变 canonical ownership。

## 4. Feature Inventory

矩阵同时承担完整 Feature Inventory。正式 Feature 文档与 Feature Inventory 是两件不同的事：

```text
Inventory row
= 已识别的产品能力与开发状态

/features/<feature>/
= 当该 Feature 正式进入设计/交付后建立的 delivery authority
```

不得为了矩阵完整提前制造大量空白 Feature 文档。

每个 Feature 必须声明：

```text
portfolio_status
```

允许值：

```text
active      已有正式交付工作/工件
planned     已识别并属于当前产品能力，但尚未正式启动
deferred    仓库明确延期，不进入当前主链
unresolved  产品范围或 Domain 契约存在待裁决冲突
```

Inventory Bootstrap 必须覆盖：

- 产品范围和用户旅程；
- 11 个 Domain 的业务能力；
- Admin 可执行运营能力；
- Mobile 用户流程；
- 已存在的真实实现功能；
- 明确 deferred 能力；
- 明确 designing / scope conflict 能力。

明确排除的能力不因为“能想到”就重新加入当前产品范围；如需长期记录，应留在产品/治理文档的 excluded/deferred 事实中。

## 5. 状态

矩阵只使用以下视觉状态：

```text
✅ done       已有足够完成证据
▶ ready      Task Manifest READY，可直接启动对应 Prompt
⏳ active     存在真实 active Claim
○ todo       适用，但尚未进入 READY
⛔ blocked    有明确 blocked_by，或需要先裁决范围
🟣 recovery  当前合法下一步是 Recovery
⏸ deferred  仓库明确延期，不属于当前主链
— na         不适用
```

页面显示 `— 不适用`，不能用裸横线让读者猜测含义。

`ready` 不能根据人工感觉填写，必须满足 Task Manifest Entry Gate、Claim、依赖与 Blueprint 要求。

`deferred` 与 `todo` 不得互换；延期能力只有重新形成正式产品决定后才能进入 planned/ready。

`unresolved` Feature 必须至少暴露一个 `blocked` 决策 Stage，不能静默消失。

## 6. 非追溯历史

历史任务不伪造当时不存在的 Stage。已经有真实 Gate/Report 的旧实现可以记录为历史完成，但不能补写当时不存在的 Blueprint/Spec Stage。

## 7. Task Manifest 映射

所有新 Task 必须声明：

```yaml
matrix:
  object_type: domain | feature | system
  object_id: content
  lane: backend
  node_id: content.backend
  phase: prep
  sequence: 20
  stage_id: CONTENT-BACKEND-PREP
  label_zh: 后端实现准备
  parent_object_id: null
```

`stage_id` 是矩阵中的稳定原子编号，同时也是下一会话 Prompt 的身份。`object_id`、`lane`、`node_id`、`phase`、`sequence` 是 Stage 对 Node 的归属字段；不得将状态写入 Node 作为第二个来源。

一个 Task Manifest 默认只能代表一个 Stage。需要独立 STOP 的步骤必须拆成多个 Manifest。

## 8. Stage Registry 与 Feature Inventory

`AI_STAGE_REGISTRY.json` 保存已经实际进入 Stage 调度的详细状态以及由其生成的 Node 索引；`FEATURE_INVENTORY.json` 保存完整产品能力清单。

两者都是派生控制数据，不是新的产品/完成事实源。

状态依据优先级：

```text
Gate / Final Audit
→ Implementation Report
→ current code/tests/CI
→ Task Manifest / Claim / Event
→ Bootstrap/Reconciliation
```

Feature 是否存在、是否 deferred/unresolved 必须 grounding 到 Product / Domain / Governance authority；Inventory 不能自行创造产品承诺。

## 9. Matrix Renderer 与 CI

`DOMAIN_LIFECYCLE_MATRIX.md` 保留旧物理路径以避免历史死链，但页面语义是 **AI 开发阶段矩阵**。

它运行时读取：

```text
AI_STAGE_REGISTRY.json
+
FEATURE_INVENTORY.json
```

CI 必须执行：

```text
python scripts/generate_ai_stage_matrix.py --check
```

检查至少包括：

- Registry schema；
- Feature `portfolio_status`；
- parent / primary_domain / participating_domains 合法性；
- blocked 必须存在 `blocked_by`；
- deferred/unresolved 的状态表达；
- Matrix renderer 标记；
- grounded Registry 必须存在真实 READY Stage。

## 10. 下一段提示词

矩阵最后一列只表达下一原子 Stage：

```text
▶ <STAGE_ID>      已 READY，可以直接启动
○ 待生成 Task     已识别，但尚未形成 READY Manifest
⛔ <DEPENDENCY>    被依赖或待裁决事项阻塞
🟣 <RECOVERY>      应先执行 Recovery
⏸ 延期            当前不调度
✅ 主链完成        当前对象没有未完成主链 Stage
```

完整 Prompt 不复制进 Matrix。READY Task 的 Prompt 由 `NEXT_ACTIONS.md` / Task Manifest / New Session Prompt 机制提供。
