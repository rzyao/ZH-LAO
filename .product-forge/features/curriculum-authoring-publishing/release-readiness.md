# Release Readiness: Curriculum authoring and publishing

> Feature: `curriculum-authoring-publishing` | Date: 2026-09-05
> Verdict: **NOT READY FOR PRODUCTION**

## Summary

| Category | Status | Action items |
|---|:---:|---:|
| Feature flags & rollout | ⚠️ | 1 MUST, 1 SHOULD |
| Documentation | ⚠️ | 1 MUST, 2 SHOULD |
| Monitoring & observability | ❌ | 2 MUST |
| Analytics | ⚠️ | 1 SHOULD |
| Deployment dependencies | ❌ | 2 MUST |
| Security & supply chain | ❌ | 1 MUST, 1 SHOULD |

The implemented vertical slice has passed feature-scoped verification. This
verdict is deliberately not a production-shipping claim: this workspace has no
evidence that the forward migrations, access grants, monitoring, or supply
chain checks have been performed in staging or production.

## Prior quality gates

| Gate | Status | Date |
|---|:---:|---|
| Pre-implementation review | Skipped (optional) | — |
| Code review | Approved with condition: future UI decomposition | 2026-09-05 |
| Verification | Pass with warnings | 2026-09-05 |
| Test run | Skipped (optional; feature-scoped automated evidence is in verification) | — |

## Rollout plan

**Strategy: internal-first.** No feature-flag predicate is currently wired into
the curriculum paths. Restrict the first release to named internal operators
through the existing exact `content.curriculum.read/write/publish` permissions;
learning-facing runtime routes remain published-pointer-only.

| Stage | Duration | Exit criterion |
|---|---:|---|
| Staging migration and smoke | Before deployment | Migration checksum, schema validation, lifecycle and runtime published-only smoke all pass. |
| Internal operators | 1 business day | Create, review, publish and read one non-production curriculum; audit is present. |
| Limited learner exposure | 3 days | No draft leakage, publish/audit mismatch, or alert trigger. |
| General availability | After release-owner review | All MUST items complete and first-release observations accepted. |

## Rollback plan

**Reversibility: conditional.** The two curriculum migrations are additive and
forward-only; they must not be edited or reversed in place. Application
rollback is safe only while the previous application release tolerates the new
nullable pointer columns and no incompatible data contract is introduced.

1. Remove `content.curriculum.*` permissions from rollout operators to stop new
   authoring and publication.
2. Revert the application deployment to the previously compatible release.
3. Keep migrations and published snapshots intact; do not delete pointers,
   revisions, or audit records as a rollback mechanism.
4. Verify runtime reads still resolve only published pointers, then communicate
   the incident and preserve audit evidence.

## Documentation and operational readiness

| Check | Status | Evidence / action |
|---|:---:|---|
| User-facing docs | ⚠️ | Admin operators need a short authoring/review/publish guide before broad access. |
| API contract | ✅ | Existing Content API/public contracts and accepted ADRs govern the endpoints. |
| Architecture decision | ✅ | ADR-029/030/032 accepted. |
| New environment variables | ✅ | Feature adds none. Existing backend, admin and mobile required variables remain deployment prerequisites. |
| Runbook and on-call | ⚠️ | [Feature-local release-operations-runbook.md](release-operations-runbook.md) is drafted; a release owner must adopt it for a real target and assign an on-call channel. |
| Known limitations | ✅ | No runtime kill switch; monitoring provider and supply-chain evidence absent. |

## Monitoring and analytics

`monitoring/dashboard.json`, `monitoring/alerts.yml`, and `monitoring/slo.md`
are generated planning artifacts. The configured telemetry provider is `none`,
so they have not been applied to any external system. No tracking plan is
configured; release health must initially be measured from API, audit, and
database telemetry.

## Deployment dependencies

| Environment | Ready? | Blocker |
|---|:---:|---|
| Development | ✅ | Feature-scoped tests and validation passed. |
| Staging | ❌ | No execution evidence for migrations, RBAC grants, runtime smoke, or alerts. |
| Production | ❌ | Same as staging, plus named release owner/on-call and supply-chain evidence. |

## Action items before ship

| # | Category | Action | Priority | Status |
|---:|---|---|:---:|:---:|
| 1 | Deployment | Apply `1350_curriculum_revision_pointers.sql` and `1370_curriculum_lifecycle_idempotency.sql` through the normal forward migration process in staging; run migration audit/validate and curriculum smoke. | MUST | TODO |
| 2 | Access | Grant and independently verify the three curriculum permissions only for named internal rollout operators. | MUST | TODO |
| 3 | Monitoring | Provision the four alerts and dashboard in an approved production telemetry provider; name the response channel. | MUST | TODO |
| 4 | Supply chain | Generate SBOM; run OSV delta and SPDX allowlist scans; resolve or formally accept any new high/critical finding. | MUST | TODO |
| 5 | Documentation | Adopt the drafted operator authoring/review/publish and incident rollback runbook for the target environment, with owner and channel. | MUST | IN PROGRESS |
| 6 | Rollout | Consider a true runtime kill switch for a future increment; do not represent RBAC as a kill switch. | SHOULD | TODO |
| 7 | Provenance | Add build provenance attestation to the release workflow. | SHOULD | TODO |
| 8 | Analytics | Define ownership and event instrumentation if product-success metrics are required after the safety rollout. | SHOULD | TODO |

## Verdict

**NOT READY FOR PRODUCTION.** The code is feature-verified, but five mandatory
release operations remain unproven. Completing them requires deployment and
operations ownership outside this local workspace; do not treat this artifact
as authorization to deploy.
