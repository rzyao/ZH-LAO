# 领域设计入口

| Domain | 模型状态 | 数据库状态 | 文档 |
| --- | --- | --- | --- |
| Identity | `frozen` | `frozen` / 辅助字段局部 `designing` | [Identity](identity/index.md) |
| Learning | `frozen` | 43 张必建表 `frozen` / 跨域 Media 与运营细节局部 `designing` | [Learning](learning/index.md) |
| Social | `frozen` | 20 张首期表；公开内容字段局部 `designing` | [Social](social/index.md) |
| Community | `deferred` | `deferred` | [Community](community/index.md) |
| Chat | `frozen` | 7 张表 `frozen`；物理 DDL（跨域用户 FK、Media FK、`public_id` 生成算法、Outbox 物理表）`designing`，用例字段契约 `designing` | [Chat](chat/index.md) |
| Commerce | `frozen`（V1） | 16 张业务表 `frozen`；物理约定（UUID 主键 / 跨域 FK）与全局规范冲突，`designing` 待主会话裁决；会员/Subscription/Entitlement 落表 `deferred` | [Commerce](commerce/index.md) |
| Rewards | `frozen` | 5 张表（programs/rules/events/grants/deliveries）`frozen`；项目级 Outbox 统一、Manual Grant、非 Coin 资产延后 | [Rewards](rewards/index.md) |
| Trust & Safety | `baseline` | 6 表逻辑模型 `baseline`（本会话定稿）；`uuid`/无跨域 FK 与全局规范冲突 `designing`（D-092）；真人认证 `designing` | [Trust & Safety](trust/index.md) |
| Operations | `baseline` | `designing` | [Operations](operations/index.md) |
| Platform | `baseline` | `designing` | [Platform](platform/index.md) |

领域之间的完整关系见 [Domain Map](../architecture/domain-map.md)。实体名称是业务基线，不意味着已决定同名数据库表。
