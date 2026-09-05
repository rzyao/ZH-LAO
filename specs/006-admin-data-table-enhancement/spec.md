# Feature Specification: 管理端通用数据表增强

**Feature Branch**: `006-admin-data-table-enhancement`  
**Created**: 2026-09-05  
**Status**: Approved  
**SpecKit mode**: Classic  
**Feature type**: End-user feature（包含可复用 UI 基础，但不把通用表格声明为独立产品服务）

> **Source artifacts**
>
> - Product Spec: [Product Forge 产品规格](../../.product-forge/features/admin-data-table-enhancement/product-spec/README.md)
> - Research: [研究摘要](../../.product-forge/features/admin-data-table-enhancement/research/README.md)
> - Review: [再验证记录](../../.product-forge/features/admin-data-table-enhancement/review.md)
> - API authority: [Content Language Admin API](../../docs/docs/developer/reference/contracts/content/CONTENT_LANGUAGE_ADMIN_API.md)
> - Architecture decision: [ADR-028](../../docs/docs/developer/reference/adr/ADR-028-content-letter-batch-operations.md)

## 1. Overview

### What We're Building

首期增强 `/content/lo/letters`：内容管理员可通过服务端搜索、筛选、排序与分页定位记录，设置显示列，执行页内或当前查询全部选择，并提交异步批量审核动作。所有批量动作先确认，任务提供可分页的逐项成功、失败与跳过结果。

### Why We're Building It

内容管理员频繁处理审核队列，但当前字母列表缺少统一的大数据浏览与批量处理能力，导致无法在一个列表内高效完成成批审核。该问题当前是产品假设，首期必须同时建立可观测基线，不能虚构效率提升数据。

### Research Backing

- **竞品模式**：成熟后台把“本页全选”与“当前查询全部”明确分开，并持续显示作用范围。
- **UX 模式**：使用原生语义表格、三态复选框、上下文批量栏、二次确认及可读的异步状态消息。
- **代码基础**：复用 TanStack Table/Query/Router、现有 DataTable 与 Content 单条状态机；服务端分页和批量任务是新增能力。

## 2. Prerequisites

| Priority | Feature | Status | Relationship | What's Needed |
| --- | --- | --- | --- | --- |
| P1 | `chinese-lao-content-hierarchy` | 🟡 实现与验证已完成，spec-merge 待完成 | complements | 使用其 `/api/v1/admin/content/lo/letters`、D-164 类别模型与四项精确权限；不得恢复旧 `/content/letters` 作为新契约 |
| P1 | `005-unified-api-contract` | 🟢 41/41 tasks 完成 | blocks | 所有新增接口严格使用 ADR-023 的 HTTP 200 + 顶层业务码信封与共享客户端 |
| P2 | `002-lao-alphabet-management` | 🟡 历史基线，部分字段已被后续权威修订 | complements | 只复用仍与当前 Content 权威一致的单条审核能力；旧 `online/offline/deleted` 与旧分类描述不得进入本功能 |

## 3. Goals

### Primary Goal

让内容管理员在一个字母列表中完成定位、跨页选择、确认、提交与追踪批量审核工作。

### Secondary Goals

- 为现有 DataTable 增加保持兼容的受控服务端模式。
- 让查询范围、选择范围、权限和逐项结果始终可解释。
- 建立批量任务完成率、部分失败率和审核耗时的发布后基线。

### Non-Goals

- 不提供批量上线、下线、导出、保存/共享筛选视图或任务取消。
- 不提供物理删除；UI“删除”固定映射为 `contents.status='archived'`。
- 不把字母动作推广为任意 Content 类型的通用批量写入。
- 不修改任何冻结 migration；数据库变化只允许新的前向 migration。

## 4. Users

**主要用户：内容管理员。** 用户已通过后台认证并按动作拥有 `content.lo_letters.read/write/review/publish` 的一个或多个权限，需要高频处理老挝字母工作修订。

## 5. User Stories

