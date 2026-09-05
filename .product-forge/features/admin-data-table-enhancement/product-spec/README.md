# 产品规格索引：管理端通用数据表增强

> 状态：APPROVED｜创建：2026-09-04｜批准：2026-09-05｜Feature：`admin-data-table-enhancement`

## 构建内容

为内容管理员提供统一、可访问且可追溯的字母审核列表：先用搜索、筛选和排序定位记录，再跨页选择当前查询结果、发起需要确认的批量命令，并查看异步任务的逐项结果。

## 文档地图

| 文档 | 用途 | 状态 |
| --- | --- | --- |
| [product-spec.md](./product-spec.md) | 主规格、范围、需求与风险 | APPROVED |
| [journeys/journeys.yml](./journeys/journeys.yml) | 3 条结构化 E2E 旅程 | APPROVED |
| [wireframes/](./wireframes/) | 两个基础 HTML 线框 | APPROVED |
| [metrics.md](./metrics.md) | 成功标准与指标 | APPROVED |
| [mockups/index.html](./mockups/index.html) | 两状态可点击原型 | APPROVED |
| [mockups/component-map.yml](./mockups/component-map.yml) | 区域到真实组件的映射 | APPROVED |
| [digest.md](./digest.md) | 下游阶段摘要 | APPROVED |

## 关键决策

- 首个接入页为 `/content/lo/letters`。
- 首期批量动作：提交审核、审核通过、驳回、正式发布、软删除；不含上线/下线。
- 选择可从本页显式升级为当前筛选结果全部；无数量上限。
- 批量命令异步执行、逐条校验并返回成功/失败/跳过结果；所有动作均二次确认，驳回和删除必须填写原因。

> 以上批量业务决策已由 D-167、ADR-028 及 Content 数据库/API 权威接受；本索引仅作编排入口，不能替代权威契约。
