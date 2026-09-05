# Gate Review：课程编排与发布

> Feature: `curriculum-authoring-publishing` | Updated: 2026-09-05T00:00:00+08:00 | Reviewed against: `79feb6f7b82221da52e8f6bc1cd5f67d4694b415`
> Risk: 🔴 high (authority / frozen-database decision required) → routing: block pending explicit human approval and owner decision

## Summary

| Severity | Open | Acknowledged | Resolved |
|---|:---:|:---:|:---:|
| ❌ CRITICAL | 0 | 0 | 0 |
| 🔶 HIGH | 0 | 0 | 1 |
| 🔸 MEDIUM | 1 | 0 | 1 |
| ▪️ LOW | 1 | 0 | 0 |

**Gate verdict:** PASS WITH CONDITIONS · **New since last review:** 0

## Findings by cohort

### Contract: Course/Lesson published view

- **F-001** · ✅ HIGH · resolved@`79feb6f` · `research/authority` · ADR-029 accepts forward Course/Lesson published/working pointers and atomic published-view semantics. → Physical migration remains a later implementation task.
- **F-002** · ✅ MEDIUM · resolved@`79feb6f` · `research/database` · ADR-029 accepts Course/Lesson revision snapshots as the single LessonItem revision-pin carrier. → Snapshot schema and validation are later implementation tasks.

### General

- **F-003** · ❌ LOW · `research/integration` · raised@`79feb6f` · Existing `chinese-lao-content-hierarchy` and `admin-data-table-enhancement` work overlaps Content/Admin paths. → Preserve current changes and coordinate file ownership before implementation.
- **F-004** · ⚠️ MEDIUM · `code-review/quality` · raised@working-tree · `apps/admin/src/features/content/courses/pages/course-detail.tsx` concentrates several workbench concerns. → Non-blocking follow-up decomposition recommended; no lifecycle, authorization, or data-integrity defect found.

## Suggested canonical-spec updates

| FR / domain | Current canonical text | Observed-from-code / DB fact | Proposed delta |
|---|---|---|---|
| Content versioning / curriculum | Published pointer must switch atomically | Course/Lesson frozen rows have no pointer | Owner decision package ADP-001; update owning authority if a forward model is accepted. |
| Curriculum mounting | Structure references published content; history resolves revision UUID | LessonItem has only internal FKs | Owner decision package ADP-002; record a single fixed-revision rule in the owning authority. |
