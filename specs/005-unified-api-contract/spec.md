# Feature Specification: 前后端统一请求格式与业务状态码 (Unified API Contract & Business Status Codes)

**Feature Branch**: `005-unified-api-contract`

**Created**: 2026-09-03

**Status**: Approved (Architecture Change Approved)

**Input**: User description: "前后端统一请求格式，使用业务状态码代替请求状态码"

> ✅ **架构变更已批准 (Approved)**
>
> 本功能修订的 `api-standard.md` 响应契约已由设计裁决正式批准:
>
> - **ADR-023** `docs/docs/developer/reference/adr/ADR-023-unified-api-contract.md`
>   （状态 `frozen`）
> - **D-156** `docs/docs/developer/reference/governance/design-register.md`
>   （状态 `frozen`）
>
> 批准的核心决策:
>
> 1. **HTTP 一律 200** + 响应体顶层 `code` 为业务成败的权威表达;
> 2. **统一信封** `{ code, data?, error?, request_id }`,成功 `code:"OK"`+`data`、
>    失败 `code:<业务码>`+`error`、无返回体 `data:null`、`request_id` 始终携带
>    (含认证前失败);
> 3. **同步切版**——后端与 Admin/Mobile 同一发版窗口切换,无版本头双响;
> 4. **全量迁移** `AppError.code` + 业务状态码词汇表;
> 5. **请求侧收敛**(body `snake_case` + 头约定,双向统一);
> 6. 回写 `api-standard.md` 与各域契约快照。

## 背景与现状 (Backstory & Current State)

当前前后端请求/响应格式存在**三处漂移**，且业务语义依赖 HTTP 状态码：

**现状事实（代码层）：**

1. **后端成功响应无统一信封**：各域路由直接返回 ad-hoc 载荷
   （`{items: ...}`、`{feature_flag: ...}`、`{menu: ...}`、`{status: 'ok'}`），
   无 `data` 包裹层，也无顶层业务状态码。参考
   `apps/backend/src/modules/platform/http/management-routes.ts`。
2. **后端错误响应是嵌套 `{ error: {...} }`**：
   `error-handler.ts` 输出 `{ error: { code, message, request_id } }`，而前端
   `api/errors/mapHttpError` 解析的是**扁平 `{ code, message, requestId }`** ——
   **前端 `requestId` 永远取不到（期望 `requestId`，后端给 `request_id`），
   错误包体结构本身漂移**。
3. **前端按 HTTP 状态码映射错误语义**：Admin `mapHttpError` 与 Mobile
   `mapHttpError` 均以 `response.status` 的 401/403/404/409/422/429 switch 决定
   `ApiErrorKind`。业务错误码虽已在 `AppError.code` 存在，但未成为前端分支依据。
4. **文档漂移**：`docs/.../architecture/applications/api-standard.md`（`active`）
   已声明 `{ data }` 成功信封 + `{ error }` 失败信封，但代码并未遵循
   （成功无 `data` 包裹、失败信封字段名 `request_id` 与前端解析的 `requestId`
   不一致）。
5. **业务错误码已在 `AppError.code` 中存在但未规范统一**：
   `INVALID_CREDENTIAL`、`STALE_VERSION_CONFLICT`（预期）、`LOGIN_RATE_LIMITED`、
   `ACCOUNT_DISABLED`、`VALIDATION_ERROR`、`NOT_FOUND`、`CONFLICT`、
   `INVALID_DATA`、`DEVICE_*`、`OTP_*` 等分散在各使用例中，大小写风格不统一
   （部分 `UPPER_SNAKE_CASE`，如 `INVALID_CREDENTIAL`；`error-handler.ts` 中为
   `NOT_FOUND` / `INTERNAL_ERROR`）。

**问题：**
1. 前端无法以**稳定、机器可读的业务状态码**做分支（登录失效、权限不足、业务
   冲突、频控），只能依赖 HTTP 状态码的粗糙映射；
2. 成功路径无统一信封，三端契约类型各自为政，新增接口契约维护成本高；
3. 文档声明与现实代码漂移，违背 Constitution II（权威文档优先）与 VI
   （契约引用现实）。

**目标**：在保留 REST 资源语义（URI / 动词 / 幂等）的前提下，将「请求格式」
**双向统一**——请求侧收敛请求体命名与请求头约定，响应侧统一为单一信封，
并以**业务状态码**作为前后端判断成败与分支的**权威依据**（HTTP 一律 200），
收敛三端解析逻辑，回写权威文档。

## Clarifications

