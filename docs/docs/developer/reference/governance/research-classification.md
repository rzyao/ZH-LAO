---
status: baseline
last_updated: 2026-09-04
---

# Research classification

Research informs authority; it is not authority by default. A conclusion becomes
canonical only when it is deliberately incorporated into the owning Product,
Domain, Architecture, Database, API Contract, ADR, or governance document.

| Asset | Classification | Role and routing |
| --- | --- | --- |
| [`PRODUCT_RESEARCH_REPORT.md`](https://github.com/rzyao/ZH-LAO/blob/main/PRODUCT_RESEARCH_REPORT.md) | Evidence | Product archaeology and implementation evidence. Route current product claims to `reference/product/`; do not use it as a parallel product spec. |
| [`MARKET_RESEARCH.md`](https://github.com/rzyao/ZH-LAO/blob/main/MARKET_RESEARCH.md) | Derived Analysis | Market/competitor analysis with externally variable inputs. Revalidate before using it for a product decision. |
| [`USER_JOURNEY_RESEARCH.md`](https://github.com/rzyao/ZH-LAO/blob/main/USER_JOURNEY_RESEARCH.md) | Evidence | User-journey research. Canonical user flows and domain rules remain with their owning Product/Domain documents. |
| [`FEATURE_ARCHITECTURE_RESEARCH.md`](https://github.com/rzyao/ZH-LAO/blob/main/FEATURE_ARCHITECTURE_RESEARCH.md) | Historical Research | Migration rationale for the retired Feature Lane model and the Blueprint direction. It is archival evidence, not an active Feature authority. |
| `docs/docs/developer/reference/{product,domains,architecture,contracts,adr,governance}/` | Canonical | Current authority is distributed by subject according to [DOCUMENT_CONTRACT](../../DOCUMENT_CONTRACT.md). |

No root research document is obsolete at this time. Keep archival evidence when
it explains a decision; mark it obsolete only when a named successor and reason
are recorded here or in the design register.
