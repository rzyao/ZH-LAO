# Curriculum authoring and publishing SLOs

The canonical feature documents require published-only reads and atomic publication,
but do not set numerical availability or latency targets. Until an owner accepts
service-level targets, these are release-operational proposals rather than a new
product or architecture authority.

| SLI | Proposed target | Measurement | Release use |
|---|---:|---|---|
| Published curriculum runtime availability | 99.5% successful responses | `/api/v1/content/courses*`, rolling 30 days | Roll back on sustained 5xx error rate above 5% for 5 minutes. |
| Published curriculum runtime latency | p95 within the existing API service target | rolling 10 minutes | Investigate on sustained breach. |
| Publish transaction integrity | 100% successful publishes have a matching audit entry and new published pointer | database/audit reconciliation per release | Stop publication and investigate any mismatch. |
| Draft leakage | 0 non-published revisions returned from runtime endpoints | synthetic runtime probe per release | Block release on any disclosure. |

## Error budget and ownership

No production telemetry provider is configured in `.product-forge/config.yml`.
The release owner must create the dashboard and alerts described in this folder,
name the on-call channel, and record the accepted API latency target before
production exposure.
