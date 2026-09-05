# Supply-chain readiness record

Date: 2026-09-05

The release-readiness scan found neither `syft` nor `osv-scanner` on the
workspace PATH. Consequently this feature does not claim an SBOM, CVE delta
scan, or license allowlist result. No dependency was added by the feature in
the code-review evidence, but that is not a substitute for the required scan.

| Carrier | Result | Required follow-up |
|---|---|---|
| SBOM (Syft, CycloneDX) | Not run: tool unavailable | Generate and attach an SBOM for the released artifact before ship. |
| SCA (OSV diff) | Not run: tool unavailable | Run an OSV scan against the merge-base and release candidate; resolve or formally accept new high/critical findings. |
| License allowlist | Not run: tool unavailable | Run the configured SPDX allowlist check. |
| Build provenance | Not configured | Add `actions/attest-build-provenance` to the release workflow before general availability. |

The repository CI does run database, backend, admin, mobile, and documentation
verification, but its workflows contain no build-attestation step.
