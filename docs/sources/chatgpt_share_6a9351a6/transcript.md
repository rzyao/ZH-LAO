# 设计运营域

_消息数：34　总字符：48285_


---

### [01] SYSTEM　status=finished_successfully

_(empty)_


---

### [02] SYSTEM　status=finished_successfully

_(empty)_


---

### [03] USER　status=finished_successfully

[数据库域设计](chatgpt-conversation://6a92f0c0-90b4-83ea-a43d-cccb1ef2666d)[继续设计社交资料](chatgpt-conversation://6a931551-8a30-83e9-8caf-60e529abce68)[设计聊天领域](chatgpt-conversation://6a9319c2-2204-83ea-9341-7a57757a3082)[继续设计商业领域](chatgpt-conversation://6a932385-7404-83ea-951b-e0df2fabaccc)[设计奖励域](chatgpt-conversation://6a9329c0-aea8-83ea-8f36-c7779057fc07)[设计安全治理域](chatgpt-conversation://6a932d56-5fdc-83ea-a8a8-abee14667d25)继续设计 Operations    **Domain**  。请承接之前已经确定的整体架构和数据库设计原则。  不能越过域边界


---

### [04] SYSTEM　status=finished_successfully

_(empty)_


---

### [05] SYSTEM　status=finished_successfully

_(empty)_


---

### [06] SYSTEM　status=finished_successfully

_(empty)_


---

### [07] ASSISTANT　status=finished_successfully

_(empty)_


---

### [08] ASSISTANT　status=finished_successfully

我会继续沿用前面已经定下来的领域边界、命名规范、PostgreSQL 约束策略和“域内自治、跨域只引用稳定标识”的原则来设计 **Operations Domain**。我先把前面已确定的架构约束和这个域在整体系统中的职责范围对齐，再开始逐表设计，避免把 Trust & Safety、Commerce、Rewards 或 Chat 的职责重复搬进来。


---

### [09] ASSISTANT　status=finished_successfully

The output of this plugin was redacted.


---

### [10] ASSISTANT　status=finished_successfully

_(empty)_


---

### [11] ASSISTANT　status=finished_successfully

_(empty)_


---

### [12] ASSISTANT　status=finished_successfully

目前边界可以先定得很清楚：**Operations 不承接业务域本身的状态机**。例如封禁/举报仍在 `trust`，退款仍在 `commerce`，奖励补发仍在 `rewards`；Operations 只负责“后台人员是谁、拥有什么后台权限、执行过什么后台操作”这一层。这样后台管理能力不会反过来侵入业务域。


---

### [13] ASSISTANT　status=finished_successfully

_(empty)_


---

### [14] ASSISTANT　status=finished_successfully

可以。继续按我们已经确定的 V2 原则来：**PostgreSQL 单实例单库 + 多 Schema、模块化单体、领域自治、表名复数 `snake_case`、`BIGINT identity` 主键、时间统一 `timestamptz`、能用关系字段就不用 JSONB、保留必要 FK，但不让一个域接管另一个域的业务状态机。** Operations 使用 `operations` Schema。 memcite

## 1. 先确定 Operations Domain 的职责

我建议把它定义成：

> **Operations Domain = 内部运营后台的身份、授权与操作追踪域。**

它解决三个问题：

1. **谁可以进入运营后台**
2. **这个后台人员可以做什么**
3. **这个后台人员实际做过什么**

它不是“所有后台功能的大杂烩”。

例如后台里虽然能执行“封禁用户”“退款”“补发奖励”，但真正的数据仍然分别写入：

- `trust.*` → 举报、处罚、封禁
- `commerce.*` → 订单、退款、支付
- `rewards.*` → 奖励发放
- `social.*` → 社交资料
- `messaging.*` → 聊天
- `learning.*` → 学习内容

Operations **只负责操作者和权限，以及留下操作审计记录**。

---

# 2. Operations Domain 最终建议只保留 5 张核心表

我建议当前阶段不要做成复杂企业 IAM 系统。

| 表 | 职责 |
|---|---|
| `operations.operators` | 后台运营人员 |
| `operations.roles` | 后台角色 |
| `operations.operator_roles` | 运营人员 ↔ 角色 |
| `operations.role_permissions` | 角色 ↔ 权限 key |
| `operations.operator_audit_logs` | 后台操作审计日志 |

也就是说：

```text
operations
├── operators
├── roles
├── operator_roles
├── role_permissions
└── operator_audit_logs
```

我**不建议建立 `permissions` 表**。

这是一个比较重要的决定。

---

# 3. 为什么没有 `permissions` 表

之前确定的一个重要原则是：

> **代码定义能力，数据库配置规则。**

后台权限非常适合这个原则。

例如代码中定义：

```text
trust.reports.read
trust.reports.resolve
trust.users.suspend

commerce.orders.read
commerce.refunds.create

rewards.grants.read
rewards.grants.create

social.profiles.read
social.profiles.moderate
```

这些权限代表的是：

> 系统代码实际支持哪些操作。

因此权限本身应该由代码控制，而不是运营人员随便往数据库创建：

```text
permissions
-----------
id
permission_code
...
```

否则可能出现数据库里有：

```text
commerce.payment.force_success
```

但代码压根没有这个能力。

所以采用：

```text
role_permissions
----------------
role_id
permission_key
```

例如：

```text
1 | trust.reports.read
1 | trust.reports.resolve
1 | trust.users.suspend
```

代码负责验证：

```text
permission_key ∈ 已注册权限集合
```

数据库负责：

> 哪个 Role 拥有哪些权限。

这比额外维护一张 `permissions` 表更适合当前项目。

---

# 4. 明确不能放进 Operations 的东西

这一点必须先锁死，否则 Operations 非常容易膨胀成“后台垃圾桶”。

### 不放举报、审核、处罚

这些已经属于：

```text
trust
```

哪怕人工审核是在“运营后台”完成，也仍然是 Trust Domain 数据。

Operations 只记录：

```text
operator 17
执行了
trust.report.resolve
```

---

### 不放退款、补单、支付调整

属于：

```text
commerce
```

Operations 不建立：

```text
admin_refunds
manual_orders
payment_adjustments
```

后台只是调用 Commerce Application Service。

---

### 不放奖励补发

属于：

```text
rewards
```

---

### 不放聊天管理

属于：

```text
messaging
```

---

### 不放内容本身

例如：

```text
课程
词汇
文章
Banner 对应的业务内容
动态
礼物
商品
```

都应该由拥有这些对象的业务域负责。

---

### 不放 Feature Flag / 系统参数

这一类我建议留给下一步：

```text
platform
```

因为它们描述的是：

> 系统如何运行

而 Operations 描述的是：

> 谁在操作系统。

这两个域不要混。

---

# 5. Operations 与 Trust 的边界尤其要注意

例如管理员在后台封禁用户。

正确调用链：

```text
Operator
   │
   ▼
Operations 权限检查
   │
   │ trust.users.suspend
   ▼
Trust Application Service
   │
   ▼
trust.sanctions
```

随后：

```text
Operations
   │
   ▼
operator_audit_logs
```

所以：

```text
operations.operator_audit_logs
```

可以记：

```text
action_key     = 'trust.users.suspend'
target_domain  = 'trust'
target_type    = 'sanction'
target_id      = 9182
```

但是处罚的：

```text
reason
start_at
end_at
status
appeal
```

全部属于 `trust`。

Operations **绝不能再复制一份**。

---

# 6. Operations 与业务域的依赖方向

建议固定：

```text
                     ┌──────────────┐
                     │  Operations  │
                     └───────┬──────┘
                             │
                authentication / authorization
                             │
         ┌───────────────────┼──────────────────┐
         ▼                   ▼                  ▼
      Trust              Commerce           Rewards
         │                   │                  │
         ▼                   ▼                  ▼
   自己维护状态          自己维护状态        自己维护状态
```

Operations 可以：

- 调用其他 Domain Application Service
- 引用其他域对象 ID 做审计描述

但不能：

- 直接成为其他域的状态来源
- 修改其他域表结构
- 建立“后台专用版本”的业务表
- 把其他域的数据复制进 Operations

---

# 7. 一个很重要的 FK 原则

Operations 内部关系全部应该是真 FK：

```text
operator_roles.operator_id
    → operators.id

operator_roles.role_id
    → roles.id

role_permissions.role_id
    → roles.id

operator_audit_logs.operator_id
    → operators.id
```

但是 `operator_audit_logs` 中类似：

```text
target_domain
target_type
target_id
```

**不要建立跨域 polymorphic FK。**

因为一条审计日志可能指向：

```text
trust.sanctions
commerce.refunds
rewards.grants
social.profiles
messaging.messages
```

数据库不存在合理的：

```text
target_id FK ???
```

这里保留：

```text
target_domain
target_type
target_id
```

属于少数合理的弱引用场景。

而且审计记录不应该因为目标业务记录删除而消失。

---

# 8. Operators 和 C 端用户必须分开

这一点继续保持之前的设计方向：

```text
App User ≠ Operator
```

不要做：

```text
users.is_admin = true
```

也不要：

```text
users.role = 'ADMIN'
```

C 端身份和后台运营身份生命周期完全不同。

例如未来可能：

```text
普通用户
老师
VIP
社交用户
```

这些都不意味着他是后台管理员。

反过来运营人员也没必要拥有 C 端社交资料、会员、钱包、奖励等业务身份。

所以：

```text
operations.operators
```

应该作为独立后台主体存在。 memcite

---

# 9. 当前 Operations Domain 的领域模型

最终可以理解成：

```text
Operator
   │
   ├────< OperatorRole >──── Role
   │                            │
   │                            └────< RolePermission
   │
   └────< OperatorAuditLog
```

即：

```text
operators
   │
   ├── operator_roles
   │       │
   │       └── roles
   │              │
   │              └── role_permissions
   │
   └── operator_audit_logs
```

这是一个非常小、但边界很稳定的 Domain。

---

# 10. 我建议不要继续增加这些表

当前阶段都不要：

```text
permissions
operator_sessions
operator_login_logs
operator_passwords
operator_mfa_devices
operator_departments
operator_teams
operator_invitations
role_hierarchies
permission_groups
admin_tasks
admin_notes
admin_notifications
admin_dashboards
admin_preferences
```

除非以后真的产生明确需求。

尤其是：

```text
operator_sessions
operator_passwords
operator_mfa_devices
```

属于**认证机制**，不能因为后台用户位于 Operations，就顺手把认证系统塞进 Operations。

---

## 11. 因此 Operations Domain 第一版正式范围

我们先把边界定稿为：

```text
operations.operators
operations.roles
operations.operator_roles
operations.role_permissions
operations.operator_audit_logs
```

它负责：

```text
后台运营主体
        +
RBAC 后台授权
        +
后台操作审计
```

不负责：

```text
业务审核状态
业务处罚状态
订单状态
支付状态
退款状态
奖励状态
聊天状态
社交状态
系统运行配置
Feature Flags
业务内容
```

这个划分能够让 **Operations 成为真正的 Backoffice Control Plane，而不是新的业务域聚合层**。

下一步就可以按照之前的方式，**逐张定稿这 5 张表**。我建议从第一张 **`operations.operators`** 开始，然后依次做到 FK / UNIQUE / CHECK / INDEX 和状态枚举全部定稿。 memcite


---

### [15] USER　status=finished_successfully

**逐张定稿这 5 张表**。从第一张 **`operations.operators`** 开始，然后依次做到 FK / UNIQUE / CHECK / INDEX 和状态枚举全部定稿。


---

### [16] ASSISTANT　status=finished_successfully

我会按同一套定稿格式逐张完成：**职责 → 字段 → FK → UNIQUE → CHECK → INDEX → 状态枚举 → 不可违反规则 → 是否还能删字段**。这次直接把 5 张表都推进到可落库的最终版，不中途停在“草案”。


---

### [17] ASSISTANT　status=finished_successfully

The output of this plugin was redacted.


---

### [18] ASSISTANT　status=finished_successfully

_(empty)_


---

### [19] ASSISTANT　status=finished_successfully

_(empty)_


---

### [20] ASSISTANT　status=finished_successfully

先处理第一张 `operations.operators`。这里我会纠正一个容易导致后续混乱的点：按照此前 V2 已确定的 ID 体系，后台主体属于“系统主体”一类，**不应在这里重新切成 BIGINT identity**；Operations 要继续沿用稳定的系统 ID 方案，并且不把密码、Session、MFA 等认证数据塞进这张表。


---

### [21] ASSISTANT　status=finished_successfully

_(empty)_


---

### [22] ASSISTANT　status=finished_successfully

先从第 1 张开始定稿：`operations.operators`。

这里我把它定位成 **Operations Domain 中的“运营身份档案”**，而不是认证账户表。登录凭据、密码、Session、MFA、失败锁定等认证数据不进入 Operations；`operators` 只描述“这个后台主体在 Operations 中是谁、是否允许承担运营职责”。跨 Auth Domain 只保留稳定 ID 逻辑引用，不建立跨域 FK。memcite

# 1. `operations.operators`

## 一、职责

```text
operations.operators
```

只负责：

- 标识一个后台运营主体；
- 关联其认证主体；
- 提供后台展示名称；
- 控制其 Operations 层面的启用 / 禁用状态；
- 作为 `operator_roles` 和 `operator_audit_logs` 的主体。

不负责：

```text
密码
登录 Session
MFA
登录失败次数
账号锁定
权限列表
role_id
最后登录时间
业务处罚
业务审核
```

---

# 二、最终字段

| 字段 | 类型 | Null | 默认值 | 说明 |
|---|---|---:|---|---|
| `id` | `varchar(20)` | NO | — | Operator 稳定 ID |
| `auth_subject_id` | `varchar(20)` | NO | — | Auth Domain 中后台认证主体的稳定逻辑引用 |
| `display_name` | `varchar(100)` | NO | — | 后台显示名称 |
| `status` | `varchar(20)` | NO | `'active'` | Operator 状态 |
| `created_at` | `timestamptz` | NO | `now()` | 创建时间 |
| `updated_at` | `timestamptz` | NO | `now()` | 最后更新时间 |

最终就是 **6 个字段**。

我不建议继续增加字段。

---

# 三、为什么 `id` 使用 `varchar(20)`

这里继续承接此前已经确定的 ID 体系，而不是重新引入：

```text
bigint generated ...
```

Operator 属于稳定的系统主体，因此：

```text
id varchar(20)
```

由应用层统一 ID 生成机制产生。

这样后续其他领域需要记录：

```text
reviewed_by_operator_id
approved_by_operator_id
created_by_operator_id
```

时，都可以保存稳定 Operator ID。

不过注意：

> 其他 Domain 保存 `operator_id` 时仍然只是逻辑引用，不对 `operations.operators` 建跨 Domain FK。

Operations 自己内部则可以建立真实 FK。memcite

---

# 四、`auth_subject_id`

这是这一张表里最重要的边界字段。

关系是：

```text
Auth Domain
    │
    │ auth_subject_id
    ▼
operations.operators
```

Operator **不是密码账户本身**。

Operations 只知道：

```text
operator.id = op_xxx
auth_subject_id = sys_xxx
```

至于：

```text
邮箱
密码 Hash
OAuth
Session
MFA
登录失败
认证锁定
```

全部由 Auth Domain 管理。

因此不应该在 `operators` 再建立：

```text
username
password_hash
password_salt
last_login_at
failed_login_count
mfa_enabled
```

否则 Operations 会开始侵占 Authentication Domain。

---

# 五、为什么 `auth_subject_id` 必须 UNIQUE

必须：

```sql
UNIQUE (auth_subject_id)
```

因为同一个认证主体：

```text
sys_001
```

不能同时拥有：

```text
operator_001
operator_002
operator_003
```

否则权限和审计身份都会产生歧义。

关系必须是：

```text
1 auth subject
      │
      │ 0..1
      ▼
1 operator
```

因此：

```text
auth_subject_id UNIQUE NOT NULL
```

---

# 六、`display_name`

例如：

```text
张三
内容审核员A
客服01
管理员
```

这是：

> Operations 后台用于识别 Operator 的业务展示名称。

它不是登录账号。

因此：

```sql
display_name varchar(100) NOT NULL
```

增加：

```sql
CHECK (btrim(display_name) <> '')
```

但**不要 UNIQUE**。

因为完全可能出现两名：

```text
张伟
张伟
```

Operator 的真正身份由：

```text
id
```

决定，而不是名字。

---

# 七、状态枚举最终定稿

我建议只保留两个：

```text
active
disabled
```

定义：

```sql
CHECK (
    status IN (
        'active',
        'disabled'
    )
)
```

## `active`

表示：

> Operator 当前可以承担 Operations 权限。

至于是否因为 Auth Domain 的认证问题而无法登录，是另一回事。

必须同时满足：

```text
Auth 可以认证
+
Operator.status = active
+
拥有所需 Role / Permission
```

才能执行后台操作。

---

## `disabled`

表示：

> Operations 明确禁止该 Operator 再承担后台运营职责。

例如：

```text
员工离职
外包权限回收
内部账号停用
安全事件后撤销运营权限
```

历史记录仍然保留。

---

# 八、为什么没有 `suspended`

不建议增加：

```text
suspended
locked
pending
invited
deleted
```

### `locked`

属于 Auth Domain。

例如密码失败 10 次导致：

```text
account locked
```

不是 Operations 的 Operator 状态。

---

### `invited`

只有未来真的建立：

```text
operator_invitations
```

才需要考虑。

当前没有邀请生命周期，没必要提前设计。

---

### `suspended`

对于内部后台主体：

```text
active
disabled
```

已经足够。

临时禁用可以：

```text
disabled
→ active
```

无需再增加第三种语义接近的状态。

---

# 九、不增加 `deleted_at`

这一张表我建议把它作为通用软删除规则的**明确例外**。

原因是 Operator 属于审计主体：

```text
Operator
   │
   └── operator_audit_logs
```

一旦产生后台操作历史，这个主体就不能真正“消失”。

所以 Operator 生命周期应该是：

```text
active
   │
   ▼
disabled
   │
   ▼
永久保留
```

而不是：

```text
active
→ deleted_at
```

否则会出现两个生命周期来源：

```text
status = disabled
deleted_at IS NOT NULL
```

进而产生：

```text
disabled + deleted_at NULL
active + deleted_at 非 NULL
```

之类无意义组合。

因此这张表：

> **不软删除、不硬删除，只允许 disabled。**

这对于审计型主体比机械增加 `deleted_at` 更干净。

---

# 十、FK 最终定稿

## Domain 内

`operators` 自身没有 Domain 内 FK。

未来：

```text
operator_roles.operator_id
    → operations.operators.id
```

以及：

```text
operator_audit_logs.operator_id
    → operations.operators.id
```

会反向引用它。

---

## 跨 Domain

```text
auth_subject_id
```

是逻辑引用：

```text
Auth Domain → authentication subject
```

**不建立数据库 FK。**

即不要：

```sql
FOREIGN KEY (auth_subject_id)
REFERENCES auth.xxx(id)
```

这样保持 Domain schema 独立。

---

# 十一、UNIQUE 最终定稿

只有：

```sql
UNIQUE (auth_subject_id)
```

不增加：

```text
UNIQUE(display_name)
UNIQUE(status, ...)
```

---

# 十二、CHECK 最终定稿

两个业务 CHECK。

### display_name

```sql
CHECK (btrim(display_name) <> '')
```

### status

```sql
CHECK (
    status IN ('active', 'disabled')
)
```

另外建议对逻辑引用增加最基本的数据完整性：

```sql
CHECK (btrim(auth_subject_id) <> '')
```

因此最终三个：

```text
ck_operators_auth_subject_id_not_blank
ck_operators_display_name_not_blank
ck_operators_status
```

---

# 十三、INDEX 最终定稿

实际上这张表**不需要额外普通索引**。

已有：

### PK

```text
PRIMARY KEY (id)
```

PostgreSQL 自动产生唯一 B-tree index。

### UNIQUE

```text
UNIQUE (auth_subject_id)
```

PostgreSQL 同样自动产生唯一 B-tree index。

不要为了：

```text
status
created_at
display_name
```

提前增加索引。

Operator 数量本来就非常少，通常可能是个位数、几十个，甚至未来几百个也完全没必要。

所以最终：

```text
额外 INDEX：0
```

这是有意设计，不是遗漏。

---

# 十四、最终 PostgreSQL DDL

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
        CHECK (
            status IN (
                'active',
                'disabled'
            )
        )
);
```

---

# 十五、字段删除审计

一些看起来可能有用、但最终应该删除的字段：

| 候选字段 | 结论 | 原因 |
|---|---|---|
| `username` | ❌ | 登录身份属于 Auth |
| `email` | ❌ | Auth 已拥有认证身份信息，不重复存 |
| `phone` | ❌ | Operations 当前无业务需求 |
| `password_hash` | ❌ | 严禁越过 Auth Domain |
| `role_id` | ❌ | 多角色关系由 `operator_roles` 管 |
| `permissions` | ❌ | 权限由 RBAC 表管理 |
| `is_admin` | ❌ | 权限不能退化成布尔字段 |
| `is_active` | ❌ | 与 `status` 重复 |
| `last_login_at` | ❌ | Auth 领域数据 |
| `last_active_at` | ❌ | 当前没有运营业务价值 |
| `disabled_at` | ❌ | Audit Log + status 足够 |
| `disabled_by` | ❌ | 属于审计记录 |
| `created_by` | ❌ | 初始 bootstrap 困难且 Audit Log 更合适 |
| `remark` | ❌ | 当前没有明确业务语义 |
| `metadata` | ❌ | 防止无意义 JSONB |
| `deleted_at` | ❌ | Operator 永久保留，以 `disabled` 结束生命周期 |

因此 **6 个字段就是最终版**。

---

# 十六、不可违反的领域规则

最终锁定这 8 条：

1. **一个 Auth 后台主体最多对应一个 Operator。**
2. **Operator 不存储任何认证凭据。**
3. **Operator 不直接拥有权限字段，权限必须经过 Role。**
4. **Operator 不存 `role_id`，支持多角色。**
5. **只有 `status = 'active'` 的 Operator 才可以获得 Operations 授权。**
6. **`disabled` Operator 的历史角色和审计历史不得因此删除。**
7. **Operator 不允许物理删除，也不采用 soft delete。**
8. **其他 Domain 可以保存 Operator ID 作为审计逻辑引用，但不得建立跨 Domain FK。**

所以第 1 张表正式定稿为：

```text
operations.operators
──────────────────────────────
id               varchar(20) PK
auth_subject_id  varchar(20) UNIQUE
display_name     varchar(100)
status           varchar(20)
created_at       timestamptz
updated_at       timestamptz
```

状态只有：

```text
active
disabled
```

**下一张进入 `operations.roles`。**它会决定 Role 是不是需要 `code + name + description + status`，以及“系统内置角色”和“可编辑角色”究竟应不应该通过字段区分。memcite


---

### [23] USER　status=finished_successfully

继续完成所有表的审计


---

### [24] ASSISTANT　status=finished_successfully

_(empty)_


---

### [25] ASSISTANT　status=finished_successfully

_(empty)_


---

### [26] ASSISTANT　status=finished_successfully

继续把剩下 4 张一次性定稿，并在最后做一轮 **Operations Domain 总审计**。重点会压掉重复字段、历史字段和“为了以后可能有用”而提前加的结构，只保留当前领域真正需要长期承担的约束。


---

### [27] ASSISTANT　status=finished_successfully

_(empty)_


---

### [28] ASSISTANT　status=finished_successfully

_(empty)_


---

### [29] ASSISTANT　status=finished_successfully

下面直接把剩余 4 张表定稿，并在最后把 **Operations Domain 5 张表统一审计一遍**。

---

# 2. `operations.roles`

## 职责

表示后台 RBAC 角色，例如：

```text
super_admin
trust_reviewer
customer_support
finance_operator
content_operator
```

Role 是一组权限的稳定集合。

它**不是职位、部门或员工组织架构**。

## 最终字段

| 字段 | 类型 | Null | 默认 | 说明 |
|---|---|---:|---|---|
| `id` | `varchar(20)` | NO | — | Role ID |
| `code` | `varchar(50)` | NO | — | 稳定机器标识 |
| `name` | `varchar(100)` | NO | — | 后台展示名称 |
| `description` | `varchar(500)` | YES | — | 角色说明 |
| `status` | `varchar(20)` | NO | `'active'` | 状态 |
| `created_at` | `timestamptz` | NO | `now()` | 创建时间 |
| `updated_at` | `timestamptz` | NO | `now()` | 更新时间 |

### 状态枚举

只保留：

```text
active
disabled
```

其中：

- `active`：参与权限计算；
- `disabled`：整个角色立即失效，但角色及其关系继续保留。

不需要：

```text
draft
deleted
archived
system
```

---

## `code` 的意义

`code` 是稳定机器标识：

```text
trust_reviewer
finance_operator
super_admin
```

而：

```text
name = "内容审核员"
```

可以修改。

因此：

> `code` 创建后不可修改。

这样代码、配置、审计日志都可以稳定引用 Role。

---

## 为什么不加 `is_system`

最终建议：

```text
❌ is_system
❌ is_builtin
❌ editable
```

“哪些角色是系统预置角色、是否允许修改”属于应用层管理策略。

当前没有必要把：

```text
系统角色
自定义角色
```

变成领域状态。

否则以后容易产生：

```text
is_system = true
status = disabled
editable = true
```

这种组合语义。

---

## FK

无。

---

## UNIQUE

```sql
UNIQUE (code)
```

`name` 不唯一。

---

## CHECK

```sql
CHECK (
    code ~ '^[a-z][a-z0-9_]*$'
)
```

统一要求：

```text
lower_snake_case
```

另外：

```sql
CHECK (btrim(name) <> '')
```

以及：

```sql
CHECK (
    description IS NULL
    OR btrim(description) <> ''
)
```

状态：

```sql
CHECK (
    status IN ('active', 'disabled')
)
```

---

## INDEX

不用增加普通索引。

已有：

```text
PK(id)
UNIQUE(code)
```

角色数量很小，对：

```text
status
name
created_at
```

提前建索引没有价值。

---

## 最终 DDL

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
        CHECK (
            code ~ '^[a-z][a-z0-9_]*$'
        ),

    CONSTRAINT ck_roles_name_not_blank
        CHECK (
            btrim(name) <> ''
        ),

    CONSTRAINT ck_roles_description_not_blank
        CHECK (
            description IS NULL
            OR btrim(description) <> ''
        ),

    CONSTRAINT ck_roles_status
        CHECK (
            status IN ('active', 'disabled')
        )
);
```

