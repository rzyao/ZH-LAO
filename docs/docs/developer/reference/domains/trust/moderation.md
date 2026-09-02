---
status: frozen
last_updated: 2026-08-31
---

# 审核与处罚工作流

本页定义 Trust & Safety 治理链路从举报进入审核，到形成处罚并允许申诉的核心业务流程。

## 举报

全系统用户举报统一进入：

```text
trust.reports
```

Social、Chat、Commerce 等领域可以提供举报入口，但不保存第二份 canonical report。

Report 记录举报人、被举报 subject、举报原因与创建时间等不可变事实。

## Moderation Case

举报只是审核来源之一。Moderation Case 可以由不同来源触发，例如：

```text
用户举报
发布前审核
平台巡检
AI 检测
系统规则
```

这些来源最终进入统一 Case Workflow，避免每种来源各建一套审核状态机。

## Evidence

Moderation Evidence 保存审核和后续申诉所需的证据/快照。

原则：

- Evidence 应能在业务对象后续变化后仍解释当时为何做出决定；
- Evidence 不夺取被审核对象的 canonical ownership；
- 需要引用外部对象时使用稳定 logical reference；
- 证据历史不可通过普通业务更新覆盖。

## Decision

Moderation Decision 是审核最终判定事实。

它表达：

> 审核者基于当前 Case 与 Evidence 做出了什么治理判断。

Decision 不直接等于远端业务表已经完成状态变更。

## Enforcement Action

需要实际限制用户或业务能力时创建 Enforcement Action。

典型能力包括：

```text
Ban / Suspend
Chat Send Restriction
Discover / Follow Restriction
Content Removal Instruction
其他冻结契约允许的平台限制
```

Enforcement Action 是**平台处罚事实**。

### 处罚传播

```text
Decision
↓
Enforcement Action
↓
与业务事实同事务写共享 Outbox
↓
Owner Domain 消费治理结果
↓
Owner Domain 按自己的状态机执行限制/移除
```

Trust 不通过跨 Schema SQL 直接修改 Social、Chat、Commerce 等 canonical state。

## Enforcement 生命周期

处罚可能发生：

```text
applied
expired
revoked
cancelled
failed
```

需要可靠传播的变化通过共享 Outbox 按 `enforcement_action_id` 等稳定逻辑标识保持幂等。

具体数据库状态值以冻结数据设计为准；消费者不能根据传输次数创造第二份处罚事实。

## Appeal

被处罚用户可以对允许申诉的 Enforcement 进入 Appeal 流程。

Appeal 保存：

- 谁提出申诉；
- 针对哪个处罚；
- 申诉材料与时间；
- 复核结果。

申诉结果需要撤销/调整处罚时，通过正式 Enforcement 生命周期变化表达，而不是删除原处罚或原 Decision。

## Account Status 与 Capability Restriction

Identity 的账号状态和 Trust 的能力限制必须分离。

例如用户仍可：

```text
Identity account = active
```

同时存在：

```text
禁止聊天
禁止进入发现
禁止发布动态
禁止 Follow
```

这些是平台治理能力限制，不要求把 Identity User 改成 disabled。

## 用户 Block 与平台处罚

```text
SocialBlock
= 用户主动建立的当前关系事实

EnforcementAction
= 平台治理处罚事实
```

平台不能用 EnforcementAction 代替用户 Block，Social 也不能用 Block 代替平台处罚。

## 历史保留

以下治理历史不做普通物理删除：

```text
Report
Evidence
Decision
Enforcement Action history
Appeal history
```

撤销、过期和复核通过新状态/新事实表达，不能删除历史来重写治理轨迹。
