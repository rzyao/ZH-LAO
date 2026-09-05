# Content Delta Spec: Lao-letter admin CRUD

> Feature: `lao-letter-admin-ui-refresh` | Change: CR-002 | Date: 2026-09-05

## ADDED Requirements

### FR-007 — Create Lao-letter drafts

<!-- CR-002: 补齐字母管理 CRUD -->
The admin UI SHALL expose creation of a `lo_letter` draft only to operators with
`content.lo_letters.write`, using the existing canonical category endpoint and
only the fields defined for `content.lo_letters`.

### FR-008 — Edit via working revisions

<!-- CR-002: 补齐字母管理 CRUD -->
The admin UI SHALL update an existing working draft with its optimistic-lock
version. It SHALL derive a new working revision before editing a published
letter and SHALL never mutate a published revision in place.

### FR-009 — Archive instead of physical delete

<!-- CR-002: 补齐字母管理 CRUD -->
The UI SHALL label the destructive action as archive and use the existing
asynchronous archive task with a required reason and confirmation. It SHALL NOT
offer or call physical deletion.
