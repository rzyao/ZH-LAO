---
status: blocked-design-candidate
last_updated: 2026-08-31
---

# Audio Admin Workflow

## Admin boundary

Target routes live in the current Admin application under `apps/admin`, not the stale `frontend/app/admin/**` paths mentioned by the brief. Reuse the established React/Vite/TanStack Admin Foundation and its `PermissionGuard`, DataTable, List/Detail/Edit/Workbench layouts, HTTP client, request-id and error contracts.

No browser code may write PostgreSQL directly. All mutations go through the admin control plane/application service and are re-authorized server-side.

## Proposed pages

- `/audio` — landing / health summary.
- `/audio/tasks` — production workbench and filters.
- `/audio/tasks/:taskId` — task detail, attempts, source snapshot and audit history.
- `/audio/review` — review queue.
- `/audio/assets/:assetVersionId` — asset/version detail and publish state.
- `/audio/voices` — voice-profile matrix/configuration view.
- `/audio/quota` — quota/billing diagnostics, read-only unless explicit permission allows remediation.

These are design routes only; no UI code is created in this phase.

## Mutation sequence

1. Validate session.
2. Resolve canonical UUID from route/body.
3. Re-query Operations permission/RBAC.
4. Resolve Platform feature gating and route kill switch server-side.
5. Resolve entitlement/tier when relevant.
6. Perform domain invariant checks and idempotency check.
7. Execute mutation in a domain transaction.
8. Write success-only operator audit with request ID, actor, action and timestamp.
9. Return stable API error/success contract.

## Upload/publish security

The client receives only a signed temporary upload capability. It cannot choose a table, bucket authority, billing rate, entitlement tier, or canonical public destination. Publish accepts canonical object identity/hash/path produced by trusted server-side validation.

## Unresolved exact gating names

Current `apps/admin/src/app/config/env.ts` exposes `VITE_API_BASE_URL`, `VITE_APP_ENV`, and `VITE_ENABLE_DESIGN_SYSTEM`; repository inspection found no existing Audio-specific feature flag or route kill-switch config name. The brief forbids inventing names, therefore exact Audio flag/switch mapping is unresolved and blocks a GREEN gate (AUDIO-DESIGN-B04).