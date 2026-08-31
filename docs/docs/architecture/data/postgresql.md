---
status: baseline
last_updated: 2026-08-31
---

# PostgreSQL 架构规范

本页记录 ZH-LAO 当前长期有效的 PostgreSQL 架构规则。具体字段、表结构和 Domain 业务约束以各 Domain 数据设计与冻结 Migration 为准。

## 物理拓扑

系统使用：

```text
1 个 PostgreSQL 实例
1 个主数据库
11 个业务 Schema
1 个共享 infrastructure Schema
```

业务 Schema：

```text
identity
content
learning
social
chat
audio
commerce
rewards
trust
operations
platform
```

共享基础设施：

```text
infrastructure.assets
infrastructure.system_outbox_events
```

不采用一个 Domain 一个数据库。

## Schema 与领域

Schema 是领域数据物理边界，但不是微服务边界。

```text
Domain Boundary
≈ Code Module Boundary
≈ PostgreSQL Schema Boundary
```

同一主库并不意味着允许跨 Schema 随意 Join、Foreign Key 或直接写入。

## 全局命名与类型规则

1. 表名默认使用复数；已冻结的正式例外不因统一风格做无业务价值重命名。
2. Schema、表和字段使用 `snake_case`。
3. 时间统一使用 `timestamptz`；纯日期业务语义使用 `date`。
4. 大多数实体保留 `created_at` / `updated_at`；纯关系或历史事实按业务语义决定。
5. 小型稳定状态优先 `varchar + CHECK`，不泛化 PostgreSQL ENUM。
6. 金额禁止使用浮点数；采用 `amount_minor + currency` 等最小货币单位表达。
7. JSONB 只用于真正动态或 Provider 原始扩展数据；核心业务字段结构化。
8. 不机械给所有表增加 `deleted_at`；删除、撤销、关闭、冲正、作废必须按业务语义设计。

## 主键与逻辑标识

主键类型不要求跨领域统一。

```text
Internal ID
→ Domain 内部关联、索引、Join
→ 可为 BIGINT 或 UUID

Logical / Public ID
→ 跨 Domain
→ API
→ Event / Outbox
→ Client Route / Resource Identity
→ 稳定 UUID
```

任何会被其他 Domain、API、客户端、运营、审计或长期事件引用的聚合根/业务实体，都必须拥有稳定逻辑 UUID。

### 禁止传播内部 BIGINT

```text
Domain A internal bigint
        ✕
Domain B / API / Event / Client
```

跨领域永远不得引用另一个领域的内部 BIGINT PK。

具体公开字段名可以是 `public_id`、`grant_no` 或已冻结的其他业务名称；关键约束是其语义必须是稳定 logical UUID。

## Foreign Key 规则

### 同领域

同一 Domain / Schema 内应使用真实 PostgreSQL FK 保护引用完整性。

```text
content.table_a
   ↓ FK
content.table_b
```

### 跨领域

禁止跨 Domain / 跨 Schema 物理 Foreign Key。

```text
learning.content_id UUID
```

表达的是 Content logical reference，而不是：

```sql
REFERENCES content.some_table(internal_id)
```

跨领域一致性由 Public Contract、Application Service、Domain Event 和业务补偿/校验机制维护。

## 跨领域多态引用

只有业务天然需要引用多个 Domain / Entity Type 时，才允许使用多态 logical reference，例如：

```text
subject_domain
subject_type
subject_id UUID
```

或：

```text
source_domain
source_type
source_id UUID
```

典型场景包括举报对象、审计目标和 Audio Slot 的 Content 来源。

Domain 内普通关系不得为了“通用”而用 `type + id` 代替明确 FK。

## 数据库与应用服务职责

| PostgreSQL 负责 | Application / Domain 负责 |
| --- | --- |
| PK / FK / UNIQUE / CHECK / NOT NULL | 业务状态机 |
| 单事务原子性 | 跨实体业务动作 |
| 结构完整性 | 权限与业务前置条件 |
| 唯一性与并发基础约束 | Domain Event / Outbox |
| Row Lock / Constraint 基础 | 跨领域协作与补偿 |

数据库 Trigger 不承载跨实体业务流程，例如 Mutual Follow → Match 等业务动作由 Application Service 明确完成。

## Transaction

需要原子完成的业务事实必须处于一个 PostgreSQL Transaction 中。

典型模式：

```text
BEGIN
├─ Lock / Validate
├─ Domain Mutation
├─ Related Same-domain Mutation
└─ Outbox Row（如需要）
COMMIT
```

事务边界由 Application Service / Transaction Manager 明确控制。

## 并发与幂等

优先利用数据库保证可证明的不变量：

```text
UNIQUE
CHECK
SELECT ... FOR UPDATE
FOR UPDATE SKIP LOCKED
Compare-and-set
Transaction Isolation / Atomic Commit
```

是否加锁、幂等 Key、Retry Policy 和冲突行为必须来自业务设计/实现蓝图，而不是由 Repository 临时猜测。

## 状态与删除

不同数据类型使用不同生命周期策略：

- 历史事实：交易、账本、审核、处罚、消息、审计通常不物理删除；
- 当前关系：可按业务语义删除；
- 配置/字典：优先 `disabled / inactive / retired`；
- 临时高容量数据：OTP、过期 Session、Exposure 等可设计 Retention Cleanup。

不建立全局统一的“万能软删除规则”。

## JSONB 使用边界

可接受场景：

- Provider 原始响应；
- 审核模型动态输出；
- 真正动态的 metadata；
- 已明确设计为动态值的 Runtime Config。

不应使用 JSONB 取代：

- 用户核心资料；
- 课程/词汇/句子结构；
- 权益、订单、钱包核心字段；
- Feature Flag 的关系化覆盖规则。

## Outbox

全系统唯一共享 Outbox：

```text
infrastructure.system_outbox_events
```

需要可靠异步发布时，Domain Mutation 与 Outbox Row 同事务写入。

不按 Domain 创建独立 Outbox 表。

## Asset

物理文件 canonical metadata 位于共享 Asset Infrastructure。

业务 Domain 只保存：

```text
asset_id UUID
```

不复制 storage provider / bucket / object key 等底层文件事实。

## Migration 权威

```text
database
```

是数据库 Migration 唯一物理权威。

规则：

- 已冻结 Migration 不因文档整理而修改；
- Backend 不在启动时自动迁移；
- Readiness 只验证要求，不写 Schema；
- Migration Registry 与 SHA 用于识别漂移；
- 新结构变更必须通过新的正式 Migration，而不是在运行代码中临时建表。

## 数据库文档职责

本页不维护：

- 每个 Domain 当前有多少张表；
- 哪些字段仍在 designing；
- 哪个开发 Gate 已通过；
- 某次历史冲突如何被裁决；
- 旧方案与新方案的迁移叙述。

这些分别属于 Domain 数据设计、开发进度和 ADR。

当前正式领域边界见 [领域边界](../domains/)，跨领域协作见 [领域依赖与协作](../domains/dependencies.md)。数据库原则的关键历史决策见 [ADR-018](../../adr/ADR-018-global-database-design-principles-final.md)。
