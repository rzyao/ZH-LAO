# Feature Specification: 用户登录与会话 (User Login & Session)

**Feature Branch**: `001-user-login`

**Created**: 2026-09-02

**Status**: Draft

**Input**: User description: "实现用户登录功能。请根据项目现有文档和代码上下文生成 feature specification。不要修改代码。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 手机验证码注册与登录 (Priority: P1)

作为一名老挝语或中文学习者（新用户或老用户），我希望通过输入手机号并接收短信一次性验证码（OTP）完成登录或首次注册，以便安全快捷地进入应用开始学习。

**Why this priority**: 手机号 OTP 认证是平台最核心的用户准入方式和 MVP 基础闭环。没有该流程，用户无法建立正式身份、无法保存学习档案。

**Independent Test**: 用户可以在客户端输入规范手机号并请求验证码，输入正确验证码（新用户附带学习方向）后成功进入系统，获得有效会话令牌并跳转到主页。

**Acceptance Scenarios**:

1. **Given** 用户处于未登录状态且提供合法的 E.164 格式手机号，**When** 申请登录验证码，**Then** 系统受理请求，进入 60 秒重发倒计时，并在短信通道正常时发出 6 位验证码，响应不泄露该手机号是否已注册。
2. **Given** 已有活跃账户的用户收到有效验证码，**When** 提交手机号与验证码进行认证，**Then** 系统在同一事务中核销验证码、关联用户与设备、建立新会话并返回短期访问令牌与刷新凭证，直接进入已登录主界面。
3. **Given** 首次使用平台的新用户收到有效验证码，**When** 提交手机号、验证码以及合法的固定学习方向（`lo -> zh` 或 `zh -> lo`），**Then** 系统在同一事务中核销验证码、创建新用户实体、生成对应语言学习档案与基础个人资料、建立登录会话并派发领域注册事件。
4. **Given** 待验证的验证码挑战，**When** 用户输入错误的验证码，**Then** 失败尝试计数累加 1；若尝试次数达到上限（5次），该挑战状态置为锁定，后续即使输入正确也拒绝通过，提示重新获取。

---

### User Story 2 - 会话无感刷新与令牌轮换 (Priority: P2)

作为一名已登录用户，我希望在短期访问令牌过期后，系统能够自动续签访问权限，而无需我频繁重新输入手机号或验证码，同时保证即使旧凭证泄露也不会长期威胁账户安全。

**Why this priority**: 访问令牌 TTL 为 15 分钟，自动刷新是保持移动端平滑体验、避免重复认证的关键能力；同时单次使用的 Refresh Token 轮换机制确保了会话安全。

**Independent Test**: 在访问令牌过期后，客户端携带有效的刷新凭证请求续期，系统能够成功返回新的短期访问令牌和全新轮换的刷新凭证，并将滑动会话窗口延长 30 天。

**Acceptance Scenarios**:

1. **Given** 持有未撤销且未过期的有效会话刷新凭证，**When** 请求刷新会话，**Then** 系统返回新的访问令牌与全新的刷新凭证，延长会话到期时间，且原刷新凭证立即失效不可再次使用。
2. **Given** 已被轮换失效的旧刷新凭证，**When** 再次尝试用于刷新，**Then** 系统拒绝请求，返回凭据无效错误，阻止重放攻击。
3. **Given** 账户状态被管理员置为禁用（`disabled`）或关闭（`closed`），**When** 尝试使用刷新凭据续签，**Then** 系统拒绝刷新并返回对应账户状态受限错误。

---

### User Story 3 - 当前设备退出与全端登出 (Priority: P3)

作为一名已登录用户，我希望在更换设备、借用他人手机或怀疑账号安全时，能够主动退出当前设备登录，或者一键登出所有已登录设备，以便控制会话生命周期和保护隐私。

**Why this priority**: 会话的主动终止与销毁是账户安全与合规的必要能力，避免遗留会话被未授权人员利用。

**Independent Test**: 用户在设置页点击“退出当前账号”或“退出所有设备”，对应会话立即被置为撤销状态，后续使用这些会话的刷新凭据均被拒绝。

**Acceptance Scenarios**:

1. **Given** 用户在当前设备上发起单设备退出，**When** 提交当前会话凭据，**Then** 系统将当前会话标记为撤销状态（记录撤销原因与时间），刷新凭据立即作废，该操作支持幂等重试。
2. **Given** 用户已在多台设备上登录且当前持有有效认证令牌，**When** 发起退出全部设备，**Then** 系统在数据库事务中将该用户下所有处于活跃状态的会话批量置为撤销，所有设备上的刷新凭据失效。

