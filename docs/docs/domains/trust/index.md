---
status: frozen
last_updated: 2026-08-31
schema: trust
---

# 信任与安全（Trust & Safety）

信任与安全领域负责平台治理链路：**举报、审核、证据、审核决定、平台处罚与申诉**。

它不拥有被治理业务对象本身，只通过稳定逻辑标识引用这些对象，并产生治理事实和治理历史。

## 领域职责

| 负责 | 不负责 |
| --- | --- |
| 全系统 canonical 用户举报 | Social / Chat / Commerce 业务对象正文 |
| Moderation Case | 用户主动 Block 关系 |
| Moderation Evidence | Identity 用户根状态 |
| Moderation Decision | Chat Message / Conversation canonical state |
| Enforcement Action | Commerce Order / Wallet / Ledger |
| Appeal | Rewards 规则与 Grant |
| 真人认证业务边界（详细模型仍待后续设计） | Owner Domain 对自身对象的具体状态修改 |

## 治理链路

V1 治理核心固定为 6 个业务事实：

```text
Report
↓
Moderation Case
↓
Evidence
↓
Decision
↓
Enforcement Action
↓
Appeal
```

对应：

```text
trust.reports
trust.moderation_cases
trust.moderation_evidence
trust.moderation_decisions
trust.enforcement_actions
trust.appeals
```

字段、约束和索引见 [数据设计](database.md)。

## 核心原则

1. `trust.reports` 是全系统唯一 canonical user report fact。
2. Social / Chat / Commerce 等领域只提供举报入口，不创建第二份举报事实。
3. 被治理对象通过 `subject_domain + subject_type + subject_id` logical reference 表达，不使用跨域物理 FK。
4. Trust 不直接修改其他业务领域 Schema。
5. Enforcement Action 表达平台处罚事实，不等于 Owner Domain 当前对象状态。
6. Owner Domain 消费治理结果后，按照自己的状态机和契约执行相应限制/移除。
7. `social_blocks` 是用户主动关系事实，`trust.enforcement_actions` 是平台处罚事实，两者永不合并。
8. Report、Evidence、Decision、Enforcement 历史和 Appeal 历史不做普通物理删除。
9. 审核员/运营主体引用 Operations logical UUID；普通用户引用 Identity logical UUID。
10. 跨域处罚的可靠传播使用共享 `infrastructure.system_outbox_events`，不建立 Trust 私有 Outbox。

## 真人认证

真人认证属于 Trust & Safety 的业务边界，但当前详细 `VerificationCase / VerificationMedia` 模型仍未完成正式重设计。

因此其他领域只能依赖已冻结的治理链路和明确公开的认证结果契约，不得假设一套尚未冻结的 Verification 表、状态机或 API 已经存在。

## 文档地图

- [审核与处罚工作流](moderation.md)：举报、案件、证据、决定、处罚和申诉的主业务流程。
- [契约与边界](contracts.md)：多态 subject、Identity / Operations / Social / Chat / Commerce 等跨域规则。
- [数据设计](database.md)：治理链路 6 张表的完整数据库设计；真人认证详细数据设计仍待后续正式设计。
