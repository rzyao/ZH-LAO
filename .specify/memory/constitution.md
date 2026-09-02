# ZH-LAO Constitution

> Ratified by **Stage 3 — Activate Spec Kit Governance** (2026-09-02).
> This file is NON-NEGOTIABLE. It supersedes the self-built "Executable Spec
> System" (SPEC_SYSTEM.md) as the project's Feature Spec workflow. Every Spec
> Kit artifact (spec/plan/tasks/analyze/implement output) MUST comply with
> Principles I–XI. AI or human statements cannot self-certify a Gate PASS.

## Source of Truth Priority

```text
Constitution (this file, non-negotiable)
→ Frozen Physical Migration (when it touches the physical DB)
→ Accepted ADR / Frozen Architecture Contract
→ Canonical Product / Domain Docs
→ Upstream Frozen Public Contracts
→ Spec Kit spec.md / plan.md / tasks.md (constitutional workflow artifacts)
```

Spec Kit artifacts are authoritative **below** their input authority. A spec /
plan / tasks file never overrides the authority it was compiled from.

## Core Principles

### I. Source of Truth Priority

See the chain above. It defines who wins a conflict. A Spec Kit artifact never
overrides the authority it was derived from. When in doubt, the higher layer in
the chain decides; chat context is never authority.

### II. Existing Code Is Engineering Reality, Not Product Authority

During implementation, do NOT reverse-engineer product requirements from
current code behavior. If code agrees with authority, follow the docs. If code
conflicts with authority, treat it as a conflict (Principle VIII) — never
"the code is more reasonable, so override authority."

### III. Requirement ID Stability

Specs use Spec Kit native IDs: `FR-` / `SC-` / `US-` (plus an optional `AREA`
scope tag for domain grouping). Once published, an ID is never reused. Moving a
file or reordering tasks does not change an ID. A superseded requirement keeps
its original ID. One requirement has exactly one canonical definition; other
documents only reference it.

### IV. Verifiability (Given/When/Then)

Every observable requirement has at least one Given/When/Then acceptance
scenario. Acceptance scenarios are acceptance + test-design INPUT, not examples.
Scenario IDs (e.g. `FR-012-AS01`) are stable and traceable.

### V. State Machines Are Mandatory Where Lifecycle Exists

Any lifecycle / async / money / permission / publish / irreversible semantics
MUST declare a state machine in the spec (`states` / `initial` / `terminal` /
`legal transitions` / `guards` / `owning FR`). Tests MUST cover legal transition,
illegal rejection, guard, terminal, and concurrency / retry / idempotency.

### VI. Contract Reference Reality

A Contract Reference points to a REAL repository artifact (OpenAPI / Zod / frozen
HTTP / frozen migration / event schema). Frozen migration is the physical DB
truth; the spec references it, never copies a second schema. Forbid fabricating
OpenAPI / TS symbol / test for an unimplemented domain.

### VII. Decision Budget (LOCKED)

Implementation MUST NOT modify LOCKED decisions: API / Public / DB contract,
state transition, transaction boundary, error semantics, security / RBAC
invariant, cross-domain boundary. Private decomposition (CONSTRAINED) and local
variable / formatting (FREE) are the implementer's choice.

### VIII. Conflict Must STOP

Product / Requirement conflict (`SPEC_CONFLICT`), missing implementation
decision beyond the budget (`IMPLEMENTATION_BLOCKER`), or material `main` change
after generation (`REPOSITORY_DRIFT`) all STOP. Forbid: self-editing a
Requirement, silently changing a Public Contract, editing a frozen migration,
expanding Task scope, replacing repository evidence with chat memory, or
overriding authority with "code is more reasonable". Report exact sources + IDs
and wait for design to fill the gap. Do NOT guess.

### IX. Evidence Reality

Evidence = real execution results with per-item Requirement→test/check mapping.
"All tests pass" / "code should cover" / "only a directory is cited" /
"Blueprint pseudocode" are NOT evidence. AI / Implementation Report / hand JSON
/ Blueprint cannot self-certify PASS.

### X. Grounding Gate

Before claiming a Gate PASS, re-ground to current `main`: source path, exact
heading / symbol / field, current commit, authority cross-check, reproducible
evidence. Chat context is not authority.

### XI. Canonical Fact Single Ownership (ADR-018)

One business fact has exactly one authoritative owner. Cross-domain only via
logical UUID + Domain Service / Event / Outbox. Forbid cross-domain direct writes
and fact duplication. Read Model / Snapshot is not a second fact source.

## Spec Workflow Authority

GitHub **Spec Kit** is the project's ONLY Feature Spec workflow. The self-built
"Executable Spec System" (SPEC_SYSTEM.md) is `superseded` and retained for
history only. The canonical chain is:

```text
/speckit.specify → /speckit.plan → /speckit.tasks
               → /speckit.analyze → /speckit.implement → /speckit.converge
```

## Grounding Rules for AI Agents

Enforced through `docs/AGENTS.md` + the spec/plan templates (the permitted
fallback for the extension-hook mechanism, since no invocable grounding command
ships with this install — see the Spec Kit activation rules in this constitution and the current product panorama.)

1. `/speckit.specify` MUST first read the related authoritative docs
   (`docs/docs/developer/reference/domains/<domain>/`, `docs/docs/developer/reference/adr/`, `docs/docs/developer/reference/architecture/`, frozen Public
   Contract) as spec facts. Do not generate requirements from empty context.
2. `/speckit.plan` MUST first check existing code / schema / API / contracts /
   architecture; the plan describes only deltas + additions, never re-states
   known facts.
3. Existing code is engineering reality, not product authority (Principle II).
4. On `SPEC_CONFLICT` / `IMPLEMENTATION_BLOCKER` / `REPOSITORY_DRIFT`: STOP and
   report. Never guess or reverse-create a requirement.

## Governance

This Constitution supersedes all other Spec practices. Amendments require a
design-register entry (D-xxx) + approval + migration note. All PRs / reviews must
verify compliance with Principles I–XI.

**Version**: 1.0.0 | **Ratified**: 2026-09-02 | **Last Amended**: 2026-09-02
