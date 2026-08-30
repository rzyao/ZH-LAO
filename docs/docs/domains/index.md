# 领域设计入口

ZH-LAO 当前共 **11 个正式业务 Domain**，对应 11 个 PostgreSQL 业务 Schema（`identity` / `content` / `learning` / `social` / `chat` / `audio` / `commerce` / `rewards` / `trust` / `operations` / `platform`）。

| Domain | 模型状态 | 数据库状态 | 文档 |
| --- | --- | --- | --- |
| Identity | `frozen` | `frozen` / 辅助字段局部 `designing` | [Identity](identity/index.md) |
| Content | `frozen` | 31 张表逐表归属已裁决（D-150，`frozen`）：canonical 教学内容定义（Knowledge/Curriculum/Dictionary/Practice 定义、Content Revision、canonical 教学翻译 D-151）；权威清单见 [Content 数据库](content/database.md) | [Content](content/index.md) |
| Learning | `frozen` | 10 张表逐表归属已裁决（D-150，`frozen`）：用户学习状态与事实（Progress/Mastery/Review/Activity、作答历史、用户即时翻译请求 D-151）；跨域引用统一 logical UUID | [Learning](learning/index.md) |
| Social | `frozen` | 19 张首期表（原 20 张，`social_reports` 已删除、举报归 `trust.reports`，D-115）；公开内容字段局部 `designing` | [Social](social/index.md) |
| Chat | `frozen` | 7 张表 `frozen`；物理 DDL（跨域用户 FK、Media FK、`public_id` 生成算法、Outbox 物理表）`designing`，用例字段契约 `designing` | [Chat](chat/index.md) |
| Audio Production | `frozen` | 9 张业务表（slots/tasks/generation_attempts/asset_versions/reviews/task_events/task_batches/task_batch_items/default_presets）字段级 `frozen`（D-139~D-144，ADR-020）；canonical 内容/规范发音归 Content（D-148）；`audio_asset_versions` 只存 `asset_id` logical UUID 引用 Media/Asset Infrastructure（D-152）；operator 引用统一 UUID（D-153） | [Audio](audio/index.md) |
| Commerce | `frozen`（V1） | 16 张业务表 `frozen`；物理约定（UUID 主键 + 跨域只存 logical UUID 不建物理 FK）符合全局最终版 ADR-018，compliant；会员/Subscription/Entitlement 落表 `deferred` | [Commerce](commerce/index.md) |
| Rewards | `frozen` | 5 张表（programs/rules/events/grants/deliveries）`frozen`；项目级 Outbox 统一、Manual Grant、非 Coin 资产延后 | [Rewards](rewards/index.md) |
| Trust & Safety | `frozen`（治理链路 6 表） | 6 表逻辑模型 `frozen`（本会话定稿）；`uuid` 主键 + 跨域只存 logical UUID 不建物理 FK 符合全局最终版 ADR-018，compliant（D-092）；真人认证 `designing` | [Trust & Safety](trust/index.md) |
| Operations | `frozen` | 5 张表（operators/roles/operator_roles/role_permissions/operator_audit_logs）字段级 `frozen`；全部 ID 统一 UUID（D-153，取代早期 `varchar(20)` 方案）；后台认证机制归 Identity/Auth 未设计 | [Operations](operations/index.md) |
| Platform | `frozen` | 6 张业务表字段级 `frozen`（全域审计最终修正版）；`runtime_configs` 仅 current-state；Media/Asset Infrastructure（物理文件事实唯一 canonical owner，D-152）与 `system_outbox_events` 物理细节 `designing` | [Platform](platform/index.md) |

**历史归档**：[Community](community/index.md) 已正式并入 Social（全局最终版 [ADR-018](../adr/ADR-018-global-database-design-principles-final.md)），不再是独立 Domain、不再拥有独立 Schema，其文档仅作为迁移记录保留。

领域之间的完整关系见 [Domain Map](../architecture/domain-map.md)。实体名称是业务基线，不意味着已决定同名数据库表。
