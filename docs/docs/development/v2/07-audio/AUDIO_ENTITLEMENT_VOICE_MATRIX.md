---
status: blocked-design-candidate
last_updated: 2026-08-31
---

# Audio Entitlement & Voice Matrix

## Server-authoritative entitlement

Every read/action must distinguish four independent decisions: `data_visible`, `action_visible`, `requestable`, and `admin_editable`. The browser/mobile client MUST NOT derive these from plan names or local flags. The backend resolves the canonical entitlement and returns the allowed capabilities.

## Audio roles

V2 role set is fixed to:

| Role | Meaning |
| --- | --- |
| `phrase` | normal phrase/entry pronunciation |
| `example` | example-sentence pronunciation |
| `slow` | deliberately slower learning playback |

## Locale/role compatibility

| Locale | phrase | example | slow | Contract |
| --- | --- | --- | --- | --- |
| `zh-CN` | required | required | required | selected provider voice profile must explicitly support `zh-CN` + role |
| `lo` / canonical Lao locale chosen by global localization contract | required | required | required | selected provider voice profile must explicitly support Lao + role |

The repository inspection did not establish an already-frozen exact Lao locale token or Audio-specific voice IDs in current runtime code. Implementation MUST reuse the canonical locale token from the localization contract; no new alias is invented here.

## Voice profile invariant

A selectable voice profile contains provider ownership, provider voice ID, provider voice version, locale, role, enabled lifecycle state and a configuration snapshot. Once referenced by a published artifact, the historical rendering identity MUST remain immutable; changes create a new profile/version rather than rewriting provenance.

## Paywall behavior

- `Plus`: daily TTS grant 180 seconds, rollover capped at 240 seconds.
- `Pro`: monthly TTS grant/reset 1200 seconds, no rollover.
- Eligibility and remaining balance are server authoritative.
- UI validation is advisory only.

Exact mapping to currently deployed paywall keys remains subject to repository-level paywall contract reconciliation and is not invented in this design package.