# Sync & Verify Report: Curriculum authoring and publishing

> Feature: `curriculum-authoring-publishing` | Date: 2026-09-05
> Mode: quick, Layer 7 (cross-link integrity) | Phase transition: verification → release readiness
> Follow-up: approved corrections applied; 31 Feature Markdown files rechecked with zero broken relative links.

## Summary

| Severity | Count |
|---|---:|
| ❌ CRITICAL | 0 |
| ⚠️ WARNING | 0 |
| ℹ️ INFO | 0 |
| ✅ CLEAN | 1 |

**Verdict: CONSISTENT.**

## Layer results

### Layer 7: Cross-link integrity — ✅ CLEAN after correction

Thirty-one Feature Markdown files were checked. The initial check found six
relative links resolving outside the repository; the user approved the exact
prefix-only repairs below. The follow-up check found zero broken relative links.

### DRIFT-001: Transactional-audit ADR link resolves outside the repository

| Field | Value |
|---|---|
| Layer | 7: Cross-link integrity |
| Direction | Backward (artifact → authority) |
| Severity | CRITICAL |
| Category | structural |
| Source artifact | `authority-decision-package-002-transactional-curriculum-audit.md` |
| Actual | `../../../../docs/.../ADR-030-transactional-owner-domain-audit-boundary.md` does not exist from the Feature root. |
| Expected | `../../../docs/.../ADR-030-transactional-owner-domain-audit-boundary.md` resolves to the accepted ADR. |

**Resolution applied:** the relative-link prefix was corrected and rechecked.

### DRIFT-002 through DRIFT-004: Idempotency decision package has three broken authority links

| Field | Value |
|---|---|
| Layer | 7: Cross-link integrity |
| Direction | Backward (artifact → authority) |
| Severity | CRITICAL |
| Category | structural |
| Source artifact | `authority-decision-package-003-curriculum-idempotency.md` |
| Actual | Links to `versioning-review.md`, `CONTENT_API.md`, and ADR-032 use `../../../../docs/...` and resolve outside the repository. |
| Expected | Each uses `../../../docs/...` from the Feature root. |

**Resolution applied:** the three relative-link prefixes were corrected and rechecked.

### DRIFT-005: Product-spec ADR-029 link is one level too shallow

| Field | Value |
|---|---|
| Layer | 7: Cross-link integrity |
| Direction | Backward (artifact → authority) |
| Severity | CRITICAL |
| Category | structural |
| Source artifact | `product-spec/product-spec.md` |
| Actual | `../../../docs/.../ADR-029-curriculum-revision-published-view.md` resolves under `.product-forge/docs`. |
| Expected | `../../../../docs/.../ADR-029-curriculum-revision-published-view.md` resolves from the product-spec subdirectory to the accepted ADR. |

**Resolution applied:** the relative-link prefix was corrected and rechecked.

### DRIFT-006: Spec ADR-029 link is one level too shallow

| Field | Value |
|---|---|
| Layer | 7: Cross-link integrity |
| Direction | Backward (artifact → authority) |
| Severity | CRITICAL |
| Category | structural |
| Source artifact | `spec.md` |
| Actual | `../../docs/.../ADR-029-curriculum-revision-published-view.md` resolves under `.product-forge/docs`. |
| Expected | `../../../docs/.../ADR-029-curriculum-revision-published-view.md` resolves from the Feature root to the accepted ADR. |

**Resolution applied:** the relative-link prefix was corrected and rechecked.

## Resolution record

The six corrections were restricted to Feature-local relative-link prefixes.
They did not alter Product, Domain, Architecture, Database, API, or Spec Kit
requirements. The user explicitly approved them before application.
