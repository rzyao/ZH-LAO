# 测试用例：管理端通用数据表增强

> 供 Phase 8B 按步骤执行。`URL` 默认为 `http://localhost:15173/content/lo/letters`。

## 冒烟

| ID | 场景 | 操作与断言 | 优先级 | 覆盖 |
| --- | --- | --- | --- | --- |
| TC-SMK-001 | 列表可用 | 打开 URL → 等待列表 → 断言工具栏、表格与分页出现 | P0 | US-001 / JRN-001 |
| TC-SMK-002 | 固定操作列 | 打开列设置 → 隐藏可选列 → 断言操作列仍可见且 sticky | P0 | US-002 / JRN-001 |
| TC-SMK-003 | 选择升级 | 勾选当前页 → 点击“选择全部匹配结果” → 断言范围与总数 | P0 | US-003 / JRN-002 |
| TC-SMK-004 | 批量确认 | 选择记录 → 选择批准 → 断言确认框包含动作、范围、数量 | P0 | US-004 / JRN-003 |
| TC-SMK-005 | 结果可追踪 | 提交任务 → 打开任务详情 → 断言汇总和逐项结果入口 | P0 | US-005 / JRN-003 |

## E2E

### TC-E2E-001：查询、排序、分页与列设置

**Journey:** JRN-001 | **Steps:** STEP-001 至 STEP-003 | **Edge:** — | **Story:** US-001, US-002

| # | 操作 | playwright-cli 等价 |
| --- | --- | --- |
| 1 | 打开带查询、筛选、排序、页码的 URL | `goto <URL>?q=...&page=2` |
| 2 | 断言输入框、筛选值、结果和第 2 页 | `snapshot` |
| 3 | 打开列菜单，隐藏“字母类型” | `click role=button[name=列]` → `click role=menuitemcheckbox[name=字母类型]` |
| 4 | 断言操作列固定，点击下一页 | `snapshot` → `click role=button[name=下一页]` |
| 5 | 修改搜索词 | `fill role=textbox[name=搜索字母] <值>` |
| 6 | 断言 URL 页码重置为 1，刷新后条件仍在 | `snapshot` → `reload` |

**预期：** 服务端请求带受控参数；非关键列可隐藏；条件在 URL 中恢复。

### TC-E2E-002：无匹配结果

**Journey:** JRN-001 | **Steps:** STEP-002 | **Edge:** EDGE-001 | **Story:** US-001

1. 输入没有匹配的关键词；2. 等待响应；3. 断言“无匹配”而非加载/错误态；4. 点击清除筛选；5. 断言结果恢复。

### TC-E2E-003：列表请求失败后重试

**Journey:** JRN-001 | **Steps:** STEP-003 | **Edge:** EDGE-002 | **Story:** US-001

1. Mock 列表接口返回 500；2. 断言错误态和重试按钮；3. 点击重试；4. Mock 成功响应；5. 断言原条件保留且列表恢复。

### TC-E2E-004：本页全选并升级至当前筛选结果

**Journey:** JRN-002 | **Steps:** STEP-004 至 STEP-005 | **Edge:** — | **Story:** US-003

1. 打开跨两页的待审核列表；2. 勾选表头复选框；3. 断言批量栏显示本页数量；4. 点击升级；5. 断言预览返回的总数和查询范围。

### TC-E2E-005：过期选择被拒绝

**Journey:** JRN-002 | **Steps:** STEP-005 | **Edge:** EDGE-003 | **Story:** US-003

1. 建立 query-all 选择；2. 改变筛选/排序；3. 请求预览或提交；4. 断言旧选择清除并要求重新选择，且没有创建任务。

### TC-E2E-006：确认、提交并查看完成结果

**Journey:** JRN-003 | **Steps:** STEP-006 至 STEP-008 | **Edge:** — | **Story:** US-004, US-005

