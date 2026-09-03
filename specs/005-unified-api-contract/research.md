# Research: 前后端统一请求格式与业务状态码 (005-unified-api-contract)

**Phase 0 输出** | 2026-09-03 | 基于代码/文档/契约现状与已确认的产品决策
(HTTP 一律 200、顶层 code 信封、同步切版、全量错误码迁移、request_id 始终携带、请求侧收敛)

## 研究基线(已验证现状锚点)

- **后端响应路径**: 各域路由 handler 直接 `return { ...payload }`(Fastify 自动序列化)
  或 `reply.code(N).send({...})`。**无统一信封**;成功载荷 ad-hoc(`{items}`、`{feature_flag}`、
  `{menu}`、`{success:true}`、`{status:'ok'}`)。
- **后端错误路径**: `errors/error-handler.ts` 的 `setErrorHandler` 已集中所有异常 →
  `{ error: { code, message, request_id } }`(HTTP 状态码由 `AppError.httpStatus` 决定)。
  `AppError`(`errors/app-error.ts`)携带 `code/httpStatus/expose/details`。
- **关键集中点**: `http/request-context.ts` 已有 **`onSend` hook**(每响应设 `x-request-id`)。
  `onSend` 是最自然的响应信封包裹点(成功 + 未抛错路径)。
- **后端模块挂载**: `main.ts` 依次 `registerHttp`(identity/operations/platform) +
  `registerPlatformManagementRoutes` + content `admin-routes`/`public-routes`。
- **错误码词汇**(已盘点 50 个 `AppError.code` + Content 内联 3 个): 通用
  (`OK/UNAUTHENTICATED/FORBIDDEN/NOT_FOUND/VALIDATION_ERROR/STALE_VERSION_CONFLICT/CONFLICT/RATE_LIMITED/LOGIN_RATE_LIMITED/INTERNAL_ERROR/INVALID_ARGUMENT/INVALID_DATA/INVALID_REQUEST/PROVIDER_UNAVAILABLE`)、
  Identity(`INVALID_CREDENTIAL/ACCOUNT_*/SESSION_*/DEVICE_*/PHONE_*/INVALID_PHONE/IDENTITY_*/LEARNING_DIRECTION_IMMUTABLE`)、
  OTP(`OTP_*/BOOTSTRAP_*`)、Platform(`PLATFORM_*/FEATURE_FLAG_*/RUNTIME_CONFIG_*/APP_VERSION_*/ANNOUNCEMENT_*/REGION_*`)、
  Operations(`OPERATOR_AUDIT_PERSISTENCE_FAILED/AUTHENTICATION_UNAVAILABLE`)、Content 内联
  (`UNICODE_CONFLICT/ACTIVE_WORK_CONFLICT/ILLEGAL_STATE_TRANSITION`)。
- **Admin 前端**:
  - `api/client/http-client.ts`: `ApiClient.request` 现按 HTTP 状态映射错误
    (`response.ok` / `mapHttpError`);成功解析 `data`(裸载荷);`ApiResponse{data,status,requestId}`。
  - `api/errors/api-error.ts`: `ApiError` hierarchy(401→UnauthorizedError 等);
    `ERROR_MESSAGES` 按 kind 映射文案。
  - `api/errors/index.ts`: `mapHttpError(response)` 按 `response.status` switch。
  - `api/contracts/error.ts`: `ApiErrorBody{code,message,details,requestId}`(扁平,
    与后端 `request_id` 嵌套 `error` 漂移)。
  - 调用方: `auth/api.ts`、`features/operations/api.ts` 等直接消费 `response.data`。
- **Mobile 前端**:
  - `api/client/httpClient.ts`: 若 `response.status >= 400` 走 `normalizeHttpError`;否则
    `{data,status,requestId}`。`options.validate` 有防御校验。
  - `api/errors/mapHttpError.ts`: `mapHttpFailure` 按 `status` switch(401/403/404/409/422/429/
    >=500),**无 body `code` 分支**;`extractRequestId` 从 headers 优先、body 次之(兼容多层);
    `extractServerMessage` 取嵌套 `error.message` 或顶层 `message`。
