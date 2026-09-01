---
feature_id: real-person-verification
title: 真人认证提交
portfolio_status: pending_decision
domain:
- trust
- identity
- social
mobile_pages: []
admin_pages: []
delivery_notes:
- TRUST_VERIFICATION_DESIGN
---

# 真人认证提交

## 功能概览

Portfolio Status：`pending_decision`。

当前仓库只冻结了真人认证的**跨域责任边界**：Trust & Safety 负责审核认证材料并产生 verification result；Identity 继续拥有用户/根账户状态；Social 只能消费明确的认证结果用于资格判断。真人认证的详细 Table / State Machine / API / Media Workflow 尚未冻结。

本 Feature 不得自行把真人认证映射为 `Report → Moderation Case → Evidence → Decision → Enforcement → Appeal` 六事实链，也不得复用其中任何表来“临时实现”认证。
