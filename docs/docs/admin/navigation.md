---
status: active
last_updated: 2026-09-02
---

# Admin 导航结构

当前代码中的后台页面结构为：

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
    ├── Platform
    │   ├── Feature Flags
    │   ├── Runtime Configs
    │   ├── App Versions
    │   ├── Announcements
    │   └── Regions
    └── Design System（开发入口）
```

新增后台页面必须以页面职责、权限、API 和审计要求为中心登记，并在[页面清单](pages.md)和关联 Feature Page 中形成双向关系。
