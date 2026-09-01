---
status: active
---

# Admin 设计系统与 UI 风格规范 (Design System & Style Guide)

## 1. 概述与核心哲学 (Philosophy & Aesthetic)

ZH-LAO 管理后台 (`apps/admin`) 采用 **Rhea-inspired Compact Admin** 设计理念。后台面向运营审核、系统运维、音频生产质检及业务管理人员，旨在为高频、多实体、高密度的企业级管理场景提供一致、严密、高效的操作体验。

### 核心设计原则

1. **桌面优先与极致信息密度 (Desktop-First & High Density)**
   * 所有视图均以宽屏桌面场景为第一基准。
   * 严格控制基础控件尺寸与留白：表单控件与按钮默认高度 `h-8` (32px)，表格数据行高 `h-9`~`h-10`，在单屏可视区域内展示更多有效数据，减少无谓滚动。
2. **极简低装饰感 (Functional & Low-Decoration)**
   * 剔除渐变色、厚重多层阴影与大圆角，采用清晰坚固的结构化边框（`border-border`）和微弱的环境层次（`shadow-xs` / `shadow-sm`）。
   * 突出信息架构与数据对比，使操作者专注于业务判断。
3. **色彩语义化与严格对比度 (Semantic Color Integrity)**
   * 色彩严格用于表达系统生命周期与业务状态（如成功、警示、阻断、草稿），杜绝无意义的装饰性色块。
   * 文本、图标与背景在明暗主题下均满足 WCAG AA 级对比度要求（≥ 4.5:1）。
4. **无障碍与全键盘交互 (WAI-ARIA & Keyboard First)**
   * 基于 `@base-ui/react` 无样式无障碍原语开发，保证所有弹窗、下拉、表格与表单均具备合规的 ARIA 属性及完整的键盘焦点（Tab/Arrow/Esc/Enter）流转支持。

---

## 2. 色彩系统与语义令牌 (OKLCH Native Color Tokens)

基于 Tailwind CSS v4 的 `@theme inline` 体系，系统在 `apps/admin/src/design-system/tokens/index.css` 中定义了感知均匀的 OKLCH 色彩令牌，天然适配亮色与暗色模式：

### 2.1 基础容器与表面色阶

| 令牌 Token | 亮色模式 (Light) | 暗色模式 (Dark) | 语义说明 |
| :--- | :--- | :--- | :--- |
| `--background` | `oklch(0.985 0.002 247.839)` | `oklch(0.145 0 0)` | 全局主背景，微冷灰与深灰黑 |
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | 全局默认主正文文本 |
| `--card` / `--card-foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.17 0 0)` / `oklch(0.985 0 0)` | 卡片、面板、数据表格背景与文字 |
| `--popover` / `--popover-foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.17 0 0)` / `oklch(0.985 0 0)` | 悬浮卡片、下拉菜单、气泡提示背景 |
| `--primary` / `--primary-foreground` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | `oklch(0.985 0 0)` / `oklch(0.205 0 0)` | 主强调色（高对比度单色黑白翻转） |
| `--secondary` / `--secondary-foreground` | `oklch(0.97 0 0)` / `oklch(0.205 0 0)` | `oklch(0.22 0 0)` / `oklch(0.985 0 0)` | 次级操作背景与文本 |
| `--muted` / `--muted-foreground` | `oklch(0.97 0 0)` / `oklch(0.556 0 0)` | `oklch(0.22 0 0)` / `oklch(0.65 0 0)` | 表头底色、禁用态、次级弱化提示文本 |
| `--border` / `--input` | `oklch(0.922 0 0)` | `oklch(0.27 0 0)` | 分割线、表单输入框、表格网格边框 |
| `--ring` | `oklch(0.708 0 0)` | `oklch(0.55 0 0)` | 控件获得焦点时的外发光轮廓环 |

### 2.2 业务状态色阶与 `StatusBadge` 对应规范

业务状态色仅用于映射领域状态机，禁止混用：

```
┌──────────────┬───────────────────────────┬──────────────────────────────────────────┐
│ 语义状态     │ 色值 (OKLCH)              │ 对应业务状态 (Lifecycle State)           │
├──────────────┼───────────────────────────┼──────────────────────────────────────────┤
│ success      │ oklch(0.527 0.154 150.069)│ ACTIVE, ONLINE, PUBLISHED, COMPLETED     │
│ warning      │ oklch(0.769 0.188 70.08)  │ PENDING, PROCESSING, REVIEWING, DEGRADED │
│ destructive  │ oklch(0.577 0.245 27.325) │ BANNED, REJECTED, ERROR, FAILED, REVOKED │
│ info         │ oklch(0.588 0.158 241.966)│ DRAFT, SCHEDULED, QUEUED, NEW            │
│ muted        │ oklch(0.97 0 0)           │ DEPRECATED, OFFLINE, ARCHIVED, CLOSED    │
└──────────────┴───────────────────────────┴──────────────────────────────────────────┘
```

---

## 3. 字体排版与数据呈现规范 (Typography & Numerical Rules)

### 3.1 字体阶梯 (Font Hierarchy)

