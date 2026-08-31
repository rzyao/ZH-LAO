---
status: complete
phase: 7
phase_name: Audio Production Domain
document: AUDIO_DESIGN_AUDIT
recovery: true
design_only: true
implementation_started: false
last_updated: 2026-08-31
repository_entry_head: cc6b3d79f5224ef0ee4e2e3435a542ffae5edf6e
trusted_brief_commit: f98127c421067875f5ae2a0cf4f56703240a17d1
invalidated_contaminated_commit: ab1d4ebe75e79283fc6fab7ca033ee87a9787843
---

# ZH-LAO V2 — Audio Design Recovery / Independent Audit

## 1. Recovery Verdict

The prior failed design package created by `ab1d4ebe75e79283fc6fab7ca033ee87a9787843` is invalidated as a canonical Audio design source. Recovery has re-grounded the phase on the trusted `AUDIO_DESIGN_BRIEF.md`, frozen `0600_audio.sql`, frozen Audio domain docs/ADR, Content public contract, Asset Infrastructure and current Operations/Admin evidence.

```text
AUDIO_DESIGN_RECOVERY = COMPLETE
AUDIO_DESIGN_GATE = PASS
AUDIO_IMPLEMENTATION = NOT_STARTED
```

## 2. Repository / Boundary Audit

Recovery started from current `main` and was rebased during audit when main advanced. Final pre-write audit baseline:

```text
HEAD = cc6b3d79f5224ef0ee4e2e3435a542ffae5edf6e
branch = main
CI workflow = .github/workflows/foundation.yml
Audio migration = database/v2/migrations/0600_audio.sql
Audio migration blob = d1227e28db6a82e1584bd882cba695f8b321bf21
```

Contamination boundary verification:

- trusted Brief commit `f98127c...` added the real Slot/Task design brief;
- `ab1d4ebe...` (`docs(audio): record blocked design gate`) added the 12 contaminated files as one commit;
- compare from its parent to `ab1d4ebe...` showed those 12 files only for the contaminated package;
- compare from `ab1d4ebe...` to later audited main showed no legitimate later modifications to those 12 files;
- therefore all 12 are deleted rather than partially retained.

## 3. Deleted Contaminated Artifacts

```text
AUDIO_ADMIN_WORKFLOW.md
AUDIO_ASSET_DELIVERY_CONTRACT.md
AUDIO_DATA_SCHEMA.md
AUDIO_DESIGN_GATE.md
AUDIO_DICTATION_STREAK_CONTRACT.md
AUDIO_ENTITLEMENT_VOICE_MATRIX.md
AUDIO_IMPLEMENTATION_CHECKLIST.md
AUDIO_MODERATION_REVIEW.md
AUDIO_PRODUCT_CONTRACT.md
AUDIO_QUOTA_BILLING_CONTRACT.md
AUDIO_TEST_MATRIX.md
AUDIO_TTS_PIPELINE.md
```

No later legitimate edit needed preservation.

## 4. Frozen Database Audit

Authority chain:

```text
0600_audio.sql
-> docs/domains/audio/database.md
-> ADR-020
-> AUDIO_DESIGN_BRIEF.md
```

All agree on the 9-table Slot/Task model. Recovery made:

```text
0600_audio.sql changes = 0
new Audio tables = 0
removed Audio tables = 0
frozen Audio core table count = 9
cross-domain physical FK introduced = 0
```

The regenerated docs do not require a forward migration.

## 5. Grounding Audit

### INVALIDATED B01 — “Brief requires Entry/Variant/Speech + six new tables”

Previous severity: BLOCKER / DB_CONFLICT.

Grounding:

```text
source claimed: AUDIO_DESIGN_BRIEF.md
exact critical strings: audio_entries, audio_variants, speech_audio,
tts_billing_events, tts_quota_events, audio_voice_profiles
result in complete current trusted Brief: no requirement / no match
```

