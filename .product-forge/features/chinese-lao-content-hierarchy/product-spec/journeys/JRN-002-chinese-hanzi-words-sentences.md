# JRN-002: 维护中文汉字、词语与句子

> 参与者：获授权内容运营人员｜用户故事：US-002｜入口：中文内容 → 汉字管理

| 步骤 | 操作 | 界面 | 预期结果 | 契约 |
| --- | --- | --- | --- | --- |
| STEP-003 | 编辑汉字并查看中文音节关联 | CMP-DataTable, CMP-Dialog | 当前工作和发布版本清晰 | API-zhHanziDraft |
| STEP-004 | 编辑词语、句子的有序关系 | CMP-DataTable, CMP-Dialog | 关系顺序和反向引用可见 | API-zhWordDraft, API-zhSentenceDraft |

| 边界 | 前提 / 操作 / 结果 | 优先级 |
| --- | --- | --- |
| EDGE-002 | 前提：他人更新工作版本 / 操作：保存 / 结果：显示冲突并保留本地输入 | P1 |

端到端测试：`playwright-cli`｜冒烟测试：否。
