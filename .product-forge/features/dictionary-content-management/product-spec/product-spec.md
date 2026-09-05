# Product Spec: Dictionary Content Management

> Status: DRAFT | Feature: `dictionary-content-management` | Baseline: `79feb6f7`
> Authority inputs: Dictionary and Knowledge specifications; Content database D-158; Content Versioning & Review; ADR-018/ADR-021; Content API aggregation endpoints; approved Research gate.

## Outcome

Content operators can maintain Word meanings, published-Sentence examples, cross-language equivalents, same-language relations, and tags as one Knowledge aggregate. The runtime Dictionary is a stable, safe read projection over officially published content only.

## In scope

- Chinese and Lao Word aggregate list, working-revision editor, validation, review, publish, Operations exact authorization, and successful-action audit.
- Aggregate replacement endpoints: `PUT /api/v1/admin/content/knowledge/{contentId}/meanings`, `/examples`, `/relationships`, and `/tags`.
- Read-only dictionary lookup/search and detail projection from active, published parent and eligible published targets.
- Forward-only database work only when needed for enforcement or query performance; no change to migrations 0400, 1240, or 1290.

## Out of scope

`dictionary_entries`; independent child IDs or lifecycles; Learning history/favorites; full mobile search; course/practice compilation; audio production; language-structure reconstruction; generic table refactoring.

## User stories

### US-001 — Maintain Word dictionary facts

As a content operator, I can edit all dictionary sections of a Word working revision so that its content is coherent before review.

### US-002 — Validate and review a complete aggregate

As a reviewer/publisher, I can see the whole revision and only approve/publish a valid aggregate so public data remains trustworthy.

### US-003 — Consume safe dictionary data

As a learner-facing client, I can look up/search a Word and receive only its officially published dictionary projection without internal database IDs or unpublished target data.

## Must-have functional requirements

| ID | Requirement | Traceability |
| --- | --- | --- |
| FR-001 | Word `contentId` is the only external dictionary identity; no `dictionary_entries` or child public UUIDs are created. | US-001; Research decision; Dictionary §词典语义; Knowledge §Content Registry |
| FR-002 | Meanings, examples, equivalents, relations, and tags are replaced as aggregate sections of the parent Word working revision and are never independently reviewed or published. | US-001; Research; D-158; Versioning §1–2 |
| FR-003 | Examples reference a Sentence Content target; equivalents are cross-language; relations are same-language; self-reference, duplicate relation semantics, invalid target type, and unpublished targets are rejected at submit/publish. | US-001/002; Dictionary §语义与关系表; Knowledge §释义、翻译、例句和发音 |
| FR-004 | Aggregate mutations use the established parent revision optimistic lock, idempotency behavior, exact category permissions, and synchronous post-commit Operations successful-action audit. | US-001/002; D-158; Versioning §3; Operations RBAC §14.8 |
| FR-005 | Only a legal parent revision may move `draft → pending_review → approved → published`; reject/re-edit remain parent-revision transitions. | US-002; D-158; Content Database Revision section |
| FR-006 | Runtime lookup/search/detail returns only active Word Content with a legal published revision; each included example/equivalent/relation target also has a legal published revision. | US-003; Research; Content API §§2.3–2.4, §10; Versioning §4 |
| FR-007 | Public and Admin DTOs never project internal BIGINT identifiers. Internal child identities may be omitted when not needed by the response. | US-001/003; approved Research; Content API §1, §10; API Standard §6 |
| FR-008 | Lookup/search retain PostgreSQL `pg_trgm`, bounded query and cursor behavior; no Elasticsearch or Learning search-history behavior is added. | US-003; Dictionary §搜索策略; Content API §2.4/§3 |

## Acceptance scenarios

