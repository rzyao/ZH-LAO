---
feature_id: mastery-review
title: 掌握度与复习
portfolio_status: active
domain:
- learning
- content
- identity
source_migration: complete
last_updated: '2026-09-02'
last_verified_at: '2026-09-02'
delivery_evidence:
- docs/docs/developer/reference/contracts/learning/LEARNING_PRODUCT_SEMANTICS
- docs/docs/developer/reference/contracts/learning/LEARNING_USE_CASES
- docs/docs/developer/reference/contracts/learning/LEARNING_API
- docs/docs/developer/reference/evidence/learning/LEARNING_DESIGN_AUDIT
---

# 掌握度与复习

> 本页记录当前可追溯的产品范围与交付证据；组合状态不等于实现完成。

## 用户价值与功能说明

本能力定义为 **掌握度与复习**（`mastery-review`）。本页保留该能力的现有描述；如果现有资料没有明确用户价值，本页不自行补造。

## 使用者或受益者

当前资料没有足够证据来确认具体使用者。本页暂记为：**未明确**。已声明的参与页面：Mobile `未明确`；Admin `未明确`。

## 范围与边界

- 声明的 Domain：`learning`, `content`, `identity`
- 声明的 owns contracts：现有资料未明确
- 声明的 dependencies：现有资料未明确
- 详细包含/不包含边界以现有功能资料、Domain authority 和产品文档为准。

## 参与系统

| 系统 | 来源声明 | 本页判断 |
| --- | --- | --- |
| Product | `portfolio_status: active` | 产品组合状态，不等于实现完成 |
| Database | 当前资料未声明物理证据 | `not evidenced` |
| Backend | 当前资料未声明独立实现证据 | `not evidenced` |
| Admin | 未明确 | `not evidenced` |
| Mobile | 未明确 | `not evidenced` |
| Integration | 当前资料未声明独立集成证据 | `not evidenced` |
| Acceptance | 当前资料未声明 Feature Gate 证据 | `not evidenced` |

## 分层交付状态

| 层 | 状态 | 解释 |
| --- | --- | --- |
| 产品 | `active` | 页面声明的 portfolio 状态；`active` 不表示 implemented |
| 数据库 | `not evidenced` | 本页没有从 Feature Page 推断数据库完成 |
| Backend | `not evidenced` | 需要代码、测试、Gate 或 Report 的明确证据 |
| Admin | `not evidenced` | 需要真实页面、契约和验证证据 |
| Mobile | `not evidenced` | 需要真实页面、契约和验证证据 |
| Integration | `not evidenced` | 需要跨层真实集成证据 |
| Acceptance | `not evidenced` | 需要 Feature Gate / E2E / 验收证据 |

## 证据

已记录的 `delivery_evidence` 如下；路径已尽量转为可点击的当前文档路由，裸 Stage/Decision ID 仍保留为标识：

- [docs/docs/developer/reference/contracts/learning/LEARNING_PRODUCT_SEMANTICS](/developer/reference/contracts/learning/LEARNING_PRODUCT_SEMANTICS)
- [docs/docs/developer/reference/contracts/learning/LEARNING_USE_CASES](/developer/reference/contracts/learning/LEARNING_USE_CASES)
- [docs/docs/developer/reference/contracts/learning/LEARNING_API](/developer/reference/contracts/learning/LEARNING_API)
- [docs/docs/developer/reference/evidence/learning/LEARNING_DESIGN_AUDIT](/developer/reference/evidence/learning/LEARNING_DESIGN_AUDIT)

## 限制、阻塞与下一步

已记录的 `delivery_notes`：

- Learning implementation is blocked at LRN-00 because Content final implementation / CONTENT_GATE is not PASS.

- 本页默认不把 `active`、Spec、任务清单或页面存在推断为已实现。
- 下一步：由对应 Stage / Feature Gate 补充明确的分层证据，再更新本页生成输入或手工核验页。

## 功能规则与背景

# 掌握度与复习

## 功能概览

Portfolio Status：`active`。

本 Feature 覆盖 Learning V1 的内容掌握度与复习调度。Frozen contract 使用 `learning.content_mastery` 保存用户当前掌握状态，使用 `learning.content_reviews` 保存每 `(user, content)` 唯一的当前复习调度；当前状态不从 activity history 重算，也不把 FSRS / SM-2 等高级算法隐藏进现有 schema。

当前 learner API contract：

- `GET /api/v1/learning/mastery/{contentId}`
- `POST /api/v1/learning/mastery/resolve`
- `GET /api/v1/learning/reviews/due`
- `POST /api/v1/learning/reviews/{contentId}/results`

Canonical evidence：[Learning Product Semantics](/developer/reference/contracts/learning/LEARNING_PRODUCT_SEMANTICS)、[Learning Use Cases](/developer/reference/contracts/learning/LEARNING_USE_CASES)、[Learning API](/developer/reference/contracts/learning/LEARNING_API)、[Learning Design Audit](/developer/reference/evidence/learning/LEARNING_DESIGN_AUDIT)。
