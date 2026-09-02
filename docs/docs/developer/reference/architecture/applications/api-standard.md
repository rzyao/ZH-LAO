---
status: active
last_updated: 2026-08-31
---

# 全局 API 接口设计与通信规范 (API Standard & Protocols)

## 1. 概述与核心定位 (Scope & Philosophy)

ZH-LAO 系统采用 **模块化单体 (Modular Monolith)** 架构，各业务域（Identity, Platform, Operations, Content, Learning, Audio, Social, Chat, Commerce, Rewards, Trust）通过强隔离的领域边界提供统一的 RESTful API。

本规范作为 **全系统跨端通信的顶层标准**，统领以下端的接口设计与实现：
* **服务端**：`apps/backend` (Fastify 5 + TypeScript + Zod)
* **管理端**：`apps/admin` (React 19 + TanStack Query + ApiClient)
* **移动端**：`apps/mobile` (React Native / Expo + API Client)
* **各域 API 契约快照**：`docs/docs/developer/reference/contracts/<domain>/<DOMAIN>_API.md`

---

## 2. 路由结构与 URI 命名规范 (Routing & Naming Conventions)

### 2.1 基础 URI 分层

所有对外暴露的 HTTP 接口按目标用户群体分为两大入口体系：

| 入口类型 | URI 前缀约定 | 典型场景 | 认证与上下文要求 |
| :--- | :--- | :--- | :--- |
| **移动端 / C 端 API** | `/api/v1/<domain>/<resource>` | 用户登录、学习刷题、发帖、社交聊天、充值购买 | 携带用户 `Identity` 凭证，受用户态鉴权约束 |
| **管理端 / B 端 API** | `/api/v1/admin/<domain>/<resource>` | 操作员管理、内容发布审批、音频生产工作台、参数配置 | 携带操作员凭证，经 `Operations` RBAC 与审计拦截 |

### 2.2 命名规范
1. **URI 路径**：
   * 资源路径使用名词复数，采用连字符分隔的小写字母（`kebab-case`）：
     * 示例：`/api/v1/admin/feature-flags`、`/api/v1/learning/progress-records`
   * 操作动作（RPC-style）仅在无法映射为标准 REST 资源时使用动词后缀：
     * 示例：`/api/v1/admin/audio/tasks/:id/approve`、`/api/v1/auth/phone/send-otp`
2. **JSON Payload 键名**：
   * 所有 HTTP 请求体（Request Body）、URL 查询参数（Query Params）与响应体（Response Body）**严格使用下划线命名 (`snake_case`)**。
   * 禁止在 API 边界暴露驼峰命名 (`camelCase`)。
3. **版本化策略**：
   * 采用 URI 路径显式版本前缀 `/v1/`。破坏性变更（Breaking Changes）必须提升版本号至 `/v2/` 并维持旧版向前兼容过渡期。

---

## 3. 标准 HTTP 动词与状态码映射 (HTTP Methods & Status Codes)

严格根据操作语义使用标准 HTTP 动词与状态码：

```
┌──────────────┬────────────────────────────────────────────────────────────────────────┐
│ HTTP 动词    │ 语义与幂等性保证                                                       │
├──────────────┼────────────────────────────────────────────────────────────────────────┤
│ GET          │ 安全且幂等：读取单个资源或列表，禁止产生副作用。                       │
│ POST         │ 非幂等（除非提供 Idempotency-Key）：新建资源或触发状态机转换。        │
│ PUT          │ 幂等：完整替换目标资源。                                               │
│ PATCH        │ 局部更新目标资源属性（推荐配合乐观锁版本号）。                         │
│ DELETE       │ 幂等：软删除或逻辑注销指定资源。                                       │
└──────────────┴────────────────────────────────────────────────────────────────────────┘
```

### 状态码映射表