- **FR-001-AS01:** Given an operator edits a Word, when the aggregate is saved, then the public parent UUID remains the only external identifier and child BIGINTs are absent from the response.
- **FR-003-AS01:** Given a draft example targets a non-Sentence, unpublished, or nonexistent Content item, when submit or publish is attempted, then the revision remains non-published and a safe validation error identifies the violated rule.
- **FR-003-AS02:** Given an equivalent uses the same language or a relation crosses language, when validated, then the aggregate is rejected.
- **FR-004-AS01:** Given two editors use the same revision lock value, when one succeeds first, then the stale write returns the standard conflict outcome and writes no dictionary facts.
- **FR-005-AS01:** Given a draft Word revision, when publish is requested directly, then the transition is rejected; only an approved revision can publish.
- **FR-006-AS01:** Given a parent or target is draft, pending review, rejected, disabled, archived, or lacks a published revision, when runtime lookup/search runs, then it does not appear in the public projection.
- **FR-007-AS01:** Given any dictionary runtime or management response, when serialized, then it contains no internal BIGINT value.

## Deterministic acceptance matrix

| FR | Observable acceptance result |
| --- | --- |
| FR-001 | No migration/table/API route creates `dictionary_entries` or a child public UUID; all external mutation URLs use only the parent `contentId`. |
| FR-002 | Saving changes exactly one parent working snapshot; child rows have no status field in an API DTO and cannot be submitted/reviewed/published independently. |
| FR-003 | Duplicate Meaning `(language,sense_order)`, duplicate Example `(sentence,meaning)`, duplicate Equivalent/Relation semantic pair, self-reference, wrong language direction, wrong target type, or an ineligible target produces a validation result and leaves all aggregate sections unchanged. |
| FR-004 | Missing write/review/publish permission rejects the corresponding action before persistence and writes no successful Operations audit. A stale lock returns the standard conflict with zero partial writes. Same Idempotency-Key plus same normalized request returns the recorded result without duplicate publish/audit; same key plus a different request is rejected. After a successful owner commit, Operations records audit synchronously. If that audit fails, return stable internal error, emit critical correlation logging, and instruct the administrator to refresh because the Content action may already be committed. |
| FR-005 | Reject requires a nonblank reason. Direct draft publish/approve fails. A publish preflight or Content transaction failure leaves revision status and publicly queried canonical rows/projection unchanged. Operations audit is not part of the Content transaction and never causes a fabricated Content rollback. |
| FR-006 | Runtime omits a parent and any child target that is draft, rejected, disabled, archived, or lacks a published revision. Exact miss follows the frozen lookup not-found behavior; valid search miss returns `{items:[],nextCursor:null}`. |
| FR-007 | A DTO scan over every runtime and Admin response finds zero internal BIGINT values. |
| FR-008 | Query length outside 1..128, limit above 50, illegal language, or a cursor bound to different filters/sort returns safe validation failure; valid pagination is stable by frozen rank/display/UUID ordering. |

## Snapshot and materialized-query boundary

The parent Knowledge revision snapshot is the working and immutable historical source for all dictionary facts. Meaning, Example, Equivalent, Relation, and Tag have no child lifecycle. If existing normalized tables are used as a public query materialization, their update occurs only in the same successful Content publish transaction as the revision-state switch. After that owner transaction commits, Operations is synchronously called to record the success audit. Under Operations RBAC §14.8, audit failure must not fabricate a Content rollback: return stable internal error, critical-log request/operator/action/target, and require an Admin refresh before retry. The exact persistence technique remains a Plan decision inside existing Content architecture; this spec adds no product rule or new fact owner.

## Locked decisions

- Ownership: Content owns dictionary facts; Learning owns only user dictionary history and is excluded.
- Identity: only Content Word UUID is external; child records are aggregate-internal.
- Lifecycle: one D-158 parent revision state machine; no child lifecycle.
- Public visibility: active parent and legal published revisions for parent and every referenced target.
- API: listed aggregate endpoints are retained; payloads follow current API architecture conventions without exposing child IDs.

## Risks

- Cross-workspace implementation remains high-risk and requires a new human gate after this Product Spec.
- Existing historical Content API wording and newer unified API formatting must be reconciled in implementation documentation using the higher-priority API architecture, without changing endpoint or business semantics.
