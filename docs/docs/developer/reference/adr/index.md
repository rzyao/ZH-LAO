---
status: active
last_updated: 2026-09-04
---

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
| [ADR-017](ADR-017-rewards-boundary-and-event-driven-grant.md) | Rewards 独占奖励决定，事件驱动与幂等发放 | `frozen` |
| [ADR-018](ADR-018-global-database-design-principles-final.md) | 全局数据库设计原则最终版（混合主键 / 跨域 logical UUID / canonical fact 单一归属 / 统一删除策略 / Infra 边界） | `frozen` |
| [ADR-019](ADR-019-operations-backoffice-control-plane.md) | Operations 为后台控制平面（运营主体 + RBAC + 不可变操作审计，代码定义权限） | `frozen` |
| [ADR-020](ADR-020-audio-production-domain.md) | Audio Production 独立成域（第 10 个业务域，Slot/Task/Attempt/Asset Version/Review，`official_asset_version_id` 唯一正式音频指针） | `frozen` |
| [ADR-021](ADR-021-content-and-learning-domain-split.md) | Learning 拆分为 Content + Learning（第 11 个业务域；Content = canonical 教学内容、Learning = 用户学习状态；`Learning → Identity`、`Learning → Content`；Audio 契约改 `Audio → Content`；逐表归属 D-150：content 31 张 / learning 10 张） | `frozen` |
| [ADR-022](ADR-022-platform-menu-routing-config.md) | Platform 扩展后台菜单/路由配置能力（第 7 类能力，打破 6 表冻结边界；新增 `platform.menus` + `platform.menu_permissions`，权限 `platform.menus.read/.write`，Sidebar 配置驱动渲染；D-155） | `frozen` |
| [ADR-024](ADR-024-menu-tree-reparenting.md) | 菜单树支持拖拽重排和换父级；节点位置与可导航性解耦，新增原子移动端点（修订 ADR-022 / D-155） | `frozen` |
| [ADR-023](ADR-023-unified-api-contract.md) | 前后端统一请求格式与业务状态码（HTTP 一律 200 + 顶层 `code` 信封 `{code,data?,error?,request_id}`；业务状态码词汇表；全量迁移 `AppError.code`；前端按 `code` 判定；同步切版；请求侧收敛；修订 `api-standard.md` 响应契约；D-156） | `frozen` |
| [ADR-025](ADR-025-admin-operator-account-provisioning.md) | 受控创建后台账号与操作员（随机一次性密码、同库原子编排） | `baseline` |
| [ADR-026](ADR-026-unified-recursive-admin-menu-tree.md) | 后台菜单移除专门分组类型，统一为可自由嵌套的递归目录树（修订 ADR-022 / ADR-024） | `frozen` |
| [ADR-027](ADR-027-navigable-directory-row-toggle.md) | 可导航目录点击菜单项目时同步伸缩，箭头保留纯伸缩操作（修订 ADR-026） | `frozen` |

ADR 记录长期取舍；字段和业务规格仍以对应领域文档为唯一事实源。
