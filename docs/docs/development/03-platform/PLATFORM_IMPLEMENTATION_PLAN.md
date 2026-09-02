---
status: audited
phase: 3
phase_name: Platform Domain
document: PLATFORM_IMPLEMENTATION_PLAN
last_updated: 2026-09-02
depends_on:
  - FOUNDATION_GATE = PASS
  - IDENTITY_GATE = PASS
database_authority:
  - database/migrations/0300_platform.sql
  - docs/docs/domains/platform/database.md
exit_gate: PLATFORM_GATE
implementation_started: false
lifecycle: historical
derived_from: domains/platform/index.md
---


# ZH-LAO  — PLATFORM IMPLEMENTATION PLAN

⚠️ **派生文档（DERIVED）** — 规范归属（canonical owner）：`domains/platform/index.md`。本文件为实现轨（implementation-track）文档，**不是产品/领域事实权威**（Constitution 原则 II）。产品/领域事实以规范归属文档为准，请勿在此重复或自行修改事实。




> 目标路径：`docs/docs/development/03-platform/PLATFORM_IMPLEMENTATION_PLAN.md`
>
> 本文是 PHASE 3 — Platform Domain 的完整实施分计划。
>
> 本会话仅冻结计划，不执行任何 Platform application/repository/HTTP 正式实现。

---

# 1. Phase Status

前置：

```text
PostgreSQL  Baseline = COMPLETE / PASS
Application Foundation = COMPLETE / PASS
Identity Domain = COMPLETE / PASS / FROZEN
```

当前：

```text
PHASE 3 — Platform Domain = DESIGN COMPLETE
PLATFORM_IMPLEMENTATION_STARTED = NO
```

只有：

```text
PLATFORM_DESIGN_GATE = PASS
```

才允许另一个执行开发会话开始 PLT-01。

---

# 2. Authority & Precedence

优先级：

```text
1. Frozen migration / forward migrations
2. Frozen global architecture / MASTER_DEVELOPMENT_PLAN
3. Latest Platform frozen domain documentation
4. PLATFORM_USE_CASES.md
5. PLATFORM_CONFIG_CONTRACTS.md
6. PLATFORM_API.md
7. This implementation plan
```

不得通过代码反向改变已经冻结的产品语义。

---

# 3. Frozen Scope

6 tables only：

```text
platform.feature_flags
platform.feature_flag_overrides
platform.runtime_configs
platform.app_versions
platform.announcements
platform.regions
```

禁止新增第 7 张 Platform business table。

Shared：

```text
infrastructure.system_outbox_events
```

V1 Platform 不要求 Outbox event。

---

# 4. Known Physical Contract Correction

最新 frozen `docs/docs/domains/platform/database.md` 明确要求：

```text
feature_flag_overrides partial UNIQUE x3
+ region reverse index
```

但历史 frozen `database/migrations/0300_platform.sql` 当前未包含这 4 个 index。

这不是重新设计数据库，而是**已冻结文档与实际物理 baseline 的一致性缺口**。

因此 Implementation 前置任务必须：

```text
新增 forward-only corrective migration
不得修改 0300_platform.sql
```

目标 index：

```sql
CREATE UNIQUE INDEX uq_feature_flag_overrides_region
ON platform.feature_flag_overrides (feature_flag_id, region_id)
WHERE region_id IS NOT NULL AND client_platform IS NULL;

CREATE UNIQUE INDEX uq_feature_flag_overrides_client
ON platform.feature_flag_overrides (feature_flag_id, client_platform)
WHERE region_id IS NULL AND client_platform IS NOT NULL;

CREATE UNIQUE INDEX uq_feature_flag_overrides_region_client
ON platform.feature_flag_overrides (feature_flag_id, region_id, client_platform)
WHERE region_id IS NOT NULL AND client_platform IS NOT NULL;

CREATE INDEX idx_feature_flag_overrides_region_id
ON platform.feature_flag_overrides (region_id)
WHERE region_id IS NOT NULL;
```

Migration name/sequence 由执行会话根据当前最新 migration 序号选择。

这一步必须先通过 fresh DB + migration compatibility test，才允许实现 Override write path。

---

# 5. Target Module Shape

建议：

```text
apps/backend/src/modules/platform/
├── application/
│   ├── ports/
│   ├── use-cases/
│   └── services/
├── domain/
├── infrastructure/
├── http/
├── public/
└── index.ts
```

