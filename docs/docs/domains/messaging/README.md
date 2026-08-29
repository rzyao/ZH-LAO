---
status: baseline
last_updated: 2026-08-30
---

# Messaging 域

Messaging 负责 Match 后的会话和消息传输。

## 子域与实体

- Conversation：Conversation、Participant。
- Message：Message、TextMessage、ImageMessage、VoiceMessage。
- Delivery：MessageReceipt。
- Recall：MessageRecall。
- Translation：MessageTranslation。
- Gift Message：GiftMessageReference。

## 业务基线

- Match 后建立 Conversation，正常聊天永久免费。
- 首期支持文字、Emoji、图片、语音消息、发送/送达/已读、撤回、翻译和语音转文字。
- 首期不支持文件、视频通话和语音通话。
- Gift Message 只引用 Commerce.GiftTransaction；Messaging 不改变资金或虚拟资产。
- UserBlock 或能力限制可跨域阻止消息发送。

## 数据库状态

实体和范围为 `baseline`；会话唯一性、消息内容存储、多媒体引用、回执粒度、撤回窗口、翻译版本和所有字段均为 `designing`。
