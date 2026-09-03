---
status: frozen
last_updated: 2026-09-03
---

# ADR-023：前后端统一请求格式与业务状态码（HTTP 一律 200 + 顶层 code 信封）

**状态：** `已接受`

**日期：** `2026-09-03`

**批准：** 2026-09-03（主架构会话确认，登记 D-156）

**相关：** [全局 API 接口设计与通信规范](/developer/reference/architecture/applications/api-standard.md)、[Spec Kit 005 spec](/specs/005-unified-api-contract/spec.md)、[设计台账 D-156](/developer/reference/governance/design-register.md)

## 背景

ZH-LAO 是模块化单体（11 个业务域），服务端（Fastify + TS + Zod）、管理端 Admin（React + TanStack Query + ApiClient）、移动端 Mobile（Expo + HTTP Client）三端共享 RESTful API。当前请求/响应格式存在**三处漂移**，且业务语义依赖 HTTP 状态码：

1. **后端成功响应无统一信封**：各域路由直接返回 ad-hoc 载荷（`{items: ...}`、`{feature_flag: ...}`、`{menu: ...}`、`{status: 'ok'}`），无 `data` 包裹层，也无顶层业务状态码。参考 `apps/backend/src/modules/platform/http/management-routes.ts`。
2. **后端错误响应与前端解析漂移**：`error-handler.ts` 输出嵌套 `{ error: { code, message, request_id } }`，而 Admin `api/errors/mapHttpError` 解析的是**扁平 `{ code, message, requestId }`** —— 前端 `request_id` 永远取不到（期望 `requestId`，后端给 `request_id`），错误包体结构本身不一致。
3. **前端按 HTTP 状态码映射业务语义**：Admin `mapHttpError` 与 Mobile `mapHttpError` 均以 `response.status` 的 401/403/404/409/422/429 switch 决定 `ApiErrorKind`。业务错误码虽已在 `AppError.code` 存在，但未成为前端分支依据。
4. **文档漂移**：`api-standard.md`（`active`）已声明 `{ data }` 成功信封 + `{ error }` 失败信封，但代码并未遵循（成功无 `data` 包裹、失败信封字段名 `request_id` 与前端解析的 `requestId` 不一致）。
5. **业务错误码未规范统一**：`AppError.code` 分散在各域使用例中（`INVALID_CREDENTIAL`、`STALE_VERSION_CONFLICT`、`LOGIN_RATE_LIMITED`、`ACCOUNT_DISABLED`、`VALIDATION_ERROR`、`NOT_FOUND`、`CONFLICT`、`INVALID_DATA`、`DEVICE_*`、`OTP_*` 等），大小写风格不统一，无单一词汇表。

需求（`/speckit.specify` → `005-unified-api-contract`）要求：**前后端统一请求格式，使用业务状态码代替请求状态码**。用户已确认四项产品/架构决策：

- **① HTTP 一律 200**：所有业务响应（含错误）HTTP 状态码固定为 200，业务成败由响应体 `code` 权威表达；
- **② 顶层 `code` + `data`/`error` 信封**：单信封同时表达成功与失败：`{ code, data?, error?, request_id }`；
- **③ 同步切版**：后端与所有存量客户端（Admin/Mobile）在同一个发版窗口内一起切换，无版本头/双响；
- **④ 全量迁移**：本 feature 一次性将全部现有 `AppError.code`（含各域专属码如 `DEVICE_*`/`OTP_*`/`PLATFORM_*`/`SESSION_*`）归一为 `UPPER_SNAKE_CASE` 并登记入统一词汇表，不留过渡期双轨。

约束来自已确定的设计基线：

- **`api-standard.md`（`active`）**：已声明 `{ data }` 成功信封 + `{ error }` 失败信封，但**未冻结**（`active`），且代码未遵循。本 ADR 将其修订为「HTTP 一律 200 + 顶层 `code` 信封 + 业务状态码」语义，属于对 `active` 文档的契约修订。
- **Constitution VII（决策预算）**：API / Public 契约列为 LOCKED；本 ADR 明确「HTTP 一律 200 + 业务状态码」为新的 Public Contract。
- **`AppError` / `ApiError` / `http-client` 现有契约**：均需按新信封调整。

本功能将**修订 `api-standard.md`（`active`）的响应契约**并改变三端错误映射与 `AppError`/`ApiError` 形态，按 Constitution Principle VIII（`SPEC_CONFLICT` 必须 STOP）以架构变更请求呈现，需本 ADR 批准后实施。

## 决策

1. **HTTP 一律 200 + 业务状态码权威**：所有到达业务层的响应 HTTP 状态码固定为 **200**，业务成败由响应体顶层 `code` 权威表达。`AppError.httpStatus` 降级为「参考语义」——仅用于日志/监控与兼容说明，不决定响应状态码。传输层/网关层（代理、负载均衡、CDN）的 TCP/网关自身非 200 语义不在本契约范围内。