### Session 2026-09-03

- Q1「使用业务状态码代替请求状态码」在 HTTP 层如何落地？ → **A: HTTP 一律 200**
  （含错误）。所有响应 HTTP 状态码固定为 200，业务成败由响应体 `code` 权威表达；
  传输级/网关级（代理、负载均衡、CDN）仍依赖 TCP / 网关自身的非 200 语义，
  不在本契约范围内。
- Q2 统一响应信封采用哪种结构？ → **A: 顶层 `code` + `data`/`error`**。
  单信封同时表达成功与失败：`{ code, data?, error?, request_id }`。
- Q3 打破冻结契约的治理方式？ → **A: 本 spec 同时起草 ADR-023**，批准打破
  `api-standard.md` 的响应契约；ADR 批准后回写 `api-standard.md` 与各域契约快照。
- Q4 兼容期/切换策略？ → **A: 同步切版**——后端与所有存量客户端(Admin/Mobile)
  在**同一个发版窗口内一起切换**，无需版本头/双响；但必须保证端与后端同步发布，
  否则旧客户端对新接口将因无法解析「HTTP 200 + 信封」而故障。
- Q5 业务状态码词汇表的迁移范围？ → **A: 全量迁移**——本 feature 一次性将
  所有现有 `AppError.code`(含各域专属码如 `DEVICE_*`/`OTP_*`/`PLATFORM_*`/
  `SESSION_*`)归一为 `UPPER_SNAKE_CASE` 并登记入统一词汇表，不留过渡期双轨。
  任务量更大、回归面更广，但一步到位。
- Q6 认证失败错误是否携带 `request_id`？ → **A: 始终携带**——所有统一信封
  (含 `UNAUTHENTICATED` 等发生在请求身份归因之前的错误)都携带 `request_id`;
  即使未认证,Fastify 也已在请求入口分配 request id,后端将其回填到错误信封,
  错误一律可追踪。
- Q7「统一请求格式」是否包含请求侧？ → **A: 含请求侧**——不仅统一响应信封与
  业务状态码,同时规范请求侧:请求体命名、请求头约定、幂等键语义等一并收敛,
  真正实现「请求格式」双向统一。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 前端以业务状态码判断成败 (Priority: P1)

作为一名前后端开发者，我希望所有接口返回统一的信封，且以响应体中的业务状态码
作为成败判断的**唯一权威依据**（HTTP 一律 200），以便业务分支稳定、可读、跨端一致。

**Why this priority**: 这是本功能的核心价值——把「HTTP 状态码即业务语义」的隐性
耦合，替换为「业务状态码即业务语义」的显式契约。没有它，统一格式不成立。

**Independent Test**: 对任意一个成功接口与任意一个业务失败接口，前端仅读取
`response.code` 即可正确判断成败并渲染对应状态，且完全忽略 HTTP 状态码
（即使强制把响应 HTTP 状态改成 200，行为不变）。

**Acceptance Scenarios**:

1. **Given** 前端调用一个返回 200 的接口,**When** 响应体 `code` 为
   `OK`,**Then** 前端判定请求成功,并使用 `data` 载荷渲染。
2. **Given** 前端调用一个返回 200 的接口,**When** 响应体 `code` 为业务错误
   码(如 `INVALID_CREDENTIAL`),**Then** 前端判定请求失败,并依据业务状态码
   分支(弹登录失效提示),而非 HTTP 状态码。
3. **Given** 同一业务错误,**When** 在 Admin 与 Mobile 分别消费,**Then** 两端
   依据同一业务状态码得到一致的成败判定与分支。

---

### User Story 2 - 统一成功信封 (Priority: P1)

作为一名前后端开发者，我希望成功响应统一为
`{ code: "OK", data: <payload> }`,以便契约类型单一、解析逻辑收敛。

**Why this priority**: 统一信封是「统一请求格式」的载体。没有标准信封,业务
状态码无处安放。

**Independent Test**: 后端任意成功路由返回的响应体,顶层必含 `code` 与 `data`,
载荷结构不变;前端 `ApiClient` 统一解包 `code` 与 `data`。

**Acceptance Scenarios**:

1. **Given** 一个返回单实体的成功接口,**When** 返回,**Then** 响应体为
   `{ code: "OK", data: {...} }`,`data` 内为原有载荷(如 `{ feature_flag: ... }`)。
2. **Given** 一个返回列表的成功接口,**When** 返回,**Then** 响应体为
   `{ code: "OK", data: { items: [...] } }`。
