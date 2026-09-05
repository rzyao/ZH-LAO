---
description: "管理端通用数据表增强的可执行任务清单"
---

# Tasks: 管理端通用数据表增强

**Input**: `specs/006-admin-data-table-enhancement/` 下的 `spec.md`、`plan.md`、`research.md`、`data-model.md`、`quickstart.md` 与 `contracts/`

**Scope**: 首期仅增强 `/content/lo/letters`；覆盖 US-001～US-005、FR-010～FR-021、TC-001～TC-012、TC-E2E-001～003 与六个稳定 `API-*` operationId。

**Path aliases**: `backend:` = `apps/backend/`；`admin:` = `apps/admin/`；`database:` = `database/`。本清单不授权修改 canonical docs、Product Forge 状态、`traceability.yml`、现有冻结 migration 或 `contracts/openapi.yaml` / `contracts/asyncapi.yaml`。

**Execution rule**: 每个测试任务必须先提交并确认在缺少目标实现时失败，随后才能开始其明确覆盖的实现任务。若 authority、冻结 migration、六个 API operationId 或当前代码与计划出现实质漂移，按 Constitution Principle VIII 停止并报告。

## Phase 1: Setup

**Purpose**: 锁定当前基线、测试入口与可重复的 PostgreSQL 验证环境。

- [X] T001 重新核对 authority base、当前 HEAD、1340 migration 空位和六个 API operationId，发现 material drift 时以 REPOSITORY_DRIFT 停止
      Paths: unknown
      Size: S

- [X] T002 [P] 建立 Lao-letter batch 的 disposable PostgreSQL 测试数据工厂，支持多 Operator、多页字母、工作修订和混合状态数据
      Paths: backend:test/support/test-database.ts, backend:test/modules/content/lo-letter-batch-fixtures.ts
      Size: M

- [X] T003 [P] 建立管理端 Lao-letter API mock/fixture，覆盖列表、selection preview、任务摘要和分页逐项结果
      Paths: admin:src/features/content/structured/lo-letter-test-fixtures.ts
      Size: S

**Checkpoint**: 测试环境能隔离创建和销毁数据，且未修改任何既有冻结事实源。

## Phase 2: Foundational

**Purpose**: 完成所有故事共享的数据库结构、核心类型、运行配置和兼容性护栏。

**Dependencies**: Phase 1 完成后开始；本阶段阻塞所有用户故事。

- [X] T004 [P] 为 1340 clean/1330-upgrade、两表字段约束、状态/计数不变量、唯一键、索引、逻辑 UUID 边界和重复执行编写数据库失败测试
      Paths: database:test/content-letter-batch-tasks.test.mjs, database:test/validate.test.mjs
      Test-first: true
      Size: L

- [X] T005 实现仅向前的 1340 migration，创建 Content batch task/item 两表、CHECK、ON DELETE RESTRICT 和已批准索引，不修改任何旧 migration
      Paths: database:migrations/1340_content_letter_batch_tasks.sql
      Size: L

- [X] T006 更新 schema 期望为总表数 133（131 business + 2 infrastructure）、Content 表数 38，并通过生成器刷新 required migration manifest <!-- CR-001: correct derived table counts to the current 1330 repository baseline -->
      Paths: database:checks/expected-schema.json, database:test/validate.test.mjs, backend:src/database/required-migrations.generated.ts
      Size: M

- [X] T007 [P] 为规范化查询、selection hash、动作权限/原因规则以及 task/item 合法与非法转换编写纯单元失败测试（TC-002、TC-007）
      Paths: backend:test/modules/content/lo-letter-query.unit.test.ts, backend:test/modules/content/lo-letter-batch-state.unit.test.ts
      Test-first: true
      Size: M

- [X] T008 实现 Lao-letter 查询/selection 值对象、NFC 与有序去重 normalizer、私有版本化 SHA-256 encoder、动作规则和 task/item 状态机
      Paths: backend:src/modules/content/domain/lo-letter-admin-query.ts, backend:src/modules/content/domain/lo-letter-batch-task.ts, backend:src/modules/content/domain/index.ts
      Size: L

- [X] T009 [P] 定义 letter query、selection freeze、batch task 和事务执行器的 Content application ports，保持 Content/Operations 物理仓储隔离
      Paths: backend:src/modules/content/application/ports/lo-letter-admin-repository.ts, backend:src/modules/content/application/ports/repositories.ts
      Size: M