| 状态码 | 含义 (Status) | 适用业务场景 |
| :--- | :--- | :--- |
| **200 OK** | 请求成功 | `GET`, `PATCH`, `PUT` 以及同步返回数据的 `POST` 操作 |
| **201 Created** | 资源创建成功 | `POST` 新建资源，并在响应体中返回新建实体的完整或核心数据 |
| **202 Accepted** | 异步任务已接受 | 耗时任务（如 TTS 批量合成、全服配置同步、大规模导出）排队中 |
| **204 No Content**| 成功但无返回体 | 资源的硬删除/注销操作 |
| **400 Bad Request**| 请求参数校验失败 | 请求体字段类型错误、缺失必填项、Zod Schema 校验未通过 |
| **401 Unauthorized**| 身份未认证 | Token 缺失、格式无效、已过期或已被主动注销 |
| **403 Forbidden** | 权限不足 | 已通过身份认证，但角色缺少当前操作所需的 RBAC 权限点 |
| **404 Not Found** | 资源不存在 | 请求的实体 ID 在数据库中不存在或对当前主体逻辑不可见 |
| **409 Conflict**  | 状态或版本冲突 | 乐观锁版本号不一致（Stale Config）、唯一键重复（手机号已注册） |
| **422 Unprocessable**| 语义或业务规则受阻 | 业务状态机禁止流转（如对“已驳回”的音频直接发起“发布”） |
| **429 Too Many Requests**| 频控限流 | 短信 OTP 发送频率超限、恶意接口请求拦截 |
| **500 Internal Error**| 服务端异常 | 未捕获的代码运行时异常（隐藏堆栈，返回统一 requestId） |
| **503 Unavailable** | 上游依赖不可用 | 短信通道挂起、第三方支付网关故障（Fail-Closed 原则） |

---

## 4. 统一响应格式与错误包体 (Response Envelope & Error Model)

### 4.1 成功响应格式

#### 单实体返回
```json
{
  "data": {
    "account_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "username": "operator_alice",
    "display_name": "Alice Chen",
    "role": "content_admin",
    "status": "active",
    "created_at": "2026-08-31T10:00:00.000Z",
    "updated_at": "2026-08-31T10:00:00.000Z"
  }
}
```

#### 分页列表返回（Offset 模式）
```json
{
  "data": {
    "items": [
      {
        "operator_id": "0191753c-7c00-7000-8000-000000000001",
        "username": "auditor_bob",
        "status": "active"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 128,
      "total_pages": 7
    }
  }
}
```

#### 游标流式分页返回（Cursor 模式）
```json
{
  "data": {
    "items": [
      {
        "message_id": "0191753c-7c00-7000-8000-000000000088",
        "seq": 1052,
        "content": "Sabaidee!",
        "sent_at": "2026-08-31T12:00:00.000Z"
      }
    ],
    "pagination": {
      "limit": 50,
      "has_more": true,
      "next_cursor": "eyJzZXEiOjEwNTIsImlkIjoiMDE5MTc1..."
    }
  }
}
```

### 4.2 统一错误包体 (Error Envelope)

后端所有异常响应统一遵循 `AppError` 结构，严禁直接向客户端抛出原生数据库错误或未处理的异常堆栈：

```json
{
  "error": {
    "code": "OPERATOR_ALREADY_EXISTS",
    "message": "The username 'operator_alice' is already assigned to another active account.",
    "request_id": "req-9f3a8b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "details": [
      {
        "field": "username",
        "issue": "unique_violation",
        "message": "Username is already in use"
      }
    ]
  }
}
```

* **`code`**：业务错误枚举字面量（大写下划线 `UPPER_SNAKE_CASE`），前端据此进行本地化文案或分支流转。
* **`message`**：安全的可读错误描述（禁止包含 SQL 语句或内部机密路径）。
* **`request_id`**：由网关或 Fastify 生成的追踪 ID，用于线上排查链路。
* **`details`**：字段级校验异常细节数组（多用于 400 表单校验错误）。

---

## 5. 跨端通用请求头规范 (Standard HTTP Headers)

| 请求头 (Header) | 必需/可选 | 格式与示例 | 职责与安全语义 |
| :--- | :--- | :--- | :--- |
| **`Authorization`** | 大多数接口必需 | `Bearer <JWT_ACCESS_TOKEN>` | 用户或操作员访问凭证（Access Token） |
| **`X-Request-Id`** | 强烈推荐 | `UUID` (如 `f47ac10b-58cc-4372-a567-0e02b2c3d479`) | 全链路日志跟踪标识，若前端不传由后端网关自动补齐 |
| **`Idempotency-Key`**| 关键写操作必需 | 字符串 / UUID | 支付充值、礼物打赏、工单提交等防重放与幂等保障 |
| **`If-Match`** / **`X-Resource-Version`** | 并发配置必需 | 整数版本号 (如 `version=4`) | 乐观锁防冲突版本标识（不匹配时返回 409） |
| **`Content-Type`** | POST/PUT/PATCH 必需 | `application/json; charset=utf-8` | 声明请求体内容编码 |
| **`Accept-Language`** | 可选 | `zh-CN`, `lo-LA`, `en-US` | 国际化错误信息与多语言内容协商 |

