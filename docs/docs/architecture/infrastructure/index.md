---
status: baseline
last_updated: 2026-08-31
---

# 基础设施与集成

本页描述**不属于某个业务领域、但被多个领域共同依赖的 Application / Infrastructure 能力**。

这些能力可以支撑多个 Domain，但不因此拥有业务事实。

## 共享基础设施

当前系统级基础设施包括：

```text
PostgreSQL Pool / Executor / Transaction Manager
Migration Compatibility / Readiness
项目级 Outbox
Worker / Polling Job
Asset / Media canonical metadata
Object Storage Port
Logging / Request ID / Error
Authentication Provider seam
External Provider Adapter boundary
```

共享基础设施不计入 11 个业务 Domain，也不允许每个 Domain 各复制一套。

## 项目级 Outbox

全系统只使用：

```text
infrastructure.system_outbox_events
```

`source_domain` 标识事件来源，不按 Domain 建独立 Outbox 表。

### 写入规则

```text
Application Service
↓
BEGIN
├─ 写入 Domain canonical fact
└─ 写入 system_outbox_events
COMMIT
↓
后台 Publisher
```

业务事实与 Outbox row 必须同事务提交。

### Publisher

当前 Publisher 采用 PostgreSQL polling：

- 并发领取使用 `FOR UPDATE SKIP LOCKED`；
- `available_at` 参与重试/lease 语义；
- claim 增加 attempt count；
- 成功记录 published time；
- 失败记录 last error 与下一次 retry time；
- 重试采用有上限的指数退避；
- 未知事件类型不得静默 ACK。

当前不需要 Kafka / RabbitMQ。只有真实生产指标证明 PostgreSQL polling 在吞吐、延迟或可用性上不足时，才进入新的架构决策。

## 领域事件与传输

领域事件表达业务事实，不表达传输实现。

例如：

```text
MessageCreated = Chat 业务事实
WebSocket Sent = 传输事实
Push Delivered = 传输事实
```

WebSocket、Push、在线连接和传输重试属于 Application / Infrastructure，不构成新的业务 Domain。

## Asset / Media

物理文件事实由共享 Asset Infrastructure 统一拥有。

业务领域只保存：

```text
asset_id UUID
```

共享 Asset metadata 可以包含：

```text
asset_id
storage_provider
bucket / container
object_key
mime_type
size
checksum
状态与审计时间
```

具体字段以冻结 Migration / Infrastructure Contract 为准。

业务领域不得重复保存 provider、bucket、object key 等底层存储事实作为自己的 canonical copy。

## Object Storage

后端存在对象存储 Port，但生产 Provider 尚未最终选择。

因此架构层只冻结：

```text
业务领域 → asset_id
Asset Infrastructure → canonical metadata
Object Storage Adapter → 具体 Provider
```

不冻结具体云厂商。

## 数据库基础设施

共享数据库基础提供：

- 单一 Pool Factory；
- Executor；
- Transaction Manager；
- PostgreSQL Error Normalization；
- Readiness / Migration Compatibility Check。

业务模块不得自行创建 Pool，也不得绕过统一事务边界。

完整数据规则见 [PostgreSQL 架构规范](../data/postgresql.md)。

## Migration 权威

```text
database/v2
```

是数据库 Migration 的唯一物理权威。

Backend：

- 不自动创建生产 Schema；
- 不自动执行 Migration；
- Readiness 只验证数据库是否符合要求。

## 外部 Provider 边界

外部能力必须通过 Adapter/Port 与业务核心隔离，例如：

```text
SMS
Facebook Credential Verification
Object Storage
未来 TTS / AI / Moderation Provider
未来 Push / Realtime Transport
```

Provider 未配置时需要显式 unavailable/fail-closed 行为，不允许生产环境静默退化为 Fake Provider。

## Worker

后台 Worker 是运行时能力，不是业务领域。

```text
Worker Runtime
├─ Outbox Publisher
└─ Registered Polling Jobs
```

每个业务 Job 的业务语义仍归其 Owner Domain；Worker 只提供执行框架和生命周期管理。

## 同步跨领域调用

同步跨领域调用必须经过 Provider Domain 的 `public/` Contract。

```text
Consumer Domain
↓
Provider Domain public contract
↓
Provider Application / Query
```

禁止：

```text
Consumer Repository → Provider Schema
Consumer Module → Provider Internal Repository
```

详细规则见 [领域依赖与协作](../domains/dependencies.md)。

## 可观测性基础

当前系统级基础包括：

```text
Pino structured log
Request ID
HTTP response correlation
Sensitive-field redaction
Transaction rollback logging
Worker lifecycle logging
```

正式 Metrics / Tracing / Alerting 后端属于生产就绪阶段的后续系统级设计，不在当前文档中假设已经存在。

## 尚未冻结

以下实现尚未最终选型：

- 生产 Object Storage Provider；
- 正式 SMS Provider；
- Facebook Production Adapter 具体实现；
- WebSocket Transport；
- App Push Provider；
- 外部 Message Broker；
- Production Metrics / Tracing Vendor。

这些未决项不能由某个业务 Domain 私自决定并写成系统事实。
