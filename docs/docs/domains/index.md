# 领域设计入口

| Domain | 模型状态 | 数据库状态 | 文档 |
| --- | --- | --- | --- |
| Identity | `frozen` | `frozen` / 辅助字段局部 `designing` | [Identity](identity/index.md) |
| Content | `frozen`（域边界）/ `designing`（逐表归属） | canonical 教学内容定义类表由原 Learning 43 张必建表按职责迁入（D-147）；字段规格沿用已冻结的 Learning 分层页；逐表归属清单与跨域 `public_id` 落地 `designing` | [Content](content/index.md) |
| Learning | `frozen`（域边界）/ `designing`（逐表归属） | 用户学习状态/行为类表保留或迁入（D-147）；字段规格沿用已冻结的 Learning 分层页；逐表归属清单 `designing`；旧音频表迁移与计数调整（D-145）`designing` | [Learning](learning/index.md) |
| Social | `frozen` | 19 张首期表（原 20 张，`social_reports` 已删除、举报归 `trust.reports`，D-115）；公开内容字段局部 `designing` | [Social](social/index.md) |
| Community | `merged` | 已并入 Social（全局最终版 ADR-018），不再独立成域 | [Community](community/index.md) |
| Chat | `frozen` | 7 张表 `frozen`；物理 DDL（跨域用户 FK、Media FK、`public_id` 生成算法、Outbox 物理表）`designing`，用例字段契约 `designing` | [Chat](chat/index.md) |
| Commerce | `frozen`（V1） | 16 张业务表 `frozen`；物理约定（UUID 主键 + 跨域只存 logical UUID 不建物理 FK）符合全局最终版 ADR-018，compliant；会员/Subscription/Entitlement 落表 `deferred` | [Commerce](commerce/index.md) |
| Rewards | `frozen` | 5 张表（programs/rules/events/grants/deliveries）`frozen`；项目级 Outbox 统一、Manual Grant、非 Coin 资产延后 | [Rewards](rewards/index.md) |
| Trust & Safety | `frozen`（治理链路 6 表） | 6 表逻辑模型 `frozen`（本会话定稿）；`uuid` 主键 + 跨域只存 logical UUID 不建物理 FK 符合全局最终版 ADR-018，compliant（D-092）；真人认证 `designing` | [Trust & Safety](trust/index.md) |
| Operations | `frozen` | 5 张表（operators/roles/operator_roles/role_permissions/operator_audit_logs）字段级 `frozen`；稳定 ID 用 `varchar(20)` 与全局 logical UUID 口径差异待裁决；后台认证机制归 Identity/Auth 未设计 | [Operations](operations/index.md) |
| Platform | `frozen` | 6 张业务表字段级 `frozen`（全域审计最终修正版）；`runtime_configs` 仅 current-state；Media/Asset Infrastructure 与 `system_outbox_events` 物理细节 `designing` | [Platform](platform/index.md) |
| Audio Production | `frozen` | 9 张业务表（slots/tasks/generation_attempts/asset_versions/reviews/task_events/task_batches/task_batch_items/default_presets）字段级 `frozen`（D-139~D-144，ADR-020）；canonical 内容/规范发音归 Content（D-148）；与 Media/Asset Infrastructure 边界衔接（D-146）与旧 Learning 音频表迁移（D-145）`designing` | [Audio](audio/index.md) |

领域之间的完整关系见 [Domain Map](../architecture/domain-map.md)。实体名称是业务基线，不意味着已决定同名数据库表。