保持与 Identity module 的 modular-monolith layering 一致。

禁止 cross-domain repository。

---

# 6. Task Plan

## PLT-00 — Design Freeze

**Goal**

确认本会话 5 个 canonical 文档和 Design Gate 不再存在产品未决项。

**Scope**

- Use Cases；
- Feature Flag contract；
- Runtime Config contract；
- App Version contract；
- Announcement contract；
- Region contract；
- Public/API contract；
- Outbox/cache/concurrency decisions。

**Files**

```text
docs/docs/development/03-platform/*
```

**Tests**

Document cross-check only。

**Audit**

Database ↔ Use Case ↔ Contract ↔ API ↔ Public boundary。

**Gate**

```text
PLATFORM_DESIGN_GATE = PASS
```

---

## PLT-01 — Physical Contract Correction

**Goal**

用 forward-only migration 补齐 frozen Override partial uniqueness/index contract。

**Scope**

- 3 partial UNIQUE；
- 1 region partial index；
- no table/column change；
- no edit to `0300_platform.sql`。

**Files**

```text
database/migrations/<next>_platform_override_indexes.sql
database/checks/** if needed
database/test/**
```

**Tests**

- fresh DB migration PASS；
- duplicate region scope rejected；
- duplicate client scope rejected；
- duplicate region+client scope rejected；
- distinct scopes coexist；
- expected-schema checks PASS。

**Audit**

确认这只是 frozen contract correction，不改变产品模型。

**Gate**

```text
PLATFORM_PHYSICAL_CONTRACT = PASS
```

---

## PLT-02 — Module Skeleton

**Goal**

建立 Platform module 分层骨架、composition surface 和 test layout。

**Scope**

- application/domain/infrastructure/http/public；
- no business implementation beyond wiring skeleton。

**Files**

```text
apps/backend/src/modules/platform/**
apps/backend/test/**platform**
```

**Tests**

- typecheck；
- import boundary；
- module composition smoke。

**Audit**

No dependency from Platform to Identity internals / Operations internals。

**Gate**

Module structure PASS。

---

## PLT-03 — Domain Types & Errors

**Goal**

冻结 code-level types/lifecycle guards/errors。

**Scope**

- Feature key/status/context/reason；
- Runtime config type/definition/value；
- App version status/policy decision；
- Announcement status/scope；
- Region code/status；
- stable Platform errors。

**Files**

```text
apps/backend/src/modules/platform/domain/**
```

**Tests**

- transition tables；
- value validation；
- immutable identifiers。

**Audit**

No DB row type leaks into domain/public contract。

**Gate**

Domain semantics PASS。

---

## PLT-04 — Repository Layer

**Goal**

实现只访问 `platform.*` 的 repositories。

**Scope**

- flags/overrides；
- runtime configs；
- app versions；
- announcements；
- regions；
- batch read paths；
- row/advisory locking support。

**Files**

```text
apps/backend/src/modules/platform/application/ports/**
apps/backend/src/modules/platform/infrastructure/**
```

**Tests**

- PostgreSQL repository integration；
- row mapping；
- no cross-schema SQL；
- unique/FK error translation。

**Audit**

Repository ownership = Platform only。

**Gate**

Repository contract PASS。

---

## PLT-05 — Feature Flag Runtime

**Goal**

实现 `EvaluateFeatureFlag` / `ResolveFeatureFlags`。

**Scope**

```text
status
region+client
region
client
default
```

Unknown region fallback；missing flag fail-closed；batch query。

**Files**

```text
application/use-cases/evaluate-feature-flag*
application/use-cases/resolve-feature-flags*
```

**Tests**

完整 precedence matrix + inactive/retired + missing + unknown Region。

**Audit**

No user/percentage/global override invention。

**Gate**

Feature runtime PASS。

---

## PLT-06 — Feature Flag Management

**Goal**

实现 Flag lifecycle 和 Override current-state management。

**Scope**

- Create/Update/Retire Flag；
- Set/Remove Override；
- Management list/read；
- scope-normalized upsert；
- retired guard；
- optimistic conflict/row lock。

**Files**

```text
application/use-cases/*feature-flag*
```

**Tests**

- key immutable；
- inactive sets default false；
- retired terminal；
- retired override reject；
- concurrent same-scope set ×2；
- set/remove race。

**Audit**

Physical partial unique indexes verified in real PostgreSQL。

