---
feature: admin-data-table-enhancement
research_dimension: codebase
status: evidence
last_updated: 2026-09-04
---

# Codebase Analysis: Admin data-table enhancement

> Generated: 2026-09-04 | Codebase: `.`
>
> Scope: the admin list foundation needed by content administrators to locate,
> filter, select, review, and perform domain-authorized batch work. This is an
> engineering-reality report, not a source of product, domain, or API truth.

## Architecture Overview

ZH-LAO is a pnpm monorepo. The relevant delivery path is React 19 + Vite +
TanStack Router/Query/Table in `apps/admin`, calling Fastify + Zod domain
routes in `apps/backend`. The client must use public UUIDs and the shared
`ApiClient`; it cannot access PostgreSQL or make the client-side state machine
authoritative. Server-side Operations RBAC is the final authorization decision.

The current admin DataTable is a reusable **client-side** TanStack Table v8
foundation. It owns sorting, column visibility, row selection, and pagination
over the `data` array passed to it. It deliberately has no server-pagination,
query-state, domain-action, permission, or audit contract. This separation is
valid, but means it cannot itself make large content lists or batch review safe.

The only implemented Content management list is Lao letter management. Its
backend exposes `/api/v1/admin/content/letters` and its admin page renders a
bespoke `<Table>`, not the shared `DataTable`. The list currently accepts only
an optional `classification`, returns all matching records, and provides
individual submit/review/publish actions. Thus it is a concrete integration
candidate, but not proof that every Content list shares the same fields or
workflow.

## Reusable Existing Code

| Component/Service | Location | How to reuse |
|---|---|---|
| Generic DataTable | `apps/admin/src/components/data-table/data-table.tsx` | Extend or compose for columns, client sorting/visibility/selection, loading, in-table empty/error states, stable `getRowId`, toolbar slot, and pagination placement. |
| Pagination controls | `apps/admin/src/components/data-table/data-table-pagination.tsx` | Reuse visual control layout, selected-count text, page-size selector, and accessible previous/next buttons; it currently derives totals/pages from loaded rows and therefore cannot be used unchanged for server pages/cursors. |
| Filter bar and toolbar | `apps/admin/src/components/data-table/filter-bar.tsx`, `data-table-toolbar.tsx` | Reuse search input/reset affordance and flexible filter/action layout after a domain page owns debouncing, URL state, and server query parameters. |
| Sortable column header | `apps/admin/src/components/data-table/data-table-column-header.tsx` | Reuse only when the selected sort model is valid for the supplied data/API; today it toggles TanStack client sort. |
| Row-action menu | `apps/admin/src/components/data-table/data-table-row-actions.tsx` | Reuse presentation and disabled state; the owning domain supplies allowed actions and handler. |
| Common table/feedback primitives | `apps/admin/src/components/ui/table.tsx`, `components/feedback/{loading,empty-state,error-state}.tsx` | Preserve existing table semantics, skeleton loading, empty/error/retry states. |
| API and cache base | `apps/admin/src/api/client/http-client.ts`, `apps/admin/src/api/query/query-client.ts` | Use the shared request-id/auth/error handling and TanStack Query cancellation/cache invalidation; feature pages must not call `fetch()` directly. |
| Operations query conventions | `apps/admin/src/features/operations/{api,queries}.ts` | Follow feature-local API wrappers, typed query keys, AbortSignal forwarding, and mutation-driven query invalidation. |
| Content letter workflow | `apps/backend/src/modules/content/{http/admin-routes.ts,application/use-cases/*,infrastructure/postgres-content-repository.ts}` | Reuse the domain routes/use cases for single-record lifecycle operations and the exact Operations public authorization/audit boundary; do not bypass them with a generic table writer. |

## Reference Implementations (Similar Features)

| Feature | Location | Key pattern |
|---|---|---|
| Design-system DataTable demo | `apps/admin/src/pages/system/design-system.tsx` | Demonstrates selection, sortable headers, row menu and client-side pagination against neutral in-memory data; it is not a production domain implementation. |
| Operations operators/roles | `apps/admin/src/features/operations/pages/operators.tsx`, `apps/backend/src/modules/operations/http/routes.ts` | Offset pagination request shape: `page`, `page_size` (1–100), response `items`, `page`, `page_size`, `total`; database uses `LIMIT/OFFSET` and `count(*) OVER()`. |
| Operations audit logs | `apps/admin/src/features/operations/pages/audit-logs.tsx`, `apps/backend/src/modules/operations/http/routes.ts`, `infrastructure/repositories.ts` | Server filtering plus cursor query (`cursor`, `limit`, up to 100) ordered by `(created_at,id)`; response is `items`, `next_cursor`. Current page still passes fetched rows into client pagination, so it is evidence of API capability, not a complete server-pagination UI reference. |
| Lao letter management | `apps/admin/src/features/content/alphabet/{api.ts,components/AlphabetTable.tsx}`, `apps/backend/src/modules/content/http/admin-routes.ts` | Exact permission split and successful-operation audit for individual create/submit/review/publish; current UI is unpaginated and has no search/multi-select/batch route. |

