# Phase 1 Data Model: 管理端通用数据表增强

**Status**: implementation view derived from D-167, ADR-028 and the canonical Content database/API documents.  
**Precedence**: if this file differs from docs/docs/developer/reference/domains/content/database.md, the canonical Content document wins and implementation stops.

## Relationships

```text
content.contents 1--1 content.lo_letters                 (existing physical FK)
content.contents 1--* content.content_revisions          (existing logical UUID link)
content.lo_letter_batch_tasks 1--* batch_task_items       (new physical FK)
Operations Operator UUID 1--* requested_by_operator_id   (logical reference only)
```

Tasks and item results are long-lived Content facts. Operations stores no task copy.

## content.lo_letter_batch_tasks

| Field | Type / nullability | Validation and purpose |
| --- | --- | --- |
| id | bigint identity, required | Internal PK; never exposed. |
| public_id | uuid, required | Unique API task ID. |
| action | varchar(24), required | submit_review, approve, reject, publish, archive. |
| selection_mode | varchar(16), required | explicit_ids or query_all. |
| selection_query | jsonb, conditional | Object required for query_all; normalized query only. |
| selection_hash | varchar(64), required | Lowercase SHA-256 of server-canonical selection. |
| expected_count / target_count | integer, required | Positive and equal after target freeze. |
| reason | text, conditional | Trimmed non-empty for reject/archive; absent otherwise. |
| requested_by_operator_id | uuid, required | Operations logical UUID; no cross-domain FK. |
| idempotency_key | varchar(128), required | Unique with Operator UUID. |
| status | varchar(32), required | queued, running, completed, completed_with_issues, failed. |
| processed/succeeded/failed/skipped_count | integer, required | Non-negative persisted counters. |
| last_error_code | varchar(64), nullable | Safe task-level code only. |
| created_at / updated_at | timestamptz, required | Default now. |
| started_at / completed_at | timestamptz, nullable | Constrained to lifecycle state. |

Invariants: processed equals succeeded + failed + skipped; processed is at most target; completed states require processed equals target. Unique public ID and (Operator, idempotency key). Queue index is (status, created_at) for queued/running; owned history is (requested_by_operator_id, created_at DESC, id DESC). There is no deletion path.

## content.lo_letter_batch_task_items

| Field | Type / nullability | Validation and purpose |
| --- | --- | --- |
| id | bigint identity, required | Internal PK; never exposed. |
| task_id | bigint, required | FK to task, ON DELETE RESTRICT. |
| item_no | integer, required | Positive stable order; unique per task. |
| content_id | uuid, required | Frozen Content logical UUID; unique per task. |
| revision_id | uuid, nullable | Frozen applicable Revision UUID; archive may be null. |
| status | varchar(16), required | queued, running, succeeded, failed, skipped. |
| error_code / error_message | nullable | Safe failed/skipped result only. |
| retry_count | integer, required | Non-negative; incremented only on failed-item retry. |
| last_attempt_at / completed_at | timestamptz, nullable | Attempt and terminal timestamps. |
| created_at / updated_at | timestamptz, required | Default now. |

Index (task_id, status, item_no) supports filtered stable result paging. Succeeded items have no error; failed/skipped items have a safe code. Only failed may return to queued. Retry clears terminal/error fields and atomically adjusts task counters.

## Lao-letter list projection

This is a query projection, not a table:

| API field | Source |
| --- | --- |
| content_id, content_status, updated_at | content.contents public_id/status/updated_at |
| character, letter_type, letter_class, name, romanization, sort_order | active working revision snapshot when present; otherwise published/materialized content.lo_letters |
| working_revision_id/status, lock_version | the one active content.content_revisions row, if any |
| available_actions | Content application calculation; not persisted |

Every query limits language=lo and content_type=lo_letter and appends Content public UUID as the tie-breaker.

## Normalized selection query

The query snapshot contains optional NFC-trimmed q; sorted unique letter_type, letter_class, content_status and revision_status arrays; and explicit sort/order defaults. Page and page_size are excluded. Preview and submit share one parser, normalizer and hash encoder.

For explicit IDs, UUIDs must be valid, non-empty and unique; the server sorts them and verifies expected_count. For query_all, submission re-resolves the complete stable UUID set in its transaction and compares count and opaque hash.

## State Machines

### Batch task

```text
create -> queued -> running -> completed
                  |       -> completed_with_issues
                  -> failed

completed_with_issues or failed
  --[creator has permission and failed items exist]--> queued
```

Completed is terminal. Completed-with-issues without failed items is terminal. No cancel/delete transition exists.

### Batch item

```text
queued -> running -> succeeded
                  -> failed -> queued (explicit retry only)
                  -> skipped
```

Running claim, Content mutation, success audit, terminal item state and counters are one transaction. A crash rolls back the item to queued.

## Per-action Rules

| Action | Permission | Behavior |
| --- | --- | --- |
| submit_review | content.lo_letters.write | Reuse existing draft-to-pending-review guard. |
| approve | content.lo_letters.review | Reuse pending-review-to-approved guard. |
| reject | content.lo_letters.review | Reuse pending-review-to-rejected guard; reason required. |
| publish | content.lo_letters.publish | Reuse approved-to-published transaction/dependency guards. |
| archive | content.lo_letters.write | Set only contents.status=archived; reason required; no physical delete. |

Each committed success uses the matching existing Operations audit mapping with batch_task_id. Permission loss before processing produces skipped/FORBIDDEN and is not retried.

## Transaction Boundaries

1. Preview is read-only and writes nothing.
2. Create task resolves and validates the complete selection, checks idempotency, inserts task and every item, then commits as queued.
3. Process item locks one queued item, rechecks Operator permission, applies one Content command, writes the Operations success audit, updates result/counters, then commits.
4. Finalize locks the task, derives counters from items, checks invariants and writes its terminal state.
5. Retry locks the owned task and failed items, increments retry counters, clears errors/timestamps, adjusts task counters and returns it to queued.

## Failure Mapping

| Condition | Result |
| --- | --- |
| Invalid/unknown input or empty selection | Approved validation/invalid-argument code. |
| Changed preview count/hash | BATCH_SELECTION_CHANGED and no rows written. |
| Same idempotency key, different canonical request | CONFLICT. |
| Active queue saturated | RATE_LIMITED with retry_after_seconds. |
| Non-owner task access | Non-disclosing NOT_FOUND (or the canonical approved auth mapping). |
| No failed item or illegal retry state | BATCH_TASK_NOT_RETRYABLE. |
| Content state/concurrency guard fails | Safe existing Content code on that failed item. |
| Operator disabled/permission revoked | skipped/FORBIDDEN. |
| Unexpected task failure | failed plus safe last_error_code; no internal text. |

## Retention and Privacy

Tasks/items, Operator UUID, reasons and safe results are retained long-term with no deletion handler, as locked by ADR-028. Reason text must not enter logs, metric labels, traces or error messages. Tokens, credentials, IP addresses, SQL, stack traces, database constraint names and internal BIGINTs are never stored or returned in this feature model.