**Gate**

Feature management PASS。

---

## PLT-07 — Runtime Config

**Goal**

实现 typed registry + current-state reader/management。

**Scope**

- code registry；
- server-only default；
- per-key Zod/application schema；
- Get/Resolve；
- Set/Retire；
- fallback semantics；
- no arbitrary config query。

**Files**

```text
application/runtime-config-registry*
application/use-cases/*runtime-config*
```

**Tests**

- all DB value types；
- schema mismatch；
- missing fallback/no fallback；
- retired；
- unregistered；
- stale update；
- prohibited business-owned/secret definition review tests where practical。

**Audit**

No万能配置中心 smell。

**Gate**

Runtime Config Contract PASS。

---

## PLT-08 — App Version Policy

**Goal**

实现 exact-build policy 与 latest/minimum derivation。

**Scope**

- CheckAppVersion；
- draft/create/update/publish/policy/delete draft；
- numeric build ordering only；
- platform advisory lock；
- higher active target invariant。

**Files**

```text
application/use-cases/*app-version*
```

**Tests**

- active/deprecated/blocked/unknown/draft；
- version mismatch；
- latest/minimum；
- blocked with/without target；
- concurrent publish/policy race。

**Audit**

No SemVer/store_url/channel/region invention。

**Gate**

App Version PASS。

---

## PLT-09 — Announcements

**Goal**

实现 active announcement resolution 与 management lifecycle。

**Scope**

- 4 scopes；
- active window；
- deterministic sort；
- draft/publish/update/retire/delete draft；
- published scope/start immutability；
- no locale/priority/delivery。

**Files**

```text
application/use-cases/*announcement*
```

**Tests**

- scope matrix；
- scheduled/expired；
- unknown Region；
- sort；
- lifecycle/race。

**Audit**

Announcement ≠ Notification。

**Gate**

Announcement PASS。

---

## PLT-10 — Regions

**Goal**

实现 Platform Region canonical read/control semantics。

**Scope**

- GetRegion；
- ListActiveRegions；
- Create/Update/Retire；
- BCP47/IANA validation；
- code immutable；
- no cross-domain write。

**Files**

```text
application/use-cases/*region*
```

**Tests**

- active/inactive/retired；
- code validation/immutability；
- locale/timezone validation；
- retired terminal；
- inactive existing historical read。

**Audit**

Region ≠ user location/geography domain。

**Gate**

Region PASS。

---

## PLT-11 — Public Contracts

**Goal**

建立其他 Backend Domain 只能依赖的稳定 Platform read boundary。

**Scope**

Required：

```text
PlatformFeatureEvaluator
PlatformRuntimeConfigReader
PlatformRegionReader
```

AppVersion/Announcement public module 只有真实 backend consumer 才增加。

**Files**

```text
apps/backend/src/modules/platform/public/**
```

**Tests**

- public contract tests；
- export audit；
- internal BIGINT/repository/DB executor not exported。

**Audit**

Cross-domain boundary PASS。

**Gate**

Public Contract PASS。

---

## PLT-12 — Runtime HTTP/API

**Goal**

实现冻结的 public runtime HTTP。

**Scope**

```text
POST /api/v1/platform/features/resolve
POST /api/v1/platform/app-version/check
GET  /api/v1/platform/announcements
GET  /api/v1/platform/regions
GET  /api/v1/platform/regions/:code
```

**Files**

```text
apps/backend/src/modules/platform/http/**
bootstrap/composition registration
```

**Tests**

- HTTP schema；
- error envelope；
- public auth policy；
- no BIGINT；
- rate-limit integration if applicable。

**Audit**

No generic public config endpoint。

**Gate**

Runtime API PASS。

---

## PLT-13 — Management HTTP / Operations Integration Boundary

**Goal**

冻结并准备 Management routes，但不创建第二套 operator auth。

**Scope**

- Platform management route handlers/adapters；
- Operations permission requirements；
- if Operations auth provider not available, keep routes unregistered or integration-gated；
- no unsecured production management route。

**Files**

```text
apps/backend/src/modules/platform/http/admin/**
```

**Tests**

- route contract unit tests；
- no-auth registration forbidden；
- permission key mapping contract。

**Audit**

Operations owns actor/RBAC；Platform owns state。

**Gate**

Management boundary PASS；actual operator E2E may defer to Operations phase/integration。

---

## PLT-14 — Admin / Mobile Integration Contract

