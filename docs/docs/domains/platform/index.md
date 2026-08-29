---
status: frozen
last_updated: 2026-08-30
revision: "2026-08-30 设计 Platform Domain 会话定稿：6 张业务表最终审计修正版"
source_share_url: https://chatgpt.com/share/6a9351eb-de4c-83e9-80fe-18dba4fd6eda
---

# Platform 域

Platform Domain 是**负责整个产品运行过程中，与具体业务领域无关的横向产品控制能力**，即：

> **Product Runtime Control Plane（产品运行控制面）**

它解决的不是“用户做了什么业务”，而是：某个功能当前是否开放；某个客户端版本是否还能使用；产品当前支持哪些国家/地区；是否向用户展示全局公告；某些真正跨业务域的运行参数是什么。

它不是后台运营域（那是 [Operations](../operations/index.md)），不是“公共表集合”，也不是万能配置中心。

## 子模块与表（V1 冻结为 5 类能力 / 6 张表）

| 子模块 | 职责 | 表 |
| --- | --- | --- |
| Feature Flags | 产品功能开启、关闭、灰度（定义 + 范围覆盖） | `platform.feature_flags`、`platform.feature_flag_overrides` |
| Runtime Config | 真正跨领域的运行时产品参数（仅 current state） | `platform.runtime_configs` |
| App Versions | 客户端版本生命周期与升级要求 | `platform.app_versions` |
| Announcements | 全局/范围型系统公告 | `platform.announcements` |
| Regions | 产品支持地区及基础区域配置 | `platform.regions` |

**5 个能力 ≠ 5 张表**：Feature Flag 拆为定义表与覆盖表。字段、约束、索引与 DDL 见[数据库总览](database.md)。

## 明确不能放进 Platform 的东西

| 域 | 不归 Platform 的内容 |
| --- | --- |
| Identity | 用户账号、登录、用户状态、角色、权限、封禁；Feature Flag 涉及用户时也只能逻辑引用身份 |
| Social | 社交资料开关、Match/Follow 状态、发现偏好、社交可见性（“用户是否暂停被推荐”归 Social；“整个产品是否开放发现”才是 Platform Flag） |
| Chat | 聊天开关状态、会话状态、消息限制、禁言状态（“新聊天 UI 是否灰度开放”才是 Platform Flag） |
| Commerce | `gift_price`、`exchange_rate`、`product_price`、`payment_limit`、`refund_rule`、`wallet_rule` 等，不得借 `platform.runtime_configs` 绕过 Commerce 边界 |
| Rewards | `reward_amount`、`reward_rule`、`reward_limit`、`campaign_reward` 等，不因“可配置”而塞进 Platform |
| Trust & Safety | 举报规则、封禁策略、审核结果、moderation、risk decision、block/restriction、处罚记录（即使表现为数字阈值） |
| Operations | “谁在后台进行了什么运营操作”归 Operations；Platform 只保存“产品当前运行成什么状态”。运营人员发布公告/关闭 Flag：状态变化落在 `platform.*`，操作者、后台权限与操作审计落在 `operations.*`，两边不合并 |

## 核心领域规则（摘要）

1. **P1** Platform 只拥有跨业务领域的产品运行控制数据。
2. **P2** 任何可以明确归属某个业务域的配置都必须回到对应 Domain：`Business Rule ≠ Platform Config`。这是整个 Platform 最重要的原则。
3. **P3** Operations 可以管理 Platform，但不能拥有 Platform 数据（Operations = actor/workflow/audit；Platform = resulting product runtime state）。
4. **P4** Platform 可以引用其他 Domain 的 ID，但不能修改其他 Domain 的状态。
5. **P5** Feature Flag 不得代替正常领域状态机（错误：`user_123_is_banned = true`；正确：`trust.*` 状态）。
6. **P6** Runtime Config 不得成为跨域业务规则仓库。
7. **P7** App Version 只描述客户端兼容与升级策略，不承担部署系统职责。
8. **P8** Announcement 是平台广播信息，不演化成 Messaging / Notification / Marketing Campaign。
9. **P9** Region 是产品支持范围，不建设完整 GIS / 行政区划系统。

完整 17 条最终不可违反规则（含全域审计后的删除策略与基础设施边界规则）见[数据库总览](database.md#最终不可违反规则)。

## 明确不建的表

不因为 Platform 是最后几个基础域之一就一次覆盖全部基础设施。明确不建：`platform.settings`、`system_settings`、`metadata`、`parameters`、`dictionaries`、`enums`、`audit_logs`、`jobs`、`tasks`、`cron_jobs`、`events`、`notifications`、`logs`、`files`。特别是 `system_settings` 这类万能表被禁止——宁愿后来发现稳定新能力再单独建表，也不提前制造无边界的配置中心。后台操作审计由 `operations.operator_audit_logs` 承担。

## Platform Domain ≠ Platform Infrastructure

- **Platform Domain**：产品当前应该如何运行（上述 6 张业务表）。
- **Platform Infrastructure**：软件系统如何可靠地执行、存储、发布和传递这些业务状态，包括 Transactional Outbox（`system_outbox_events`，全系统唯一一套）、Media / Asset 存储抽象（所有 `asset_id` 的权威技术属主）、技术审计日志、消息投递与存储基础设施。

Infrastructure 不因为服务于整个产品就自动成为 Platform Domain 的业务表；`system_outbox_events` 与 Media / Asset **不计入** Platform 六张业务表。详见[数据库总览](database.md#platform-domain-与-platform-infrastructure-边界)。

## 数据库状态

- 6 张业务表字段级定稿 `frozen`（字段、可空性、默认值、FK/UNIQUE/CHECK/INDEX、状态枚举、删除策略），以“全域审计最终修正版”为权威基线，见[数据库总览](database.md)。
- `designing`：Media / Asset Infrastructure 物理表与生命周期状态枚举；`system_outbox_events` 物理字段；`regions.name` 多语言文本待 Localization 设计。见[未决事项](../../governance/open-questions.md)。
- 旧实体名 FeatureRule、ConfigItem、ConfigVersion、RegionPolicy、VersionPolicy、MediaAsset、Notification、NotificationTemplate、AuditLog 已被六表模型取代（`superseded`）：覆盖规则归 `feature_flag_overrides`；V1 无配置版本模型；Audit 归 Operations；Notification 不建；Media/Asset 归 Infrastructure。