1. 建立有效选择；2. 选择“审核通过”；3. 断言确认框显示动作、范围、数量；4. 确认；5. 断言取得 task ID；6. 等待终态；7. 断言成功/失败/跳过汇总并刷新列表。

### TC-E2E-007：驳回/删除必须填写原因

**Journey:** JRN-003 | **Steps:** STEP-007 | **Edge:** EDGE-004 | **Story:** US-004

1. 建立有效选择；2. 选择驳回或删除；3. 留空原因并确认；4. 断言校验信息且未发起 POST；5. 填写原因；6. 断言可提交。

### TC-E2E-008：部分完成与失败重试

**Journey:** JRN-003 | **Steps:** STEP-008 | **Edge:** EDGE-005 | **Story:** US-004, US-005

1. Mock 一个任务的成功、失败与跳过条目；2. 查看详情；3. 断言逐项安全原因；4. 点击重试失败项；5. 断言成功/跳过项不会重复执行，列表刷新。

## API、单元、集成与回归索引

| 类别 | ID | 场景 | 覆盖 |
| --- | --- | --- | --- |
| API | TC-API-001 | `GET /lo/letters` 受控查询、稳定分页 | FR-010/011 |
| API | TC-API-002 | 查询无效字段/页大小超限/无权限 | FR-010/011 |
| API | TC-API-003 | `POST selection-preview` 成功与过期选择 | FR-014/021 |
| API | TC-API-004 | `POST batch-tasks` 提交批准 | FR-015/017 |
| API | TC-API-005 | 提交驳回/归档缺原因拒绝 | FR-016 |
| API | TC-API-006 | 非法动作、状态或权限逐项拒绝 | FR-015/020 |
| API | TC-API-007 | 重复提交与陈旧 hash/count | FR-017/021 |
| API | TC-API-008 | 任务列表权限、分页与历史 | FR-018 |
| API | TC-API-009 | 任务详情与逐项结果分页 | FR-018 |
| API | TC-API-010 | 仅失败项可重试 | FR-018/021 |
| UNIT | TC-UNIT-001..002 | `lo-letter-admin-query` 白名单/页码规范化 | FR-010/011 |
| UNIT | TC-UNIT-003..004 | `lo-letter-selection` 页内与 query-all 成员判断 | FR-013/014 |
| UNIT | TC-UNIT-005..006 | 批量状态计数、终态与失败恢复 | FR-017/018 |
| UNIT | TC-UNIT-007..008 | 原因必填与固定列不可隐藏 | FR-012/016 |
| INT | TC-INT-001 | Query use case ↔ PostgreSQL 排序/分页 | FR-010 |
| INT | TC-INT-002 | 选择预览 ↔ PostgreSQL 快照/hash | FR-014/021 |
| INT | TC-INT-003 | Batch start ↔ PostgreSQL 任务/条目创建 | FR-017 |
| INT | TC-INT-004 | Worker ↔ Content 状态机/审计 | FR-015/020 |
| INT | TC-INT-005 | worker 部分失败与独立事务恢复 | FR-017/018 |
| INT | TC-INT-006 | 任务查询/详情/重试 ↔ PostgreSQL | FR-018/021 |
| INT | TC-INT-007 | Admin API ↔ 操作权限契约 | FR-020 |
| REG | TC-REG-001 | 其他内容列表 URL 状态不回归 | 共享路由 |
| REG | TC-REG-002 | 通用 DataTable 客户端用法不回归 | 共享组件 |
| REG | TC-REG-003 | 选择变化不会影响其他列表 | 共享选择逻辑 |
| REG | TC-REG-004 | 既有内容审核动作/审计仍可用 | Content/Operations |
| REG | TC-REG-005 | 中字内容管理 E2E 仍通过 | 既有旅程 |

## 可访问性人工检查

对每个旅程：仅用键盘完成路径；检查复选框混合状态、对话框焦点回归、分页名称、状态消息和 400% 缩放。自动 axe 测试是最低门槛，不能替代人工检查。
