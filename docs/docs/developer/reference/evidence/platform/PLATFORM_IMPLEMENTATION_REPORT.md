---
status: complete
last_updated: 2026-09-02
lifecycle: historical
---

> 迁移说明：本文是迁移时保留的契约/证据快照，不是当前调度权限。当前产品状态请看 [ZH-LAO 产品开发全景](/developer/)，执行规格请看 `.specify/` 与 `specs/`，真实完成请以代码、测试与 CI 为准。


# Platform Implementation Report

**Document**: `docs/docs/developer/reference/evidence/platform/PLATFORM_IMPLEMENTATION_REPORT`
**Phase**: Phase 3 — Platform Domain  
**Date**: 2026-08-31  
**Status**: COMPLETE  
**Gate**: PASS  

---

## 1. Executive Summary

Platform Domain (Phase 3) implementation and final audit hardening are complete, strictly adhering to the frozen design specifications (`PLATFORM_IMPLEMENTATION_PLAN.md`, `PLATFORM_USE_CASES.md`, `PLATFORM_CONFIG_CONTRACTS.md`, `PLATFORM_API.md`, and `PLATFORM_DESIGN_AUDIT.md`).

Key achievements & audits:
1. **HIGH-01 Transaction Boundary = FIXED**: `PlatformManagementService` explicitly orchestrates write operations via Foundation's `TransactionManager`, ensuring `FOR UPDATE` row locks and platform advisory locks run within dedicated single-transaction sessions.
2. **HIGH-02 App Version updateAvailable = FIXED**: Corrected `updateAvailable` computation for unknown and draft builds using strict numeric comparison (`latestActive.buildNumber > buildNumber`).
3. **MEDIUM-01 Race Test = FIXED**: App Version concurrency coverage now includes a real PostgreSQL lock-wait proof: one transaction deliberately holds the platform advisory lock, the management command is observed waiting in `pg_stat_activity`, and it proceeds only after the holder commits. A second concurrent policy test verifies the higher-active-target invariant remains valid.
4. **MEDIUM-02 Runtime Config Public Typing = FIXED**: The cross-domain contract now exposes Platform-owned opaque typed handles (`platformDefaultLocaleConfig`, `platformSupportEmailConfig`, `platformMaintenanceNoticeUrlConfig`) instead of constructible generic config definitions. A module-private `unique symbol` brand prevents consumers from fabricating a registered key with an arbitrary generic return type, while the internal Runtime Config registry remains authoritative for validation and fallback semantics.
5. **LOW-01 Root Export Boundary = FIXED**: Tightened `modules/platform/index.ts` to export only module bootstrap essentials (`platformModule`), preserving `modules/platform/public` as the sole cross-domain interface.
6. **Physical Baseline**: Forward migration `1250_platform_override_indexes.sql` establishes 3 partial UNIQUE indexes and 1 region index with 0 changes to `0300_platform.sql`.
7. **6 Frozen Tables**: Strict adherence to the 6 tables. Zero new tables, zero Redis/Kafka.

---

## 2. Table & Architecture Mapping

| Frozen Table | Ownership | Repository | Use Cases Supported |
|---|---|---|---|
| `platform.feature_flags` | Platform | `PostgresFeatureFlagRepository` | `EvaluateFeatureFlag`, `ResolveFeatureFlags`, `CreateFeatureFlag`, `UpdateFeatureFlag`, `RetireFeatureFlag`, `ListFeatureFlagsForManagement` |
| `platform.feature_flag_overrides` | Platform | `PostgresFeatureFlagOverrideRepository` | `SetFeatureFlagOverride`, `RemoveFeatureFlagOverride` |
| `platform.runtime_configs` | Platform | `PostgresRuntimeConfigRepository` | `GetRuntimeConfig`, `ResolveRuntimeConfigs`, `SetRuntimeConfig`, `RetireRuntimeConfig`, `ListRuntimeConfigsForManagement` |
| `platform.app_versions` | Platform | `PostgresAppVersionRepository` | `CheckAppVersion`, `CreateAppVersionDraft`, `UpdateAppVersionDraft`, `PublishAppVersion`, `SetAppVersionPolicy`, `DeleteAppVersionDraft`, `ListAppVersionsForManagement` |
| `platform.announcements` | Platform | `PostgresAnnouncementRepository` | `GetActiveAnnouncements`, `CreateAnnouncementDraft`, `UpdateAnnouncement`, `PublishAnnouncement`, `RetireAnnouncement`, `DeleteAnnouncementDraft`, `ListAnnouncementsForManagement` |
| `platform.regions` | Platform | `PostgresRegionRepository` | `GetRegion`, `ListActiveRegions`, `CreateRegion`, `UpdateRegion`, `RetireRegion`, `ListRegionsForManagement` |

