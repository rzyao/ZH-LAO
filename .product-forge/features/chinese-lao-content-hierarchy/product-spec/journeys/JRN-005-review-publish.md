# JRN-005: 审核并发布内容版本

> 参与者：获授权审核或发布人员｜用户故事：US-005｜入口：中文或老挝语内容 → 审核发布

| 步骤 | 操作 | 界面 | 预期结果 | 契约 |
| --- | --- | --- | --- | --- |
| STEP-009 | 筛选待审版本并查看发布版差异 | CMP-DataTable, CMP-StatusBadge, CMP-Dialog | 显示关系差异与审计信息 | API-contentReviewQueue |
| STEP-010 | 审核、执行预检并确认发布 | CMP-ConfirmDialog, CMP-StatusBadge | 合法版本原子发布并审计 | API-contentReview, API-contentPublish |

| 边界 | 前提 / 操作 / 结果 | 优先级 |
| --- | --- | --- |
| EDGE-005 | 前提：依赖未发布或版本陈旧 / 操作：发布 / 结果：不发布并返回可跳转阻塞项 | P0 |

端到端测试：`playwright-cli`｜冒烟测试：是。
