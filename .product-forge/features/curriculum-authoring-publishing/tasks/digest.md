# Tasks — Digest

> **Feature:** curriculum-authoring-publishing
> **Phase:** tasks
> **Generated at:** 2026-09-05T00:00:00+08:00
> **Artifact owner:** speckit.product-forge.tasks

## Diff since last approved state

Initial version — no prior state.

## Key decisions

- Fifteen tasks sequence migration/domain before backend lifecycle, then HTTP, Admin/Mobile and E2E.
- Five Test-first tasks create the required red gate for critical backend, HTTP and client paths.
- T011 is XL and should be decomposed during implementation if shared Admin files require it.

## Artifacts produced

- `tasks.md` — dependency-ordered implementation and verification work.

## Open risks

- Shared Admin/Content files are modified by other work; re-check ownership before each task.

## Handoff notes for next phase

- Start T001/TC002/T003, then the backend test-first groups in order. Do not begin client work until published-only runtime contracts pass.
