---
feature_id: chat-realtime
title: 实时消息传输与重连
portfolio_status: active
domain:
- chat
- identity
- social
mobile_pages: []
admin_pages: []
delivery_notes:
- Chat 已确定事务提交后事件分发、Outbox 与 seq 同步边界；Chat 专用频道协议、重连与 replay 策略仍未冻结，Mobile 仅有无真实 transport 的 Foundation skeleton。
---

# 实时消息传输与重连

## 功能概览

Portfolio Status：`active`。

`chat-realtime` 负责把已经提交的 Chat 事实同步给在线客户端，并在连接中断后依据服务器持久化事实恢复一致状态。Chat Domain 自身不把 WebSocket 连接、`websocket_sent`、`is_delivered` 等传输状态写进 `chat_message`；可靠事实仍以数据库中的 conversation/message、`seq` 与已读游标为准。

当前 canonical 的实时边界是“事务内写 Chat 事实 + Outbox，提交后再由应用/基础设施分发”。重连/同步不能依赖逐消息 receipt table，也不能把 delivery/read 状态扩成新的消息状态。
