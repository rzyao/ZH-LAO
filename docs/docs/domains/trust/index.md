---
status: baseline
last_updated: 2026-08-30
source_conversation_id: 6a93401c-51bc-83ea-aa6e-ac314a5af8c8
source_share_url: https://chatgpt.com/share/6a93401c-51bc-83ea-aa6e-ac314a5af8c8
---

# Trust & Safety 域

Trust & Safety 负责安全治理链路：举报 → 审核案件 → 证据 → 审核决定 → 安全处置 → 申诉。它**不拥有**被审核业务对象本身（资料、动态、会话、消息、订单、礼物、奖励），只引用其稳定逻辑 ID，并只产生治理处置与处置历史。

## 子域与实体（本会话定稿）

治理链路 6 表（逻辑模型 `baseline`，见 [数据库](database.md)）：

| 表 | 职责 |
| --- | --- |
| `trust.reports` | 不可变的用户举报事实 |
| `trust.moderation_cases` | 统一审核工作流（举报 / 发布前 / 巡检 / AI 检测 / 系统规则） |
| `trust.moderation_evidence` | 审核证据及不可变快照 |
| `trust.moderation_decisions` | 审核最终判定（不可变） |
| `trust.enforcement_actions` | 安全处置 / 处罚指令 |
| `trust.appeals` | 被处罚用户的申诉及复核结果 |

> 旧实体名 `ReviewTask` / `ReviewDecision` / `ModerationAction` / `Restriction` / `Ban` / `UserBlock` 已被上述 6 表模型取代（`superseded`，见本节）。其中 `UserBlock` 归 Social `social_blocks`（[D-034](../../governance/design-register.md)）。

## 真人认证（Verification）子域 — `designing`

本会话聚焦治理链路，**未重新设计**真人认证。原 `VerificationCase` / `VerificationMedia` 实体仍为 `designing`，表细节待后续会话。Trust 对真人认证的职责边界不变：审核认证资料、产出认证结果，但用户根状态仍归 Identity。

## 业务基线

```text
Social Profile + Verification Media → Verification Case
→ Manual Review → Approved/Rejected → Social Eligibility

举报/发布前/AI检测 → Moderation Case → Evidence → Decision
→ Enforcement Action（经领域事件由属主域执行）→ Appeal
```

首期人工审核；后续演进为 AI 辅助，再到自动审核与人工复核。自动化不改变 Verification / Moderation 业务边界。

Account Status 与 Capability Restriction 分离：用户可保持 `active`，但被禁止聊天、进入社交、发布动态或 Follow。用户主动 Block 的当前关系事实为 Social 的 `social_blocks`；Trust & Safety 的 Restriction / Enforcement 可跨域限制 Discover、Follow、公开互动和 Chat，并保留完整处置历史。

## 域边界（不可违反）

- Trust 只产生治理处置事实，**不直接 `UPDATE identity.* / social.* / chat.* / commerce.* / rewards.*`**（T&S-12）。
- 内容移除 / 限制等处置经领域事件由属主域消费后自行变更自身状态（例如 `content_remove` → Social 将 post 置为 removed；`chat_send_restrict` → Chat 拒绝发送）。
- 跨域对象只保存稳定逻辑 ID（`subject_type + subject_id`），不反向把业务数据搬进 `trust` schema。

## 数据库状态

- 治理链路 6 表：**逻辑模型 `baseline`**（本会话审计定稿，会话结论为可冻结）；**物理约定（`uuid` 主键 / 跨域不建 FK）`designing`，待主会话裁决（与 [D-077/D-078](../../governance/design-register.md) 同源冲突；Trust 专属条目见 [D-092](../../governance/design-register.md)）**。
- 真人认证（Verification）子域：`designing`。
