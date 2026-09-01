---
feature_id: social-profile
title: 社交资料创建与编辑
portfolio_status: active
domain:
- social
- identity
- trust
mobile_pages: []
admin_pages: []
delivery_notes:
- 已冻结的数据模型与业务边界见本页设计 实际 Stage / Gate；公共应用 Contract 与正式 Social Design Gate 仍在收口。
---

# 社交资料创建与编辑

## 功能概览

Portfolio Status：`active`。

本 Feature 负责用户主动进入社交场景后创建、编辑并维护唯一 Social Profile。Social Profile 是独立公开社交身份，不复用 Identity Basic Profile，也不拥有账号认证、平台处罚或举报事实。

当前仓库已经冻结 Profile 的 canonical 数据语义并落盘 Social migration；但正式 `SOCIAL-DESIGN` 工作流尚未形成 PASS Gate，也没有 F10 专属 Backend / Mobile 实现，因此不能把“数据设计完成”写成端到端交付完成。