3. **Given** 一个无返回体的成功操作(原 204),**When** 返回,**Then** 响应体为
   `{ code: "OK", data: null }`(HTTP 仍 200),前端不因缺 `data` 报错。
4. **Given** 前端拿到响应体,**When** `code === "OK"` 且 `data === null`,
   **Then** 前端视为成功空操作,不尝试解析 `data` 字段。

---

### User Story 3 - 统一错误信封与业务状态码 (Priority: P1)

作为一名前后端开发者，我希望失败响应统一为
`{ code: <业务码>, error: { message, ... }, request_id }`,并且业务状态码是
前端分支的权威依据,以便错误处理可读、可本地化、可追踪。

**Why this priority**: 错误语义是统一格式中最敏感的部分——它决定前端如何
向用户展示、如何重试、如何跳转登录。业务状态码取代 HTTP 状态码后,错误语义
必须显式、稳定。

**Independent Test**: 一个业务失败接口返回 HTTP 200 + `code: <业务码>` +
`error` 详情,前端依据业务码渲染对应文案与动作;`request_id` 可用于支持排查。

**Acceptance Scenarios**:

1. **Given** 请求因未认证失败,**When** 后端返回
   `{ code: "UNAUTHENTICATED", error: { message }, request_id }`
   (HTTP 200),**Then** 前端判定为未认证,触发登录失效处理(清除会话、跳转登录)。
2. **Given** 请求因权限不足失败,**When** 后端返回 `code: "FORBIDDEN"`,
   **Then** 前端判定为权限不足,展示无权限提示,不触发登录失效。
3. **Given** 请求因乐观锁冲突失败,**When** 后端返回 `code: "STALE_VERSION_CONFLICT"`
   且 `error` 内含冲突版本元数据,**Then** 前端展示冲突提示并提示刷新重试。
4. **Given** 请求因字段校验失败,**When** 后端返回 `code: "VALIDATION_ERROR"`
   且 `error.details` 为字段级错误数组,**Then** 前端按字段级错误定位到表单控件。
5. **Given** 请求因频控失败,**When** 后端返回 `code: "LOGIN_RATE_LIMITED"`
   且 `error.details.retry_after_seconds` 存在,**Then** 前端展示重试倒计时。

---

### User Story 4 - 前端契约与解析收敛 (Priority: P2)

作为一名前后端开发者，我希望 Admin / Mobile 共用同一套信封类型与解析规则,
消除 `request_id` vs `requestId` 等字段名漂移,以便维护成本下降。

**Why this priority**: 三端解析收敛是「统一请求格式」跨端落地的验收标准。

**Independent Test**: 后端错误响应中的 `request_id` 能被 Admin 与 Mobile 客户端
正确读取并用于日志/提示;成功信封两端口径一致。

**Acceptance Scenarios**:

1. **Given** 后端返回错误信封含 `request_id`,**When** Admin 客户端处理,
   **Then** 该 `request_id` 被正确映射到前端错误对象并可用于展示/上报。
2. **Given** 后端返回错误信封,**When** Mobile 客户端处理,**Then** 与 Admin 使用
   一致的信封解析规则,不依赖 HTTP 状态码。
3. **Given** 前端新增一个接口的契约类型,**When** 遵循统一信封,
   **Then** 仅需声明 `data` 载荷类型,信封部分零配置。
4. **Given** 三端发起业务请求,**When** 遵循统一请求格式(请求体 `snake_case` +
   请求头约定),**Then** 请求侧命名与头字段在三端一致,无漂移。

---

### User Story 5 - 权威文档回写 (Priority: P3)

作为一名平台治理者，我希望 ADR-023 批准后，`api-standard.md` 与各域契约快照
回写为统一信封与业务状态码语义，以便文档与代码不再漂移。

**Why this priority**: 契约必须落在权威文档（Constitution II / VI）。文档先行、
代码落地后回写，保证「文档即真相」。

**Independent Test**: 修订后的 `api-standard.md` 成功响应示例与错误示例与代码
实现一致；各域契约快照中的响应示例更新为统一信封。

**Acceptance Scenarios**:

1. **Given** ADR-023 已批准,**When** 修订 `api-standard.md`,**Then** 成功/错误
   信封示例与实现一致,且明确「HTTP 一律 200 + 业务状态码」语义。
2. **Given** 存在域契约快照,**When** 该域接口响应已统一,**Then** 快照中的
   响应示例同步更新为统一信封。
3. **Given** 前端错误类型定义,**When** 更新,**Then** 与后端 `AppError.code`
   词汇表一一对应,无字段名漂移。

