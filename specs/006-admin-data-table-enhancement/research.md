# Phase 0 Research: 管理端通用数据表增强

**Date**: 2026-09-05  
**Scope**: implementation choices derived from the approved spec and canonical Content authority; this document is not a new product/domain authority.

## Decision 1: Opt-in controlled server mode for the shared DataTable

**Decision**: Add optional externally controlled pagination, sorting, row selection, row/page totals and change callbacks using TanStack Table manual modes. With no server configuration, retain today's internal client sorting/pagination/selection unchanged.

**Rationale**: Existing callers depend on client mode; /content/lo/letters needs accurate server totals and URL-owned state. This is the smallest compatible, domain-neutral seam.

**Alternatives considered**: A server-only replacement would break NFR-005; a second bespoke letter table would duplicate the foundation; putting Content actions/query-all inside DataTable would violate domain ownership.

## Decision 2: Separate client state owners

**Decision**: TanStack Router owns query/filter/sort/page/page-size; TanStack Query owns server cache/invalidation; React local state owns dialogs and none/page_ids/query_all selection; a versioned local-storage key owns only Lao-letter column visibility.

**Rationale**: URLs remain refreshable, stale selection cannot survive target-changing queries, and column preference persists without creating the excluded saved/shared-view feature.

**Alternatives considered**: No global store is needed; columns do not belong in the URL; selection must not persist locally.

## Decision 3: Letter-specific query service and one normalizer

**Decision**: Create a Lao-letter query port/use case instead of adding arbitrary filters to generic structured Content. One strict normalizer serves list, selection preview and batch submission. SQL columns/orders come only from static maps and all values remain bound.

**Rationale**: The whitelist is letter-specific and must not become an implicit contract for other Content categories.

**Alternatives considered**: Browser filtering cannot provide stable server paging; generic dynamic SQL would be unsafe and outside authority.

## Decision 4: Server-only opaque selection hash

**Decision**: Preview and submit use one private versioned fixed-field UTF-8 encoding of the normalized query followed by sorted Content UUIDs, hashed with SHA-256. The browser only returns the opaque hash. Explicit IDs are validated, sorted and hashed server-side too.

**Rationale**: This avoids client/server canonicalization drift and detects membership changes even when the count is unchanged.

**Alternatives considered**: Count-only checks are insufficient; returning all query-all UUIDs to the browser defeats large-result handling; holding a transaction across confirmation is unsafe.

## Decision 5: PostgreSQL queue in the existing worker

**Decision**: Register a Content polling job in WorkerHost; use the approved task/item tables and FOR UPDATE SKIP LOCKED. Initial settings are 1 s polling, 50 items per cycle, four concurrent item transactions, 100 active tasks, and a 5 s admission retry hint.

**Rationale**: ADR-028 selects a durable PostgreSQL state machine. Runtime bounds protect capacity but do not limit target count.

**Alternatives considered**: In-memory work is not durable; system outbox is not the task owner; a broker/event contract is explicitly out of scope; one large transaction conflicts with partial success.

## Decision 6: Atomic Content mutation and Operations audit

**Decision**: Add narrow Operations public ports for permission recheck by stored Operator UUID and audit insertion on a supplied transaction executor. The item transaction contains permission check, existing Content lifecycle behavior, success audit, item terminal state and task counter update.

**Rationale**: Best-effort audit after a committed mutation creates an ambiguous retry. A transaction-aware public port preserves Operations ownership without Content importing its repository.

**Alternatives considered**: Direct Content writes to Operations violate ownership; delayed event audit adds an unapproved event and permits unaudited committed success.

## Decision 7: Recovery through transaction shape, not a lease column

**Decision**: Claim and finish an item in the same transaction. Crash rolls that item back to queued; a task already marked running remains eligible while queued items exist.

**Rationale**: It provides restart and multi-worker safety using only approved fields. No unapproved lease/worker column is needed.

**Alternatives considered**: Persisted running claims need a new lease contract; startup-wide resets can corrupt a healthy concurrent worker; process mutexes do not protect multiple instances.

## Decision 8: Validate rather than speculate on indexes

**Decision**: Evaluate trigram/B-tree indexes for materialized character/name/romanization/filter/order fields, partial expression indexes for the same fields in active revision snapshots, and Content status/update lookup. Retain only indexes supported by representative EXPLAIN (ANALYZE, BUFFERS) evidence.

**Rationale**: pg_trgm exists, but 500-row responses and broad substring searches require measured plans. Indexing every permutation would add needless write/storage cost.

## Decision 9: Poll progress instead of adding a realtime contract

**Decision**: The visible active task polls every 2 s, stops at terminal state, invalidates the current list and announces completion through an accessible live region.

**Rationale**: It satisfies the approved journey with existing HTTP contracts and no broker/WebSocket dependency.

## Decision 10: No contract refinement is needed

**Decision**: Leave contracts/openapi.yaml and contracts/asyncapi.yaml unchanged.

**Rationale**: The plan adds no endpoint/event beyond the six stable bridge operation IDs. Worker controls are internal and tasks remain non-cancellable.

## Prior Lessons Applied

None. Product Forge research/README.md contains no section titled exactly “Prior lessons that apply”.
