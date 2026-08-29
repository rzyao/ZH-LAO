---
status: baseline
last_updated: 2026-08-30
---

# PostgreSQL 总规范与 Schema 规划

> 本页是 [ADR-018 全局数据库设计原则最终版](../adr/ADR-018-global-database-design-principles-final.md) 的 operative 落地版。若二者口径存在差异，以 ADR-018 为准。全局规范经「数据库域设计」会话全局修订（分享 `https://chatgpt.com/share/6a9314bc-4ed0-83ea-8127-baf221a1a4ad`）定稿为 **Final / Global Standard**；其优先级为：全局最终版 → 各 Domain 定稿 → 具体表 DDL → 应用实现细节。

## 物理边界

使用一个 PostgreSQL 实例、一个主数据库与九个业务 Schema：

```text
identity  learning  social  chat
commerce  rewards   trust   operations platform
```

- `community` Schema 已取消：动态、点赞、评论、Feed 等社区/动态能力正式归入 `social` Schema，不再保留独立 Community Schema。
- `platform` 承载 Platform 业务域能力，固定为 6 张业务表：`feature_flags` / `feature_flag_overrides` / `runtime_configs` / `app_versions` / `announcements` / `regions`（Product Runtime Control Plane）。`system_outbox_events`（全系统唯一一套）与统一 Asset/Media 基础设施属于 **Platform Infrastructure**，不计入业务 Schema，也不计入任何业务 Domain 的业务表数量。其他业务 Domain 不建立指向 `platform.*` 的跨域 FK（Region 语义跨域用 `region_code` 等逻辑标识）。
- 不采用一个 Domain 一个数据库。

## 统一规范（Final）

1. **表名使用复数。** 使用 `users`、`auth_identities`、`messages`；不使用 `user`、`user_info`、`tbl_user`。（Chat 域 `chat_*` 为已裁决正式例外，见「域命名与表名」。）
2. **全部使用 snake_case。** Schema、表和字段一致。
3. **主键类型由各 Domain 自行决定，不强制统一。** 早期域可保留 `bigint generated always as identity`；后续域可使用 `uuid PRIMARY KEY`；已定稿域不因本次修订做无业务价值的主键迁移。跨域引用一律通过 stable logical UUID（见「ID 策略」）。
4. **时间统一为 timestamptz。** 服务端保存绝对时间，客户端按时区显示。
5. **默认审计时间。** 大多数实体保留 `created_at` 和 `updated_at`；纯关系表可只保留 `created_at`。
6. **按业务决定删除策略，不机械软删除。** 不机械给所有表添加 `deleted_at`；历史事实（交易/账本/审核/处罚/安全治理/消息/审计）不物理删除，以 `status`/`reversal`/`revocation`/`cancelled_at`/`voided_at`/superseding record 表达撤销；当前关系类数据允许按业务语义删除；字典/配置类优先 `disabled`/`inactive`/`retired`；OTP/过期 Session/曝光等临时高容量数据允许 retention 清理。
7. **状态优先 VARCHAR + CHECK。** 小型稳定状态使用 `varchar(32)` 和 CHECK，不泛化 PostgreSQL ENUM。
8. **金额禁止 float。** 使用 `amount_minor` 与 `currency`，按货币最小单位表达。
9. **业务动作不放入数据库触发器。** 互关生成 Match 等动作由 Application Service 在事务中完成并可产生 Domain Event。
10. **JSONB 只存真正动态的数据。** 可用于支付原始响应、审核模型输出、`platform.runtime_configs` 配置值（必须配 `value_type` 与应用层校验）和扩展 metadata；用户资料、课程、权益等核心字段必须结构化。Feature Flag 定义与覆盖规则必须保持完全关系化，不建 `conditions` / `rules` JSONB（见 [Platform 数据库](../domains/platform/database.md)）。
11. **同一 Domain（同一 Schema）内建立真实 PostgreSQL FK。** 数据库负责守护 Domain 内部数据完整性。
12. **禁止跨 Domain / 跨 Schema 物理 Foreign Key。** 跨域只保存对方 logical UUID，不建立 `REFERENCES other_domain.*`。模块化单体仍遵守 Module Boundary，不因「同库」退化为共享数据库脚本式架构。

## ID 策略（Final）

