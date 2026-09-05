---
status: baseline
last_updated: 2026-09-05
---

# ADR-031：受控后台操作员密码重置

**状态：** `已接受`  
**日期：** 2026-09-05  
**批准：** 用户在 Product Forge 再验证阶段批准，2026-09-05

## 决策

新增 `operations.operators.reset_password`：active Operator 仅可重置**其他** active Operator；目标为 active `super_admin` 时 actor 也必须为 active `super_admin`。自己改密仍走既有 Identity 流程。

Identity 拥有临时密码、hash、首次登录强制改密状态及目标全部 Session；Operations 拥有精确授权和成功审计。应用装配通过窄写入端口在同一 PostgreSQL 本地事务中完成凭证更新、Session 撤销和 `operations.operators.reset_password` 审计；任一步失败全部回滚。

临时密码仅在带 `Cache-Control: no-store` 的成功响应 `data.temporary_password` 返回一次。它不得进入审计、日志、错误、读取接口、URL、查询缓存或持久化前端状态。网络错误不得自动重试或找回秘密。

## 后果

- `identity.admin_credentials.password_change_required` 必须以**前向迁移**建立，禁止改写冻结 `1260_admin_credentials.sql`。
- 目标首次以临时密码成功登录时，在完成改密前不得访问后台受保护资源。
- `super_admin` 继续显式拥有完整静态权限目录；不引入 wildcard 或角色层级。
- 不新增公开找回入口、Mobile 流程、通知投递、MFA 或 SSO。
