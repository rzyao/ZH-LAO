-- D-172: prepare the older audio-only branch for D-164 without altering frozen SQL.
-- Do not infer a tone for an existing untoned identity or delete user content.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'content' AND table_name = 'zh_syllables' AND column_name = 'syllable'
  ) THEN
    IF EXISTS (SELECT 1 FROM content.zh_syllables)
       OR EXISTS (SELECT 1 FROM content.contents WHERE content_type = 'zh_syllable') THEN
      RAISE EXCEPTION 'D-172: legacy untoned syllables require an explicit content mapping before upgrading; no data was removed';
    END IF;
    DROP TABLE content.zh_syllables;
  END IF;
END
$$;
