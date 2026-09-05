# Product Spec — Digest

> **Feature:** curriculum-authoring-publishing
> **Phase:** product-spec
> **Generated at:** 2026-09-05T00:00:00+08:00
> **Artifact owner:** speckit.product-forge.product-spec

## Diff since last approved state

Initial version — no prior state.

## Key decisions

- Operators create and edit Course working revisions, then compose Unit/Lesson/Section/Item aggregates using only published references.
- Course/Lesson state transitions and pointer switching are governed by ADR-029; direct draft publish and in-place published edits are forbidden.
- The four journeys cover authoring, composition, review/publish, and mobile published-only read.
- The harvested Admin design system supplies DataTable, StatusBadge, Button, ConfirmDialog and EditPageLayout; no new UI library is introduced.

## Artifacts produced

- `product-spec/product-spec.md` — stories, requirements, constraints and acceptance conditions.
- `product-spec/journeys/journeys.yml` — authoritative journey schema.
- `product-spec/metrics.md` — zero-leakage and atomicity success signals.
- `product-spec/mockups/component-map.yml` — UI component-to-target map.
- `product-spec/README.md` — product-spec index.
- `design-system/manifest.yml` and `manifest.md` — read-only code-grounded component/token inventory.
- `traceability.yml` — seeded US → JRN/STEP/EDGE links; tests stay empty until test planning.

## Open risks

- Unmitigated implementation risk: ADR-029 requires a forward migration and aggregate snapshot validation that do not yet exist.
- Mitigated scope risk: no progress, answers, payment, recommendation or social work enters this feature.

## Handoff notes for next phase

- Revalidation must verify all four Must-Have stories and P0 edges, especially no draft leakage and all-or-nothing publish.
- Bridge must mint stable FR/API requirements from these stories without redefining ADR-029, Content contracts or frozen migrations.
