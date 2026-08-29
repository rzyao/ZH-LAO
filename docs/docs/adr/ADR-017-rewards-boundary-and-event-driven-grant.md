---
status: frozen
date: 2026-08-30
---

# ADR-017：Rewards 独占奖励决定，采用事件驱动与幂等发放

## 背景

Rewards Domain（会话「设计奖励域」）需要确定：平台如何把「奖励」与 Commerce 的钱包/资产解耦，同时保证不重复发奖、不丢奖、不会因一个按钮同时做两个域的危险操作。存在几个诱惑：把余额、积分、任务、徽章全塞进一个「激励」域；用一张 `reward_records` 混掉「奖励决定」与「资产到账」；或复制 Learning/Social 的模型进 Rewards 直接查其它域数据库。早期草案（ContributionEvent / ScoreRecord / 计分模型）过于泛化，无法落到字段级实现。

## 决策

1. **三层职责边界冻结**：源 Domain 决定「事实是否发生」，Rewards 决定「这个事实是否值得奖励」，Commerce 决定「资产如何安全入账」。Rewards 只产生"应该给用户 100 Coin"的决定，绝不 `UPDATE` 任何钱包/账本。
2. **事件驱动、不反向查询**：其他域通过可信领域事件把已确认事实交给 Rewards（`reward_events` 入站边界表），Rewards 不 `SELECT` 其它域的表验证事实；事件业务事实部分不可变。
3. **Grant 与 Delivery 分离**：`reward_grants`（奖励决定，核心事实，含 program/rule/amount 快照）与 `reward_deliveries`（把 Grant 幂等交给 Commerce 执行的编排）是两件事；二者必须在同一 Rewards 本地事务创建，但**绝不跨域大事务**，调用 Commerce 发生在事务提交后由 Delivery Worker 异步执行。
4. **三级幂等，不建 Counter**：Event 以 `UNIQUE(source_domain, source_event_id)`、Grant 以 `UNIQUE(dedupe_key)`、Delivery 以 `UNIQUE(idempotency_key)`（恒为 `reward:{grant_no}`）防重；`max_grants > 1` 的周期上限用 `pg_advisory_xact_lock` 保证并发安全。
5. **时间与版本语义**：所有奖励周期与 Rule 匹配都依据 `event.occurred_at`（业务实际发生时间），绝不用接收/决定时间；晚到事件匹配发生时有效的 Rule Version，`RETIRED` 版本仍可处理其历史有效窗口内的迟到事件；Rule 生效后核心配置不可原地修改，只能新建 Version。
6. **VOID 与资产纠错分离**：只有 Delivery 尚未成功发放时才能 `Grant VOIDED + Delivery CANCELLED`；已到账的纠错必须走 Commerce Adjustment / Reversal，Rewards 不伪造 VOID 收回资产，也不在同一按钮自动触发 Commerce 冲正。
7. **V1 边界收敛**：5 张业务表（programs/rules/events/grants/deliveries）；奖励资产仅 `COIN`；奖励恒为正数（`reward_amount > 0`）；所有 Grant 必须有事件来源（`event_id NOT NULL`，不做 Manual Grant）；不建积分/任务/徽章/计数/Counter/领取表。
8. **跨域只走逻辑引用，不建跨域 FK**：`subject_user_id`、`user_id`、`source_reference_id`、`target_reference_id` 一律是逻辑业务引用（Commerce 侧记录 `source_domain=REWARDS` + `source_reference_id=grant_no`）；跨域信息需求经 Application Port / Query Interface，Rewards Repository 只能读写 `rewards.*`。

## 原因

- 奖励是"决策"而非"账务"：决定与到账天然异步（网络超时、重试、拒绝），混在一张表必然分不清"到底发没发、该不该重试"。
- 复制其它域模型或反向查询会破坏时间一致性（事件当时 100% 完成，消费时可能已降到 80%）并形成数据副本。
- 本地事务 + 事件 + 幂等 + 重试 的组合（而非分布式事务）在模块化单体里既有强一致性边界又避免跨域锁。
- 版本化 Rule 使历史 Grant 永远可追溯；`occurred_at` 避免消息延迟让用户无辜失去奖励。
- V1 只解决"奖励决策与发放编排"，防止把任务、成长、积分、运营活动全部揉进一个域。

## 影响

- Rewards 5 张表业务/逻辑设计冻结，可进入建表与实现；本域不建跨域 FK 的写法与 Commerce 会话的倾向一致，但**全局跨域 FK 政策与主键类型仍随 D-077/D-078 由主架构会话统一裁决**，裁决前不得据此改动全局规范或其他域。
- 若 Rewards 未来需发布 `REWARD_GRANTED/REWARD_DELIVERED`，使用 `rewards.outbox_events`（基础设施表，不计入 5 张核心表）；项目级 Outbox 统一方式待所有域设计结束一并确定（D-089）。
- 权益型奖励（会员天数、Follow 额度、曝光等 Entitlement）与 POINT/EXP/BADGE/GIFT/COUPON 资产、Manual Reward Grant、按用户时区奖励均延后（见[未决事项](../governance/open-questions.md)）。
- 旧「Contribution/Scoring（ContributionEvent、ScoreRecord）计分模型」被本决策取代，台账 D-017 标记 `superseded`。

## 事实源

- [Rewards 域](../domains/rewards/index.md)
- [Rewards 数据库 · 5 张表定稿](../domains/rewards/database.md)
- [Rewards 应用服务与事件](../domains/rewards/application-and-events.md)
- [PostgreSQL 总规范](../architecture/database.md)、[Domain Map](../architecture/domain-map.md)
- [ADR-016 Commerce 资金与只追加账本](ADR-016-commerce-money-and-append-only-ledger.md)、[ADR-001 模块化单体与领域 Schema](ADR-001-modular-monolith-and-domain-schemas.md)
- [设计台账](../governance/design-register.md)、[未决事项](../governance/open-questions.md)