---
status: frozen
last_updated: 2026-08-30
revision: "2026-08-30 设计运营域会话定稿：5 张表字段级定稿 + 全域审计最终确认版"
schema: operations
source_conversation_id: 6a9351a6-17b8-83ea-b172-5f58121a431f
source_share_url: https://chatgpt.com/share/6a9351a6-17b8-83ea-b172-5f58121a431f
---

# Operations 数据库总览

`operations` Schema 第一阶段共 **5 张表**（29 个字段），数据库层设计定稿 `frozen`：

```text
operations
├── operators            （6 字段，状态机：active/disabled）
├── roles                （7 字段，状态机：active/disabled）
├── operator_roles       （3 字段，无状态）
├── role_permissions     （3 字段，无状态）
└── operator_audit_logs  （10 字段，append-only，无状态）
```

## ID 与跨域引用约定（本会话确认）

- **Operator / Role / Audit Log 的 `id` 用 `varchar(20)`**：应用层统一 ID 生成机制产生稳定系统 ID（如 `op_xxx` / `role_xxx` / `log_xxx`），**不重新切成 `bigint identity`**。后台主体属于稳定的“系统主体”，后续其他域保存 `reviewed_by_operator_id` / `created_by_operator_id` 等审计引用时都使用该稳定 ID。
- **域内关系建真实 FK**：`operator_roles` → `operators`/`roles`，`role_permissions` → `roles`，`operator_audit_logs` → `operators`，全部 `ON DELETE RESTRICT`。
- **跨域只做 logical reference，不建物理 FK**：
  - `operators.auth_subject_id` → Identity/Auth 域认证主体的稳定逻辑 ID（`sys_xxx`），`UNIQUE`，**无 FK**。
  - `operator_audit_logs.target_domain + target_type + target_id` → 其他业务域实体的 stable logical ID（polymorphic logical reference），**无 FK**。
- **明确禁止**：跨域 `REFERENCES identity.*`、根据 `target_domain` 动态验证外域 FK 的 Trigger、把 Operations 变成业务域聚合层。

---

## 1. `operations.operators`

### 职责

运营主体在 Operations 域中的“身份档案”，**不是认证账户表**。只负责：标识后台主体、关联认证主体（`auth_subject_id`）、后台展示名称、Operations 层面的启用/禁用状态、作为 `operator_roles` 与 `operator_audit_logs` 的主体。

不负责：密码、登录 Session、MFA、登录失败次数、账号锁定、权限列表、`role_id`、最后登录时间、业务处罚、业务审核。

### 字段

| 字段 | 类型 | Null | 默认值 | 说明 |
| --- | --- | ---: | --- | --- |
| `id` | `varchar(20)` | NO | — | Operator 稳定 ID（应用层生成） |
| `auth_subject_id` | `varchar(20)` | NO | — | Identity/Auth 认证主体稳定逻辑引用，`UNIQUE`，无跨域 FK |
| `display_name` | `varchar(100)` | NO | — | 后台展示名称（非登录账号，不 UNIQUE） |
| `status` | `varchar(20)` | NO | `'active'` | `active` / `disabled` |
| `created_at` | `timestamptz` | NO | `now()` | 创建时间 |
| `updated_at` | `timestamptz` | NO | `now()` | 最后更新时间 |

### 约束

- `PK(id)`
- `UNIQUE(auth_subject_id)`：一个 Auth 主体最多对应一个 Operator（`1 auth subject → 0..1 operator`）。
- `CHECK`：
  - `btrim(auth_subject_id) <> ''`
  - `btrim(display_name) <> ''`
  - `status IN ('active','disabled')`
- **额外 INDEX：0**（Operator 数量极小，PK 与 UNIQUE 自带索引已足够；`status`/`created_at`/`display_name` 不建索引是有意设计）。

### 状态枚举

| 值 | 语义 |
| --- | --- |
| `active` | 当前可以承担 Operations 权限；执行后台操作需同时满足「Auth 可认证 + `status=active` + 拥有所需 Role/Permission」 |
| `disabled` | Operations 明确禁止该 Operator 再承担后台运营职责（离职、权限回收、停用）；历史保留 |

