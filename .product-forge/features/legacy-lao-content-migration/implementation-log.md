# Implementation log

## Red gate — 2026-09-05

`node --test test/legacy-lao-content-mapping.test.mjs test/legacy-lao-content-r2.test.mjs test/legacy-lao-content-import.test.mjs`
failed as expected before implementation. All three test files reported `ERR_MODULE_NOT_FOUND` for their planned migration modules. No database connection or data mutation occurred.

The implementation may now proceed test-first. The live `--apply` task remains excluded until a separate explicit user authorization is received.

## Green unit contract — 2026-09-05

The four focused unit contracts now pass: configuration guard, draft-only plan and omitted sentence relation, deterministic canonical selection, and R2 provider/bucket/key mapping. No source or target database was contacted.

## Live migration and verification — 2026-09-05

The authorized live run committed 666 new draft Content records (261 syllables, 239 words, 166 sentences), 838 syllable-letter relations, 306 word-syllable relations, and 699 sentence-word relations. It created 666 R2-backed assets, Slots, pending-review Tasks, and pending-review Audio Asset Versions.

One legacy R2 object was shared by two syllables. With explicit authorization, the `ຊ້າໆ` binding was copied once to a deterministic migration key. Four duplicated or stale sentence-word source relations were retained with an empty surface form so the original sentence text remains exactly reconstructable; all four are in the generated isolation report.

Post-migration SQL verification confirmed 666 draft revisions, zero sentence surface reconstruction mismatches, and a repeat run inserted zero records.
