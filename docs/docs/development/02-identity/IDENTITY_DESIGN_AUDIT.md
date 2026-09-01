---
status: complete
phase: 2
phase_name: Identity Domain
document: IDENTITY_DESIGN_AUDIT
audited_at: 2026-08-30
design_gate: PASS
implementation_started: false
lifecycle: historical
---

# ZH-LAO  — Identity Design Audit

## 1. Audit scope

本审计仅核对并修正 Identity 的实施前设计；未实现 Identity 代码、HTTP route、repository、provider 或 worker，亦未进入其他 Domain。

## 2. Sources reviewed

- Frozen migrations: `0100_identity.sql`, `1220_identity_auth_runtime.sql`, and `1230_system_outbox.sql`
- Frozen physical-contract record, MASTER development plan, Application Foundation plan/report, and current Backend Foundation contracts
- Identity domain/model/flow/database documents; ADR-002, ADR-018, architecture, and governance rules
- `IDENTITY_IMPLEMENTATION_PLAN.md`, `IDENTITY_USE_CASES.md`, and `IDENTITY_API.md`

Precedence used: frozen migration → frozen global architecture → master plan → frozen Identity design → implementation plan → use cases → API.

## 3. Frozen DB consistency

PASS. `users`, `auth_identities`, `basic_profiles`, `learning_profiles`, `otp_challenges`, `sessions`, and `devices` were checked by column, type, nullability, default, CHECK, UNIQUE, FK, and index intent. The design uses `verified_at`, `expires_at`, `revoked_at`, `last_active_at`, `installation_id`, `refresh_token_hash`, and `provider_subject` exactly as frozen. OTP consumption is terminal `verified + verified_at`; no document requires nonexistent `consumed_at`. The empty BasicProfile row is valid because all business profile columns are nullable. No API exposes an internal BIGINT.

## 4. Domain boundary result

PASS. Identity owns account identity/status, AuthIdentity, basic/learning identity facts, OTP, sessions, and devices. It does not own Social, Chat, Trust restrictions, Commerce, Rewards, Operations, learning progress, Content, or notification state. Account status is only `active`, `disabled`, or `closed`.

## 5. Use Case audit

PASS. Every required V1 use case has implementation semantics and an API mapping where applicable. Required session revocation means current Session or all Sessions, plus device-session revocation; arbitrary session revoke is correctly deferred because the frozen Session table has no public UUID.

## 6. OTP audit

PASS after correction. OTP verification, business action, and `verified + verified_at` consumption use one database transaction; there is no reusable verified ticket. Wrong-code attempt updates commit independently. TTL, attempts, cooldown, phone/purpose durable rate limits, IP limits, provider failure, replay, expiry, and locking are specified.

The audit added a transaction-scoped PostgreSQL advisory lock for canonical `phone + purpose` around request/replacement. This closes the missing partial-unique-constraint race: concurrent requests cannot leave multiple pending challenges. Provider-failure compensation now locks and cancels only the challenge it created if it remains pending.

## 7. Phone auth audit

PASS. Existing-user authentication atomically validates OTP, resolves identity/status, updates an owned device, creates Session, and consumes OTP. New-user registration atomically creates User, phone AuthIdentity, BasicProfile, LearningProfile, optional Device, Session, UserRegistered Outbox event, and OTP consumption. Identity uniqueness and rollback prevent orphan users and duplicate registration events.

## 8. Facebook auth audit

PASS. The client sends an opaque credential only; server-side verification produces the trusted `provider_subject`. New Facebook users require learning direction but not phone binding. No automatic phone/name account merge occurs. Provider calls stay outside database transactions; canonical writes and Outbox are atomic.

## 9. Session/token audit

PASS. Access tokens are 15-minute JWTs. Refresh tokens are opaque random secrets, never persisted raw, rotate on every successful use, and use a 30-day sliding Session expiry. A Session row lock permits at most one concurrent refresh; replay fails. Logout, logout-all, device revocation, and disabled/closed state revoke active refresh Sessions. AuthenticationProvider rechecks account status.

## 10. Device audit

PASS. `installation_id` is a public UUID installation identifier, not a credential and not transferable across users. Only fresh primary authentication can restore the same user’s revoked device. RevokeDevice atomically revokes bound Sessions. Push tokens are redacted, never returned, and never silently claimed across users.

## 11. Bind/Change Phone audit

