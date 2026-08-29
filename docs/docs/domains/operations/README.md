---
status: baseline
last_updated: 2026-08-30
---

# Operations 域

Operations 负责“运营人员如何控制产品”，按未来多人运营设计，不是简单 Admin CRUD。

## 子域与实体

- Staff：StaffAccount。
- RBAC：Role、Permission、StaffRole。
- Workbench：WorkQueue、WorkAssignment。
- Content Ops：ContentPublishTask。
- User Ops：UserOperation。
- Analytics：MetricDefinition、Dashboard。

## 业务基线

后台覆盖管理员、角色、权限、用户运营、内容运营、审核工作台、商业运营、Reward 运营和数据看板。预期角色包括 Super Admin、Content Operator、Customer Service、Reviewer、Finance 和 Growth Operator；这些名称是当前角色模型基线，精确权限为 `designing`。

Operations 发起和审计跨域操作，但不复制或取得业务实体所有权。

## 数据库状态

实体为 `baseline`；Staff 认证、权限粒度、队列领取、敏感操作审批、字段和索引均为 `designing`。
