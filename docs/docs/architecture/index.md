---
status: baseline
last_updated: 2026-08-31
---

# 总体架构

ZH-LAO 采用 **单仓库、多应用、模块化单体后端、单 PostgreSQL 主库** 的总体架构。

架构设计的目标是：在保持领域边界、事务一致性、可测试性和未来可拆分能力的前提下，尽量降低当前阶段的部署、运维、监控和分布式系统成本。

## 系统组成

| 组成 | 代码位置 | 职责 |
| --- | --- | --- |
| 移动客户端 | `apps/mobile` | 面向最终用户的学习、社交、聊天等客户端能力 |
| 后台管理端 | `apps/admin` | 面向运营人员的管理、审核、配置和工作台能力 |
| 后端 API | `apps/backend` | HTTP API、认证、应用服务、事务协调、公共契约 |
| 后台 Worker | `apps/backend/src/worker.ts` | Outbox 发布、轮询任务和异步后台工作 |
| PostgreSQL | `database` | 业务事实、领域内完整性、事务与共享基础设施元数据 |
| 文档站 | `docs` | 产品、架构、领域设计、开发控制与 ADR |

## 运行拓扑

```text
移动客户端 ─────┐
               │ HTTPS / JSON
后台管理端 ─────┤
               ▼
          后端 API
               │
               ├────────────► PostgreSQL
               │              ├─ 11 个业务 Schema
               │              └─ infrastructure.*
               │
               └─ 同事务写入 Outbox / 业务事实
                              │
                              ▼
                         后台 Worker
                              │
                              └─ 外部 Provider / 实时与推送等集成
```

客户端和后台管理端不得直接访问 PostgreSQL。所有业务写入、权限判断、状态转换和跨领域协调都必须经过后端边界。

## 领域架构

系统共有 11 个正式业务领域：

```text
身份（Identity）
内容（Content）
学习（Learning）
音频生产（Audio Production）
社交（Social）
聊天（Chat）
商业（Commerce）
奖励（Rewards）
信任与安全（Trust & Safety）
运营（Operations）
平台（Platform）
```

领域是业务事实与代码责任边界，不等于微服务。当前不按领域拆独立服务或独立数据库。

- [领域边界](domains/)
- [领域依赖与协作](domains/dependencies.md)

## 应用架构

后端是模块化单体，业务模块通过 `public/` 暴露跨领域同步契约；移动端与后台管理端只消费后端公开 API，不感知数据库内部主键。

- [后端架构](applications/backend.md)
- [客户端架构](applications/clients.md)
- [全局 API 接口规范](applications/api-standard.md)

## 数据架构

使用一个 PostgreSQL 实例、一个主数据库和 11 个业务 Schema：

```text
identity  content  learning  social  chat  audio
commerce  rewards  trust     operations platform
```

共享基础设施表位于：

```text
infrastructure.assets
infrastructure.system_outbox_events
```

核心规则：

- 同一领域内部使用真实 PostgreSQL FK；
- 禁止跨领域 / 跨 Schema 物理 FK；
- 跨领域、API、事件与客户端标识统一使用稳定逻辑 UUID；
- 内部 BIGINT 主键不得跨领域传播；
- `database` 是 migration 的唯一物理权威；
- 后端启动和 readiness 不自动修改生产 Schema。

详见 [PostgreSQL 架构规范](data/postgresql.md)。

## 基础设施与集成

共享基础设施提供数据库连接与事务、Outbox、Worker、Asset 元数据、日志、错误、Request ID 和外部 Provider 边界，但不因此拥有业务领域事实。

需要可靠异步发布的领域事件采用同事务 Outbox，再由 Worker 投递。

- [基础设施与集成](infrastructure/)
- [安全与权限](infrastructure/security.md)

## 当前明确不采用

当前架构不采用：

- 一个领域一个数据库；
- 按领域拆微服务；
- Kafka / RabbitMQ 作为基础依赖；
- Redis 作为领域状态或 RBAC 的必选事实源；
- 为推送临时建立 Notification Domain；
- 客户端直连数据库；
- HTTP 层直接执行 SQL；
- 数据库触发器承载跨实体业务流程。

## 尚未冻结的生产基础设施

以下选择尚未形成最终生产决策：

- 生产部署平台与拓扑；
- 生产对象存储 Provider；
- 正式 SMS / Facebook Provider Adapter；
- WebSocket / App Push 的生产实现；
- 是否以及何时从 PostgreSQL Outbox polling 升级到外部消息中间件。

这些事项只有在真实需求、负载或运维约束出现后，再通过 ADR 或系统级架构设计裁决。

## 架构文档职责

`architecture/` 只记录**当前有效、长期稳定的系统结构与约束**。

以下内容不放在架构页重复维护：

- 设计讨论历史与被否决方案 → ADR / 设计决策记录；
- 某领域的详细业务语义与字段 → `domains/<domain>/`；
- 开发进度、Gate、阻塞与下一动作 → `development/`；
- 实现报告与测试证据 → 对应开发阶段报告。
