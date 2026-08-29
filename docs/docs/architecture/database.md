---
status: baseline
last_updated: 2026-08-30
---

# PostgreSQL 总规范与 Schema 规划

## 物理边界

使用一个 PostgreSQL 实例、一个主数据库和十个业务 Schema：

```text
identity  learning  social  community  messaging
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
| `messaging` | `frozen` | Chat 第一阶段 7 张表定稿；表名前缀、枚举类型、主键生成方式与本页规范的差异为 `designing`。 |
| 其余六个 | `baseline` | `designing`，不得从实体名自动生成表 |

详见 [Identity 数据库](../domains/identity/database.md)、[Learning 数据库](../domains/learning/database.md)、[Social 数据库](../domains/social/database.md) 与 [Messaging 数据库](../domains/messaging/database.md)。

## 已知规范偏差

`messaging` Schema 在会话设计中出现了三处与本页十二项规范的偏差，**由主架构会话裁决，文档维护阶段不自行统一**：

| 项 | 本页规范 | Messaging 会话用法 |
| --- | --- | --- |
| 表名 | 复数 | 单数且带域前缀（`chat_conversation`） |
| 状态/枚举 | `varchar(32)` + CHECK | `smallint` + CHECK |
| 主键 | `bigint generated always as identity` | `BIGINT PRIMARY KEY` |

偏差只影响上述三项；Messaging 的字段语义、约束、索引意图与业务规则均已 `frozen`，不得因命名与类型差异整体降级。完整清单见 [Messaging 数据库](../domains/messaging/database.md) 的「与全局 SQL 规范的差异」一节。
