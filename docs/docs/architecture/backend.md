---
status: designing
last_updated: 2026-08-30
---

# 后端架构

后端采用模块化单体，并按十一个业务 Domain 组织模块（D-147 拆分 Learning 为 Content + Learning 后）；具体语言、框架、API 风格、认证中间件、任务队列和部署方式尚未由主架构会话确认。

业务行为由应用服务协调，PostgreSQL 负责引用完整性。详见 [总体架构](overview.md) 和 [PostgreSQL 总规范](database.md)。