不增加 `suspended` / `locked`（属 Auth）/ `pending` / `invited` / `deleted`。

### 删除策略

**不软删除、不硬删除，只允许 `disabled`。** Operator 是审计主体，一旦产生后台操作历史就不能真正“消失”；`disabled + deleted_at` 双生命周期来源会产生无意义组合。

### 最终 DDL

```sql
CREATE TABLE operations.operators (
    id              varchar(20)  NOT NULL,
    auth_subject_id varchar(20)  NOT NULL,
    display_name    varchar(100) NOT NULL,
    status          varchar(20)  NOT NULL DEFAULT 'active',
    created_at      timestamptz  NOT NULL DEFAULT now(),
    updated_at      timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT pk_operators
        PRIMARY KEY (id),

    CONSTRAINT uq_operators_auth_subject_id
        UNIQUE (auth_subject_id),

    CONSTRAINT ck_operators_auth_subject_id_not_blank
        CHECK (btrim(auth_subject_id) <> ''),

    CONSTRAINT ck_operators_display_name_not_blank
        CHECK (btrim(display_name) <> ''),

    CONSTRAINT ck_operators_status
        CHECK (status IN ('active', 'disabled'))
);
```

### 已删除的候选字段（字段审计）

`username`/`email`/`phone`/`password_hash`（认证归 Auth）、`role_id`（多角色由 `operator_roles` 管）、`permissions`/`is_admin`（权限不能退化成布尔/JSONB）、`is_active`（与 status 重复）、`last_login_at`/`last_active_at`/`disabled_at`/`disabled_by`/`created_by`/`remark`/`metadata`/`deleted_at` 全部不建。**6 个字段是最终版。**

### 不可违反规则（`operators`）

1. 一个 Auth 后台主体最多对应一个 Operator。
2. Operator 不存储任何认证凭据。
3. Operator 不直接拥有权限字段，权限必须经过 Role。
4. Operator 不存 `role_id`，支持多角色。
5. 只有 `status = 'active'` 的 Operator 才可以获得 Operations 授权。
6. `disabled` Operator 的历史角色和审计历史不得因此删除。
7. Operator 不允许物理删除，也不采用 soft delete。
8. 其他 Domain 可以保存 Operator ID 作为审计逻辑引用，但不得建立跨 Domain FK。

---

## 2. `operations.roles`

### 职责

后台 RBAC 角色（如 `super_admin` / `trust_reviewer` / `customer_support` / `finance_operator` / `content_operator`），是**一组权限的稳定集合**；不是职位、部门或员工组织架构。

### 字段

| 字段 | 类型 | Null | 默认值 | 说明 |
| --- | --- | ---: | --- | --- |
| `id` | `varchar(20)` | NO | — | Role ID |
| `code` | `varchar(50)` | NO | — | 稳定机器标识，`UNIQUE`，创建后不可修改 |
| `name` | `varchar(100)` | NO | — | 后台展示名称（可修改，不 UNIQUE） |
| `description` | `varchar(500)` | YES | — | 角色说明 |
| `status` | `varchar(20)` | NO | `'active'` | `active` / `disabled` |
| `created_at` | `timestamptz` | NO | `now()` | 创建时间 |
| `updated_at` | `timestamptz` | NO | `now()` | 更新时间 |

### 约束

- `PK(id)`
- `UNIQUE(code)`；`code` 必须 `lower_snake_case`（`^[a-z][a-z0-9_]*$`），**创建后不可修改**——代码、配置、审计日志都稳定引用 Role `code`，展示名称变化只改 `name`。
- `CHECK`：
  - `code ~ '^[a-z][a-z0-9_]*$'`
  - `btrim(name) <> ''`
  - `description IS NULL OR btrim(description) <> ''`
  - `status IN ('active','disabled')`
- **额外 INDEX：0**。

### 状态枚举

| 值 | 语义 |
| --- | --- |
| `active` | 参与权限计算 |
| `disabled` | 整个角色立即失效，但角色及其关系继续保留 |

