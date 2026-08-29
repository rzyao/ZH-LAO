---
status: baseline
last_updated: 2026-08-30
---

# 总体架构

ZH-LAO 采用模块化单体：一个后端、一个 PostgreSQL 主数据库、一套部署体系，内部按十个业务域隔离代码模块和数据 Schema。Domain 是业务边界，不等同于微服务。

```text
Android Client
      ↓
Modular Backend / API
      ├─ Identity / Learning / Social / Community / Messaging
      └─ Commerce / Rewards / Trust / Operations / Platform
      ↓
PostgreSQL：一个实例、一个主库、十个 Schema
```

该方案面向单人开发、未来多人运营和约 10,000 注册用户的首期规模，优先降低部署、监控和分布式一致性成本。只有在出现真实负载与组织需求时，才评估拆分 Messaging、Media 等高负载能力。

## 横向原则

- 学习身份与社交身份、资格、认证分离。
- 代码定义能力，Feature Flag 决定开放，Rule Config 决定行为。
- 数据库以 PK、FK、UNIQUE、CHECK 保证完整性；应用服务负责跨实体业务动作和 Domain Event。
- Trust & Safety、Operations、Platform 是横向能力，但不夺取业务实体所有权。
- 支付渠道、TTS/AI 模型和审核自动化均通过边界隔离，避免污染核心业务实体。

参见 [Domain Map](domain-map.md)、[数据库规范](database.md) 和 [ADR-001](../adr/ADR-001-modular-monolith-and-domain-schemas.md)。
