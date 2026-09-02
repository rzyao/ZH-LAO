---
status: frozen
last_updated: 2026-08-31
schema: chat
---

# Chat 域

Chat Domain 负责**会话与消息本身**：会话身份、成员关系、用户侧会话状态、消息顺序、消息内容与消息生命周期。

它不拥有社交关系、用户资料、媒体文件、资金交易，也不负责推送或 WebSocket 传输。

## 领域定位

```text
Social Domain
     │
     │  决定当前是否允许发起 / 继续聊天
     ▼
Chat Domain
     │
     ├─ Conversation
     ├─ Message
     └─ User Conversation State
```

- Social 表达**为什么两个人当前可以聊天**；Chat 表达**聊天产生的会话与消息事实**。
- Social 关系变化不改变既有 Conversation 的身份，也不删除历史消息。
- Commerce 拥有礼物与资金事实；当前 Chat 模型不包含礼物消息或礼物交易副本。
- Trust & Safety 可以治理聊天对象，但治理案件与处罚事实不归 Chat。

## 职责与非职责

| Chat 负责 | Chat 不负责 |
| --- | --- |
| 会话实体与稳定会话身份 | Follow / Match / Block 等社交关系事实 |
| Direct Conversation 的成员约束 | 用户头像、昵称、资料 |
| 会话成员与已读游标 | 资产文件存储、URL、转码、缩略图 |
| 用户个人的置顶、免打扰、隐藏、清空状态 | 礼物定价、扣款、钱包、支付、退款 |
| 消息身份、会话内顺序与生命周期 | 推送通道、WebSocket 连接管理 |
| 文本内容与图片 `asset_id` 引用 | 翻译结果或语言知识事实 |
| 撤回事实及审核所需原始内容保留 | Moderation Case / Enforcement Action |
| 事务提交后的领域事件 | 独立 Notification 业务域 |

## 核心模型

Chat V1 固定 7 张业务表：

| 子模型 | 表 | 说明 |
| --- | --- | --- |
| Conversation | `chat_conversation` | 会话主体与会话级水位 |
| Conversation | `chat_direct_conversation` | 两个用户之间唯一 Direct Conversation |
| Conversation | `chat_conversation_member` | 会话成员与已读游标 |
| Conversation | `chat_conversation_user_state` | 用户个人的置顶、免打扰、隐藏、清空状态 |
| Message | `chat_message` | 消息主体、顺序与生命周期 |
| Message | `chat_message_text` | 文本消息内容 |
| Message | `chat_message_image` | 图片消息的资产引用 |

字段、约束与索引见[数据设计](database.md)。

## 核心业务规则

1. **Conversation 与 Social relationship 解耦。** Chat 不保存 `match_id`、`follow_id` 或 relationship status；发送时通过公共授权能力判断当前是否允许聊天。
2. **同一用户对全生命周期只有一个 Direct Conversation。** `UNIQUE(user_low_id, user_high_id)` 保证业务唯一性。
3. **Direct Conversation 成员集合恒定。** Direct 会话只能通过正式创建入口建立，不能任意增删成员。
4. **共享状态与个人状态分离。** 置顶、免打扰、隐藏、清空只属于单个用户，不修改共享 Conversation。
5. **消息严格按 `seq` 排序。** `created_at` 不承担会话内严格顺序。
6. **发送消息是单事务。** 分配 `seq`、写 Message、写 subtype、推进 Conversation 水位、推进发送者已读、恢复发送者隐藏状态必须原子完成。
7. **已读使用游标，不建逐消息 Receipt。** `last_read_seq` 是已读真相，未读数量由它派生。
8. **清空历史不删除消息。** 只推进 `cleared_before_seq`，改变该用户的可见起点。
9. **隐藏不等于已读。** 新消息或用户再次主动发送时可以恢复隐藏状态。
10. **撤回不删除原始消息。** Message 进入撤回状态，原 subtype 内容继续保留用于治理、纠纷和审计。
11. **空 Conversation 不进入聊天列表。** 没有 `last_message_id` 的会话不作为正常聊天列表项展示。

## 与其他领域协作

| 协作方 | Chat 的处理 |
| --- | --- |
| Identity | 保存用户稳定 logical UUID，不复制用户主体 |
| Social | 发送前消费聊天资格 / `canChat` 能力，不复制关系状态 |
| Media / Asset Infrastructure | 图片只保存 `asset_id` logical UUID；不复制物理文件事实 |
| Trust & Safety | 保留可治理的消息事实；治理案件与处罚归 Trust |
| Commerce | 当前无礼物消息 canonical 模型；未来只消费已完成交易结果，不拥有交易事实 |
| Infrastructure | 可靠事件使用共享 Outbox；传输与连接机制不进入 Chat 业务模型 |

跨 Domain 引用一律使用稳定 logical/public UUID，不建立跨域 physical FK。

## 主要应用用例

```text
getOrCreateDirectConversation
listConversations
sendTextMessage
sendImageMessage
listMessages
markConversationRead
recallMessage
hideConversation
clearConversationHistory
pinConversation
muteConversation
```

用例行为、公共授权边界和事件契约见[应用服务与事件](application-and-events.md)。

## 当前明确不包含

以下能力不属于当前 7 表模型：

- 礼物消息 / `sendGiftMessage()`；
- 逐消息已读或送达回执；
- 单条消息“仅自己删除”；
- 消息 Reaction；
- 消息翻译；
- Voice Message；
- 群聊。

未来增加这些能力时应作为明确的新设计扩展，不应通过修改现有事实含义来暗中兼容。

## 文档地图

- [会话](conversation.md)：Conversation、Direct Conversation、Member、User State 与列表查询模型。
- [消息](message.md)：Message、Text、Image、`seq`、幂等、撤回与发送事务。
- [应用服务与事件](application-and-events.md)：应用用例、聊天资格边界、领域事件与 Outbox。
- [数据设计](database.md)：7 张表、约束、索引与数据库不变量。