---

### User Story 4 - 第三方 Facebook 账号登录 (Priority: P4)

作为习惯使用社交账号的国际用户，我希望通过 Facebook 授权一键登录应用，以便免去接收短信验证码的步骤。

**Why this priority**: 提供多元化身份接入渠道，降低海外用户在短信覆盖受限或延迟情况下的注册与登录门槛。

**Independent Test**: 客户端完成 Facebook 客户端授权后，将授权凭证交由服务端与 Facebook 服务端校验，校验成功后老用户直接登录，新用户选择学习方向后完成注册并建立会话。

**Acceptance Scenarios**:

1. **Given** 客户端提交合法有效的 Facebook 认证凭证，**When** 服务端向 Facebook 验证通过并解析出稳定的唯一主体标识，**Then** 系统识别已绑定的账户，建立新会话并签发令牌。
2. **Given** 首次使用 Facebook 认证的新用户，**When** 提交有效凭证与选定的学习方向，**Then** 系统创建新用户实体、绑定 Facebook 身份、初始化学习档案与默认资料，并建立会话。
3. **Given** 第三方 Facebook 服务不可用或凭证失效，**When** 用户尝试发起 Facebook 登录，**Then** 系统向客户端返回服务暂时不可用或凭证无效的明确错误，且不破坏现有本地会话。

---

### Edge Cases

- **并发请求同一手机号验证码**: 当客户端因网络抖动或连击快速发送多次获取验证码请求时，系统必须通过互斥机制保证同一时刻该手机号和用途下仅存在一个有效的待验证挑战，禁止产生多个同时可消费的验证码。
- **验证码重发冷却与频率限制**: 60 秒倒计时内重复申请必须直接拒绝并返回冷却提示；单手机号 30 分钟内超过 5 次或 24 小时内超过 10 次请求必须严格限流拦截。
- **并发提交相同旧 Refresh Token 刷新**: 两个并发刷新请求同时到达时，数据库行锁机制必须保证仅有一个请求成功轮换并获得新凭证，另一个请求必须明确失败，杜绝并发克隆会话。
- **老用户尝试通过登录修改学习方向**: 已注册的老用户若在登录请求中携带与现有档案不一致的学习语言对，系统必须拒绝并返回学习方向不可变更冲突错误，保证学习方向终身固定。
- **登录携带已被其他用户占用的设备标识**: 若客户端上报的安装标识已关联其他用户但尚未释放，系统应按防冲突与所有权变更规则处理，避免非法串号或设备权限混淆。
- **网络超时导致的认证重试**: 客户端在提交验证码认证时若遭遇读超时，再次重试可能命中“验证码已消费”，此时客户端需提示用户重新获取验证码或由端侧检查是否已成功建立本地会话。

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统 MUST 支持将用户输入的手机号标准化解析为国际 E.164 规范格式，并对非法格式在入口处进行拒绝。
- **FR-002**: 系统 MUST 为手机号登录生成 6 位纯数字验证码，验证码有效期为 5 分钟，且同一个手机号在同一业务用途下只允许存在一个处于 pending 状态的挑战。
- **FR-003**: 系统 MUST 实施验证码申请频控规则：重发冷却时间 60 秒，单手机号每 30 分钟上限 5 次，每 24 小时上限 10 次，单 IP 每 30 分钟上限 20 次。
- **FR-004**: 系统 MUST 在申请验证码接口上实施防账号枚举保护，无论手机号是否已注册，成功受理时均返回相同的安全响应结构，不得泄露账号注册状态。
- **FR-005**: 系统 MUST 在同一原子事务内完成验证码核销、身份识别或创建、设备登记与会话创建，严禁分离为“先验证得到临时凭据，后续再完成业务”的断裂流程。
- **FR-006**: 系统 MUST 校验验证码尝试次数，单次挑战最多允许尝试 5 次；输错累加计数，达到上限后挑战状态自动转为 `locked` 并拒绝后续任何尝试。
- **FR-007**: 针对未注册手机号，系统 MUST 在初次认证时要求提供固定的语言学习方向，且仅允许 `lo -> zh`（老挝语母语学中文）或 `zh -> lo`（中文母语学老挝语）两种双向对之一；创建用户实体时必须同步初始化基础资料（`basic_profiles`）与学习档案（`learning_profiles`）。
- **FR-008**: 系统 MUST 保证学习方向一旦在注册时确定，在后续登录与常规业务中终身不可修改；已有用户在登录请求中若提供冲突的学习方向，系统必须返回不可变冲突错误并拒绝。
- **FR-009**: 系统 MUST 支持接收 Facebook 认证凭据并在服务端适配器中验证，通过解析稳定的提供商主体标识（`provider_subject`）完成老用户登录或新用户注册，且严禁直接信任客户端上报的主体标识。
- **FR-010**: 系统 MUST 支持在登录过程中可选绑定设备信息（`installation_id` UUID、平台 `android`/`ios`、设备名、App 版本与推送凭证），并维护设备的首次与最后活跃时间。
- **FR-011**: 系统 MUST 签发有效期为 15 分钟的无状态 Access Token（包含公开用户 UUID），以及存活期为 30 天滑动窗口的可撤销 Refresh Token。
- **FR-012**: 系统 MUST 在每次使用 Refresh Token 刷新时执行强制凭证轮换（Rotation），签发新 Refresh Token 并使旧 Token 立即失效，同时将会话过期时间向后顺延 30 天。
- **FR-013**: 系统 MUST 仅在数据库中持久化验证码与 Refresh Token 的安全单向散列值（Hash），严禁在数据库、持久化存储、系统日志或 Outbox 事件中明文记录 Raw 验证码与 Raw Refresh Token。
- **FR-014**: 系统 MUST 支持单会话退出操作，根据传入的当前刷新凭证将对应会话标记为 `revoked`，记录撤销时间与原因 `user_logout`，该接口必须保持幂等与安全重试友好。
- **FR-015**: 系统 MUST 支持已认证用户一键登出所有设备操作，在原子事务中将该用户下所有 `active` 状态的会话置为 `revoked`，强制失效全端刷新凭据。
- **FR-016**: 系统 MUST 在用户认证与会话刷新的所有路径中校验用户账户状态：仅允许 `active` 账户正常登录与续签；当状态为 `disabled` 或 `closed` 时必须坚决拒绝并返回对应的明确拒绝错误。
- **FR-017**: 系统 MUST 在新用户成功注册时，同事务通过系统 Outbox 可靠写入 `identity.user_registered.v1` 领域事件，供下游学习、分析与消息系统消费。

