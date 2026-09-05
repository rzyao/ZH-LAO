# Release Operations Runbook (draft): Curriculum authoring and publishing

> Status: draft for release-owner adoption. This is a Product Forge delivery
> record, not a replacement for Product, Domain, Architecture, Database, or API
> authority.

## Preconditions

- A release owner has selected the target staging or production environment.
- The target database has a verified backup and normal forward-migration access.
- Named internal operators, a release channel, and an on-call responder are assigned.
- The deployment artifact is the same candidate that passed the feature-scoped
  verification evidence in `verify-report.md`.

## Staging procedure

1. Record the deployed application revision and database migration baseline.
2. Apply pending migrations through the repository's normal migration process:
   `DATABASE_URL=<target> pnpm --dir database migrate`.
3. Run `DATABASE_URL=<target> pnpm --dir database audit` and
   `DATABASE_URL=<target> pnpm --dir database validate`; retain their output in
   the release record.
4. Confirm migrations `1350_curriculum_revision_pointers.sql` and
   `1370_curriculum_lifecycle_idempotency.sql` are applied with their expected
   checksums. Never edit or replay a frozen migration with different bytes.
5. Grant only `content.curriculum.read`, `content.curriculum.write`, and
   `content.curriculum.publish` to the named internal rollout operators, then
   independently verify both allowed and denied actions.
6. Run an authenticated smoke journey: create a draft course and lesson;
   save valid fixed published references; submit; approve; publish; confirm an
   Operations audit entry; read only the published course and lesson from the
   learner runtime endpoint.
7. Attempt a draft runtime read and a direct-publish-from-draft command; both
   must fail without disclosing a snapshot.
8. Confirm the alert dashboard and response channel before any learner exposure.

## First production exposure

1. Repeat the staging checklist against production with the production release
   owner and on-call responder present.
2. Restrict authoring to internal operators for one business day using RBAC.
   RBAC is an access gate, not a runtime kill switch.
3. Observe runtime errors, latency, publication failures, and audit persistence
   for the durations in `monitoring/alerts.yml`.
4. Retain database audit output, smoke evidence, dashboard links, and supply
   chain artifacts with the release ticket.

## Rollback

1. Remove `content.curriculum.*` permissions from rollout operators to stop new
   authoring/publication.
2. Revert only to an application version confirmed compatible with additive
   nullable pointer columns.
3. Do not roll back by deleting revision pointers, snapshots, migrations, or
   Operations audit history.
4. Confirm learner runtime reads still return only published pointers; notify
   the release channel and preserve the incident record.

## Evidence that closes the release gate

| Required item | Acceptable evidence |
|---|---|
| Database readiness | Target-environment migration audit and validation output, with expected checksums. |
| Access readiness | Named operators, permission grant evidence, and allowed/denied smoke results. |
| Monitoring | Provider dashboard/alert links plus named response channel. |
| Supply chain | CycloneDX SBOM, OSV delta result, and SPDX allowlist result for the release candidate. |
| Operations guide | This draft adopted in the release system, including the actual target and owner names. |
