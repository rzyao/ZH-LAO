# Phase Digest — Research

> Feature: `admin-operator-password-reset` | Date: 2026-09-04

## Key decisions

- Scope is an administrator-only reset of an independent back-office account; it is not public recovery, Mobile account linkage, invitation, or MFA work.
- Standard track is selected because the change spans Identity, Operations, the Admin UI, RBAC/audit vocabulary, and a security-sensitive API contract.
- Problem Discovery was skipped at the user's direction because a concrete incident and bounded outcome are already confirmed.

## Artifacts produced

- `research/competitors.md` — official reference patterns from Entra, AWS IAM, and Google Workspace.
- `research/ux-patterns.md` — confirmation, one-time-secret, accessibility, and error-state findings.
- `research/codebase-analysis.md` — reusable modules, authority boundaries, and migration assessment.
- `research/README.md` — synthesis and open decisions.

## Open risks

- No canonical rule yet covers target eligibility, self/peer/privileged-account reset, forced first-login change, or lost-response/retry behavior.
- The new permission and audit action are not registered in the canonical Operations contract or status-code vocabulary.
- These are authority decisions, not implementation choices; later phases must not infer them from the existing self-service password-change code.

## Handoff notes

- Product Spec must define explicit user stories, acceptance scenarios, state/transaction semantics, and scope boundaries before any contract change.
- Revalidation must confirm Identity ownership of credentials/sessions, Operations ownership of authorization/audit, and the one-time-secret privacy boundary from ADR-025/D-160.
