---
status: blocked-design-candidate
last_updated: 2026-08-31
---

# Audio TTS Pipeline

## Target asynchronous flow

`request -> authorize/entitle -> quota transaction -> active-job dedupe -> enqueue -> claim -> provider request -> poll/callback -> validate artifact -> review -> publish`

## Job invariants

- At most one active job per selected variant.
- Queue items become worker-pickup eligible at 60 seconds according to the brief's threshold semantics.
- If a lease/lock is retained, lock timeout is 30 seconds.
- Claims are atomic and safe under multiple workers.
- Retry uses explicit bounded backoff and preserves provider-request idempotency.
- Retry exhaustion reaches a terminal `dead_letter`/`abandoned` state; it cannot remain indefinitely active.
- Duplicate browser submits, duplicate workers, delayed callbacks and provider retries must converge on one billed business request/result.

## Provider request provenance

Persist request ID/idempotency key, provider, model/voice identity, selected locale/role, input hash, estimated seconds, raw actual seconds, rounded billable seconds, status, attempt number and timestamps. Provider secrets never enter browser-visible state.

## Postconditions before publish

A result can be publishable only after canonical source revision/hash compatibility, locale-role compatibility, successful object validation, immutable asset identity, duration/metadata validity, moderation approval, and idempotent pointer advancement are all satisfied.

## Frozen-model conflict

Current frozen DB already models async TTS via `audio_tasks` + `audio_generation_attempts` with lease/retry/dead-letter semantics. The brief requires a `tts_jobs` contract and calls for superseded/replaced handling. The relationship cannot be implemented until AUDIO-DESIGN-B01 decides whether `tts_jobs` replaces, maps to, or is rejected in favor of the frozen Attempt model.