> E2E source of truth: [journeys.yml](../../.product-forge/features/admin-data-table-enhancement/product-spec/journeys/journeys.yml)

### Must Have

- [ ] **US-001** 作为内容管理员，我要搜索、筛选、排序和分页浏览字母记录，以便定位审核队列。
  - **AC:** Given 有权读取字母列表，When 改变关键词、筛选、排序、页码或页大小，Then URL 与服务端结果同步，响应包含稳定分页和总数；关键词、筛选或页大小变化后回到第一页。
- [ ] **US-002** 作为内容管理员，我要设置非关键显示列，同时始终看到操作列，以便平衡信息密度与可操作性。
  - **AC:** Given 表格已加载，When 切换显示列，Then 非关键列立即更新；选择列（启用选择时）和固定操作列不可隐藏，横向滚动后仍可操作。
- [ ] **US-003** 作为内容管理员，我要从本页选择升级到当前筛选结果全部，以便处理跨页审核工作。
  - **AC:** Given 已选择当前页全部，When 显式升级为当前查询全部，Then UI 显示规范化查询范围、总数和选择 hash；任何改变目标集合的查询变更清空旧选择。
- [ ] **US-004** 作为内容管理员，我要确认并提交受权限与状态机约束的批量动作，以便安全处理记录。
  - **AC:** Given 至少选择一项，When 选择提交审核、通过、驳回、正式发布或删除，Then 对话框显示动作、范围和数量并要求二次确认；驳回/删除原因必填；成功提交返回 Content 任务 UUID。
- [ ] **US-005** 作为内容管理员，我要看到异步任务逐项的成功、失败和跳过原因，以便采取后续行动。
  - **AC:** Given 已创建任务，When 查看任务详情，Then 仅创建者可见汇总与分页逐项结果；部分失败不回滚成功项；仅失败项可重试；任务不可取消且长期可查。

### Should Have

- [ ] **US-006** 作为内容管理员，我希望快速清除全部筛选、恢复默认列，并在请求失败后保留条件重试。
  - **AC:** Given 非默认视图或网络失败，When 执行清除、恢复或重试，Then 不丢失仍然有效的查询上下文，并重新获取正确页。

## 6. Functional Requirements

> 为避免与 `specs/content/spec.md` 已发布的 FR-001～FR-009 冲突，本功能从 FR-010 开始分配稳定 ID。产品规格中的本地 FR-001～FR-012 依次映射为下列 FR-010～FR-021。

| ID | Requirement | Priority | Source |
| --- | --- | --- | --- |
| FR-010 | 字母列表必须按 Content API 白名单执行服务端搜索、筛选、排序与稳定 offset 分页；默认 50、最大 500。 | Must | US-001 |
| FR-011 | 查询状态必须存入 TanStack Router Search Params；改变关键词、筛选或页大小时回到第一页，空页回退到最近有效页。 | Must | US-001, US-006 |
| FR-012 | 操作列必须固定且不可隐藏；启用批量选择时选择列不可隐藏；其他列可设置显示。 | Must | US-002 |
| FR-013 | 表头选择默认只选择当前页，使用三态复选框并显示准确选择数量。 | Must | US-003 |
| FR-014 | 当前页全选后必须显式升级为当前查询全部；服务端预览返回规范化 query、expected_count 与 selection_hash；目标查询变化使旧选择失效。 | Must | US-003 |
| FR-015 | 可见批量动作只来自 Content 返回的 `batch_actions`；前端能力门禁仅作引导，服务端仍按项授权及校验状态。 | Must | US-004 |
| FR-016 | `submit_review/approve/reject/publish/archive` 全部二次确认；`reject/archive` 原因 trim 后必须非空；不得提供批量上线/下线。 | Must | US-004 |
| FR-017 | Content 必须异步执行无产品数量上限的任务：提交事务冻结完整目标，Worker 分批认领并逐项独立事务，允许部分成功。 | Must | US-004, US-005 |
| FR-018 | 任务必须长期保留、不可取消、仅创建者可查看或重试；重试不得重复成功或跳过项。 | Must | US-005 |
| FR-019 | 页面必须区分加载、首次空列表、无筛选结果、请求错误、任务进行中、全部完成和部分完成，并提供适用的恢复动作。 | Must | US-001, US-005, US-006 |
| FR-020 | 每个成功的逐项业务动作必须按既有 action key 写 Operations 成功审计，并带 `batch_task_id`；失败操作不得伪装为成功审计。 | Must | US-004, US-005 |
| FR-021 | 所有新增业务响应必须遵守 ADR-023；陈旧选择返回 `BATCH_SELECTION_CHANGED`，不可重试任务返回 `BATCH_TASK_NOT_RETRYABLE`。 | Must | US-003, US-005 |