---

### Key Entities

- **User**: 平台核心用户主体，只维护全局公开标识符（`public_id` UUID）、内部主键与账户生命周期状态（`active`, `disabled`, `closed`）。
- **AuthIdentity**: 用户的外部登录认证身份，记录提供商类型（`phone` 或 `facebook`）、标准化主体标识（如 E.164 手机号或 Facebook Subject）、绑定时间与最后登录时间，与 User 为多对一关系。
- **OtpChallenge**: 手机短信验证码挑战记录，包含关联手机号、业务用途（`login`, `bind_phone`, `change_phone`）、验证码哈希（禁止明文）、状态、已尝试次数、最大尝试次数及到期时间。
- **Device**: 客户端安装与物理设备映射，由客户端生成的不可变 `installation_id` UUID 作为唯一标识，记录运行平台、系统版本、推送令牌及活跃时间戳。
- **Session**: 服务端可撤销的会话实例，维护关联用户、关联设备、Refresh Token 单向哈希、会话到期时间（默认 30 天滑动）、状态及撤销原因。
- **LearningProfile**: 用户固定语言学习方向档案，与 User 一对一，强约束记录用户的母语与目标学习语言。
- **BasicProfile**: 用户的基本公开资料实体，包含显示昵称、性别、生日、地区与头像媒体标识等信息。

---

## State Machines *(required for lifecycle/async/money/permission/publish/irreversible semantics)*

### State Machine: OtpChallenge

- **States**: `pending`, `verified`, `expired`, `cancelled`, `locked`
- **Initial**: `pending`
- **Terminal**: `verified`, `expired`, `cancelled`, `locked`
- **Owning FR**: FR-002, FR-005, FR-006
- **Transitions**:

| From | To | Guard | Event |
| --- | --- | --- | --- |
| `pending` | `verified` | 验证码匹配成功 AND 未过期 AND 尝试次数未超限 | 认证事务中成功核销 |
| `pending` | `locked` | 尝试次数累加达到最大限制（5次） | 连续多次输错验证码 |
| `pending` | `cancelled` | 冷却期后申请新验证码 OR 短信通道发送失败 | 发起同手机号新挑战或发送补偿 |
| `pending` | `expired` | 当前时间已超过到期时间（创建+5分钟） | 挑战自然过期 |

---

### State Machine: Session

