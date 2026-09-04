-- Content–Audio public boundary: zh_syllable is a Content-owned logical entity.
-- This is forward-only; frozen migrations remain unchanged.
ALTER TABLE content.contents DROP CONSTRAINT contents_content_type_check;
ALTER TABLE content.contents ADD CONSTRAINT contents_content_type_check CHECK (content_type IN (
  'zh_pinyin', 'zh_hanzi', 'zh_word', 'zh_sentence', 'zh_syllable',
  'lo_letter', 'lo_syllable', 'lo_word', 'lo_sentence'
));

CREATE TABLE content.zh_syllables (
  content_id bigint PRIMARY KEY REFERENCES content.contents(id) ON DELETE RESTRICT,
  syllable varchar(16) NOT NULL UNIQUE,
  initial varchar(8),
  final varchar(16) NOT NULL,
  display_form varchar(16) NOT NULL
);