## 7. Acceptance Scenarios

| Scenario | Given | When | Then |
| --- | --- | --- | --- |
| FR-010-AS01 | 存在超过 50 条匹配字母 | 请求默认列表或 `page_size=500` | 分别返回 50 或最多 500 条、准确 total，并以 public UUID 稳定破同序 |
| FR-011-AS01 | URL 含有效查询参数 | 刷新、改变筛选或访问结果已缩小的末页 | 恢复查询；筛选变更回第一页；空页回退到最近有效页 |
| FR-012-AS01 | 用户打开列设置并横向滚动 | 隐藏任意可选列 | 操作列和启用中的选择列仍显示、可聚焦、可操作 |
| FR-013-AS01 | 当前页有部分/全部行可选 | 逐行选择或点击表头复选框 | 表头呈未选/混合/全选三态，且只影响当前页 |
| FR-014-AS01 | 当前页已全选且查询共 126 条 | 点击“选择当前筛选结果全部” | 预览返回 126 和 hash，UI 明示跨页范围；筛选变化立即清空选择 |
| FR-015-AS01 | Operator 仅有 read+review 权限 | 打开批量菜单并提交动作 | UI 仅展示允许动作；伪造 write/publish 请求仍被服务端拒绝 |
| FR-016-AS01 | 选择 reject 或 archive | 原因为空或未确认 | 不提交；填写非空原因并确认后才创建任务 |
| FR-017-AS01 | 查询选择包含合法与状态已变化记录 | Worker 分批执行 | 合法项成功，非法项 failed/skipped，其他项继续，汇总计数满足不变量 |
| FR-018-AS01 | 任务部分完成且含失败项 | 原创建者重试，或其他 Operator 查看/重试 | 仅失败项重新排队；其他 Operator 返回不可见/无权限；无取消入口 |
| FR-019-AS01 | 分别发生加载、空数据、无匹配、网络失败和部分完成 | 页面渲染状态 | 每种状态有不同文本和可访问提示，错误可重试且不丢查询 |
| FR-020-AS01 | 一项成功、一项失败 | 批次结束 | 仅成功项产生既有 action 审计，metadata 含同一 batch task UUID |
| FR-021-AS01 | 预览后目标集合变化，或完整任务被重试 | 提交任务或请求重试 | 分别返回已登记业务码，HTTP 保持 200 且携带 request_id |

## 8. State Machines

### Batch Task Lifecycle（Owning FR: FR-017, FR-018）

**States**: `queued`, `running`, `completed`, `completed_with_issues`, `failed`  
**Initial**: `queued`  
**Terminal**: `completed`；无失败明细的 `completed_with_issues` 也是不可重试终态。

| From | To | Guard / action |
| --- | --- | --- |
| — | queued | 任务、冻结目标和全部 items 在一个事务中创建成功 |
| queued | running | Worker 以 `FOR UPDATE SKIP LOCKED` 认领 |
| queued / running | failed | 发生任务级系统故障，保存安全错误码 |
| running | completed | 所有目标均成功 |
| running | completed_with_issues | 至少一个目标 failed 或 skipped，且所有目标均已处理 |
| completed_with_issues / failed | queued | 原创建者有原动作权限，且至少存在 failed item；只重置失败项 |

