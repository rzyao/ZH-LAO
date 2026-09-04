# Content–Audio Public Boundary

## Approved baseline

`sourceDomain` is `content`; slot identity is `(source_domain, content_entity_type, content_entity_id, language_code, audio_role)`. Eligible concrete types are `lo_letter`, `lo_syllable`, `lo_word`, `lo_sentence`, `zh_pinyin`, and `zh_syllable`. Course, lesson, exercise, question and generic `content` are rejected.

## Requirements

- FR-001: ContentPublicQueries validates only the six types, entity/revision ownership, published state, language and role.
- FR-002: Content exposes only logical UUIDs and normalized snapshots to Audio.
- FR-003: Content never reads or writes Audio private tables; publishing invokes the required AudioRequirementSync port after Content commits.
- FR-004: `zh_syllable` is a Content entity with `contents.public_id` identity and a forward-only physical representation.

## Acceptance

- FR-001-AS01: each approved type and role validates; all non-whitelisted types and invalid roles fail.
- FR-001-AS02: unrelated, unpublished, language-mismatched and unresolvable revisions fail.
- FR-003-AS01: source scan has no Content reference to `audio.audio_*` private tables.
