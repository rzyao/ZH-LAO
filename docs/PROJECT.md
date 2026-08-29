# ZH-LAO 项目知识入口

**项目：** 中文–老挝语综合学习与跨语言社交应用  
**整体阶段：** `designing`  
**首期目标：** Android，中老用户同时上线，不以中国大陆应用商店为主要发行渠道；约 10,000 注册用户，核心指标为注册量和 DAU/MAU。

## 当前设计基线

- 产品是双边平台：学习负责获客与留存，社交负责关系，商业化主要围绕社交效率和虚拟礼物。
- 后端采用模块化单体；一个 PostgreSQL 实例、一个主库、十个业务 Schema。
- 一级域：Identity、Learning、Social、Community、Messaging、Commerce、Rewards、Trust & Safety、Operations、Platform。
- Chat 与社交关系解耦：会话身份由用户对唯一确定，取消关注或重新互关不改变会话。
- 实时推送不独立成域：Chat 发布领域事件，WebSocket/App Push 由基础设施负责。
- 代码定义能力，Feature Flag 决定开放，运营配置决定规则。

## 文档地图

- [领域文档入口](docs/domains/README.md)
- [Messaging（Chat）域](docs/domains/messaging/README.md)
- [产品定位与范围](docs/product/product-overview.md)
- [业务与商业模型](docs/product/business-model.md)
- [功能开放与产品规则](docs/product/feature-rollout.md)
- [总体架构](docs/architecture/overview.md)
- [Domain Map](docs/architecture/domain-map.md)
- [PostgreSQL 总规范](docs/architecture/database.md)
- [设计台账](docs/governance/design-register.md)
- [未决事项](docs/governance/open-questions.md)
- [会话覆盖清单](docs/governance/source-coverage.md)
- [ADR 索引](docs/adr/README.md)

## 领域成熟度

| 领域 | 业务模型 | 数据库 |
| --- | --- | --- |
| Identity | `frozen` | `frozen`：7 张表；部分辅助表字段类型仍按字段级 `designing` 标注 |
| Learning | `frozen` | 43 张必建表与核心字段规格 `frozen`；跨域 Media FK、发布机制和运营参数局部 `designing` |
| Social | `frozen` | 20 张首期表；资料、偏好、发现和关系字段 `frozen`，公开内容字段局部 `designing` |
| Community | `deferred` | 首期动态事实已归 Social；独立社区能力延期 |
| Messaging | `frozen` | 7 张表定稿 `frozen`；表名前缀、枚举类型、主键生成方式待主会话裁决，用例字段契约 `designing` |
| Commerce | `baseline` | `designing` |
| Rewards | `baseline` | `designing` |
| Trust & Safety | `baseline` | `designing` |
| Operations | `baseline` | `designing` |
| Platform | `baseline` | `designing` |

## 状态说明

`baseline` 当前基线；`frozen` 已冻结；`designing` 尚缺实现决策；`deferred` 明确延期；`illustrative` 仅为示例；`superseded` 已被后续结论取代。详细规则见 [AGENTS.md](AGENTS.md)。
