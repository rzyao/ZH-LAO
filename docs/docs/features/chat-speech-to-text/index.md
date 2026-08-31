---
feature_id: chat-speech-to-text
title: 语音转文字
portfolio_status: pending_decision
domain:
  - chat
  - identity
  - social
  - learning
status:
  design: blocked
  backend: blocked
  admin: na
  mobile: blocked
  integration: blocked
  acceptance: blocked
mobile_pages: []
admin_pages: []
blocks:
  design: CHAT_SCOPE_DECISION
  backend: CHAT_SCOPE_DECISION
  mobile: CHAT_SCOPE_DECISION
  integration: CHAT_SCOPE_DECISION
  acceptance: CHAT_SCOPE_DECISION
---

# 语音转文字

## 功能概览

Portfolio Status：`pending_decision`。

[未决与延期事项](/governance/open-questions.md)把“语音转文字”与语音消息、聊天翻译一起列入 D-056：产品定位存在这些能力，但当前 Chat 首期数据库只到 TEXT / IMAGE，需要主会话确认范围。与此同时，[消息模型](/domains/chat/message.md)当前只有 `text` / `image` MessageType，没有 `voice`、转写 subtype 或转写结果字段。

因此本 Feature 当前不是可直接实现的 Backend/Mobile 任务，也不能通过给 Chat 消息增加 transcription 字段来绕过裁决。语音转文字最终属于消息持久事实、派生能力还是其它领域能力，均须由 canonical 设计正式决定。

NEEDS_DECISION：`CHAT_SCOPE_DECISION`——确认语音转文字是否进入当前产品组合，并明确它与语音消息、Chat 原始消息事实及 Learning 能力的职责边界；本文档不预判结果存储方式或 API。

## 设计

状态：blocked

Scope：确认语音转文字是否进入当前范围、是否依赖语音消息，以及其领域 ownership；不自行设计 transcription 表、字段、状态机或服务契约。

Stage / Artifact：当前有效工件是 [Chat 域](/domains/chat/)、[消息模型](/domains/chat/message.md) 与 [未决与延期事项](/governance/open-questions.md)；没有获准的 Speech-to-Text canonical extension。

Gate / Evidence：D-056 明确该能力仍需主会话确认；当前 frozen Chat canonical 只接受 TEXT / IMAGE。`CHAT_SCOPE_DECISION` 未完成，Design Gate 不可判 PASS。

Next Action：先完成范围与 ownership 裁决，并把结论写入 canonical 设计；之后再决定本 Feature 是否继续以及如何拆分后续 Lane。

## Backend

状态：blocked

Scope：只记录缺少正式 STT contract 的阻塞事实，不定义识别引擎、任务、回调、存储或错误码。

Stage / Artifact：现有 Chat canonical 没有语音 MessageType、转写 subtype 或转写结果模型，也没有本 Feature 的获准 Backend contract。

Gate / Evidence：在 `CHAT_SCOPE_DECISION` 之前新增 transcription 字段/表或接口会形成非 canonical 事实；因此 Backend 继续阻塞。

Next Action：等待 Design Lane 的正式 canonical extension，再以其为唯一实现依据。

## Admin

状态：na

不适用：当前 Feature 没有已定义的 Admin 交付面；未来若正式设计引入运营能力，再由 canonical 设计确定。

## Mobile

状态：blocked

Scope：仅记录聊天端对 STT 能力的依赖，不提前定义触发方式、权限、录音交互、转写展示或编辑语义。

Stage / Artifact：当前没有获准的 STT public contract，也没有本 Feature 的 canonical Mobile 页面/状态工件。

Gate / Evidence：范围、语音消息前置关系与 ownership 均未裁决，Mobile 无稳定契约可接入；阻塞对象为 `CHAT_SCOPE_DECISION`。

Next Action：待 canonical 与 Backend contract 落盘后，再建立 Mobile Stage 和真实页面证据。

## 集成

状态：blocked

Scope：仅记录未来可能涉及 Chat、Learning、Media / Asset 或语音服务的跨域联动；不预设具体依赖或数据流。

Stage / Artifact：当前没有 STT integration contract；已有 Chat canonical 也不承载转写事实。

Gate / Evidence：上游范围与 ownership 未决，无法形成集成 Gate；阻塞对象为 `CHAT_SCOPE_DECISION`。

Next Action：正式设计确定参与方与 public contract 后再进入集成。

## 验收

状态：blocked

Scope：只验收经正式裁决并实现的 STT 范围；当前不虚构识别准确率、语言覆盖、延迟或 E2E 标准。

Stage / Artifact：尚无获准范围、实现产物或验收 Gate。

Gate / Evidence：`CHAT_SCOPE_DECISION` 未完成，当前不存在 canonical STT 交付物，因此不可判定验收完成。

Next Action：裁决完成并有真实实现/集成证据后，再建立验收标准与 Gate。
