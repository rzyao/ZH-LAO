---
status: baseline
date: 2026-08-30
---

# ADR-001：模块化单体与领域 Schema

> **修订记录**：本决策的两处细节已被 [ADR-018 全局数据库设计原则最终版](ADR-018-global-database-design-principles-final.md) 修订——`community` Schema 取消后为九个业务 Schema；「允许跨 Schema Foreign Key」改为「同一 Domain（同一 Schema）内建真实 FK，禁止跨 Domain / 跨 Schema 物理 FK」。此后 [ADR-020](ADR-020-audio-production-domain.md) 新增 `audio` Schema（D-139），业务 Schema 现为十个；[ADR-021](ADR-021-content-and-learning-domain-split.md) 拆分 Learning 为 `content` + `learning`（D-147），业务 Schema 现为**十一个**。模块化单体、单实例单主库、按领域划分 Schema 的核心决策不变。现行口径以 [PostgreSQL 总规范](../architecture/database.md) 为准。

## 决策

采用一个模块化后端、一个 PostgreSQL 实例、一个主数据库和十一个业务 Schema（`identity` / `content` / `learning` / `social` / `chat` / `audio` / `commerce` / `rewards` / `trust` / `operations` / `platform`）。当前不按领域拆微服务或独立数据库；同一 Domain（同一 Schema）内建立真实 FK，**禁止跨 Domain / 跨 Schema 物理 Foreign Key**（跨域只保存对方 logical UUID，见 ADR-018）。

## 原因与后果

首期目标约 10,000 注册用户，由单人主导开发且资金有限。该方案保留业务边界，同时减少部署、监控、网络调用和分布式一致性成本。未来只有在真实负载出现时再评估拆分 Chat、Media 等能力。
