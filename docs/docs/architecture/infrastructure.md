---
status: baseline
last_updated: 2026-08-31
---

# 基础设施与集成架构

本页描述 **不属于某个业务领域、但被多个领域共同依赖的 Application / Infrastructure 能力**。

这些能力可以支撑多个 Domain，但不因此拥有业务事实。

## 基础设施边界

当前共享基础设施主要包括：

```text
PostgreSQL migration / readiness
统一数据库 Pool / Transaction Manager
项目级 Outbox
后台 Worker / Polling Job
Asset / Media canonical metadata
对象存储端口
日志 / Request ID / Error 基础设施
外部 Provider adapter boundary
```

Shared Infrastructure 不计入 11 个业务 Domain，也不应被任意 Domain 复制一份。

## 项目级 Outbox

全系统只使用一套共享 Outbox：

```text
infrastructure.system_outbox_events
```

`source_domain` 用于标识事件来源，不按 Domain 创建独立 Outbox 表。

### 写入规则

需要可靠异步发布的业务事实采用：

```text
Application Service
↓
BEGIN
├─ 写入 Domain canonical fact
└─ 写入 system_outbox_events
COMMIT
↓
后台 Publisher 异步发布
```

业务数据与 event row 必须处于同一事务，否则可能出现“业务成功但事件丢失”或“事件已发但业务回滚”。

### Publisher

当前 Outbox Publisher 使用 PostgreSQL polling：

- 并发领取使用 `FOR UPDATE SKIP LOCKED`；
- `available_at` 作为下一次可领取时间，并承担有限 lease 语义；
- claim 会增加 attempt count；
- 成功记录 published time；
- 失败记录 last error 与下一次 retry time；
- 重试采用有上限的指数退避；
- 未知事件类型不能静默 ACK。

当前规模不要求 Kafka / RabbitMQ。

只有通过真实生产指标证明 PostgreSQL polling 在吞吐、延迟或可用性上不够时，才进入新的架构决策。

## 领域事件与传输

领域事件表达业务事实，不表达传输实现。

例如 Chat 可以产生“消息已创建”事实，但：

```text
WebSocket 是否已发送
Push 是否已送达
某设备是否在线
```

这些不是 Chat message 的 canonical 业务状态。

因此当前不建立独立 Notification Domain 或 Realtime Domain。

```text
Domain Event
↓
Outbox
↓
Application / Infrastructure Consumer
├─ WebSocket
├─ App Push
├─ 后台任务
└─ 其他真实消费者
```

具体 WebSocket / Push production transport 尚未冻结。

## Worker 架构

后台任务统一由 Worker Runtime 承载，而不是在 HTTP handler 中执行长任务。

当前入口：

```text
apps/backend/src/worker.ts
```

Foundation 已提供：

- Worker Registry；
- polling job；
- abortable lifecycle；
- graceful shutdown。

每个 Domain 如果需要后台任务，应定义自己的业务语义、幂等和重试策略，再注册到共享 Worker 基础设施；不得另起一套隐式任务框架。

## Asset / Media 基础设施

物理文件和通用媒体元数据只有一个 canonical owner：Shared Asset / Media Infrastructure。

当前 canonical metadata 位于：

```text
infrastructure.assets
```

业务领域保存：

```text
asset_id UUID
```

而不是重复保存 storage provider、bucket、object key、checksum 等通用物理文件事实。

### 责任分离

```text
业务 Domain
负责：这个文件在业务上是什么、为什么存在、何时可使用

Asset Infrastructure
负责：文件 canonical metadata、storage locator、checksum 等技术事实

Object Storage Provider
负责：物理对象读写
```

例如 Audio Production 拥有音频生产版本与审核事实，但只保存 `asset_id`，不成为对象存储事实拥有者。

### 当前状态

Foundation 已实现 canonical Asset repository 与 object-storage port。

**生产对象存储 Provider 尚未正式选择。** 在正式 Provider 落地前，任何业务流程不得把 placeholder adapter 当成 production storage 成功路径。

## 外部 Provider 边界

第三方服务必须通过 adapter / port 与核心业务隔离。

当前明确存在或预留的外部能力包括：

| 外部能力 | 所属业务语义 | 当前架构状态 |
| --- | --- | --- |
| SMS / OTP Delivery | Identity | port 已有，正式生产 Provider 待接入 |
| Facebook Credential Verification | Identity | adapter boundary 已有，正式生产配置待接入 |
| TTS Provider / Model / Voice | Audio Production 外部生产服务 | 由 TTS 服务自维护模型与 Provider 历史 |
| Object Storage | Shared Asset Infrastructure | port 已有，生产 Provider 未选择 |
| WebSocket / App Push | Application / Infrastructure | production transport 未冻结 |

原则：第三方失败不能改变 canonical 业务事实的 ownership，也不能把第三方 raw payload 直接扩散为跨 Domain 公共模型。

## Migration 基础设施

`database/v2` 是 Schema migration 唯一权威。

后端：

- 不在启动时自动执行 migration；
- 不生成第二套 ORM schema authority；
- readiness 只做 compatibility check；
- migration 文件与登记 SHA 不一致时 readiness 失败。

这保证生产 Schema 变更是显式、可审计的操作。

## 共享数据库设施的使用规则

业务 Domain 普通 repository 只访问自己拥有的 Schema。

对：

```text
infrastructure.assets
infrastructure.system_outbox_events
```

的访问通过 Foundation 共享 adapter 完成，不允许各 Domain 私自复制 SQL implementation。

## 跨领域同步集成

同步调用使用 Domain Public Contract。

```text
Domain A application
↓
Domain B public interface
↓
Domain B internal implementation
```

禁止：

```text
Domain A → Domain B repository
Domain A → Domain B internal SQL
Domain A → Domain B internal BIGINT
```

当同步依赖会导致不必要的耦合，或者业务天然允许异步时，优先使用 Domain Event + Outbox。

## 跨领域审计

Operations 拥有后台操作审计事实，但不因此获得直接修改其他 Schema 的权限。

V1 对跨 Domain canonical write 与 Operations Audit 的 durability 仍存在已接受的集成技术债：不能为了“同一个本地数据库事务”而破坏 owner Domain 边界。后续应通过明确 durable audit delivery / outbox contract 解决，而不是让 Operations repository 直接写 owner schema。

## 可观测性基础

当前已经落地的基础能力包括：

- Pino 结构化日志；
- request ID；
- HTTP response correlation；
- 日志敏感字段脱敏；
- transaction rollback logging；
- public liveness；
- database/schema-aware readiness。

完整 metrics / tracing / alerting / production dashboard 尚未在当前架构中冻结，应在 Production Readiness 阶段正式设计。

## 当前不引入的基础设施

首期当前不引入：

```text
Kafka
RabbitMQ
按 Domain 独立 Outbox
独立 Notification Domain
独立 Realtime Domain
业务 Domain 自建 PostgreSQL Pool
业务 HTTP 直接 SQL
业务表保存 websocket_sent / push_sent 等 transport state
```

参见 [总体架构](overview.md)、[后端架构](backend.md)、[PostgreSQL 总规范](database.md)、[ADR-014](../adr/ADR-014-no-notification-domain-events-outbox-infra.md)。