不需要 `draft` / `deleted` / `archived` / `system`；**不建 `is_system` / `is_builtin` / `editable`**（“哪些是系统预置角色、是否允许修改”属应用层管理策略，不做成领域状态）；**不做 Role hierarchy**（`parent_role_id` / `priority` / `level` 均不建），角色之间保持扁平。

### 删除策略

**不物理删除、不 soft delete，只用 `status = disabled`。** disabled Role 不产生任何有效权限，历史关系和 Audit 仍可追踪。

### 最终 DDL

```sql
CREATE TABLE operations.roles (
    id          varchar(20)  NOT NULL,
    code        varchar(50)  NOT NULL,
    name        varchar(100) NOT NULL,
    description varchar(500),
    status      varchar(20)  NOT NULL DEFAULT 'active',
    created_at  timestamptz  NOT NULL DEFAULT now(),
    updated_at  timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT pk_roles
        PRIMARY KEY (id),

    CONSTRAINT uq_roles_code
        UNIQUE (code),

    CONSTRAINT ck_roles_code
        CHECK (code ~ '^[a-z][a-z0-9_]*$'),

    CONSTRAINT ck_roles_name_not_blank
        CHECK (btrim(name) <> ''),

    CONSTRAINT ck_roles_description_not_blank
        CHECK (description IS NULL OR btrim(description) <> ''),

    CONSTRAINT ck_roles_status
        CHECK (status IN ('active', 'disabled'))
);
```

### 不可违反规则（`roles`）

1. `code` 创建后不可修改。
2. Role 不物理删除。
3. Role 不 soft delete。
4. 停用使用 `status = disabled`。
5. Disabled Role 不再产生任何有效权限。
6. Role 自己不保存 permissions JSON。
7. Role 与 Operator 不直接保存对方 ID。

---

## 3. `operations.operator_roles`

### 职责

Operator ↔ Role 的标准多对多关系表。

### 字段

| 字段 | 类型 | Null | 默认值 |
| --- | --- | ---: | --- |
| `operator_id` | `varchar(20)` | NO | — |
| `role_id` | `varchar(20)` | NO | — |
| `created_at` | `timestamptz` | NO | `now()` |

**不需要单独 `id`**；不建 `status`（授权存在 = 有记录，撤销 = 删除记录，历史进审计）；不建 `assigned_at`（与 `created_at` 重复）；不建 `assigned_by_operator_id`（授权动作应记录在 `operator_audit_logs`）。

### 约束

- `PK(operator_id, role_id)`（同时保证一个 Operator 不能重复拥有同一个 Role，不再加 UNIQUE）。
- 域内真实 FK，`ON DELETE RESTRICT`：
  - `operator_id → operations.operators.id`
  - `role_id → operations.roles.id`
- 额外 INDEX：`(role_id, operator_id)` 反向索引（PK 已覆盖 `WHERE operator_id = ?`；此索引支持 `WHERE role_id = ?`）。

### 重要应用层规则（数据库无法表达）

只允许 `active Operator + active Role` 建立有效授权；CHECK 无法安全读取另外两张表状态，**由 Operations Application Service 强制执行**。真正计算权限时还必须再次检查 `operator.status = active AND role.status = active`，不能因为关系表中存在记录就直接授权。

### 删除策略

授权关系解绑 = `DELETE` 关系记录（INSERT = 绑定，DELETE = 解绑）；历史事实由 `operator_audit_logs` 记录。不需要 `status` / `disabled_at` / `revoked_at` / `deleted_at`。

### 最终 DDL

```sql
CREATE TABLE operations.operator_roles (
    operator_id varchar(20) NOT NULL,
    role_id     varchar(20) NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT pk_operator_roles
        PRIMARY KEY (operator_id, role_id),

    CONSTRAINT fk_operator_roles_operator
        FOREIGN KEY (operator_id)
        REFERENCES operations.operators(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_operator_roles_role
        FOREIGN KEY (role_id)
        REFERENCES operations.roles(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_operator_roles_role
    ON operations.operator_roles (role_id, operator_id);
```

