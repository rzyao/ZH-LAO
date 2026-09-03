---
status: frozen
last_updated: 2026-09-03
---

# 业务状态码词汇表 (Business Status Code Vocabulary)

> **权威登记**（ADR-023 / D-156）。业务状态码是前后端判断成败与分支的**唯一权威**
> （HTTP 一律 200）。所有业务码使用 `UPPER_SNAKE_CASE`。
> **新增业务码必须先在此登记，禁止各域自造冲突码。**
>
> 依据：[ADR-023](/developer/reference/adr/ADR-023-unified-api-contract.md)、
> [api-standard.md](./api-standard.md)、设计台账 [D-156](/developer/reference/governance/design-register.md)。

## 使用规则

- 所有业务 API 响应 HTTP 状态码一律 **200**，成败由响应体顶层 `code` 判断。
- 成功恒为 `OK`；失败为下方对应业务码。
- `error.message` 为可展示的安全文案；`error.details` 为结构化错误数据。
- `request_id` 顶层始终携带（含认证前失败）。
- **HTTP 映射语义**列仅供日志/监控/兼容参考，不决定响应状态码。

## 通用成功码

| 业务码 | 含义 | HTTP 参考 | 前端处理动作 |
| --- | --- | --- | --- |
| `OK` | 请求成功 | 200 | 解包 `data` 渲染 |

## 通用失败码

| 业务码 | 含义 | HTTP 参考 | 前端处理动作 |
| --- | --- | --- | --- |
| `UNAUTHENTICATED` | 身份未认证（Token 缺失/无效/过期/注销） | 401 | 触发登录失效处理（清除会话、跳转登录） |
| `FORBIDDEN` | 权限不足（已认证但缺少 RBAC 权限点） | 403 | 展示无权限提示；不触发登录失效 |
| `NOT_FOUND` | 资源不存在或对当前主体逻辑不可见 | 404 | 展示「资源不存在」 |
| `VALIDATION_ERROR` | 字段校验失败（`error.details` 为字段级错误数组） | 400/422 | 按字段级错误定位表单控件 |
| `STALE_VERSION_CONFLICT` | 乐观锁/版本冲突（`error.details` 含当前/请求版本元数据） | 409 | 展示冲突提示并刷新重试 |
| `CONFLICT` | 资源已存在 / 唯一键冲突 | 409 | 展示冲突提示 |
| `RATE_LIMITED` | 通用频控限流（`error.details.retry_after_seconds`） | 429 | 展示重试倒计时 |
| `LOGIN_RATE_LIMITED` | 登录频控限流（`error.details.retry_after_seconds`） | 429 | 展示重试倒计时 |
| `INTERNAL_ERROR` | 服务端未捕获异常（`message` 隐藏内部细节） | 500 | 展示通用错误；`request_id` 上报 |
| `INVALID_ARGUMENT` | 请求参数不合法（通用） | 400 | 展示校验提示 |
| `INVALID_DATA` | 数据违反约束 | 400/409 | 展示数据错误提示 |
| `INVALID_REQUEST` | 请求校验失败（通用） | 400 | 展示校验提示 |
| `PROVIDER_UNAVAILABLE` | 上游依赖不可用（Fail-Closed） | 503 | 展示「服务暂不可用」 |

## 身份域 (Identity)

