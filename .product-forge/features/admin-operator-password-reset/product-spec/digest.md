# Phase Digest — Product Spec

> Feature: `admin-operator-password-reset` | Date: 2026-09-05

## Key decisions

- Only another active Operator is an eligible target; self-reset remains the existing self-service flow.
- A `super_admin` target may be reset only by an actor holding active `super_admin`.
- A generated temporary password is one-view only and must be changed at first login.
- Credential update, target session revocation, and success audit are atomic; automatic retry and secret recovery are prohibited.

## Artifacts produced

- `product-spec/product-spec.md` — requirements, scenarios, security constraints, and authority-promotion blockers.
- `product-spec/journeys/` — three structured journeys and their authoritative index.
- `product-spec/wireframes/` — two basic HTML screen layouts.
- `product-spec/mockups/` — two project-grounded prototype pages and component map.
- `traceability.yml` — US → journey/step/edge seed.
- `README.md` and `product-spec/README.md` — lifecycle and document indexes.

## Open risks

- The current canonical authorities do not yet register the required permission, privileged-target policy, forced-change credential state, API response, error vocabulary, or atomic audit boundary.
- Forced first-login change may require a forward database migration; no physical design is authorized yet.

## Handoff notes

- Revalidation must verify the stated rules against the authority chain and surface the required authority revisions.
- Bridge/Plan must not invent a database schema or public API before those revisions are approved.
