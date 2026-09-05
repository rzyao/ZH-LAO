# Research Index: Dictionary Content Management

> Generated: 2026-09-05 | Feature: `dictionary-content-management` | Baseline: `79feb6f7`

## Executive summary

The feature is an operational extension of the existing Content aggregate workflow, not a new dictionary domain. Word Content is the stable entry identity; meanings, examples, equivalents, relations, and tags are revision-owned aggregate facts. The delivery should reuse established structured-content lifecycle, exact category permissions, Operations audit, and Admin list/review UI patterns while adding a public projection that reads only active, published Word revisions.

## Documents

- [Codebase analysis](./codebase-analysis.md) — existing backend, database, and Admin integration points.
- [UX patterns](./ux-patterns.md) — editor, review, and accessibility guidance.
- [Market patterns](./competitors.md) — non-binding editorial pattern comparison.

## Open risks

- The frozen historical Content HTTP contract names aggregate Knowledge endpoints while newer D-164 permissions are category-specific. Planning must bind those aggregate operations to the current Word category permissions, not invent `content.knowledge.*` catalog entries.
- The effective snapshot schema and exact request/response payloads must be derived from current Content route/DTO conventions without exposing child BIGINTs.
- Public projection must prove draft, rejected, and unpublished relation targets cannot leak.
