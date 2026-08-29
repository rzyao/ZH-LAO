---
status: frozen
last_updated: 2026-08-30
schema: messaging
source: 设计聊天领域
source_conversation_id: 6a9329e5-9f28-83ea-8eb1-f85be6e414fa
---

# Messaging 域

Messaging（Chat Domain）负责**会话与消息本身**。它不维护社交关系，不持有媒体文件，不记账，也不实现推送通道。

来源：ChatGPT 会话「设计聊天领域」。会话结束时主架构方已明确「Chat Domain 第一阶段所有表正式定稿，原则上不再改核心结构」。

## 领域定位

```text
Social Domain
     │
     │  授予聊天权限（can chat）
     ▼
Chat / Messaging Domain       ← 只负责会话与消息
     ▲
     │  引用已完成的送礼结果
Commerce Domain
```

- Social 表达**为什么两个人可以聊天**；Chat 表达**他们聊天产生的数据容器**。二者生命周期不同。
- 匹配成功、取消关注、重新互关都不改变会话身份；历史聊天记录仍然存在。
- Commerce 负责礼物商品、购买、余额、订单、支付；Chat 只消费已完成的送礼结果。
- 审核、举报、封禁可以作用于聊天，但完整 Moderation 逻辑不属于 Chat。

## 职责与非职责

| 负责 | 明确不负责 |
| --- | --- |
| 会话实体与会话身份 | 社交关系、Follow、Match 状态机 |
| 会话成员与成员已读游标 | 用户头像、昵称、资料（属 Social/Profile 查询模型） |
| 消息身份、会话内顺序、消息生命周期 | 媒体文件存储、URL、转码、缩略图（属 Platform Media） |
| 文本内容、图片资源引用 | 礼物定价、扣款、余额、退款（属 Commerce） |
| 用户侧会话状态：置顶、免打扰、隐藏、清空 | 推送通道、WebSocket 传输实现（属 Application/Infrastructure） |
| 撤回事实与撤回审计所需原始数据 | 翻译结果存储（属 Learning/Translation 能力） |
| 事务提交后发布聊天领域事件 | 新增独立的 Notification 域（主会话明确否决） |

## 子域、实体与表

| 子域 | 实体 | 定稿表 | 规格 |
| --- | --- | --- | --- |
| Conversation | Conversation | `chat_conversation` | [会话模型](conversation.md) |
| Conversation | DirectConversation | `chat_direct_conversation` | [会话模型](conversation.md) |
| Conversation | ConversationMember | `chat_conversation_member` | [会话模型](conversation.md) |
| Conversation | ConversationUserState | `chat_conversation_user_state` | [会话模型](conversation.md) |
| Message | Message | `chat_message` | [消息模型](message.md) |
| Message | TextMessage | `chat_message_text` | [消息模型](message.md) |
| Message | ImageMessage | `chat_message_image` | [消息模型](message.md) |

第一阶段共 **7 张表**，由[数据库总览](database.md)维护完整 DDL。

## 业务规则定稿

1. **Chat Conversation 与 Social Match 解耦。** Chat 不存 `match_id`、`follow_id`、relationship status；发送时通过业务策略判断权限。
2. **同一对用户全生命周期只有一个 Direct Conversation。** 由 `UNIQUE(user_low_id, user_high_id)` 在数据库层保证，不依赖应用层先查后插。
3. **共享会话状态与用户个人会话状态分离。** 置顶、免打扰、隐藏、清空都不写入共享实体。
4. **消息永久按 `seq` 排序**，不依赖 `created_at` 做严格顺序。
5. **消息发送必须事务化**：分配 seq、插入消息主体、插入内容、更新会话水位、推进发送者已读、恢复隐藏状态，一个事务完成。
6. **已读不用 Receipt 表**：`last_read_seq` 游标即为真相，未读数是派生值。
7. **清空记录不删除 Message**，只移动 `cleared_before_seq` 可见起点。
8. **隐藏会话不代表已读**；收到新消息或用户主动再次发送时恢复 `hidden_at = NULL`。
9. **撤回不删除原消息**：只改 `status` 与 `recalled_at`，原始 subtype 内容保留供审核与纠纷处理。
10. **空 conversation 不进入聊天列表**：`last_message_id IS NULL` 的会话不展示。

## 与其他域的协作

| 协作方 | 方向 | 内容 |
| --- | --- | --- |
| Identity | Chat ← Identity | 直接引用全局用户主体 ID；不另建 `chat_user`/`chat_profile` |
| Social | Chat ← Social | 发送前调用聊天权限策略；Social 关系变化不写 Chat 表 |
| Platform Media | Chat → Media | `asset_id` 引用统一媒体资源；Chat 不存 URL、宽高、MIME |
| Commerce | Chat ← Commerce | 未来礼物消息只引用已完成的送礼交易，不承载交易真相 |
| Trust & Safety | Chat → T&S | 撤回、REMOVED 等强制处置保留原始数据供审计；完整案件属 T&S |
| Platform / Infra | Chat → 基础设施 | 领域事件由 Outbox 可靠投递；推送与 WebSocket 不属于业务域 |

## 应用服务用例

主会话在定稿后给出的用例清单（字段级规格见[应用服务与事件](application-and-events.md)）：

```text
getOrCreateDirectConversation   sendTextMessage      sendImageMessage
listConversations               listMessages         markConversationRead
recallMessage                   hideConversation     clearConversationHistory
pinConversation                 muteConversation
```

用例的数据库规格与字段契约尚未在主会话逐项展开，状态为 `designing`；本页只固化用例清单与已确定的事务边界。

## 状态

| 层面 | 状态 |
| --- | --- |
| 领域边界与业务模型 | `frozen` |
| 7 张核心表的字段、类型、约束、索引 | `frozen` |
| 表名前缀、枚举类型、主键生成方式与全局规范的差异 | `designing`（见[数据库总览](database.md)「与全局 SQL 规范的差异」一节） |
| 应用服务用例与事件的字段级规格 | `designing` |
| 语音消息、翻译、礼物、群聊 | `deferred` |

## 文档地图

- [会话模型](conversation.md)：Conversation、Direct、Member、UserState 与聊天列表查询模型。
- [消息模型](message.md)：Message、Text、Image、`seq`、幂等、撤回与发送事务。
- [应用服务与事件](application-and-events.md)：用例清单、领域事件与 Outbox 边界。
- [数据库总览](database.md)：完整 DDL、索引意图、明确不建的表、全局规范差异。