---

### Edge Cases

- **健康检查** `/health/live` / `/health/ready`:**豁免**于统一信封——它们是
  基础设施探针而非业务客户端,`status: 'ok'` / 503 语义保持(负载均衡摘流依赖),
  在契约中显式声明豁免。
- **请求被网关/代理层拒绝**(非业务响应):HTTP 非 200 仍可能在网关层出现
  (如反代 502、网关 429)。统一信封只保证「到达业务层的响应一律 200」,
  前端仍需保留对传输层非 200 的兜底映射。
- **认证前失败也携带 `request_id`**:即使请求未认证(如 `UNAUTHENTICATED`),
  错误信封仍携带 Fastify 请求入口分配的 `request_id`,保证认证失败可追踪。
- **原 204 语义**(无返回体):统一为 `{ code: "OK", data: null }`,前端不得
  因缺 `data` 而报错,且不得改变原有幂等/无副作用语义。
- **原 201 / 202 语义**:HTTP 层不再区分创建/接受,成功一律 `code: "OK"`;
  需要区分时用 `data` 内的实体/任务状态表达(如新建实体字段),而非 HTTP 码。
- **超时 / 网络断连**:发生在 HTTP 响应之外,仍映射为 `network` / `timeout`,
  与业务状态码无关。
- **兼容期(同步切版)**:已上线的旧客户端(旧 Admin / 旧 Mobile)依赖 HTTP
  状态码;因采用**同步切版**,后端与所有客户端在同一发版窗口切换,不存在
  `X-Envelope-Version` 双响期。发布时须确认无旧客户端残留(版本检查/灰度观察),
  防止新旧配对故障。
- **请求侧收敛**:请求体命名由各端各写收敛为统一 `snake_case`;存量请求体
  中若存在非 `snake_case` 字段,需在同步切版窗口内一并修正,不留双轨。
- **`details` 结构**:业务码的 `error.details` 需结构化定义(字段级错误数组、
  冲突元数据、重试秒数),避免自由文本。
- **业务状态码词汇表**:需单一权威登记(`UPPER_SNAKE_CASE`),禁止各域自造
  冲突码;新增业务码必须登记后才能使用。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统 MUST 使所有业务 API 响应统一为单一信封
  `{ code, data?, error?, request_id }`;HTTP 状态码一律为 **200**
  (业务成败由 `code` 权威表达)。
- **FR-002**: 成功响应的信封 MUST 为 `code: "OK"` + `data: <payload>`;
  `data` 内载荷结构与现有接口一致(不改变现有资源字段语义)。
- **FR-003**: 无返回体的成功操作 MUST 返回 `code: "OK"` + `data: null`
  (替换原 204),不携带 `error`。
- **FR-004**: 失败响应的信封 MUST 为
  `{ code: <业务码>, error: { message, details? }, request_id }`;
  `code` 为 `UPPER_SNAKE_CASE` 业务状态码,`message` 为可展示的安全文案,
  `details` 为结构化错误数据;`request_id` MUST 始终存在(含认证前失败)。
- **FR-004a**: 认证前失败(如 `UNAUTHENTICATED`)的错误信封 MUST 也携带
  `request_id`(取自 Fastify 请求入口分配的 request id),保证所有错误可追踪。
- **FR-005**: 未认证(原 401)MUST 映射为业务状态码 `UNAUTHENTICATED`,
  并附带 `error.message` 说明;前端 MUST 依此触发登录失效处理。
- **FR-006**: 权限不足(原 403)MUST 映射为业务状态码 `FORBIDDEN`,不触发登录失效。
- **FR-007**: 资源不存在(原 404)MUST 映射为业务状态码 `NOT_FOUND`。
- **FR-008**: 乐观锁/版本冲突(原 409)MUST 映射为业务状态码
  `STALE_VERSION_CONFLICT`,`error.details` MUST 包含当前版本与请求版本元数据。
- **FR-009**: 字段校验失败(原 400/422)MUST 映射为业务状态码
  `VALIDATION_ERROR`,`error.details` MUST 为字段级错误数组(字段名 + 问题)。
- **FR-010**: 频控限流(原 429)MUST 映射为业务状态码 `LOGIN_RATE_LIMITED`
  (登录场景)或 `RATE_LIMITED`(通用),`error.details.retry_after_seconds` MUST
  存在用于倒计时。
- **FR-011**: 服务端未捕获异常(原 500)MUST 映射为业务状态码 `INTERNAL_ERROR`,
  `message` 隐藏内部细节,`request_id` 用于追踪;`expose=false` 语义保留。