- [X] T010 [P] 为五项 worker 配置默认值、边界和非法环境变量编写失败测试
      Paths: backend:test/unit/config.test.ts
      Test-first: true
      Size: S

- [X] T011 实现 polling=1000ms、batch=50、concurrency=4、active-limit=100、retry-after=5s 的环境配置解析
      Paths: backend:src/config/schema.ts, backend:src/config/env.ts
      Size: S

**Checkpoint**: migration、领域不变量和配置护栏可独立验证；故事层可在共同基础上开发。

## Phase 3: User Story 1 — 服务端浏览与 URL 状态（P1）

**Goal**: 搜索、筛选、排序、分页和页面状态由 URL 与服务端结果一致驱动。

**Independent Test**: 访问 `/content/lo/letters`，刷新后查询条件保持；默认 50、最大 500、501 拒绝；筛选/页大小变化回第一页，空末页回退，加载/首次空/无结果/错误状态不同。

**Coverage**: US-001；FR-010、FR-011、FR-019；TC-001、TC-012（浏览切片）、TC-E2E-001（浏览切片）；`API-LettersQuery`。

### Tests

- [X] T012 [P] [US1] 为默认 50、500/501 边界、白名单过滤排序、UUID 稳定破同序、准确 total、快照一致性和安全字段编写 PostgreSQL/API 失败测试（TC-001）
      Paths: backend:test/modules/content/lo-letter-query.integration.test.ts, backend:test/modules/content/lo-letter-admin-http.contract.test.ts
      Test-first: true
      Size: L

- [X] T013 [P] [US1] 为共享 DataTable opt-in server pagination/sorting/totals 及既有 client mode 回归编写组件失败测试（TC-011）
      Paths: admin:src/components/data-table/data-table.test.tsx
      Test-first: true
      Size: M

- [X] T014 [P] [US1] 为 Lao-letter DTO、query key、AbortSignal、Router search 往返、重置规则、空页回退和各页面状态编写失败测试
      Paths: admin:src/features/content/structured/contracts.test.ts, admin:src/features/content/structured/lo-letter-page.test.tsx, admin:src/app/router/router.test.tsx
      Test-first: true
      Size: L

- [X] T015 [US1] 先编写 TC-E2E-001 的 URL 搜索/筛选/排序/分页刷新与恢复场景骨架并确认其在实现前失败
      Paths: admin:e2e/content-management.spec.ts
      Test-first: true
      Size: M

### Implementation

- [X] T016 [US1] 实现 read-only REPEATABLE READ 字母列表查询仓储，使用静态 SQL map、绑定参数、工作修订优先回退和 public UUID 稳定排序
      Paths: backend:src/modules/content/infrastructure/postgres-lo-letter-admin-repository.ts, backend:src/modules/content/infrastructure/index.ts
      Size: L

- [X] T017 [US1] 实现 letter-specific 查询用例和 coarse `batch_actions` 计算，不扩展通用 structured repository 的任意过滤能力
      Paths: backend:src/modules/content/application/use-cases/query-lo-letter-admin-list.ts, backend:src/modules/content/application/index.ts
      Size: M

- [X] T018 [US1] 挂载 `API-LettersQuery`，执行严格 Zod 查询校验、read 权限和 ADR-023 HTTP 200 信封映射
      Paths: backend:src/modules/content/http/lo-letter-batch-routes.ts, backend:src/modules/content/http/composition.ts, backend:src/modules/content/http/index.ts
      Size: M

- [X] T019 [US1] 为共享 DataTable 添加 opt-in controlled server pagination/sorting/totals，未传 server 配置时保持全部 client 默认行为
      Paths: admin:src/components/data-table/data-table.tsx, admin:src/components/data-table/data-table-pagination.tsx
      Size: L

- [X] T020 [P] [US1] 实现 Lao-letter DTO/Zod、共享 apiClient wrappers 和包含规范化查询及页参数的 TanStack Query keys，并透传 AbortSignal
      Paths: admin:src/features/content/structured/contracts.ts, admin:src/features/content/structured/api.ts, admin:src/features/content/structured/queries.ts
      Size: M

