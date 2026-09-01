---
status: frozen
last_updated: 2026-09-02
---

# ADR-019：Operations 为后台控制平面（运营主体 + RBAC + 不可变操作审计）

**状态：** `frozen`

**日期：** 2026-08-30

**相关：** [Operations 域](../domains/operations/index.md)、[Operations 数据库](../domains/operations/database.md)、[Domain Map](../architecture/domain-map.md)、[ADR-015](ADR-015-chat-naming-and-sql-adjudication.md)、[ADR-018](ADR-018-global-database-design-principles-final.md)

## 背景

产品运营后台从第一天按多人协作设计（用户、审核、举报、课程、商业、奖励、配置、权限、数据看板）。但 Operations 此前只有实体草案（`StaffAccount` / `Permission` / `StaffRole` / `WorkQueue` / `ContentPublishTask` / `Dashboard` 等），没有任何字段契约或定稿表。

主要风险是 Operations 极易膨胀成「后台垃圾桶」：把封禁、退款、奖励补发等业务域状态机搬进来，或复制业务数据，导致域边界失控。同时需要决定：后台权限怎么建模、后台操作要不要审计、后台身份与 C 端用户是否分离。

约束来自已确定的设计基线：模块化单体 + 多 Schema、域内自治、跨域只引用稳定标识、**代码定义能力 / 数据库配置规则**、历史事实不可变。

## 决策

1. **Operations = Backoffice Control Plane**：只负责「后台运营主体 + RBAC 后台授权 + 后台操作审计」三个问题（谁可以进后台、能做什么、实际做过什么），第一阶段定稿 **5 张表**：
   `operators` / `roles` / `operator_roles` / `role_permissions` / `operator_audit_logs`。
2. **不承接任何业务域状态机**：封禁/举报归 Trust，退款归 Commerce，奖励补发归 Rewards；Operations 只引用他域对象稳定逻辑 ID 做审计描述。
3. **C 端 User 与后台 Operator 是两个主体**：禁止 `users.is_admin` / `users.role`，运营人员不复制 C 端业务身份。
4. **不建 `permissions` 表**：权限能力由应用代码 Permission Registry 定义，数据库只配置 `role_permissions`（`<domain>.<resource>.<action>`）；有效权限 = 所有 active Role 权限并集，无角色层级、无 Operator 直接权限、`super_admin` 只是 Role。
5. **Operator / Role / Audit Log 的 `id` 用 `uuid` 稳定系统 ID**（应用层生成、不可变；经 D-153 全局分区收口修订，取代早期 `varchar(20)` 方案——Operator 会被 Audio 等域引用，必须有稳定 UUID logical/public ID，且全系统不得出现 UUID / VARCHAR 双契约）；`operators.auth_subject_id` 为 Identity 稳定 UUID logical reference（UNIQUE、**不建跨域物理 FK**），`operator_audit_logs.target_id` 为目标域稳定 UUID logical ID（`target_domain + target_type + target_id` 跨域多态引用）；域内 4 处 FK 保留 `ON DELETE RESTRICT`。
6. **`operator_audit_logs` 永久 append-only**：只 INSERT，不 UPDATE / DELETE；当前由 Application Service + 数据库用户权限控制，不建数据库 Trigger。
7. **Operations 记录操作轨迹，Trust 保存业务事实**：两者不可互相替代、不复制对方完整业务模型。

## 备选方案与取舍

| 方案 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- |
| 复杂企业 IAM（permissions 表、部门/团队、角色层级、邀请流） | 权限建模完整、可扩展 | 当前 10K 用户 + 少量运营人员的阶段过度设计，维护成本高 | 不采用，V1 保持 5 表 |
| 把认证（Session/MFA/登录失败）放进 Operations | 后台账号集中管理 | 越过域边界，Operations 会侵占 Identity/Auth 职责 | 不采用，认证归 Identity/Auth |
| `users.is_admin` 布尔 / `users.role` | 实现简单 | C 端与后台身份生命周期混杂，权限退化成布尔，无法审计 | 不采用 |
| 建 `permissions` 表 | 权限可在数据库管理 | 数据库可能出现代码根本不支持的权限（如 `payment.force_success`），能力与实现脱节 | 不采用，权限由代码 Registry 定义 |
| 数据库 Trigger 强制 append-only | 审计不可变性最强 | 增加迁移与运维复杂度；当前阶段应用层 + DB 用户权限已足够 | 暂不采用，未来严格审计要求再评估 |
| `operator_roles` 用状态机（active/revoked） | 记录关系历史 | 与审计日志职责重复，关系历史应进 `operator_audit_logs` | 不采用，解绑即删除关系记录 |

## 后果

### 正面影响

- 后台权限边界稳定，Operations 成为真正的控制平面而非业务域聚合层。
- 权限能力由代码掌控，杜绝“数据库里有、代码没实现”的权限。
- 后台操作可追溯：`operator_audit_logs` 永久 append-only，可按 operator / 业务对象 / request_id 反查。
- 与 Trust / Commerce / Rewards / Social / Chat 等域只通过 logical ID 协作，无跨域物理耦合。

### 代价与风险

- 后台认证机制（登录、Session、MFA、失败锁定）归 Identity/Auth 域，尚未设计（`designing`）。
- ~~Operations 稳定逻辑 ID 为 `varchar(20)` 与全局「跨域 logical UUID」存在类型差异，待主会话统一裁决~~ → **已裁决（D-153）**：全部统一为 UUID，早期方案 `superseded`。
- 工作队列、内容/用户运营、数据看板等后台能力 V1 明确不建；未来确有需求需重新评估归属（Operations 或 Platform）。

## 后续行动

- [ ] Identity/Auth 域设计后台认证（auth subject、登录、Session、MFA），作为 `operators.auth_subject_id` 的落点。
- [x] ~~主会话裁决 Operations 稳定逻辑 ID 与全局「跨域 logical UUID」的口径统一~~ → 已由 D-153 裁决：统一 UUID。
- [ ] 未来确有后台工作队列 / 看板需求时，评估扩展 Operations 或归属 Platform。