PASS after correction. Purpose-specific OTP is consumed atomically with the credential mutation and must match the request’s canonical phone. The frozen schema lacks `UNIQUE(user_id, provider)`, so the design now locks the current User row before reading/writing its phone identity. This preserves V1’s one-phone rule under concurrent binds; subject uniqueness protects ownership conflicts.

## 12. Learning/Profile audit

PASS. New users must receive a LearningProfile within registration; only `lo → zh` and `zh → lo` are valid, and no mutation endpoint exists. Profile PATCH has a frozen-column whitelist, strict validation, and only an Asset UUID reference for avatar.

## 13. API audit

PASS. All listed endpoints map to Use Cases and define authentication, input/output, errors, rate limits, retries, transaction semantics, and sensitive-field policy. `GET /me/sessions` is display-only; it exposes no Session BIGINT or fake public ID. `created_at` may distinguish display rows but is never an action key.

## 14. Error audit

PASS. Public errors avoid SQL, provider, token, hash, and account-existence leakage. Internal Session revoked/expired states map to `INVALID_CREDENTIAL`; the required Identity error inventory covers public semantics.

## 15. Outbox audit

PASS. The only V1 events are `identity.user_registered.v1` and `identity.account_status_changed.v1` when the internal transition contract is invoked. Both use `users.public_id` UUID as `aggregate_id`, write through Foundation OutboxWriter in the canonical transaction, and exclude phone, OTP, refresh token, provider token/credential, push token, and BIGINT IDs.

## 16. Cross-Domain audit

PASS. Identity writes no other Domain’s canonical tables; future callers use `modules/identity/public/*` and User UUIDs. No cross-domain physical FK or internal-ID contract is introduced.

## 17. Foundation compatibility

PASS. The design directly reuses Fastify, Zod, Pino, AuthenticationProvider, TransactionManager, DatabaseExecutor, OutboxWriter, AssetRepository, AppError, request context, worker infrastructure, boundary checks, and PostgreSQL integration infrastructure. Advisory/row locks require only the existing transaction executor; no new pool, ORM, Redis, or broker is needed.

## 18. Implementation plan audit

PASS. IDN-00–IDN-21 remain correctly ordered. IDN-05 now verifies concurrent OTP requests and guarded compensation; IDN-12 verifies the one-phone invariant; IDN-19 remains the true-PostgreSQL race/security gate. Deferred functionality does not enter V1.

## 19. Security audit

PASS. The design enforces E.164 normalization, anti-enumeration, server-side Facebook verification, JWT issuer/audience/signature/expiry checks, strict requests, redaction, HTTPS production transport, no-store token responses, and no URL/query token transport.

## 20. Concurrency audit

PASS. Required serialization points are OTP request-scope advisory lock, OTP row lock, User row lock for bind/change, AuthIdentity uniqueness, Session row lock, Device/session revocation transaction, and User/session ordering for disable-versus-refresh. Each has a defined loser result and no raw PostgreSQL error leakage.

## 21. Testability audit

PASS. Required true-PostgreSQL races are same OTP ×2, OTP request ×2, same-phone first registration ×2, same Facebook subject ×2, same refresh token ×2, bind same/different phone ×2, change-phone ownership conflict, refresh vs logout, and refresh vs account disable. Unit, HTTP, contract, security, boundary, and integration coverage are all specified.

## 22. Corrections made

1. Relocated the three Phase-2 design files from accidental `docs/development/` to canonical `docs/docs/development/`.
2. Added OTP request advisory-lock semantics and real PostgreSQL race tests.
3. Made OTP delivery-failure compensation challenge-specific and status-checked.
4. Added User-row serialization, challenge-phone equality, and tests to preserve one-phone-per-user without changing the frozen schema.
5. Clarified scope of required session revocation and display-only Session metadata.

## 23. Deferred items

Arbitrary session revoke, account closure/disable/re-enable endpoints, Facebook binding/unlinking, account merge, direction change, guest migration, access-token blacklist, token-family replay detection, multi-phone, password/email/Google/Apple auth, MFA, and passkeys remain deferred or unsupported.

## 24. Remaining blockers

None. Frozen-migration conflict, blocking open decision, unimplementable V1 use case, ownership violation, BIGINT leakage, OTP replay flaw, refresh concurrency flaw, security blocker, and Foundation incompatibility are all zero.

## 25. Final Gate decision

```text
Frozen migration changes = 0
Blocking open decisions = 0
Remaining blockers = 0
IDENTITY_DESIGN_GATE = PASS
IDENTITY_IMPLEMENTATION_STARTED = NO
```

The Phase stops here. `IDN-01` has not started.
