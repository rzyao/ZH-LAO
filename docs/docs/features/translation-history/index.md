---
feature_id: translation-history
title: 翻译历史
portfolio_status: active
domain:
  - learning
  - content
  - identity
status:
  design: todo
  backend: todo
  admin: na
  mobile: todo
  integration: todo
  acceptance: todo
mobile_pages: []
admin_pages: []
---

# 翻译历史

## 功能概览

Portfolio Status：`active`。

该 Feature 当前仍在正式 Portfolio 中，但远程最新 Learning frozen V1 **没有冻结用户可浏览的翻译历史能力**。`translation_requests` 的持久化、处理状态与 retention 是即时翻译执行事实，不等于已经存在“翻译历史”产品契约。

## 设计

状态：todo

当前事实：[Learning Use Cases](/development/06-learning/LEARNING_USE_CASES.md) 只把 `LRN-R24 RequestTranslation` 与 `LRN-R25 GetTranslationRequest` 列为 REQUIRED；[Learning HTTP/API Contract](/development/06-learning/LEARNING_API.md) 明确写明 `No V1 list/history endpoint`。因此本任务不从 `translation_requests` 表、30 天 retention 或单次 translation token 推导历史列表、分页、删除、同步等未冻结语义。

下一步：如该 Portfolio Feature 要进入实现，需由独立 Learning canonical design 任务先确定历史可见范围、分页 / retention UX、隐私与删除语义，并形成对应 Stage / Gate。完成该设计前，本页 Design、Backend、Mobile、Integration 与 Acceptance 均保持 todo。

## Backend

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## Admin

状态：na

不适用：当前 Feature 面向 learner，且 frozen Learning Admin support 默认排除 translation plaintext。

## Mobile

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## 集成

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## 验收

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。
