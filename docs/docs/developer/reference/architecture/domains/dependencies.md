---
status: baseline
last_updated: 2026-08-31
---

# 领域依赖与协作

领域边界决定“谁拥有事实”，本页定义“领域之间如何协作”。

## 总体原则

跨领域协作只有两类正式路径：

1. **同步公共契约**：消费方只依赖提供方的 `public/` contract；
2. **异步领域事件**：业务事实与 Outbox 在同一事务提交，再由 Worker 发布。

禁止的捷径：

```text
跨领域 repository import
跨领域 SQL
跨领域物理 FK
使用对方 internal BIGINT
复制对方 canonical fact 作为本地第二事实源
```

## 主要依赖方向

```text
Identity
  ├─► Learning
  ├─► Social
  ├─► Chat
  ├─► Commerce
  ├─► Trust & Safety
  └─► Operations（认证主体）

Content
  ├─► Learning
  └─► Audio Production

Social
  └─► Chat（聊天资格事实）

Trust & Safety
  ├─► Social（治理限制）
  └─► Chat（治理限制）

Rewards
  └─► Commerce（奖励资产交付）

Platform
  ├─► Clients（Feature Flag / Version / Announcement）
  └─► Domains（真正跨域的 Runtime Control）

Shared Infrastructure
  ├─► All Domains（Outbox / Asset / Transaction 等）
  └─► Applications
```

箭头表达“右侧消费左侧公开事实/能力”，不是数据库 FK，也不是微服务网络调用要求。

## 学习主链

```text
Identity
  ↓
Learning Profile
  ↓
Content
Course → Unit → Lesson → Exercise
  ↓
Learning
Progress → Mastery → Review → Activity
```

Content 拥有 canonical 教学定义，Learning 只保存用户对 Content 的学习事实和 Content logical UUID 引用。

## 社交与聊天主链

```text
Identity
  ↓
Social Profile
  ↓
Follow
  ↓
Mutual Follow / Match
  ↓
聊天资格判断
  ↓
Chat Conversation
  ↓
Message
```

关键约束：

- Match 是 Social 事实；
- Conversation / Message 是 Chat 事实；
- Chat 不复制 Follow / Match 状态；
- 发送消息时可以通过 Social 与 Trust & Safety 的公开契约重新判断当前资格；
- 会话历史不会因为取消关注或解除匹配而改写其身份。

## 举报与治理链

```text
Social / Chat / Commerce / 其他入口
              ↓
         trust.reports
              ↓
      Moderation Case
              ↓
 Evidence → Decision
              ↓
     Enforcement Action
              ↓
业务领域消费治理结果并执行自己的业务约束
```

`trust.reports` 是全系统唯一 canonical user report fact。

Trust & Safety 不直接夺取被治理对象的业务所有权；处罚结果通过公开契约或领域事件被业务领域消费。

## 奖励与资产链

```text
Identity / Content / Learning / Social / 其他可信事实
                    ↓
               Reward Event
                    ↓
                Rule / Grant
                    ↓
                 Delivery
                    ↓
                 Commerce
                    ↓
             Wallet / Ledger
```

Rewards 的 Grant 是奖励决定，不等于最终资产到账事实。

跨领域幂等引用必须使用稳定业务/逻辑标识，不能依赖内部主键。

## 内容与音频生产链

```text
Content
  ├─ canonical 文本/词汇/句子/课程内容
  └─ 标准发音要求
          ↓
Audio Production
Slot → Task → Generation Attempt → Asset Version → Review
          ↓
Shared Asset Infrastructure
          ↓
asset_id
```

Content 不拥有音频生产任务；Audio Production 不拥有通用文件存储元数据。

Audio 通过 `asset_id` logical UUID 引用共享 Asset canonical metadata。

## 后台操作链

```text
Identity Authentication
        ↓
Operations Operator Resolution
        ↓
Operations Exact RBAC
        ↓
Owner Domain Application Service
        ↓
Owner Domain Mutation
        ↓
Operations Audit
```

权限判断和业务状态判断必须分层：Operations 证明“这个后台操作者是否有这个操作权限”，Owner Domain 决定“当前业务对象是否允许发生这个动作”。

## Platform 消费方式

Platform 是 Product Runtime Control Plane，不是所有配置的统一垃圾桶。

```text
Feature Flag / Override
Runtime Config
App Version
Announcement
Region
```

客户端和业务领域可以消费这些公开能力，但业务专属规则仍由业务领域自己拥有。

## 同步与异步选择

优先同步公共契约，当调用方必须立即得到结果才能完成当前事务/请求，例如：

- 查询 Identity 当前账号状态；
- 查询 Social 当前聊天资格；
- Operations 做即时 RBAC 判断。

优先异步领域事件，当消费方可以在事务提交后最终处理，例如：

- 注册后触发下游奖励；
- 业务事实进入统计/异步工作；
- 可靠通知或外部传输。

不要为了“解耦”把必须强一致的业务判断强行异步化，也不要为了“方便”把所有跨领域协作写成跨 Schema SQL。

## 跨领域标识

跨领域、API、Event、Outbox 与客户端只使用稳定 logical/public UUID。

```text
内部 PK
→ 只在所属领域内部使用

Logical/Public UUID
→ 跨领域 / API / Event / Client
```

完整数据规则见 [PostgreSQL 架构规范](../data/postgresql.md)。