2. **统一响应信封（顶层 `code` + `data`/`error`）**：
   - 成功：`{ "code": "OK", "data": <payload>, "request_id": "..." }`；`data` 内载荷结构与现有接口一致（不改变资源字段语义）。无返回体操作（原 204）→ `data: null`。
   - 失败：`{ "code": <业务码>, "error": { "message": "...", "details"?: ... }, "request_id": "..." }`；`code` 为 `UPPER_SNAKE_CASE` 业务状态码，`message` 为可展示的安全文案，`details` 为结构化错误数据（字段级错误数组、冲突元数据、重试秒数）。
   - `request_id` **始终存在**（含认证前失败）：即使请求未认证（如 `UNAUTHENTICATED`），也取 Fastify 请求入口分配的 request id 回填，保证所有错误可追踪。

3. **业务状态码词汇表（单一权威登记）**：新增 `docs/docs/developer/reference/architecture/applications/business-status-codes.md`，`UPPER_SNAKE_CASE` 统一登记。初始必含：`OK`、`UNAUTHENTICATED`、`FORBIDDEN`、`NOT_FOUND`、`VALIDATION_ERROR`、`STALE_VERSION_CONFLICT`、`RATE_LIMITED`、`LOGIN_RATE_LIMITED`、`CONFLICT`、`INVALID_DATA`、`INTERNAL_ERROR` 等。每个码记录含义、HTTP 映射语义（仅参考）、前端处理动作。**新增业务码必须登记后才能使用**。

4. **全量错误码迁移**：本 feature 一次性将全部现有 `AppError.code`（含各域专属码 `DEVICE_*`/`OTP_*`/`PLATFORM_*`/`SESSION_*` 等）归一为 `UPPER_SNAKE_CASE` 并登记入词汇表，不留过渡期双轨。域专属码语义保持不变，仅规范命名与登记。

5. **业务错误码 → HTTP 映射语义（仅参考）**：原 401→`UNAUTHENTICATED`、403→`FORBIDDEN`、404→`NOT_FOUND`、409→`STALE_VERSION_CONFLICT`（或 `CONFLICT`）、400/422→`VALIDATION_ERROR`、429→`RATE_LIMITED`/`LOGIN_RATE_LIMITED`、500→`INTERNAL_ERROR`。该映射仅用于日志/监控/兼容说明，不决定响应码。

6. **前端以 `code` 判定成败**：Admin `ApiClient` 与 Mobile `httpClient` 均依据响应体 `code === "OK"` 判定成功并解包 `data`；否则按业务码映射为强类型错误。前端错误映射表以业务状态码为键（而非 HTTP 状态码），并为 `UNAUTHENTICATED`/`FORBIDDEN`/`VALIDATION_ERROR`/`STALE_VERSION_CONFLICT`/`RATE_LIMITED`/`INTERNAL_ERROR` 等提供用户可读文案。前端 `request_id` 字段名与后端统一为 `request_id`（消除 `requestId` 漂移）。

7. **传输层非 200 兜底**：统一信封只保证「到达业务层的响应一律 200」。网关/代理/负载均衡层可能仍产生非 200（如反代 502、网关 429），前端保留对传输层非 200 的兜底映射（`network`/`server`/`rate_limit` 前端类型）。

8. **健康检查豁免**：`/health/live`、`/health/ready` 为基础设施探针（L7 探针而非业务客户端），**豁免**于统一信封，保持 `status: 'ok'` / 503 语义（负载均衡摘流依赖），在契约中显式声明豁免。

9. **请求侧收敛（双向统一）**：「统一请求格式」含请求侧——请求体统一 `snake_case` 命名、请求头统一 `X-Request-Id`/`Authorization`/`Idempotency-Key` 约定，消除三端请求侧漂移；幂等键语义沿用现有规范。均为格式收敛，不改变资源/动词/幂等语义。

10. **同步切版（兼容策略）**：后端与所有存量客户端（Admin/Mobile）在**同一个发版窗口内一起切换**，无版本头/双响应（`X-Envelope-Version` 双响期不存在）。发布时须确认无旧客户端残留（版本检查/灰度观察），防止新旧客户端与新旧后端交叉配对故障。

11. **权威文档回写**：ADR-023 批准后，修订 `api-standard.md`（§3 状态码映射、§4.1 成功响应、§4.2 错误包体、§5 请求头）为「HTTP 一律 200 + 顶层 `code` 信封 + 业务状态码」语义；同步更新各域契约快照（`docs/docs/developer/reference/contracts/<domain>/<DOMAIN>_API.md`）的响应示例。

