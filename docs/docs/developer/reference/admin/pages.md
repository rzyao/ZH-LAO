---
status: active
last_updated: 2026-09-02
---

# Admin 页面清单

Admin 页面分为当前正式页面文档与已实现路由页面：

## 正式页面文档

- [操作员管理](operators.md)（`admin-operators`，关联 `operator-management`）
- [音频生产工作台](audio-production.md)（`admin-audio-production`，关联 `audio-production`）

## 已实现路由

| 页面 | 路由 | 说明 |
| --- | --- | --- |
| 登录 | `/login` | 未认证入口 |
| 总览 | `/` | 后台运行环境与基础能力概览 |
| Domain 占位页 | `/content`、`/learning`、`/audio`、`/identity`、`/social`、`/chat`、`/commerce`、`/rewards`、`/trust` | Domain 页面在对应 Feature 进入实施后补齐 |
| Operations 总览 | `/operations` | 运营权限控制面入口 |
| 操作员管理 | `/operations/operators` | Operations 页面（权限：`operations.operators.read`） |
| 角色与权限矩阵 | `/operations/roles` | Operations 页面（权限：`operations.roles.read`） |
| 操作审计日志 | `/operations/audit-logs` | Operations 页面（权限：`operations.audit_logs.read`） |
| Platform 总览 | `/platform` | 平台控制面入口 |
| Feature Flags | `/platform/feature-flags` | Platform 页面 |
| Runtime Configs | `/platform/runtime-configs` | Platform 页面 |
| App Versions | `/platform/app-versions` | Platform 页面 |
| Announcements | `/platform/announcements` | Platform 页面 |
| Regions | `/platform/regions` | Platform 页面 |
| Design System | `/system/design-system` | 开发专用页面 |

新增可作为 Feature 交付事实的页面时，必须补齐 frontmatter、稳定 `page_id`、页面标准章节，并在 Feature Page 的 `admin_pages` 中反向登记；纯开发专用页面不伪造成产品 Feature。
