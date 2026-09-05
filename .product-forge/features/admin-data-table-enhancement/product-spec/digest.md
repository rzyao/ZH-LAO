# Product Spec — Digest

> **Feature:** admin-data-table-enhancement
> **Phase:** product-spec
> **Generated at:** 2026-09-05T00:00:00Z
> **Artifact owner:** speckit.product-forge.product-spec

## Diff since last approved state

Initial version — no prior state.

- Added: standard product spec, three structured journeys, two HTML wireframes, two project-grounded mockups, metrics and traceability journey block.

## Key decisions

- The first integration is `/content/lo/letters`; the operation column stays fixed.
- The flow supports explicit cross-page selection of current query results with no action-count limit.
- Submit, approve, reject, publish and soft delete execute asynchronously per record; all require confirmation and reject/delete require a reason.
- Content owns each submitted task and its frozen target IDs/results; Operations supplies authorization and successful-action audit only; failed items can be retried, submitted tasks cannot be cancelled, and records are retained long-term.
- The letter list searches character/name/romanization; filters letter type/class, content status and working-revision status; uses whitelisted stable sorting; and pages at 50 by default with a maximum of 500.
- Batch-task history and retry are visible only to the Operator who created the task.

## Artifacts produced

- `product-spec/product-spec.md` — user scope, requirements, risks and decision log.
- `product-spec/journeys/journeys.yml` — authoritative JRN-001 through JRN-003 source.
- `product-spec/wireframes/` and `product-spec/mockups/` — two states and component map.
- `product-spec/metrics.md` — success metrics and guardrails.
- `traceability.yml` — seeded journeys block; downstream fields remain intentionally absent.

## Open risks

- Mitigated: Content batch query/task/command, soft-delete, persistence, queue protection and visibility semantics are registered in D-167, ADR-028 and the Content API contract.
- Residual: the 500-row maximum requires index and response-time validation during technical planning.
- Residual: current legacy endpoints must not be extended with a response shape that conflicts with ADR-023.

## Handoff notes for next phase

- Revalidation may proceed to its final approval gate; downstream bridge and planning must use the accepted Content contract without inventing broader actions, fields or permissions.
- The journeys seed US → JRN → CMP/API traceability. Test links are deliberately empty until Phase 8A.