- **FR-012**: **全部**现有 `AppError.code`(含各域专属码如 `DEVICE_*`/
  `OTP_*`/`PLATFORM_*`/`SESSION_*`)MUST 一次性归一为 `UPPER_SNAKE_CASE`,
  并登记到单一业务状态码词汇表,不留过渡期双轨;禁止各域自造与词汇表冲突的码。
- **FR-013**: Admin 前端 `ApiClient` MUST 依据 `code` 判定成败并解包 `data`;
  `code === "OK"` 时成功,否则按业务码映射为强类型错误。
- **FR-014**: Mobile 前端 `ApiClient` MUST 与 Admin 使用一致的信封解析规则
  (`code` 权威 + `data`/`error` 解包),不依赖 HTTP 状态码判定业务成败。
- **FR-015**: 前端错误映射表 MUST 以业务状态码为键(而非 HTTP 状态码),并为
  `UNAUTHENTICATED` / `FORBIDDEN` / `VALIDATION_ERROR` /
  `STALE_VERSION_CONFLICT` / `RATE_LIMITED` / `INTERNAL_ERROR` 等提供
  用户可读文案。
- **FR-016**: 后端错误响应中的 `request_id` 字段 MUST 与前端解析的字段名一致
  (统一为 `request_id`),消除 `requestId` 漂移。
- **FR-017**: `/health/live` / `/health/ready` 基础设施探针 MUST 豁免于统一
  信封,保持 L7 探针语义(`status: 'ok'` / `503`)。
- **FR-018**: 系统 MUST 保留对**传输层非 200**(网关 502/429、代理错误)的
  兜底映射(`network` / `server` / `rate_limit` 前端类型),因为统一信封只覆盖
  到达业务层的响应。
- **FR-019**: 契约快照文档(域 API 快照)MUST 在对应域接口响应统一后同步更新
  为统一信封示例。
- **FR-020**: 实施前 MUST 完成 `api-standard.md` 与相关契约快照的回写
  (ADR-023 已批准;修订契约文档为实施的前置条件)。
- **FR-021**: 请求侧 MUST 同步收敛——请求体统一采用 `snake_case` 命名、
  请求头统一 `X-Request-Id` / `Authorization` / `Idempotency-Key` 约定,
  消除三端请求侧漂移;幂等键语义沿用现有规范。

### Key Entities

- **统一响应信封 (Unified Response Envelope)**: 所有业务 API 响应的单一外形。
  顶层字段:`code`(业务状态码,成败权威)、`data`(成功载荷或空)、`error`(失败
  详情对象)、`request_id`(追踪 ID)。成功:`{ code: "OK", data, request_id }`;
  失败:`{ code: <业务码>, error: { message, details? }, request_id }`。
- **业务状态码词汇表 (Business Status Code Vocabulary)**: `UPPER_SNAKE_CASE`
  业务码的单一权威登记(`OK`、`UNAUTHENTICATED`、`FORBIDDEN`、`NOT_FOUND`、
  `VALIDATION_ERROR`、`STALE_VERSION_CONFLICT`、`RATE_LIMITED`、
  `LOGIN_RATE_LIMITED`、`CONFLICT`、`INVALID_DATA`、`INTERNAL_ERROR` 等),
  含每个码的含义、HTTP 映射语义(仅参考)、前端处理动作。
- **前端错误对象 (Frontend ApiError)**: Admin `ApiError` / Mobile 错误类型。
  以业务状态码为主键映射 `kind`,保留 `request_id`、`details`、`retryable`。
- **契约快照 (Contract Snapshot)**: `docs/.../contracts/<domain>/<DOMAIN>_API.md`,
  记录各域响应示例;统一信封后同步更新。

## State Machines

> 本功能为**跨端契约改造**,不引入新的业务生命周期实体。以下状态机描述
> 「信封/契约本身的演进状态」与「前端会话在业务状态码下的处理状态」,
> 用于指导测试与并发/兼容性边界。

### State Machine: 统一信封演进 (Envelope Evolution)

- **States**: `documented`(api-standard 声明)→ `implemented`(代码统一)→
  `live`(客户端全部切换)→ `legacy_removed`(兼容期结束,旧客户端摘除)
- **Initial**: `documented`(api-standard.md 当前状态)
- **Terminal**: `legacy_removed`
- **Owning FR**: FR-020, FR-019
- **Transitions**:

| From | To | Guard | Event |
| --- | --- | --- | --- |
| documented | implemented | ADR-023 已批准 | 后端统一信封 + 前端解析收敛 |
| implemented | live | Admin/Mobile 客户端全部按 `code` 判定 | 客户端切换 |
| live | legacy_removed | 无存量旧客户端依赖 HTTP 状态码 | 兼容期结束摘除 |

---

### State Machine: 前端会话处理 (Client Session Handling under Business Codes)

> 以业务状态码 `UNAUTHENTICATED` 为触发点的会话生命周期（替代原 HTTP 401 处理）。

- **States**: `authenticated` → `handling_expired` → `refreshing` → `retrying`
  → `signed_out`
- **Initial**: `authenticated`
- **Terminal**: `signed_out`
- **Owning FR**: FR-005, FR-013
- **Transitions**:

| From | To | Guard | Event |
| --- | --- | --- | --- |
| authenticated | handling_expired | 收到 `code: UNAUTHENTICATED` 且可刷新 | 业务码触发刷新流程 |
| handling_expired | refreshing | 刷新令牌存在 | 发起刷新 |
| refreshing | retrying | 刷新成功 | 重放原请求一次 |
| refreshing | signed_out | 刷新失败或不可用 | 清除会话 |
| retrying | authenticated | 重放成功 | 继续业务 |
| retrying | signed_out | 重放仍 `UNAUTHENTICATED` | 清除会话 |

---

## Contract References

> 本功能**打破冻结公共契约**。Constitution VII 将 API / Public 契约列为
> LOCKED;Constitution VIII 要求冲突 STOP 并等待设计裁决。因此本 spec 起草
> **ADR-023** 作为权威批准文件。以下「现状契约」为仓库中真实工件;
> 「目标契约」以 ADR-023 批准后的落点为准。

### 现状契约 (Existing — reference only)

- **Contract: API 标准文档 (active, 需修订)**
  - **Path**: `docs/docs/developer/reference/architecture/applications/api-standard.md`
  - **Kind**: markdown
  - **Symbol**: §4.1 成功响应格式 / §4.2 错误包体 / §3 状态码映射表
  - **Notes**: 已声明 `{ data }` 成功信封 + `{ error }` 失败信封,但代码未遵循;
    需由 ADR-023 修订为「HTTP 一律 200 + 顶层 `code` 信封 + 业务状态码」。
- **Contract: 后端错误处理**
  - **Path**: `apps/backend/src/errors/error-handler.ts`
  - **Kind**: ts
  - **Symbol**: `installErrorHandler` / `setErrorHandler` / `NOT_FOUND` /
    `INVALID_REQUEST` / `INTERNAL_ERROR`
  - **Notes**: 当前输出嵌套 `{ error: { code, message, request_id } }`;
    需改为统一信封 + 业务状态码 + HTTP 200。
- **Contract: 后端错误类型**
  - **Path**: `apps/backend/src/errors/app-error.ts`
  - **Kind**: ts
  - **Symbol**: `AppError` / `AppErrorOptions` (`code`, `message`, `httpStatus`,
    `expose`, `details`)
  - **Notes**: `httpStatus` 保留为「参考语义」但不再决定响应状态;`code` 归一
    `UPPER_SNAKE_CASE`。
- **Contract: Admin HTTP 客户端**
  - **Path**: `apps/admin/src/api/client/http-client.ts`
  - **Kind**: ts
  - **Symbol**: `ApiClient.request` / `ApiResponse` / `mapHttpError`
  - **Notes**: 当前按 HTTP 状态映射、期望扁平错误体;需改为按 `code` 判定 +
    统一信封解析,并修正 `request_id` 字段名。
- **Contract: Admin 错误映射**
  - **Path**: `apps/admin/src/api/errors/api-error.ts` /
    `apps/admin/src/api/errors/index.ts` / `apps/admin/src/api/contracts/error.ts`
  - **Kind**: ts
  - **Symbol**: `ApiErrorKind` / `ApiError` / `mapHttpError` / `ApiErrorBody`
  - **Notes**: 需以业务状态码为主键重构;`ApiErrorBody` 字段名与后端对齐。
- **Contract: Mobile HTTP 客户端**
  - **Path**: `apps/mobile/src/api/client/httpClient.ts`
  - **Kind**: ts
  - **Symbol**: `httpClient` / `normalizeHttpError` / `status >= 400` 分支
  - **Notes**: 当前按 HTTP 状态映射;需与 Admin 一致按 `code` 判定。
