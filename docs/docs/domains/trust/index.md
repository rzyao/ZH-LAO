---
status: frozen
last_updated: 2026-08-30
revision: "2026-08-30 全域审计最终确认修订（会话分享链接已更新重抓）"
source_conversation_id: 6a93401c-51bc-83ea-aa6e-ac314a5af8c8
source_share_url: https://chatgpt.com/share/6a93401c-51bc-83ea-aa6e-ac314a5af8c8
---

# Trust & Safety 域

Trust & Safety 负责安全治理链路：举报 → 审核案件 → 证据 → 审核决定 → 安全处置 → 申诉。它**不拥有**被审核业务对象本身（资料、动态、会话、消息、订单、礼物、奖励），只引用其稳定逻辑 ID，并只产生治理处置与处置历史。

## 子域与实体（本会话定稿）

治理链路 6 表（逻辑模型 `frozen`，见 [数据库](database.md)）：

| 表 | 职责 |
| --- | --- |
| `trust.reports` | **全系统唯一**的用户举报事实源（不可变） |
| `trust.moderation_cases` | 统一审核工作流（举报 / 发布前 / 巡检 / AI 检测 / 系统规则） |
| `trust.moderation_evidence` | 审核与申诉证据及不可变快照 |
| `trust.moderation_decisions` | 审核最终判定（不可变） |
| `trust.enforcement_actions` | 安全处置 / 处罚指令 |
| `trust.appeals` | 被处罚用户的申诉及复核结果 |

> 旧实体名 `ReviewTask` / `ReviewDecision` / `ModerationAction` / `Restriction` / `Ban` / `UserBlock` 已被上述 6 表模型取代（`superseded`）。其中 `UserBlock` 归 Social `social_blocks`（[D-034](../../governance/design-register.md)）。

## 举报事实的唯一来源（全域审计确认）

- `trust.reports` 是全系统唯一的用户举报事实源。
- Social / Chat / Commerce 等域**只提供举报入口 API**，不得拥有第二套举报事实表。
- 原 Social `social_reports` / `post_reports` / `profile_reports` **删除**，全部改为写入 `trust.reports`（[D-115](../../governance/design-register.md)）。

## 跨域引用协议

被审核对象统一使用三元组 **`subject_domain + subject_type + subject_id`**（证据表对应 `reference_domain + reference_type + reference_id`）：

| 部分 | 取值 |
| --- | --- |
| `subject_domain` | `identity` `social` `chat` `commerce` |
| `subject_type` | `user` `social_profile` `social_post` `social_post_image` `chat_message` `conversation` |
| `subject_id` | 业务域稳定逻辑 UUID |

三元组是**领域协议**，不是数据库定位器：不允许出现表名或 `schema.table`，也不建物理 FK。

## 治理参与方身份

- **普通用户**（举报人 / 申诉人 / 被处罚人）→ Identity 逻辑 ID：`reporter_user_id`、`submitted_by_user_id`、`appellant_user_id`、`target_user_id`。
- **审核员 / 复核人 / 运营**→ **Operations 逻辑 ID（`operations.operators.id`）**：`assigned_operator_id`、`added_by_operator_id`、`decided_by_operator_id`、`reviewer_operator_id`。
- 上述全部只存 ID，**不建跨域 FK**；Trust 内部实体之间仍使用真实 PostgreSQL FK（`ON DELETE RESTRICT`）。

## 真人认证（Verification）子域 — `designing`

本会话聚焦治理链路，**未重新设计**真人认证。原 `VerificationCase` / `VerificationMedia` 实体仍为 `designing`，表细节待后续会话。Trust 对真人认证的职责边界不变：审核认证资料、产出认证结果，但用户根状态仍归 Identity。

## 业务基线

```text
Social Profile + Verification Media → Verification Case
→ Manual Review → Approved/Rejected → Social Eligibility

举报/发布前/巡检/AI检测/系统规则 → Moderation Case → Evidence → Decision
→ Enforcement Action →（system_outbox_events）→ 属主域自行执行 → Appeal
```

首期人工审核；后续演进为 AI 辅助，再到自动审核与人工复核。自动化不改变 Verification / Moderation 业务边界。

Account Status 与 Capability Restriction 分离：用户可保持 `active`，但被禁止聊天、进入社交、发布动态或 Follow。

**用户主动 Block ≠ 平台处罚**（[D-034](../../governance/design-register.md)）：

| 事实 | 属主 | 表 |
| --- | --- | --- |
| 用户主动拉黑的当前关系 | Social | `social_blocks` |
| 平台 Ban / Suspend / Restrict 处罚 | Trust | `enforcement_actions` |

两者永不合并，也不互为实现。

## 域边界（不可违反）

- Trust 只产生治理处置事实，**不直接 `UPDATE identity.* / social.* / chat.* / commerce.* / rewards.*`**（T&S-12）。
- 跨域处罚传播统一走**统一 `system_outbox_events`**（事件 `enforcement.applied / expired / revoked / cancelled / failed`，按 `enforcement_action_id` 幂等）；**不建 Trust 专属 Outbox 表**。
- 内容移除 / 限制等处置由属主域消费事件后自行变更自身状态（例如 `content_remove` → Social 将 post 置为 removed；`chat_send_restrict` → Chat 拒绝发送）。
- `enforcement_action` 表示**平台处罚事实**，不表示远端业务表状态；访问控制由业务域自己实施。
- 跨域对象只保存稳定逻辑 ID（`subject_domain + subject_type + subject_id`），不反向把业务数据搬进 `trust` schema。
- Trust 不拥有 Social Follow / Block / Match、Chat Conversation / Message、Commerce Wallet / Ledger / Order、Rewards 规则。
- Report / Evidence / Decision / Enforcement 历史 / Appeal 历史**不物理删除**。

## 数据库状态

- 治理链路 6 表：**逻辑模型 `frozen`**（本会话全域审计最终确认定稿，会话结论为「可以正式冻结」，见 [D-090/D-091](../../governance/design-register.md)）。
- 物理约定（`uuid` 主键 / 域内真实 FK / 跨域只存 logical UUID 不建 FK）：**`frozen`，冲突已由 [ADR-018](../../adr/ADR-018-global-database-design-principles-final.md) 裁决为全局标准写法**（[D-092](../../governance/design-register.md) 已关闭），DDL 现为合规。
- 真人认证（Verification）子域：`designing`（[D-094](../../governance/design-register.md)）。
