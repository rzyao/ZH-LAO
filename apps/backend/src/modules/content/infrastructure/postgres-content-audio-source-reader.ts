import type { DatabaseExecutor } from '../../../database/executor.js';
import type { AudioEligibleContentEntityType, ContentAudioSource, ContentAudioSourceReader } from '../public/content-public-queries.js';

type Row = { entity_type: string; entity_id: string; revision_id: string; language_code: 'zh' | 'lo'; status: ContentAudioSource['status']; snapshot: unknown };
export class PostgresContentAudioSourceReader implements ContentAudioSourceReader {
  constructor(private readonly db: DatabaseExecutor) {}
  async findRevision(revisionId: string): Promise<ContentAudioSource | null> {
    const result = await this.db.query<Row>(`SELECT c.content_type AS entity_type, c.public_id AS entity_id, cr.revision_public_id AS revision_id, c.language AS language_code, cr.status, cr.snapshot FROM content.content_revisions cr JOIN content.contents c ON c.public_id = cr.entity_id WHERE cr.revision_public_id = $1 AND cr.entity_type = 'content'`, [revisionId]);
    return result.rows[0] ? this.map(result.rows[0]) : null;
  }
  async findCurrentPublished(entityType: AudioEligibleContentEntityType, entityId: string): Promise<ContentAudioSource | null> {
    const result = await this.db.query<Row>(`SELECT c.content_type AS entity_type, c.public_id AS entity_id, cr.revision_public_id AS revision_id, c.language AS language_code, cr.status, cr.snapshot FROM content.content_revisions cr JOIN content.contents c ON c.public_id = cr.entity_id WHERE c.content_type = $1 AND c.public_id = $2 AND cr.entity_type = 'content' AND cr.status = 'published' ORDER BY cr.revision_number DESC LIMIT 1`, [entityType, entityId]);
    return result.rows[0] ? this.map(result.rows[0]) : null;
  }
  private map(row: Row): ContentAudioSource {
    const snapshot = typeof row.snapshot === 'string' ? JSON.parse(row.snapshot) as Record<string, unknown> : row.snapshot as Record<string, unknown>;
    const text = ['text', 'unicodeChar', 'syllable', 'description'].map((key) => snapshot[key]).find((value): value is string => typeof value === 'string') ?? '';
    return { entityType: row.entity_type, entityId: row.entity_id, revisionId: row.revision_id, languageCode: row.language_code, status: row.status, textSnapshot: text, pronunciationSnapshot: snapshot['ipaPhonetic'] ?? snapshot['pronunciation'] ?? null, noAudio: snapshot['noAudio'] === true };
  }
}