禁止 `completed → *`、任意状态取消，以及重试 succeeded/skipped item。每次 Worker 批次必须重新解析 Operator 和权限。

### Batch Item Lifecycle（Owning FR: FR-017）

`queued → running → succeeded | failed | skipped`；仅 `failed → queued` 可由合法重试触发。每项独立事务执行 Content 单条状态机，批量入口不得创建新的业务状态转换。

## 9. Non-Functional Requirements

| ID | Category | Requirement |
| --- | --- | --- |
| NFR-001 | Accessibility | 满足 WCAG 2.1 AA；复选框支持 mixed，分页使用命名导航与 `aria-current`，对话框焦点受控，任务状态以可读 live message 通知。 |
| NFR-002 | Security | 服务端是唯一授权边界；查询严格白名单；不暴露 BIGINT、SQL、约束名或其他 Operator 的任务结果。 |
| NFR-003 | Integrity | 选择预览和提交使用规范化 query + 稳定 UUID 集合 SHA-256；计数不符整体拒绝；任务计数始终满足持久化不变量。 |
| NFR-004 | Capacity | 列表 `page_size` 默认 50、最大 500；批量目标无产品数量上限，服务端通过配置化批次、并发及 `RATE_LIMITED` 保护。 |
| NFR-005 | Compatibility | DataTable 现有客户端模式保持可用；新增受控服务端模式不得改变现有调用方的默认行为。 |
| NFR-006 | Durability | 任务、目标与逐项结果先持久化后执行，进程重启后 queued/running 工作可恢复且不得重复已成功项。 |

### NFR Measurement Contract

| NFR | How to Measure | Signal / Query | Threshold |
| --- | --- | --- | --- |
| NFR-001 | 自动 axe + 键盘/读屏人工用例 | JRN-001～003 axe 结果与可访问性测试记录 | 0 个 serious/critical；全部关键路径可仅键盘完成 |
| NFR-002 | API 权限与越权集成测试 | 非法参数、无权限动作、跨 Operator task access 测试 | 100% 拒绝；0 个内部 ID/敏感错误泄露 |
| NFR-003 | 数据库约束与选择漂移集成测试 | task counter 校验查询；hash/count 变化用例 | 100% 满足计数不变量；漂移 100% 返回 `BATCH_SELECTION_CHANGED` |
| NFR-004 | API 边界与 explain/负载验证 | `page_size` 边界测试、500 行查询计划、队列限流用例 | 50 默认、500 可用、501 拒绝；无全表结果传回前端 |
| NFR-005 | 共享组件回归套件 | 现有 DataTable tests + 新 server-mode tests | 现有 client-mode 用例 100% 通过 |
| NFR-006 | Worker 重启/重复投递集成测试 | 中断后恢复、幂等 key、成功项重试审计计数 | 0 个成功项重复执行；任务可恢复至合法终态 |

## 10. Technical Context

### Integration Points

- `apps/admin/src/components/data-table/`：增加受控/manual pagination、sorting、selection 与 server total 的组合能力，保留客户端模式。
- `apps/admin/src/features/content/pages/category.tsx` 与 `structured/`：只对 `lo_letter` 首期接入查询状态、列定义、跨页选择、批量栏和任务结果。
- `apps/backend/src/modules/content/http/structured-admin-routes.ts`：实现目标 `/api/v1/admin/content/lo/letters` 查询、selection preview 与 batch task 路由。
- `apps/backend/src/modules/content/application/` 与 `infrastructure/`：新增 Content-owned 任务用例、仓储与 Worker；复用单条 submit/review/publish 状态机，不在路由复制业务规则。
- `apps/backend/src/modules/operations/public/`：只复用 Operator 解析、精确权限和成功审计端口。
- `database/migrations/`：新增前向 migration 创建两张 D-167 表与索引。

### Reusable Components

`data-table.tsx`、`data-table-pagination.tsx`、`data-table-toolbar.tsx`、`data-table-column-header.tsx`、`data-table-view-options.tsx`、UI Table/Checkbox/Dialog、共享 `ApiClient`、TanStack Query cancellation/cache invalidation、Content 单条生命周期 use cases。