---

## 4. `operations.role_permissions`

### 职责

描述“Role 当前拥有哪些由代码注册的 Permission”。**没有 `operations.permissions` 表**——权限能力由应用代码 Permission Registry 定义，数据库只配置 Role ↔ permission key 关系。

### 字段

| 字段 | 类型 | Null | 默认值 |
| --- | --- | ---: | --- |
| `role_id` | `varchar(20)` | NO | — |
| `permission_key` | `varchar(100)` | NO | — |
| `created_at` | `timestamptz` | NO | `now()` |

### Permission Key 命名（正式统一）

```text
<domain>.<resource>.<action>
```

全部 `lower_snake_case`；例如 `trust.cases.read`、`trust.cases.resolve`、`trust.enforcements.create`、`commerce.orders.read`、`commerce.refunds.create`、`rewards.grants.read`、`rewards.grants.create`、`social.profiles.read`、`social.profiles.moderate`、`operations.operator_roles.assign`、`operations.role_permissions.grant`。不使用 `TRUST_REPORT_READ` / `trust:reports:read` / `Trust.Report.Read`。

### 约束

- `PK(role_id, permission_key)`（自然保证一个 Role 不能重复拥有同一个 Permission）。
- 仅域内 FK：`role_id → operations.roles.id`（`ON DELETE RESTRICT`）；不存在 `permission_key → permissions`（没有该表）。
- `CHECK(permission_key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$')`：至少三段 `<domain>.<resource>.<action>`。
- 额外 INDEX：无（`WHERE role_id IN (...)` 已被 PK 覆盖；未来若频繁“哪些 Role 拥有 permission X”再考虑 `(permission_key, role_id)`）。

### 更重要的应用层检查

数据库只能验证“长得像 Permission”，无法知道 `trust.reports.destroy_the_world` 是否是代码真实支持的能力。写入时必须：

```text
permission_key ∈ Application Permission Registry
```

### 权限计算规则

```text
EffectivePermissions(operator)
= 所有 active Role 的 Permission 并集
```

必须满足 `operator.status = active`（经 `operator_roles`）→ `role.status = active` → `role_permissions` → `permission_key`。**无 deny permission / 权限优先级 / 角色优先级 / 角色继承 / 用户直接权限。**

### 删除策略

Role 撤销一个权限 = `DELETE` 关系记录；重要后台管理操作（`operations.role_permissions.grant/revoke`）另写 Audit Log。

### 最终 DDL

```sql
CREATE TABLE operations.role_permissions (
    role_id        varchar(20)  NOT NULL,
    permission_key varchar(100) NOT NULL,
    created_at     timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT pk_role_permissions
        PRIMARY KEY (role_id, permission_key),

    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id)
        REFERENCES operations.roles(id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_role_permissions_permission_key
        CHECK (permission_key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$')
);
```

---

## 5. `operations.operator_audit_logs`

### 职责

**后台 Operator 对系统执行了什么具有运营意义的操作**。它不是应用日志、错误日志、HTTP access log、登录日志、安全事件日志或数据库变更日志。

### 字段

| 字段 | 类型 | Null | 默认值 | 说明 |
| --- | --- | ---: | --- | --- |
| `id` | `varchar(20)` | NO | — | Audit Log ID |
| `operator_id` | `varchar(20)` | NO | — | 操作者（域内 FK） |
| `action_key` | `varchar(100)` | NO | — | 操作（`<domain>.<resource>.<action>`） |
| `target_domain` | `varchar(50)` | YES | — | 目标所属 Domain |
| `target_type` | `varchar(50)` | YES | — | 目标类型 |
| `target_id` | `varchar(20)` | YES | — | 目标业务实体 stable logical ID |
| `request_id` | `varchar(64)` | YES | — | 请求链路 ID（非 UNIQUE，一个请求可产生多个审计动作） |
| `ip_address` | `inet` | YES | — | 操作者来源 IP（用 PostgreSQL 原生 `inet`，不用 `varchar(45)`） |
| `details` | `jsonb` | NO | `{}` | 必要的操作上下文快照 |
| `created_at` | `timestamptz` | NO | `now()` | 操作发生时间 |

