---
status: designing
last_updated: 2026-08-30
schema: messaging
---

# Messaging 数据库待设计项

预期表达 Conversation、Participant、Message、Text/Image/Voice Message、MessageReceipt、MessageRecall、MessageTranslation 和 GiftMessageReference。

主会话尚未决定单表/分表内容模型、Message public_id、消息排序键、幂等键、送达与已读模型、翻译缓存、保留策略和索引。礼物只能引用 Commerce 交易，不能在本 Schema 重复记账。