Cross-check: trusted Brief section “Frozen Physical Contract” explicitly lists the 9 Slot/Task tables and forbids a 10th table; `0600_audio.sql`, frozen domain database docs and ADR-020 match it.

Decision:

```text
finding = INVALID
excluded from BLOCKER/DB_CONFLICT counts
```

### INVALIDATED H01 — “Brief inspection paths are stale”

Previous severity: HIGH.

Grounding:

The current trusted Brief itself names the current repository paths, including `database/v2/migrations/0600_audio.sql`, `docs/docs/development/v2/...`, `apps/backend/src/modules/audio/public/` and the existing Admin/worker foundations. The stale path strings used by the contaminated finding are not requirements of the trusted Brief.

Decision:

```text
finding = INVALID
excluded from HIGH count
```

### Invalidated unsourced product requirements

The contaminated package also introduced requirements for Audio quota/billing, entitlement/tier checks, voice-profile tables, dictation/streak contracts, exact feature flag/kill-switch names, public object-key/CDN policy and Entry/Variant/Speech ownership. None is required by the trusted Brief/frozen Audio contracts.

Recovery policy:

```text
unsourced requirement -> removed, not “resolved” by inventing a value
```

## 6. Authority / Ownership Audit

| Boundary | Result |
| --- | --- |
| Content canonical text/pronunciation/revision remains Content | PASS |
| Audio owns Slot/Task/Attempt/AssetVersion/Review/official pointer | PASS |
| Asset Infrastructure solely owns storage facts | PASS |
| Operations owns RBAC/operator audit | PASS |
| TTS service owns provider/model/voice/preset definitions | PASS |
| `audio_task_events` remains Task history, not Event Sourcing/outbox/Ops audit | PASS |
| cross-domain IDs remain logical UUID | PASS |

## 7. Content Contract Audit

Current Content design has `CONTENT_DESIGN_GATE = PASS` and freezes `ContentPublicQueries.validateAudioSource()` with supported entity types `content | course | lesson | exercise | question`, published revision validation, `zh | lo`, text/pronunciation snapshots and deterministic `audioInputHashMaterial`.

Current repository still has no `apps/backend/src/modules/content` and no `CONTENT_IMPLEMENTATION_REPORT.md` / `CONTENT_GATE = PASS` evidence.

Result:

```text
Audio Design dependency = SATISFIED BY FROZEN PUBLIC CONTRACT
Audio Implementation dependency = BLOCKED_BY_CONTENT_GATE
```

This is not an Audio Design blocker because the trusted Brief explicitly permits design before implementation gates close.

## 8. Operations / Admin Audit

Current authoritative Operations report records:

```text
OPERATIONS_DESIGN_GATE = PASS
OPERATIONS_IMPLEMENTATION = COMPLETE
OPERATIONS_GATE = PASS
OPERATIONS_DOMAIN = FROZEN
```

Operations exact three-segment permission grammar and public authorizer/operator/audit capabilities are sufficient to freeze Audio requirements. Seven Audio keys are specified by the recovered API contract; catalog mutation is deferred to implementation.

Admin Foundation report records `ADMIN_FOUNDATION_GATE = PASS` and provides Workbench layout/API client/Auth/Permission skeleton. No Admin UI is implemented by this recovery.

Operations accepted MEDIUM cross-domain audit durability remains an implementation integration TECH_DEBT, not an Audio design ambiguity.

## 9. Learning Audit

Current Learning design package records `LEARNING_DESIGN_GATE = PASS`, `Learning Implementation started = NO`, and `Content Implementation Gate = NOT EVIDENCED` at its audit point. Audio design does not depend on Learning implementation; runtime Learning will consume Audio public official-audio capability after required gates.

## 10. Worker / Asset Grounding

Current backend contains Foundation `Job`, `WorkerHost`, `pollingJob` and shared Asset Infrastructure abstractions (`AssetRecord`, `AssetRepository`, `ObjectStorage`). The recovered design therefore chooses PostgreSQL lease + Foundation polling worker and logical `asset_id`, without inventing a new queue or moving storage metadata into Audio.