## Integration Points

| Layer | Location | Change Type | Description |
|---|---|---|---|
| Admin shared UI | `apps/admin/src/components/data-table/` | Extend / compose | Add a server-aware table state boundary only after a concrete API contract identifies paging, supported sort/filter parameters, and selection scope. Keep the existing client-data mode compatible. |
| Content list UI | `apps/admin/src/features/content/alphabet/` | Migrate / extend | This is the existing content-review list most directly affected: replace its bespoke table or compose shared primitives, bind list state to a feature-local query, and retain status-dependent actions. |
| Content read API | `apps/backend/src/modules/content/http/admin-routes.ts`, `application/use-cases/list-managed-characters.ts`, `infrastructure/postgres-content-repository.ts` | Extend, if product scope includes letter list at scale | Add only owner-approved list filters/search/sort/pagination. Existing repository returns every matching letter and lacks an offset/cursor input or total query independent of materialized results. |
| Content mutations | same Content route/use-case paths | Potential new domain commands | Batch review cannot be formed by looping table calls unless the Content owner defines its state, authorization, idempotency, concurrency, failure, and audit semantics. |
| Operations authorization/audit | `apps/backend/src/modules/operations/public/`, Content `admin-routes.ts` | Reuse | Each successful owner-domain mutation must authorize exact permission through Operations and record success through `OperationsAuditRecorder`; Content must not write Operations audit tables directly. |
| Frontend query/cache | `apps/admin/src/features/content/` (new feature-local query module) | Add | Adopt the Operations feature pattern: query keys include canonical filter/paging values and mutations invalidate affected list keys. |
| Tests | `apps/admin/src/components/data-table/data-table.test.tsx`, feature-local Vitest tests; backend domain/http tests | Extend | Cover client vs server paging behavior separately, selection reset/persistence policy, URL/query serialization, confirmation/error states, permission-denied recovery, and domain batch outcomes once contracts exist. |

## Codebase Constraints

| Constraint | Source (file / ADR) | Impact on Feature Design |
|---|---|---|
| API boundary uses `snake_case`; external IDs are UUIDs; admin never directly accesses DB. | `docs/docs/developer/reference/architecture/applications/{api-standard.md,clients.md}` | List query/filter and response fields must preserve these contracts. Do not introduce internal IDs or frontend-side data access. |
| Business responses use a top-level `code` envelope and `request_id`; client success is `code === 'OK'`. | `api-standard.md`, ADR-023, `apps/admin/src/api/client/http-client.ts` | New/changed APIs must follow the envelope and use the shared client. Existing Content/Operations endpoints contain older ad-hoc response shapes, a repository drift to resolve rather than copy. |
| API query names are `snake_case`. | `api-standard.md` | The shared `PageParams` helper currently serializes `pageSize` (camelCase), while live Operations APIs consume `page_size`; do not use that helper for a new server contract without correction/owner-approved consolidation. |
| Client-side capability gates are UX only; server is final RBAC and owner domain decides state guards. | `architecture/applications/clients.md`, `docs/docs/developer/reference/domains/operations/rbac.md` | Selection UI must not imply permission. A batch endpoint/action requires exact server authorization and per-record lifecycle validation. |
| Content revision lifecycle is owner-defined and concurrency-protected. | `docs/docs/developer/reference/domains/content/versioning-review.md`, D-158 | Batch review/publish must preserve `draft → pending_review → approved → published → superseded` plus rejection paths, `lock_version`, and `Idempotency-Key` requirements. A table must not invent direct transitions. |
| Success audits are append-only and recorded after successful domain actions. | `docs/docs/developer/reference/domains/operations/audit.md`, Content `admin-routes.ts` | Batch work must have an approved audit design. A generic DataTable cannot satisfy this by itself. |
| Admin visual/accessibility standard applies to all changed UI. | `apps/admin/AGENTS.md`, `apps/admin/DESIGN.md` | Preserve header scopes/caption, in-table empty state, skeleton rows, focus/touch targets, keyboard table behavior, selected-row state, pagination placement, and confirmation for destructive actions. |
| Frozen migrations and public contracts may not be rewritten to match implementation. | repository `AGENTS.md`, `docs/docs/developer/DOCUMENT_CONTRACT.md` | Use forward migrations only if an owner-approved data/API change truly needs them. This UI-foundation feature has no inherent schema change. |

