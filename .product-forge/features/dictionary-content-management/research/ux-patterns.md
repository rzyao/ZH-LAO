# UX Research: Dictionary Content Management

## Operational workflow

Use the existing category list as the entry point for Chinese and Lao Words. A row opens a scoped editor for the parent Word's working revision. The editor groups meanings, examples, equivalents, relations, and tags as ordered/repeatable sections; it does not expose internal row IDs. Sentence selection must search/select only eligible published Sentence Content. Relation target selection must visibly distinguish cross-language equivalent from same-language relation and prevent self-reference.

The established review page remains the place for state transitions. Reviewers compare whole immutable revisions, including all dictionary sections, then approve or reject with a required rejection remark. Publishers get a clear preflight result before the atomic publish action. This retains the existing UI's version comparison and permission-filtered controls rather than adding a separate child-record approval experience.

## Interaction findings

- Dense, scan-oriented management data belongs in an editable list/table, while a scoped editor is appropriate for a related task; this aligns with [Apple’s list/table guidance](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables) and sheet guidance.
- Forms should validate relation direction, target eligibility, duplicate semantics, and ordering as soon as operators enter them; [Apple’s data-entry guidance](https://developer.apple.com/design/human-interface-guidelines/entering-data?language=_3) supports immediate feedback.
- Actions must be context-sensitive: publish is unavailable until the revision is approved, reject requires a remark, and relation/example controls should hide unavailable targets. The existing Admin review panel already embodies this pattern.

## Accessibility and safety

All list/filter and editor actions require labels, keyboard-accessible ordering controls, inline validation, and non-color-only lifecycle status. Error copy must identify the user-correctable condition without exposing database constraint names. No public or Admin DTO should render internal BIGINT values.
