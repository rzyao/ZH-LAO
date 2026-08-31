---
feature_id: conversation-settings
title: 置顶 / 免打扰 / 隐藏 / 清空历史
portfolio_status: active
domain:
  - chat
  - identity
  - social
status:
  design: done
  backend: todo
  admin: na
  mobile: todo
  integration: todo
  acceptance: todo
mobile_pages: []
admin_pages: []
evidence:
  design:
    - /domains/chat/conversation
    - /adr/ADR-011-chat-conversation-identity-and-direct-uniqueness
    - /adr/ADR-013-read-state-as-cursor-not-receipt-table
---

# 置顶 / 免打扰 / 隐藏 / 清空历史

## 功能概览

Portfolio Status：`active`。

本 Feature 的四类个人会话操作全部落在同一 canonical 模型 `chat_conversation_user_state`：`is_pinned + pinned_at` 表示置顶，`is_muted` 表示免打扰，`hidden_at` 表示仅对当前用户隐藏会话，`cleared_before_seq` 表示仅对当前用户清空指定水位之前的历史。它们都不会删除共享 Conversation 或 Message 事实。

## 设计

状态：done

范围：定义 Conversation User State 与 Member/read cursor 的责任分离，以及置顶、免打扰、隐藏、清历史的个人化语义。`chat_conversation_user_state` 以 `(conversation_id, user_id)` 为一对一成员状态扩展，并在成员创建时同步建立默认行。

执行阶段与产物：[Chat Conversation Final Canonical](/domains/chat/conversation)、[ADR-011](/adr/ADR-011-chat-conversation-identity-and-direct-uniqueness) 与 [ADR-013](/adr/ADR-013-read-state-as-cursor-not-receipt-table)。这些冻结工件共同定义了 User State 与 read cursor 的边界。

Gate / 完成证据：canonical 已固定 `hidden_at`、`cleared_before_seq`、`is_pinned`、`pinned_at`、`is_muted`、`updated_at` 字段。隐藏仅设置本人 `hidden_at`，不推进 read cursor、不删除共享会话；清历史仅推进本人 `cleared_before_seq`，同时 read cursor 至少推进至同一水位，不创建 per-message hidden rows、不物理删除消息；置顶使用 `pinned_at` 稳定排序；免打扰只是个人偏好。新消息或有效用户参与可由应用服务恢复 `hidden_at = NULL`，而不是依赖数据库 trigger。

下一步：Backend 严格围绕 `chat_conversation_user_state` 实现四类用例及隐藏恢复，避免拆出新的 setting/history canonical 表。

## Backend

状态：todo

范围：实现置顶/取消置顶、免打扰开关、隐藏/恢复、清历史等 User State 写用例/API，并处理 `is_pinned` 与 `pinned_at` 一致性、`cleared_before_seq` 边界、清历史与 read cursor 协同，以及新消息/有效参与导致的隐藏恢复。

执行阶段与产物：尚未进入 Chat Backend Feature 实现 Stage。数据库前置工件 `database/v2/migrations/0800_chat.sql` 已创建 `chat_conversation_user_state`，字段与 canonical 一致；但 `main` 未发现 F13 Conversation Settings 的 Backend Stage/Report、API/Service/Repository 实现。

Gate / 证据：现有证据只能证明 canonical 数据模型已落库，不能证明用户状态操作已实现；没有 Backend PASS、接口和行为测试证据，因此保持 `todo`。

下一步：建立 Chat Backend 执行工件，实现四类 User State mutation、隐藏恢复和 clear-history/read-cursor 原子协同，并补双方隔离、边界水位与重试幂等测试。

## Admin

状态：na

范围：这些设置是 App 用户自己的 Conversation User State，不提供 Admin 代用户置顶、免打扰、隐藏或清历史的交付面；管理/治理动作不得复用这些个人设置字段表达平台处罚。

执行阶段与产物：N/A；当前 Feature `admin_pages` 为空，canonical 将这些字段明确归入每用户会话状态。

Gate / 证据：[Chat Conversation Final Canonical](/domains/chat/conversation) 已固定 User State 为个人偏好/个人可见性事实，F13 完成不依赖 Admin Lane。

下一步：维持 `na`；如未来新增运营治理能力，应在相应治理 Feature 中建模，不把 enforcement 塞入 `chat_conversation_user_state`。

## Mobile

状态：todo

范围：提供置顶、免打扰、隐藏、清历史的用户操作与状态反馈，并消费服务端返回的 canonical User State；清历史/隐藏的 UI 必须遵守“仅本人视图变化、不删除共享消息”的语义。

执行阶段与产物：尚未发现 F13 Conversation Settings 的 Mobile Design/Implementation Stage 工件，`mobile_pages` 当前为空。

Gate / 证据：无 Mobile 操作面、真实 API 接入或设备验证证据，保持 `todo`。

下一步：Backend contract 可执行后，补会话列表/会话详情中的设置入口、确认交互、状态同步与多设备验证。

## 集成

状态：todo

范围：验证 User State 与会话列表、消息查询、read cursor 的协同，并确保 A 用户的置顶/免打扰/隐藏/清历史不会修改 B 用户状态或共享消息事实。

执行阶段与产物：尚无 F13 Conversation Settings Integration Stage/Report。

Gate / 证据：无跨列表、消息、read-state 与 Mobile 的真实联调证据，保持 `todo`。

下一步：在 Backend/Mobile 就绪后，覆盖双方状态隔离、隐藏→新消息恢复、清历史→新消息可见、清历史→read cursor 推进、置顶排序和免打扰同步等集成场景。

## 验收

状态：todo

范围：验收置顶排序稳定、免打扰仅影响本人偏好、隐藏只让本人列表暂时不可见且不推进已读、清历史只隐藏本人水位之前的消息且不物理删除共享历史；同时确认新消息/有效参与可恢复隐藏状态，所有行为均由 `chat_conversation_user_state` 与 Member cursor 表达。

执行阶段与产物：尚无 F13 Conversation Settings Acceptance Report/Gate。

Gate / 证据：当前没有端到端验收证据，保持 `todo`。

下一步：实现和集成完成后，以双用户、多设备和跨清历史水位的新消息场景执行验收并记录 Gate。
