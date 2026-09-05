# 实施摘要

- 完成 Identity 凭据状态、Operations 原子重置命令、管理端确认/一次性密码交互与历史 super-admin 授权迁移。
- 安全重点：Identity public 窄端口、事务内审计、`no-store`、无自动重试及受限认证 allowlist。
- 验证：类型检查、lint、单元测试、真实 API 回归、Playwright + axe。
- 后续代码审查应重点检查跨域事务与权限升级 migration。
