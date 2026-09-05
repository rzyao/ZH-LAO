# Tasks：课程编排与发布

## 1. Foundation and migration

- [x] T001 — Add ADR-029 forward migration and migration validation for Course/Lesson revision pointers.
      Paths: database:migrations/1350_curriculum_revision_pointers.sql, database:test/curriculum-revision-pointers.test.mjs
      Size: M
- [x] TC002 — Integration test pointer constraints and empty/legacy-data migration behavior.
      Paths: backend:test/modules/content/curriculum-revision.repository.integration.test.ts
      Test-first: true
      Size: M
- [x] T003 — Implement Course/Lesson aggregate, typed snapshot schema, repository port and Postgres pointer repository.
      Paths: backend:src/modules/content/domain/curriculum-revision.ts, backend:src/modules/content/application/ports/curriculum-repository.ts, backend:src/modules/content/infrastructure/postgres-curriculum-repository.ts
      Size: L

## 2. Authoring and lifecycle backend

- [x] TC004 — Test lifecycle legality, active-work guard, stale lock and reference-pin validation.
      Paths: backend:test/modules/content/curriculum-revision.state.test.ts, backend:test/modules/content/curriculum-reference-validation.test.ts
      Test-first: true
      Size: L
- [x] T005 — Implement Course/Lesson authoring, structure replacement and revision review use cases.
      Paths: backend:src/modules/content/application/use-cases/manage-curriculum.ts, backend:src/modules/content/application/index.ts
      Size: L
- [x] TC006 — Integration test atomic publish, idempotency, audit and rollback on invalid reference.
      Paths: backend:test/integration/curriculum-publish.integration.test.ts
      Test-first: true
      Size: L
- [x] T007 — Implement atomic publish and Operations audit/event integration.
      Paths: backend:src/modules/content/application/use-cases/publish-curriculum-revision.ts, backend:src/modules/content/http/composition.ts
      Size: L

## 3. HTTP and public projections

- [x] TC008 — Contract test Admin lifecycle/structure routes and Runtime published-only DTOs.
      Paths: backend:test/modules/content/curriculum-http.contract.test.ts, backend:test/integration/curriculum-runtime.integration.test.ts
      Test-first: true
      Size: L
- [x] T009 — Add Admin Course/Lesson revision routes and Runtime catalog/structure/content routes with UUID-only safe mappers.
      Paths: backend:src/modules/content/http/curriculum-admin-routes.ts, backend:src/modules/content/http/curriculum-public-routes.ts, backend:src/modules/content/http/index.ts
      Size: L

## 4. Admin and mobile consumers

- [x] TC010 — Admin component tests for course list/editor/revision actions and stale/invalid-reference states.
      Paths: admin:src/features/content/courses/course-editor.test.tsx, admin:src/features/content/courses/course-list.test.tsx
      Test-first: true
      Size: M
- [x] T011 — Implement Admin Course list, editor, revision history and action UI using existing design-system components.
      Paths: admin:src/features/content/courses/api.ts, admin:src/features/content/courses/queries.ts, admin:src/features/content/courses/pages/course-list.tsx, admin:src/features/content/courses/pages/course-editor.tsx, admin:src/features/content/courses/components/revision-history.tsx
      Size: XL
- [x] TC012 — Mobile API/screen tests for published-only catalog, structure and not-public states.
      Paths: mobile:__tests__/course-api.test.ts, mobile:__tests__/course-screens.test.tsx
      Test-first: true
      Size: M
- [x] T013 — Implement Mobile Course catalog, structure and Lesson reader.
      Paths: mobile:src/features/courses/api/courseApi.ts, mobile:src/features/courses/screens/course-catalog-screen.tsx, mobile:src/features/courses/screens/course-structure-screen.tsx, mobile:src/features/courses/screens/lesson-content-screen.tsx
      Size: L

## 5. End-to-end and regression verification

- [x] T014 — Add Admin E2E and cross-workspace regression coverage for JRN-001 through JRN-004 and all P0 edges.
      Paths: admin:e2e/curriculum-authoring-publishing.spec.ts, backend:test/integration/curriculum-publish.integration.test.ts, mobile:__tests__/course-screens.test.tsx
      Size: L
- [x] T015 — Run scoped database/backend/admin/mobile validation and record traceability evidence.
      Paths: database:test/content-curriculum-validation.test.mjs, backend:test/, admin:e2e/curriculum-authoring-publishing.spec.ts, mobile:__tests__/
      Size: M