### 最终领域规则

1. `code` 创建后不可修改。
2. Role 不物理删除。
3. Role 不 soft delete。
4. 停用使用 `status = disabled`。
5. Disabled Role 不再产生任何有效权限。
6. Role 自己不保存 permissions JSON。
7. Role 与 Operator 不直接保存对方 ID。

---

# 3. `operations.operator_roles`

这是 Operator 与 Role 的标准多对多关系表。

关系：

```text
Operator
   │
   │ N
   ▼
operator_roles
   ▲
   │ N
Role
```

## 最终字段

只需要：

| 字段 | 类型 | Null | 默认 |
|---|---|---:|---|
| `operator_id` | `varchar(20)` | NO | — |
| `role_id` | `varchar(20)` | NO | — |
| `created_at` | `timestamptz` | NO | `now()` |

**不需要单独 `id`。**

---

## 为什么没有 `status`

不要：

```text
active
revoked
disabled
```

授权存在：

```text
operator_roles 中有记录
```

授权不存在：

```text
删除记录
```

历史则进入：

```text
operator_audit_logs
```

这是最干净的关系模型。

---

## 为什么保留 `created_at`

虽然审计日志会记录授权动作，但当前映射本身保留：

```text
这个角色从什么时候开始属于该 Operator
```

对后台展示和问题排查都有实际价值。

