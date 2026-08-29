---
status: frozen
last_updated: 2026-08-30
schema: chat
source: 设计聊天领域
source_conversation_id: 6a9319c2-2204-83ea-9341-7a57757a3082
source_share_url: https://chatgpt.com/share/6a9329e5-9f28-83ea-8eb1-f85be6e414fa
---

# Chat 域

Chat Domain 负责**会话与消息本身**。它不维护社交关系，不持有媒体文件，不记账，也不实现推送通道。

来源：ChatGPT 会话「设计聊天领域」。会话先以「把 Chat Domain 所有表定稿」收尾（主架构方明确「原则上不再改核心结构」）；随后主架构方又追加「全域审计后的最终修正版」（消息 [64] 指令 + [71] 产出）：`public_id` 定为 UUID、跨域引用统一 logical UUID（无跨域物理 FK）、移除 `last_message` 组合 CHECK、`last_message_id` 补 FK、37 条 application-level invariants。本文档以最终修正版为准。

来源标识说明：`source_conversation_id` 是 ChatGPT 内部会话 ID，与本项目其他会话的记录方式一致；`source_share_url` 是唯一仍可访问的分享副本。以内部会话 ID 直接拼出的分享链接当前返回 `Conversation has been deleted`，不可作为回溯依据。

## 命名裁决

| 层面 | 裁决 |
| --- | --- |
| 业务域名称 | **Chat**（一级域） |
| Schema / 代码 / 模块 | `chat` |
| 表名 | 保留会话定稿的 `chat_*` 单数命名 |
| “Messaging” | **已废弃**，不再作为域、Schema、目录或文档标题 |

此前存在的 `messaging` Schema + `chat_*` 表名的双命名体系已废止。表名仍为单数且带前缀，这与[全局规范](../../architecture/database.md)的「复数」要求不同，已登记为**正式例外**：Chat 是会话逐表定稿的域，表名与其会话结论逐字保持一致，且 `chat` 前缀与 Schema 名一致，不存在语义冲突。

## 领域定位

```text
Social Domain
     │
     │  授予聊天权限（canChat）
     ▼
Chat Domain                    ← 只负责会话与消息
     ▲
     │  礼物交易真相（deferred，不进 Chat 当前模型）
Commerce Domain
```

- Social 表达**为什么两个人可以聊天**；Chat 表达**他们聊天产生的数据容器**。二者生命周期不同。
- 匹配成功、取消关注、重新互关都不改变会话身份；历史聊天记录仍然存在。
- Commerce 拥有礼物商品、购买、余额、订单与支付。**礼物与 Chat 的集成属 `deferred`**，本域当前不存在任何礼物相关实体、消息类型或用例。
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
| 事务提交后发布聊天领域事件 | 新增独立的 Notification 域（主方案明确否决） |
| — | 礼物消息、礼物交易引用（`deferred`） |

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

第一阶段共 **7 张表**，由[数据库总览](database.md)维护 DDL。

