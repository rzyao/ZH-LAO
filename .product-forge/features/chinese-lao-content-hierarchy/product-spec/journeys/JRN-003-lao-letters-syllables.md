# JRN-003: 维护老挝语字母与音节

> 参与者：获授权内容运营人员｜用户故事：US-003｜入口：老挝语内容 → 字母管理

| 步骤 | 操作 | 界面 | 预期结果 | 契约 |
| --- | --- | --- | --- | --- |
| STEP-005 | 创建或派生字母工作版本 | CMP-DataTable, CMP-Dialog | 复用既有字母工作流 | API-loLetterDraft |
| STEP-006 | 按顺序编辑音节字母组成 | CMP-DataTable, CMP-Dialog | 不合法或未发布依赖清晰标记 | API-loSyllableDraft |

| 边界 | 前提 / 操作 / 结果 | 优先级 |
| --- | --- | --- |
| EDGE-003 | 前提：组成不完整 / 操作：提交审核 / 结果：拒绝并标示缺项 | P0 |

端到端测试：`playwright-cli`｜冒烟测试：是。
