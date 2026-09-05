# Feature：后台操作员密码重置

> 创建：2026-09-05｜状态：产品规格待审阅｜Slug：`admin-operator-password-reset`

## 生命周期状态

| 阶段 | 状态 | 文档 |
| --- | --- | --- |
| 问题验证 | 已跳过（事故范围已确认） | — |
| 研究 | 完成 | [research](./research/README.md) |
| 产品规格 | 待审阅 | [product-spec](./product-spec/README.md) |
| 再验证 | 待开始 | — |
| Bridge / Plan / Tasks / Implement / Verify | 待开始 | — |

## 功能描述

有精确权限的后台管理员可为其他 active 后台操作员重置密码；系统在同一事务内更新凭证、撤销全部会话并记录无秘密审计，临时密码只显示一次且首次登录必须修改。