- [X] T021 [US1] 实现严格 Router search 校验、300ms 搜索导航、筛选/排序/页大小更新与 page reset
      Paths: admin:src/app/router/router.tsx, admin:src/features/content/pages/category.tsx
      Size: M

- [X] T022 [US1] 组合 Lao-letter 服务端列表和加载/背景刷新/首次空/无匹配/可恢复错误 UI，重试保留 URL 且空页替换到最近有效页
      Paths: admin:src/features/content/structured/lo-letter-table.tsx, admin:src/features/content/pages/category.tsx
      Size: L

**Checkpoint**: US-001 可在不启用列定制、跨页选择或批量任务时独立浏览并验证。

## Phase 4: User Story 2 — 列设置与固定操作列（P1）

**Goal**: 用户可持久化非关键列显示，选择列和操作列不可隐藏，横向滚动后操作仍可用。

**Independent Test**: 隐藏可选列并刷新后偏好保留；恢复默认列清除偏好；选择列（启用时）与操作列不出现在可隐藏选项中且 sticky-right 可键盘聚焦。

**Coverage**: US-002；FR-012；FR-012-AS01；TC-012（列设置切片）、TC-E2E-001（列设置切片）。

### Tests

- [X] T023 [US2] 为 controlled visibility、非法/过期 column ID、恢复默认、不可隐藏选择/操作列、sticky 横向滚动和键盘焦点编写组件失败测试
      Paths: admin:src/components/data-table/data-table.test.tsx, admin:src/features/content/structured/lo-letter-page.test.tsx
      Test-first: true
      Size: M

### Implementation

- [X] T024 [US2] 扩展 DataTable controlled column visibility 接口和 view-options 禁用规则，保持既有非受控调用方兼容
      Paths: admin:src/components/data-table/data-table.tsx, admin:src/components/data-table/data-table-view-options.tsx
      Size: M

- [X] T025 [US2] 实现版本化 Lao-letter 列偏好、无效 ID 清理、恢复默认，以及 selection/action `enableHiding: false`
      Paths: admin:src/features/content/structured/lo-letter-columns.tsx, admin:src/features/content/structured/lo-letter-column-preferences.ts
      Size: M

- [X] T026 [US2] 为表格容器和操作列添加横向滚动、sticky-right、语义 header/caption 与可见 focus 样式
      Paths: admin:src/components/data-table/data-table.tsx, admin:src/features/content/structured/lo-letter-columns.tsx
      Size: S

**Checkpoint**: US-002 列行为可独立通过 FR-012-AS01 和 TC-E2E-001 的列设置切片。

## Phase 5: User Story 3 — 本页选择升级为当前查询全部（P1）

**Goal**: 本页三态选择和显式 query-all 升级具有准确范围、数量与服务端 opaque hash，目标查询变化立即失效。

**Independent Test**: 表头只影响本页并显示三态；全选本页后才能升级 query-all；预览显示规范化 query/count/hash；查询改变清空选择；陈旧目标返回 `BATCH_SELECTION_CHANGED` 且无写入。

**Coverage**: US-003；FR-013、FR-014、FR-021；TC-002、TC-003、TC-012（选择切片）、TC-E2E-002/003（选择切片）；`API-LettersSelectionPreview`。

### Tests

- [X] T027 [P] [US3] 为 selection preview、相同语义 query/hash、完整 UUID 集合重算及 stale count/hash 零写入编写 PostgreSQL/API 失败测试（TC-002、TC-003）
      Paths: backend:test/modules/content/lo-letter-selection.integration.test.ts, backend:test/modules/content/lo-letter-admin-http.contract.test.ts
      Test-first: true
      Size: L

- [X] T028 [P] [US3] 为 DataTable page-local 三态选择、stable content_id、显式 query-all 升级、范围 banner 和查询变更失效编写组件失败测试
      Paths: admin:src/components/data-table/data-table.test.tsx, admin:src/features/content/structured/lo-letter-selection.test.tsx
      Test-first: true
      Size: L

- [X] T029 [US3] 先编写 TC-E2E-002 的页内全选→query-all preview 场景和 TC-E2E-003 的 stale selection 场景并确认实现前失败
      Paths: admin:e2e/content-management.spec.ts
      Test-first: true
      Size: M

### Implementation

