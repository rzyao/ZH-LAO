# Review Log：课程编排与发布

> Feature: `curriculum-authoring-publishing` | Status: OPEN | Started: 2026-09-05

## Current Status: UNDER REVIEW

## Open Questions Resolution

| # | Question | Decision | Rationale | Resolved in Revision |
|---|---|---|---|---|
| 1 | Course/Lesson 的 current published view 如何解析？ | ADR-029 的 published/working pointers | 保证原子发布和稳定历史 | v1.0 |
| 2 | LessonItem 如何固定引用 revision？ | Course/Lesson revision snapshot 是唯一 pin 载体 | 不复制知识本体且保持生命周期解耦 | v1.0 |

## Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-09-05 | 采用 ADR-029 | Owner 已确认前向 pointers + immutable aggregate snapshots。 |

## Change History

v1.0: Initial Product Spec from approved Research and ADR-029.

## Revision History

No revisions yet.

## ✅ APPROVED — 2026-09-05

**Approved by user after 0 revision(s).** The user confirmed the governing ADR-029 decision and authorized continuous progression unless a new authority decision is genuinely required.

**Final document inventory:** product-spec.md; journeys/journeys.yml; wireframes.md; metrics.md; mockups/component-map.yml; design-system/manifest.yml.

**Status: LOCKED — Ready for SpecKit Bridge (Phase 4)**
