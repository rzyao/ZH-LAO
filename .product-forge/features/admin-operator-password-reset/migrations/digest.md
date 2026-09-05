# 迁移摘要

- PostgreSQL schema 仅新增 `identity.admin_credentials.password_change_required boolean NOT NULL DEFAULT false`。
- 采用 expand 策略；常量默认值不需要 backfill，也不修改冻结 migration。
- 提供可执行 forward、rollback 和验证 SQL；rollback 会丢弃迁移后状态，需先回退应用并确认没有待改密账户。
- 当前候选迁移编号为 `1360`，实际编号必须在实施前重新确认。
