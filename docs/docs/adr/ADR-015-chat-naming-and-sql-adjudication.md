---
status: frozen
date: 2026-08-30
---

# ADR-015：Chat 命名统一与 SQL 规范裁决

## 背景

Chat Domain 设计过程中出现了两套命名与三类 SQL 规范偏差，主架构会话在审计后一次性裁决。

**命名双轨问题**：会话从始至终设计的是「Chat Domain」，ADR 与 `ChatApplicationService` 也都叫 Chat；但一级域、数据库 Schema 与文档目录一度被命名为 `Messaging`，而表名仍是 `chat_*`。因此并存了 `Messaging Domain` / `messaging` schema / `chat_conversation` 表 / `ChatApplicationService` / `ADR` 叫 Chat 的混用状态。

**全局 SQL 规范冲突**：PostgreSQL 总规范规定「表名复数」「`varchar(32)` + CHECK 枚举」「`bigint generated always as identity` 主键」「Conversation / Message 需 `public_id`」。而 Chat 初稿用了单数 `chat_*` 前缀、`smallint` 枚举、显式 `BIGINT` 主键，且 `chat_conversation` / `chat_message` 没有 `public_id`。

## 决策

1. **统一命名为 Chat**：业务域名称 = `Chat`，Schema / 代码 / 模块 = `chat`，目录 = `domains/chat`。`Messaging` 一词正式废弃，不再作为域、Schema、目录或文档标题。
2. **表名保留 `chat_*` 单数含前缀**，与全局「复数」规范不同，但登记为**已裁决的正式例外**：该域由会话逐表定稿，表名与其结论逐字一致，且 `chat_` 前缀与 Schema 名 `chat` 一致，无语义冲突。
3. **枚举回归全局规范**：状态/类型一律 `varchar(32)` + CHECK（如 `'active'`/`'closed'`、`'text'`/`'image'`），弃用 `smallint`。
4. **主键回归全局规范**：`bigint generated always as identity primary key`，弃用显式 `BIGINT PRIMARY KEY`。
5. **补 `public_id`**：`chat_conversation` 与 `chat_message` 均加 `public_id varchar(32) NOT NULL UNIQUE`；API 对外只暴露 `public_id`，不暴露连续 `id`。
6. **逻辑模型 `frozen`，物理 DDL 仍 `designing`**：跨域用户 FK 目标表、Media FK、`chat_direct_conversation.created_at` 是否保留、`public_id` 生成算法、Outbox 物理表属于未定稿项，补齐前不得直接复制 DDL 执行。

## 原因

- 长期保留双命名体系会让 migration 与代码实现无所适从（`messaging.chat_conversation` 这种半套命名不可接受）。
- `public_id` 遗漏会造成「全局要求有、Chat 没有、差异清单却说没有差异」的文档治理漏洞；补 `public_id` 是成本最低且符合规范的修复。
- 表名与会话定稿逐字一致能降低实现歧义；其余三项（enum / PK / public_id）直接回归全局规范，全库风格统一，无需为 Chat 单独维护例外语法。

## 影响

- 七张表模型不降级：`chat_*` 单数前缀为唯一例外，enum / PK / public_id 已与全局一致，据此把整组表误判为 `designing` 是错误的。
- 文档维护阶段不自行推翻上述裁决；后续若需新增 Group / Voice / Translation，通过新增表或枚举值扩展，不推翻七表核心模型（见 [ADR-011~014](../adr/ADR-011-chat-conversation-identity-and-direct-uniqueness.md) 与 [Chat 数据库](../domains/chat/database.md)）。

## 事实源

- [Chat 数据库总览](../domains/chat/database.md)「与全局 SQL 规范的关系」
- [Chat 域 · 命名裁决](../domains/chat/index.md)
- [设计台账 D-055 / D-057](../governance/design-register.md)
