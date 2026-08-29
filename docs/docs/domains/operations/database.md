---
status: designing
last_updated: 2026-08-30
schema: operations
---

# Operations 数据库待设计项

预期表达 StaffAccount、Role、Permission、StaffRole、WorkQueue、WorkAssignment、ContentPublishTask、UserOperation、MetricDefinition 和 Dashboard。

Audit 基础设施归 Platform；Operations 需要引用审计结果。具体 RBAC 模型、工作队列并发、运营操作幂等和字段尚未决定。