- **Contract: Mobile 错误映射**
  - **Path**: `apps/mobile/src/api/errors/mapHttpError.ts`
  - **Kind**: ts
  - **Symbol**: `normalizeHttpError` / 401/403/404/409/422/429 switch
  - **Notes**: 需改为业务状态码 switch。
- **Contract: 后端域路由 (ad-hoc 成功载荷现状)**
  - **Path**: `apps/backend/src/modules/platform/http/management-routes.ts` 等
  - **Kind**: http
  - **Symbol**: `/api/v1/admin/platform/*` 各路由的 `reply.send(...)` / return 载荷
  - **Notes**: 成功载荷无信封;统一后套 `{ code, data, request_id }`。
- **Contract: 后端健康检查 (豁免候选)**
  - **Path**: `apps/backend/src/http/health-routes.ts`
  - **Kind**: http
  - **Symbol**: `/health/live` / `/health/ready`
  - **Notes**: 建议豁免统一信封,保持 L7 探针语义。
- **Contract: 契约快照目录**
  - **Path**: `docs/docs/developer/reference/contracts/<domain>/<DOMAIN>_API.md`
  - **Kind**: markdown
  - **Symbol**: 各域响应示例
  - **Notes**: 域接口响应统一后同步更新。

### 目标契约 (Target — approved by ADR-023)

- **Contract: ADR-023 统一请求格式与业务状态码**
  - **Path**: `docs/docs/developer/reference/adr/ADR-023-unified-api-contract.md`
  - **Kind**: markdown (ADR)
  - **Symbol**: ADR-023 全文(决策、打破的基线、兼容策略、词汇表指针)
  - **Notes**: **已批准(frozen)**——权威裁决。打破基线:
    `api-standard.md` 响应契约(active)、`AppError`/`ApiError` 错误形态、
    三端错误映射、原 HTTP 状态码语义。
- **Contract: 业务状态码词汇表**
  - **Path**: `docs/docs/developer/reference/architecture/applications/business-status-codes.md`
  - **Kind**: markdown
  - **Symbol**: `OK` / `UNAUTHENTICATED` / `FORBIDDEN` / `NOT_FOUND` /
    `VALIDATION_ERROR` / `STALE_VERSION_CONFLICT` / `RATE_LIMITED` /
    `LOGIN_RATE_LIMITED` / `CONFLICT` / `INVALID_DATA` / `INTERNAL_ERROR` …(全量登记见文件)
  - **Notes**: **已落盘**——单一权威登记;新增业务码须先登记。(ADR-023 已批准,实施前置已创建)

---

## Traceability

| Requirement | Use Case | Contract | Acceptance Scenario | State Machine |
| --- | --- | --- | --- | --- |
| FR-001 | US-001 | 目标: ADR-023 / 目标信封 | US-001-AS1/2/3 | SM: 信封演进 |
| FR-002 | US-002 | 现状: 域路由载荷;目标: 统一信封 | US-002-AS1/2 | — |
| FR-003 | US-002 | 目标: 统一信封 | US-002-AS3/4 | — |
| FR-004 | US-003 | 现状: error-handler.ts;目标: 错误信封 | US-003-AS1 | — |
| FR-004a | US-003 | 现状: auth-hook.ts;目标: 错误信封 request_id | US-003-AS1 | — |
| FR-005 | US-003 | 目标: `UNAUTHENTICATED` | US-003-AS1 | SM: 会话处理 |
| FR-006 | US-003 | 目标: `FORBIDDEN` | US-003-AS2 | — |
| FR-007 | US-003 | 目标: `NOT_FOUND` | 边界 | — |
| FR-008 | US-003 | 目标: `STALE_VERSION_CONFLICT` | US-003-AS3 | — |
| FR-009 | US-003 | 目标: `VALIDATION_ERROR` | US-003-AS4 | — |
| FR-010 | US-003 | 目标: `RATE_LIMITED` / `LOGIN_RATE_LIMITED` | US-003-AS5 | — |
| FR-011 | US-003 | 现状: error-handler.ts | 边界 | — |
| FR-012 | US-005 | 目标: 业务状态码词汇表 | 边界 | — |
| FR-013 | US-001/4 | 现状: http-client.ts;目标: code 判定 | US-001-AS1/2, US-004-AS1/2 | SM: 会话处理 |
| FR-014 | US-001/4 | 现状: mobile httpClient.ts | US-001-AS3, US-004-AS2 | — |
| FR-015 | US-003/4 | 现状: api-error.ts | US-003-AS1~5 | — |
| FR-016 | US-004 | 现状: contracts/error.ts | US-004-AS1 | — |
| FR-017 | 边界 | 现状: health-routes.ts | 边界 | — |
| FR-018 | 边界 | 现状: http-client.ts 传输层兜底 | 边界 | — |
| FR-019 | US-005 | 现状: 契约快照目录 | US-005-AS2 | SM: 信封演进 |
| FR-020 | US-005 | 现状: api-standard.md;目标: ADR-023 | US-005-AS1 | SM: 信封演进 |
| FR-021 | US-004 | 现状: 各端请求体/请求头;目标: 统一约定 | US-004-AS2 | — |

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% 的业务 API 响应遵循统一信封(`{ code, data?/error?, request_id }`),
  且 HTTP 状态码一律 200;自动化契约测试按信封断言。
