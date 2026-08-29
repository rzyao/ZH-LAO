---
status: baseline
last_updated: 2026-08-30
---

# PostgreSQL 总规范与 Schema 规划

## 物理边界

使用一个 PostgreSQL 实例、一个主数据库和十个业务 Schema：

```text
identity  learning  social  community  chat
commerce  rewards   trust   operations platform
```

不采用一个 Domain 一个数据库。跨 Schema Foreign Key 被允许，例如 `social.social_profiles.user_id → identity.users.id`。

## 十二项统一规范

1. **表名使用复数。** 使用 `users`、`auth_identities`、`messages`，不使用 `user`、`user_info`、`tbl_user`。
2. **全部使用 snake_case。** Schema、表和字段一致。
3. **主键统一为 id。** 业务表使用 `bigint generated always as identity primary key`，不使用 `serial/bigserial`，也不默认使用 UUID。
4. **时间统一为 timestamptz。** 服务端保存绝对时间，客户端按时区显示。
5. **默认审计时间。** 大多数实体保留 `created_at` 和 `updated_at`；纯关系表可只保留 `created_at`。
6. **按业务决定软删除。** 不机械给所有表添加 `deleted_at`；Post 等有恢复/审核需要的实体可使用，回执或纯关系未必需要。
7. **状态优先 VARCHAR + CHECK。** 小型稳定状态使用 `varchar(32)` 和 CHECK，不泛化 PostgreSQL ENUM。
8. **金额禁止 float。** 使用 `amount_minor` 与 `currency`，按货币最小单位表达。
9. **业务动作不放入数据库触发器。** 互关生成 Match 等动作由 Application Service 在事务中完成并可产生 Domain Event。
10. **JSONB 只存真正动态的数据。** 可用于支付原始响应、审核模型输出、Feature Rule 条件和扩展 metadata；用户资料、课程、权益等核心字段必须结构化。
11. **保留 Foreign Key。** 数据库负责阻止孤儿引用并守护数据完整性。
12. **允许跨 Schema Foreign Key。** Domain Boundary 是业务和代码边界，不是放弃数据库完整性的理由。

## ID 策略

- `id` 是数据库内部关联键，使用 BIGINT Identity。
- `public_id` 只用于需要向客户端公开且不应暴露连续 ID 的主要实体。
- 当前预期使用 `public_id` 的对象包括 User、Post、Conversation、Message、Order。
- MessageReceipt、UserEntitlement、ScoreRecord 等内部实体通常不需要 `public_id`。
- `usr_xxx` 仅为 `illustrative` 格式；生成算法和各实体前缀尚未决定。

## 数据库与应用职责

| 数据库负责 | 应用服务负责 |
| --- | --- |
| PK、FK、UNIQUE、CHECK、NOT NULL、事务完整性 | Follow 后检查 Mutual Follow、创建 Match、发放权益、撤销会话、发布 Domain Event |

不要使用“万能 JSONB 表”或无法建立真实 FK 的 `content_type + content_id` 代替结构化关系。

## Schema 成熟度

| Schema | 模型 | 字段设计 |
| --- | --- | --- |
| `identity` | `frozen` | 核心四表 SQL 级 `frozen`；OTP/Session/Device 已确认字段，未确认类型逐字段 `designing` |
| `learning` | `frozen` | 43 张必建表、核心字段与约束已冻结；跨域 Media FK 与内容发布机制局部待定。 |
| `social` | `frozen` | 20 张首期表已冻结；公开内容字段局部 `designing`。 |
| `chat` | `frozen` | Chat 第一阶段 7 张表定稿；物理 DDL（跨域用户 FK、Media FK、`public_id` 生成算法）为 `designing` |
| `commerce` | `frozen`（V1 逻辑） | 16 张业务表表级/字段级 `frozen`；**物理约定与全局规范冲突，`designing`**（见下）；会员/Subscription/Entitlement 落表 `deferred` |
| 其余四个 | `baseline` | `designing`，不得从实体名自动生成表 |

详见 [Identity 数据库](../domains/identity/database.md)、[Learning 数据库](../domains/learning/database.md)、[Social 数据库](../domains/social/database.md)、[Chat 数据库](../domains/chat/database.md) 与 [Commerce 数据库](../domains/commerce/database.md)。

## 跨域物理约定冲突（待主会话裁决）

Commerce V1 会话以 `uuid` 主键、跨域不建 FK 给出 DDL，并假设「整个项目一直采用 UUID」。这与本页规范第 3 条（`bigint generated always as identity`，不使用 UUID）、第 11/12 条（保留 FK、允许跨 Schema FK）冲突；Chat 亦已在 [ADR-015](../adr/ADR-015-chat-naming-and-sql-adjudication.md) 就同类偏差裁决为「主键回归 identity」。Identity/Learning/Social/Chat 四域当前实际均为 `bigint identity`。

因此全项目**主键类型（bigint identity vs UUID）与跨域引用是否建物理 FK** 是一个尚未统一、由主架构会话裁决的问题（见 [未决事项](../governance/open-questions.md)、台账 D-077/D-078）。Commerce 的业务模型、表清单与字段语义不受影响、保持 `frozen`；在其物理 DDL 与其余四域对齐之前，本页十二项规范不作改动，也不得把 Commerce 的 `uuid`/无 FK 写法当作新的全局标准推广到其他域。

## 域命名与表名

一级域与 Schema 统一命名：`chat` 域使用 `chat` Schema。此前使用过的 `messaging` 名称已废弃。

`chat` 域的表名保留会话定稿的 `chat_*` 单数带前缀形式（如 `chat_conversation`），与本页「表名使用复数」不同，属**已裁决的正式例外**：该域由会话逐表定稿，表名与其结论逐字保持一致，且 `chat_` 前缀与 Schema 名一致，不存在语义冲突。其他域继续遵循复数规则。

## `public_id` 适用范围

本页「当前预期使用 `public_id` 的对象包括 User、Post、Conversation、Message、Order」已落实：`chat_conversation` 与 `chat_message` 均带有 `public_id varchar(32) NOT NULL UNIQUE`。生成算法与各实体前缀仍为 `designing`。