- [X] T030 [US3] 实现 preview 的完整 UUID 解析、固定字段编码/hash 和 query-all 重算能力，页面参数不进入 selection descriptor
      Paths: backend:src/modules/content/infrastructure/postgres-lo-letter-admin-repository.ts, backend:src/modules/content/application/use-cases/manage-lo-letter-selection.ts
      Size: L

- [X] T031 [US3] 挂载 `API-LettersSelectionPreview`，限制 read 权限并仅返回规范化 query、expected_count 和 selection_hash
      Paths: backend:src/modules/content/http/lo-letter-batch-routes.ts
      Size: S

- [X] T032 [US3] 为 DataTable 提供受控 RowSelectionState、page-local mixed checkbox 和选择数量回调，不让通用组件理解 query_all
      Paths: admin:src/components/data-table/data-table.tsx, admin:src/components/data-table/data-table-column-header.tsx
      Size: M

- [X] T033 [US3] 实现 feature-local `none | page_ids | query_all` 状态、显式升级 banner、preview 调用和所有目标查询变化的同步失效
      Paths: admin:src/features/content/structured/lo-letter-selection.ts, admin:src/features/content/structured/lo-letter-batch-bar.tsx, admin:src/features/content/pages/category.tsx
      Size: L

**Checkpoint**: US-003 能独立证明页内选择不会静默扩大，且 query-all 的陈旧集合不会被提交。

## Phase 6: User Story 4 — 确认并提交批量动作（P1）

**Goal**: 从服务端允许动作中选择五项批量审核动作，经确认、原因、幂等和权限校验后创建持久化异步任务。

**Independent Test**: 五项动作均二次确认；reject/archive 空原因前后端拒绝；伪造权限失败；同 key 同请求返回原任务、不同请求 `CONFLICT`；合法与非法项独立处理且每个成功项有唯一 Operations audit `batch_task_id`。

**Coverage**: US-004；FR-015、FR-016、FR-017、FR-020、FR-021；TC-004～TC-007、TC-012（提交切片）、TC-E2E-002/003（提交切片）；`API-LettersBatchStart`。

### Tests

- [X] T034 [P] [US4] 为 task freeze、active limit、同/异请求幂等、reason 规则、selection drift 和持久化计数编写 PostgreSQL 失败测试（TC-003、TC-004、TC-007）
      Paths: backend:test/modules/content/lo-letter-batch-task.integration.test.ts
      Test-first: true
      Size: L

- [X] T035 [P] [US4] 为 start operation 的 strict body/header、五项权限、ADR-023、RATE_LIMITED、BATCH/CONFLICT code 和 UUID-only 响应编写 API 失败测试
      Paths: backend:test/modules/content/lo-letter-admin-http.contract.test.ts
      Test-first: true
      Size: L

- [X] T036 [P] [US4] 为四 worker 并发 claim、混合状态、权限撤销、单项事务和成功审计原子性编写 PostgreSQL 失败测试（TC-005、TC-006）
      Paths: backend:test/modules/content/lo-letter-batch-worker.integration.test.ts, backend:test/integration/operations-content-batch-audit.test.ts
      Test-first: true
      Size: L

- [X] T037 [P] [US4] 为 server `batch_actions`、全部确认、trimmed reason、禁用上线/下线和 transport retry 复用 idempotency key 编写管理端失败测试（TC-007）
      Paths: admin:src/features/content/structured/lo-letter-batch-actions.test.tsx
      Test-first: true
      Size: L

### Implementation

- [X] T038 [US4] 实现事务内 queue admission、幂等 canonical request 比较、目标冻结、task/item 插入和 `queued` 提交的 batch repository
      Paths: backend:src/modules/content/infrastructure/postgres-lo-letter-batch-repository.ts
      Size: L

- [X] T039 [US4] 实现 `createTask` application service，复核 action permission、reason、selection count/hash 并映射 `CONFLICT`、`RATE_LIMITED`、`BATCH_SELECTION_CHANGED`
      Paths: backend:src/modules/content/application/use-cases/manage-lo-letter-batch-tasks.ts, backend:src/modules/content/application/index.ts
      Size: L

