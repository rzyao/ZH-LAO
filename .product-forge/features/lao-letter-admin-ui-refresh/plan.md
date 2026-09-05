# 实施计划：字母管理 UI 优化

> 状态：变更后实施中｜轨道：`express`｜范围：`apps/admin` 前端表现层

## 已核对的边界

- 权威领域规则：老挝字母分类、排序、音频和审核发布规则保持不变。
- 目标实现：`apps/admin/src/features/content/structured/lo-letter-page.tsx`，路由 `/content/lo/letters`。
- 既有行为：URL 查询状态、服务端分页、排序、列偏好、行选择、批量任务、音频试听、加载/错误/空状态均已实现。
- 不创建数据模型、API、数据库迁移或新的权限能力。
- <!-- CR-002: 补齐字母管理 CRUD。 --> 既有通用 Content API 已授权创建、更新与派生工作草稿；“删除”只有异步 archive，不存在物理删除。

## 实施步骤

1. **强化页面概览与工作区层级**
   - 在 `lo-letter-page.tsx` 的内容区加入仅由现有查询数据派生的结果上下文（总数、活跃筛选状态）。
   - 为筛选区、表格区和批量操作/选中提示区建立一致的卡片边界、间距和标题层级。
   - 保留 `ListPageLayout` 标题、面包屑、URL 查询与所有现有回调。

2. **整理筛选与选择反馈**
   - 让搜索、筛选与“恢复默认列”在窄屏可换行，在宽屏保持紧凑工具栏。
   - 活跃筛选、后台刷新、已选范围继续使用文字和语义状态，不仅依赖颜色。
   - 不改变搜索防抖、查询参数或批量操作的触发条件。

3. **提升数据表状态的视觉一致性**
   - 在 `lo-letter-table.tsx` 为表格工作区及无结果清除入口采用现有组件令牌和聚焦样式。
   - 保留 `DataTable` 的列、固定操作列、横向滚动、排序、分页和选择行为。
   - 继续区分首屏加载、后台刷新、首次为空、筛选无结果和可重试错误。

4. **让批量任务只在当前操作时出现**
   - <!-- CR-001: 移除首页默认任务历史及其查询。 --> 仅在刚发起批量任务后展示既有任务详情面板。
   - 已选择记录时突出既有批量操作区；未选择时不展示无效主操作。
   - 不修改批量动作、二次确认、任务详情、重试、任务保留或权限检查。

5. **补齐回归与可访问性验证**
   - 扩展 `lo-letter-page.test.tsx`，断言新增上下文与现有状态标识不会丢失。
   - 运行针对性单测与 `pnpm typecheck`、`pnpm lint`、`pnpm build`（位于 `apps/admin`）。
   - 手动检查窄屏布局、键盘 Tab 焦点、浅/深主题，以及现有筛选、分页、批量任务入口。

6. **接入已授权的字母 CRUD 工作流** <!-- CR-002: 补齐字母管理 CRUD。 -->
   - 在 `lo-letter-page.tsx` 添加权限感知的新建入口和行级编辑入口；复用 `content.lo_letters.write`，不扩张权限。
   - 新建和保存通过现有 `structuredContentApi.create/update`，只提交 `character/letterType/letterClass/name/romanization/sortOrder` 快照字段；更新请求携带服务端返回的 `expectedLockVersion`。
   - 编辑当前 draft；已发布记录先调用 `derive-working`，再加载新草稿。归档继续只使用已有批量 archive 二次确认和必填原因，不接入 DELETE。
   - 增加针对新建、编辑/派生与归档语义的页面测试；运行 admin 类型检查、定向单测、lint 和构建。

## 组件映射

| 规格需求 | 目标路径 | 复用组件 |
| --- | --- | --- |
| FR-001、FR-002、FR-004 | `lo-letter-page.tsx` | `Button`、`Input`、`Badge` |
| FR-003、FR-005 | `lo-letter-table.tsx` | `DataTable`、`Table`、`Skeleton` |
| FR-006 | 两个目标文件及现有样式 | CSS 变量、现有焦点样式 |
| FR-007、FR-008 | `lo-letter-page.tsx`、`lo-letter-editor-dialog.tsx` | `Button`、`Dialog`、`Input`、`Label`、现有 Content API |
| FR-009 | `lo-letter-page.tsx`、`lo-letter-batch-actions.tsx` | 现有批量 archive 确认对话框 |

## 测试与风险

- **关键路径：** `JRN-001` 的检索/筛选和 `JRN-002` 的选择/任务跟踪。
- **回归风险：** 纯展示层调整意外改变 URL 或行选择。缓解措施是保持现有状态与回调不动，并扩展现有单测。
- **可访问性风险：** 通过卡片和状态标识可能削弱可读性。缓解措施是保持语义标题、`aria-live` 与可见焦点。

## 宪章合规

- 不涉及外部服务、个人数据、新事件或数据模型；对应检查不适用。
- 不新增模块依赖或跨域访问。
- 可观察行为将由现有测试及新增状态渲染断言验证。
