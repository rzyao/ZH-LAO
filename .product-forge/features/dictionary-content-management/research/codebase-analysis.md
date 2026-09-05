# Codebase Research: Dictionary Content Management

> Feature: `dictionary-content-management`
> Baseline: `79feb6f7b82221da52e8f6bc1cd5f67d4694b415`

## Existing capability

The Content module already has a reusable aggregate revision workflow. `content.contents` provides the sole public/logical UUID for a Knowledge item; `content.content_revisions` stores immutable snapshots and, through migration 1290, enforces the approved `draft → pending_review → approved → published → superseded` workflow with reject/re-edit paths, optimistic `lock_version`, reviewer fields, and one active working revision.

`ManageStructuredContentUseCases` and `PostgresStructuredContentRepository` demonstrate the required mechanics: derive from a published revision, replace a draft snapshot after a lock-version check, validate before submit/publish, and atomically supersede the prior published revision. `structured-admin-routes.ts` provides the established Fastify/Zod/authn/exact-permission/audit pattern. The Admin structured-content feature already provides tables, editing dialogs, review panels, version comparison, and React Query mutations.

## Required delta

Dictionary facts must be modeled inside the snapshot of a `zh_word` or `lo_word` Content aggregate: meanings, sentence-backed examples, cross-language equivalents, same-language relations, and tags. Their database rows retain internal BIGINT identities and are never independently exposed. Aggregate PUT endpoints named by the frozen Content contract replace the set atomically under the parent Content UUID and revision concurrency token.

Public lookup/search must project only the current published, active Word revision. It must never accept a draft-inclusion flag, return child BIGINT identifiers, or join a relation/example target that lacks an eligible published revision.

## Relevant paths

- `database/migrations/0400_content.sql` — frozen Dictionary/Meaning/Example base tables.
- `database/migrations/1240_content_revision.sql` and `1290_content_revision_review_workflow.sql` — frozen baseline plus approved forward workflow.
- `apps/backend/src/modules/content/application/use-cases/manage-structured-content.ts` — reusable aggregate lifecycle pattern.
- `apps/backend/src/modules/content/http/structured-admin-routes.ts` — management route, RBAC, audit, and concurrency pattern.
- `apps/backend/src/modules/content/infrastructure/postgres-structured-content-repository.ts` — snapshot persistence and published resolver pattern.
- `apps/admin/src/features/content/structured/` — established list/edit/review/version UI primitives.

## Constraints for planning

Do not modify migrations 0400, 1240, or 1290. Any required physical enforcement must use the next available forward migration. Do not create `dictionary_entries`, do not duplicate Word facts, do not create per-Meaning/Example/Relation review lifecycles, and do not use the historical `content.knowledge.*` permission names when category-specific D-164 permissions are the applicable current control-plane baseline.