因此保留。

但不要再增加：

```text
assigned_at
```

因为和 `created_at` 完全重复。

---

## 为什么没有 `assigned_by_operator_id`

这是典型重复审计数据。

授权动作应记录：

```text
operator_audit_logs
```

而不是：

```text
operator_roles.assigned_by_operator_id
```

否则撤销、重新授权等历史最终还是无法靠关系表完整表达。

---

## PK / UNIQUE

直接：

```sql
PRIMARY KEY (operator_id, role_id)
```

已经同时保证：

```text
一个 Operator 不可能重复拥有同一个 Role
```

因此不再增加 UNIQUE。

---

## FK

都是 Operations Domain 内真实 FK：

```text
operator_id
→ operations.operators.id

role_id
→ operations.roles.id
```

使用：

```text
ON DELETE RESTRICT
```

虽然我们已经规定 Operator / Role 不物理删除，但数据库层仍然明确保护。

---

## INDEX

PK：

```text
(operator_id, role_id)
```

已经适合：

```sql
WHERE operator_id = ?
```

但不能很好支持：

```sql
WHERE role_id = ?
```

因此增加一个反向索引：

```sql
(role_id, operator_id)
```

仅此一个。

---

## 最终 DDL

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

## 一个数据库无法表达的重要规则

只允许：

