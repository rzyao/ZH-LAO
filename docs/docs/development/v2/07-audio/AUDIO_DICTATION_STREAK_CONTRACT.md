---
status: blocked-design-candidate
last_updated: 2026-08-31
---

# Audio Dictation & Streak Contract

## Ownership

`dictation_attempts` and `listening_streaks` are explicitly excluded from Audio's nine-table ownership target. Audio MUST NOT become their canonical runtime owner and MUST NOT duplicate them.

## Allowed Audio interaction

Audio may expose/read the minimum audio identity, source revision, locale/role, duration and publication metadata needed by the owning learning/practice capability. Admin pages may display cross-read diagnostics when authorized. Such access is an explicit cross-domain read contract, not permission to update foreign canonical tables.

## Runtime rules

- Dictation correctness, attempt scoring and attempt lifecycle remain with the owning learning/practice domain.
- Streak increment/reset/calendar semantics remain with the owning learning/practice domain.
- Audio publication or playback does not directly mutate streak state.
- If a reliable cross-domain effect is later required, use owner application contracts or outbox/consumer semantics, never a hidden Audio repository write.

## Schema changes

Only proven missing metadata/constraints may become later forward-migration tasks after ownership is confirmed. No table or migration changes are made in this design phase.