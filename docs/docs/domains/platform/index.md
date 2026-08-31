---
status: frozen
last_updated: 2026-08-31
schema: platform
---

# 平台（Platform）

平台领域是整个产品的 **Product Runtime Control Plane（产品运行控制面）**。

它负责与具体业务领域无关、需要在产品运行期统一控制的状态，例如：功能是否开放、客户端版本是否允许继续使用、产品支持哪些地区、是否展示平台公告，以及真正跨领域的运行参数。

Platform 不是万能配置中心，也不是 Operations，更不是 Shared Infrastructure 的容器。

## 领域能力

V1 固定为 5 类能力、6 张业务表：

| 能力 | 业务事实 | 表 |
| --- | --- | --- |
| 功能开关 | Flag 定义与范围覆盖 | `platform.feature_flags`、`platform.feature_flag_overrides` |
| 运行参数 | 真正跨领域的 current-state 参数 | `platform.runtime_configs` |
| 客户端版本治理 | 客户端兼容与升级策略 | `platform.app_versions` |
| 平台公告 | 全局/范围型平台广播信息 | `platform.announcements` |
| 支持地区 | 产品支持范围与基础地区状态 | `platform.regions` |

字段、约束和索引见 [数据设计](database.md)。

## 核心原则

1. Platform 只拥有真正跨业务领域的运行控制事实。
2. 能明确归属某个业务领域的配置必须回到对应 Domain：`Business Rule ≠ Platform Config`。
3. Feature Flag 不能代替正常业务状态机。
4. Operations 可以管理 Platform，但不能拥有 Platform canonical state。
5. Platform 可以引用其他 Domain 的 logical ID，但不能直接修改其他 Domain 状态。
6. Runtime Config 不能演化成无边界的 `system_settings`。
7. App Version 只描述客户端兼容/升级策略，不承担部署系统职责。
8. Announcement 是平台广播，不自动升级为 Notification / Messaging / Marketing Campaign。
9. Region 是产品支持范围，不构建完整 GIS / 行政区划系统。
10. Shared Outbox、Asset/Media、日志、Worker 等属于 Infrastructure，不计入 Platform 6 张业务表。

## 明确不属于 Platform

例如：

```text
用户账号状态 / 封禁
Social Match / Follow / Profile 状态
Chat Conversation / Message 状态
Gift Price / Product Price / Payment Limit / Refund Rule
Reward Amount / Reward Rule
Moderation / Risk Decision / Enforcement
后台 Operator / Role / Audit
对象存储文件元数据
部署任务 / Cron / Job
```

“可配置”并不意味着“属于 Platform”。

## 明确不建万能表

当前不建立：

```text
platform.settings
system_settings
metadata
parameters
dictionaries
enums
audit_logs
jobs
tasks
cron_jobs
events
notifications
logs
files
```

新增稳定横向能力时，应先明确其业务语义和事实所有权，再决定是否新增 Platform 模型。

## 文档地图

- [运行控制](runtime-control.md)：Feature Flag、Override 与 Runtime Config。
- [客户端与产品范围治理](client-governance.md)：App Version、Announcement、Region。
- [领域与基础设施边界](boundaries.md)：Platform 与业务 Domain、Operations、Shared Infrastructure 的职责分工。
- [数据设计](database.md)：6 张业务表的完整数据库设计。