- **文档**: `api-standard.md` 已修订(ADR-023)为「HTTP 一律 200 + 顶层 code 信封」;
  `business-status-codes.md` 词汇表已落盘(frozen)。

---

## 决策点 1: 响应信封的集中包裹点 (Backend Envelope Centralization)

### 1.1 集中 vs 逐路由

- **Decision**: 在 **`onSend` hook**(`http/request-context.ts` 扩展或新增独立
  `response-envelope.ts` hook)集中包裹成功响应为 `{ code:"OK", data, request_id }`。
- **Rationale**:
  1. **单一事实点**: 所有成功路径(handler return 裸载荷)经 `onSend` 一次包裹,无需逐路由改
     handler。当前所有域约 80 个端点 handler 都 return 裸载荷,逐路由包裹改动面巨大且易漏。
  2. **已有先例**: `request-context.ts` 的 `onSend` 已存在(设 `x-request-id`),在此扩展
     最内聚。
  3. **错误路径独立**: `setErrorHandler` 已集中错误;错误信封在 error-handler 输出
     `{ code, error, request_id }`,成功信封在 onSend 输出 `{ code:"OK", data, request_id }`,
     二者互补。
- **Alternatives**:
  - 逐路由手动包裹 `{code,data}` → 改动 ~80 个 handler,易漏、难测,违背「单一信封」。
  - Fastify `setReplySerializer` 序列化包裹 → 对字符串/缓冲载荷处理复杂,且不覆盖
    已 `reply.send()` 的路径,onSend 更通用。
  - `preHandler` 包装 handler 返回 → 需拦截每个路由 handler,侵入大。

### 1.2 豁免规则(onSend 包裹)

- **Decision**: 以下响应**不包裹**:
  1. `/health/live`、`/health/ready`(L7 探针,保持 `status:'ok'` / 503,ADR-023 豁免);
  2. 已由 error-handler 输出的错误信封(`{ code, error, request_id }`)— 通过标记/载荷形态判别;
  3. 非 JSON 载荷(下载/文件流)— 本系统当前无,但 onSend 须判断 `payload` 是否为对象。
- **Rationale**: 避免对探针/错误信封二次包裹;仅对纯业务 JSON 对象包裹。
- **Implementation note**: onSend 收到 `payload`(已序列化 JSON 字符串或 Buffer)。
  方案:对字符串先 `JSON.parse` 尝试;若是 `{ code, error }` 形状则跳过;否则包
  `{ code:"OK", data: parsed, request_id: request.id }` 并 `JSON.stringify` 回写。
  `reply.code` 统一为 200(若原为 201/204/...)。—— 此为实施细节,plan 只定方向。

### 1.3 统一 HTTP 200

- **Decision**: 所有业务成功/失败响应 HTTP 一律 200。成功在 onSend 统一 `reply.code(200)`;
  错误在 error-handler 统一 `reply.code(200)`(不再用 `error.httpStatus`)。
- **Rationale**: ADR-023 决策 1;`AppError.httpStatus` 仅日志/监控参考。
- **代价**: 网关/监控/重试依赖 HTTP 码的需调整;同步切版覆盖。

---

## 决策点 2: 错误信封统一 (Error Envelope Unification)

- **Decision**: `error-handler.ts` 输出改为
  `{ code: <业务码>, error: { message, details? }, request_id }`,HTTP 一律 200。
- **Rationale**:
  1. `request_id` 从嵌套 `error.request_id` 提升到**顶层**,与前端解析对齐(消除
     `requestId` vs `request_id` 漂移,FR-016)。
  2. `code` 从 `error.code` 提升到顶层,成为成败权威(FR-013)。
  3. `error` 对象只含 `message` + `details`,语义清晰。
