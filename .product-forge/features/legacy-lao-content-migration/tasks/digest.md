# Tasks — Digest

## Key decisions

- 13 ordered tasks; four test-first tasks cover configuration, deduplication, R2 and transactional migration behavior.
- The importer is decomposed into mapping, source reader, report writer, R2 adapter and target writer modules.
- `T013` is an explicit, separately authorized live-write operation and is not granted by task approval.

## Artifacts produced

- `specs/007-legacy-lao-content-migration/tasks.md` — canonical task list.
- `tasks.md` — Product Forge pointer to the canonical list.

## Open risks

- `T009` is XL because it spans Content, Asset and Audio table ordering; implement must keep it as a thin orchestrator and preserve unit-tested helper boundaries.
- Actual R2 read permission and live target validation remain execution-time dependencies.

## Handoff notes

Run TC001–TC004 first and confirm failure before creating implementation modules. Do not execute T013 without a new explicit user instruction to apply to the live target.
