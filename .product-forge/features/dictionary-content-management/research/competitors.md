# Market Pattern Research: Dictionary Content Management

## Scope note

This is a pattern study, not a source of product rules. Repository Product/Domain/Architecture authorities remain binding.

## Relevant patterns

- Dictionary products commonly combine searchable lexical entries with senses, translations, examples, and related terms. The ZH-LAO model deliberately improves on a flat entry by retaining canonical Content ownership and separate semantic relation types.
- Editorial systems use a reviewable aggregate rather than independently publishing every field. That pattern directly matches D-158: one immutable Knowledge revision carries all dictionary facts through review and publish.
- Operational tooling works best when recurring records are scanable in a list and detail editing is scoped to the selected parent. This supports reusing the Admin category list and editor instead of creating an independent dictionary table UI.

## Explicit non-adoptions

- No user search history, saved entries, or learning state in Content; these remain Learning facts.
- No third-party search engine: PostgreSQL `pg_trgm` remains the authority for the initial search implementation.
- No client-visible internal child IDs and no independently addressable Meaning, Example, Equivalent, or Relation endpoints.