**Goal**

满足 MASTER 19A 的客户端策略，但不在本设计会话编码客户端。

**Scope**

Admin：

```text
Greenfield pages/workflows for Platform management after Operations auth exists
```

Mobile：

```text
 Feature Flag client = REWRITE
App Version bootstrap integration = REWRITE
Region runtime integration = REFACTOR/REWRITE by current mobile state
Announcement integration = REFACTOR/REWRITE by current page state
```

**Files**

执行会话根据 Admin/Mobile 实际目录确定。

**Tests**

- client contract tests；
- feature flag interpretation matches backend；
- forced update UX；
- Region/Announcement runtime behavior。

**Audit**

No client-side alternate business semantics。

**Gate**

Client contract readiness PASS。

---

## PLT-15 — Security / Race / Integration

**Goal**

执行真实 PostgreSQL、HTTP、boundary、race 测试。

**Scope**

- Override uniqueness race；
- Flag state race；
- Runtime config stale write；
- App version cross-row invariant race；
- Announcement lifecycle race；
- Region lifecycle race；
- public HTTP security；
- management auth boundary；
- no cross-domain SQL。

**Files**

```text
apps/backend/test/**
database/test/**
```

**Tests**

全部 required matrix。

**Audit**

No Redis/event hacks introduced。

**Gate**

Security/Race PASS。

---

## PLT-16 — Final Domain Audit

**Goal**

实现后逐项重新审计 Frozen DB ↔ code ↔ public/API contract。

**Scope**

- six tables；
- all required use cases；
- public contract；
- HTTP；
- Operations boundary；
- client integration status；
- migration correction；
- tests。

**Files**

```text
docs/docs/development/03-platform/PLATFORM_IMPLEMENTATION_REPORT.md
```

**Tests**

full backend checks + PostgreSQL integration。

**Audit**

BLOCKER/HIGH/MEDIUM/LOW final implementation audit。

**Gate**

No blocker/high before exit。

---

## PLT-17 — Report / Exit Gate

**Goal**

形成 Phase 3 final report 并停止。

**Scope**

```text
Implementation Report
Test Results
Audit
Remaining Issues
PLATFORM_GATE
```

**Files**

```text
PLATFORM_IMPLEMENTATION_REPORT.md
DEVELOPMENT_PROGRESS.md
```

**Tests**

```text
typecheck
lint
unit
integration
HTTP
race/security
fresh DB compatibility
```

**Audit**

No automatic Phase 4 start。

**Gate**

```text
PLATFORM_GATE = PASS / FAIL
```

---

# 7. Implementation Ordering

```text
PLT-00 Design Freeze
↓
PLT-01 Physical Contract Correction
↓
PLT-02 Module Skeleton
↓
PLT-03 Domain Types
↓
PLT-04 Repository
↓
PLT-05 Feature Runtime
↓
PLT-06 Feature Management
↓
PLT-07 Runtime Config
↓
PLT-08 App Version
↓
PLT-09 Announcements
↓
PLT-10 Regions
↓
PLT-11 Public Contracts
↓
PLT-12 Runtime HTTP
↓
PLT-13 Management Boundary
↓
PLT-14 Client Contract
↓
PLT-15 Security/Race/Integration
↓
PLT-16 Final Audit
↓
PLT-17 Report / Exit Gate
```

---

# 8. Non-goals

Phase 3 不实现/不引入：

```text
7th Platform table
Redis
Kafka/RabbitMQ
Platform-specific operator auth
Notification Domain
Config history/versioning/rollback
User/segment/percentage Feature Flag targeting
App release channel/region policy
Announcement locale/priority/push/read receipt
Geography hierarchy
cross-domain physical FK
```

---

# 9. Exit Requirements

最终实施 Gate 至少要求：

```text
Frozen tables = 6
Required Use Cases implemented = 33
Unsupported scope invention = 0
Cross-domain SQL = 0
Internal BIGINT exposure = 0
Feature evaluation ambiguity = 0
Runtime Config arbitrary-key access = 0
App Version policy ambiguity = 0
Announcement/Notification ownership overlap = 0
Identity/Platform Region ownership overlap = 0
Operations/Platform ownership overlap = 0
True PostgreSQL race tests = PASS
Runtime HTTP contract tests = PASS
Management security boundary = PASS
```

本计划冻结后停止；不要在当前设计会话开始 PLT-01。
