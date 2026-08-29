# ZH-LAO 项目知识入口

**项目：** 中文–老挝语综合学习与跨语言社交应用  
**整体阶段：** `designing`  
**首期目标：** Android，中老用户同时上线，不以中国大陆应用商店为主要发行渠道；约 10,000 注册用户，核心指标为注册量和 DAU/MAU。

## 当前设计基线

- 产品是双边平台：学习负责获客与留存，社交负责关系，商业化主要围绕社交效率和虚拟礼物。
- 后端采用模块化单体；一个 PostgreSQL 实例、一个主库、九个业务 Schema（无 community Schema；Platform Infrastructure 含 outbox/asset 不计入业务 Schema）。
- 一级域（9 个业务域）：Identity、Learning、Social、Chat、Commerce、Rewards、Trust & Safety、Operations、Platform；Community 能力已并入 Social，Notification 不作为独立域（全局最终版 ADR-018）。
- Chat 与社交关系解耦：会话身份由用户对唯一确定，取消关注或重新互关不改变会话。
- 实时推送不独立成域：Chat 发布领域事件，WebSocket/App Push 由基础设施负责。
- Commerce 独占「钱与虚拟资产」事实，采用虚拟币钱包 + 只追加账本；Social/Chat 不处理资金，Chat 送礼只展示。
- 代码定义能力，Feature Flag 决定开放，运营配置决定规则。
- Rewards 只做奖励决定与幂等发放编排（V1：奖励计划/规则版本/可信事件/奖励决定/发放，5 张表），资产入账由 Commerce 执行；三层职责：源域定事实、Rewards 定奖励、Commerce 执行。跨域引用统一 `uuid` logical reference、不建独立 Outbox（统一 `system_outbox_events`）。
- Operations 是后台控制平面：只负责后台运营主体 + RBAC 后台授权 + 后台操作审计（V1：operators/roles/operator_roles/role_permissions/operator_audit_logs，5 张表）；权限能力由代码 Registry 定义、数据库只配置角色权限关系；不承接任何业务域状态机；后台认证（登录/Session/MFA）归 Identity/Auth。
- Platform 是产品运行控制面（Product Runtime Control Plane）：V1 固定 6 张业务表（feature_flags/feature_flag_overrides/runtime_configs/app_versions/announcements/regions）；能明确归属业务域的配置一律回该域；`runtime_configs` 仅 current-state（无版本/回滚）；`system_outbox_events`（全系统唯一一套）与 Media/Asset 属共享技术基础设施，不计入六表；其他域不建指向 `platform.regions` 的跨域 FK（跨域用 `region_code` 逻辑引用）。

## 文档地图

- [领域文档入口](docs/domains/index.md)
- [Chat 域](docs/domains/chat/index.md)
- [Commerce 域](docs/domains/commerce/index.md)
- [Operations 域](docs/domains/operations/index.md)
- [Platform 域](docs/domains/platform/index.md)
- [产品定位与范围](docs/product/product-overview.md)
- [业务与商业模型](docs/product/business-model.md)
- [功能开放与产品规则](docs/product/feature-rollout.md)
- [总体架构](docs/architecture/overview.md)
- [Domain Map](docs/architecture/domain-map.md)
- [PostgreSQL 总规范](docs/architecture/database.md)
- [设计台账](docs/governance/design-register.md)
- [未决事项](docs/governance/open-questions.md)
- [会话覆盖清单](docs/governance/source-coverage.md)
- [ADR 索引](docs/adr/index.md)

## 领域成熟度

| 领域 | 业务模型 | 数据库 |
| --- | --- | --- |
| Identity | `frozen` | `frozen`：7 张表；部分辅助表字段类型仍按字段级 `designing` 标注 |
| Learning | `frozen` | 43 张必建表与核心字段规格 `frozen`；跨域 Media FK、发布机制和运营参数局部 `designing` |
| Social | `frozen` | 19 张首期表（原 20 张，`social_reports` 已删除、举报事实统一归 `trust.reports`，D-115）；资料、偏好、发现和关系字段 `frozen`，公开内容字段局部 `designing` |
| Community | `merged` | 已正式并入 Social（全局最终版 ADR-018），不再独立成域；独立社区能力未来再评估 |
| Chat | `frozen` | 7 张表定稿 `frozen`；物理 DDL（跨域用户 FK、Media FK、`public_id` 生成算法、Outbox 物理表）`designing`，用例字段契约 `designing` |
| Commerce | `frozen`（V1） | 16 张业务表 `frozen`；物理约定（UUID 主键 + 跨域只存 logical UUID 不建物理 FK）符合全局最终版 ADR-018，compliant；会员/Subscription/Entitlement 落表 `deferred` |
| Rewards | `frozen` | `frozen`：5 张表字段级定稿；审计确认跨域引用统一 `uuid` logical reference、Outbox 统一 `system_outbox_events`（D-096）；Manual Grant、非 Coin 资产延期 |
| Trust & Safety | `frozen`（治理链路 6 表） | 6 表逻辑模型 `frozen`（全域审计最终确认定稿）；`uuid` 主键 + 跨域只存 logical UUID 不建物理 FK 符合全局最终版 ADR-018，compliant（D-092）；`trust.reports` 为全系统唯一举报事实源、subject 三元组、Operations 逻辑 ID、统一 Outbox（D-113~D-117）；真人认证 Verification 子域 `designing` |
| Operations | `frozen` | `frozen`：5 张表（operators/roles/operator_roles/role_permissions/operator_audit_logs）字段级定稿；稳定 ID 用 `varchar(20)` 与全局跨域 logical UUID 口径差异待主会话裁决（`designing`）；后台认证机制归 Identity/Auth 未设计 |
| Platform | `frozen` | `frozen`：6 张业务表（feature_flags/feature_flag_overrides/runtime_configs/app_versions/announcements/regions）字段级定稿（全域审计最终修正版，D-118~D-129）；`runtime_configs` 仅 current-state；Media/Asset Infrastructure 与 `system_outbox_events` 物理细节 `designing` |

## 状态说明

`baseline` 当前基线；`frozen` 已冻结；`designing` 尚缺实现决策；`deferred` 明确延期；`illustrative` 仅为示例；`superseded` 已被后续结论取代。详细规则见 [AGENTS.md](AGENTS.md)。
