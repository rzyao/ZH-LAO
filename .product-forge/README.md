# Product Forge boundary

Product Forge is retained because the repository contains its active Spec Kit
extension and Claude skills. It is a **lifecycle and orchestration tool**, not
a documentation authority.

## Authority boundary

```text
Canonical Docs = Product / Domain / Architecture Truth
Spec Kit       = machine-readable, executable Feature specification workflow
Product Forge  = optional lifecycle, research, gates, and orchestration
Feature Pages  = downstream Blueprint and delivery-evidence view
```

Before Product Forge research, planning, bridge, or spec-merge work, read the
repository `AGENTS.md`, `docs/AGENTS.md`, `DOCUMENT_CONTRACT.md`, the relevant
domain authority, accepted ADRs, physical migrations, and public contracts.
When any of those conflict with an artifact, Product Forge must stop and report
the sources. It must not resolve the conflict by changing authority documents,
claiming a Gate PASS, or treating task completion as implementation evidence.

All new Product Forge feature artifacts belong in `.product-forge/features/`.
They are temporary or traceability artifacts and must link outward to their
canonical sources. A later accepted Spec Kit change may reference them, but
they do not become an independent canonical specification.

The old Feature Lane lifecycle model is deprecated, non-canonical, and must
not be generated or restored. Use the Feature Blueprint pages and their
`delivery_layers` evidence metadata instead.
