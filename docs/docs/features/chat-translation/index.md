---
feature_id: chat-translation
title: 聊天翻译
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

# 聊天翻译

## 功能概览

Portfolio Status：`pending_decision`。

当前 Chat canonical 明确规定聊天原文是不可变事实，Chat 不拥有翻译结果或语言知识事实，并明确不包含消息翻译；[消息模型](/domains/chat/message.md)禁止在 `chat_message_text` 中增加 `translated_text`、`language` 等派生字段。[未决与延期事项](/governance/open-questions.md)又记录产品定位中存在聊天翻译能力，因此当前真实状态是范围/归属待裁决，而不是等待补一个 translation model。

当前禁止创建 `chat_message_translation`、给 `chat_message_text` 追加翻译字段，或把 Learning 的翻译事实复制进 Chat。任何未来方案都必须先解决 `CHAT_SCOPE_DECISION` 并更新 canonical 设计。

NEEDS_DECISION：`CHAT_SCOPE_DECISION`——确认聊天翻译是否进入当前产品组合，以及它与 Chat 原文事实、Learning 翻译能力之间的正式职责边界；本文档不裁决持久化模型或 API 形态。

## 设计

状态：blocked

Scope：确认聊天翻译是否属于当前范围及其跨域职责边界；不在本 Lane 自行设计 translation table、字段、缓存或接口。

Stage / Artifact：当前有效工件是 [Chat 域](/domains/chat/)、[消息模型](/domains/chat/message.md) 与 [未决与延期事项](/governance/open-questions.md)。Chat frozen canonical 只保存用户原文，并把翻译结果排除在 Chat 事实之外。

Gate / Evidence：D-056 仍要求主会话确认语音/翻译/语音转文字的首期范围；同时 canonical 明确禁止把翻译结果混入 `chat_message_text`。因此 `CHAT_SCOPE_DECISION` 未完成，Design Gate 不可判 PASS。

Next Action：由主架构/产品完成范围与 ownership 裁决并更新 canonical；随后再重评本 Lane。

## Backend

状态：blocked

Scope：只记录 Backend 缺少正式翻译契约的事实，不定义未来翻译请求、存储、缓存或第三方服务接入。

Stage / Artifact：现有 Chat Backend canonical 的文本事实只有原文；没有获准的聊天翻译数据模型或 public contract。

Gate / Evidence：[消息模型](/domains/chat/message.md)明确 `chat_message_text.text = immutable original content`，且禁止 `translated_text` / `language` 等字段；直接创建 `chat_message_translation` 也会越过当前 Chat final design。阻塞对象为 `CHAT_SCOPE_DECISION`。

Next Action：待 Design Lane 的 canonical ownership 与 contract 落盘后，再启动 Backend；不得以实现倒逼 canonical。

## Admin

状态：na

不适用：当前 Feature 没有已定义的 Admin 交付面；未来如正式设计需要运营能力，再由 canonical 设计新增对应范围。

## Mobile

状态：blocked

Scope：仅记录聊天界面对翻译能力的依赖，不提前定义翻译按钮、自动翻译、语言选择或结果展示规则。

Stage / Artifact：当前没有获准的聊天翻译 public contract，也没有本 Feature 的 canonical Mobile 页面/状态工件。

Gate / Evidence：翻译范围和 ownership 尚未裁决，Mobile 无稳定后端语义可接入；阻塞对象为 `CHAT_SCOPE_DECISION`。

Next Action：待 canonical 与 Backend contract 确认后，再建立 Mobile Stage 和真实页面证据。

## 集成

状态：blocked

Scope：未来若进入范围，需要基于正式 ownership 处理 Chat 与 Learning 等能力的调用边界；本页不预设同步/异步、存储或缓存方式。

Stage / Artifact：当前只有 Chat 原文 canonical 与 Learning 用户即时翻译事实的既有边界，没有聊天翻译 integration contract。

Gate / Evidence：跨域 ownership 尚未裁决，无法形成有效集成 Gate；阻塞对象为 `CHAT_SCOPE_DECISION`。

Next Action：Design / Backend 形成正式跨域契约后再进入联调。

## 验收

状态：blocked

Scope：只验收经正式裁决后的聊天翻译能力；当前不虚构语言覆盖、准确率、缓存或 E2E 标准。

Stage / Artifact：尚无获准范围、实现产物或验收 Gate。

Gate / Evidence：`CHAT_SCOPE_DECISION` 未完成，且当前 Chat canonical 明确不包含消息翻译，因此不存在可判定完成的验收对象。

Next Action：裁决完成并有真实实现/集成证据后，再定义验收 Gate。