* **根基准大小**：HTML 根字号为 `15px` (`0.9375rem`)。
* **正文字体栈 (`--font-sans`)**：
  `'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif`
  * 启用高级排版特性：`font-feature-settings: 'cv11', 'ss01'`。
* **等宽字体栈 (`--font-mono`)**：
  `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`

### 3.2 数据呈现三原则

1. **数值等宽对齐 (`tabular-nums`)**
   所有数据表格中的金额、数量、计数器、百分比与耗时指标必须使用 `font-variant-numeric: tabular-nums`，确保垂直方向上的数字严格列对齐。
2. **跨域标识呈现 (UUID / Machine Keys)**
   所有对外暴露的 ID 统一为标准 UUID 字符串（不展示内部自增主键）。在表格和详情中统一渲染为 `font-mono text-xs text-muted-foreground`，超长时截断并提供一键复制按钮。
3. **时间规范 (ISO 8601 & Timestamps)**
   表格内绝对时间展示格式严格为 `YYYY-MM-DD HH:mm:ss`；动态流/审计日志展示相对时间（如 `3 分钟前`），鼠标悬浮展示完整 ISO 绝对时间气泡。

---

## 4. 空间网格、圆角与层次 (Spatial, Radius & Shadows)

### 4.1 4px 空间比例 (Spacing Scale)

| 间距尺寸 | 像素 (px) | Tailwind 类名 | 典型应用场景 |
| :--- | :--- | :--- | :--- |
| **micro** | 4px | `gap-1` / `p-1` | 标签内边距、微图标按钮 |
| **compact** | 6px | `gap-1.5` / `p-1.5` | 紧凑型按钮、表单输入框内边距 |
| **base** | 8px | `gap-2` / `p-2` | 按钮间距、工具栏内组件间距 |
| **medium** | 12px | `gap-3` / `p-3` | 筛选栏 `FilterBar` 项间距、卡片内区块间距 |
| **card** | 16px | `gap-4` / `p-4` | 标准卡片内边距、模态弹窗内边距 |
| **section** | 24px | `gap-6` / `p-6` | 页面外边距、多栏工作台分隔 |

### 4.2 圆角梯度 (Border Radius)

* **`--radius-sm` (4px)**：`rounded-sm` 用于 `Badge` 状态徽章、输入框右侧附加小标签。
* **`--radius-md` (6px)**：`rounded-md` 用于 `Button`、`Input`、`Select`、`Textarea` 等基础控件。
* **`--radius-lg` (8px)**：`rounded-lg` 用于 `Card` 卡片容器、`DataTable` 表格容器、`Dialog` 模态弹窗。
* **`rounded-full`**：仅用于头像和状态指示点（Status Dot）。

### 4.3 低高度阴影系统 (Elevation System)

* **平面结构**：`shadow-none border border-border` 用于常规页面卡片、表格与布局分栏。
* **浮层菜单**：`shadow-sm border border-border bg-popover` 用于下拉菜单、气泡卡片。
* **对话框**：`shadow-md border border-border bg-card` 用于居中模态对话框与抽屉。

---

## 5. 四大标准页面布局模板 (Page Archetypes)

Admin 业务开发必须严格继承以下四种标准页面模板之一（位于 `apps/admin/src/components/layout/`）：

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. ListPageLayout: PageHeader + FilterBar + DataTable + Pagination          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. DetailPageLayout: PageHeader + StatSummary + GroupedCards + Timeline     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. EditPageLayout: PageHeader + FormSections + StickyActionFooter           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. WorkbenchLayout: Operational Split (Queue + Main Viewer + Action Panel)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.1 数据列表页 (`ListPageLayout`)
* **适用场景**：操作员列表、用户花名册、审计流水、类目配置、订单管理。
* **标准组合**：
  1. `PageHeader`：页面标题 + 数据总数徽章 + 主创建/导出按钮。
  2. `FilterBar`：关键词搜索框 + 状态筛选下拉 + 日期范围选择 + 自定义列可见性开关。
  3. `DataTable`：基于 TanStack Table 的无头高密度数据表格，支持表头点击排序与全选批量操作。
  4. `DataTablePagination`：每页行数选择器 (10/20/50/100) + 快速页码跳转。

### 5.2 实体详情页 (`DetailPageLayout`)
* **适用场景**：用户档案审查、申诉工单复核、单笔交易审计。
* **标准组合**：
  1. `PageHeader`：返回按钮 + 实体核心标题 + 状态 Badge + 次级操作下拉。
  2. 关键指标网格（Key Metric Cards）。
  3. 结构化卡片容器（基础信息、权限配置、业务关联）。
  4. 审计轨迹时间轴（Audit Log Timeline）。

### 5.3 表单编辑页 (`EditPageLayout`)
* **适用场景**：平台参数配置下发、新建权限角色、应用发布版本编辑。
* **标准组合**：
  1. `PageHeader`：编辑目标说明 + 变更提示。
  2. 纵向分段表单 `FormSection`：附带清晰的左侧字段描述与右侧输入控件。
  3. 底部粘性操作栏（Sticky Footer）：提交/取消按钮 + 表单脏值（Dirty Form）离开拦截警告。

