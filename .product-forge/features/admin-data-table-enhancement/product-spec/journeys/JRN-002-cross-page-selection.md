# JRN-002：跨页选择当前筛选结果

> Actor：内容管理员｜Stories：US-003｜入口：待审核字母列表

## Happy path

| Step | Action | UI | Expected result | Contract |
| --- | --- | --- | --- | --- |
| STEP-004 | 选择当前页全部记录 | CMP-Checkbox | 批量栏显示本页选择数量 | API-LettersQuery |
| STEP-005 | 显式选择当前筛选结果全部 | CMP-Button | 显示查询范围和全量数量 | API-LettersSelectionPreview |

## Edges

| Edge | Case | Given / When / Then | Priority |
| --- | --- | --- | --- |
| EDGE-003 | 结果变化 | GIVEN 选择范围过期 / WHEN 请求预览 / THEN 选择失效并要求重新选择 | P0 |

## E2E

- Runner：`playwright-cli`；Smoke：是。