## 11. Product Decision Audit

All trusted Brief questions now have explicit V1 decisions:

```text
Slot entity types / role validation / language = FROZEN
Slot creation / stale sync / hash normalization = FROZEN
Task transitions / cancel sources = FROZEN
TTS attempt / lease / polling / retry semantics = FROZEN
Human recording / asset materialization = FROZEN
version allocation = FROZEN
self-review / four-eyes = FROZEN (four-eyes deferred)
approval revoke / published handling = FROZEN
publish freshness / concurrency = FROZEN
successor inheritance = FROZEN
event mapping / actor / payload = FROZEN
batch snapshot / partial failure / cancel = FROZEN
default preset matching/override = FROZEN
Content / Asset / Operations public boundaries = FROZEN
Admin APIs / read model / permissions = FROZEN
worker model = FROZEN
outbox V1 = NONE REQUIRED
implementation plan = FROZEN
```

## 12. Independent Smell Checklist

```text
table-driven CRUD                       = PASS
alternate Audio data model              = PASS (removed)
10th core table                         = PASS (0)
Audio-owned storage facts               = PASS (0)
direct cross-domain SQL contract        = PASS (forbidden)
TTS provider config duplicated          = PASS (0)
quota/billing/entitlement scope creep   = PASS (removed)
dictation/streak ownership leak         = PASS (removed)
feature flag/kill-switch invention      = PASS (removed)
review history overwrite                = PASS (append-only)
publish without freshness               = PASS (forbidden)
worker queue infrastructure invention   = PASS (0)
public DB/repository leakage             = PASS (0)
```

## 13. Severity / Gate Inputs

```text
BLOCKER = 0
HIGH = 0
MEDIUM = 0
LOW = 0

UNRESOLVED_DECISIONS = 0
DB_CONFLICTS = 0
DESIGN_CONFLICTS = 0
CONTAMINATED_CANONICAL_DOCS = 0
UNSOURCED_REQUIRED_CONTRACTS = 0
FROZEN_MIGRATION_CHANGES = 0
```

Prior B01/H01 are explicitly `INVALIDATED` and excluded from counts.

## 14. Canonical Package

Regenerated canonical documents:

```text
AUDIO_PRODUCT_SEMANTICS.md
AUDIO_USE_CASES.md
AUDIO_PRODUCTION_CONTRACTS.md
AUDIO_API.md
AUDIO_PUBLIC_CONTRACTS.md
AUDIO_IMPLEMENTATION_PLAN.md
AUDIO_DESIGN_AUDIT.md
```

`AUDIO_DESIGN_BRIEF.md` and `AUDIO_DESIGN_RECOVERY_BRIEF.md` remain provenance/entry sources, not competing product-spec packages.

## 15. Gate Decision

Recovery Gate criteria:

```text
BLOCKER = 0
HIGH = 0
UNRESOLVED_DECISIONS = 0
DB_CONFLICTS = 0
DESIGN_CONFLICTS = 0
CONTAMINATED_CANONICAL_DOCS = 0
UNSOURCED_REQUIRED_CONTRACTS = 0
```

All are satisfied.

```text
AUDIO_DESIGN_RECOVERY = COMPLETE
AUDIO_DESIGN_GATE = PASS
AUDIO_IMPLEMENTATION = NOT_STARTED
AUDIO_IMPLEMENTATION_ENTRY = BLOCKED_BY_CONTENT_GATE
```

Design PASS does **not** claim `AUDIO_GATE`, does not freeze an implementation, and does not authorize backend/worker/Admin work until a separate execution session re-audits and proves upstream entry gates.

## 16. STOP

No Audio backend module, worker, route, Admin page, Operations catalog mutation, Content code, frozen migration or database table was implemented/changed in this recovery.

STOP after Design Recovery.
