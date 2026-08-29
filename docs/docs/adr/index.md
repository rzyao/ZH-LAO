# Architecture Decision Records

| ADR | 决策 | 状态 |
| --- | --- | --- |
| [ADR-001](ADR-001-modular-monolith-and-domain-schemas.md) | 模块化单体与领域 Schema | `baseline` |
| [ADR-002](ADR-002-separate-user-identities-and-profiles.md) | 拆分 User、登录身份和资料 | `frozen` |
| [ADR-003](ADR-003-follow-mutual-follow-match.md) | Follow/Mutual Follow/Match | `baseline` |
| [ADR-004](ADR-004-learning-content-registry.md) | Learning Content Registry | `baseline` |
| [ADR-005](ADR-005-entitlement-centered-authorization.md) | Entitlement 统一权益 | `baseline` |
| [ADR-006](ADR-006-learning-content-lifecycle.md) | Learning Content 生命周期 | `frozen` |
| [ADR-007](ADR-007-unified-curriculum-hierarchy.md) | 统一课程分层 | `frozen` |
| [ADR-008](ADR-008-practice-definition-and-answer-data.md) | Practice 定义与答案数据 | `frozen` |
| [ADR-009](ADR-009-learning-history-and-current-state.md) | Learning 历史与当前状态 | `frozen` |
| [ADR-010](ADR-010-social-profile-discovery-and-relationships.md) | Social 资料、发现与关系 | `frozen` |
| [ADR-011](ADR-011-chat-conversation-identity-and-direct-uniqueness.md) | Chat 会话身份与 Direct 用户对唯一 | `frozen` |
| [ADR-012](ADR-012-message-seq-ordering-and-idempotency.md) | 会话内 `seq` 排序与发送幂等 | `frozen` |
| [ADR-013](ADR-013-read-state-as-cursor-not-receipt-table.md) | 已读游标而非 Receipt 表 | `frozen` |
| [ADR-014](ADR-014-no-notification-domain-events-outbox-infra.md) | 不新增 Notification 域，事件走 Outbox | `baseline` |
| [ADR-015](ADR-015-chat-naming-and-sql-adjudication.md) | Chat 命名统一与 SQL 规范裁决 | `frozen` |
| [ADR-016](ADR-016-commerce-money-and-append-only-ledger.md) | Commerce 独占资金事实，虚拟币钱包与只追加账本 | `frozen` |

ADR 记录长期取舍；字段和业务规格仍以对应领域文档为唯一事实源。