```text
active Operator
+
active Role
```

建立有效授权。

这不能靠普通 CHECK 实现，因为 CHECK 不能安全读取另外两张表状态。

因此：

> 由 Operations Application Service 强制执行。

而真正计算权限时，还必须再次检查：

```text
operator.status = active
AND
role.status = active
```

不能因为关系表中存在记录就直接授权。

---

# 4. `operations.role_permissions`

这张表描述：

> Role 当前拥有哪些由代码注册的 Permission。

关系：

```text
Role
   │
   │ 1:N
   ▼
RolePermission
      │
      ▼
permission_key
```

注意依然：

> **没有 `operations.permissions` 表。**

---

## 最终字段

| 字段 | 类型 | Null | 默认 |
|---|---|---:|---|
| `role_id` | `varchar(20)` | NO | — |
| `permission_key` | `varchar(100)` | NO | — |
| `created_at` | `timestamptz` | NO | `now()` |

依然不需要单独 ID。

---

## Permission 命名正式统一

建议锁死：

```text
<domain>.<resource>.<action>
```

例如：

```text
trust.reports.read
trust.reports.resolve
trust.sanctions.create

commerce.orders.read
commerce.refunds.create

rewards.grants.read
rewards.grants.create

social.profiles.moderate
```

全部：

```text
lower_snake_case
```

不使用：

```text
TRUST_REPORT_READ
trust:reports:read
Trust.Report.Read
```

---

## PK

```sql
PRIMARY KEY (
    role_id,
    permission_key
)
```

自然保证：

> 一个 Role 不能重复拥有同一个 Permission。

---

## FK

只有：

```text
role_id
→ operations.roles.id
```

不存在：

```text
permission_key → permissions
```

因为根本没有 permissions 表。

---

## CHECK

至少要求合法 Permission 格式。

```sql
CHECK (
    permission_key ~
    '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$'
)
```

意味着至少：

```text
xxx.xxx.xxx
```

例如：

```text
trust.reports.read
```

合法。

---

## 更重要的应用层检查

数据库只能验证“长得像 Permission”。

数据库无法知道：

```text
trust.reports.destroy_the_world
```

是不是代码真实支持的权限。

因此写入时必须：

```text
permission_key ∈ Application Permission Registry
```

如果代码没有注册：

```text
commerce.payments.force_success
```

数据库即使格式合法，也不能允许后台配置产生实际权限。

这是应用层强约束。

---

## INDEX

不加普通索引。

因为核心访问方式：

```sql
WHERE role_id IN (...)
```

已经被：

```text
PRIMARY KEY(role_id, permission_key)
```

覆盖。

如果未来真的频繁查询：

```text
哪些 Role 拥有 permission X
```

再增加：

```text
(permission_key, role_id)
```

当前没有必要。

---

## 最终 DDL

```sql
CREATE TABLE operations.role_permissions (
    role_id        varchar(20)  NOT NULL,
    permission_key varchar(100) NOT NULL,
    created_at     timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT pk_role_permissions
        PRIMARY KEY (
            role_id,
            permission_key
        ),

    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id)
        REFERENCES operations.roles(id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_role_permissions_permission_key
        CHECK (
            permission_key ~
            '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$'
        )
);
```

