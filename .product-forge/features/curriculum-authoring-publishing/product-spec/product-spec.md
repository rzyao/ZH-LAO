# Product Spec：课程编排与发布

> Status: DRAFT · Feature: `curriculum-authoring-publishing` · Size: Large · 2026-09-05
> Related: [Research](../research/README.md) · [ADR-029](../../../../docs/docs/developer/reference/adr/ADR-029-curriculum-revision-published-view.md) · [Journeys](journeys/journeys.yml) · [Metrics](metrics.md)

## Overview

运营人员需要在管理端把已发布的 Content 组织成可审核、可发布、可追溯的课程；学习端只读取稳定的 published course/lesson snapshot。本 Feature 建立从 Course 创建、Unit/Lesson/Section/Item 编排、审核发布到移动端只读的最小垂直闭环。

Primary persona 是具备 `content.curriculum.*` 精确权限的运营人员；学习者是只读消费者。Content 拥有课程、知识、revision 与发布；Operations 只提供 RBAC 和操作审计；Learning 不在本 Feature 写入进度或其他用户状态。

## Must-have stories

- **US-001** 作为课程运营人员，我要创建和编辑课程基础信息及工作版本，以便维护可审核的课程草稿。
- **US-002** 作为课程运营人员，我要在课程中维护 Unit、Lesson、Section 和 Item 的顺序，并只选择已发布内容 revision，以便形成稳定教学路径。
- **US-003** 作为审核/发布人员，我要提交、批准、驳回和发布课程/课节版本，以便草稿不能绕过审核且每次发布可审计。
- **US-004** 作为学习者，我要读取合法 published 的课程、结构和课节内容，以便不会看到草稿且历史 revision 可稳定解析。

## Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-001 | 管理端按 UUID 创建、查看、编辑 Course；课程语言、标题、描述、availability projection 和排序均进入 working revision 语义。 | Must |
| FR-002 | Course structure aggregate 支持 Unit → Lesson → Section → Item 的创建、编辑、删除和排序；Unit/Item 不暴露 BIGINT。 | Must |
| FR-003 | Item 只能引用合法 published Content/Exercise revision；保存失败必须定位非法引用的位置。 | Must |
| FR-004 | Course/Lesson revision 状态机仅允许 draft → pending_review → approved → published → superseded，含 reject/re-edit/revoke-approval 的既有规则。 | Must |
| FR-005 | 发布事务必须校验权限、幂等键、锁版本、完整结构和引用版本，再原子切换 revision pointers、旧版 supersede、availability projection、审计与事件。 | Must |
| FR-006 | 任何 published Course/Lesson 修改都派生新的 working revision；词条发布不得改写课程 snapshot 或 Learning 历史。 | Must |
| FR-007 | Runtime Course catalog、structure、Lesson content 仅投影合法 published current view；history 仅按 revision UUID 解析。 | Must |
| FR-008 | Admin 明确显示 draft、pending_review、approved、published、rejected、superseded/history，并复用现有 DataTable、StatusBadge、ConfirmDialog。 | Must |

## Acceptance conditions

- Given a draft revision, when a user requests publish, then the request is rejected without an approved revision.
- Given a published course, when editing starts, then its published pointer and learning-facing snapshot remain unchanged while one working revision exists.
- Given an Item references a draft/rejected/unpublished revision, when structure is saved or published, then the transaction fails with a typed Content error naming the Item position.
- Given an approved aggregate and valid idempotency/concurrency tokens, when publish succeeds, then the new pointer and availability projection are visible together, the prior published revision is superseded, and an Operations audit entry exists.
- Given a learner requests a draft, pending, rejected, archived, or pointerless course/lesson, when runtime resolves it, then no draft/snapshot/internal ID is disclosed.

## Non-functional constraints

- All client IDs are logical/public UUIDs; internal BIGINT is never serialized.
- Every write requires exact Operations permission, optimistic concurrency and idempotency; transaction boundaries follow ADR-029.
- Admin UI meets the existing design system and keyboard/focus behavior; loading, empty, validation and stale-conflict states are explicit.
- No frozen migration, existing generic table behavior, language hierarchy, audio production, progress, answers, recommendation, payment or social scope is changed.

## Out of scope

Dictionary construction; practice/question-bank authoring and attempts; learning progress; audio production/review; bulk Lao alphabet actions; generic DataTable refactor; Chinese/Lao knowledge hierarchy rebuild; search, recommendation, payment and social.

## Success criteria

1. Published course/lesson reads never disclose a non-published revision.
2. Published aggregate edits always use a successor revision; direct modification is rejected.
3. A publish either updates every required state/audit record or updates none.
4. All runtime and Admin DTO tests contain zero internal BIGINT fields.

## Risks and decisions

ADR-029 resolves revision pointers and snapshot pins; its forward migration remains unimplemented. Existing Content/Admin features overlap files, so implementation must use file-level coordination and preserve their changes.
