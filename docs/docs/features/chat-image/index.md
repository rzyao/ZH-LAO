---
feature_id: chat-image
title: 图片消息
portfolio_status: active
domain:
  - chat
  - identity
  - social
status:
  design: active
  backend: todo
  admin: na
  mobile: todo
  integration: todo
  acceptance: todo
mobile_pages: []
admin_pages: []
active_notes:
  design: IMAGE subtype 与 asset_id 引用语义已冻结；上传资产校验及公共 API 请求响应、错误契约仍未形成 Feature 级 Design Gate。
---

# 图片消息

## 功能概览

Portfolio Status：`active`。

`chat-image` 负责把已经由统一 Media / Asset 能力准备好的图片资产作为 Chat 消息发送。当前 canonical 使用 `chat_message.type = 'image'` 与 `chat_message_image` subtype；Chat 只保存 `asset_id` 和展示顺序，不保存对象存储 URL、MIME、宽高、文件大小或 checksum。

一条 IMAGE message 可以包含多张图片，以 `(message_id, position)` 表达顺序；当前不支持图片 caption，也不把文字和图片混成新的消息 subtype。

## 设计

状态：active

范围：定义 IMAGE 消息主体、图片资产引用、多图顺序、发送前资产准备边界，以及消息创建与远程上传之间的事务边界。权威事实来自 [消息模型](/domains/chat/message)、[应用服务与领域事件](/domains/chat/application-and-events) 与 [Chat 数据库总览](/domains/chat/database)。

Stage / 工件：`chat_message_image(message_id, asset_id, position)` 与 `sendImageMessage(asset_ids[])` 的核心语义已经进入 canonical；`database/migrations/0800_chat.sql` 已物理创建该 subtype 表，`expected-schema.json` 也将其列入 Chat 预期 Schema。

已完成内容：已固定图片先经 Media / Asset 上传并达到可用状态，再调用 Chat 发送；Chat 数据库事务只负责验证可用资产引用、创建 message、插入 N 条 subtype 行并更新会话水位。远程对象存储操作不得放入 Chat 数据库事务；任何一张 subtype 写入失败都应使整条 IMAGE message 回滚。

当前进行内容：canonical 已给出“asset 必须 READY 且当前用户有权使用”的原则，但 Chat 应用层的具体请求/响应字段、资产校验错误码及 API 契约仍处于 `designing`，没有 Feature 级 Gate 证明设计全部关闭。

Gate / Evidence：图片 subtype、`asset_id` logical UUID、多图 position 与 `type IN ('text','image')` 已有 frozen canonical + 实际迁移双重证据；当前 `main` 未发现 Chat Feature 级 Design Gate，因此设计 Lane 保持 `active`。

下一步：冻结 `sendImageMessage` 的公共契约、资产校验失败语义与可执行 Design Gate；之后实现 Chat Backend 的 asset 验证、事务与查询映射。

## Backend

状态：todo

当前 `apps/backend/src/modules/` 不存在 Chat 模块。数据库已落地 `chat_message_image`，Backend 也已有通用 Asset / Outbox 基础能力，但尚无 `sendImageMessage` API、Chat Repository、资产 READY/权限校验与消息事务实现证据，因此不把基础设施能力误记为本 Feature Backend 已启动或完成。

## Admin

状态：na

不适用：图片消息是用户侧聊天能力，当前没有独立 Admin 交付端。

## Mobile

状态：todo

Mobile 已有通用 Asset 上传基础能力，但 `apps/mobile/src/features/` 尚无 Chat 模块、图片消息选择/预览/发送/展示页面或 Chat API 接入。通用资产上传不能替代图片消息业务实现。

## 集成

状态：todo

尚无 Chat Backend 与 Chat Mobile 图片消息链路，未形成“资产 READY → sendImageMessage → 消息查询/实时同步”的真实联调证据。

## 验收

状态：todo

待设计 Gate、Backend、Mobile 与集成链路具备真实证据后，再执行多图顺序、幂等、回滚与展示等端到端验收。
