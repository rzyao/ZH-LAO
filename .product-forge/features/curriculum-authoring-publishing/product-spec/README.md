# Product Spec Index：课程编排与发布

> Status: DRAFT · Feature: `curriculum-authoring-publishing`

本规格定义运营端课程 aggregate 编排与 revision 审核发布，并让移动端读取 current published snapshot；不新增学习进度、练习运行态或知识事实。

| Document | Purpose |
|---|---|
| [product-spec.md](product-spec.md) | MVP stories, requirements, constraints and success criteria |
| [journeys/journeys.yml](journeys/journeys.yml) | Four authoritative E2E journeys |
| [metrics.md](metrics.md) | Delivery guardrails |
| [mockups/component-map.yml](mockups/component-map.yml) | Real Admin components mapped to screens |
| [../design-system/manifest.yml](../design-system/manifest.yml) | Read-only harvested design system |

Key decision: ADR-029 makes published pointers and revision snapshots the only current/history resolution model.