---

## 3. Implemented Capabilities & Contracts

### 3.1 Feature Flag Evaluation
- **Algorithm**: Master status check (`inactive` / `retired` fail-closed to `false`) > `region_id + client_platform` > `region_id` > `client_platform` > `default_enabled`.
- **Missing flag**: Fail-closed `false` (`reason: flag_not_found`).
- **Unknown region**: Fallback to client/default without failing the query.
- **Batching**: Up to 100 flags resolved in a single batch query without N+1.

### 3.2 Runtime Config
- **Code Registry**: Defined in application layer (`RuntimeConfigRegistry`). Rejects unregistered keys and remains the source of truth for `valueType`, validation, fallback, and visibility semantics.
- **Type Safety**: Cross-domain callers use Platform-owned opaque typed handles. The public contract no longer exposes a constructible generic definition whose `T` can be chosen independently of the registered key. Compile-time negative coverage verifies a consumer cannot construct `PlatformRuntimeConfigHandle<number>` for `default_locale` without bypassing the type system.
- **Missing/Retired**: Returns fallback if defined on the internal registry, otherwise throws `RUNTIME_CONFIG_UNAVAILABLE`.
- **No Secret/Generic Dump**: Server-only by default; no generic public dump endpoint.

### 3.3 App Version Policy
- **Ordering**: Strict numeric `build_number` comparison. `version` is display/identity only (no SemVer parsing).
- **Exact Build Row**: Determines lifecycle status (`active`, `deprecated`, `blocked`).
- **Invariant Guarantee**: Blocking or deprecating a build requires a higher active released target on the platform.
- **Concurrency**: Platform-scoped transaction advisory lock prevents race conditions during policy changes. Integration coverage explicitly observes a management command waiting on the PostgreSQL advisory lock before the holder transaction is released.

### 3.4 Announcements
- **Active Window**: Filtered by `starts_at <= now AND (ends_at IS NULL OR ends_at > now)`.
- **Scope**: Supports Global, Region, Client, and Region+Client scopes.
- **Deterministic Sort**: `starts_at DESC, created_at DESC, public_id ASC`.

### 3.5 Regions
- **Stable Identity**: `code` (e.g., `CN`, `LA`). Internal BIGINT IDs are never exposed.
- **Validation**: BCP 47 language tags for `default_locale` and IANA timezone strings for `timezone`.
- **Logical Relation**: Independent from Identity user profiles; no cross-domain physical foreign keys.

---

## 4. Public Contracts & HTTP Endpoints

### 4.1 Public Boundary (`modules/platform/public`)
- `PlatformFeatureEvaluator`: `evaluateFeature`, `resolveFeatures`.
- `PlatformRuntimeConfigReader`: `getRuntimeConfig`, `resolveRuntimeConfigs` + Platform-owned opaque canonical config handles.
- `PlatformRegionReader`: `getRegion`, `listActiveRegions`, `isRegionActive`.

### 4.2 Runtime HTTP Routes
- `POST /api/v1/platform/features/resolve` (Public)
- `POST /api/v1/platform/app-version/check` (Public)
- `GET /api/v1/platform/announcements` (Public)
- `GET /api/v1/platform/regions` (Public)
- `GET /api/v1/platform/regions/:code` (Public)

All responses use strict Zod schemas and Foundation error envelopes. Zero internal BIGINT IDs exposed.

---

## 5. Test & Audit Summary

### 5.1 Test Results
- **Unit Tests**: 17 test files, 47 tests passing, including opaque Runtime Config public-handle compile-time coverage.
- **Integration Tests**: 17 test files, 101 tests passing on real PostgreSQL, including explicit advisory-lock wait observation and App Version invariant concurrency coverage.
- **Backend CI**: `verify`, `build`, `test:integration` all PASS on the final Platform code fix commit.
- **Database Baseline Validation**: `database test` and `database validate` PASS; 18 migrations remain the frozen baseline with no Platform schema expansion.

### 5.2 Findings
- **BLOCKER**: 0
- **HIGH**: 0
- **MEDIUM**: 0
- **LOW**: 0

---

## 6. Exit Gate

```text
PLATFORM_DESIGN_GATE = PASS
PLATFORM_PHYSICAL_CONTRACT = PASS
PLATFORM_IMPLEMENTATION = COMPLETE
PLATFORM_GATE = PASS
PLATFORM_DOMAIN = FROZEN
```
