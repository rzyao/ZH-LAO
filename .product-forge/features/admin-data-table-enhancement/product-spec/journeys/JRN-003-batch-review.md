# JRN-003：确认并跟踪异步批量审核

> Actor：内容管理员｜Stories：US-004、US-005｜入口：已全量选择的字母列表

## Happy path

| Step | Action | UI | Expected result | Contract |
| --- | --- | --- | --- | --- |
| STEP-006 | 选择批量动作 | CMP-Button | 显示动作、数量、范围和确认 | API-LettersSelectionPreview |
| STEP-007 | 填写原因（如需要）并确认 | CMP-Dialog, CMP-Input, CMP-Button | 任务开始并返回任务标识 | API-LettersBatchStart |
| STEP-008 | 查看任务结果 | CMP-DataTable | 显示逐项成功、失败、跳过并刷新 | API-LettersBatchTask |

## Edges

| Edge | Case | Given / When / Then | Priority |
| --- | --- | --- | --- |
| EDGE-004 | 缺少原因 | GIVEN 驳回/删除 / WHEN 确认 / THEN 阻止提交并提示原因必填 | P1 |
| EDGE-005 | 部分记录失效 | GIVEN 状态/权限变化 / WHEN 任务执行 / THEN 继续其他记录并报告原因 | P0 |

## E2E

- Runner：`playwright-cli`；Smoke：是。
