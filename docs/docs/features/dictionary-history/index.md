---
feature_id: dictionary-history
title: 词典搜索历史
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

# 词典搜索历史

## 功能概览

Portfolio Status：`active`。

词典搜索本身由 Content 执行；本 Feature 只负责 Learning 侧的已登录用户搜索历史事实，不复制词典内容、ranking 或 Content 查询实现。

## 设计

状态：done

范围：记录 authenticated learner 的一次词典查询意图 `queryText` 与可选 `selectedContentId`，并提供当前用户自己的 cursor history list。历史行没有 public row ID；`selectedContentId` 非空时由 Content 验证。搜索历史写入失败不得改变已经成功的 Content 搜索结果语义。当前设计冻结 180 天 / 每用户最多 500 条的可清理历史策略；匿名历史不属于 V1。

Stage / Artifact：[Learning Use Cases](/development/06-learning/LEARNING_USE_CASES.md) 的 `LRN-R22 RecordDictionarySearch` / `LRN-R23 ListDictionaryHistory`；[Learning HTTP/API Contract](/development/06-learning/LEARNING_API.md) 的 Dictionary history contract；[Learning Design Audit](/development/06-learning/LEARNING_DESIGN_AUDIT.md) 的 Dictionary history audit。

Gate / Evidence：[Learning Design Audit](/development/06-learning/LEARNING_DESIGN_AUDIT.md) 记录 `LEARNING_DESIGN_GATE = PASS`，Dictionary history audit = PASS，HTTP API = FROZEN。

下一步：在正式 Learning Backend execution 中实现 history repository / routes / retention cleanup，并通过 Content public capability 校验 `selectedContentId`。当前远程 `apps/backend/src/modules/` 尚无 `learning` 与 `content` 模块，因此 Backend 仍保持 todo。

## Backend

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## Admin

状态：na

不适用：当前 Feature 是 learner 私有历史；Learning frozen Admin support 默认不提供词典历史编辑能力。

## Mobile

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## 集成

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## 验收

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。
