---
status: frozen
last_updated: 2026-08-30
revision: "2026-08-30 设计运营域会话定稿：5 表最终确认版（后台主体 + RBAC + 不可变操作审计）"
schema: operations
source_conversation_id: 6a9351a6-17b8-83ea-b172-5f58121a431f
source_share_url: https://chatgpt.com/share/6a9351a6-17b8-83ea-b172-5f58121a431f
---

# Operations 域

Operations Domain = **内部运营后台的身份、授权与操作追踪域**（Backoffice Control Plane）。

它只解决三个问题：

1. **谁可以进入运营后台**（后台运营主体）
2. **这个后台人员可以做什么**（RBAC 后台授权）
3. **这个后台人员实际做过什么**（后台操作审计）

Operations **不是“所有后台功能的大杂烩”**，也不是业务域的状态机聚合层。真正的数据仍然分别写入各自属主域（`trust.*` 举报/处罚、`commerce.*` 订单/退款、`rewards.*` 奖励发放等）；Operations 只负责操作者与权限，并留下操作审计记录。

## 一句话边界

```text
Operations = 后台身份 + RBAC + 操作审计
不接管：业务审核/处罚/退款/奖励/聊天/社交/学习等任何业务域状态机
```

## 子域与实体（本会话定稿）

| 子域 | 核心实体 | 表 | 职责 |
| --- | --- | --- | --- |
| 运营主体 | Operator | `operations.operators` | 后台运营主体的身份档案（非认证账户） |
| RBAC | Role | `operations.roles` | 后台角色，一组权限的稳定集合 |
| RBAC | OperatorRole | `operations.operator_roles` | 运营人员 ↔ 角色（多对多） |
| RBAC | RolePermission | `operations.role_permissions` | 角色 ↔ 权限 key（`permission_key`，无 permissions 表） |
| 操作审计 | OperatorAuditLog | `operations.operator_audit_logs` | 后台管理动作的永久、不可变、append-only 事实 |

第一阶段共 **5 张表**，由[数据库总览](database.md)维护 DDL。

```text
operations
├── operators
├── roles
├── operator_roles
├── role_permissions
└── operator_audit_logs
```

## 明确不能放进 Operations 的东西

- **举报、审核、处罚** → `trust`（即使人工审核在“运营后台”完成，仍是 Trust 数据；Operations 只记录 `operator X 执行了 trust.reports.resolve`）。
- **退款、补单、支付调整** → `commerce`（不建 `admin_refunds` / `manual_orders` / `payment_adjustments`）。
- **奖励补发** → `rewards`。
- **聊天管理** → `chat`（`messaging.*` 仅指 Chat 域数据的 Schema 引用，Chat 为唯一正式命名，见 [ADR-015](../../adr/ADR-015-chat-naming-and-sql-adjudication.md)）。
- **内容本身**（课程、词汇、文章、Banner 业务内容、动态、礼物、商品）→ 由拥有这些对象的业务域负责。
- **Feature Flag / 系统参数** → `platform`。Operations 描述“谁在操作系统”，Platform 描述“系统如何运行”，两者不混。
- **认证机制**：登录 Session、密码、MFA、失败锁定 → 认证类属 Identity/Auth 域，不能因为后台用户位于 Operations 就把认证系统塞进来。

## C 端用户与后台 Operator 必须分开

```text
App User ≠ Operator
```

禁止 `users.is_admin = true`、禁止 `users.role = 'ADMIN'`。C 端身份与后台运营身份生命周期完全不同：普通用户、老师、VIP、社交用户都不意味着后台管理员；运营人员也没必要拥有 C 端社交资料、会员、钱包、奖励等业务身份。`operations.operators` 是独立的后台主体。

## 权限模型：代码定义能力，数据库配置规则

- **不建 `permissions` 表**。权限能力由应用代码中的 **Application Permission Registry** 定义（`trust.reports.read`、`commerce.refunds.create`、`rewards.grants.create`、`social.profiles.moderate` 等），数据库只负责“哪个 Role 拥有哪些权限 key”（`role_permissions`）。
- 权限 key 格式统一为 **`<domain>.<resource>.<action>`**，全部 `lower_snake_case`；不使用 `TRUST_REPORT_READ`、`trust:reports:read`、`Trust.Report.Read`。
- 写入 `role_permissions` 时应用层必须校验 `permission_key ∈ Application Permission Registry`；数据库 CHECK 只验证格式，不验证权限是否真实存在。
- **有效权限 = 所有 active Role 的 Permission 并集**。无 deny permission、无权限/角色优先级、无角色层级（role hierarchy）、无用户直接权限（禁止 `operator_permissions` 或 `operators.permissions jsonb`）。
- `super_admin` 只是一个 Role（`roles.code = 'super_admin'`），不是数据库中的特殊身份，也不建 `operators.is_super_admin`。

