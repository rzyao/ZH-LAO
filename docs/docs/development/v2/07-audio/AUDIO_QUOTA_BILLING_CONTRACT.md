---
status: blocked-design-candidate
last_updated: 2026-08-31
---

# Audio Quota & Billing Contract

## Plans

| Tier | Period grant | Rollover/reset |
| --- | ---: | --- |
| Plus | 180 seconds/day | `new_balance = min(previous_plus_remaining + 180, 240)` |
| Pro | 1200 seconds/month | reset to exactly 1200; no rollover |

The authoritative subscription tier and mutable quota balance are server-side state. `tts_quota_events` is append-only evidence and MUST NOT be reconstructed as the canonical balance by summing events on every request.

## Required transaction

```text
BEGIN
SELECT canonical subscription/quota state FOR UPDATE
resolve tier server-side
if period boundary crossed:
  compute rollover/reset
  write authoritative quota state
  append quota event(s)
verify sufficient balance
reserve/decrement authoritative state
append immutable quota event
insert or confirm idempotent provider-request billing event
COMMIT
```

Provider completion may append actual/adjustment facts according to the eventual approved schema; retrying the same provider request MUST NOT charge twice.

## Concurrency

The locked row/advisory-key equivalent must serialize reset/rollover and debit for one user. Double-submit, concurrent workers, callback races and retry exhaustion require deterministic idempotency keys and invariant-preserving compensation/adjustment.

## Billing evidence

Billing events record estimated duration, raw actual duration, rounded billable duration, locale, entitlement tier, rate/rate-version, provider request identity and final outcome. Historical rate/provenance is immutable.

## DB blocker

Neither the required quota/billing tables nor an approved authoritative quota-state mapping can be reconciled with the frozen nine-table Audio baseline without resolving AUDIO-DESIGN-B01. No migration is authorized here.