| 业务码 | 含义 | HTTP 参考 | 前端处理动作 |
| --- | --- | --- | --- |
| `INVALID_CREDENTIAL` | 凭证无效（手机号/OTP/密码/刷新令牌） | 401 | 展示「凭证无效」 |
| `ACCOUNT_DISABLED` | 账号被禁用 | 403 | 展示「账号已禁用」 |
| `ACCOUNT_CLOSED` | 账号已关闭 | 403 | 展示「账号已关闭」 |
| `SESSION_EXPIRED` | 会话已过期 | 401 | 触发重新登录 |
| `SESSION_REVOKED` | 会话已注销 | 401 | 触发重新登录 |
| `TOKEN_EXPIRED` | 令牌已过期 | 401 | 触发刷新/重登录 |
| `DEVICE_NOT_FOUND` | 设备不存在 | 404 | 展示「设备不存在」 |
| `DEVICE_REVOKED` | 设备已注销 | 401/409 | 展示「设备已注销」 |
| `DEVICE_OWNERSHIP_CONFLICT` | 设备/推送令牌归属冲突 | 409 | 展示归属冲突提示 |
| `PHONE_ALREADY_BOUND` | 手机号已绑定 | 409 | 展示「手机号已绑定」 |
| `PHONE_NOT_BOUND` | 手机号未绑定 | 404 | 展示「手机号未绑定」 |
| `INVALID_PHONE` | 手机号非 E.164 | 400 | 展示「手机号格式错误」 |
| `IDENTITY_CONFLICT` | 身份数据不一致 | 409 | 展示「账号数据异常」 |
| `IDENTITY_EMPTY_PROFILE_UPDATE` | 资料更新为空 | 400 | 展示「无更新内容」 |
| `IDENTITY_REFERENTIAL_CONFLICT` | 身份引用冲突 | 409 | 展示冲突提示 |
| `IDENTITY_REPOSITORY_FAILURE` | 身份存储失败 | 500 | 展示通用错误 |
| `LEARNING_DIRECTION_IMMUTABLE` | 学习方向不可变更 | 409 | 展示「学习方向不可更改」 |

## OTP 域 (Identity OTP)

| 业务码 | 含义 | HTTP 参考 | 前端处理动作 |
| --- | --- | --- | --- |
| `OTP_ALREADY_USED` | OTP 已使用 | 409 | 展示「验证码已使用」 |
| `OTP_EXPIRED` | OTP 已过期 | 400 | 展示「验证码已过期，请重新获取」 |
| `OTP_LOCKED` | OTP 尝试次数超限被锁定 | 400 | 展示「验证码已锁定」 |
| `OTP_INVALID` | OTP 无效 | 400 | 展示「验证码错误」 |
| `OTP_RATE_LIMITED` | OTP 发送频控 | 429 | 展示重试倒计时 |
| `OTP_SECRET_INVALID` | OTP 密钥无效 | 400 | 展示「验证失败」 |
| `BOOTSTRAP_ALREADY_COMPLETED` | 引导已完成 | 409 | 提示已初始化 |

## Platform 域

| 业务码 | 含义 | HTTP 参考 | 前端处理动作 |
| --- | --- | --- | --- |
| `PLATFORM_INVALID_ARGUMENT` | Platform 请求参数校验失败 | 400 | 展示校验提示 |
| `PLATFORM_NOT_FOUND` | Platform 资源不存在 | 404 | 展示「资源不存在」 |
| `PLATFORM_CONFLICT` | Platform 状态/版本冲突 | 409 | 展示冲突提示 |
| `FEATURE_FLAG_INVALID_SCOPE` | 功能开关作用域非法 | 400 | 展示校验提示 |
| `FEATURE_FLAG_RETIRED` | 功能开关已退役 | 409 | 展示「已退役」 |
| `RUNTIME_CONFIG_INVALID_VALUE` | 运行时配置值非法 | 400 | 展示校验提示 |
| `RUNTIME_CONFIG_KEY_UNREGISTERED` | 运行时配置 key 未注册 | 400 | 展示「key 未注册」 |
| `RUNTIME_CONFIG_RETIRED` | 运行时配置已退役 | 409 | 展示「已退役」 |
| `RUNTIME_CONFIG_UNAVAILABLE` | 运行时配置不可用 | 404 | 展示「配置不可用」 |
| `APP_VERSION_MISMATCH` | App 版本不匹配 | 409 | 提示版本不符 |
| `APP_VERSION_INVALID_TRANSITION` | App 版本状态流转非法 | 409 | 展示「状态不允许」 |
| `APP_VERSION_POLICY_UNAVAILABLE` | App 版本策略不可用 | 404 | 展示「策略不可用」 |
| `ANNOUNCEMENT_INVALID_TRANSITION` | 公告状态流转非法 | 409 | 展示「状态不允许」 |
| `REGION_INVALID` | 地区配置非法 | 400 | 展示校验提示 |
| `REGION_RETIRED` | 地区已退役 | 409 | 展示「已退役」 |

