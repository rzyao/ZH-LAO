---
status: baseline
last_updated: 2026-08-30
---

# Trust & Safety 域

Trust & Safety 负责社交资格、真人认证、审核案件、处置、跨域能力限制、封禁和申诉。

## 子域与实体

- Verification：VerificationCase、VerificationMedia。
- Review：ReviewTask、ReviewDecision。
- Report：Report。
- Moderation：ModerationCase、ModerationAction。
- Ban：Restriction、Ban。
- Appeal：Appeal。

## 业务基线

```text
Social Profile + Verification Media → Verification Case
→ Manual Review → Approved/Rejected → Social Eligibility
```

首期人工审核；后续演进为 AI 辅助，再到自动审核与人工复核。自动化不改变 Verification 业务边界。

Account Status 与 Capability Restriction 分离：用户可保持 `active`，但被禁止聊天、进入社交、发布动态或 Follow。用户主动 Block 的当前关系事实为 Social 的 `social_blocks`；Trust & Safety 的 Restriction/Moderation 可跨域限制 Discover、Follow、公开互动和 Chat，并保留完整处置历史。

## 数据库状态

实体和边界为 `baseline`；资格表达、审核状态机、证据保留、限制范围与期限、举报对象、申诉流程和字段均为 `designing`。