- [X] T040 [US4] 扩展 Operations public boundary：按 Operator UUID 重查权限并在调用方事务 executor 中写成功审计，Operations 继续拥有查询与持久化
      Paths: backend:src/modules/operations/public/contracts.ts, backend:src/modules/operations/public/permissions.ts, backend:src/modules/operations/public/index.ts
      Size: L

- [X] T041 [US4] 实现 worker 单周期认领与逐项事务：SKIP LOCKED、复用单条 Content 状态机、权限撤销 skipped/FORBIDDEN、业务失败隔离、成功审计与 counters 同事务
      Paths: backend:src/modules/content/application/use-cases/process-lo-letter-batch.ts, backend:src/modules/content/infrastructure/postgres-lo-letter-batch-repository.ts
      Size: L

- [X] T042 [US4] 将 Content batch polling job 注册进 WorkerHost，应用配置化 poll/batch/concurrency 且不引入 broker/outbox 业务存储
      Paths: backend:src/bootstrap/build-worker.ts, backend:src/modules/content/http/composition.ts
      Size: M

- [X] T043 [US4] 挂载 `API-LettersBatchStart`，校验 Idempotency-Key、严格 request body 和安全业务错误信封
      Paths: backend:src/modules/content/http/lo-letter-batch-routes.ts
      Size: M

- [X] T044 [US4] 实现服务端动作驱动的批量菜单与 Base UI 确认对话框，展示动作/范围/数量，约束 reason，并在未知结果前复用同一 idempotency key
      Paths: admin:src/features/content/structured/lo-letter-batch-actions.tsx, admin:src/features/content/structured/api.ts, admin:src/features/content/pages/category.tsx
      Size: L

**Checkpoint**: US-004 可创建 Content task UUID；没有批量上线/下线、物理删除、未确认提交或跨域直接写审计。

## Phase 7: User Story 5 — 异步结果、所有权与失败项重试（P1）

**Goal**: 创建者可长期查看任务/分页结果，观察全部或部分完成，且只重试 failed 项；进程重启和并发不得重复成功工作。

**Independent Test**: 任务从 queued/running 到合法终态；逐项分页区分 succeeded/failed/skipped；非创建者不可发现；失败项重试不触碰 succeeded/skipped；worker 中断后恢复且成功动作/audit 不重复。

**Coverage**: US-005；FR-017、FR-018、FR-019、FR-020、FR-021；TC-005、TC-008～TC-010、TC-012、TC-E2E-003；`API-LettersBatchTaskList`、`API-LettersBatchTask`、`API-LettersBatchRetry`。

### Tests

- [X] T045 [P] [US5] 为 owned history/detail 分页、状态过滤、non-disclosing ownership 和三项 API 信封/业务码编写 PostgreSQL/API 失败测试（TC-009）
      Paths: backend:test/modules/content/lo-letter-batch-task.integration.test.ts, backend:test/modules/content/lo-letter-admin-http.contract.test.ts
      Test-first: true
      Size: L

- [X] T046 [P] [US5] 为 finalization、failed-only retry、非法重试、并发 retry/finalize、crash rollback/restart 和零重复成功审计编写 PostgreSQL 失败测试（TC-008、TC-010）
      Paths: backend:test/modules/content/lo-letter-batch-worker.integration.test.ts, backend:test/integration/operations-content-batch-audit.test.ts
      Test-first: true
      Size: L

- [X] T047 [P] [US5] 为 2s 可见页 polling、终态停止、aria-live、列表 invalidation、分页结果、部分完成和 failed-only retry 编写管理端失败测试
      Paths: admin:src/features/content/structured/lo-letter-batch-task-panel.test.tsx
      Test-first: true
      Size: L

- [X] T048 [US5] 补全 TC-E2E-003 的混合结果、创建者可见、失败项重试和无取消入口断言并确认实现前失败
      Paths: admin:e2e/content-management.spec.ts
      Test-first: true
      Size: M

### Implementation

- [X] T049 [US5] 实现 owner-scoped task list/detail 的稳定分页，以及锁定 failed items、回退 counters 和 retry_count 后返回 queued 的事务仓储方法
      Paths: backend:src/modules/content/infrastructure/postgres-lo-letter-batch-repository.ts
      Size: L

