---
status: baseline
last_updated: 2026-08-31
---

# 安全与统一鉴权 (Security & Unified Auth)

ZH-LAO 的安全模型按事实所有权拆分认证、后台授权、平台治理和业务状态校验，不由一个“万能权限模块”接管全部判断。系统通过分层的安全拦截管线与强类型上下文，实现 C 端用户与 B 端管理后台的统一安全防护。

---

## 1. 安全责任分层

| 能力 | 事实拥有者 | 主要职责 |
| :--- | :--- | :--- |
| **用户认证** | 身份（Identity） | 登录身份、OTP、Session、Device、Access / Refresh Token、账号状态 |
| **后台操作者** | 运营（Operations） | Operator、Role、Permission、RBAC、后台操作审计 |
| **平台治理** | 信任与安全（Trust & Safety） | 举报、审核、证据、处罚、限制、申诉 |
| **业务授权** | 各业务领域 | 资源归属（IDOR 防护）、业务状态、状态机前置条件与领域不变量 |
| **技术安全** | Shared Application / Infrastructure | Request ID、日志脱敏、错误封装、Secret Fail-Fast、HTTP 边界 |

---

## 2. 统一鉴权执行管线 (Unified Auth Pipeline)

系统严格区分 **认证 (Authentication - 证明你是谁)** 与 **授权 (Authorization - 决定你能做什么)**。所有受保护的 HTTP 请求必须按序通过统一鉴权流水线：

```text
Incoming HTTP Request
  │
  ├─ 1. HTTP 提取层 (Extract Bearer Token)
  │    └─ 解析 Header: Authorization: Bearer <JWT_Access_Token>
  │
  ├─ 2. Token 密码学校验 (Token Verification)
  │    ├─ 验证 HMAC SHA-256 签名、Issuer、Audience 与未过期 (exp)
  │    └─ 解析 JWT Payload: subject_id (UUID), session_id, role
  │
  ├─ 3. 主体解析与状态裁决 (Subject Resolution & Active Check)
  │    ├─ C 端请求 ──► Identity 查询账户状态 (active / disabled / closed)
  │    │                └─ 若非 active 立即 401 阻断并撤销会话
  │    └─ B 端请求 ──► Operations 查询操作员状态 (active / disabled)
  │                     └─ 若 disabled 立即 403 拒绝
  │
  ├─ 4. 挂载统一安全上下文 (Attach AuthContext)
  │    └─ 注入 Fastify Request: request.authContext = { subjectId, role, status, ... }
  │
  ├─ 5. RBAC 权限判定 (Admin Authorization - preHandler: requirePermission)
  │    └─ 校验当前 Operator 权限集合是否精准匹配目标权限键 (如 operations.operator.read)
  │
  ├─ 6. 领域业务级所有权校验 (Domain Ownership / IDOR Check)
  │    └─ 由 Application Service 验证当前 subjectId 是否为目标资源拥有者
  │
  └─ 7. 执行业务 Mutation 并记录审计日志 (Audit Logging)
```

> **核心原则**：前端 UI 层的 `AuthGuard`、`PermissionGuard` 或 `can()` 仅用于提升交互体验（隐藏无权按钮/重定向），**绝对不能替代服务端 Fastify 鉴权管线**。

---

## 3. 统一安全上下文契约 (`AuthContext`)

在 Fastify 请求生命周期的 `preValidation` / `preHandler` 阶段，认证中间件完成鉴权后统一将标准上下文对象挂载至 `request.authContext`：

```typescript
export interface AuthContext {
  /** 当前主体的稳定逻辑 UUID (用户 ID 或操作员 ID) */
  subjectId: string;
  /** 会话标识 UUID */
  sessionId: string;
  /** 主体角色类型: 'user' | 'operator' */
  role: 'user' | 'operator';
  /** 账户生命周期状态: 必须为 'active' */
  status: 'active';
  /** 关联设备或终端标识 */
  deviceId?: string;
  /** (管理后台特有) 当前操作员具备的精确权限集合 */
  permissions?: Set<string>;
}
```

---

## 4. Identity 认证边界与凭证管理

当前 Identity 领域负责全系统底层的身份凭据与会话管理：

### 4.1 认证机制与凭证生命周期
- **手机号 E.164 + OTP**：短信验证码单次消费，具备请求频控与冷却时间；
- **Facebook Credential**：第三方 OAuth 凭证安全适配层；
- **JWT Access Token**：短生命周期（建议 15~30 分钟），无状态校验，用于 API 快速鉴权；
- **Opaque Refresh Token**：高强度随机串，单次旋转使用（Refresh Rotation），用于无感刷新 Access Token；
- **会话 (Session) 与设备 (Device)**：服务端记录 Session 生命周期，账号状态转为 `disabled` 或 `closed` 时触发全会话吊销。

### 4.2 凭证安全红线
```text
Raw OTP 绝不持久化落库、不进普通日志、不进事件 Payload
Raw Refresh Token 仅保存单向加盐哈希，原值绝不落库
Access Token 不做数据库持久化
生产环境密钥 (JWT_HMAC_SECRET / OTP_HMAC_SECRET) 缺失或长度 < 32 位必须 Fail-Fast 启动拒绝
```