## Operations 域

| 业务码 | 含义 | HTTP 参考 | 前端处理动作 |
| --- | --- | --- | --- |
| `OPERATOR_ACCESS_DENIED` | 认证主体无有效操作员映射 | 403 | 展示「无操作员权限」 |
| `OPERATOR_DISABLED` | 操作员已被禁用 | 403 | 展示「操作员已被禁用」 |
| `OPERATOR_NOT_FOUND` | 操作员不存在 | 404 | 展示「操作员不存在」 |
| `OPERATOR_ALREADY_EXISTS` | 身份主体已映射为操作员 | 409 | 展示「操作员已存在」 |
| `OPERATOR_AUTH_SUBJECT_NOT_FOUND` | 关联身份主体不存在 | 400 | 展示「身份主体不存在」 |
| `OPERATOR_AUTH_SUBJECT_INACTIVE` | 关联身份主体非 active | 409 | 展示「身份主体非活跃状态」 |
| `ROLE_NOT_FOUND` | 角色不存在 | 404 | 展示「角色不存在」 |
| `ROLE_DISABLED` | 目标角色已被禁用 | 409 | 展示「角色已禁用」 |
| `ROLE_CODE_CONFLICT` | 角色代码冲突已存在 | 409 | 展示「角色代码已存在」 |
| `INVALID_PERMISSION` | 权限键不在规范目录或重复 | 400 | 展示「权限键无效」 |
| `LAST_SUPER_ADMIN_REQUIRED` | 必须保留至少一个活跃超级管理员 | 409 | 展示「必须保留至少一个活跃超级管理员」 |
| `SYSTEM_ROLE_PROTECTED` | 系统保留角色受保护禁止非法变更 | 409 | 展示「系统保留角色受保护」 |
| `AUDIT_LOG_NOT_FOUND` | 审计日志记录未找到 | 404 | 展示「审计日志未找到」 |
| `OPERATOR_AUDIT_PERSISTENCE_FAILED` | 操作审计持久化失败 | 500 | 展示通用错误 |
| `AUTHENTICATION_UNAVAILABLE` | 认证服务不可用 | 503 | 展示「认证暂不可用」 |

## Content 域 (现状内联错误码 — 待实施统一为 AppError 后并入词汇表)

| 业务码 | 含义 | HTTP 参考 | 前端处理动作 |
| --- | --- | --- | --- |
| `UNICODE_CONFLICT` | 内容唯一键冲突（如 Unicode 归一冲突） | 409 | 展示冲突提示 |
| `ACTIVE_WORK_CONFLICT` | 存在进行中的工作项 | 409 | 展示「存在进行中任务」 |
| `ILLEGAL_STATE_TRANSITION` | 内容发布/审核状态流转非法 | 400 | 展示「状态不允许」 |

> 注：Content 域当前以内联 `{ error: 'XXX', message }` 形式返回（未走 `AppError` 体系）。
> ADR-023 实施时统一为 `AppError` 信封并归入本词汇表；上表为现状登记。
> Content 内联 `ERROR` / `INTERNAL_ERROR` 对应通用 `INTERNAL_ERROR`；`VALIDATION_ERROR`
> 对应通用 `VALIDATION_ERROR`。

---

## 代码 → 词汇表交叉校验

截至 **2026-09-03**，`apps/backend/src` 中枚举到的 `AppError.code` 已全部登记于上表
（通用 + Identity/OTP + Platform + Operations），无未登记码。Content 域内联错误码 3 个已登记为
「现状内联」待统一。

## 治理

- **新增业务码**：先在本文登记（含含义/HTTP 参考/前端动作），再在代码中使用。
- **规范标准**：详细 API 通信规范与响应信封定义参见 [api-standard.md](./api-standard.md)。
- **禁止**各域自造与词汇表冲突的码。
- **迁移**：ADR-023 全量迁移后，所有码为 `UPPER_SNAKE_CASE` 且与本文一一对应；
  交叉校验无未登记码。