- [X] T050 [US5] 实现 `listOwnedTasks`、`getOwnedTask`、`retryFailed` 和 task finalization，completed 或无 failed item 映射 `BATCH_TASK_NOT_RETRYABLE`
      Paths: backend:src/modules/content/application/use-cases/manage-lo-letter-batch-tasks.ts, backend:src/modules/content/application/use-cases/process-lo-letter-batch.ts
      Size: L

- [X] T051 [US5] 挂载 `API-LettersBatchTaskList`、`API-LettersBatchTask`、`API-LettersBatchRetry`，强制 read/原动作权限、创建者 predicate 和安全分页 DTO
      Paths: backend:src/modules/content/http/lo-letter-batch-routes.ts
      Size: L

- [X] T052 [US5] 实现任务 list/detail/retry 的管理端 DTO、API wrappers、query keys 和终态失效策略
      Paths: admin:src/features/content/structured/contracts.ts, admin:src/features/content/structured/api.ts, admin:src/features/content/structured/queries.ts
      Size: M

- [X] T053 [US5] 实现 active task panel：可见页 queued/running 每 2s polling、终态停止、分页逐项结果、全部/部分完成、aria-live 与 failed-only retry
      Paths: admin:src/features/content/structured/lo-letter-batch-task-panel.tsx, admin:src/features/content/pages/category.tsx
      Size: L

- [X] T054 [US5] 在任务终态刷新当前列表并修正空页，保留有效查询上下文且不提供 cancel/delete/export/跨 Content controls
      Paths: admin:src/features/content/structured/queries.ts, admin:src/features/content/pages/category.tsx
      Size: M

**Checkpoint**: US-005 独立满足创建者可见、结果可解释、失败项可重试和 durable recovery。

## Phase 8: Polish & Cross-Cutting Verification

**Purpose**: 在所有故事完成后收集跨层、性能、安全、可访问性和完整验证证据；不在本阶段补写先前实现所需的测试。

- [X] T055 [P] 执行 TC-E2E-001～003、axe 与键盘流程并修复测试已揭示的跨故事集成缺陷，保持 0 serious/critical
      Paths: admin:e2e/content-management.spec.ts
      Size: L

- [X] T056 [P] 用代表性 disposable 数据采集默认/500 行/广泛子串/常用筛选的 EXPLAIN ANALYZE BUFFERS 与 p95，按证据保留或移除 1340 中候选索引
      Paths: database:migrations/1340_content_letter_batch_tasks.sql, database:test/content-letter-batch-tasks.test.mjs
      Size: L

- [X] T057 [P] 验证 queue saturation、响应不含全量目标集、reason/内部 ID/SQL/stack 不进入响应日志指标，以及 queue depth/oldest age/cycle duration/outcome 可观测性
      Paths: backend:test/modules/content/lo-letter-admin-http.contract.test.ts, backend:test/modules/content/lo-letter-batch-worker.integration.test.ts, backend:src/bootstrap/build-worker.ts
      Size: L

- [X] T058 执行 database test/validate、backend manifest/typecheck/lint/test/integration/verify 与 admin typecheck/lint/test/e2e/verify，记录逐 FR/TC 的真实命令结果并在任何失败处停止交付声明
      Paths: database:test/, backend:test/, admin:src/, admin:e2e/
      Size: M

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Phase 1)** → 无依赖；T001 完成且无 drift 后，T002 与 T003 可并行。
2. **Foundational (Phase 2)** → 依赖 Phase 1；T004 → T005 → T006，T007 → T008，T010 → T011；T009 可与这些链并行，但必须在任何 repository/service 实现前完成。
3. **US-001 (Phase 3)** → 依赖 Foundation；测试 T012～T015 先行，随后 backend 链 T016 → T017 → T018、shared admin 链 T019、feature admin 链 T020 → T021 → T022。
4. **US-002 (Phase 4)** → 依赖 T019 和 US2 测试 T023；T024 → T025/T026。其测试设计可在 US-001 后端工作期间并行。
5. **US-003 (Phase 5)** → 依赖 T008、T009、T016、T019；测试 T027～T029 先行，backend T030 → T031，admin T032 → T033。
6. **US-004 (Phase 6)** → 依赖 US-003 的稳定 selection descriptor；测试 T034～T037 先行，backend T038/T040 → T039/T041 → T042/T043，admin T044 依赖 T043。
7. **US-005 (Phase 7)** → 依赖已可创建和执行任务的 US-004；测试 T045～T048 先行，T049 → T050 → T051/T052 → T053 → T054。
8. **Polish (Phase 8)** → 依赖计划交付的五个故事；T055～T057 可并行，全部通过后执行 T058。