### Data Model Impact

新增 `content.lo_letter_batch_tasks` 与 `content.lo_letter_batch_task_items`，字段、约束、索引和保留策略只引用 [Content 数据库权威](../../docs/docs/developer/reference/domains/content/database.md)，本规格不复制为第二份物理定义。

### Codebase Constraints

| Constraint | Authority | Impact |
| --- | --- | --- |
| 外部 ID 仅 UUID，API 使用 snake_case | API Standard / Content API | 前端和 OpenAPI 不出现内部 BIGINT |
| HTTP 200 + 顶层业务码信封 | ADR-023 / D-156 | 新接口只产生一种统一响应形态 |
| Content 拥有任务与状态；Operations 只授权/审计 | ADR-028 / D-167 | 禁止通用表格或 Operations 持久化业务任务 |
| 冻结 migration 不可改 | Constitution / DOCUMENT_CONTRACT | 只增加前向 migration |
| 单条 Revision 状态机仍是唯一合法性来源 | Content versioning-review | Worker 逐项调用/复用领域用例 |

### EDA Decision

本功能不引入事件或消息总线；数据库持久化队列由 Content Worker 认领。故不定义 EDA Events，`asyncapi.yaml` 明确为空。

## 11. Contract References

- [OpenAPI 3.1](./contracts/openapi.yaml)：本功能 FE↔BE 下游可执行契约，operationId 为 `API-LettersQuery`、`API-LettersSelectionPreview`、`API-LettersBatchStart`、`API-LettersBatchTaskList`、`API-LettersBatchTask`、`API-LettersBatchRetry`。
- [AsyncAPI](./contracts/asyncapi.yaml)：无异步消息通道；任务异步性由 Content 数据库任务状态机实现。
- [Content Language Admin API](../../docs/docs/developer/reference/contracts/content/CONTENT_LANGUAGE_ADMIN_API.md)：API 权威。
- [Business status codes](../../docs/docs/developer/reference/architecture/applications/business-status-codes.md)：业务码权威。
- [ADR-028](../../docs/docs/developer/reference/adr/ADR-028-content-letter-batch-operations.md)：所有权、事务与执行边界。

## 12. Success Criteria

- **SC-010**：100% Must Have 故事及 P0/P1 journey edge 有自动化或明确人工验收证据。
- **SC-011**：权限绕过、未审计成功动作、物理删除和未定义状态转换均为 0。
- **SC-012**：任务结果计数 100% 可解释，成功、失败、跳过不混淆。
- **SC-013**：发布后 30 天建立任务完成率、部分失败率和同类审核耗时基线；在真实基线前不承诺虚构提升比例。

## 13. Testing Specification

### Coverage Targets

| Module / Service | Target | Type |
| --- | --- | --- |
| 查询解析、规范化与 selection hash | 所有分支与边界值 | unit + integration |
| Batch task / item 状态机和 Worker | 所有合法/非法转换、幂等和恢复路径 | unit + PostgreSQL integration |
| Content HTTP 契约、RBAC 与审计 | 所有 operationId 与业务错误 | contract + integration |
| DataTable server mode 与字母页 | US-001～US-006、键盘和状态渲染 | Vitest + Playwright E2E |

### Critical Test Cases

