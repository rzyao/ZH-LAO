# Code Review: 后台操作员密码重置

> Date: 2026-09-05｜Status: APPROVED

## Machine gates

- 后端 lint、架构边界检查、类型检查：通过。
- 管理端 lint：无错误（仅既有 fast-refresh 警告）；类型检查：通过。
- 定向 unit tests、Playwright + axe、真实 API/数据库回归：通过。
- 未新增依赖；未运行 `osv-scanner`（本机未配置该工具）。

## Findings

### REV-001：原子回滚失败注入集成测试（已解决）

| Field | Value |
| --- | --- |
| Dimension | Tests |
| Severity | RESOLVED |
| File | `apps/backend/src/modules/operations/application/services/operations-service.ts` |

已补充真实 PostgreSQL 集成测试：在凭据更新、会话撤销之后强制审计写入失败，并断言原密码 hash 与 `password_change_required=false` 均保留，且没有新增密码重置审计记录。这验证了跨 Identity 与 Operations 的同一事务会整体回滚。

## Positive highlights

- Operations 通过 Identity `public/` 窄端口调用凭据写入，架构边界检查通过。
- API 和 UI 均将临时密码限制为一次性、`no-store`、局部内存状态；浏览器回归验证关闭后不可读。
- `1380` migration 将新权限安全地推广到既有 super-admin，避免升级后权限缺失。
