---
status: blocked-design-candidate
last_updated: 2026-08-31
---

# Audio Data Schema

## Frozen repository fact

`database/v2/migrations/0600_audio.sql` is frozen and currently creates these nine Audio tables:

1. `audio.audio_slots`
2. `audio.audio_tasks`
3. `audio.audio_generation_attempts`
4. `audio.audio_asset_versions`
5. `audio.audio_reviews`
6. `audio.audio_task_events`
7. `audio.audio_task_batches`
8. `audio.audio_task_batch_items`
9. `audio.audio_default_presets`

`docs/docs/domains/audio/database.md` independently declares the same nine-table set frozen and defines the production chain `slot -> task -> generation_attempt -> asset_version -> review -> publish`.

## Brief target

The Phase-7 brief instead requires the final Audio-owned functional table count to be exactly nine as:

Base tables allegedly from `0600_audio.sql`:
- `audio_entries`
- `audio_variants`
- `speech_audio`

Required new tables:
- `audio_voice_profiles`
- `audio_selected_variants`
- `tts_jobs`
- `tts_billing_events`
- `tts_quota_events`
- `audio_review_events`

Those two nine-table contracts are mutually incompatible on current `main` while the brief also forbids rewriting frozen `0600_audio.sql`.

## Required target invariants after architecture reconciliation

- Stable UUID identifiers for all cross-domain references.
- No physical FK to Content, Operations, Platform, Identity, or Entitlement-owned canonical data.
- `audio_selected_variants`: exactly one row per target audio entry; locale/kind/entry consistency must be enforced.
- `tts_jobs`: one active job per selected variant; retry/backoff; pickup threshold 60 seconds; lock/lease timeout 30 seconds if retained; terminal dead-letter/abandoned state.
- `tts_billing_events`: immutable provider-request accounting with raw and rounded actual seconds, locale, tier/rate, estimated/actual values and idempotency.
- `tts_quota_events`: immutable append-only ledger only; never authoritative balance state.
- `audio_review_events`: immutable actor/from/to/reason/time review history.
- Voice profiles bind provider voice ID + version + locale + role + immutable configuration snapshot semantics.

## Dictation / streak ownership

`dictation_attempts` and `listening_streaks` are not Audio-owned tables and MUST NOT be counted in the Audio nine-table target. Audio may define cross-read/read-visibility/admin display contracts only; runtime ownership stays with the owning domain.

## Migration policy

`0600_audio.sql` MUST NOT be edited. Any approved reconciliation must be a new forward migration and must preserve data or provide an explicit migration/backfill/rollback plan. No migration work is executed in this phase.

## Blocking decision

AUDIO-DESIGN-B01: choose and formally approve one authoritative physical model: the frozen Slot/Task model or the brief's Entry/Variant/Speech + six-table model, including an explicit forward-migration strategy if the latter supersedes the former.