| ID | Scenario | Expected | Type |
| --- | --- | --- | --- |
| TC-001 | 默认查询与 `page_size=500/501` | 50 默认、500 成功、501 `VALIDATION_ERROR` | API integration |
| TC-002 | 多选筛选顺序不同但语义相同 | 规范化 query/hash 相同 | unit |
| TC-003 | 预览后目标增删 | 创建任务返回 `BATCH_SELECTION_CHANGED`，不写任务/items | PostgreSQL integration |
| TC-004 | 同幂等 key 同/不同请求 | 返回原任务 / `CONFLICT` | API integration |
| TC-005 | 混合状态批量 approve | 合法项成功，其余逐项失败/跳过且任务继续 | integration |
| TC-006 | Worker 处理中权限撤销 | 未处理项不再执行并记 `FORBIDDEN` | integration |
| TC-007 | reject/archive 空原因 | 前后端均阻止提交 | unit + E2E |
| TC-008 | 重试部分失败任务 | 仅 failed 重排队，成功/跳过项不重复审计 | integration |
| TC-009 | 非创建者读取/重试任务 | `NOT_FOUND` 或 `FORBIDDEN`，不泄露详情 | security integration |
| TC-010 | Worker 中断并恢复 | 任务恢复且无成功项重复执行 | integration |
| TC-011 | DataTable client mode 回归 | 现有调用行为不变 | component |
| TC-012 | 查询、选择、确认、结果全流程 | URL/范围/任务/部分结果与可访问提示正确 | E2E |

### E2E Scenarios

| ID | Scenario | Entry | Exit |
| --- | --- | --- | --- |
| TC-E2E-001 | 搜索筛选排序分页与列设置 | `/content/lo/letters` | URL 可恢复、结果正确、操作列固定 |
| TC-E2E-002 | 当前页升级为当前查询全部并批量通过 | 已有多页 pending_review 数据 | 任务完成并刷新列表，范围与计数一致 |
| TC-E2E-003 | 驳回原因、陈旧选择与部分失败恢复 | 已预览的混合状态查询 | 原因受控、陈旧提交被拒、失败项可重试 |

## 14. Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| 单页最大 500 导致慢查询或大响应 | Medium | 计划阶段核验索引、EXPLAIN 与响应体；仍禁止返回全量结果 |
| 无产品批量数量上限造成队列压力 | Medium | 持久化队列、配置化批次/并发、容量限流与可恢复 Worker |
| 查询变化造成选错范围 | High | 显式升级、服务端预览、UUID 集合 hash + expected_count、变化即整体拒绝 |
| 共享 DataTable 改动破坏现有页面 | Medium | 保留 client mode 默认行为并运行组件回归 |
| 历史 SpecKit Content 基线存在旧字段漂移 | Medium | 只服从当前 D-164/D-167、ADR-028、Content DB/API 权威；spec-merge 前重新检查 |

## 15. Wireframes

- [字母列表](../../.product-forge/features/admin-data-table-enhancement/product-spec/wireframes/list.html)：查询栏、列设置、语义表格和分页。
- [批量确认](../../.product-forge/features/admin-data-table-enhancement/product-spec/wireframes/batch-confirm.html)：范围、数量、原因和确认。
- [项目风格原型](../../.product-forge/features/admin-data-table-enhancement/product-spec/mockups/index.html)：列表与批量任务状态。

## 16. Locked Decisions and Authority Snapshot

| Decision | Source | Budget |
| --- | --- | --- |
| 首期只接入 `/content/lo/letters` | Product Spec v1.3 / Content API | LOCKED |
| 批量动作、确认、原因与不含上线/下线 | D-167 / ADR-028 | LOCKED |
| Content owns task；Operations only auth/audit | ADR-028 | LOCKED |
| 两表、长期保留、不可取消、失败项重试 | Content DB / ADR-028 | LOCKED |
| 查询白名单、50/500、稳定排序与任务可见性 | Content API | LOCKED |
| UI 私有组件拆分、Worker 批次/并发具体值 | — | CONSTRAINED/FREE；不得改变产品可见语义 |

**Authority base commit**: `79feb6f7b82221da52e8f6bc1cd5f67d4694b415`（生成时 HEAD；权威文档含当前工作区内已批准但尚未提交的 D-167 增量，计划阶段必须重新 ground）。

## 17. Open Questions

无阻塞性产品、领域、数据库或 API 问题。技术计划必须决定并验证索引、Worker 批次大小、并发度、轮询/刷新策略和 500 行响应预算，但这些决定不得形成新的产品数量上限或修改锁定契约。
