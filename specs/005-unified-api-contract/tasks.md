---

description: "Task list for 前后端统一请求格式与业务状态码 (Unified API Contract & Business Status Codes)"

---

# Tasks: 前后端统一请求格式与业务状态码 (Unified API Contract & Business Status Codes)

**Input**: Design documents from `/specs/005-unified-api-contract/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: 本功能为跨端契约改造,采用契约测试(信封形状 + 业务码 + HTTP 200)+ 单元测试
(前端映射字典)+ 集成/冒烟(代码判定),与 spec 的 Given/When/Then 验收场景对应。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. **注意**：本功能各用户故事共享同一套信封/错误码改造,「后端统一信封 + 错误码迁移」是**全部故事共用的阻塞基础**,置于 Foundational(Phase 2);各故事在其上叠加独立可测的 facet。

> ✅ 架构变更已批准(ADR-023 + D-156,2026-09-03),SPEC_CONFLICT GATE 已通过;
> 实施前置(api-standard 修订、business-status-codes 词汇表、契约快照回写)已完成。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- 后端: `apps/backend/src/...`
- Admin 前端: `apps/admin/src/api/...`
- Mobile 前端: `apps/mobile/src/api/...`
- 权威文档: `docs/docs/developer/reference/...`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 项目基础结构,沿用现有 monorepo 分层,无需新建脚手架;仅建立本功能新增文件的占位与目录。

- [X] T001 创建后端业务状态码模块占位 `apps/backend/src/errors/business-codes.ts`(空文件,枚举在 Foundational 填充)
- [X] T002 [P] 创建后端响应信封 hook 占位 `apps/backend/src/http/response-envelope.ts`(空文件,onSend 包裹在 Foundational 填充)
- [X] T003 [P] 创建后端信封契约测试占位 `apps/backend/src/errors/__tests__/response-envelope.test.ts`(空文件,断言在对应故事填充)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 所有用户故事依赖的**共用阻塞基础**——后端统一信封(成功 onSend + 错误 error-handler)、
业务状态码枚举与全量迁移、Content 内联错误改 AppError、前端业务码映射字典。
此阶段未完成前任何用户故事都无法开始。

**🔴 CRITICAL**: 本阶段是跨端契约的「地基」,完成后所有故事共享同一信封;同步切版依赖本阶段三端同时就绪。

### Foundational Tasks

- [X] T004 新增 `BUSINESS_STATUS_CODES` 枚举 + `BusinessStatusCode` TS 联合类型(50 + 3 码,分组注释),严格对应 `docs/docs/developer/reference/architecture/applications/business-status-codes.md`(frozen)在 `apps/backend/src/errors/business-codes.ts`
- [X] T005 改造 `AppError` 的 `code` 字段类型约束为 `BusinessStatusCode`(或编译期校验),保留 `httpStatus` 为「参考语义」在 `apps/backend/src/errors/app-error.ts`
- [X] T006 改造 `error-handler.ts` 输出统一错误信封 `{ code, error: { message, details? }, request_id }`,HTTP 一律 **200**(不再用 `error.httpStatus` 决定响应码;`request_id` 顶层取 `request.id`,认证前失败也携带)在 `apps/backend/src/errors/error-handler.ts`
- [X] T007 [P] 新增 `installResponseEnvelope(app)` onSend hook:对业务 JSON 成功响应包裹 `{ code:"OK", data, request_id }` + 统一 HTTP 200;豁免 `/health/live`、`/health/ready` 与已输出错误信封(形态判别)在 `apps/backend/src/http/response-envelope.ts`
- [X] T008 在 `build-app.ts` 安装 `installResponseEnvelope(app)`(置于 `installErrorHandler` 之后)在 `apps/backend/src/bootstrap/build-app.ts`
- [X] T009 契约测试: 统一信封形状(成功 code=OK+data、失败 code≠OK+error、request_id 恒存在、HTTP 200)+ 健康检查豁免在 `apps/backend/src/errors/__tests__/response-envelope.test.ts`
- [X] T010 [P] Content 域内联错误改走 `AppError`: `admin-routes.ts` 的 `{ error:'UNICODE_CONFLICT'/'ACTIVE_WORK_CONFLICT'/'ILLEGAL_STATE_TRANSITION', message }` 改为 `throw new AppError({ code, message, httpStatus })`,统一进 error-handler 在 `apps/backend/src/modules/content/http/admin-routes.ts`
- [X] T011 [P] Content 域 `public-routes.ts` 内联 `{ error:'INTERNAL_ERROR', message }` 改走 `AppError` 在 `apps/backend/src/modules/content/http/public-routes.ts`
- [X] T012 全量错误码归一: 检查 `identity/operations/platform` 各域 `AppError` 实例的 `code` 是否均为 `UPPER_SNAKE_CASE` 且 ∈ `BUSINESS_STATUS_CODES`;不一致的改为引用 `business-codes.ts` 在 `apps/backend/src/modules/{identity,operations,platform}/http/*.ts` 与 `application/**/*.ts`
- [X] T013 Admin 前端业务码映射字典: `ApiErrorKind` 以业务码为键(unauthorized/forbidden/not_found/validation/conflict/rate_limit/server/unknown),保留 `request_id`/`details`/`retryable` 在 `apps/admin/src/api/errors/api-error.ts`
- [X] T014 [P] Admin `mapHttpError` 改为业务码字典 + 传输层非 200 兜底在 `apps/admin/src/api/errors/index.ts`
- [X] T015 [P] Admin `ApiErrorBody` 字段与后端对齐(`request_id` 顶层,信封 `{ code, data?, error? }`)在 `apps/admin/src/api/contracts/error.ts`
- [X] T016 Mobile 错误映射: `mapHttpFailure` 增加「HTTP 200 + 信封按 code 映射」分支,保留传输层 status 兜底在 `apps/mobile/src/api/errors/mapHttpError.ts`

**Checkpoint**: 后端统一信封 + 业务码枚举 + Content 内联统一 + 三端映射字典就绪,可开始用户故事实现。

---

## Phase 3: User Story 1 - 前端以业务状态码判断成败 (Priority: P1) 🎯 MVP

**Goal**: 前端以响应体顶层 `code` 判定成败(HTTP 一律 200 下的唯一权威),Admin/Mobile 业务分支稳定。

**Independent Test**: 前端对成功接口与业务失败接口,仅读 `code` 即正确判定成败并渲染;即使 HTTP 强制 200 行为不变(quickstart 场景 1/3/7/8;US-001-AS1/2/3)。

> 依赖 Foundational 的三端信封/字典。US1 是 MVP 核心——完成后端信封 + Admin/Mobile code 判定即可独立交付。

### Tests for User Story 1

- [X] T017 [P] [US1] Admin 单元测试: `ApiClient` 解析信封 + `code` 判定(成功/各业务码/传输层兜底)在 `apps/admin/src/api/client/http-client.test.ts`
- [X] T018 [P] [US1] Mobile 单元测试: `mapHttpError` 业务码 switch + status 兜底在 `apps/mobile/src/api/errors/mapHttpError.test.ts`(或现有错误映射测试)
- [X] T019 [P] [US1] 契约测试: 后端所有业务响应 HTTP 200 + 信封断言(逐业务码)在 `apps/backend/src/errors/__tests__/response-envelope.test.ts`

### Implementation for User Story 1

- [X] T020 [US1] Admin `ApiClient.request` 实现信封解析: `code==="OK"` 解包 `data`;否则按业务码构造 `ApiError`;`requestId` 从顶层 `request_id` 取在 `apps/admin/src/api/client/http-client.ts`
- [X] T021 [US1] Mobile `httpClient` 实现信封解析(与 Admin 一致): `code` 判定 + `request_id` 对齐在 `apps/mobile/src/api/client/httpClient.ts`

**Checkpoint**: Admin/Mobile 以 `code` 判定成败,后端信封契约测试通过。

---

## Phase 4: User Story 2 - 统一成功信封 (Priority: P1)

**Goal**: 成功响应统一 `{ code:"OK", data, request_id }`,载荷结构不变;无返回体操作为 `data:null`。

**Independent Test**: 后端任意成功路由返回顶层 `code` + `data`;前端统一解包,`data:null` 不报错(quickstart 场景 1/2;US-002-AS1~4)。

> 依赖 Foundational 的 onSend 包裹(T007/T008)。US2 是成功信封的验收故事。

### Tests for User Story 2

- [X] T022 [P] [US2] 契约测试: 成功信封 `code=OK` + `data` 载荷与现状一致、`data:null` 无返回体在 `apps/backend/src/errors/__tests__/response-envelope.test.ts`

### Implementation for User Story 2

- [X] T023 [US2] 验证 onSend 包裹后各域成功载荷不漂移: 检查 `management-routes.ts`/`operations/routes.ts`/`identity/routes.ts` return 载荷被正确包入 `data`(不需要改 handler,onSend 已处理)在 `apps/backend/src/http/response-envelope.ts`(如需调整豁免/包裹规则)
- [X] T024 [US2] Admin 前端确认 `data:null` 处理(无返回体不报错)在 `apps/admin/src/api/client/http-client.ts`

**Checkpoint**: 成功信封统一,载荷不漂移,`data:null` 正常。

---

## Phase 5: User Story 3 - 统一错误信封与业务状态码 (Priority: P1)

**Goal**: 失败响应统一 `{ code:<业务码>, error{message,details?}, request_id }`;业务码为前端分支权威;六类业务语义(未认证/权限/校验/冲突/频控/服务端异常)在 HTTP 200 下正确分支。

**Independent Test**: 六类业务失败返回 HTTP 200 + 对应业务码 + error 详情,前端正确分支(未认证→登出、权限→提示、冲突→刷新等)(quickstart 场景 3-6;US-003-AS1~5)。

> 依赖 Foundational 的错误信封(T006)与前端字典(T013/T016)。US3 是错误语义的验收故事。

### Tests for User Story 3

- [X] T025 [P] [US3] 契约测试: 六类业务码错误信封(未认证/权限/校验/冲突/频控/服务端)+ `request_id` 始终存在在 `apps/backend/src/errors/__tests__/response-envelope.test.ts`
- [X] T026 [P] [US3] Admin 集成测试: 六类业务码前端分支(`UNAUTHENTICATED`→登出、`FORBIDDEN`→提示、`VALIDATION_ERROR`→字段定位、`STALE_VERSION_CONFLICT`→刷新、`RATE_LIMITED`→倒计时、`INTERNAL_ERROR`→上报)在 `apps/admin/src/api/errors/api-error.test.ts`
- [X] T027 [P] [US3] Mobile 集成测试: 六类业务码分支在 `apps/mobile/src/api/errors/mapHttpError.test.ts`

### Implementation for User Story 3

- [X] T028 [US3] 后端验证六类错误码映射正确(401→`UNAUTHENTICATED`、403→`FORBIDDEN`、404→`NOT_FOUND`、409→`STALE_VERSION_CONFLICT`/`CONFLICT`、400/422→`VALIDATION_ERROR`、429→`RATE_LIMITED`/`LOGIN_RATE_LIMITED`、500→`INTERNAL_ERROR`)在 `apps/backend/src/errors/error-handler.ts` 与 `business-codes.ts`
- [X] T029 [US3] Admin 前端错误文案与动作接入 `ERROR_MESSAGES`(业务码为键)在 `apps/admin/src/api/errors/api-error.ts`
- [X] T030 [US3] Mobile 前端错误文案与动作接入在 `apps/mobile/src/api/errors/errors.ts`

**Checkpoint**: 六类业务错误在 HTTP 200 下前后端正确分支。

---

## Phase 6: User Story 4 - 前端契约与解析收敛 (Priority: P2)

**Goal**: Admin/Mobile 共用同一套信封类型与解析规则,消除 `request_id` vs `requestId` 字段漂移;请求侧 `snake_case` + 请求头收敛。

**Independent Test**: 后端错误 `request_id` 被 Admin/Mobile 正确读取;三端请求体命名/请求头一致,无漂移(quickstart 场景 7/8;US-004-AS1~4)。

> 依赖 Foundational 的字段对齐(T015)与三端信封解析。US4 是「收敛」的验收故事,含请求侧(FR-021)。

### Tests for User Story 4

- [X] T031 [P] [US4] Admin 单元测试: `request_id` 从信封顶层读取,字段名与后端一致在 `apps/admin/src/api/client/http-client.test.ts`
- [X] T032 [P] [US4] Mobile 单元测试: `request_id`/`error.message` 从统一信封读取在 `apps/mobile/src/api/errors/mapHttpError.test.ts`

### Implementation for User Story 4

- [X] T033 [US4] 审计并修正三端请求头: Admin `http-client` 已发 `X-Request-Id`/`Authorization`;Mobile `httpClient` 确认发 `X-Request-Id`,补缺在 `apps/mobile/src/api/client/httpClient.ts`
- [X] T034 [US4] 请求侧收敛: 审计三端请求体 `snake_case`(zod schema 已遵守),消除残留 camelCase;幂等键语义沿用(关键写操作 `Idempotency-Key`)在 `apps/backend/src/modules/**/http/*.ts` 与 `apps/admin/src/api/`(如无残留则记录确认)

**Checkpoint**: 三端信封类型与解析规则一致,请求侧命名/头字段无漂移。

---

## Phase 7: User Story 5 - 权威文档回写 (Priority: P3)

**Goal**: 实施后确保 `api-standard.md`、`business-status-codes.md`、各域契约快照与代码一致,文档零漂移。

**Independent Test**: 修订后的文档响应示例与代码实现一致;各域契约快照示例为统一信封(quickstart 场景 3;US-005-AS1~3)。

> 依赖全部故事的实现结果。US5 是文档一致性验收。

### Implementation for User Story 5

- [X] T035 [US5] 复核 `docs/docs/developer/reference/architecture/applications/api-standard.md` 与实现一致(信封/HTTP 200/业务码/豁免)在 `docs/docs/developer/reference/architecture/applications/api-standard.md`
- [X] T036 [US5] 复核 `docs/docs/developer/reference/architecture/applications/business-status-codes.md` 与 `business-codes.ts` 交叉校验(无未登记码、无多余码)在 `docs/docs/developer/reference/architecture/applications/business-status-codes.md` 与 `apps/backend/src/errors/business-codes.ts`
- [X] T037 [US5] 复核各域契约快照 identity/operations/learning 的 ADR-023 说明与响应示例一致在 `docs/docs/developer/reference/contracts/{identity,operations,learning}/*_API.md`

**Checkpoint**: 文档与代码零漂移(SC-006)。

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 跨用户故事收尾

- [X] T038 [P] 同步切版发布检查: 确认后端 + Admin + Mobile 三端信封改动在同一发版窗口就绪,无旧客户端依赖 HTTP 状态码残留(版本检查/灰度观察)在发布检查清单
- [X] T039 [P] 执行 quickstart.md 全部验证场景确认通过
- [X] T040 检查 `api-standard.md` 与 `business-status-codes.md` 的双向链接一致(互链)
- [X] T041 清理: 确认无遗留旧信封形态(嵌套 `{ error: {...} }`、`requestId` 字段、Content 内联 `{ error, message }`)在三端代码库中残留

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖,立即开始
- **Foundational (Phase 2)**: 依赖 Setup;**BLOCKS 全部用户故事**(后端信封 + 业务码 + Content 统一 + 三端字典)
- **User Stories (Phase 3-7)**: 依赖 Foundational 完成
  - **US1 (Phase 3)**: 前端以 `code` 判定(MVP 核心,依赖三端信封/字典)
  - **US2 (Phase 4)**: 成功信封验收(依赖 onSend 包裹)
  - **US3 (Phase 5)**: 错误语义验收(依赖错误信封 + 前端字典)
  - **US4 (Phase 6)**: 三端收敛 + 请求侧(依赖字段对齐 + 信封解析)
  - **US5 (Phase 7)**: 文档一致性(依赖全部故事)
- **Polish (Phase 8)**: 依赖全部用户故事

### User Story Dependencies

- **US1 (P1)**: 依赖 Foundational;无其他 story 依赖 → **MVP 核心**
- **US2 (P1)**: 依赖 Foundational(onSend 包裹);与 US1 并行(验收不同 facet)
- **US3 (P1)**: 依赖 Foundational(错误信封 + 字典);与 US1/US2 并行
- **US4 (P2)**: 依赖 Foundational + US1 信封解析;可并行
- **US5 (P3)**: 依赖 US1-4 实现结果;聚合

### Within Each User Story

- 契约测试先行(信封形状断言),再实现
- 后端信封 → 前端判定 → 集成验证
- Story 独立完成后再进入下一优先级

### Parallel Opportunities

- Phase 1 三个 [P] 任务并行
- Phase 2 中 T007/T010/T011/T014/T015/T016 [P] 并行
- US2(T022-T024)、US3(T025-T030)可与 US1(T017-T021)并行(不同 facet/文件)
- US4(T031-T034)内部 [P] 测试并行
- 各故事 [P] 测试并行

---

## Parallel Example: User Story 1

```bash
# Launch all US1 tests together (Admin + Mobile + 后端契约):
Task: "Admin 单元测试: ApiClient 信封解析 + code 判定"
Task: "Mobile 单元测试: mapHttpError 业务码 switch"
Task: "后端契约测试: HTTP 200 + 信封逐码断言"

# Implementation (不同文件,可并行):
Task: "Admin ApiClient 信封解析"
Task: "Mobile httpClient 信封解析"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (前端以 code 判定)
4. **STOP and VALIDATE**: Test US1 independently (三端 code 判定 + 后端信封契约)
5. Deploy/demo if ready

> **注意**: US1 作为 MVP 依赖 Foundational 的三端信封/字典——它们是同一契约的两面,
> 无法分割。MVP = 后端统一信封 + Admin/Mobile code 判定 + 契约测试全绿。

### Incremental Delivery

1. Complete Setup + Foundational → 契约地基就绪
2. Add US1 (code 判定) → Test independently → Deploy/Demo (MVP!)
3. Add US2 (成功信封验收) / US3 (错误语义验收) → Test → 无回归
4. Add US4 (三端收敛 + 请求侧) → Test → 无回归
5. Add US5 (文档一致性) → 零漂移
6. **同步切版**是硬门禁: 三端必须同一发版窗口,无部分切换

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (code 判定)
   - Developer B: US2 (成功信封) + US3 (错误语义)
   - Developer C: US4 (三端收敛 + 请求侧)
3. Stories complete and integrate independently, all sharing the same envelope

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- 契约测试(frontmatter 前先写,FAIL 后再实现)断言信封形状
- Commit after each task or logical group
- 同步切版发布检查(T038)是所有故事完成的硬门禁
- Avoid: 同时改同一文件(信封 hook 与 error-handler 分层);跨故事依赖破坏独立性