**当前不存在** `MessageReceipt`、`MessageRecall`、`MessageTranslation`、`GiftMessageReference` 等实体。撤回是 `chat_message` 的生命周期状态；已读是 `chat_conversation_member` 的游标；礼物集成与翻译均 `deferred`。详见[未来扩展](#未来扩展deferred)。

## 业务规则定稿

1. **Chat Conversation 与 Social Match 解耦。** Chat 不存 `match_id`、`follow_id`、relationship status；发送时通过 `canChat()` 判断权限。
2. **同一用户对全生命周期只有一个 Direct Conversation。** 由 `UNIQUE(user_low_id, user_high_id)` 在数据库层保证。
3. **Direct 会话成员集合恒定。** `DirectConversationMembers = {user_low_id, user_high_id}`；只能由 `getOrCreateDirectConversation()` 创建，禁止任意 `addMember()`。
4. **共享会话状态与用户个人会话状态分离。** 置顶、免打扰、隐藏、清空都不写入共享实体。
5. **消息永久按 `seq` 排序**，不依赖 `created_at` 做严格顺序。
6. **消息发送必须事务化**：分配 seq、插入消息主体、插入内容、更新会话水位、推进发送者已读、恢复隐藏状态，一个事务完成。
7. **已读不用 Receipt 表**：`last_read_seq` 游标即为真相，未读数是派生值。
8. **清空记录不删除 Message**，只移动 `cleared_before_seq` 可见起点。
9. **隐藏会话不代表已读**；收到新消息或用户主动再次发送时恢复 `hidden_at = NULL`。
10. **撤回不删除原消息**：只改 `status` 与 `recalled_at`，原始 subtype 内容保留供审核与纠纷处理。
11. **空 conversation 不进入聊天列表**：`last_message_id IS NULL` 的会话不展示。

## 与其他域的协作

| 协作方 | 方向 | 内容 |
| --- | --- | --- |
| Identity | Chat ← Identity | 直接引用全局用户主体 ID；不另建 `chat_user`/`chat_profile` |
| Social | Chat ← Social | 发送前调用 `canChat()`；Social 关系变化不写 Chat 表 |
| Platform Media | Chat → Media | `asset_id` 引用统一媒体资源；Chat 不存 URL、宽高、MIME |
| Commerce | — | 礼物集成 `deferred`，当前无协作契约 |
| Trust & Safety | Chat → T&S | 撤回与强制处置保留原始数据供审计；完整案件属 T&S |
| Platform / Infra | Chat → 基础设施 | 领域事件由 Outbox 可靠投递；推送与 WebSocket 不属于业务域 |

## 应用服务用例

```text
getOrCreateDirectConversation   sendTextMessage      sendImageMessage
listConversations               listMessages         markConversationRead
recallMessage                   hideConversation     clearConversationHistory
pinConversation                 muteConversation
```

**当前不存在 `sendGiftMessage()`。** 完整的用例行为、字段契约与 `canChat()` 权限契约见[应用服务与事件](application-and-events.md)。

## 未来扩展（`deferred`）

以下能力均不在第一阶段，也没有对应的实体、表或字段。未来若重新进入设计，应通过新增表或新增枚举值扩展，而不是推翻当前七表模型：

- 礼物消息与 Commerce 集成（`chat_message_gift` / `sendGiftMessage()` / `GiftMessageReference`）
- 逐条已读回执与送达回执（`chat_message_receipt` / `chat_delivery_receipt`）
- 单条消息「仅自己删除」（`chat_message_user_state`）
- 消息表情回应（`chat_message_reaction`）
- 聊天翻译与语音转文字（`chat_message_translation` / VOICE MessageType）
- 群聊（`chat_group` / `chat_group_member`）

领域边界原则仍然成立：**礼物交易真相属于 Commerce，Chat 最多只消费已完成的送礼结果**。但在礼物集成被正式设计之前，该原则不产生任何 Chat 实体、字段或用例。

## 状态

| 层面 | 状态 |
| --- | --- |
| 领域边界与业务模型 | `frozen` |
| 7 张表的字段语义、约束、索引意图、业务规则 | `frozen` |
| 跨域契约（public_id UUID、跨域 logical UUID、无跨域物理 FK） | `frozen`（全域审计最终修正版） |
| 物理 DDL（Outbox 物理表、UUID 分配实现） | `designing`（见[数据库总览](database.md)） |
| 应用服务用例与事件的字段级规格 | `designing` |
| 上述未来扩展 | `deferred` |

## 文档地图

- [会话模型](conversation.md)：Conversation、Direct、Member、UserState、Direct 成员不变量与聊天列表查询模型。
- [消息模型](message.md)：Message、Text、Image、`seq`、幂等、撤回与发送事务。
- [应用服务与事件](application-and-events.md)：用例清单、`canChat()` 权限契约、领域事件与 Outbox 边界。
- [数据库总览](database.md)：DDL、索引意图、明确不建的表、与全局规范的差异。
