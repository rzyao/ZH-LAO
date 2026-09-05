---
feature: admin-operator-password-reset
phase: research
status: evidence
last_updated: 2026-09-05
---

# Codebase integration analysis — administrator-initiated operator password reset

## Scope examined

The confirmed scope is a back-office-only command: an authorized active Operator resets the selected Operator's admin credential, revokes every active session of that credential's Identity user, receives the generated temporary password exactly once, and leaves a successful Operations audit record. It is not self-service recovery, an invitation flow, a public endpoint, or a Mobile Identity change.

## Reusable implementation paths

| Concern | Existing implementation evidence | Reuse / extension point |
| --- | --- | --- |
| Exact backend authorization | `apps/backend/src/modules/operations/http/routes.ts` guards every operator mutation through `OperationsService.requirePermission`; `apps/backend/src/modules/operations/public/permissions.ts` is the typed catalog. | Add an exact `operations.operators.reset_password` catalog key only after the Operations contract is revised; guard the reset route with it. Front-end guards remain UX only. |
| Actor and target resolution | `OperationsService` already resolves the authenticated actor; the operator route receives an operator UUID and `operations.operators` retains `auth_subject_id`. | Resolve the target `auth_subject_id` from the target Operator, then let Identity own credential/session changes. Do not query `identity.*` from Operations. |
| Password generation and hashing | `apps/backend/src/modules/identity/application/services/admin-account-writer.ts` creates a cryptographically random, policy-compliant password and persists only a scrypt hash. | Extract/reuse the password generator and hash routine in an Identity-owned internal service; never accept a caller-provided replacement password for this flow. |
| Password update and session revocation | `apps/backend/src/modules/identity/application/use-cases/admin-credential-ops.ts` validates password policy, updates `identity.admin_credentials`, then calls `sessions.revokeAllByUserId(..., 'password_changed')` in one local transaction. | Add an Identity-owned admin-target credential operation with target subject UUID; retain hash update + all-session revocation in the same transaction. Its successful result may expose only `temporaryPassword` to the orchestration layer. |
| Session persistence | `SessionRepository.revokeAllByUserId` and `PostgresSessionRepository` already revoke only active sessions, returning a count. | Reuse it with a distinct stable reason if the product/API contract requires one; current `password_changed` already communicates the outcome and needs no schema change. |
| Cross-module composition | `apps/backend/src/modules/admin-operator-provisioning/application/admin-operator-provisioning-service.ts` coordinates narrow Identity/Operations writers in one `TransactionManager` transaction; `apps/backend/src/main.ts` composes it. | Create an equivalent narrow reset orchestration service. It should combine Identity credential reset, Operations success audit, and route-safe response in one PostgreSQL local transaction. |
| Audit | `OperationsService.recordSuccessfulAction` and `OperatorAuditAdapter` enforce success-only audit behavior. `OperationsService` rejects sensitive audit details by name. | Write exactly one success row with an explicit action key, actor operator UUID, target `identity / operator / target auth-subject UUID` (or a newly frozen target convention), request id and IP. No password, hash, token, session id/count, or other secret enters details. |
| One-time secret delivery | Operator creation returns `initial_password` only from `POST /api/v1/admin/operations/operators`, sets `Cache-Control: no-store` and `Pragma: no-cache`, and the Admin API client now expects the unwrapped data payload. | Mirror cache headers and return `temporary_password` only in the successful reset command response. Do not add it to list/detail reads, audit data, logs, query cache, or retry result. |
| Admin UI | `apps/admin/src/features/operations/{contracts,api,queries}.ts` isolate contracts/API/React Query; `pages/operators.tsx` provides permission-gated row actions and the create-password display/copy pattern. | Add permission constant, reset API schema/mutation, invalidation of operator/audit queries, row action, irreversible confirmation dialog, and post-success temporary-password copy surface. Keep the secret in component-local state rather than React Query cache. |

## Existing constraints from canonical authorities

- Identity owns authentication, passwords, sessions, and JWTs; Operations owns Operator mapping, exact RBAC, and audit. The Operations contract explicitly prohibits Operations SQL/repository access to `identity.*` and prohibits a separate admin authentication system.
- The frozen Operations contract permits only registered exact permission keys. The current catalog has no reset-password permission, so implementation cannot treat `operations.operators.update` or `create` as authorization for this new capability.
- All management endpoints require Identity authentication plus Operations backend authorization; a hidden UI control is not authorization.
- Canonical Operations audit rows represent successful accepted actions only. Audit details must not contain passwords, OTPs, tokens, headers, credentials, or secrets.
- Existing API behavior is the unified success envelope. The Admin client unwraps it before feature-level Zod parsing; new client code must parse the unwrapped body, avoiding the previous double-envelope defect.
- `database/migrations/0100_identity.sql`, `0200_operations.sql`, and `1260_admin_credentials.sql` are frozen. The required password hash, operator-to-subject mapping, sessions, and audit storage already exist.

## Gaps that need specification / contract decisions

1. **New authorization and audit vocabulary:** no `operations.operators.reset_password` permission or matching audit action currently exists. The Operations canonical contract/page/API contract must add the exact key and action before code changes; `super_admin` reconciliation follows the established catalog-evolution process.
2. **Identity-to-Operations write boundary:** the current `AdminCredentialOperations.changePassword` is self-only and verifies a current password. The new operation must be a deliberately named Identity-owned narrow write port for an authorized external orchestration command, not a generic public reset endpoint and not Operations SQL.
3. **Atomicity expectation:** the desired command spans Identity credential/session mutation and Operations audit. The codebase has a same-PostgreSQL local transaction orchestration precedent for account creation. The specification must explicitly adopt that same boundary for reset, including rollback on audit failure, instead of the normal cross-domain post-commit audit sequence.
4. **Target eligibility / self-reset:** current authorities do not say whether a disabled Operator may have its password reset, whether the actor may reset their own password, or whether the target must still have an active Identity account and admin credential. The implementation must not infer these rules. The existing self-service `change-password` remains the likely path for own-password changes, but this needs an explicit product rule.
5. **Temporary-password presentation:** source code has an initial-password display pattern but no forced-change-at-next-login credential field or flow. The confirmed scope says one-time disclosure; it does not establish a first-login password-change requirement. Do not add a credential column or forced-change behavior without a separate authority decision.
6. **Replay and recovery behavior:** browser/API retries after a response loss must not create an auditable reset whose secret cannot be recovered. Existing creation has the same one-time-secret characteristic but no command idempotency mechanism. Define retry/error handling before implementation; never regenerate or later expose a password through a GET endpoint.

## Likely implementation scope

**Backend:** an Identity internal reset capability and tests; a small cross-module reset orchestration service and composition wiring; Operations permission catalog/route/response contract/audit support; route tests covering authorization, secret non-leakage, session revocation, atomic rollback, and response headers.

**Admin:** Operations feature contracts/API/React Query mutation; permission-aware row action and confirmation; one-time temporary password reveal and copy treatment; component/API tests including the already-established envelope-unwrapping convention.

**Documentation/specification:** revise the applicable Operations API/RBAC/admin-page authorities and Spec Kit feature artifacts before implementation. This research file is evidence only and does not change those authorities.

## Migration assessment

No migration is expected for the confirmed baseline. `identity.admin_credentials.password_hash`, Identity sessions, `operations.operators.auth_subject_id`, and `operations.operator_audit_logs` already support the command. A migration becomes necessary only if a later approved requirement adds credential-reset state, password-history retention, a first-login-change flag, idempotency persistence, or a new audit-storage field; none is currently authorized.