### 5.4 多栏运营工作台 (`WorkbenchLayout`)
* **适用场景**：音频生产工作台 (`admin-audio-production`)、内容审核仲裁工作台。
* **标准组合**：
  1. **左侧队列栏 (Queue Pane, `w-72`~`w-80`)**：任务待办列表、优先级标签、实时排队计数。
  2. **中央主审查区 (Main Pane, `flex-1`)**：音频播放器/波形频谱、图文内容对比、富文本预览。
  3. **右侧操作栏 (Aside Action Pane, `w-80`~`w-96`)**：质检裁决表单（通过/驳回原因模板 + 快捷键触发 + 一键提交下一个任务）。

---

## 6. 组件库交互与行为规范 (Component Behavior)

### 6.1 按钮与交互尺寸
* **尺寸阶梯**：
  * `sm`: `h-7 px-2.5 text-xs`（表格行内操作、紧凑工具栏）
  * `default`: `h-8 px-3 text-sm`（标准页面操作、表单按钮）
  * `lg`: `h-9 px-4 text-sm`（引导动作）
  * `icon`: `h-8 w-8`（图标快捷按钮）
* **加载态规范**：操作触发异步请求时，按钮应立即进入 `disabled` 状态，左侧展示 `Loader2` 旋转动画并保持按钮原生宽度不抖动。

### 6.2 表单验证与错误反馈
* 全面接入 `React Hook Form` 与 `Zod` Schema。
* 错误提示统一使用 `FormMessage` 渲染在对应输入框下方（字体为 `text-xs text-destructive`），禁止使用 alert 弹窗打断输入。

### 6.3 危险操作与二次确认
* 对涉及实体删除、用户封禁、权限吊销、全服参数覆写的破坏性操作，必须使用 `ConfirmDialog`。
* 关键破坏性操作应支持输入目标名称（如输入操作员用户名或 "CONFIRM"）以完成防误触校验。

### 6.4 全局反馈机制
* **操作通知**：通过 `useToast()` 弹出轻量级浮层通知，成功为浅绿勾选，失败明确展示后端返回的错误信息与错误代码 (`code`)。
* **空状态与异常状态**：无数据时必须展示 `EmptyState`（带图标、说明与主引导动作）；接口异常时展示 `ErrorState`（提供重试按钮与错误追踪详情）。

---

## 7. 导航与信息架构映射 (Admin Navigation IA)

导航栏严格按操作员业务工作流分类，而非后端微服务边界分类：

```
Admin 导航结构
├── 控制台 (Overview) ───────────── /dashboard
├── 用户与安全 (Identity & Trust) ── /operators, /users, /risk-control, /appeals
├── 业务运营 (Platform & Ops) ───── /config, /feature-flags, /versions, /announcements
├── 内容与生产 (Content & Audio) ── /content/posts, /content/topics, /audio/production
├── 社交与增长 (Social & Growth) ── /social/relationships, /social/feed-rules
├── 电商与财务 (Commerce & Finance) /commerce/orders, /commerce/catalog, /finance/wallet-adjust
├── 学习与进阶 (Learning) ───────── /learning/courses, /learning/exercises
└── 系统运维 (System & Audit) ───── /system/audit-logs, /system/design-system
```

---

## 8. 在线设计系统演练场 (Living Design System)

Admin 工程内置了动态交互式的设计系统参考页面，供开发者实时预览所有令牌、组件、色彩和交互状态：

* **页面路径**：`/system/design-system`
* **源码位置**：`apps/admin/src/pages/system/design-system.tsx`
* **功能演示**：
  * OKLCH 色彩体系与 Light/Dark 模式即时切换
  * 所有 Button、Badge、Input、Select、Textarea 尺寸与变体
  * StatusBadge 业务状态映射展示
  * DataTable、Pagination 与 FilterBar 完整数据表格
  * Dialog、ConfirmDialog、Drawer 弹窗及 Toast 反馈
  * EmptyState 与 ErrorState 各种状态模拟

---

## 9. 开发者合规自检清单 (Developer Checklist)

在开发新的 Admin 页面或组件时，请依序检查：

- [ ] **模板规范**：是否选用了 `ListPageLayout` / `DetailPageLayout` / `EditPageLayout` / `WorkbenchLayout` 之一？
- [ ] **间距与尺寸**：按钮与输入控件是否统一为 `h-8`？是否遵循 4px 空间网格？
- [ ] **色彩语义**：是否避免了硬编码十六进制色值？状态标签是否严格使用了语义化 `StatusBadge`？
- [ ] **数字呈现**：表格与指标中的数值是否配置了 `tabular-nums`？
- [ ] **跨域标识**：对外展示的 ID 是否为 UUID 且采用 `font-mono text-xs text-muted-foreground`？
- [ ] **时间格式**：时间戳展示是否符合 `YYYY-MM-DD HH:mm:ss` 或标准相对时间？
- [ ] **交互状态**：按钮是否具备 Loading 态？破坏性操作是否有 `ConfirmDialog` 保护？
- [ ] **暗色模式**：页面在暗色模式（Dark Mode）下文字、边框与卡片对比度是否正常？