---

# 5. `operations.operator_audit_logs`

这是整个 Operations Domain 最需要认真控制边界的一张表。

它不是：

```text
应用日志
错误日志
HTTP access log
登录日志
安全事件日志
数据库变更日志
```

它只记录：

> **后台 Operator 对系统执行了什么具有运营意义的操作。**

例如：

```text
张三
执行
trust.reports.resolve

李四
执行
commerce.refunds.create

管理员
执行
operations.operator_roles.assign
```

---

# 最终字段

我建议最终保留：

| 字段 | 类型 | Null | 默认 | 说明 |
|---|---|---:|---|---|
| `id` | `varchar(20)` | NO | — | Audit Log ID |
| `operator_id` | `varchar(20)` | NO | — | 操作者 |
| `action_key` | `varchar(100)` | NO | — | 操作 |
| `target_domain` | `varchar(50)` | YES | — | 目标所属 Domain |
| `target_type` | `varchar(50)` | YES | — | 目标类型 |
| `target_id` | `varchar(20)` | YES | — | 目标 ID |
| `request_id` | `varchar(64)` | YES | — | 请求链路 ID |
| `ip_address` | `inet` | YES | — | 操作者来源 IP |
| `details` | `jsonb` | NO | `{}` | 必要的操作上下文 |
| `created_at` | `timestamptz` | NO | `now()` | 操作发生时间 |

共 **10 个字段**。

这里 `jsonb` 是合理例外。

---

# `action_key`

继续统一：

```text
<domain>.<resource>.<action>
```

例如：

```text
operations.operator_roles.assign
operations.operator_roles.revoke

operations.role_permissions.grant
operations.role_permissions.revoke

trust.reports.resolve
trust.sanctions.create

commerce.refunds.create
```

这样审计语义和 Permission key 可以自然对应。

但注意：

> Audit action 不要求必须等同某一个 Permission。

例如：

```text
commerce.refunds.approve
```

可能和权限体系存在一一对应，也可能不是。

不要把两个概念强行做 FK。

---

# `target_domain / target_type / target_id`

例如退款：

```text
target_domain = 'commerce'
target_type   = 'refund'
target_id     = 'rf_xxx'
```

处罚：

```text
target_domain = 'trust'
target_type   = 'sanction'
target_id     = 'sa_xxx'
```

这些全部是：

> **弱逻辑引用。**

绝不能建立：

```text
target_id → commerce.refunds
target_id → trust.sanctions
```

这种 polymorphic FK。

---

# 为什么 `target_id` 可以为空

有些操作针对的是集合或系统能力，例如：

```text
commerce.orders.export
```

这时可以：

```text
target_domain = commerce
target_type   = order
target_id     = NULL
```

因此不要强制三者全部非空。

但是有一个规则：

```text
如果出现 target_type / target_id，
必须存在 target_domain。
```

并且：

```text
如果出现 target_id，
必须存在 target_type。
```

所以合法组合只有：

```text
NULL / NULL / NULL

commerce / order / NULL

commerce / refund / rf_xxx
```

不允许：

```text
NULL / refund / rf_xxx

commerce / NULL / rf_xxx
```

---

# `request_id`

这个字段值得保留。

因为后台操作出了问题以后，可以从：

```text
Operator Audit
      │
      ▼
request_id
      │
      ▼
应用日志 / trace
```

继续追查。

但：

```text
request_id
```

不是 UNIQUE。

一个 HTTP 请求完全可能产生多个审计动作。

---

# `ip_address`

PostgreSQL 原生：

```text
inet
```

非常适合。

不用：

```text
varchar(45)
```

这是 PostgreSQL 相比 MySQL 值得利用的地方。

---

# `details jsonb`

这是 Operations Domain 少数明确合理使用 JSONB 的地方。

例如：

```json
{
  "role_id": "role_xxx"
}
```

或者：

```json
{
  "reason_code": "manual_review"
}
```

但必须严格规定：

### 可以放

- 非核心查询条件；
- 操作发生时的小型上下文快照；
- 无法稳定建模的附属信息。

### 禁止放

```text
password
token
authorization header
完整用户资料
完整订单
完整聊天消息
银行卡信息
支付凭据
大对象快照
```

也不能把：

```json
{
  "targetDomain": "...",
  "targetId": "...",
  "action": "..."
}
```

这种已经有结构化字段的数据再复制进去。

---

# 为什么没有 `status / result`

这里做一个明确领域定义：

> `operator_audit_logs` 记录已经被系统接受并执行的运营动作。

权限拒绝：

```text
permission denied
```

认证失败：

```text
login failed
```

系统异常：

```text
500 error
```

不是这张表的核心职责。

分别应该进入安全日志 / 应用日志 / Observability。

因此不增加：

```text
success
failed
pending
```

否则 Operations Audit 很快会变成通用日志系统。

---

# FK

唯一真正的 FK：

```text
operator_id
→ operations.operators.id
```

使用：

```text
ON DELETE RESTRICT
```

---

# CHECK

### action key

```sql
action_key ~
'^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$'
```

### target domain

如果非 NULL：

```sql
target_domain ~ '^[a-z][a-z0-9_]*$'
```

### target type

同样：

```sql
target_type ~ '^[a-z][a-z0-9_]*$'
```

### target 组合

```sql
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
)
```

该规则允许：

```text
domain + type + NULL id
```

---

### details 必须为 JSON object

这个非常值得约束：

```sql
CHECK (
    jsonb_typeof(details) = 'object'
)
```

避免有人写进去：

```json
[]
```

或者：

```json
"hello"
```

---

# INDEX

Audit Log 是 5 张表中唯一需要认真设计查询索引的表。

最终保留 4 个。

### 全局时间线

```sql
(created_at DESC)
```

用于：

```text
最近后台操作
```

---

### 某 Operator 的历史

```sql
(operator_id, created_at DESC)
```

---

### 某业务对象的历史

```sql
(
    target_domain,
    target_type,
    target_id,
    created_at DESC
)
```

使用 partial index：

```text
WHERE target_domain IS NOT NULL
```

---

### request tracing

```sql
(request_id)
WHERE request_id IS NOT NULL
```

用于从 request id 快速反查运营动作。

---

## 最终 DDL

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
        CHECK (
            action_key ~
            '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$'
        ),

    CONSTRAINT ck_operator_audit_logs_target_domain
        CHECK (
            target_domain IS NULL
            OR target_domain ~ '^[a-z][a-z0-9_]*$'
        ),

    CONSTRAINT ck_operator_audit_logs_target_type
        CHECK (
            target_type IS NULL
            OR target_type ~ '^[a-z][a-z0-9_]*$'
        ),

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
        CHECK (
            target_id IS NULL
            OR btrim(target_id) <> ''
        ),

    CONSTRAINT ck_operator_audit_logs_request_id_not_blank
        CHECK (
            request_id IS NULL
            OR btrim(request_id) <> ''
        ),

    CONSTRAINT ck_operator_audit_logs_details_object
        CHECK (
            jsonb_typeof(details) = 'object'
        )
);

CREATE INDEX idx_operator_audit_logs_created_at
    ON operations.operator_audit_logs (
        created_at DESC
    );

CREATE INDEX idx_operator_audit_logs_operator_created_at
    ON operations.operator_audit_logs (
        operator_id,
        created_at DESC
    );

CREATE INDEX idx_operator_audit_logs_target
    ON operations.operator_audit_logs (
        target_domain,
        target_type,
        target_id,
        created_at DESC
    )
    WHERE target_domain IS NOT NULL;

CREATE INDEX idx_operator_audit_logs_request_id
    ON operations.operator_audit_logs (
        request_id
    )
    WHERE request_id IS NOT NULL;
