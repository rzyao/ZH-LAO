---
status: active
last_updated: 2026-09-03
---

# Admin 导航结构

后台侧边栏导航**配置驱动**渲染(ADR-022):菜单结构由运营人员在后台「菜单与路由管理」页面（`/platform/menus`）在线维护,运行时从后端 `platform.menus` 拉取并渲染;配置加载失败时回退内置安全默认导航。

当前的菜单配置结构(seed 预置,等价于原硬编码信息架构):

```text
总览
├── Learning Content
│   ├── Content
│   ├── Learning
│   └── Audio Production
├── Users & Community
│   ├── Identity
│   ├── Social
│   └── Chat
├── Business
│   ├── Commerce
│   └── Rewards
├── Safety
│   └── Trust & Safety
└── System
    ├── Operations
    │   ├── Operators
    │   ├── Roles
    │   └── Audit Logs
    ├── Platform
    │   ├── Feature Flags
    │   ├── Runtime Configs
    │   ├── App Versions
    │   ├── Announcements
    │   ├── Regions
    │   └── Menus（菜单管理）
    └── Design System（开发入口）
```

新增后台页面必须以页面职责、权限、API 和审计要求为中心登记,并在[页面清单](pages.md)和关联 Feature Page 中形成双向关系;同时需在代码中的 `route-registry.ts` 白名单与菜单 seed 配置中登记目标路由。
