# Wireframes: Dictionary Content Management

## Word dictionary aggregate editor

```text
┌ Word list ─────────────────────────────────────────────────────┐
│ Search | status filter | [New Word]                              │
│ Word | language | revision status | [Edit dictionary]            │
└─────────────────────────────────────────────────────────────────┘
┌ Edit Word dictionary revision (Dialog) ─────────────────────────┐
│ Parent Word UUID / Draft · lock version                          │
│ [Meanings: language, class, definition, order] [+]               │
│ [Examples: published Sentence selector, optional meaning] [+]   │
│ [Equivalents: published cross-language Word selector] [+]       │
│ [Relations: same-language Word selector, type, order] [+]       │
│ [Tags: existing tag selection]                                   │
│ Inline validation and target publication state                    │
│ [Cancel] [Save draft]                                             │
└─────────────────────────────────────────────────────────────────┘
```

Components: CMP-ContentList, CMP-Dialog, CMP-DictionaryEditor, CMP-Button. Child IDs are omitted.

## Full revision review and comparison

```text
┌ Version comparison ─────────────────────────────────────────────┐
│ Revision N-1                 │ Revision N                       │
│ All dictionary sections       │ All dictionary sections          │
│ Changed fields highlighted    │ Changed fields highlighted       │
│ [Approve] [Reject] (reason*)                                     │
└─────────────────────────────────────────────────────────────────┘
```

Components: CMP-VersionCompare, CMP-StatusBadge, CMP-ReviewDialog. Reject is disabled until a reason is present.

## Publish preflight and confirmation

```text
┌ Publish revision? ──────────────────────────────────────────────┐
│ ✓ aggregate valid / ✓ targets currently published               │
│ or: blockers: disabled, missing, draft, rejected target          │
│ [Cancel] [Confirm publish]                                       │
└─────────────────────────────────────────────────────────────────┘
```

Components: CMP-PublishPreflight, CMP-ConfirmDialog, CMP-Button. Failed preflight/transaction retains state and reports safe blockers.