```

---

# Operations Domain 最终总审计

现在回头重新检查全部 5 张。

## 最终表结构

```text
operations
│
├── operators
│
├── roles
│
├── operator_roles
│
├── role_permissions
│
└── operator_audit_logs
```

没有必要增加第 6 张表。

---

# 1. `operators`

最终：

```text
id
auth_subject_id
display_name
status
created_at
updated_at
```

### UNIQUE

```text
auth_subject_id
```

### 状态

```text
active
disabled
```

### 额外 INDEX

```text
无
```

### 审计结论

**通过。**

不加：

```text
email
username
password
role_id
permissions
is_admin
last_login_at
deleted_at
metadata
remark
```

---

# 2. `roles`

最终：

```text
id
code
name
description
status
created_at
updated_at
```

### UNIQUE

```text
code
```

### 状态

```text
active
disabled
```

### 额外 INDEX

```text
无
```

### 审计结论

**通过。**

不增加：

```text
is_system
is_builtin
priority
level
parent_role_id
permissions
deleted_at
```

尤其不做 Role hierarchy。

当前完全没有必要引入：

```text
admin
 └── moderator
      └── reviewer
```

角色之间保持扁平。

---

# 3. `operator_roles`

最终：

```text
operator_id
role_id
created_at
```

### PK

```text
(operator_id, role_id)
```

### FK

```text
operator_id → operators.id
role_id     → roles.id
```

### INDEX

```text
(role_id, operator_id)
```

### 状态枚举

**没有。**

### 审计结论

**通过。**

不增加：

```text
id
status
assigned_at
revoked_at
assigned_by
deleted_at
```

---

# 4. `role_permissions`

最终：

```text
role_id
permission_key
created_at
```

### PK

```text
(role_id, permission_key)
```

### FK

```text
role_id → roles.id
```

### INDEX

额外：

```text
无
```

### 状态枚举

**没有。**

### 审计结论

**通过。**

不增加：

```text
id
permission_id
status
granted_by
deleted_at
```

并正式确认：

```text
operations.permissions
```

**不建。**

---

# 5. `operator_audit_logs`

最终：

```text
id
operator_id
action_key

target_domain
target_type
target_id

request_id
ip_address
details

created_at
```

### FK

```text
operator_id → operators.id
```

### INDEX

```text
created_at DESC

operator_id,
created_at DESC

target_domain,
target_type,
target_id,
created_at DESC

request_id
```

### 状态枚举

**没有。**

### 审计结论

**通过。**

---

# 最终 FK 图

```text
operations.operators
        ▲
        │
        │ FK
        │
operations.operator_roles
        │
        │ FK
        ▼
operations.roles
        ▲
        │
        │ FK
        │
operations.role_permissions
```

另一侧：

```text
operations.operators
        ▲
        │ FK
        │
operations.operator_audit_logs
```

而：

```text
operators.auth_subject_id
```

是：

```text
Auth Domain 逻辑引用
NO FK
```

Audit：

```text
target_domain
target_type
target_id
```

也是：

```text
跨 Domain 弱逻辑引用
NO FK
```

所以不存在 Operations 对其他业务 Schema 的数据库强耦合。

---

# 最终状态枚举总表

整个 Operations Domain **只有两个实体存在状态机**：

| Table | Field | Values |
|---|---|---|
| `operators` | `status` | `active`, `disabled` |
| `roles` | `status` | `active`, `disabled` |

其他三张：

```text
operator_roles
role_permissions
operator_audit_logs
```

全部不需要 status。

这是一个很好的信号：

> Operations Domain 没有被设计成充满无意义状态机的后台系统。

---

# 最终权限计算规则

有效权限最终应按照：

```text
Operator
    │
    │ status = active
    ▼
operator_roles
    │
    ▼
Role
    │
    │ status = active
    ▼
role_permissions
    │
    ▼
permission_key
```

因此数学上：

```text
EffectivePermissions(operator)
=
所有 active Role 的 Permission 并集
```

例如：

```text
operator A
├── trust_reviewer
│   ├── trust.reports.read
│   └── trust.reports.resolve
│
└── support
    ├── social.profiles.read
    └── commerce.orders.read
```

最终：

```text
A permissions =
{
    trust.reports.read,
    trust.reports.resolve,
    social.profiles.read,
    commerce.orders.read
}
```

没有：

```text
deny permission
permission priority
role priority
role inheritance
user direct permission
```

这些当前全部不要。

---

# 一个必须锁死的规则：禁止 Operator 直接 Permission

不要建立：

```text
operator_permissions
```

也不要：

```text
operators.permissions jsonb
```

授权路径永远只有：

```text
Operator
    ↓
Role
    ↓
Permission
```

否则几年后你会根本说不清：

> 为什么这个 Operator 拥有这个权限？

RBAC 应保持单一授权路径。

---

# `super_admin` 怎么办

同样不要设计：

```text
operators.is_super_admin
```

应该创建 Role：

```text
roles.code = 'super_admin'
```

然后赋予全部需要的 Permission。

也就是说：

```text
super_admin
```

仍然只是 Role。

不是数据库中的特殊身份。

---

# 审计日志必须 Append-only

这是 Operations Domain 最重要的不可违反规则之一。

应用层禁止：

```text
UPDATE operator_audit_logs
DELETE operator_audit_logs
```

正确生命周期只有：

```text
INSERT
```

一旦写入：

```text
永不修改
```

如果操作被后续撤销，例如：

```text
A 给 B 分配 Role
```

产生：

```text
operations.operator_roles.assign
```

之后撤回：

```text
operations.operator_roles.revoke
```

应该新增第二条 audit log。

绝不能修改第一条记录。

---

# 是否需要数据库 Trigger 禁止 UPDATE / DELETE？

**当前不建议。**

因为这属于数据库层强行为控制，会增加迁移和运维复杂度。

当前采用：

```text
Application Service
+
数据库用户权限
```

控制 append-only 即可。

未来如果进入更严格审计要求，再考虑数据库 trigger / audit extension。

---

# Operations Domain 最终不可违反的 15 条规则

1. C 端 User 与后台 Operator 是两个不同主体。
2. Operations 不存密码、Session、MFA 等认证数据。
3. 一个 Auth Subject 最多对应一个 Operator。
4. Operator 只能通过 Role 获得权限。
5. 禁止 Operator direct permissions。
6. Role 必须通过稳定 `code` 标识。
7. Role `code` 创建后不可修改。
8. Permission 定义权属于代码，不属于数据库。
9. `permission_key` 必须来自应用 Permission Registry。
10. Disabled Operator 不产生有效权限。
11. Disabled Role 不产生有效权限。
12. Operator 与 Role 不物理删除，以 `disabled` 终止生命周期。
13. 关系授权撤销直接删除关系记录，不建立关系状态机。
14. Audit Log 永久 append-only。
15. Operations 不通过 FK 接管 Trust / Commerce / Rewards / Social / Chat 等领域对象。

---

# Operations Domain 最终定稿

最终就是这 **5 张表**：

```text
operations.operators
operations.roles
operations.operator_roles
operations.role_permissions
operations.operator_audit_logs
```

总计字段：

```text
operators             6
roles                 7
operator_roles         3
role_permissions       3
operator_audit_logs   10
────────────────────────
总计                  29
```

没有多余的：

```text
permissions
operator_permissions
departments
teams
sessions
login_logs
admin_tasks
admin_notes
role_hierarchy
permission_groups
```

到这里，**Operations Domain 可以正式视为数据库层设计定稿**。它的边界也很稳定：**后台身份 + RBAC + 操作审计**，不接管任何业务域本身。 memcite


---

### [30] USER　status=finished_successfully

请基于本会话已经完成的 Operations Domain 最终审计，做一次**全域审计后的最终确认修订**。

最终 5 张表保持：

- operations.operators
- operations.roles
- operations.operator\_roles
- operations.role\_permissions
- operations.operator\_audit\_logs

主体设计不重新讨论。

请完成以下确认：

1. `operations.operators.auth_subject_id`

   - 继续 UNIQUE。
   - 它引用 Identity 的稳定 logical UUID / auth subject。
   - 不建立跨 Domain physical FK。

2. `roles`

   - code UNIQUE。
   - lower\_snake\_case。
   - 使用 disabled / inactive，而不是因为角色不用就物理删除。

3. `operator_roles`

   - 保留：
     `PK(operator_id, role_id)`
   - 补/保留反向查询 INDEX：
     `(role_id, operator_id)`

4. `role_permissions`

   - permission key 继续使用：
     `<domain>.<resource>.<action>`
   - 当前 V1 不增加独立 permission dictionary table，除非本会话此前已经明确需要。

5. `operator_audit_logs`

   - append-only。
   - 不物理删除。
   - target 继续使用：
     `target_domain`
     `target_type`
     `target_id`
   - target\_id 是业务实体 stable UUID logical ID。
   - 不建立到 Trust / Social / Chat / Commerce / Platform 的跨域 FK。

6. 明确 Operations Audit 与 Trust 的区别：

   - Trust Decision / Enforcement = 业务审核与处罚事实。
   - Operations Audit = 哪个后台操作员在什么时候执行了什么管理动作。
   - 两者不能互相替代，也不重复建模。

7. 如果 operator 对 Trust case / decision / enforcement 执行后台动作：

   - Operations 只记录操作轨迹。
   - Trust 仍然保存业务事实。

8. 删除策略：

   - audit logs 永久事实。
   - operators / roles 使用禁用状态。
   - operator\_roles 可以按角色解绑关系删除。

最后输出 Operations Domain 最终 5 表确认版，重点列明：

- 跨域 logical ID
- FK 边界
- audit append-only
- 与 Trust 的职责划分


---

### [31] SYSTEM　status=finished_successfully

_(empty)_


---

### [32] ASSISTANT　status=finished_successfully

_(empty)_


---

### [33] ASSISTANT　status=finished_successfully

_(empty)_


---

### [34] ASSISTANT　status=finished_successfully

可以。基于本会话已经完成的 Operations Domain 最终审计，这一轮只做**最终确认修订**，不重新打开主体设计。

结论先给出：**5 张表保持不变，领域边界成立，没有必要新增第 6 张表。** 本轮重点把跨域 logical ID、删除策略、Audit 与 Trust 的边界正式锁死。

# Operations Domain 最终确认版

```text
operations
├── operators
├── roles
├── operator_roles
├── role_permissions
└── operator_audit_logs
```

---

## 1. `operations.operators`

最终职责：

> 后台运营主体在 Operations Domain 中的身份档案。

最终核心字段：

```text
id
auth_subject_id
display_name
status
created_at
updated_at
```

### `auth_subject_id` 最终确认

保持：

```text
UNIQUE (auth_subject_id)
```

语义正式确定为：

> Identity / Authentication Domain 中稳定的 auth subject logical ID。

关系：

```text
Identity / Auth
     │
     │ stable logical ID
     ▼