### User Story Dependency Graph

```text
Setup → Foundation → US-001 ─┬→ US-002
                             └→ US-003 → US-004 → US-005

US-001 + US-002 + US-003 + US-004 + US-005 → Polish
```

- **US-001** 是最小可部署浏览增量，也是 US-003 的 query/URL 基础。
- **US-002** 在共享 DataTable server seam 完成后与 US-003 的后端工作可并行。
- **US-003** 锁定 selection descriptor 后，US-004 才能安全冻结目标并创建任务。
- **US-004** 提供 task creation/worker，US-005 在其上增加 owned observation、finalization 和 retry。

### Parallel Examples

#### User Story 1

```text
并行 A: T012 后端查询/API 测试 → T016 → T017 → T018
并行 B: T013 共享 DataTable 测试 → T019
并行 C: T014/T015 管理端契约、路由和 E2E 测试 → T020 → T021；汇合后 T022
```

#### User Story 2

```text
T023 完成后：T024；随后 T025 与 T026 可由不同人员在不重叠文件部分协调并行。
```

#### User Story 3

```text
并行 A: T027 → T030 → T031
并行 B: T028/T029 → T032 → T033
```

#### User Story 4

```text
并行 A: T034/T035 → T038 → T039 → T043
并行 B: T036 → T040 → T041 → T042
并行 C: T037 → T044（等待 T043 的真实 API）
```

#### User Story 5

```text
并行 A: T045/T046 → T049 → T050 → T051
并行 B: T047/T048 → T052（契约稳定后）→ T053 → T054
```

## Implementation Strategy

### MVP First

1. 完成 Setup 与 Foundational。
2. 完成 US-001 并独立运行 TC-001、TC-011 的兼容切片和 TC-E2E-001 的浏览切片。
3. 在进入写操作前部署/演示可恢复 URL 驱动的服务端浏览 MVP。

### Incremental Delivery

1. **US-001**：服务端定位与可恢复 URL。
2. **US-002**：列密度和固定操作入口。
3. **US-003**：明确、安全的跨页目标选择。
4. **US-004**：确认、幂等创建与逐项异步执行。
5. **US-005**：长期结果、恢复和 failed-only retry。
6. **Polish**：只做跨层验证和基于既有失败测试的修复；不得以测试阶段为由扩展产品范围。

## Coverage Audit

| Story | Task IDs | Requirements | Critical tests | API operations |
| --- | --- | --- | --- | --- |
| US-001 | T012–T022 | FR-010, FR-011, FR-019 | TC-001, TC-011, TC-012 slice, TC-E2E-001 slice | API-LettersQuery |
| US-002 | T023–T026 | FR-012 | FR-012-AS01, TC-012 slice, TC-E2E-001 slice | — |
| US-003 | T027–T033 | FR-013, FR-014, FR-021 | TC-002, TC-003, TC-012 slice, TC-E2E-002/003 slice | API-LettersSelectionPreview |
| US-004 | T034–T044 | FR-015, FR-016, FR-017, FR-020, FR-021 | TC-003–TC-007, TC-012 slice, TC-E2E-002/003 slice | API-LettersBatchStart |
| US-005 | T045–T054 | FR-017, FR-018, FR-019, FR-020, FR-021 | TC-005, TC-008–TC-010, TC-012, TC-E2E-003 | API-LettersBatchTaskList, API-LettersBatchTask, API-LettersBatchRetry |

All FR-010～FR-021、5/5 Must Have stories、TC-001～TC-012、TC-E2E-001～003 和六个 API operations 均至少映射到一个先行测试与后续实现/验证任务。

## Notes

- `[P]` 仅表示路径与未完成依赖允许并行；修改同一文件的任务仍需串行或先明确分区。
- `Size: S/M/L` 是单任务相对规模；L 任务仍限制在单一主要层或单一事务能力内。
- `archive` 只写 `contents.status='archived'`；任务与 items 长期保留且不可取消。
- 每个数据库事务、并发、恢复结论都必须来自真实 PostgreSQL；mock 不构成该类证据。
