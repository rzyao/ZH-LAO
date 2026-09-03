# ZH-LAO Repository AI Router

This file routes an agent to the repository's existing authorities. It is not a
second specification. Read [docs/AGENTS.md](docs/AGENTS.md) before changing
documentation, requirements, contracts, or implementation plans.

## Repository structure

- `docs/docs/developer/` — canonical product, domain, architecture, contract,
  governance, and Feature Blueprint documentation.
- `database/` — physical database migrations and database verification reports.
- `specs/` and `.specify/` — Spec Kit feature-specification workflow artifacts.
- `.product-forge/` — optional lifecycle orchestration artifacts; never a
  product or technical authority.
- `apps/` — implementation reality and tests, not product authority.
- `scripts/` — documentation generators and audits.

## Canonical authority chain

```text
Product Truth
  → Domain Truth
  → Architecture Truth
  → Database / API Contracts
  → Spec Kit Feature Specification
  → Implementation
  → Feature Blueprint / Detail Documentation
```

The detailed precedence, exceptions for frozen migrations, and conflict-stop
rule are in [DOCUMENT_CONTRACT](docs/docs/developer/DOCUMENT_CONTRACT.md) and
the [Spec Kit constitution](.specify/memory/constitution.md). Do not create a
parallel source of truth; link to the relevant owner instead.

## Routing rules

- **Product truth:** `docs/docs/developer/reference/product/`.
- **Domain truth:** `docs/docs/developer/reference/domains/<domain>/`.
- **Architecture truth:** `docs/docs/developer/reference/architecture/` and
  accepted ADRs under `reference/adr/`.
- **Database truth:** frozen `database/migrations/`, then the matching domain
  database page and database reports.
- **API contracts:** `docs/docs/developer/reference/contracts/` plus any frozen
  public contract named by its domain authority.
- **Feature specification:** Spec Kit artifacts in `specs/`, governed by
  `.specify/memory/constitution.md`; they are downstream of the authorities
  above and never override them.
- **Feature Blueprint:** `docs/docs/developer/features/`; these pages describe
  user-facing capability and carry delivery evidence. They are downstream
  documentation, not a product/domain/architecture authority.

## Product Forge and Spec Kit

- **Product Forge** is optional lifecycle/orchestration tooling. Its artifacts
  live below `.product-forge/features/`; it may coordinate research, gates and
  handoffs, but cannot define or overwrite Product, Domain, Architecture,
  Database, or API truth.
- **Spec Kit** is the sole machine-readable/executable Feature Specification
  workflow. Read authority first; stop and report an exact conflict rather than
  deriving a requirement from code or an orchestration artifact.
- Product Forge may feed evidence into Spec Kit only after the applicable owner
  accepts it. Neither tool self-certifies a verification pass.

## Feature documentation and verification

- Feature pages use the **Blueprint** model. The old six-column **Feature Lane**
  model is **DEPRECATED**, **NON-CANONICAL**, and **MUST NOT BE RESTORED**.
- `portfolio_status: active` means portfolio membership, never implementation.
  A page existing is not evidence either.
- Delivery-layer status and `last_verified_at` require code, tests, CI, or
  explicit verification evidence as defined by DOCUMENT_CONTRACT. Preserve
  `not_evidenced` when evidence is absent.

## Validation

From `docs/`, run `pnpm docs:audit`, `pnpm docs:lifecycle-audit`, and
`pnpm docs:build`. `docs:audit` runs metadata, authority, link, and Feature
catalog validation. Run `python scripts/audit_feature_detail_pages.py` when
working on Feature pages.

## Forbidden actions and deprecated models

- Do not modify Product/Domain/Architecture/Database/API authority merely to
  match code, a Spec Kit artifact, Product Forge output, or chat assumptions.
- Do not restore Feature Lane, a fixed delivery matrix, `SPEC_SYSTEM.md`, or
  parallel `*-v2`, `*-final`, or hand-maintained Feature status catalogs.
- Do not infer `verified`/`implemented` from documentation, planning, task
  checkboxes, or a lifecycle status.
- Root research reports are classified by
  [research-classification](docs/docs/developer/reference/governance/research-classification.md);
  they are evidence or historical/derived analysis unless explicitly promoted.