12. **影响范围**：全系统跨端（Admin + Mobile + 后端 + 契约快照）。本 ADR 仅统一请求/响应**格式**，不改变任何业务实体、状态机、权限或审计语义。

## 备选方案与取舍

| 方案 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- |
| HTTP 一律 200 + 业务状态码权威（本 ADR） | 前端业务分支仅依赖单一 `code` 字段，跨端一致；网关层语义与业务语义彻底分离 | 破坏 REST 状态码语义；所有依赖 HTTP 码的网关/监控/日志/重试逻辑需调整；需同步切版 | 采用 |
| 保留标准 HTTP 状态码，仅叠加业务码 | 兼容现有网关/监控对标准状态码的依赖；改动最小 | 业务分支仍依赖 HTTP 码，未满足「用业务状态码代替请求状态码」的核心诉求 | 不采用 |
| HTTP 保留大类（2xx/4xx/5xx）不细分 | 介于两者之间，减少状态码种类 | 语义割裂——既非标准状态码亦非纯业务码，客户端仍需维护两套判定 | 不采用 |
| 仅 `data` 信封 + 独立错误信封（错误才有业务码） | 改动最小；成功路径与现状兼容 | 成功路径无顶层业务码，未实现「业务状态码统一」；错误信封字段名仍漂移 | 不采用 |
| 显式 `success` 布尔 + `code` | 快速判断成败 | 与 `code` 语义重叠冗余；增加信封体积 | 不采用 |
| 版本头双响过渡（X-Envelope-Version） | 兼容期风险最低 | 双路径长期维护成本高；本系统端与后端同团队同节奏发布，无需 | 不采用 |
| 仅新接口用统一信封，存量分批迁移 | 风险最低 | 长期双轨违背「统一」初衷；与本 ADR 决策 4（全量迁移）冲突 | 不采用 |
| 仅建词汇表不迁移既有码 | 改动最小 | 词汇表与现状不一致，「统一」目标打折 | 不采用 |
| `request_id` 仅已认证错误携带 | 实现最简单 | 认证失败无法关联日志追踪，排障困难 | 不采用 |

## 后果

### 正面影响

- 前端以稳定、机器可读的业务状态码做分支（登录失效、权限不足、业务冲突、频控），不再依赖 HTTP 状态码的粗糙映射。
- 成功路径统一信封，三端契约类型单一，新增接口契约维护成本下降。
- 文档与代码对齐：`api-standard.md` 修订后与实现一致，消除三处漂移。
- `request_id` 始终携带（含认证前失败），所有错误可追踪，支持排障。
- 请求侧收敛后，三端请求体/请求头命名一致。

### 代价与风险

- **打破 `api-standard.md`（`active`）响应契约**：需本 ADR 批准 + 设计台账 D-156 登记；修订后文档为「HTTP 一律 200 + 顶层 `code` 信封 + 业务状态码」。
- **全量错误码迁移回归面广**：一次性归一所有域 `AppError.code`（含 `DEVICE_*`/`OTP_*`/`PLATFORM_*`/`SESSION_*`），涉及全后端代码与测试断言，需同步更新 `permissions.test.ts` 之外的各域错误码测试。
- **同步切版要求严格**：后端与所有客户端（Admin/Mobile）必须同一发版窗口发布；否则旧客户端对新接口将因无法解析「HTTP 200 + 信封」而故障。发布时须确认无旧客户端残留。
- **网关/监控语义调整**：依赖 HTTP 状态码的监控、告警、日志聚合规则需改为以业务状态码为维度（或保留 `AppError.httpStatus` 参考语义供日志标注）。
- **原 201/202/204 语义变化**：HTTP 层不再区分创建/接受/无返回体；需要区分时由 `data` 内容表达，前端需适配（原 204 → `data: null`）。
- **契约快照回写**：各域契约快照需同步更新响应示例，工作量与域数量成正比。

## 后续行动

- [ ] 批准本 ADR（`拟议 → 已接受 → frozen`），并在设计台账追加 **D-156** 登记。
- [ ] 在 `adr/index.md` 登记 ADR-023。
- [ ] 更新 `architecture/applications/api-standard.md`：§3 状态码映射、§4.1 成功响应、§4.2 错误包体、§5 请求头为「HTTP 一律 200 + 顶层 `code` 信封 + 业务状态码」。
- [ ] 新增 `architecture/applications/business-status-codes.md`：业务状态码词汇表（单一权威登记）。
- [ ] 同步更新各域契约快照（`contracts/<domain>/<DOMAIN>_API.md`）响应示例。
- [ ] 更新 spec.md 顶部「架构变更请求」标注为「已批准（ADR-023）」。
- [ ] 实施时：后端统一信封（error-handler.ts / AppError / 各域路由）、前端 `code` 判定（Admin/Mobile ApiClient）、全量错误码迁移、请求侧收敛。
