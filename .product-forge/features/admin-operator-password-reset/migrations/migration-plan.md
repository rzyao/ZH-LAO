# Migration Plan — 后台操作员密码重置

> Generated: 2026-09-05  
> DB: PostgreSQL  
> Strategy: Expand（常量默认值字段新增，无需 backfill）

## Schema diff

| Change | Field | Type | Reversible? |
| --- | --- | --- | :---: |
| ADD | `identity.admin_credentials.password_change_required` | `boolean NOT NULL DEFAULT false` | ⚠️ schema 可回退；回退会丢弃迁移后状态 |
| DATA | `operations.role_permissions` | 为既有 `super_admin` 补充 `operations.operators.reset_password` | ✅ 幂等 |

当前表由冻结的 `1260_admin_credentials.sql` 建立，尚无该列；目标契约来自 ADR-031 及 Identity domain database authority。此项不改变历史 migration。

## Strategy

采用 PostgreSQL 的 expand strategy：新增带常量 `DEFAULT false` 的 `NOT NULL boolean`。在 PostgreSQL 11+，此类常量默认值不会重写已有行；既有账户逻辑上立即为 `false`，因此没有数据 backfill、双写或索引构建。

实际实现已使用 `1360_admin_credentials_password_change_required.sql` 创建字段，并以 `1380_operations_password_reset_permission.sql` 幂等补充既有 `super_admin` 的新精确权限，避免升级后角色权限集缺项。

## Files produced

- `migrations/forward.sql`
- `migrations/rollback.sql`
- `migrations/validation.sql`
- `migrations/risk-matrix.md`

无需 `backfill.md`：该变更没有历史数据转换，也不触及超过 10k 行的写入。

## Pre-migration checklist

- [ ] 确认生产 PostgreSQL 主版本为 11 或更高。
- [ ] 重新枚举迁移目录并分配下一唯一编号。
- [ ] 在 production-shaped staging 通过仓库 migration runner 执行 forward 与 validation。
- [ ] 记录 `admin_credentials` 基线行数，执行 validation 最后一条计数查询并对账。
- [ ] 确认 migration 先于读取/写入该列的应用版本部署。
- [ ] 确认数据库锁等待、认证错误率和 migration 失败告警可用。

## Rollback trigger criteria

- `validation.sql` 任一断言失败。
- migration 锁等待超出本次变更已批准窗口，或认证错误率超过部署前基线 1%。
- staging/production smoke test 无法读取现有后台凭据或发现既有账户意外为 `true`。

先回退应用到不读取该字段的版本，确认没有 `password_change_required = true` 的账户，再执行 `rollback.sql`。若存在 `true`，停止回滚并由安全负责人决定账户处理方式；不得静默丢弃强制改密状态。

## Owner

Identity 与 Operations 服务维护团队；数据库执行由具备生产变更权限的值班负责人完成。
