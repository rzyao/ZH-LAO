# Implementation log — Curriculum authoring and publishing

## Checkpoint 1 — T005 and T007

| Check | Status | Notes |
|---|:---:|---|
| Task-Code correspondence | ✅ | Content repository, use cases, admin routes, transactional audit boundary and pointer migration are present. |
| Spec AC alignment | ✅ | Working revision, lifecycle guard, pointer switch, permissions and audit follow FR-001 through FR-007. |
| Unplanned changes | ⚠️ | Admin detail/history read model and ADR-032 lifecycle receipts were required to make the approved workflow operable. |
| Plan alignment | ✅ | Content remains the aggregate owner; Operations is accessed only through its public transactional audit boundary. |
| Dependency / supply-chain | ✅ | No dependency added. |

**Verdict:** WARNING — remaining tasks TC006, TC008, TC010, T011, T014 and T015 still require integration/E2E evidence or UI completion.

## Checkpoint 2 — Admin course authoring workbench

| Check | Status | Notes |
|---|:---:|---|
| Course workbench | ✅ | List, draft creation, working-version details, Unit add/delete/reorder, revision history and legal lifecycle actions are available. |
| Immutability guard | ✅ | A published course derives a separate working version; save always targets the working revision with concurrency tokens. |
| Verification | ✅ | Admin typecheck, production build and course component tests passed; backend typecheck plus targeted curriculum route/state/use-case tests passed. |
| Remaining UI scope | ⚠️ | Dedicated lesson editor and approved-revision picker are still outstanding; course structures may only pin published lesson revisions. |

**Verdict:** WARNING — TC006, TC008, TC010, T014 and T015 remain, as does the lesson-authoring UI gap.

## Checkpoint 3 — Lesson aggregate workbench

| Check | Status | Notes |
|---|:---:|---|
| Existing contract delivery | ✅ | Implemented the already-authorized lesson detail, structure replacement and published-version re-edit endpoints. |
| Admin flow | ✅ | A Unit can create a lesson draft and open its dedicated working-version page; that page adds ordered sections and uses the lesson lifecycle actions. |
| Safety | ✅ | Lesson structure replacement accepts only a draft working revision and checks both the root timestamp and revision lock version. The repository validates every item pin before persisting. |
| Verification | ✅ | Backend typecheck and 7 targeted route/public tests passed; admin typecheck, course-component tests, and production build passed. |
| Remaining UI scope | ⚠️ | The section-item revision picker and the explicit post-publication course-structure pinning interaction remain to be built. |

## Checkpoint 4 — Fixed-published-revision authoring loop

| Check | Status | Notes |
|---|:---:|---|
| Content pins | ✅ | The lesson workbench reuses existing category/list/history APIs and offers only revisions whose history status is `published`. |
| Lesson pins | ✅ | Course details expose only published lessons belonging to the same course and Unit; adding one creates a local fixed pin saved through the existing aggregate-document endpoint. |
| Browser journey | ✅ | Playwright validates course draft creation, detail navigation, published-lesson visibility and attachment. |
| Cross-client regression | ✅ | Mobile typecheck and all 74 Jest tests passed. |
| Database validation | ⚠️ | `database validate` passed. The pointer integration test is blocked by the unrelated forward migration `1380_operations_password_reset_permission.sql` extending its intentionally fixed migration-list assertion. |

## Checkpoint 5 — Cross-workspace verification

| Check | Status | Notes |
|---|:---:|---|
| Admin E2E | ✅ | `curriculum-authoring-publishing.spec.ts` passes in Chromium. |
| Mobile | ✅ | Typecheck and 13 suites / 74 tests pass. |
| Backend scoped | ✅ | Curriculum route, public-projection, state-machine and use-case tests pass. |
| Backend full suite | ⚠️ | 274 passing, 40 database-dependent skips, 2 failures outside this Feature: `identity-authentication-provider.test.ts` and `identity-core-types.test.ts`. |

## Checkpoint 6 — Real PostgreSQL curriculum integration

The repository integration suite was run against ephemeral, fully migrated PostgreSQL databases using the configured administrator connection. All seven curriculum cases passed across three bounded runs: published-pointer projection; atomic publication; idempotency replay/conflict; lifecycle locks; rollback of an unpublished pin; cross-lesson pin rejection; and cross-content pin rejection.
