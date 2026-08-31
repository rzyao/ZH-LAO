---
status: inventory-bootstrap
last_updated: 2026-08-31
repository_commit_audited: df1a21bfdf1d50372ff6bce7902b9757e478270d
---

# Feature Inventory Bootstrap Audit

本报告记录 AI 开发阶段矩阵的第一次全产品 Feature Inventory 扩展。

## 结论

```text
Feature Inventory = 102
Domain = 11
System/Foundation Group = 4
portfolio_status:
  active     = 79
  deferred   = 17
  pending_decision = 6
```

这些数量描述的是**已识别的用户/运营端到端能力**，不是 102 个已经承诺立即开发的 Task。

## Grounding 范围

本次至少覆盖：

- `product/product-overview.md`
- `product/business-model.md`
- `product/feature-rollout.md`
- Identity / Content / Learning / Audio Production
- Social / Chat / Commerce / Rewards
- Trust & Safety / Operations / Platform
- Admin 当前导航与已建立实施入口
- Mobile Foundation 的真实能力与 future seams
- `governance/open-questions.md`
- 当前 AI Stage Registry / Task Manifest / Gate / Report

## Inventory 规则

纳入：

1. 用户能直接完成的产品能力；
2. Operator 能直接完成的后台能力；
3. 能独立形成 Feature Design / UI / Integration / Acceptance Prompt 的交付切片；
4. 产品文档明确要求、但冻结 Domain 仍待补设计的能力；
5. Governance 明确 deferred 的未来能力。

不把下面内容单独伪造成 Product Feature：

- 单张数据库表；
- Repository / Service / Worker 等纯内部实现组件；
- 仅用于性能优化的缓存/索引；
- 明确排除且没有 deferred 产品意图的能力；
- 设计文档举例但没有形成产品承诺的奖励场景。

## 冲突可见性

发现的范围冲突不会被隐藏。例如：

- Chat 产品范围提到 Voice Message / Chat Translation / Speech-to-Text；
- 当前冻结 Chat V1 模型只覆盖 TEXT / IMAGE，并明确把 Voice / Translation 排除；
- 因此这三项进入 Matrix，但 `portfolio_status = pending_decision`，由 `CHAT_SCOPE_DECISION` 阻塞。

Social 的“距离筛选 / 模糊距离”也保留为待裁决项，因为产品范围包含距离体验，而当前 Social 数据模型只冻结粗粒度地区信息，尚不足以自行推导精确位置方案。

## Deferred 可见性

以下类型不会再从矩阵消失；它们在 Inventory 与 Feature Page 保留 `portfolio_status = deferred`，其适用 Lane 在 Matrix 概览为 `○ 未启动`，具体延期语义以独立 Badge 展示：

- 推送通知体系；
- 广告变现；
- Admin 数据总览；
- 游客云同步 / Guest Data Migration；
- Platform 高级灰度与配置回滚；
- 错题本 / 高级学习权益；
- Chat Receipt / Reaction / own-delete / Group Chat；
- 社交会员 / Entitlement、优惠券、Creator Earnings / Withdrawal / Settlement；
- 扩展奖励资产类型等。

## Formal Feature Doc Policy

Inventory 中每一个正式 Feature 都必须有一个人工维护的 canonical Page，即：

```text
FEATURE_INVENTORY.features = 102
docs/docs/features/<feature_id>/index.md = 102
```

Feature 尚未启动、延期或待裁决，都不能成为缺页理由。最小页面仍必须包含功能定位、六个固定 Lane、状态与不适用/阻塞原因；页面 Frontmatter 的 `portfolio_status` 必须与本 Inventory 一致，业务状态不得嵌入 `title`；只有进入正式清单才创建页面，数据库表、Repository、Worker 等内部实现不单独伪造成 Feature。

当前正式 Feature Page 覆盖率为 `102 / 102`。后续新增正式 Feature 时，必须在同一变更中补齐页面、Frontmatter、六个章节和派生索引。

## 后续维护

任何 Product / Domain / Governance 变化如果：

- 新增用户能力；
- 删除/延期能力；
- 解决 pending-decision scope；
- 改变 primary / participating Domain；
- 产生新的 READY Task；

Dispatcher / Reconciliation 必须同步更新 `FEATURE_INVENTORY.json` 与必要的 `AI_STAGE_REGISTRY.json` 详细 Stage。CI 负责校验两者与 Matrix renderer 合法性。
