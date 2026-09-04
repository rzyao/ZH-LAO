# Change Log: 菜单树拖拽重排与换父级

## CR-001: 拖拽排序、换父级与页面样式优化 — 2026-09-04

| Field | Value |
| --- | --- |
| **Status** | ACCEPTED |
| **Priority** | Must Have |
| **Requested at phase** | 已完成的 `004-menu-routing-management` 实施后 |
| **Rationale** | 运营人员需要直接在树上维护顺序和父子关系，减少逐项操作成本。 |
| **Impact** | 9 个工件，新增 8 个任务，需从 Plan 阶段重新推进。 |
| **Phase rollback** | Plan |

### Accepted baseline

> 本节是 CR-001 的历史基线；其中“分组”和三层限制已由 CR-004 取代。

- 任一未移除节点可成为父项；节点可以同时配置路由和子项。
- 顶层分组可下沉，普通菜单可提升至顶层。
- 移动拒绝环、移除节点父项和超过三层的结果；源层、目标层和节点使用乐观并发校验。

### Artifacts affected

| Artifact | Change | Description |
| --- | --- | --- |
| ADR-024 | Added | 批准换父级模型和移动端点。 |
| ADR-022 / D-155 | Modified by reference | 被 ADR-024 的明确修订取代相冲突的层级语义。 |
| `spec.md` | Modified | 新增拖拽移动需求与验收场景。 |
| `data-model.md` | Modified | `route_key` 与父级位置解耦。 |
| `contracts/http-api.md` | Modified | 新增原子移动命令。 |
| `contracts/frontend-nav.md` | Modified | 支持可点击父项和拖拽交互。 |
| `plan.md` / `tasks.md` | Modified | 追加实现与验证任务。 |
| Admin / Backend tests | Modified | 覆盖移动约束、并发和无障碍交互。 |

## CR-002: 侧边栏顶层分组默认收起 — 2026-09-04

| Field | Value |
| --- | --- |
| **Status** | ACCEPTED |
| **Priority** | Should Have |
| **Requested at phase** | Plan |
| **Rationale** | 操作员不喜欢顶层分组默认展开，希望按需查看子项。 |
| **Impact** | 6 个工件，新增 2 个任务，工作量小。 |
| **Phase rollback** | 无；呈现层行为与测试更新。 |

### Artifacts Modified

| Artifact | Change | Description |
| --- | --- | --- |
| `admin/navigation.md` | Modified | 明确二级导航默认收起的交互约定。 |
| `spec.md` / delta spec | Modified | 新增 FR-018。 |
| `plan.md` / `tasks.md` | Modified | 记录呈现层实现与回归任务。 |
| Sidebar / test | Modified | 默认收起并覆盖当前子路由场景。 |

### Decision Notes

用户于 2026-09-04 明确接受；当前路由不再改变初始展开状态。

## CR-003: 移除总览分组标题，保留总览看板 — 2026-09-04

| Field | Value |
| --- | --- |
| **Status** | ACCEPTED |
| **Priority** | Should Have |
| **Requested at phase** | Plan |
| **Rationale** | 操作员希望总览看板直接显示，不显示冗余的「总览」分组标题。 |
| **Impact** | 6 个工件，新增 2 个任务，工作量小。 |
| **Phase rollback** | 无；仅 Sidebar 呈现层与测试更新。 |

### Artifacts Modified

| Artifact | Change | Description |
| --- | --- | --- |
| `admin/navigation.md` | Modified | 记录总览看板为直接入口。 |
| `spec.md` / delta spec | Modified | 新增 FR-019。 |
| `plan.md` / `tasks.md` | Modified | 记录兼容分组与实现任务。 |
| Sidebar / test | Modified | 隐藏标题并验证总览看板保留。 |

### Decision Notes

用户于 2026-09-04 明确接受。配置树中的 `overview` 分组继续保留，避免影响现有菜单配置。

### Implementation correction

远端配置中的分组键是数据库 ID 而非 `overview` 字符串；实现改为识别「仅承载总览路由的单项分组」，并以数据库式键值加入回归测试。

## CR-004：移除分组功能，采用自由嵌套目录 — 2026-09-04

| 字段 | 值 |
| --- | --- |
| **状态** | 已接受 |
| **优先级** | Must Have |
| **提出阶段** | 已实现后的范围修订 |
| **原因** | 分组标题及固定层级造成字号和组织方式不一致；运营人员需要按内容结构自由组织目录。 |
| **影响** | 规格、架构、数据初始化、前后端导航模型与测试。 |
| **阶段回退** | Plan |

### 接受后的基线

- 所有菜单记录都是同一种节点，不再存在专门的分组类型。
- 根节点与子节点均可有或没有路由，也都可以继续拥有子节点。
- 移除三层业务上限，保留环、无效父节点和并发保护。
- Sidebar 在所有层级递归渲染统一字号，目录默认收起。
- 旧总览与内容桥接节点由前向迁移归一化，不修改冻结迁移。

### 受影响工件

| 工件 | 变更 |
| --- | --- |
| ADR-026 / D-165 | 新增统一递归目录的权威决策。 |
| `spec.md` / delta spec | 修订 FR-003、FR-018、FR-019，新增 FR-020。 |
| `plan.md` / `tasks.md` | 增加 CR-004 实施与验证任务。 |
| 前后端实现 | 移除分组适配和深度限制，递归渲染与管理。 |
| 数据库迁移 | 归一化旧桥接节点。 |

用户于 2026-09-04 明确要求并接受，本变更作为连续指令直接实施。

## CR-005：二级菜单项目整行点击伸缩 — 2026-09-04

| 字段 | 值 |
| --- | --- |
| **状态** | 已接受 |
| **优先级** | Must Have |
| **提出阶段** | CR-004 实施完成后 |
| **原因** | 可导航的二级目录只有小箭头能够伸缩，菜单项目本身点击后只跳转，操作不顺手。 |
| **影响** | Sidebar 交互、无障碍状态、组件与浏览器测试、导航规格。 |
| **阶段回退** | 无；局部交互修复。 |

### 接受后的基线

- 点击带路由且含子项的菜单项目，同时执行路由跳转和目录伸缩。
- 点击右侧箭头只伸缩，不触发路由跳转。
- 可导航目录菜单项目暴露 `aria-expanded`。
- 侧边栏整体折叠时点击图标只跳转，不改变隐藏目录状态。

用户于 2026-09-04 明确要求修复，作为连续指令直接实施。

### 实现修正

菜单名称和箭头改为共用同一个行容器；激活背景、左侧高亮边和悬停反馈覆盖完整宽度，避免
只显示菜单名称选中而箭头游离在外。组件测试验证两者拥有同一父容器及整行激活样式。