- **States**: `active`, `revoked`, `expired`
- **Initial**: `active`
- **Terminal**: `revoked`, `expired`
- **Owning FR**: FR-011, FR-012, FR-014, FR-015, FR-016
- **Transitions**:

| From | To | Guard | Event |
| --- | --- | --- | --- |
| `active` | `active` | 提交正确的旧 Refresh Token 且会话未过期未撤销且账户状态正常 | 成功执行刷新与轮换操作（更新 Token Hash 并延长过期时间 30 天） |
| `active` | `revoked` | 用户主动退出当前会话 OR 一键退出所有会话 OR 账户被停用/关闭 | 触发 Logout、LogoutAll 或账户状态变更 |
| `active` | `expired` | 当前时间已超过会话 `expires_at` 且未在有效期内获得续签 | 会话自然过期 |

---

## Contract References *(required when the spec depends on existing code/schema/API/contract)*

### Contract: Database Frozen Core Schema
- **Path**: `database/migrations/0100_identity.sql`
- **Kind**: migration
- **Symbol**: `identity.users`, `identity.auth_identities`, `identity.basic_profiles`, `identity.learning_profiles`
- **Notes**: 规定了用户公钥 UUID、账户状态约束（`active`, `disabled`, `closed`）、身份唯一性索引 `(provider, provider_subject)`、以及学习方向语言对 CHECK 约束。

### Contract: Database Frozen Runtime Auth Schema
- **Path**: `database/migrations/1220_identity_auth_runtime.sql`
- **Kind**: migration
- **Symbol**: `identity.otp_challenges`, `identity.devices`, `identity.sessions`
- **Notes**: 物理数据库事实。约束验证码状态迁移强一致性、`attempt_count <= max_attempts`、Refresh Token Hash 唯一约束、会话撤销状态与原因非空约束。

### Contract: Identity Canonical Flows & Domain Model
- **Path**: `docs/docs/developer/reference/domains/identity/flows.md` & `docs/docs/developer/reference/domains/identity/model.md`
- **Kind**: markdown
- **Symbol**: 认证流程与业务模型
- **Notes**: 冻结了游客无本地服务单、手机号 E.164、学习方向终身固定、Access Token 15 分钟 + Refresh Token 30 天滑动、强制 Rotation 等核心领域事实。

### Contract: Identity Use Cases Behavioral Contract
- **Path**: `docs/docs/developer/reference/contracts/identity/IDENTITY_USE_CASES.md`
- **Kind**: markdown
- **Symbol**: `UC-ID-001` (RequestPhoneOtp), `UC-ID-002` (AuthenticateWithPhoneOtp), `UC-ID-003` (AuthenticateWithFacebook), `UC-ID-004` (RefreshSession), `UC-ID-005` (LogoutCurrentSession), `UC-ID-006` (LogoutAllSessions)
- **Notes**: 规定了事务边界、并发控制锁机制、防枚举要求、Outbox 写入时机以及测试场景要求。

### Contract: Identity HTTP API Specification
- **Path**: `docs/docs/developer/reference/contracts/identity/IDENTITY_API.md`
- **Kind**: markdown
- **Symbol**: `POST /api/v1/identity/phone-otp`, `POST /api/v1/identity/auth/phone`, `POST /api/v1/identity/auth/facebook`, `POST /api/v1/identity/sessions/refresh`, `POST /api/v1/identity/sessions/logout`, `POST /api/v1/identity/sessions/logout-all`
- **Notes**: 规定了统一 Base Prefix、请求与响应体格式、错误码映射规范、防枚举响应及 HTTP 状态码标准。

### Contract: Mobile Screen Pages Contract
- **Path**: `docs/docs/developer/reference/mobile/login.md` & `docs/docs/developer/reference/mobile/otp.md`
- **Kind**: markdown
- **Symbol**: `mobile-login` (/login), `mobile-otp` (/otp)
- **Notes**: 移动端用户交互路径规范，包含从手机号登录页提交凭据到 OTP 验证页输入 6 位数字码的导航流程。

---

## Traceability