### `action_key`

继续统一 `<domain>.<resource>.<action>`，如 `operations.operator_roles.assign` / `operations.operator_roles.revoke` / `operations.role_permissions.grant` / `operations.role_permissions.revoke` / `trust.cases.resolve` / `trust.enforcements.create` / `commerce.refunds.create`。Audit action 与 Permission key 可以自然对应，但**不要求一一等同**，也不把两个概念强行做 FK。

### `target_domain / target_type / target_id`

全部是**弱逻辑引用（polymorphic logical reference）**，指向其他业务域实体的 stable logical ID（`trust/case/xxx`、`commerce/refund/rf_xxx` 等）。**绝不建立跨域 FK，也禁止根据 `target_domain` 设计触发器动态验证外域 FK。**

合法组合只有三种（`target_id` 可以为空，如集合/导出类操作）：

```text
NULL            / NULL           / NULL
commerce        / order          / NULL
commerce        / refund         / rf_xxx
```

不允许 `NULL/refund/rf_xxx` 或 `commerce/NULL/rf_xxx`。

### `details jsonb`

少数明确合理使用 JSONB 的地方（小型上下文快照、无法稳定建模的附属信息，如 `{"role_id": "role_xxx"}`、`{"reason_code": "manual_review"}`）。**禁止放**：password、token、authorization header、完整用户资料/订单/聊天消息、银行卡信息、支付凭据、大对象快照；也不得把已有结构化字段（`targetDomain`/`targetId`/`action`）再复制进去。

### 为什么没有 `status / result`

`operator_audit_logs` 只记录**已被系统接受并执行的运营动作**。权限拒绝、认证失败、系统异常分别进入安全日志 / 应用日志 / Observability，不建 `success/failed/pending`，否则会退化成通用日志系统。

### 约束

- `PK(id)`
- 域内 FK：`operator_id → operations.operators.id`（`ON DELETE RESTRICT`）
- `CHECK`：
  - `action_key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$'`
  - `target_domain` 非空则 `~ '^[a-z][a-z0-9_]*$'`
  - `target_type` 非空则 `~ '^[a-z][a-z0-9_]*$'`
  - `target_reference`：全空 或（domain 非空 AND type 非空）
  - `target_id` 非空则 `btrim(target_id) <> ''`
  - `request_id` 非空则 `btrim(request_id) <> ''`
  - `jsonb_typeof(details) = 'object'`

### INDEX（5 张表中唯一需要认真设计索引的表，共 4 条）

```sql
-- 全局时间线：最近后台操作
(created_at DESC)

-- 某 Operator 的历史
(operator_id, created_at DESC)

-- 某业务对象的历史（partial）
(target_domain, target_type, target_id, created_at DESC) WHERE target_domain IS NOT NULL

-- request tracing（partial）
(request_id) WHERE request_id IS NOT NULL
```

### Append-only（正式锁死）

生命周期只有 `INSERT`；禁止业务代码 `UPDATE operator_audit_logs` / `DELETE operator_audit_logs`。后续动作撤销先前动作时**新增第二条审计日志**（如 `assign` 后写 `revoke`），绝不修改第一条。当前**不建数据库 Trigger** 强制（增加迁移与运维复杂度），由 Application Service + 数据库用户权限控制；未来进入更严格审计要求再考虑 trigger / audit extension。

### 最终 DDL