- **认证前失败 request_id**: `auth-hook.ts` 的 `UNAUTHENTICATED` 抛错时,
  `request.id` 已在 `onRequest` 分配;error-handler 输出顶层 `request_id: request.id`
  即可(无需特殊处理,FR-004a 自动满足)。
- **Alternatives**: 保留嵌套 `{ error: {...} }`(现状)→ 前端解析复杂、字段漂移;不采用。

---

## 决策点 3: 前端以 `code` 判定成败 (Frontend Code-Based Judgment)

### 3.1 Admin ApiClient

- **Decision**: `ApiClient.request` 增加统一信封解析:
  - HTTP 200 + body 为 `{ code:"OK", data, request_id }` → 成功,返回 `data`;
  - HTTP 200 + body 为 `{ code:<业务码>, error, request_id }` → 按 `code` 映射 `ApiError`
    (不再依赖 `response.status`);
  - 传输层非 200(网关 502/429 等)→ 保留现有兜底映射(`mapNetworkError`/按状态)。
- **Rationale**: FR-013;业务成败由 `code` 权威。`ApiError` 映射表以业务码为键
  (FR-015),保留 `request_id`/`details`/`retryable`。
- **Implementation note**: 现有 `mapHttpError(response)` 按 status switch → 改为
  `mapBusinessCode(code)` 字典(业务码 → `ApiErrorKind`/子类)。`ApiErrorBody` 字段名
  与后端对齐(`request_id`)。

### 3.2 Mobile httpClient

- **Decision**: 与 Admin 一致:HTTP 200 + 信封按 `code` 判定;传输层非 200 走现有
  `mapHttpFailure` 兜底。
- **Rationale**: FR-014 跨端一致。
- **Implementation note**: `mapHttpFailure` 目前按 status switch;改为:若 `status===200`
  且 body 为信封,按 `code` 映射;否则保留 status 兜底。`extractRequestId`/`extractServerMessage`
  已兼容多层 body,信封统一后可简化(顶层 `request_id` / `error.message`)。

---

## 决策点 4: 业务状态码全量迁移 (Full Business Code Migration)

- **Decision**: 一次性将全部 50 个 `AppError.code` + Content 内联 3 个码归一为
  `UPPER_SNAKE_CASE` 并登记入 `business-status-codes.md`(已落盘)。
- **Rationale**: 用户已确认「全量迁移」;现状码已大部分 `UPPER_SNAKE_CASE`,归一主要是
  **统一登记 + 统一枚举导出** + Content 内联码改走 `AppError` 体系。
- **Implementation note**:
  - 新增 `errors/business-codes.ts` 导出 `BUSINESS_STATUS_CODES` 常量 + TS 联合类型
    `BusinessStatusCode`,供 `AppError.code` 类型约束与前端词汇表镜像。
  - Content 域 `admin-routes.ts`/`public-routes.ts` 内联 `{ error, message }` 改为抛
    `AppError`(UNICODE_CONFLICT/ACTIVE_WORK_CONFLICT/ILLEGAL_STATE_TRANSITION),走统一
    error-handler。
  - 现有 `AppError` 实例的 `code` 字符串常量改为引用词汇表(或保持字面量 + 编译期
    校验),避免运行时 drift。

---

## 决策点 5: 请求侧收敛 (Request-Side Convergence)

- **Decision**: 请求体统一 `snake_case`(现状已基本遵守);请求头统一
  `X-Request-Id`(前端已发)+ `Authorization`(已有)+ `Idempotency-Key`(关键写操作)。
  消除三端请求侧漂移。
