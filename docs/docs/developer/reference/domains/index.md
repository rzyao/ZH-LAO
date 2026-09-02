---
status: active
last_updated: 2026-09-02
---

# 领域设计入口

ZH-LAO 当前有 **11 个正式业务领域**。

本页只作为领域文档入口，不重复维护开发进度、Gate、表数量或阶段状态；这些信息统一放在开发进度体系中。

领域文档的目录、侧边栏与中文显示规则遵循 [文档系统与领域文档规范](/developer/reference/governance/DOMAIN_DOCUMENT_STANDARD.md)。

## Domain Capability 与 Product Feature

领域和功能不是父子目录，而是二维关系：

```text
Domain Capability
= 某个领域稳定拥有的业务能力

Product Feature
= 用户或运营人员能够完成的端到端能力
```

一个领域可以参与多个 Feature；一个 Feature 也可以跨多个领域。详细规则见 [领域能力与产品功能关系模型](FEATURE_RELATIONSHIP_MODEL.md)。

## 领域地图

| 领域 | 核心职责 | 已建立的产品功能 | 文档 |
| --- | --- | --- | --- |
| 身份（Identity） | 用户根、认证、Session、Device、基础资料与账号状态 | [登录与会话（主要）](/developer/features/login) | [身份领域](identity/) |
| 内容（Content） | Canonical 教学内容、课程、词汇、句子、练习定义与内容版本 | [音频生产（参与）](/developer/features/audio-production) | [内容领域](content/) |
| 学习（Learning） | 用户学习进度、掌握、复习、作答、活动与统计事实 | — | [学习领域](learning/) |
| 音频生产（Audio Production） | 业务音频生产、版本、审核、重试、批量生产与生产审计 | [音频生产（主要）](/developer/features/audio-production) | [音频生产领域](audio/) |
| 社交（Social） | 社交资料、发现、Follow、Match、Block、动态、点赞、评论与 Feed | — | [社交领域](social/) |
| 聊天（Chat） | 会话、成员、消息、用户侧会话状态与聊天业务事件 | — | [聊天领域](chat/) |
| 商业（Commerce） | 商品、价格、订单、支付、退款、礼物、钱包与资产账本 | — | [商业领域](commerce/) |
| 奖励（Rewards） | 奖励计划、规则、事件、Grant 与幂等交付编排 | — | [奖励领域](rewards/) |
| 信任与安全（Trust & Safety） | 举报、审核、证据、处罚、限制、申诉与真人认证业务边界 | — | [信任与安全领域](trust/) |
| 运营（Operations） | 后台 Operator、RBAC、角色权限与后台操作审计 | [音频生产（参与）](/developer/features/audio-production) | [运营领域](operations/) |
| 平台（Platform） | Feature Flag、Runtime Config、App Version、公告与支持地区 | — | [平台领域](platform/) |

`—` 表示当前还没有建立正式 Feature 文档，不表示该领域未来没有产品功能，也不为了导航完整提前创建占位 Feature。

架构层的领域所有权见 [领域边界](/developer/reference/architecture/domains/)，跨领域调用和事件方向见 [领域依赖与协作](/developer/reference/architecture/domains/dependencies.md)。

> Community 已并入 Social，不再作为正式领域或独立 Schema 存在。该历史决策由 ADR 保留，不再保留单独的 Community 领域页面。
