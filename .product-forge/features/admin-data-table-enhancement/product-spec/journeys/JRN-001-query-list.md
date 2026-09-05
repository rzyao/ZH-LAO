# JRN-001：查询并浏览老挝字母审核列表

> Actor：内容管理员｜Stories：US-001、US-002｜入口：`/content/lo/letters`

## 前置条件

- 管理员已认证并有字母列表读取权限。

## Happy path

| Step | Action | UI | Expected result | Contract |
| --- | --- | --- | --- | --- |
| STEP-001 | 打开列表 | CMP-DataTable | 加载后呈现服务端分页结果 | API-LettersQuery |
| STEP-002 | 输入关键词、选择筛选和排序 | CMP-Input, CMP-Select | URL 更新、页码重置、结果更新 | API-LettersQuery |
| STEP-003 | 调整显示列并翻页 | CMP-DropdownMenu, CMP-DataTablePagination | 操作列保持显示并可浏览分页 | API-LettersQuery |

## Edges

| Edge | Case | Given / When / Then | Priority |
| --- | --- | --- | --- |
| EDGE-001 | 无匹配 | GIVEN 无匹配 / WHEN 返回 / THEN 显示无匹配并可清除筛选 | P1 |
| EDGE-002 | 请求失败 | GIVEN 请求失败 / WHEN 重试 / THEN 保留条件并重新请求 | P1 |

## E2E

- Runner：`playwright-cli`；Smoke：是。
