---
status: baseline
last_updated: 2026-08-31
---

# 总体架构

ZH-LAO 当前采用 **单仓库、多应用、模块化单体后端、单 PostgreSQL 主库** 的总体架构。

架构目标不是追求分布式复杂度，而是在保持清晰领域边界、可测试性和未来可拆分能力的前提下，优先降低单人开发阶段的部署、运维、监控和一致性成本。

## 系统组成

| 组成 | 当前实现 | 主要职责 |
| --- | --- | --- |
| 移动客户端 | `apps/mobile` | 面向用户的学习、社交、聊天等客户端能力 |
| 后台管理端 | `apps/admin` | 面向运营人员的后台管理、审核、配置和工作台能力 |
| 后端 API | `apps/backend` | HTTP API、认证、领域应用服务、事务协调、领域公共契约 |
| 后台 Worker | `apps/backend/src/worker.ts` | Outbox 投递、轮询任务和异步后台工作 |
| PostgreSQL | `database/v2` + 单主库 | 业务事实、领域内完整性、事务和共享基础设施元数据 |
| 文档系统 | `docs` | 产品、架构、领域设计、开发控制与 ADR 的长期事实记录 |

## 运行拓扑

```text
移动客户端（Expo / React Native）
            │
            │ HTTPS / JSON
            ▼
       后端 API（Fastify）
            │
            ├──────────────► PostgreSQL
            │                 ├─ 11 个业务 Schema
            │                 └─ infrastructure.*
            │
            └─ 同事务写入 Outbox / Asset 元数据
                              │
                              ▼
                     后台 Worker / Publisher
                              │
                              └─ 外部 Provider / 推送 / 后续集成

后台管理端（React / Vite）
            │
            └──────────────► 后端 API
```

客户端和后台管理端 **不得直接访问 PostgreSQL**。所有业务写入、权限判断和跨领域协调都由后端负责。

## 领域架构

后端采用模块化单体。当前正式业务领域共 11 个：

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

领域是 **业务事实与代码责任边界**，不是微服务边界。当前不按领域拆独立服务或独立数据库。

详细责任见 [领域关系图](domain-map.md)。

## 数据架构

使用一个 PostgreSQL 实例、一个主数据库和 11 个业务 Schema：

```text
identity  content  learning  social  chat  audio
commerce  rewards  trust     operations platform
```

同时存在共享基础设施 Schema：

```text
infrastructure.assets
infrastructure.system_outbox_events
```

全局数据库规则：

- 同一领域内部建立真实 PostgreSQL 外键；
- 禁止跨领域 / 跨 Schema 物理外键；
- 跨领域引用使用稳定 UUID logical/public ID；
- 跨领域永远不得暴露或引用另一个领域的内部 BIGINT 主键；
- 数据库负责 PK、FK、UNIQUE、CHECK、NOT NULL 和事务完整性；
- 跨实体业务动作、状态机和领域事件由应用服务负责；
- `database/v2` 是 migration 的唯一物理权威，后端启动时不自动修改生产 Schema。

完整规范见 [PostgreSQL 总规范](database.md)。

## 后端技术基线

当前后端已实际落地：

```text
Node.js 22+
TypeScript + ESM
Fastify 5
PostgreSQL + pg
Zod
Pino
Vitest
pnpm
```

后端包含独立 API runtime 和 Worker runtime，并已有事务管理、统一错误模型、日志与 request ID、认证基础设施、Outbox、Asset 基础设施、数据库 readiness 与架构边界审计。

详见 [后端架构](backend.md)。

## 客户端技术基线

当前有两类正式客户端：

- **移动客户端**：Expo + React Native，Android 为主要验证平台，同时保留 iOS / Web 运行能力；
- **后台管理端**：React + Vite 的桌面优先 SPA。

两端均只消费后端公开 API，路由和跨领域对象只使用公开 UUID，不感知数据库内部 BIGINT。

详见 [客户端架构](frontend.md)。

## 跨领域协作原则

跨领域协作优先使用两种方式：

1. **同步公共契约**：一个领域只能消费另一个领域公开的 `public` contract，不能导入其 repository、内部 domain/application/infrastructure 实现；
2. **异步领域事件**：需要可靠异步投递的事实与业务写入在同一事务中写入项目级 Outbox，再由 Worker 发布。

不因为实时推送、通知或后台任务临时创建新的业务领域。WebSocket、Push、Outbox Publisher 等属于 Application / Infrastructure 能力。

详见 [基础设施与集成](infrastructure.md)。

## 安全与权限分工

```text
Identity       → 用户认证、Session、Device、账号状态
Operations     → 后台 Operator、RBAC、后台操作审计
Trust & Safety → 举报、审核、平台处罚和申诉
业务 Domain    → 自己的业务状态与业务授权前置条件
```

认证成功不等于业务有权限；后台操作者身份、RBAC 和业务对象状态分别由各自事实拥有者裁决。

详见 [安全与权限架构](security.md)。

## 当前明确不采用

首期架构当前不采用：

- 一个领域一个数据库；
- 按领域拆微服务；
- Kafka / RabbitMQ 作为基础依赖；
- Redis 作为 RBAC 或领域状态的必选缓存；
- 为推送单独建立 Notification Domain；
- 客户端直连数据库；
- 在业务 HTTP 层直接执行 SQL；
- 通过数据库触发器实现跨实体业务流程。

## 尚未冻结的基础设施选择

以下内容仓库目前没有最终生产选型，因此本页不替代后续正式决策：

- 生产部署平台与拓扑；
- 生产对象存储 Provider；
- 正式 SMS / Facebook Provider adapter；
- WebSocket / App Push 的生产实现；
- 当真实吞吐超过 PostgreSQL Outbox polling 能力后是否引入外部消息中间件。

只有在出现真实需求、负载或运维约束后再通过 ADR / 架构设计正式裁决。

## 架构权威

本页描述当前系统级稳定架构。更具体的权威来源：

- 领域职责：[领域关系图](domain-map.md)
- 数据规则：[PostgreSQL 总规范](database.md)
- 后端实现结构：[后端架构](backend.md)
- 客户端实现结构：[客户端架构](frontend.md)
- Shared Infrastructure：[基础设施与集成](infrastructure.md)
- 安全边界：[安全与权限架构](security.md)
- 核心决策：[ADR-001](../adr/ADR-001-modular-monolith-and-domain-schemas.md)、[ADR-014](../adr/ADR-014-no-notification-domain-events-outbox-infra.md)、[ADR-018](../adr/ADR-018-global-database-design-principles-final.md)
