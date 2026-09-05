# 技术计划摘要

- 增加一个前向 `admin_credentials.password_change_required` migration；历史 migration 不动。
- Operations 用一个本地 PostgreSQL transaction 编排 Identity 凭据更新、目标会话撤销和 Operations 审计。
- 临时密码只在 `no-store` 成功响应出现一次；管理端仅在临时 dialog state 保存，关闭即销毁。
- 登录携带强制改密状态，后端仅放行 own-password change 与 logout，防止前端绕过。
- 下阶段先输出 migration plan，再分解任务并实施；TC-001、003、004、006 是测试优先的放行条件。
