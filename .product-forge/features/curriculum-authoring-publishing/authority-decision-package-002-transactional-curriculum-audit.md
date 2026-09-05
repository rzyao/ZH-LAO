# Authority Decision Package ADP-003 — Curriculum transactional Operations audit

**Status:** accepted  
**Date:** 2026-09-05  
**Decision owner:** Operations / Architecture authority  
**Scope:** public Operations boundary only; no frozen migration change.

## Decision requested

Accept a generic, Content-safe Operations transaction boundary that lets a Content
publish transaction insert its own successful audit record through the Operations
public contract. The boundary must accept a UUID logical target and allow only
whitelisted, non-sensitive metadata; it must not expose Operations persistence
tables or accept Content BIGINT identifiers.

**Accepted resolution:** 用户于 2026-09-05 批准。正式权威记录于 [ADR-030](../../../docs/docs/developer/reference/adr/ADR-030-transactional-owner-domain-audit-boundary.md)。

## Evidence

- ADR-029 §4 requires target revision state, root pointers, old revision
  supersede, availability projection, Operations audit, and Content event to
  succeed or roll back together.
- `OperationsAuditRecorder.recordSuccessfulAction()` operates on the ordinary
  database executor outside a caller-owned transaction.
- `OperationsBatchWorkerBoundary.recordSuccessfulActionInTransaction()` exists,
  but its public input is permanently specialized to a Lao-letter batch task
  (`contentId`, `batchTaskId`, and a fixed target type).

Calling the ordinary recorder after a Content transaction produces an observable
published course without its required audit record when audit persistence fails.
Calling Operations repositories directly would bypass the established public
module boundary.

## Proposed public shape

```ts
interface OperationsTransactionalAuditBoundary {
  recordSuccessfulActionInTransaction(
    executor: DatabaseExecutor,
    input: {
      operatorId: string;
      actionKey: string;
      target: { domain: 'content'; type: 'course' | 'lesson'; id: string };
      details?: Readonly<Record<string, unknown>>;
      requestContext?: { requestId?: string; ipAddress?: string };
    },
  ): Promise<void>;
}
```

The existing batch-specific method may remain during a compatible transition or
be implemented on top of this shape. Permission checking remains at the HTTP
boundary; publish still locks the Content aggregate and validates every pinned
revision in its own transaction.

## Alternatives rejected

1. Record the audit after commit — contradicts ADR-029 atomicity.
2. Let Content insert `operations.operator_audit_logs` directly — violates the
   Operations public boundary.
3. Reuse a fake batch task — corrupts audit semantics and introduces a false
   dependency.

## Consequence if not accepted

Course/Lesson publish endpoints cannot be honestly implemented as transactional
operations. Draft authoring and public pointer-only reads can proceed, but the
publish task remains blocked.
