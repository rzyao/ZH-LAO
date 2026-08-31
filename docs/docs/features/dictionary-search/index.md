---
feature_id: dictionary-search
title: 词典搜索
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
    - /development/05-content/CONTENT_DESIGN_AUDIT.md
    - /development/05-content/CONTENT_API.md
---

# 词典搜索

## 功能概览

Portfolio Status：`active`。

词典查询与搜索的 canonical 定义属于 Content；Learning Tools 消费 Content 的词典能力，不另建一套词典搜索事实。搜索历史是独立的 Learning 用户事实，由 `dictionary-history` Feature 负责。

## 设计

状态：done

范围：覆盖中文 / 老挝语词典的 exact lookup 与 bounded search。V1 搜索范围由 Content 冻结为中文词的简体 / 繁体 / 拼音与老挝语词的文本 / 罗马化，排序为 exact > prefix > trigram similarity；HTTP 只暴露稳定 UUID 与 opaque cursor。Learning 不直接 SQL `content.*`，也不重新实现词典 ranking。

Stage / Artifact：[Content HTTP/API Contract](/development/05-content/CONTENT_API.md) 冻结 `/api/v1/content/dictionary/lookup` 与 `/api/v1/content/dictionary/search`；[Content Design Audit](/development/05-content/CONTENT_DESIGN_AUDIT.md) 完成 Knowledge / Dictionary grounding，并明确实际 dictionary search 由 Content 持有。

Gate / Evidence：[Content Design Audit](/development/05-content/CONTENT_DESIGN_AUDIT.md) 记录 `CONTENT_DESIGN_GATE = PASS`、`Dictionary Contract = FROZEN`、`Runtime API = FROZEN`。

下一步：由 Content Backend 执行任务实现冻结的 dictionary routes / service / repository，并在实现 Gate 后再进入 Mobile 与 Learning history 联调。当前远程 `apps/backend/src/modules/` 尚无 `content` 模块，因此本页不把 Backend 设计事实写成实现完成。

## Backend

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## Admin

状态：na

不适用：当前功能不需要该交付端；词典内容运营属于独立的 Content 管理 Feature，不属于用户词典搜索交付端。

## Mobile

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## 集成

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## 验收

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。
