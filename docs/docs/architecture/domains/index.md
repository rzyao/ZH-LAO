---
status: baseline
last_updated: 2026-08-31
---

# 领域边界

本页只回答两个问题：**每个领域拥有什么事实，以及明确不拥有什么事实。**

详细业务语义、字段、状态机和 API 契约应进入各领域文档，不在架构页重复展开。

## 正式领域

| 领域 | 拥有的核心事实 | 明确不负责 |
| --- | --- | --- |
| 身份（Identity） | 用户根、登录身份、基础资料、Locale、学习方向、OTP、Session、Device、账号状态 | 社交资料、真人认证、学习进度、聊天、商品与支付 |
| 内容（Content） | 中文/老挝语 canonical 教学内容、课程体系、Lesson、词汇、句子、练习定义、标准答案、标准发音要求、内容版本与发布状态 | 用户学习进度与掌握事实、业务音频生产 |
| 学习（Learning） | 用户 × Content 的学习进度、完成、掌握、复习、作答、学习活动与统计、用户即时翻译请求事实 | canonical 教学内容本身、社交关系、业务音频生产 |
| 音频生产（Audio Production） | 业务音频生产 Slot、Task、生成尝试、业务音频版本、审核、批量生产与生产审计 | 通用媒体文件存储、TTS Provider/Model 自身管理、教学内容本身、聊天语音消息 |
| 社交（Social） | 社交资料、照片、偏好、发现、Follow、Match、Block、公开动态、点赞、评论、Feed、举报入口 | 消息正文、礼物交易、平台审核历史、媒体文件存储 |
| 聊天（Chat） | 会话、成员、用户侧会话状态、消息身份与顺序、文本/图片消息业务事实、聊天领域事件 | 媒体文件存储与 URL、礼物资产变化、推送/WebSocket 传输、社交关系事实 |
| 商业（Commerce） | 商品、价格、订单、支付、退款、礼物、钱包与账本；会员/权益仍属于 Commerce 业务边界 | 奖励决策、社交关系、聊天消息 |
| 奖励（Rewards） | 奖励计划、规则、可信事件消费、奖励决定（Grant）与幂等交付编排 | 钱包/余额/账本、订单、支付、退款、礼物交易 |
| 信任与安全（Trust & Safety） | 举报 canonical fact、审核案件、证据、审核决定、平台处罚/限制、申诉、真人认证业务边界 | 用户主动 Block 关系、业务对象正文、业务对象本身的 canonical 状态 |
| 运营（Operations） | 后台 Operator、Role、Permission、RBAC、后台操作审计 | 用户认证凭据、业务对象所有权、业务领域状态机、Feature Flag / Runtime Config |
| 平台（Platform） | Feature Flag、覆盖规则、真正跨域的运行配置、客户端版本策略、平台公告、支持地区 | 用户账号、后台 Operator、业务规则、审核事实、发布包与部署实现 |

## 共享基础设施不是业务领域

以下能力属于共享 Application / Infrastructure，不计入 11 个正式业务领域：

```text
infrastructure.assets
infrastructure.system_outbox_events
数据库连接与事务基础设施
Worker / Polling Job
日志 / Request ID / Error 基础设施
对象存储 Port / 外部 Provider Adapter
```

共享基础设施可以支撑多个领域，但不得因此拥有这些领域的业务事实。

## 核心边界规则

### Content 与 Learning

```text
Content  = 用户学什么
Learning = 用户学得怎么样
```

判断一个事实属于哪边时：

- 没有任何用户仍然存在的教学定义，归 Content；
- 用户开始学习后才产生的学习状态或行为事实，归 Learning。

Learning 依赖 Identity 与 Content，但不复制 Content canonical fact。

### Social 与 Trust & Safety

```text
social_blocks
= 用户主动产生的社交关系事实

trust.enforcement_actions
= 平台治理处罚事实
```

二者职责不同，不合并。

Social 可以提供举报入口，但全系统 canonical user report fact 归 `trust.reports`。

### Chat 与 Social

Social 的关系事实可以决定“当前是否允许发起/继续聊天”，但 Chat 自己拥有会话和消息事实。

Chat 不保存 `match_id`、`follow_id` 或关系状态作为第二事实源。

### Rewards 与 Commerce

Rewards 决定“应该发什么奖励”，Commerce 拥有 Coin/钱包/账本等资产到账事实。

```text
Reward Event
→ Reward Rule
→ Reward Grant
→ Reward Delivery
→ Commerce Wallet / Asset Fact
```

### Operations 与业务领域

Operations 负责后台身份解析、RBAC 与操作审计，但不能通过自己的 repository 直接修改其他业务领域 Schema。

后台业务操作仍然必须进入事实拥有者的 Application Service。

### Platform 与业务配置

Platform 只拥有真正跨域的产品运行控制；明确属于某个业务领域的规则与配置，仍归该领域。

## 领域文档入口

详细设计见 [领域设计入口](../../domains/)。

领域之间如何同步调用、发布事件和传递逻辑标识，见 [领域依赖与协作](dependencies.md)。
