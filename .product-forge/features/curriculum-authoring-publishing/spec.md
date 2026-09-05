# Spec：课程编排与发布

> Product Forge Feature · `curriculum-authoring-publishing` · SpecKit mode: classic · 2026-09-05
> Sources: [Product Spec](product-spec/README.md) · [Research](research/README.md) · [Review](review.md) · [ADR-029](../../../docs/docs/developer/reference/adr/ADR-029-curriculum-revision-published-view.md)

## Overview

在 Content 模块中实现课程/课节的 revisioned aggregate authoring、审核发布与学习端 published-only 读取。课程 snapshot 固定编排及所引用的已发布 Content/Exercise revision；Learning 只读且能保存 immutable revision UUID。

## Prerequisites

| Priority | Feature | Status | Relationship | What's needed |
|---|---|---|---|---|
| P1 | chinese-lao-content-hierarchy | partial | complements | 复用已实现的 Content revision、授权和公开读取模式；不修改该 Feature 范围。 |
| P1 | admin-data-table-enhancement | partial | complements | 课程列表消费稳定 DataTable 能力，不作通用表格重构。 |

## Goals and non-goals

运营人员可创建/编排/审核/发布课程，学习者仅读取合法 current published snapshot。进度、答题、推荐、支付、社交、字典、音频生产及知识层级重建均不在范围。

## Must-have user stories

- **US-001** 创建/编辑 Course working revision；保存返回 UUID 与 concurrency token。
- **US-002** 编排 Unit/Lesson/Section/Item，只固定已发布引用 revision。
- **US-003** 提交、审核、驳回、重编辑与原子发布 Course/Lesson revision。
- **US-004** 在移动端读取 course catalog、structure、lesson content 的 published snapshot。

## Functional requirements

| ID | Requirement | Source |
|---|---|---|
| FR-001 | Course 与 Lesson 必须维护 ADR-029 定义的 published/working revision pointers，且只通过新前向 migration 落地。 | US-001, US-003 |
| FR-002 | Admin create/update/structure replacement 必须在 root lock 下校验 expectedUpdatedAt、expectedLockVersion、精确权限和 Idempotency-Key。 | US-001, US-002 |
| FR-003 | Course/Lesson snapshot 固定五级编排；Item 仅存内容/练习 logical UUID 和 published revision UUID，不复制知识本体。 | US-002 |
| FR-004 | 结构保存与发布必须拒绝不存在、非 published、不匹配类型或不可见的引用，并返回安全的 item-position 错误。 | US-002 |
| FR-005 | 审核生命周期只允许 draft → pending_review → approved → published → superseded，以及 pending_review → rejected → draft、approved → draft。 | US-003 |
| FR-006 | Publish 在单一事务中更新目标 revision、pointers、旧版 supersede、availability projection、Operations audit 和 Content event；失败不得有部分可见状态。 | US-003 |
| FR-007 | Published aggregate 的编辑必须派生一个 working revision；知识/练习后续发布不得改变 Course/Lesson snapshot 或 Learning history revision UUID。 | US-002, US-003 |
| FR-008 | Runtime endpoints 仅解析合法 published pointer；不泄露 draft/pending/rejected/archived snapshot、内部 BIGINT 或 includeDraft escape hatch。 | US-004 |
| FR-009 | Admin 复用 DataTable、StatusBadge、ConfirmDialog 和 EditPageLayout，明确列出 lifecycle 状态与审核动作。 | US-001, US-003 |

## Non-functional requirements

| NFR | Signal / query | Threshold |
|---|---|---|
| Draft isolation | Runtime contract/integration test | 0 draft fields or non-published revisions returned |
| Publish atomicity | Transaction integration test after forced validation/audit failure | 0 partial pointer/status/audit mutations |
| Client identity safety | HTTP DTO serialization tests | 0 internal BIGINT keys |
| Concurrency | Concurrent structure/publish tests | stale writer receives typed conflict; one legal current pointer |
| Accessibility | Admin Playwright + axe checks | WCAG AA automated floor passes |

## API contracts

| ID | Operation |
|---|---|
| API-adminCourseList | GET `/api/v1/admin/content/courses` |
| API-createCourse | POST `/api/v1/admin/content/courses` |
| API-replaceCourseStructure | PUT `/api/v1/admin/content/courses/{courseId}/structure` |
| API-submitCourseRevision | POST `/api/v1/admin/content/courses/{courseId}/revisions/{revisionId}/submit` |
| API-reviewCourseRevision | POST `/api/v1/admin/content/courses/{courseId}/revisions/{revisionId}/review` |
| API-publishCourseRevision | POST `/api/v1/admin/content/courses/{courseId}/revisions/{revisionId}/publish` |
| API-runtimeCourseCatalog | GET `/api/v1/content/courses` |
| API-runtimeCourse | GET `/api/v1/content/courses/{courseId}` |
| API-runtimeCourseStructure | GET `/api/v1/content/courses/{courseId}/structure` |
| API-runtimeLessonContent | GET `/api/v1/content/lessons/{lessonId}/content` |

## Technical context

Implement inside `apps/backend/src/modules/content` using its application/domain/infrastructure/http layers; consume Operations public permission/audit contracts; implement Admin under `apps/admin/src/features/content/courses`; implement Mobile under `apps/mobile/src/features/courses`. Reuse structured-content revision patterns but do not conflate course aggregates with language-knowledge entities. Database changes are new migrations only; frozen `0400`, `1240`, `1290` remain intact.

## Required verification

- Unit/integration tests cover every legal and illegal revision transition, active-work guard, idempotency, stale-lock rejection, pointer atomicity, reference validation, no draft leakage, UUID-only DTOs and history immutability.
- E2E plans must cover every `JRN-*` and P0 `EDGE-*` in [journeys.yml](product-spec/journeys/journeys.yml).
