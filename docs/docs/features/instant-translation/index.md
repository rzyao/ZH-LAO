---
feature_id: instant-translation
title: 即时中老翻译
portfolio_status: active
domain:
  - learning
  - content
  - identity
status:
  design: done
  backend: todo
  admin: na
  mobile: todo
  integration: todo
  acceptance: todo
mobile_pages: []
admin_pages: []
evidence:
  design:
    - /development/06-learning/LEARNING_DESIGN_AUDIT.md
    - /development/06-learning/LEARNING_USE_CASES.md
    - /development/06-learning/LEARNING_API.md
---

# 即时中老翻译

## 功能概览

Portfolio Status：`active`。

即时翻译是 Learning 的 authenticated runtime user capability；Content 持有的是 canonical teaching translation，不把一次用户即时翻译请求提升为 Content canonical fact。

## 设计

状态：done

范围：V1 只支持 `zh -> lo` / `lo -> zh`，sourceText 为 1..1000 Unicode code points。客户端不能选择 provider / model；服务端创建独立 translation request，返回 opaque `translationToken`，再以 token + 当前 AuthContext 查询 pending / processing / succeeded / failed 结果。source/result plaintext 不进入普通日志、outbox 或默认 Admin。当前 contract 不提供 translation history list。

Stage / Artifact：[Learning Use Cases](/development/06-learning/LEARNING_USE_CASES.md) 的 `LRN-R24 RequestTranslation` / `LRN-R25 GetTranslationRequest`；[Learning HTTP/API Contract](/development/06-learning/LEARNING_API.md) 的 Runtime translation contract；[Learning Design Audit](/development/06-learning/LEARNING_DESIGN_AUDIT.md) 的 Translation audit。

Gate / Evidence：[Learning Design Audit](/development/06-learning/LEARNING_DESIGN_AUDIT.md) 记录 `LEARNING_DESIGN_GATE = PASS`、`Runtime Translation Contract = FROZEN`、HTTP API = FROZEN。

下一步：在 Learning Backend execution 中实现 translation request lifecycle、opaque owner token、provider adapter / worker、rate limit 与 retention cleanup，并保持 provider/model、隐私和 ownership contract。当前远程 `apps/backend/src/modules/` 尚无 `learning` 模块，因此 Backend 仍保持 todo。

## Backend

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## Admin

状态：na

不适用：当前 Feature 是 learner runtime 翻译能力；frozen Learning Admin support 默认不暴露 translation plaintext，也没有运行时翻译管理端。

## Mobile

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## 集成

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## 验收

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。
