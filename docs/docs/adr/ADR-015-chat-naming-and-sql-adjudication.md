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
5. **补 `public_id`**：`chat_conversation` 与 `chat_message` 均加 `public_id NOT NULL UNIQUE`；API 对外只暴露 `public_id`，不暴露连续 `id`。
6. **逻辑模型 `frozen`，物理 DDL 局部 `designing`**：跨域用户 FK、Media FK、`chat_direct_conversation.created_at`、`public_id` 类型等已由「全域审计后的最终修正版」解决（跨域统一 logical UUID 无物理 FK、`public_id = UUID`、direct 三列）；剩余 Outbox 物理表与 UUID 分配实现属于未定稿项，补齐前不得直接复制 DDL 执行。

## 修订记录（2026-08-30）

Chat 会话结尾「全域审计后的最终修正版」（分享 `https://chatgpt.com/share/6a9329e5-9f28-83ea-8eb1-f85be6e414fa`，消息 [64] 指令 + [71] 产出）对本 ADR 的**唯一实质修订**：

- 第 5 条 `public_id` 类型由早期 `varchar(32)` 修订为 **UUID**（应用层生成，创建后不可变），与全局最终版 [ADR-018](ADR-018-global-database-design-principles-final.md)「跨域 logical/public ID 统一 UUID」一致。
- 第 6 条未定稿项清单相应消解：跨域用户 ID / Media `asset_id` 统一为 logical UUID 且不建跨域物理 FK；`chat_direct_conversation` 定稿为三列（不保留 `created_at`）。

本 ADR 其余裁决（命名 Chat、`chat_*` 表名例外、`varchar(32)+CHECK` 枚举、`bigint identity` 主键）不变。审计最终修正版 DDL 中 `type`/`status` 以 `smallint` 表达，属会话早期风格，本项目按第 3 条统一为 `varchar(32)+CHECK`，枚举语义等价。

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