```sql
CREATE TABLE operations.operator_audit_logs (
    id            varchar(20)  NOT NULL,
    operator_id   varchar(20)  NOT NULL,
    action_key    varchar(100) NOT NULL,

    target_domain varchar(50),
    target_type   varchar(50),
    target_id     varchar(20),

    request_id    varchar(64),
    ip_address    inet,

    details       jsonb        NOT NULL DEFAULT '{}'::jsonb,

    created_at    timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT pk_operator_audit_logs
        PRIMARY KEY (id),

    CONSTRAINT fk_operator_audit_logs_operator
        FOREIGN KEY (operator_id)
        REFERENCES operations.operators(id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_operator_audit_logs_action_key
        CHECK (action_key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$'),

    CONSTRAINT ck_operator_audit_logs_target_domain
        CHECK (target_domain IS NULL OR target_domain ~ '^[a-z][a-z0-9_]*$'),

    CONSTRAINT ck_operator_audit_logs_target_type
        CHECK (target_type IS NULL OR target_type ~ '^[a-z][a-z0-9_]*$'),

    CONSTRAINT ck_operator_audit_logs_target_reference
        CHECK (
            (
                target_domain IS NULL
                AND target_type IS NULL
                AND target_id IS NULL
            )
            OR
            (
                target_domain IS NOT NULL
                AND target_type IS NOT NULL
            )
        ),

    CONSTRAINT ck_operator_audit_logs_target_id_not_blank
        CHECK (target_id IS NULL OR btrim(target_id) <> ''),

    CONSTRAINT ck_operator_audit_logs_request_id_not_blank
        CHECK (request_id IS NULL OR btrim(request_id) <> ''),

    CONSTRAINT ck_operator_audit_logs_details_object
        CHECK (jsonb_typeof(details) = 'object')
);

CREATE INDEX idx_operator_audit_logs_created_at
    ON operations.operator_audit_logs (created_at DESC);

CREATE INDEX idx_operator_audit_logs_operator_created_at
    ON operations.operator_audit_logs (operator_id, created_at DESC);

CREATE INDEX idx_operator_audit_logs_target
    ON operations.operator_audit_logs (
        target_domain,
        target_type,
        target_id,
        created_at DESC
    )
    WHERE target_domain IS NOT NULL;

CREATE INDEX idx_operator_audit_logs_request_id
    ON operations.operator_audit_logs (request_id)
    WHERE request_id IS NOT NULL;
```

---

## 明确不建的表（V1）

`permissions`（权限由代码 Registry 定义）、`operator_permissions`（禁止 Operator 直接权限）、`operator_sessions`、`operator_login_logs`、`operator_passwords`、`operator_mfa_devices`（以上为认证机制，归 Identity/Auth）、`operator_departments`、`operator_teams`（组织架构）、`operator_invitations`、`role_hierarchies`（无角色层级）、`permission_groups`、`admin_tasks`、`admin_notes`、`admin_notifications`、`admin_dashboards`、`admin_preferences`。除非未来产生明确需求，当前一律不建。

## 与全局 PostgreSQL 规范的关系

| 全局规范 | Operations 落实情况 |
| --- | --- |
| 单实例单库 + 多 Schema | 使用 `operations` Schema ✅ |
| 表名复数 snake_case | `operators`/`roles`/`operator_roles`/`role_permissions`/`operator_audit_logs` ✅ |
| 时间统一 `timestamptz` | 全部 `timestamptz`，默认 `now()` ✅ |
| 主键类型由各域自行决定 | `varchar(20)` 稳定系统 ID（后台主体属系统主体，不切 `bigint identity`）✅ 自定义 |
| 跨域 logical reference 不建物理 FK | `auth_subject_id` / `target_*` 均为 logical reference，无跨域 FK ✅ |
| 域内真实 FK | 域内 4 处 FK 全部真实 `REFERENCES`，`ON DELETE RESTRICT` ✅ |
| 状态优先 `varchar + CHECK` | `status`/`action_key`/`permission_key` 均 `varchar + CHECK` ✅ |
| JSONB 只存真正动态的数据 | `operator_audit_logs.details` 为明确合理例外（必须 object）✅ |
| 删除策略按业务决定 | operators/roles → disabled；关系表 → 解绑删除；audit → 永久保留 ✅ |

**待主会话裁决**：Operations 的稳定逻辑 ID 为 `varchar(20)`（`op_xxx`/`role_xxx`/`sys_xxx`），而全局「ID 策略」规定跨域 logical ID 统一采用 UUID；该类型差异（及与 `public_id` 前缀方案的联动）由主会话统一裁决，裁决前不影响本域逻辑模型。
