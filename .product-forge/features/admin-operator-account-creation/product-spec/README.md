# 产品规格索引：后台操作员账号创建

> 状态：DRAFT｜创建：2026-09-04｜规模：Small

## 文档

| 文档 | 用途 | 状态 |
| --- | --- | --- |
| [product-spec.md](./product-spec.md) | 需求、验收与安全边界 | 待确认 |
| [journeys.yml](./journeys/journeys.yml) | 结构化 E2E 旅程 | 待确认 |
| [线框图](./wireframes/wireframe-create-admin-operator.html) | 新建弹窗布局 | 待确认 |
| [组件映射](./mockups/component-map.yml) | 真实组件到目标代码的映射 | 待确认 |
| [设计系统清单](../design-system/manifest.yml) | 只读的现有组件与 Token 信息 | 已收集 |

## 核心决定

| 决定 | 结论 |
| --- | --- |
| 创建方式 | 以用户名、显示名称创建后台账号与 Operator 映射；系统生成可复制的一次性初始密码 |
| Mobile 关系 | 完全独立，不提升 Mobile 用户 |
| 角色 | 创建完成后由既有角色配置功能分配 |
