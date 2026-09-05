# Plan

No frozen migration is changed. D-172 supersedes the audio-only `1360_content_audio_eligible_types.sql` with the D-164 language structure in `1310_content_language_structures.sql`; the original file and existing ledger entries remain intact. The migration runner excludes the duplicate script through explicit supersession metadata and checks legacy untoned data before upgrading. Implement Content public query service plus PostgreSQL reader; replace repository SQL with an application port invoked by publish.
