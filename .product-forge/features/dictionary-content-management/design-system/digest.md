# Design System Harvest — Digest

> **Feature:** dictionary-content-management
> **Phase:** product-spec helper
> **Generated at:** 2026-09-05T00:00:00Z
> **Artifact owner:** speckit.product-forge.design-system-harvest

## Diff since last approved state

Initial harvest — no prior manifest.

## Key decisions

- Reuse the existing Content category list/editor/review components and existing dialogs, status badges, confirmation, and error patterns.
- No generic DataTable or new design system is required.

## Artifacts produced

- `design-system/manifest.yml` — real component and selector map.
- `design-system/manifest.md` — human-readable inventory.

## Open risks

- Dictionary-specific aggregate sections will extend the existing editor; they must keep the existing permission and lifecycle affordances.

## Handoff notes for next phase

Mockups and implementation tasks must reference `CMP-*` IDs in this manifest.
