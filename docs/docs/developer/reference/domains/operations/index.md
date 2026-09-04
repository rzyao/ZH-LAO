---
status: frozen
last_updated: 2026-08-31
schema: operations
---

# 运营（Operations）

运营领域是内部后台的**运营主体、RBAC 授权控制面与操作审计**。

它只回答三类问题：

1. 谁是后台 Operator；
2. 当前 Operator 被允许执行什么管理能力；
3. 哪个 Operator 成功执行过什么后台管理动作。

Operations 不是业务状态聚合层。Identity、Platform、Content、Trust & Safety、Commerce、Rewards 等业务事实始终由各自领域拥有。

## 领域职责

| 负责 | 不负责 |
| --- | --- |
| Identity Auth Subject 与 Operator 的映射 | Password / OTP / JWT / Session |
| Operator 生命周期 | C 端 User 业务身份 |
| Role | 业务领域对象状态 |
| Operator ↔ Role 当前关系 | 封禁、退款、奖励等业务状态机 |
| Role ↔ Permission 当前关系 | Feature Flag / Runtime Config canonical state |
| Exact Permission Catalog / Authorization | 自定义运行时 Permission 定义 |
| 后台成功操作审计 | 业务对象自身审计历史 |
| 首个管理员受控 Bootstrap | Public Admin 注册 |

## 领域能力地图

Operations 当前提供的稳定业务能力包括：

```text
Operator 身份映射
Role 管理
Permission 授权
Operator ↔ Role
Role ↔ Permission
后台请求授权判断
成功管理动作审计
首个管理员 Bootstrap
```

这些能力服务多个后台 Feature，但 Operations 不拥有被管理业务对象本身的状态机。

## 参与的产品功能

| 产品功能 | 关系 | Operations 职责 |
| --- | --- | --- |
| [音频生产](/developer/features/audio-production) | 参与领域 | 为后台音频生产提供 Operator、RBAC 与操作审计身份 |

音频 Slot、Task、Review、Publish 等事实仍由 Audio Production 拥有。

## 核心数据模型

```text
Operator
  ↓
OperatorRole
  ↓
Role
  ↓
RolePermission

Operator
  ↓
OperatorAuditLog
```

V1 固定 5 张业务表：

```text
operations.operators
operations.roles
operations.operator_roles
operations.role_permissions
operations.operator_audit_logs
```

不建立独立 Permission Dictionary Table。

## 核心边界

### 与 Identity

```text
Identity Authentication
↓
Auth Subject UUID
↓
Operations Operator Resolution
```

Operations 不拥有认证凭据和 Session。

### 与业务领域

```text
Operations Authorization
↓
Owner Domain Application Service
↓
Owner Domain Business Rule / State Machine
```

Operations 证明“这个后台操作者有没有执行该管理能力的权限”；Owner Domain 决定“当前业务对象能不能发生这个动作”。

### 与后台客户端

后台前端可以根据有效 Permission 做 UI Guard，但真正授权必须在后端执行。

## 关键原则

- Operator 与 C 端 User 是不同主体；
- `auth_subject_id` 使用 Identity 稳定 logical UUID，不建跨域 FK；
- Permission 使用 `<domain>.<resource>.<action>` exact key；
- 不支持 wildcard、deny、role hierarchy、direct operator permission、ABAC；
- `super_admin` 是保留 Role，不是代码绕过权限检查的后门；
- Operations Repository 只访问 `operations.*`；
- 业务领域写入仍由 Owner Domain Application Service 执行；
- `operator_audit_logs` 是成功后台管理动作的 append-only 审计事实。

## Content 中老语言管理授权

Content 为每个中文和老挝语内容类别登记 `read/write/review/publish` 四项精确权限。Operations 只负责登记、角色配置和授权判断，不定义固定内容岗位：

- 中文资源为 `zh_pinyin_elements`、`zh_syllables`、`zh_hanzi`、`zh_words`、`zh_sentences`；
- 老挝语资源为 `lo_letters`、`lo_syllables`、`lo_words`、`lo_sentences`；
- 新权限只在迁移时默认授予保留角色 `super_admin`；
- 其他角色如何组合读取、编辑、审核和发布能力，由运营人员通过既有角色权限能力配置；
- Content 后端负责业务状态机和发布依赖判断，Operations 不接管内容状态。

## 文档地图

- [RBAC 与授权](rbac.md)：Operator、Role、Permission、`super_admin` 与授权算法。
- [操作审计与 Bootstrap](audit.md)：成功操作审计语义、同域/跨域审计边界、首个管理员初始化。
- [公共契约与集成](contracts.md)：Identity、Owner Domain、后台 HTTP / Public Contract 的稳定协作规则。
- [数据设计](database.md)：5 张表的字段、约束、索引与物理关系。
- [音频生产 Feature](/developer/features/audio-production)
