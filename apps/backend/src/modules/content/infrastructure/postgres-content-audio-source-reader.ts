import type { DatabaseExecutor } from '../../../database/executor.js';
import type { AudioEligibleContentEntityType, ContentAudioSource, ContentAudioSourceReader } from '../public/content-public-queries.js';

type Row = { entity_type: string; entity_id: string; revision_id: string; language_code: 'zh' | 'lo'; status: ContentAudioSource['status']; text_snapshot: string; pronunciation_snapshot: unknown; no_audio: boolean };
export class PostgresContentAudioSourceReader implements ContentAudioSourceReader {
  constructor(private readonly db: DatabaseExecutor) {}
  async findRevision(revisionId: string): Promise<ContentAudioSource | null> {
    const result = await this.db.query<Row>(`${this.select()} WHERE cr.revision_public_id = $1 AND cr.entity_type = 'content'`, [revisionId]);
    return result.rows[0] ? this.map(result.rows[0]) : null;
  }
  async findCurrentPublished(entityType: AudioEligibleContentEntityType, entityId: string): Promise<ContentAudioSource | null> {
    const result = await this.db.query<Row>(`${this.select()} WHERE c.content_type = $1 AND c.public_id = $2 AND cr.entity_type = 'content' AND cr.status = 'published' ORDER BY cr.revision_number DESC LIMIT 1`, [entityType, entityId]);
    return result.rows[0] ? this.map(result.rows[0]) : null;
  }
  private map(row: Row): ContentAudioSource {
    return { entityType: row.entity_type, entityId: row.entity_id, revisionId: row.revision_id, languageCode: row.language_code, status: row.status, textSnapshot: row.text_snapshot ?? '', pronunciationSnapshot: row.pronunciation_snapshot, noAudio: row.no_audio };
  }
  private select(): string { return `SELECT c.content_type AS entity_type, c.public_id AS entity_id, cr.revision_public_id AS revision_id, c.language AS language_code, cr.status, COALESCE(cr.snapshot #>> '{fields,displayForm}', cr.snapshot #>> '{fields,character}', cr.snapshot #>> '{fields,text}', cr.snapshot ->> 'unicodeChar', CASE c.content_type WHEN 'lo_letter' THEN l.character WHEN 'lo_syllable' THEN ls.text WHEN 'lo_word' THEN lw.text WHEN 'lo_sentence' THEN lsent.text WHEN 'zh_pinyin_element' THEN zp.display_form WHEN 'zh_syllable' THEN zs.display_form END) AS text_snapshot, COALESCE(cr.snapshot #> '{audio,pronunciation}', cr.snapshot -> 'ipaPhonetic', jsonb_strip_nulls(jsonb_build_object('tone', cr.snapshot #> '{fields,tone}', 'romanization', cr.snapshot #> '{fields,romanization}', 'pronunciationKey', cr.snapshot #> '{fields,pronunciationKey}'))) AS pronunciation_snapshot, COALESCE((cr.snapshot #>> '{audio,noAudio}')::boolean, (cr.snapshot ->> 'noAudio')::boolean, false) AS no_audio FROM content.content_revisions cr JOIN content.contents c ON c.public_id = cr.entity_id LEFT JOIN content.lo_letters l ON l.content_id = c.id LEFT JOIN content.lo_syllables ls ON ls.content_id = c.id LEFT JOIN content.lo_words lw ON lw.content_id = c.id LEFT JOIN content.lo_sentences lsent ON lsent.content_id = c.id LEFT JOIN content.zh_pinyin_elements zp ON zp.content_id = c.id LEFT JOIN content.zh_syllables zs ON zs.content_id = c.id`; }
}