- **SC-002**: 前端 Admin / Mobile 100% 以业务状态码 `code` 判定成败,
  不再以 HTTP 状态码做业务分支(传输层兜底除外)。
- **SC-003**: **全部**现有业务错误码(含各域专属码)一次性归一为 `UPPER_SNAKE_CASE`
  并登记到业务状态码词汇表;词汇表与代码实现交叉校验无未登记码、无过渡期双轨。
- **SC-004**: 前端错误映射表以业务码为键的覆盖率 100%;`request_id` 字段名
  在三端一致,无字段名漂移;**100% 的错误信封(含认证前失败)携带 `request_id`**。
- **SC-005**: 未认证/权限不足/校验失败/冲突/频控/服务端异常六类业务语义,
  前端在 HTTP 200 下均能正确分支(自动化集成测试逐类断言)。
- **SC-006**: ADR-023 批准后,`api-standard.md` 与全部受影响域契约快照在
  1 个发布周期内回写完成,文档与代码零漂移。
- **SC-007**: 健康检查 `/health/*` 豁免于统一信封,探针语义不变
  (负载均衡依赖的 503 摘流行为不回归)。
- **SC-008**: 请求侧收敛后,100% 的业务请求体采用统一 `snake_case` 命名、
  请求头遵循统一约定;交叉校验无三端请求侧命名漂移。

## Assumptions

- **HTTP 一律 200 的范围**: 仅约束「到达业务层的响应」。网关/代理/负载均衡
  层可能仍产生非 200(如 502、网关 429),前端保留传输层兜底映射(FR-018)。
- **资源语义保留**: URI、HTTP 动词、幂等语义不变;仅响应信封与业务码变化。
  原 201/202/204 不再通过 HTTP 码区分,必要时由 `data` 内容表达。
- **业务状态码权威**: 业务状态码是前后端成败判断的**唯一权威**;
  `AppError.httpStatus` 降级为「参考语义」,用于日志/监控与兼容说明,不决定响应码。
- **兼容期 / 切换策略**: **同步切版**(用户已确认)——后端与所有存量客户端
  (Admin/Mobile)在同一个发版窗口内一起切换,无需版本头/双响应;实施时须将
  「端与后端同步发布」作为发布检查项,防止新旧客户端与新旧后端交叉配对。
- **豁免**: `/health/live`、`/health/ready` 为基础设施探针,豁免统一信封。
- **词汇表治理**: 单一业务状态码词汇表;**全量迁移**(用户已确认)——本 feature
  一次性将全部现有 `AppError.code`(含各域专属码)归一为 `UPPER_SNAKE_CASE`
  并登记,不留过渡期双轨;新增码须登记,禁止各域自造冲突码。
- **错误码映射语义**: 原 401→`UNAUTHENTICATED`、403→`FORBIDDEN`、404→`NOT_FOUND`、
  409→`STALE_VERSION_CONFLICT`(或 `CONFLICT`)、400/422→`VALIDATION_ERROR`、
  429→`RATE_LIMITED` / `LOGIN_RATE_LIMITED`、500→`INTERNAL_ERROR`;
  具体映射以 ADR-023 定稿为准。
- **影响范围**: 全系统跨端(Admin + Mobile + 后端 + 契约快照);这是
  打破冻结公共契约的架构变更,须经 ADR 流程。
- **双向统一范围**: 「统一请求格式」**含请求侧**(用户已确认)——响应侧为统一
  信封 + 业务状态码,请求侧为请求体 `snake_case` + 请求头约定(FR-021);
  均为格式收敛,不改变资源/动词/幂等语义。
- **不改变业务逻辑**: 本功能仅统一请求/响应**格式**,不改变任何业务实体、
  状态机、权限或审计语义。
