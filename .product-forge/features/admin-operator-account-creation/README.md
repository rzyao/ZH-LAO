# Feature: 后台操作员账号创建

> 创建：2026-09-04｜模式：Lite｜状态：等待产品规格确认
> Slug: `admin-operator-account-creation`

## 目标

将“新建操作员”从手工输入内部 UUID，优化为创建独立的后台登录账号并自动建立 Operator 映射。

## 生命周期

| 阶段 | 状态 | 工件 |
| --- | --- | --- |
| 产品规格 | 已完成，待确认 | [product-spec/](./product-spec/README.md) |
| 技术方案 | 待开始 | [plan.md](./plan.md) |
| 实现 | 待开始 | — |
| 验证 | 待开始 | [verify-report.md](./verify-report.md) |

## 关键边界

- 后台账号独立于 Mobile 注册流程。
- 不要求操作者输入或了解 UUID。
- 复用 Identity 的后台认证与 Operations 的 Operator/RBAC 边界；不增加数据库表。
