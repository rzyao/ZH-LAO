---
status: frozen
last_updated: 2026-08-31
---

# 领域与基础设施边界

Platform 的核心治理原则是：**只拥有真正跨领域的产品运行控制事实。**

“很多地方都会用”“可以配置”“看起来很基础”都不是把一个事实放进 Platform 的充分理由。

## Platform 与业务领域

如果一个配置可以明确回答“它属于哪个业务 Domain 的业务规则”，就应该回到那个 Domain。

| 领域 | 不归 Platform 的典型事实 |
| --- | --- |
| Identity | 用户账号、认证、账号状态、登录规则 |
| Social | 用户发现偏好、Match/Follow、暂停被推荐等用户关系/状态 |
| Chat | 会话状态、消息限制、用户禁言业务状态 |
| Commerce | Gift Price、Product Price、Payment Limit、Refund Rule、Wallet Rule |
| Rewards | Reward Amount、Reward Rule、Reward Limit |
| Trust & Safety | 举报规则、审核结果、处罚、Risk Decision、Capability Restriction |
| Learning | 学习进度、掌握规则、复习规则 |
| Content | 内容发布规则、课程结构、词典与练习规则 |
| Audio | 生产任务状态、Preset 使用事实、审核与正式版本 |

Platform 可以提供“整个产品是否开放某能力”的 Flag，但不能借此接管用户级/对象级状态机。

## Platform 与 Operations

```text
Platform
= 产品当前运行成什么状态

Operations
= 谁能在后台改这些状态，以及谁成功做过什么操作
```

例如后台关闭某个 Feature Flag：

```text
Operations Authentication / RBAC
↓
Platform Mutation
↓
platform.feature_flags / overrides 更新
↓
Operations Audit
```

Platform 不保存 Operator/Role/Permission/Audit；Operations 也不复制 Feature Flag/Config canonical state。

## Platform 与 Shared Infrastructure

必须区分：

```text
Platform Domain
→ 产品运行控制的业务事实

Shared Application / Infrastructure
→ 软件系统如何可靠执行、存储、发布、传输
```

Shared Infrastructure 包括：

```text
infrastructure.system_outbox_events
infrastructure.assets
PostgreSQL Pool / Transaction Manager
Worker / Polling
Logging / Request ID / Error
Object Storage Adapter
WebSocket / Push Transport（未来实现）
```

这些能力服务全系统，但不因此成为 `platform.*` 业务表。

## Asset / Media

所有 `asset_id` 的物理存储元数据由共享 Asset Infrastructure 拥有。

Platform 不建立 `platform.media_assets` 或 `platform.files` 来重复维护：

```text
provider
bucket
object_key
checksum
mime
size
```

业务 Domain 只保存 `asset_id` logical UUID。

## Outbox

全系统只有：

```text
infrastructure.system_outbox_events
```

Platform 不建立自己的 `platform.events` / `platform.outbox_events` 来复制同一可靠投递能力。

## Notification / Messaging

Announcement 属 Platform，但 Notification Delivery / Push / Chat Message 不是 Platform Announcement 的同义词。

```text
Announcement
= 平台广播内容与范围

Push / WebSocket
= 传输能力

Chat Message
= Chat 业务事实
```

未来如需要用户通知中心、营销 Campaign 或系统消息，需要单独明确业务所有权，不能自动塞进 Platform。

## Secret / Deployment

Platform Runtime Config 不是 Secret Store，也不是 Deployment Config。

以下不归 Platform 业务数据：

```text
数据库密码
JWT Secret
Provider Credential
Object Storage Secret
CI/CD 配置
服务器部署拓扑
容器/进程编排状态
```

这些属于部署和安全基础设施。

## Region 边界

Platform Region 是产品支持范围，不是 GIS。

业务领域使用 `region_code` 等稳定逻辑标识时不建立跨 Domain Physical FK。

业务专属地区规则仍归业务 Domain。

## 判断一个新配置是否属于 Platform

新增 Platform 能力前至少问：

1. 这个事实是否明确属于某个业务 Domain？若是，回到 Owner Domain。
2. 它是否是 Secret / Deployment / Storage / Transport 等技术基础设施？若是，放 Infrastructure。
3. 它是否描述“产品整体当前如何运行”，且确实被多个业务领域/客户端共享？若是，才可能属于 Platform。
4. 是否已经有现有 Platform 能力能准确表达？如果不能，不要塞入万能 JSON；应正式设计新能力。

全局基础设施见 [基础设施与集成](/developer/reference/architecture/infrastructure/)。
