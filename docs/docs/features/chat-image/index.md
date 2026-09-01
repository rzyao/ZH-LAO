---
feature_id: chat-image
title: 图片消息
portfolio_status: active
domain:
- chat
- identity
- social
mobile_pages: []
admin_pages: []
delivery_notes:
- IMAGE subtype 与 asset_id 引用语义已冻结；上传资产校验及公共 API 请求响应、错误契约仍未形成 Feature 级 Design Gate。
---

# 图片消息

## 功能概览

Portfolio Status：`active`。

`chat-image` 负责把已经由统一 Media / Asset 能力准备好的图片资产作为 Chat 消息发送。当前 canonical 使用 `chat_message.type = 'image'` 与 `chat_message_image` subtype；Chat 只保存 `asset_id` 和展示顺序，不保存对象存储 URL、MIME、宽高、文件大小或 checksum。

一条 IMAGE message 可以包含多张图片，以 `(message_id, position)` 表达顺序；当前不支持图片 caption，也不把文字和图片混成新的消息 subtype。
