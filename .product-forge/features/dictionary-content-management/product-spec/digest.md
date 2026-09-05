# Product Spec — Digest

> **Feature:** dictionary-content-management
> **Phase:** product-spec
> **Generated at:** 2026-09-05T00:00:00Z
> **Artifact owner:** speckit.product-forge.product-spec

## Diff since last approved state

- Revised after the Product Spec human review: added formal journeys, deterministic acceptance outcomes, design-system harvest, wireframes, and a component map.

## Key decisions

- Word Content UUID is the only public identity; all dictionary child facts remain revision-owned internal records.
- One D-158 parent revision is the sole review/publish lifecycle.
- Public projections require a valid published parent and valid published targets for every included relation, equivalent, and example.
- The four named Knowledge aggregate PUT endpoints are retained; no child CRUD resource is introduced.
- Normalized public-query materialization updates atomically with parent Content revision publish; Operations success audit is synchronous after owner commit and never fabricates rollback on failure.

## Artifacts produced

- `product-spec/product-spec.md` — eight traced must-have requirements and scenarios.
- `product-spec/journeys/journeys.yml` — operator and public-reader journey seeds.
- `product-spec/README.md` — artifact index.
- `product-spec/wireframes.md` and `product-spec/mockups/component-map.yml` — necessary Admin UI design artifacts.
- `design-system/manifest.yml` — harvested real component map.

## Open risks

- High: backend, Admin, and database workspaces remain in scope and require a new human gate decision.
- Medium: an Operations audit failure after owner commit returns stable internal error and requires Admin refresh; it is explicitly not a Content rollback.

## Handoff notes for next phase

Revalidation must confirm every FR against D-158, the Dictionary/Knowledge authority, frozen aggregate endpoints, and the approved Research gate. It must reject any independent child identity, lifecycle, or public visibility bypass.
