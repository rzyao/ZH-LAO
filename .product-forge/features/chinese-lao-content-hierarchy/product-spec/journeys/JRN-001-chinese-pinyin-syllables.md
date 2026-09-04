# JRN-001: 维护中文拼音与中文音节

> 参与者：获授权内容运营人员｜用户故事：US-001｜入口：中文内容 → 拼音管理

| 步骤 | 操作 | 界面 | 预期结果 | 契约 |
| --- | --- | --- | --- | --- |
| STEP-001 | 打开拼音页并创建或选择拼音 | CMP-DataTable, CMP-Button, CMP-Dialog | 仅显示中文拼音和版本状态 | API-zhPinyinList, API-zhPinyinDraft |
| STEP-002 | 编辑中文音节的拼音组成 | CMP-DataTable, CMP-Dialog | 有序保存，不可关联老挝语内容 | API-zhSyllableDraft |

| 边界 | 前提 / 操作 / 结果 | 优先级 |
| --- | --- | --- |
| EDGE-001 | 前提：选择老挝语结构项 / 操作：保存 / 结果：服务端拒绝并定位错误 | P0 |

端到端测试：`playwright-cli`｜冒烟测试：是。
