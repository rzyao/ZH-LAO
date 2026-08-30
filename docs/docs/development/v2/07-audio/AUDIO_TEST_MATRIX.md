---
status: design-only
last_updated: 2026-08-31
---

# Audio Test Matrix

This is the mandatory implementation validation matrix; no tests are executed in this design-only phase.

| Area | Required cases |
| --- | --- |
| Happy path | Phrase/Example/Slow request -> generate -> validate -> review -> publish -> consume |
| Entitlement | server-authoritative visible/requestable/admin-editable matrix; client-tier spoof rejected |
| Quota | Plus 180/day + cap 240; Pro 1200/month reset; insufficient balance; period boundary |
| Concurrency | double submit; parallel quota debit/reset; duplicate workers; provider callback race |
| Jobs | stale claim; one-active-job invariant; retry/backoff; 60s pickup; 30s lease if retained; dead-letter |
| Publish | idempotent publish; stale source/hash; pointer collision; re-render creates immutable new object |
| Moderation | approve/reject/revoke rules; missing rejection reason; invalid transition; duplicate request ID |
| Voice | invalid locale-role pair; disabled/incompatible voice; published-profile provenance immutability |
| Storage/CDN | missing object; bad hash; custom-origin TLS failure; deep-path fallback; cache headers |
| Provider | timeout; transient retry; retry exhaustion; duplicate provider request does not double-bill |
| Migration | frozen `0600_audio.sql` unchanged; forward migration compatibility/backfill/rollback; exact final table inventory |
| Admin | auth/RBAC re-query; mutation audit; deep link; route flag/kill switch; direct DB write impossible |
| Gating | feature flag and route kill switch mismatch/fail-closed behavior |
| Dictation/streak | explicit cross-read only; no Audio-owned runtime mutation |
| Audit | provider/billing/quota/review/operator events immutable and request-id traceable |
| Gate | authoritative file count; unresolved decisions = 0; DB conflicts = 0; BLOCKER/HIGH = 0 |

Implementation Exit Gate must run unit, integration, PostgreSQL race tests and relevant Admin E2E against a clean migrated database.