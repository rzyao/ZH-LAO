# 领域设计入口

| Domain | 模型状态 | 数据库状态 | 文档 |
| --- | --- | --- | --- |
| Identity | `frozen` | `frozen` / 辅助字段局部 `designing` | [Identity](identity/README.md) |
| Learning | `frozen` | 43 张必建表 `frozen` / 跨域 Media 与运营细节局部 `designing` | [Learning](learning/README.md) |
| Social | `frozen` | 20 张首期表；公开内容字段局部 `designing` | [Social](social/README.md) |
| Community | `deferred` | `deferred` | [Community](community/README.md) |
| Messaging | `baseline` | `designing` | [Messaging](messaging/README.md) |
| Commerce | `baseline` | `designing` | [Commerce](commerce/README.md) |
| Rewards | `baseline` | `designing` | [Rewards](rewards/README.md) |
| Trust & Safety | `baseline` | `designing` | [Trust & Safety](trust/README.md) |
| Operations | `baseline` | `designing` | [Operations](operations/README.md) |
| Platform | `baseline` | `designing` | [Platform](platform/README.md) |

领域之间的完整关系见 [Domain Map](../architecture/domain-map.md)。实体名称是业务基线，不意味着已决定同名数据库表。
