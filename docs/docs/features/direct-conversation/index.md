---
feature_id: direct-conversation
title: 发起 / 打开一对一会话
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
---

# 发起 / 打开一对一会话

## 功能概览

Portfolio Status：`active`。

本 Feature 负责为两个用户发起或打开同一条 Direct Conversation。会话身份、成员关系和个人会话状态分别由 `chat_conversation`、`chat_direct_conversation`、`chat_conversation_member`、`chat_conversation_user_state` 承载；是否允许聊天属于进入 Chat 前的外部判定，Chat 不持久化 `match_id`，也不以 Social Match 作为会话身份。

当前 Chat canonical 仅定义一对一会话；群聊、消息翻译、礼物消息等不属于本 Feature。

## 设计

状态：done

范围：确定 Direct Conversation 的唯一身份、get-or-create 语义、恰好两名成员的成员不变量，以及新建会话时同步初始化双方 `chat_conversation_user_state` 的事务边界。跨 Domain 用户引用使用 Identity logical UUID，不建立跨 Domain PostgreSQL FK。

执行阶段与产物：[Chat Conversation Final Canonical](/domains/chat/conversation) 与 [ADR-011](/adr/ADR-011-chat-conversation-identity-and-direct-uniqueness)。两份工件已冻结会话身份与 Direct 唯一性决策。

Gate / 完成证据：canonical 已明确 `user_low_id = min(A,B)`、`user_high_id = max(A,B)`、唯一约束 `(user_low_id, user_high_id)`、禁止自聊，并要求 `getOrCreateDirectConversation` 在同一事务中创建 Conversation、Direct subtype、2 条 Member 与 2 条 User State；并发唯一冲突按“重新查询已存在会话”收敛。未发现需要恢复的 `initiator_user_id`、`match_id` 或第二套 Direct 身份模型。

下一步：进入 Backend 时，以该冻结契约实现 `getOrCreateDirectConversation`、授权边界和并发幂等，并为“两用户唯一一会话 / 恰好两成员 / 默认 User State”补自动化测试。

## Backend

状态：todo

范围：实现 Direct Conversation 的应用服务、Repository/API、外部 `canChat` 判定接入、事务创建和唯一冲突重查；不得开放破坏 Direct 两成员不变量的通用 `addMember/removeMember` 写入口。

执行阶段与产物：尚未进入 Chat Backend Feature 实现 Stage。当前仓库已有数据库前置工件 `database/v2/migrations/0800_chat.sql`，其中包含 `chat_conversation`、`chat_direct_conversation`、`chat_conversation_member`、`chat_conversation_user_state` 及 Direct pair 唯一约束，但 `main` 未发现对应 Chat Backend Stage/Report 或应用模块实现。

Gate / 证据：当前只有冻结设计与数据库结构证据，没有 F13 Backend PASS、API/Service/Repository 实现证据，因此本 Lane 保持 `todo`。

下一步：建立 Chat Backend 执行工件并实现 get-or-create、并发唯一冲突处理、成员/User State 原子创建和授权失败路径，再以真实测试与 Gate 推进状态。

## Admin

状态：na

范围：本 Feature 是 App 用户之间的一对一会话建立能力，不定义运营后台发起会话或维护 Direct 成员的交付面；平台治理/风控对聊天的处置属于其他 Feature/Domain 边界。

执行阶段与产物：N/A；当前 Feature `admin_pages` 为空，Chat Conversation canonical 也未定义 F13 Admin 操作面。

Gate / 证据：功能责任边界已经由 [Chat Conversation Final Canonical](/domains/chat/conversation) 固定为用户侧 Conversation aggregate；无需 Admin Lane 才能完成本 Feature。

下一步：维持 `na`；只有正式产品范围新增 F13 专属 Admin 能力时再重新进入该 Lane。

## Mobile

状态：todo

范围：提供用户从合适入口发起/打开一对一聊天的交互，并消费 Backend 返回的 canonical `conversation.public_id`；客户端不得自行制造第二套会话身份或依赖本地 pair 去重替代服务端唯一性。

执行阶段与产物：尚未发现 F13 Direct Conversation 的 Mobile Design/Implementation Stage 工件，`mobile_pages` 当前为空。

Gate / 证据：无 Mobile 实现或真实 API 集成证据，保持 `todo`。

下一步：待 Backend public contract 可执行后，补 Mobile 页面/导航设计、真实 API 接入与设备验证。

## 集成

状态：todo

范围：验证 Identity logical UUID、外部聊天许可判定与 Chat get-or-create 的边界，并覆盖 A→B、B→A 与并发请求均收敛到同一 Direct Conversation。

执行阶段与产物：尚无 F13 Direct Conversation 集成 Stage/Report。

Gate / 证据：无跨 Domain 联调与并发集成测试证据，保持 `todo`。

下一步：Backend 与 Mobile 具备可执行接口后，补授权、并发去重、重复打开和失败回滚的集成证据。

## 验收

状态：todo

范围：验收同一用户对只能存在一条 Direct Conversation、自聊被拒绝、双方恰好为成员、默认 User State 被创建，并确认反向顺序/并发请求不会创建重复会话。

执行阶段与产物：尚无 F13 Direct Conversation Acceptance Report/Gate。

Gate / 证据：当前只有设计与数据库约束，未形成端到端验收证据，保持 `todo`。

下一步：在 Backend、Mobile、Integration 完成后执行真实端到端验收并记录 Gate 结果。