- **Rationale**: ADR-023 决策 9;用户已确认「含请求侧」。
- **Implementation note**: 现状请求体大多已 `snake_case`(zod schema 用 `snake_case` 键)。
  收敛工作主要是:
  1. 审计三端请求头(Admin http-client 已发 `X-Request-Id`/`Authorization`;Mobile
     httpClient 需确认 `X-Request-Id`);
  2. `Idempotency-Key` 语义沿用(幂等键规范,关键写操作);
  3. 文档 `api-standard.md` §5 已对齐。

---

## 决策点 6: 同步切版发布检查 (Synchronous Cut-Over Release Check)

- **Decision**: 后端 + Admin + Mobile **同一发版窗口切换**;实施完成即统一生效,
  无 `X-Envelope-Version` 双响期。
- **Rationale**: 用户已确认「同步切版」;端与后端同团队同节奏。
- **Implementation note**:
  - 发布 checklist: 后端错误信封/成功信封/HTTP 200 + Admin `code` 判定 + Mobile
    `code` 判定,三者必须**同时上线**。
  - 回滚预案: 若发现新旧配对故障,整体回滚(后端 + 两客户端同一 commit),无部分切换。
  - 灰度观察: 上线后监控 `x-request-id` 错误追踪 + 前端错误上报,确认无旧客户端残留。

---

## 决策点 7: 契约文档回写 (Contract Documentation Write-Back)

- **Decision**: ADR-023 已批准;实施后 `api-standard.md`、`business-status-codes.md`、
  各域契约快照已回写(实施前置已完成),实施仅需确保**代码与文档一致**。
- **Rationale**: 前置已完成;实施期同步校验(SC-006 文档零漂移)。

---

## 决策点 8: 健康检查豁免 (Health-Check Exemption)

- **Decision**: `/health/live`、`/health/ready` 豁免于统一信封,保持 `status:'ok'` / 503。
- **Rationale**: ADR-023 决策 8;L7 探针语义。
- **Implementation note**: onSend 对 `/health/*` 路径跳过包裹;`build-app.ts` 的
  `registerHealthRoutes` 已注册,无需改。

---

## 决策点 9: 测试策略 (Testing Strategy)

- **Decision**: 三层测试:
  1. **契约测试**: 后端新增 `errors/__tests__/response-envelope.test.ts` 断言所有业务
     响应 HTTP 200 + 统一信封;错误信封 `{ code, error, request_id }` 形状 + 业务码。
  2. **单元测试**: 前端 `ApiClient`/`mapHttpError` 以业务码为键的映射字典单测;
     `business-codes` 枚举与词汇表交叉校验。
  3. **集成/冒烟**: 修改现有 E2E 以 `code` 判定(原 HTTP 状态断言改为 `code` 断言);
     后端集成测试断言 HTTP 200 + 信封。
- **Rationale**: FR/SC 要求自动化契约测试断言信封;全量迁移回归面广,须逐码测试。
- **Alternative**: 仅依赖现有 HTTP 状态测试改断言 → 不覆盖 `code` 语义;不采用。

---

## 研究结论汇总

| 决策点 | 选择 | 关键依据 |
| --- | --- | --- |
| 1 信封集中点 | `onSend` hook 包裹成功 + error-handler 输出错误 | 单一事实点,已有 onSend 先例 |
| 2 错误信封 | `{ code, error{message,details?}, request_id }` 顶层 | 消除字段漂移,code 权威 |
| 3 前端判定 | Admin/Mobile 以 `code` 判定,传输层非 200 兜底 | FR-013/014 |
| 4 全量迁移 | 50 + 3 码归一 + Content 内联改 AppError | 用户确认全量 |
| 5 请求侧 | snake_case + 头约定收敛 | 用户确认含请求侧 |
| 6 切版 | 同步切版 + 发布检查 | 用户确认同步 |
| 7 文档回写 | 已前置完成 | ADR-023 |
| 8 健康检查 | 豁免 | ADR-023 |
| 9 测试 | 契约 + 单元 + 集成三层 | FR/SC |

所有 NEEDS CLARIFICATION 已由会话决策解析;无遗留未知项。