- **Internal ID（PK）**：服务于 Domain 内部关联/索引/Join，类型由 Domain 自己决定（BIGINT 或 UUID）。
- **Logical ID**：服务于跨 Domain 引用、API、Event、Outbox、客户端标识、跨系统长期追踪；统一采用 **UUID**。
- 任何满足以下任一条件的聚合根或业务实体，**必须具有稳定 UUID logical/public ID**：可能被其他 Domain 引用；会出现在跨域事件中；会暴露给客户端/API；生命周期需跨系统长期追踪；可能被运营/审计/安全识别；未来存在跨服务拆分可能。
- **跨 Domain 永远不得引用另一个 Domain 的内部 BIGINT PK**；跨域只能通过 logical UUID 协作（Domain Service / API + Domain Event / Outbox）。
- `public_id` 用于向客户端公开且不应暴露连续内部 ID 的主要实体（User、Post、Conversation、Message、Order 等）；生成算法与各实体前缀为 `designing`。
- Rewards 的跨域稳定 ID 是 `grant_no uuid`（名为 `grant_no` 而非 `public_id`，见 [Rewards 数据库](../domains/rewards/database.md)）。

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
| `chat` | `frozen` | Chat 第一阶段 7 张表定稿；「全域审计后的最终修正版」已把跨域用户 / Media 引用统一为 logical UUID（无跨域物理 FK）、`public_id` 定为 UUID；剩余物理 DDL（Outbox 物理表、UUID 分配实现）为 `designing`；逻辑模型与跨域契约均符合全局最终版（`bigint identity` 内部 PK + `public_id uuid` logical ID） |
| `commerce` | `frozen`（V1） | 16 张业务表 `frozen`；物理约定（`uuid` 主键 + 跨域只存 logical UUID 不建物理 FK）**符合全局最终版（ADR-018），compliant**；会员/Subscription/Entitlement 落表 `deferred` |
| `trust` | `frozen`（治理链路 6 表） | 6 表逻辑模型 `frozen`；`uuid` 主键 + 跨域只存 logical UUID 不建物理 FK **符合全局最终版（ADR-018），compliant**；真人认证 Verification `designing` |
| `rewards` | `frozen` | 5 张表（programs/rules/events/grants/deliveries）字段级 `frozen`；审计确认跨域引用统一 `uuid` logical reference、不建独立 outbox（统一 `system_outbox_events`），符合全局最终版（ADR-018）；权益型奖励/Manual Grant/非 Coin 资产延后 |
| `operations` | `frozen` | 5 张表（operators/roles/operator_roles/role_permissions/operator_audit_logs）字段级 `frozen`；稳定逻辑 ID 用 `varchar(20)`（非 UUID）与全局「跨域 logical UUID」的类型差异待主会话裁决；后台认证机制归 Identity/Auth 未设计 |
| `platform` | `frozen` | 6 张业务表（`feature_flags`/`feature_flag_overrides`/`runtime_configs`/`app_versions`/`announcements`/`regions`）字段级 `frozen`（全域审计最终修正版）；`runtime_configs` 仅 current-state（无版本/回滚）；Media/Asset Infrastructure 与 `system_outbox_events` 物理细节 `designing` |

详见 [Identity 数据库](../domains/identity/database.md)、[Learning 数据库](../domains/learning/database.md)、[Social 数据库](../domains/social/database.md)、[Chat 数据库](../domains/chat/database.md)、[Commerce 数据库](../domains/commerce/database.md)、[Trust 数据库](../domains/trust/database.md)、[Rewards 数据库](../domains/rewards/database.md)、[Operations 数据库](../domains/operations/database.md) 与 [Platform 数据库](../domains/platform/database.md)。

## 跨域物理约定已裁决（全局最终版）

Commerce V1 与 Trust 6 表采用「`uuid` 主键 + 跨域只存 logical UUID 不建物理 FK」，曾被标记为与旧版全局规范第 3/11/12 条冲突（`designing`）。经「数据库域设计」会话全局修订（[ADR-018](../adr/ADR-018-global-database-design-principles-final.md)），该写法**已被裁决为全局标准，compliant**：

- 主键类型不强制统一：已定稿为 BIGINT 内部 PK 的域（Identity/Learning/Social/Chat）继续保留；已定稿为 UUID PK 的域（Commerce/Trust）继续保留 UUID。不互相迁移。
- 跨域引用统一通过 logical UUID，禁止跨域物理 FK；域内 FK 保留。
- Chat 的 `bigint identity` 内部 PK + `public_id uuid` logical ID 亦完全符合最终版。

此项已从 [未决事项](../governance/open-questions.md) 移出；台账 [D-077/D-078/D-092](../governance/design-register.md) 已裁决为 `frozen`，新增全局原则 [D-097~D-101](../governance/design-register.md)（Rewards 审计确认见 [D-096](../governance/design-register.md)）。

## 域命名与表名

一级域与 Schema 统一命名：`chat` 域使用 `chat` Schema。此前使用过的 `messaging` 名称已废弃（全局最终版确认 Chat 为唯一正式命名）。

`chat` 域的表名保留会话定稿的 `chat_*` 单数带前缀形式（如 `chat_conversation`），与本页「表名使用复数」不同，属**已裁决的正式例外**：该域由会话逐表定稿，表名与其结论逐字保持一致，且 `chat_` 前缀与 Schema 名一致，不存在语义冲突。其他域继续遵循复数规则。

## `public_id` 适用范围

本页「当前预期使用 `public_id` 的对象包括 User、Post、Conversation、Message、Order」已落实：`chat_conversation` 与 `chat_message` 均带有 `public_id uuid NOT NULL UNIQUE`（Chat 会话「全域审计后的最终修正版」将早期 `varchar(32)` 定为 UUID，应用层生成）。各实体 `public_id` 的生成/分配实现仍为 `designing`。