---

## 6. 数据类型与实体标识约束 (Data Types & Entity Constraints)

### 6.1 外部实体标识 (Entity Identifiers)
* **严禁泄露自增主键**：数据库内部表虽然使用 `BIGINT GENERATED ALWAYS AS IDENTITY` 保证单表索引性能，但**禁止在任何 API Request / Response 中暴露内部整型主键**。
* **对外统一使用 UUID**：API 边界必须使用 `UUIDv4` 或 `UUIDv7` 字符串（如 `0191753c-7c00-7000-8000-000000000001`）。
* **前端必须进行断言**：前端使用 `@/api/contracts/uuid` 中的 `isUuid()` 与 `assertUuid()` 进行防御性校验。

### 6.2 时间与时区 (Timestamps)
* **传输标准**：所有时间戳统一采用 **ISO 8601 UTC** 字符串格式：
  `YYYY-MM-DDTHH:mm:ss.sssZ`（例如：`2026-08-31T14:30:00.000Z`）。
* **禁止使用时间戳整数**：禁止使用 UNIX 毫秒或秒数整型，防止不同语言在解析时产生秒/毫秒单位歧义。

### 6.3 货币与金融精度 (Money & Precision)
* **金额与余额**：Coins、Points 或法币微单位必须定义为最小整数货币单位（例如以分为单位的整数或严格约束精度的定点数值），禁止使用 JavaScript 浮点数直接计算。
* **等宽呈现**：在前端 Admin 与客户端展示时统一加上 `tabular-nums`。

---

## 7. 并发控制与乐观锁协议 (Concurrency & Versioning)

针对平台配置覆盖、内容发布审批等高风险场景，采用 **乐观并发控制 (Optimistic Concurrency Control)**：

```
Client A (ver=3) ──── GET /config ─────────► [Server ver=3]
Client B (ver=3) ──── GET /config ─────────► [Server ver=3]

Client A (ver=3) ──── PATCH (ver=3) ───────► [Server ver=3 -> 4] (200 OK)
Client B (ver=3) ──── PATCH (ver=3) ───────► [Server ver=4] (409 Conflict!)
                                              ↳ 返回最新版本元数据，提示覆盖冲突
```

### 冲突响应示例 (409 Conflict)
```json
{
  "error": {
    "code": "STALE_VERSION_CONFLICT",
    "message": "The configuration has been modified by another operator. Please refresh and review latest changes.",
    "request_id": "req-11223344",
    "details": [
      {
        "field": "version",
        "current_version": 4,
        "provided_version": 3
      }
    ]
  }
}
```

---

## 8. 代码库与架构落地映射 (Codebase Implementation)

### 8.1 后端实现层 (`apps/backend/`)
* **路由注册与装配**：`apps/backend/src/modules/<domain>/http/routes.ts` 与 `composition.ts`。
* **参数与模式校验**：通过 `zod` 在 Fastify 请求钩子（`preValidation` / `schema`）中强校验。
* **认证拦截**：`IdentityAuthenticationProvider` 统一解析 Bearer Token，挂载 `request.authContext`。
* **错误处理拦截器**：全局 Fastify `setErrorHandler` 统一封装 `AppError` 与未捕获异常。

### 8.2 前端通信层 (`apps/admin/src/api/` & `apps/mobile/src/api/`)
* **ApiClient 统一封装**：`apps/admin/src/api/client/http-client.ts`
  * 自动注入 `Authorization: Bearer <token>`
  * 自动生成并下发 `X-Request-Id`
  * 超时控制（`timeoutMs`）与 `AbortSignal` 取消支持
  * 统一将非 2xx HTTP 状态映射为强类型的 `ApiError`, `UnauthorizedError`, `ConflictError`
* **状态缓存与失效**：结合 `@tanstack/react-query` 统一管理请求缓存、防重复请求与前台重试。