### 4.3 客户端存储分级策略
* **移动客户端 (`apps/mobile`)**：
  * `Access Token` $\rightarrow$ 仅保存在内存 (In-Memory Runtime)，随应用重启重新换发；
  * `Refresh Token` $\rightarrow$ 必须保存在系统级安全存储 (iOS Keychain / Android KeyStore, `SecureStore`)；
  * `普通用户偏好` $\rightarrow$ 保存在本地轻量存储 (`AsyncStorage`)。
* **管理后台 (`apps/admin`)**：
  * 认证信息通过统一 `ApiClient` 拦截器分发，页面与组件禁止自行读取原始凭据拼接 Header。

---

## 5. Operations RBAC 授权规范 (管理后台)

管理后台权限采用 **精确权限键 (Exact Permission Key)** 模式：

```text
<domain>.<resource>.<action>
```

* 典型示例：`operations.operator.read`、`content.knowledge.publish`、`audio.task.approve`

### RBAC 核心铁律
1. **禁用通配符**：不支持 `operations.*` 或 `*`，所有权限必须精确枚举。
2. **V1 严格 RBAC**：暂不引入复杂的动态 ABAC 规则。
3. **状态级联阻断**：`disabled` 状态的操作员或被禁用的角色立即失效，不参与权限合并 (Permission Union)。
4. **无超级管理员后门**：`super_admin` 同样通过关联拥有全量权限行的角色进行鉴权，不存在代码级硬编码绕过逻辑。
5. **以物理数据库为准**：RBAC 授权以数据库当前事务内的物理授权数据为准，不依赖不可靠的过期缓存。
6. **操作审计强制联动**：所有涉及写操作（创建、修改、删除、审批、状态覆写）的权限触发后，必须在同一调用链写入 `operations.audit_logs`。

---

## 6. 用户关系过滤与平台治理处罚 (Trust & Safety)

在业务层判定用户行为合法性时，必须严格区分两类事实：

```text
social_blocks (Social 领域)
  = 用户之间的私有关系事实（A 用户主动拉黑了 B 用户）

trust.enforcement_actions (Trust & Safety 领域)
  = 平台维度的安全处罚事实（B 用户因违规被平台禁言 / 封禁社交能力）
```

* **协作规则**：社交发现 (Discover)、关注 (Follow)、发起即时聊天 (Chat) 等业务在执行前，需同时调用 Social 与 Trust & Safety 的公开查询契约完成综合校验，但两者的底层数据事实绝不物理合并。

---

## 7. 跨领域与物理数据安全边界

跨领域调用与数据交互必须严格遵守以下红线：

1. **强契约隔离**：各 Domain 之间仅通过各自动态导出的 `public/` 契约或 API 进行通信；
2. **禁止跨领域直接依赖**：
   * 严禁跨领域导入内部 Repository (`import { ...Repository } from '../other-domain'`)；
   * 严禁跨领域编写裸 SQL 跨 Schema 查询；
   * 严禁跨领域建立物理外键 (`PHYSICAL FK`)。
3. **外部标识与内部主键**：
   * 对外传输、跨域引用、API 契约一律使用**全局唯一逻辑 UUID**；
   * 单表自增 `BIGINT` 仅用于领域内部物理主键与索引优化，**严禁跨领域泄露**。
4. **敏感信息净化**：密码哈希、Secret、Token、OTP 严禁进入 Public Contract 或 Outbox 事件 Payload。

---

## 8. HTTP 边界与输入安全防护

* **参数强校验 (Zod Schema)**：Fastify 路由层开启严格 Schema 校验，拒绝未知字段（`strip` / `strict`），防范 Mass Assignment 攻击。
* **业务级 IDOR (越权) 防护**：涉及 `/me/...` 或私有资源的修改，必须在 Application Service 中校验 `resource.owner_id === request.authContext.subjectId`。
* **防重放与幂等保障**：对金额扣减、购买履约、礼物赠送、工单提交等关键接口，强制校验 `Idempotency-Key` 请求头。
* **并发版本防冲突**：对全局配置、内容发布等管理接口，强制校验 `version` 乐观锁并在冲突时返回 `409 Conflict`。
* **安全响应头与防缓存**：Token 换发与用户隐私接口必须携带 `Cache-Control: no-store, no-cache`。

---

## 9. 错误处理与日志脱敏

统一基础设施保证线上运行时安全：

```text
客户端接收稳定错误码 (code) 与 Request ID
  ├── 严格隐藏服务端未捕获的 Error Stack 堆栈
  ├── 严格隐藏 PostgreSQL 原生异常与物理表名/约束名
  └── 生产环境 Pino 日志开启深度脱敏 (Redaction)，自动过滤 password, token, secret, otp
```

---

## 10. 尚未形成系统能力的事项 (Future Scope)

以下能力目前不在 V1 基线内，其他模块严禁假设其已存在：
* 多因素认证 (MFA / 2FA)
* Passkey / WebAuthn
* 第三方社交登录 (Google / Apple / WeChat)
* 全局 Access Token 黑名单 (Token Revocation List)
* 动态策略引擎 (ABAC / OPA)
* Refresh Token 家族重放自动追踪 (Replay Family Revocation)

未来如需引入上述能力，必须先建立架构决策记录 (ADR) 并完成系统级专项设计。