operations.operators.auth_subject_id
```

### FK 边界

明确：

```text
auth_subject_id
    ❌ 不建立 physical FK
```

即使数据库处于同一个 PostgreSQL 实例、甚至同一个数据库，也不建立：

```sql
FOREIGN KEY (auth_subject_id)
REFERENCES identity.xxx(...)
```

它是：

> **跨 Domain logical reference。**

Identity 负责认证主体事实；Operations 只需要知道：

```text
这个 Operator 对应哪个稳定认证主体。
```

### UNIQUE

必须：

```text
UNIQUE(auth_subject_id)
```

保证：

```text
1 auth subject
    ↓
最多 1 operator
```

不能一个 Identity 主体映射多个 Operator。

### 状态

继续统一使用：

```text
active
disabled
```

这里不改成 `inactive`。

原因不是 `inactive` 错，而是 Operations 已经使用：

```text
disabled
```

表达明确的权限禁用语义，应保持 Domain 内统一。

### 删除策略

```text
operators
    ❌ 不物理删除
    ❌ 不 soft delete
    ✅ status = disabled
```

Operator 一旦参与过后台操作，就是审计历史的一部分。

---

# 2. `operations.roles`

最终核心字段保持：

```text
id
code
name
description
status
created_at
updated_at
```

## `code`

正式确认：

```text
UNIQUE(code)
```

格式：

```text
lower_snake_case
```

例如：

```text
super_admin
trust_reviewer
customer_support
finance_operator
```

数据库约束继续：

```sql
code ~ '^[a-z][a-z0-9_]*$'
```

### `code` 生命周期

正式锁死：

> Role `code` 创建后视为稳定机器标识，不应随意修改。

展示名称变化应修改：

```text
name
```

而不是修改：

```text
code
```

---

## Role 删除策略

Role 不因为暂时不用就：

```text
DELETE FROM operations.roles
```

而是：

```text
status = disabled
```

最终状态仍然：

```text
active
disabled
```

因此：

```text
disabled Role
→ 不参与有效权限计算
→ 历史关系和 Audit 仍可追踪
```

不增加：

```text
deleted_at
archived
inactive
is_deleted
```

---

# 3. `operations.operator_roles`

最终字段：

```text
operator_id
role_id
created_at
```

## PK

保持：

```text
PRIMARY KEY (
    operator_id,
    role_id
)
```

这已经同时实现：

```text
一个 Operator 不可能重复绑定同一个 Role。
```

不需要额外：

```text
id
UNIQUE(operator_id, role_id)
```

---

## FK

这是 **Operations Domain 内部关系**，因此建立真实 FK：

```text
operator_id
    → operations.operators.id

role_id
    → operations.roles.id
```

这与跨 Domain logical reference 完全不同。

建议：

```text
ON DELETE RESTRICT
```

作为数据库最后一道保护。

---

## INDEX

最终明确保留反向查询索引：

```text
(role_id, operator_id)
```

因为：

```text
PK(operator_id, role_id)
```

已经很好支持：

```text
查 Operator 有哪些 Roles
```

但不理想支持：

```text
查某 Role 有哪些 Operators
```

所以最终：

```sql
CREATE INDEX idx_operator_roles_role
ON operations.operator_roles (
    role_id,
    operator_id
);
```

这是必要索引，不属于过度设计。

---

## 删除策略

这一张和 Operators / Roles 不一样。

关系被解绑时：

```text
DELETE operator_roles relation
```

是正确行为。

也就是：

```text
绑定角色
→ INSERT

解绑角色
→ DELETE
```

不需要：

```text
status
disabled_at
revoked_at
deleted_at
```

历史事实由：

```text
operator_audit_logs
```

记录。

因此：

> **实体不删除，当前授权关系可以删除。**

---

# 4. `operations.role_permissions`

最终字段：

```text
role_id
permission_key
created_at
```

## Permission Key

格式继续正式锁定为：

```text
<domain>.<resource>.<action>
```

例如：

```text
trust.cases.read
trust.cases.resolve

trust.enforcements.create

commerce.refunds.create

rewards.grants.create

operations.operator_roles.assign
```

格式统一：

```text
lower_snake_case
```

---

## Permission dictionary table

最终确认：

```text
❌ operations.permissions
```

**V1 不建立。**

本会话此前已经明确采用：

> Permission capability 由应用代码注册，数据库负责 Role 与 Permission Key 的配置关系。

因此权限来源关系是：

```text
Application Permission Registry
            │
            │ defines valid keys
            ▼
operations.role_permissions
```

不是：

```text
operations.permissions
         ↓
role_permissions
```

应用层必须保证：

```text
permission_key
∈
Application Permission Registry
```

数据库 CHECK 只负责验证格式，不负责判断该 permission 是否真实存在。

---

## FK

只有 Domain 内：

```text
role_id
    → operations.roles.id
```

不存在：

```text
permission_key FK
```

因为没有 Permission dictionary table。

---

## 删除策略

Role 撤销一个权限：

```text
DELETE role_permissions relation
```

正确。

同样不需要关系状态。

如果这个修改属于重要后台管理操作：

```text
operations.role_permissions.grant
operations.role_permissions.revoke
```

另写 Audit Log。

---

# 5. `operations.operator_audit_logs`

这张表现在正式定义为：

> **后台管理动作的永久事实记录。**

最终核心字段：

```text
id
operator_id
action_key

target_domain
target_type
target_id

request_id
ip_address
details

created_at
```

---

# Audit append-only 正式锁死

生命周期只有：

```text
INSERT
```

禁止业务代码：

```text
UPDATE operator_audit_logs
DELETE operator_audit_logs
```

因此：

```text
Audit Log
    → immutable
    → append-only
    → permanent fact
