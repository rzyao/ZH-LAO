---
status: frozen
last_updated: 2026-08-31
---

# 契约与边界

本页定义 Trust & Safety 与 Identity、Operations 以及各业务 Owner Domain 的稳定协作协议。

## 多态 Subject Reference

被治理对象使用：

```text
subject_domain
subject_type
subject_id UUID
```

Evidence 对外部对象的引用使用等价的稳定 reference 结构。

这些字段表达业务协议，不是数据库表定位器。

禁止：

```text
subject_domain = schema name used for direct SQL
subject_type = physical table name used as locator
subject_id = owner domain internal BIGINT
跨领域 physical FK
```

## Subject 范围

具体允许的 `subject_domain / subject_type` 必须由冻结契约定义。

典型业务对象包括：

```text
Identity User
Social Profile / Post / Media
Chat Conversation / Message
Commerce business object
```

新增 Subject Type 必须先明确事实拥有者和稳定 logical UUID，不能因为 Trust 需要审核就随意把任意数据库表暴露为 subject。

## 普通用户身份

举报人、申诉人、处罚目标用户等普通用户引用 Identity stable logical UUID，例如：

```text
reporter_user_id
submitted_by_user_id
appellant_user_id
target_user_id
```

Trust 不读取或保存 Identity internal PK，也不拥有认证系统。

## 审核与运营主体

后台审核员、复核人、分配人等使用 Operations Operator stable logical UUID，例如：

```text
assigned_operator_id
added_by_operator_id
decided_by_operator_id
reviewer_operator_id
```

Operations 负责 Operator Resolution 和 RBAC；Trust 负责 Case/Decision/Enforcement 的业务状态机。

## Owner Domain 边界

Trust 可以决定平台治理结果，但不能直接修改业务对象 canonical state。

```text
Trust Decision / Enforcement
↓
Public Contract / Shared Outbox Event
↓
Owner Domain
↓
Owner Domain Application Service / State Machine
```

例如：

```text
content_remove
→ Social 自己把 Post 进入 removed/受限状态

chat_send_restrict
→ Chat 在发送消息时拒绝动作
```

Trust 不直接 `UPDATE social.*` 或 `UPDATE chat.*`。

## Social

Social 拥有：

```text
Social Profile
Follow
Match
Social Block
Post / Like / Comment
```

Trust 拥有：

```text
Report canonical fact
Moderation
Enforcement
Appeal
```

Social 可以提供举报入口，但最终写入 `trust.reports`。

## Chat

Chat 拥有 Conversation / Message 业务事实。

Trust 可以对用户/会话/消息产生治理决定和能力限制，但不复制 Message Body 作为新的 canonical business state，也不保存 Chat relationship state。

## Commerce

Commerce 拥有 Order、Payment、Wallet、Ledger、GiftSend 等交易事实。

Trust 可以治理相关对象或用户能力，但不能直接调整 Wallet、退款、订单或交易账本。

涉及资金纠错必须进入 Commerce 自己的正式业务流程。

## Shared Outbox

跨领域治理结果使用全系统共享：

```text
infrastructure.system_outbox_events
```

不建立：

```text
trust_outbox_events
moderation_outbox_events
```

事件只携带必要稳定逻辑标识和治理语义，不复制被治理对象完整敏感内容。

## 幂等

消费 Enforcement Event 时应以稳定 `enforcement_action_id` 等 logical ID 做幂等。

重复投递不能让 Owner Domain 重复执行不可逆动作。

## 真人认证边界

真人认证属于 Trust & Safety 的职责范围，但当前详细模型仍未正式冻结。

可以稳定依赖的边界只有：

```text
Trust 负责审核认证材料并产生认证结果
Identity 继续拥有 User 根与账号状态
Social 可以消费认证结果决定社交资格
```

在详细 Verification 设计完成前，不得假设具体 Table、State、API 或 Media Workflow。

## 不拥有的事实

Trust 不拥有：

```text
Social Follow / Match / Block
Chat Conversation / Message canonical content
Commerce Wallet / Ledger / Payment / Refund
Rewards Rule / Grant
Identity login credential / session
Owner Domain 对象最终业务内容
```

全局跨领域规则见 [领域依赖与协作](../../architecture/domains/dependencies.md)。
