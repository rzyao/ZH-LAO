---
status: blocked-design-candidate
last_updated: 2026-08-31
---

# Audio Product Contract

## Scope

Phase 7 Audio covers only `Phrase`, `Example`, and `Slow` audio experiences. It is a design-only phase. No backend implementation, migration, worker, admin UI, public endpoint, RLS, cron, or runtime mutation is authorized by this document.

## Canonical responsibilities

Audio owns production workflow, voice selection, generation attempts/jobs, review/moderation state, publication selection, and audio-specific business audit facts. Content owns source text and revisions. Operations owns operator identity/RBAC. Platform owns runtime configuration/feature flags. Infrastructure Assets owns physical-file canonical metadata. Entitlement tier is resolved server-side by the authoritative paywall/entitlement layer.

## User-visible semantics

- An eligible learner may request or consume Phrase / Example / Slow audio only when the server says that action is entitled.
- Client state MUST NOT infer subscription tier, quota balance, voice availability, or publish eligibility.
- Publishing is explicit and idempotent. Published delivery always resolves through a canonical current pointer; immutable files are never overwritten in place.
- Source-text/revision changes require a new production result and immutable object version before the current public pointer can advance.
- Moderation/review decisions are auditable and invalid state transitions are rejected.

## Publication lifecycle

Target product lifecycle required by the brief is `draft -> published -> archived`. The current frozen database instead models Slot/Task/Asset/Review/Publish with `audio_slots.official_asset_version_id`; reconciliation is blocked by AUDIO-DESIGN-B01 and MUST occur before implementation.

## Gate constraint

This contract is the canonical Phase-7 design package target, but implementation authority is withheld while `AUDIO_DESIGN_GATE = FAIL`. See `AUDIO_DESIGN_GATE.md`.