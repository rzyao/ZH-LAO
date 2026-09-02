---
status: baseline
last_updated: 2026-09-02
---

# 产品开发全景文档契约

本契约规定《ZH-LAO 产品开发全景》怎样汇总事实，避免它变成第二套产品规格或第二张会漂移的进度表。

## 功能页最小结构

每个能力条目应尽量包含：

| 字段 | 含义 |
| --- | --- |
| `feature_id` | 与 `docs/docs/developer/features/<feature>.md` 一致的稳定标识 |
| 用户价值 | 用户或运营人员为什么需要它 |
| 使用者 | 学习者、社交用户、内容人员、运营人员等 |
| 用户流程 | 可观察的主要步骤和结果 |
| 范围 | 本功能包含与明确不包含的内容 |
| 参与系统 | Domain、Backend、Admin、Mobile、基础设施链接 |
| 交付状态 | 仅引用现有 Feature/Stage/Gate 证据的摘要 |
| 证据入口 | Feature Page、报告、测试、代码或 Spec 的链接 |
| 未决事项 | 直接链接 `open-questions` 或明确标注未知 |

功能页可以解释端到端价值，但不得复制完整字段表、API schema、Domain 状态机、Public Contract 或 Blueprint。

## 状态词汇

- 产品事实使用仓库既有 `baseline`、`frozen`、`designing`、`deferred`、`illustrative`、`superseded`。
- 交付状态使用现有进度与 Gate 词汇，如 `NOT_STARTED`、`READY`、`IN_PROGRESS`、`BLOCKED`、`COMPLETE`，Gate 使用 `PASS`、`FAIL` 等既有值。
- Feature portfolio 状态读取 canonical `feature-manifest.json` 与生成的 `feature-catalog.json`；不得在全景中另建一套固定状态矩阵。
- “已设计”不等于“已实现”，“Gate PASS”只表示对应 Gate 的范围，不自动表示整项产品能力可用。

## 证据优先级

```text
产品 / Domain / 架构事实
  → developer/reference/product/、domains/、architecture/、ADR、governance
物理数据库事实
  → database/migrations/ 及数据库检查/报告
执行与完成证据
  → 迁移时证据快照、代码、测试与 CI
机器执行规格
  → .specify/ 与 specs/
全景页面
  → 只做聚合、摘要和链接
```

## 明确禁止

- 不得仅从 Spec Kit 的 `spec.md`、任务勾选或规划文字推断功能已经实现。
- 不得用代码“更合理”为理由覆盖产品或 Domain authority。
- 不得把示例、延期事项或未决设计写成已承诺能力。
- 不得创建平行的 `v2`、`final` 状态表；需要变更时更新现有事实源并更新全景链接。

## 更新要求

全景页面更新时必须重新检查来源链接、状态日期和未决事项；发现冲突时停止汇总并回到对应 authority 解决，不在此页自行裁决。迁移快照只能提供历史背景，不能恢复已退役的调度权限。
