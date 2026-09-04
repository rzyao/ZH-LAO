# 关口审查——研究阶段

> 功能：`chinese-lao-content-hierarchy`  
> 阶段：研究  
> 风险：低（确定性路由建议自动推荐，但仍需人工批准）  
> 审查版本：`04d988db67babef9cce9c481ce606b5ce2fbae61`

## 发现

- **F-001** · ⚠️ 高 · `content/database` · 中文音节和拼音到音节的有序关系没有规范表、内容类型、字段或迁移契约，产品规格不能将其视为已经实现。
- **F-002** · ⚠️ 高 · `content/database` · “中文和老挝语不能共用表”存在边界歧义：语言结构表已经分离，但 `contents` 与 `content_revisions` 是有意共享的 Content 基础设施。若禁止一切共享表，将与冻结的 D-147/D-150 架构冲突。
- **F-003** · ⚠️ 中 · `delivery` · 当前只实现老挝语字母管理；老挝语音节、词语、句子和全部中文管理仍属于待交付范围。

## 已审查证据

- `research/competitors.md`
- `research/ux-patterns.md`
- `research/codebase-analysis.md`
- `research/README.md`

## 建议

批准研究阶段，并在任何技术规划前将 F-001、F-002 作为明确产品决策解决。F-003 是正常交付差距，不应因此改变功能定义。

## 完整验证发现（2026-09-04）

- **F-004** · 严重 · `source: verify-full` · `layer: 1,7` · `raised@6fa3b20`——T011 与 JRN-001—JRN-005 尚无真实浏览器操作旅程测试；现有测试只覆盖路由可访问和基础键盘焦点。
- **F-005** · 严重 · `source: verify-full` · `layer: 8` · `raised@6fa3b20`——审核发布页未使用设计映射要求的 ConfirmDialog，发布按钮直接执行。
- **F-006** · 严重 · `source: verify-full` · `layer: 3,7,10` · `raised@6fa3b20`——审核发布页未展示版本差异与结构化发布阻塞项，US-005、FR-003、FR-006 实现不完整。
- **F-007** · 警告 · `source: verify-full` · `layer: 1,3,7,10` · `raised@6fa3b20`——`traceability.yml` 没有 `rows[]`，缺少需求到代码与测试的实时机器可读映射。
- **F-008** · 警告 · `source: verify-full` · `layer: 4,6` · `raised@6fa3b20`——产品规格和索引的文档状态仍为“草稿”，与已批准生命周期不一致。
- **F-009** · 警告 · `source: verify-full` · `layer: 7,8` · `raised@6fa3b20`——浏览器无障碍测试未执行配置要求的 axe WCAG-AA 检查。

### 建议的规范更新

无。上述发现应通过实现与证据补齐，不应降低既有产品规格。

## 完整验证复验结论（2026-09-04）

- **F-004 已解决：**JRN-001—JRN-005 已有真实浏览器操作测试，步骤与 EDGE 均登记到追溯矩阵。
- **F-005 已解决：**类别页和审核发布页均使用 ConfirmDialog 执行发布确认。
- **F-006 已解决：**审核发布页可打开版本比较，并在失败后持续展示结构化发布阻塞项。
- **F-007 已解决：**`traceability.yml` 已补齐 5 行实时需求链和逐步旅程测试映射。
- **F-008 已解决：**产品规格及索引状态已改为“已批准”。
- **F-009 已解决：**12 个内容页面的主内容区域均执行 axe WCAG-AA 自动检查。

复验结论：0 个严重问题，0 个警告，完整验证通过。
