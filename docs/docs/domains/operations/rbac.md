---
status: frozen
last_updated: 2026-08-31
---

# RBAC 与授权

本页定义 Operations 的 Operator 生命周期、Role、Permission Model 与后端授权算法。

## Operator 生命周期

```text
self registration = NO
normal create      = authorized management action
first operator     = controlled bootstrap
status             = active | disabled
auth_subject_id    = immutable
physical delete    = NO
soft delete        = NO
```

Disabled Operator 对新的 Authorization Decision 一律拒绝；历史 Role 关系和 Audit 不删除。

重新 Enable Operator 时必须重新确认对应 Identity Subject 当前可用。

## Identity 映射

`operators.auth_subject_id`：

```text
UUID
UNIQUE
Identity stable logical/public subject reference
NO cross-domain FK
```

请求链：

```text
Identity Authentication
↓
AuthContext(subjectId)
↓
Operations resolve Operator by auth_subject_id
↓
RBAC Authorization
```

Operations 只能通过 Identity Public Contract 查询认证主体事实，禁止依赖 Identity Repository、内部 Application、Infrastructure 或跨域 SQL。

## Role

Role 是扁平授权集合：

```text
code        UNIQUE + lower_snake_case + immutable
name        mutable
description mutable
status      active | disabled
physical delete = NO
```

Disabled Role 的关系记录保留，但不参与 Permission Union。

V1 允许创建自定义 Role。

## Permission Grammar

Permission Key 固定格式：

```text
<domain>.<resource>.<action>
```

规则：

- 恰好三段；
- 全部使用 `lower_snake_case`；
- Domain Token 必须属于正式业务领域；
- Resource 表达 capability family；
- Permission 是代码定义的能力，不是数据库动态发明的字符串权限系统。

V1 明确不支持：

```text
wildcard
deny
role hierarchy
role priority
direct operator permission
ABAC
resource ACL
temporary role
```

## Permission Catalog

Permission Catalog 的事实源是 Operations 代码中的静态/类型化定义。

数据库 `role_permissions` 只保存：

> 某个 Role 当前被分配了哪些已存在的合法 Permission。

新增某业务领域的后台 Permission，必须先由 Owner Domain 冻结对应的管理能力/契约，再进入 Catalog。

数据库不能创建代码不存在的 Permission。

## `super_admin`

`super_admin` 是唯一保留 Role Code。

它不是 bypass：

```text
NO wildcard
NO is_super_admin field
NO role-code allow-all branch
```

`super_admin` 必须显式拥有当前 Permission Catalog 的完整集合。

它不能被 Disable，也不能把 Permission Set 改成缺少当前 Catalog 必需权限的集合。

## Last-admin 不变量

任何可能减少 Active Super Admin 数量的操作都必须在事务中保护：

```text
Disable Operator
Revoke super_admin assignment
其他未来等价操作
```

必须保证提交后仍至少存在一个 Active Super Admin Operator。

实现应通过明确锁与最终数据库不变量防止并发请求同时绕过检查。

## Role Permission 修改

V1 的 Role Permission Mutation 使用“完整集合替换”语义：

```text
SetRolePermissions(role_id, complete_permission_set)
```

避免客户端用一连串 add/remove 产生不可预测的中间状态。

## Authorization Algorithm

```text
Identity authenticated
↓
Operator exists
↓
Operator active
↓
读取已分配且 active 的 Roles
↓
UNION 这些 Role 的 exact Permissions
↓
required exact key exists ?
├─ YES → authorized
└─ NO  → forbidden
```

当前授权决策不依赖 Redis 或长期 RBAC Cache；权限变化以后端当前 canonical database state 为准。

## Owner Domain 二次裁决

Operations Authorization 通过后，仍必须由 Owner Domain 检查：

```text
资源是否存在
资源是否属于允许范围
当前状态是否允许操作
状态机 Guard 是否满足
业务不变量是否满足
```

因此：

```text
RBAC PASS
≠
Business Mutation 必然 PASS
```

前端 Permission Guard 也不能代替上述服务端链路。