| Requirement | Use Case | Contract | Acceptance Scenario | State Machine |
| --- | --- | --- | --- | --- |
| FR-001 | UC-ID-001 | IDENTITY_API §11, 0100_identity.sql | US-001 AS-01 | — |
| FR-002 | UC-ID-001 | IDENTITY_USE_CASES §4, 1220_identity_auth_runtime.sql | US-001 AS-01 | OtpChallenge |
| FR-003 | UC-ID-001 | IDENTITY_USE_CASES §4, IDENTITY_API §11 | US-001 AS-01 | OtpChallenge |
| FR-004 | UC-ID-001 | IDENTITY_USE_CASES §7, IDENTITY_API §11 | US-001 AS-01 | — |
| FR-005 | UC-ID-002 | IDENTITY_USE_CASES §6, §9, 1220_identity_auth_runtime.sql | US-001 AS-02, AS-03 | OtpChallenge, Session |
| FR-006 | UC-ID-002 | IDENTITY_USE_CASES §6, 1220_identity_auth_runtime.sql | US-001 AS-04 | OtpChallenge |
| FR-007 | UC-ID-002 | 0100_identity.sql, flows.md | US-001 AS-03 | — |
| FR-008 | UC-ID-002 | model.md, IDENTITY_API §12 | US-001 AS-03 | — |
| FR-009 | UC-ID-003 | flows.md, IDENTITY_API §13, 0100_identity.sql | US-004 AS-01, AS-02, AS-03 | Session |
| FR-010 | UC-ID-002, UC-ID-003 | 1220_identity_auth_runtime.sql, IDENTITY_API §12 | US-001 AS-02, AS-03 | — |
| FR-011 | UC-ID-004 | flows.md, IDENTITY_USE_CASES §11, IDENTITY_API §12 | US-002 AS-01 | Session |
| FR-012 | UC-ID-004 | flows.md, IDENTITY_USE_CASES §11, 1220_identity_auth_runtime.sql | US-002 AS-01, AS-02 | Session |
| FR-013 | UC-ID-001, UC-ID-004 | 1220_identity_auth_runtime.sql, IDENTITY_USE_CASES §2 | US-001 AS-01, US-02 AS-01 | — |
| FR-014 | UC-ID-005 | IDENTITY_USE_CASES §12, IDENTITY_API §15 | US-003 AS-01 | Session |
| FR-015 | UC-ID-006 | IDENTITY_USE_CASES §13, IDENTITY_API §16 | US-003 AS-02 | Session |
| FR-016 | UC-ID-002, UC-ID-004 | 0100_identity.sql, IDENTITY_USE_CASES §2 | US-002 AS-03 | Session |
| FR-017 | UC-ID-002, UC-ID-003 | IDENTITY_USE_CASES §9, §10 | US-001 AS-03 | — |

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 正常网络环境下，用户完成手机号输入、获取验证码到成功建立登录态并进入主界面的全流程耗时中位数低于 30 秒。
- **SC-002**: 验证码防刷与频控准确率达到 100%，在 60 秒冷却期内的重复请求拦截率达到 100%，且单手机号在限制窗口内超额请求拒绝率达到 100%。
- **SC-003**: 验证码暴力破解防护率达到 100%，单验证码累计连续 5 次输错后挑战 100% 自动锁定并失效。
- **SC-004**: 会话安全轮换机制达到 100% 覆盖，所有通过刷新凭据获取新访问令牌的请求必须实现刷新凭据的单次使用强制轮换，旧刷新凭证重放攻击拦截率达到 100%。
- **SC-005**: 会话主动撤销（单设备退出与全端登出）生效达成率 100%，撤销后使用旧刷新凭证继续访问的拦截率为 100%。
- **SC-006**: 公共验证码申请接口防账号枚举保护率达到 100%，对任意已注册与未注册手机号的响应结构和耗时分布无法推断出手机号在平台的存在性。
- **SC-007**: 敏感认证凭据零泄漏，所有日志系统、数据库持久化列与事件总线中 Raw 验证码与 Raw Refresh Token 泄漏率为 0%。

---

## Assumptions

- **网络连接**: 假定用户处于具备基础移动数据或 Wi-Fi 访问的网络环境中，短时网络故障支持在客户端提示并重试。
- **短信网关服务能力**: 假定外部短信网关（SMS Provider）在目标运营区域（老挝与中国及东南亚主要地区）具备符合 SLA 的发送可达率；当网关发生全局不可用时，系统向用户返回统一的友好服务降级提示。
- **Facebook 基础设施**: 假定 Facebook OAuth2 平台在国际网络环境下可用，在未配置真实凭据的环境下使用 Mock/Fake Adapter 进行自动化验收测试。
- **客户端存储支持**: 假定移动客户端运行环境（Android / iOS）具备安全的本地持久化存储机制，用于隔离和安全保管 Refresh Token。
- **学习方向业务不变性**: 假定本版本不提供任何形式的学习方向重置与修改入口，该限制完全遵从既定项目宪法与领域事实。
