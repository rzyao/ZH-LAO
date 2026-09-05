# Plan

No frozen migration is changed. Add forward migration `1360_content_audio_eligible_types.sql` because the frozen `contents` CHECK cannot represent the approved `zh_syllable` identity. Implement Content public query service plus PostgreSQL reader; replace repository SQL with an application port invoked by publish.