## Operations 与 Trust 的边界（不可互相替代）

| Domain | 记录什么 | 回答什么 |
| --- | --- | --- |
| Trust | 业务审核、判断与处罚事实：Case / Decision / Enforcement（成立与否、理由、起止、状态、申诉） | Trust 业务上发生了什么 |
| Operations | 哪个后台 Operator 在什么时间执行了什么后台管理动作（`operator_id + action_key + target_*`） | 谁动了系统 |

Operator 处理 Trust Case 时：**Operations 记录操作轨迹**（`trust.cases.resolve` / `trust.enforcements.create` → `operator_audit_logs`），**Trust 仍然保存业务事实本身**（case / decision / enforcement）。两者不能互相替代，也不复制对方完整业务模型。

## 状态汇总

整个 Operations Domain **只有两个实体存在状态机**：

| 表 | 字段 | 值 |
| --- | --- | --- |
| `operators` | `status` | `active` / `disabled` |
| `roles` | `status` | `active` / `disabled` |

`operator_roles` / `role_permissions` / `operator_audit_logs` 三张表全部**不需要 status**。

- `active`：可参与权限计算 / 承担运营职责（同时还需 Auth 可认证）。
- `disabled`：整个 Operator / Role 立即不再产生有效权限，但历史关系与审计保留。

## 删除策略矩阵

| 表 | 物理删除 | Soft delete | 正确策略 |
| --- | ---: | ---: | --- |
| `operators` | ❌ | ❌ | `status = disabled`（审计主体永久保留） |
| `roles` | ❌ | ❌ | `status = disabled` |
| `operator_roles` | ✅ | 不需要 | 解绑即删除关系，历史进审计 |
| `role_permissions` | ✅ | 不需要 | 撤销权限即删除关系，历史进审计 |
| `operator_audit_logs` | ❌ | ❌ | 永久 append-only（不可 UPDATE / DELETE） |

“可删除”只表示当前授权关系可以消失，不抹掉历史；历史永远通过 `operator_audit_logs` 保留。

## 18 条不可违反规则

1. **Operations 最终保持 5 张表，不增加 Permission dictionary table。**
2. `operators.auth_subject_id` 是 Identity/Auth stable logical ID，并保持 `UNIQUE`。
3. `auth_subject_id` 不建立跨 Domain physical FK。
4. Operators / Roles 都不物理删除，以 `disabled` 结束当前有效生命周期。
5. Role `code` 必须 `UNIQUE + lower_snake_case`。
6. `operator_roles` 使用 `PK(operator_id, role_id)`。
7. `operator_roles` 保留反向索引 `(role_id, operator_id)`。
8. Permission key 固定为 `<domain>.<resource>.<action>`。
9. Permission 定义权属于代码 Registry，不属于数据库。
10. Operator 只能通过 Role 获取 Permission（单一授权路径）。
11. Audit Log 是永久、不可修改、不可删除的 append-only 事实。
12. Audit target 使用 `target_domain + target_type + target_id`。
13. `target_id` 是目标业务实体 stable logical ID。
14. Audit target 对所有其他 Domain 均不建立 physical FK。
15. **Trust Decision / Enforcement 是业务事实。**
16. **Operations Audit 是后台操作轨迹。**
17. Operator 操作 Trust 时，Operations 记录“谁做了什么”；Trust 继续保存 case / decision / enforcement 本身。
18. 两个 Domain 不允许互相替代，也不复制对方完整业务模型。

## 数据库状态

- **5 张表字段级定稿 `frozen`**：字段、可空性、默认值、FK/UNIQUE/CHECK/INDEX、状态枚举、删除策略见[数据库总览](database.md)。
- **ID 口径已收口（D-153，frozen）**：Operator / Role / Audit Log 的 `id` 与全部跨域引用（`auth_subject_id`、audit `target_id`）统一为 UUID；早期 `varchar(20)`（`op_xxx` / `role_xxx` / `sys_xxx`）方案 `superseded`，全系统只有一套 Operator UUID 契约（Audio 等域的 `assignee_operator_id` 等与之类型一致）。
- **`designing`**：
  - 后台认证机制（登录、Session、MFA、失败锁定）归 Identity/Auth 域，本会话未设计（Operations 不存认证数据）。
  - 工作队列、内容/用户运营、数据看板等后台能力 V1 明确不建，未来确有需求再评估是否扩展 Operations 或归属 Platform。