## Event / Message Patterns

N/A — no event/message integration is required for the generic table foundation.
Content’s existing individual lifecycle operations append Operations success audits;
any new domain batch command must follow that boundary but no batch event identifier
or payload has been specified.

## Data Model Impact

No new database schema is implied by search, filters, client selection, URL state,
or a reusable table component. Existing records already expose public UUIDs and
the Content revision lifecycle carries its own status and `lock_version`.

If this feature is extended to server-side list queries, database impact depends
on the owner-approved searchable/filterable/sortable fields and target list size:
indexes and query plans must be assessed per owning domain. If it includes batch
review, a new Content API/application contract may be needed, but no table or
audit data model can be inferred from the current product assumption.

## Exact Unresolved Product / Domain / Contract Gaps

1. **Target records and scope are unspecified.** The problem statement names
   content administrators and batch review but does not identify which Content
   entity lists beyond the implemented Lao letter list are in scope. `pages.md`
   lists no formal content-review page. A generic component cannot decide fields,
   status labels, or filters.
2. **Batch-action semantics are missing.** `versioning-review.md` defines the
   per-revision state machine and explicitly leaves the review authorization
   matrix unresolved; it does not define a batch endpoint, atomicity policy,
   partial-failure result, maximum selection, confirmation content, or audit
   granularity. Existing routes provide only single-revision submit/review/publish.
3. **Selection scope is unresolved.** The product input requires multi-select
   but does not say whether it is page-local or spans server pages/filtered
   result sets, nor what happens when filters/data change. This determines the
   row-ID store, count presentation, and safe request payload.
4. **Search/filter/sort contract is absent.** The Content letters endpoint
   supports only `classification`; its repository has a fixed ordering and
   no pagination/search/sort input. Search fields, match semantics, allowed
   filters, sort whitelist/defaults, and stable ordering must be owned by
   Content—not derived from table columns.
5. **Pagination contract is not chosen for the target list.** The admin
   foundation declares Offset and Cursor as separate supported modes, but its
   implementation is client-only. Operations demonstrates both shapes, while
   the Content letters list is unbounded. The domain/API owner must choose a
   mode and define response metadata before implementation.
6. **API migration drift must not be extended.** ADR-023 requires all business
   routes to return `{ code, data?, error?, request_id }`, but existing Content
   letter routes and most Operations list routes return legacy bare payloads;
   `operations/api.ts` parses those bare shapes. The new feature must target the
   canonical envelope and its owner must decide whether its delivery includes
   fixing the directly touched legacy endpoints; it must not introduce a third
   response shape.

## Technical Complexity

- **Overall:** Medium for a reusable, server-aware presentation foundation;
  High if this phase also owns generic batch mutation semantics across Content
  domains.
- **New modules:** likely a server-pagination adapter/state contract and
  feature-local content list query module; a Content batch command only after
  an owner-approved contract.
- **Breaking-change risk:** Medium. Existing `DataTable` consumers expect
  client-side data and pagination; preserving this mode is necessary. API
  envelope drift and unbounded Content list behavior increase integration risk.
- **Estimated touch points:** 6–12 admin files for the foundation plus one
  content list integration; backend/API touch points are indeterminate until
  the unresolved contract gaps are decided.

## Current Tech Capabilities

The repository already provides TanStack Table v8, TanStack Query cancellation
and cache invalidation, TanStack Router search validation, Zod validation,
shared request IDs/auth/error handling, table loading/empty/error components,
status badges, confirmation dialogs, and Operations permission/audit public
ports. These remove the need for a new table library or a generic client-side
authorization/audit mechanism.

## Implementation Guidance

1. Keep the shared DataTable domain-neutral: provide controlled/manual modes
   for owner-supplied server metadata and selection callbacks while retaining
   the existing client-array behavior for current callers.
2. Establish the specific Content list/API contract before implementing search,
   filter, sorting, pagination, or batch mutation. The domain should own valid
   fields, state guards, exact permission(s), idempotency/concurrency, audit,
   and result shape.
3. Treat Lao letter management as the first integration candidate, but migrate
   it only alongside the required API/envelope and workflow decisions. Do not
   make its current individual actions a universal content-review contract.
