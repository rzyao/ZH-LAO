---
status: active
last_updated: 2026-08-31
---

# AI 开发阶段模型

一个 AI Stage 是可独立执行的工作单元，拥有明确输入、输出、Gate 或报告。每个 Stage 必须归属一个 Feature 和一个 Lane：

```yaml
feature_id: login
lane: mobile
stage_id: LOGIN-MOBILE-IMPLEMENT
```

## Feature Page 与 Matrix

[Feature Page](/features/) 是功能级唯一人工维护页面。每个页面必须按固定顺序保留六个模块：

```text
设计 → Backend → Admin → Mobile → 集成 → 验收
```

各 Lane 的人工状态只允许 `todo`、`active`、`blocked`、`done`、`na`。`blocked` 必须记录原因；`done` 必须指向 Gate 或完成证据。

`DOMAIN_LIFECYCLE_MATRIX.md` 是从 Feature Page Frontmatter 派生的全局视图，不保存第二套 Lane 状态。矩阵的功能名跳转到 Feature Page 顶部，任一 Lane 跳转到该 Feature 的对应章节；Stage 名与细节只在 Feature Page 和开发工件中展示。

矩阵列固定为“领域、功能、设计 AI、Backend AI、Admin AI、Mobile AI、集成 AI、验收 AI”。领域来自 Feature Page 的 `domain` 元数据并链接到对应 canonical Domain 页面；多领域 Feature 只保留一行，以 `/` 并列显示。

## Development Node

Development Node 仍可作为 `feature_id × lane` 的逻辑模型，但不是页面。详见 [Development Node 模型](DEVELOPMENT_NODE_MODEL.md)。

## 校验

```text
python scripts/validate_feature_pages.py --write
python scripts/generate_ai_stage_matrix.py --check
```

校验会检查 Feature 覆盖率、六个模块、状态、阻塞原因、锚点所需章节，以及 Mobile/Admin 页面引用。