```

如果后来的动作撤销前面的动作：

错误方式：

```text
UPDATE old audit log
```

正确方式：

```text
旧：
operations.operator_roles.assign

新：
operations.operator_roles.revoke
```

两条记录都永久存在。

---

# Target 最终结构

保持：

```text
target_domain
target_type
target_id
```

例如：

```text
target_domain = 'trust'
target_type   = 'case'
target_id     = <stable logical ID>
```

或者：

```text
target_domain = 'commerce'
target_type   = 'refund'
target_id     = <stable logical ID>
```

---

## `target_id`

最终语义：

> 对方 Domain 业务实体的 stable logical ID。

这里强调的是：

```text
stable logical identifier
```

而不是 Operations 自己拥有这个实体。

因此：

```text
Trust case ID
Trust decision ID
Trust enforcement ID
Commerce refund ID
Social profile ID
Chat conversation/message ID
Platform config entity ID
```

Operations 都只是记录其稳定 logical ID。

---

# 跨 Domain FK 明确禁止

Audit Log 不建立：

```text
target_id
    → trust.*
    → social.*
    → chat.*
    → commerce.*
    → platform.*
```

即：

```text
target_domain
target_type
target_id
```

全部构成：

> **polymorphic logical reference**

而不是数据库 FK。

尤其禁止根据：

```text
target_domain = 'trust'
```

设计触发器动态验证外域 FK。

那只会把领域彻底耦合起来。

---

# 最终 FK 边界图

Operations Domain 内部：

```text
operations.operators
        ▲
        │ physical FK
        │
operations.operator_roles
        │
        │ physical FK
        ▼
operations.roles
        ▲
        │ physical FK
        │
operations.role_permissions
```

以及：

```text
operations.operators
        ▲
        │ physical FK
        │
operations.operator_audit_logs
```

这是允许的，因为全部属于：

```text
operations
```

同一 Domain。

跨域：

```text
operators.auth_subject_id
        │
        └── logical reference → Identity

operator_audit_logs.target_id
        │
        ├── logical reference → Trust
        ├── logical reference → Social
        ├── logical reference → Chat
        ├── logical reference → Commerce
        ├── logical reference → Rewards
        └── logical reference → Platform
```

全部：

```text
NO PHYSICAL FK
```

---

# Operations Audit 与 Trust 的最终职责划分

这一条必须作为领域架构规则正式保存。

## Trust 记录什么？

Trust 保存的是：

> **业务审核、判断和处罚事实。**

例如：

```text
某个 case 是否成立
审核 decision 是什么
为什么作出该 decision
采取了什么 enforcement
处罚何时开始
何时结束
处罚状态是什么
```

概念上：

```text
Trust Case
    ↓
Trust Decision
    ↓
Trust Enforcement
```

这些属于业务事实。

---

# Operations Audit 记录什么？

Operations 保存的是：

> **哪个后台 Operator 在什么时间执行了什么后台管理动作。**

例如：

```text
operator_123

在 2026-08-30T05:20...

执行：

trust.cases.resolve

目标：

trust / case / xxx
```

它回答的是：

> 谁动了系统？

而 Trust 回答的是：

> Trust 业务上发生了什么？

两者完全不是一回事。

---

# 举例：Operator 处理 Trust Case

假设管理员张三处理：

```text
Trust Case TC-1001
```

判断举报成立并执行处罚。

## Trust Domain

应该保存：

```text
trust case
    ↓
decision = violation_confirmed
    ↓
enforcement = account_suspension
```

包含相应：

```text
reason
decision
duration
effective_at
expires_at
status
```

这是：

> **业务事实。**

---

## Operations Domain

同时写：

```text
operator_id   = op_xxx
action_key    = trust.cases.resolve

target_domain = trust
target_type   = case
target_id     = TC-1001

created_at    = ...
```

如果随后又执行 Enforcement：

```text
action_key    = trust.enforcements.create

target_domain = trust
target_type   = enforcement
target_id     = ENF-xxx
```

这是：

> **操作轨迹。**

---

# 两者绝不能互相替代

不能认为：

```text
Audit Log 里有 trust.enforcements.create
```

所以 Trust 不需要：

```text
trust.enforcements
```

错误。

Operations Audit 并不是业务状态来源。

同样不能认为 Trust 已经有：

```text
created_by_operator_id
reviewed_by_operator_id
```

所以 Operations 不需要 Audit。

也错误。

因为：

```text
Trust
```

只能告诉你业务事实中的某些责任主体。

而 Operations Audit 可以完整记录：

```text
谁查看
谁修改
谁重新审核
谁创建处罚
谁撤销
谁修改后台权限
```

两者关注维度不同。

---

# 最终职责关系

正式锁死：

```text
┌───────────────────────────────┐
│ Trust Domain                  │
│                               │
│ Case                          │
│ Decision                      │
│ Enforcement                   │
│                               │
│ = 业务审核 / 处罚事实          │
└───────────────────────────────┘

              ▲
              │ Operator executes
              │
┌───────────────────────────────┐
│ Operations Domain             │
│                               │
│ Operator                      │
│ RBAC                          │
│ Operator Audit                │
│                               │
│ = 谁执行了什么后台管理动作     │
└───────────────────────────────┘
```

因此：

> **Operations 记录轨迹；Trust 保存事实。**

这是最终边界。

---

# 删除策略最终矩阵

| 表 | 物理删除 | Soft delete | 正确策略 |
|---|---:|---:|---|
| `operators` | ❌ | ❌ | `status = disabled` |
| `roles` | ❌ | ❌ | `status = disabled` |
| `operator_roles` | ✅ | 不需要 | 解绑即删除关系 |
| `role_permissions` | ✅ | 不需要 | 撤销权限即删除关系 |
| `operator_audit_logs` | ❌ | ❌ | 永久 append-only |

这里的“可删除”只表示：

> 当前授权关系可以消失。

而不是抹掉历史。

历史永远通过：

```text
operator_audit_logs
```

保留。

---

# 最终 5 表确认

| 表 | 核心职责 | FK 策略 |
|---|---|---|
| `operations.operators` | 后台运营主体 | Auth 使用 logical ID，无跨域 FK |
| `operations.roles` | RBAC Role | 无跨域关系 |
| `operations.operator_roles` | Operator ↔ Role | Operations 内 physical FK |
| `operations.role_permissions` | Role ↔ Permission Key | Role 为 physical FK；Permission 由代码定义 |
| `operations.operator_audit_logs` | 后台管理操作永久审计 | Operator 内域 FK；target 为跨域 logical reference |

---

# 全域审计后最终不可违反规则

本轮最终把下面这些规则作为 **Operations Domain 定稿约束**：

1. **Operations 最终保持 5 张表，不增加 Permission dictionary table。**
2. `operators.auth_subject_id` 是 Identity/Auth stable logical ID，并保持 `UNIQUE`。
3. `auth_subject_id` 不建立跨 Domain physical FK。
4. Operators / Roles 都不物理删除，以 `disabled` 结束当前有效生命周期。
5. Role `code` 必须 `UNIQUE + lower_snake_case`。
6. `operator_roles` 使用 `PK(operator_id, role_id)`。
7. `operator_roles` 保留反向索引 `(role_id, operator_id)`。
8. Permission key 固定为 `<domain>.<resource>.<action>`。
9. Permission 定义权属于代码 Registry，不属于数据库。
10. Operator 只能通过 Role 获取 Permission。
11. Audit Log 是永久、不可修改、不可删除的 append-only 事实。
12. Audit target 使用 `target_domain + target_type + target_id`。
13. `target_id` 是目标业务实体 stable logical ID。
14. Audit target 对所有其他 Domain 均不建立 physical FK。
15. **Trust Decision / Enforcement 是业务事实。**
16. **Operations Audit 是后台操作轨迹。**
17. Operator 操作 Trust 时，Operations 记录“谁做了什么”；Trust 继续保存 case / decision / enforcement 本身。
18. 两个 Domain 不允许互相替代，也不复制对方完整业务模型。

至此可以把 **Operations Domain 视为全域审计后的最终确认版**：**后台主体 + RBAC + immutable management audit**，同时严格维持与 Identity 和 Trust 等其他 Domain 的 logical-ID 边界。 memcite
