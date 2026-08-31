---
feature_id: chat-voice-message
title: 语音消息
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

# 语音消息

## 功能概览

Portfolio Status：`pending_decision`。

当前 Chat canonical 只定义 `text` / `image` 两种 MessageType、7 张业务表，并明确把 Voice Message 排除在当前模型之外；[未决与延期事项](/governance/open-questions.md)同时记录产品定位中存在语音能力、但 Chat 首期数据库只到 TEXT / IMAGE 的范围冲突。因此该 Feature 不是“缺一张表”的实现任务，而是 `CHAT_SCOPE_DECISION` 尚未完成。

当前禁止通过补 `voice` MessageType、语音 subtype 表或临时 API 来绕过裁决。若未来进入正式范围，必须先更新 canonical Chat design，再进入各执行 Lane。

NEEDS_DECISION：`CHAT_SCOPE_DECISION`——确认语音消息是否进入当前产品组合；若进入，再由 canonical 设计明确 Chat 与 Media / Asset、Learning 的职责边界，本文档不代替该裁决。

## 设计

状态：blocked

Scope：只确认“语音消息是否进入当前 Chat 范围”以及进入后需要由 canonical 设计解决的领域边界；本 Lane 不自行设计语音表、字段、消息类型或 API。

Stage / Artifact：当前有效工件是 [Chat 域](/domains/chat/) 与 [消息模型](/domains/chat/message.md) 的 frozen canonical，以及 [未决与延期事项](/governance/open-questions.md) 中的 D-056 范围缺口；尚无获准的 Voice Message canonical extension。

Gate / Evidence：Chat canonical 明确当前只有 TEXT / IMAGE，并将 Voice Message 列为“当前明确不包含”；D-056 要求主会话确认收缩产品范围还是延后数据库建模。因此 `CHAT_SCOPE_DECISION` 未完成，Design Gate 不可判 PASS。

Next Action：由主架构/产品裁决 `CHAT_SCOPE_DECISION`；只有 canonical 结论落盘后，才能重评本 Lane 状态并建立后续执行工件。

## Backend

状态：blocked

Scope：仅记录 Backend 当前无法开始的原因，不定义未来语音消息 API、Repository、存储或传输实现。

Stage / Artifact：[消息模型](/domains/chat/message.md)当前 `MessageType = text | image`，不存在 `voice` subtype 的有效 canonical contract；没有可供 Backend 实现的获准语音消息契约。

Gate / Evidence：Backend 若直接增加 `voice` 类型或语音 subtype，会与 frozen Chat canonical 冲突；阻塞对象为 `CHAT_SCOPE_DECISION`。

Next Action：等待 Design Lane 通过正式裁决产出 canonical extension，再依据该工件启动 Backend；不得先实现后补设计。

## Admin

状态：na

不适用：当前 Feature 没有已定义的 Admin 交付面；未来若产品裁决改变范围，再由正式设计决定是否需要 Admin 能力。

## Mobile

状态：blocked

Scope：仅记录 Mobile 对“语音消息”能力的依赖，不提前定义录制、上传、播放、权限或交互契约。

Stage / Artifact：当前没有获准的语音消息 Backend / public contract，也没有本 Feature 的 canonical Mobile 页面或导航工件。

Gate / Evidence：产品范围与 Chat canonical 尚未统一，Mobile 无稳定契约可接入；阻塞对象为 `CHAT_SCOPE_DECISION`。

Next Action：待 canonical 设计与 Backend contract 明确后，再建立 Mobile Stage；不得以客户端临时能力反向固化领域契约。

## 集成

状态：blocked

Scope：仅记录未来可能涉及 Chat、Media / Asset、Identity、Social、Learning 的边界需要正式契约后才能联调，不在本页定义这些契约。

Stage / Artifact：当前只有既有 Chat TEXT / IMAGE 与跨域 logical UUID 规则，没有 Voice Message integration artifact。

Gate / Evidence：缺少经裁决的语音消息领域归属与 public contract，无法形成有效集成 Gate；阻塞对象为 `CHAT_SCOPE_DECISION`。

Next Action：Design / Backend 获得正式 canonical 工件后，再确认实际参与域与集成顺序。

## 验收

状态：blocked

Scope：验收对象只能是经 canonical 设计确认并完成实现的语音消息能力；当前不虚构 E2E 场景或通过标准。

Stage / Artifact：尚无获准范围、实现产物或验收 Gate。

Gate / Evidence：上游 `CHAT_SCOPE_DECISION` 未完成，且当前 frozen Chat canonical 明确不包含 Voice Message，因此不存在可验收交付物。

Next Action：裁决并完成后续实现与集成后，再建立验收证据与最终 Gate。
