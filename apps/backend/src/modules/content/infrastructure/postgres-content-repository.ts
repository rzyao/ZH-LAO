import type { Pool, PoolClient } from 'pg';
import {
  LaoCharacter,
  type LaoCharacterClassification,
  type LaoCharacterSubtype,
  type OnlineStatus,
} from '../domain/lao-character.js';
import {
  LaoCharacterRevision,
  type CharacterRevisionSnapshot,
  type RevisionReviewStatus,
} from '../domain/lao-character-revision.js';
import type {
  ContentRepository,
  PublishedCharacterView,
} from '../application/ports/repositories.js';

export class PostgresContentRepository implements ContentRepository {
  constructor(private readonly pool: Pool) {}

  async findCharacterById(id: string): Promise<LaoCharacter | null> {
    const res = await this.pool.query(
      `SELECT c.public_id as id, l.character as unicode_char, l.letter_type as classification,
              l.letter_class as subtype, l.sort_order, c.status as online_status,
              c.created_at, c.updated_at,
              (SELECT revision_public_id FROM content.content_revisions cr
               WHERE cr.entity_id = c.public_id AND cr.status = 'published' LIMIT 1) as published_revision_id,
              (SELECT revision_public_id FROM content.content_revisions cr
               WHERE cr.entity_id = c.public_id AND cr.status IN ('draft', 'pending_review', 'approved', 'rejected')
               ORDER BY cr.revision_number DESC LIMIT 1) as working_revision_id
       FROM content.contents c
       JOIN content.lo_letters l ON l.content_id = c.id
       WHERE c.public_id = $1 AND c.content_type = 'lo_letter'`,
      [id]
    );

    if (res.rows.length === 0) return null;
    return this.mapCharacterRow(res.rows[0]);
  }

  async findCharacterByUnicode(unicodeChar: string): Promise<LaoCharacter | null> {
    const res = await this.pool.query(
      `SELECT c.public_id as id, l.character as unicode_char, l.letter_type as classification,
              l.letter_class as subtype, l.sort_order, c.status as online_status,
              c.created_at, c.updated_at,
              (SELECT revision_public_id FROM content.content_revisions cr
               WHERE cr.entity_id = c.public_id AND cr.status = 'published' LIMIT 1) as published_revision_id,
              (SELECT revision_public_id FROM content.content_revisions cr
               WHERE cr.entity_id = c.public_id AND cr.status IN ('draft', 'pending_review', 'approved', 'rejected')
               ORDER BY cr.revision_number DESC LIMIT 1) as working_revision_id
       FROM content.contents c
       JOIN content.lo_letters l ON l.content_id = c.id
       WHERE l.character = $1 AND c.content_type = 'lo_letter'`,
      [unicodeChar]
    );

    if (res.rows.length === 0) return null;
    return this.mapCharacterRow(res.rows[0]);
  }

  async findRevisionById(revisionId: string): Promise<LaoCharacterRevision | null> {
    const res = await this.pool.query(
      `SELECT revision_public_id as id, entity_id as character_id, revision_number as revision_no,
              status as review_status, snapshot, created_by_operator_id, published_at,
              created_at, updated_at
       FROM content.content_revisions
       WHERE revision_public_id = $1 AND entity_type = 'content'`,
      [revisionId]
    );

    if (res.rows.length === 0) return null;
    return this.mapRevisionRow(res.rows[0]);
  }

  async findActiveWorkingRevision(characterId: string): Promise<LaoCharacterRevision | null> {
    const res = await this.pool.query(
      `SELECT revision_public_id as id, entity_id as character_id, revision_number as revision_no,
              status as review_status, snapshot, created_by_operator_id, published_at,
              created_at, updated_at
       FROM content.content_revisions
       WHERE entity_id = $1 AND entity_type = 'content'
         AND status IN ('draft', 'pending_review', 'approved', 'rejected')
       ORDER BY revision_number DESC LIMIT 1`,
      [characterId]
    );

    if (res.rows.length === 0) return null;
    return this.mapRevisionRow(res.rows[0]);
  }

  async findPublishedRevision(characterId: string): Promise<LaoCharacterRevision | null> {
    const res = await this.pool.query(
      `SELECT revision_public_id as id, entity_id as character_id, revision_number as revision_no,
              status as review_status, snapshot, created_by_operator_id, published_at,
              created_at, updated_at
       FROM content.content_revisions
       WHERE entity_id = $1 AND entity_type = 'content' AND status = 'published'
       LIMIT 1`,
      [characterId]
    );

    if (res.rows.length === 0) return null;
    return this.mapRevisionRow(res.rows[0]);
  }

  async saveCharacterAndRevision(
    character: LaoCharacter,
    revision: LaoCharacterRevision
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const contentRes = await client.query(
        `INSERT INTO content.contents (public_id, language, content_type, status, created_at, updated_at)
         VALUES ($1, 'lo', 'lo_letter', $2, $3, $4)
         RETURNING id`,
        [character.id, character.onlineStatus === 'online' ? 'active' : 'disabled', character.createdAt, character.updatedAt]
      );

      const contentDbId = contentRes.rows[0].id;

      await client.query(
        `INSERT INTO content.lo_letters (content_id, character, letter_type, letter_class, name, romanization, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          contentDbId,
          character.unicodeChar,
          character.classification,
          character.subtype,
          revision.snapshot.description,
          revision.snapshot.ipaPhonetic,
          character.sortOrder,
        ]
      );

      await client.query(
        `INSERT INTO content.content_revisions (
           revision_public_id, entity_type, entity_id, revision_number,
           status, snapshot, created_by_operator_id, created_at
         ) VALUES ($1, 'content', $2, $3, $4, $5, $6, $7)`,
        [
          revision.id,
          character.id,
          revision.revisionNo,
          revision.reviewStatus,
          JSON.stringify(revision.snapshot),
          revision.createdByOperatorId,
          revision.createdAt,
        ]
      );

      if (!character.noAudio) {
        await client.query(
          `INSERT INTO audio.audio_slots (
             id, source_domain, content_entity_type, content_entity_id,
             language_code, audio_role, required_content_revision_id,
             required_audio_input_hash, status
           ) VALUES (gen_random_uuid(), 'content', 'lo_letter', $1, 'lo', 'pronunciation', $2, $3, 'active')
           ON CONFLICT (source_domain, content_entity_type, content_entity_id, language_code, audio_role)
           DO UPDATE SET required_content_revision_id = EXCLUDED.required_content_revision_id,
                         required_audio_input_hash = EXCLUDED.required_audio_input_hash`,
          [character.id, revision.id, revision.snapshot.audioInputHash]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async saveRevision(revision: LaoCharacterRevision): Promise<void> {
    await this.pool.query(
      `INSERT INTO content.content_revisions (
         revision_public_id, entity_type, entity_id, revision_number,
         status, snapshot, created_by_operator_id, published_at, created_at
       ) VALUES ($1, 'content', $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (revision_public_id)
       DO UPDATE SET status = EXCLUDED.status,
                     snapshot = EXCLUDED.snapshot,
                     published_at = EXCLUDED.published_at`,
      [
        revision.id,
        revision.characterId,
        revision.revisionNo,
        revision.reviewStatus,
        JSON.stringify(revision.snapshot),
        revision.createdByOperatorId,
        revision.publishedAt,
        revision.createdAt,
      ]
    );
  }

  async publishRevisionAtomic(
    characterId: string,
    targetRevision: LaoCharacterRevision,
    previousPublishedRevision: LaoCharacterRevision | null
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      if (previousPublishedRevision) {
        await client.query(
          `UPDATE content.content_revisions
           SET status = 'superseded'
           WHERE revision_public_id = $1`,
          [previousPublishedRevision.id]
        );
      }

      await client.query(
        `UPDATE content.content_revisions
         SET status = 'published', published_at = $1
         WHERE revision_public_id = $2`,
        [targetRevision.publishedAt ?? new Date(), targetRevision.id]
      );

      // Update physical read model
      await client.query(
        `UPDATE content.lo_letters
         SET name = $1, romanization = $2, sort_order = $3
         FROM content.contents c
         WHERE content.lo_letters.content_id = c.id
           AND c.public_id = $4`,
        [
          targetRevision.snapshot.description,
          targetRevision.snapshot.ipaPhonetic,
          targetRevision.snapshot.sortOrder,
          characterId,
        ]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async listPublishedCharacters(classification?: string): Promise<PublishedCharacterView[]> {
    let query = `
      SELECT c.public_id as id, l.character as unicode_char, l.letter_type as classification,
             l.letter_class as subtype, l.romanization as ipa_phonetic, l.name,
             l.sort_order,
             CASE WHEN l.letter_type = 'symbol' THEN true ELSE false END as no_audio,
             NULL as audio_url
      FROM content.contents c
      JOIN content.lo_letters l ON l.content_id = c.id
      JOIN content.content_revisions cr ON cr.entity_id = c.public_id AND cr.status = 'published'
      WHERE c.status = 'active' AND c.content_type = 'lo_letter'
    `;
    const params: any[] = [];

    if (classification) {
      params.push(classification);
      query += ` AND l.letter_type = $${params.length}`;
    }

    query += ` ORDER BY CASE l.letter_type
                  WHEN 'consonant' THEN 1
                  WHEN 'vowel' THEN 2
                  WHEN 'symbol' THEN 3
                  ELSE 4 END, l.sort_order ASC`;

    const res = await this.pool.query(query, params);
    return res.rows.map((r: any) => ({
      id: r.id,
      unicodeChar: r.unicode_char,
      classification: r.classification,
      subtype: r.subtype,
      ipaPhonetic: r.ipa_phonetic,
      name: r.name,
      sortOrder: r.sort_order,
      noAudio: r.no_audio,
      audioUrl: r.audio_url,
    }));
  }

  private mapCharacterRow(row: any): LaoCharacter {
    return new LaoCharacter({
      id: row.id,
      unicodeChar: row.unicode_char,
      classification: row.classification,
      subtype: row.subtype,
      sortOrder: row.sort_order ?? 0,
      noAudio: row.classification === 'symbol',
      onlineStatus: row.online_status === 'active' ? 'online' : 'offline',
      publishedRevisionId: row.published_revision_id ?? null,
      workingRevisionId: row.working_revision_id ?? null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  private mapRevisionRow(row: any): LaoCharacterRevision {
    const snap = typeof row.snapshot === 'string' ? JSON.parse(row.snapshot) : row.snapshot;
    return new LaoCharacterRevision({
      id: row.id,
      characterId: row.character_id,
      revisionNo: row.revision_no,
      snapshot: snap,
      reviewStatus: row.review_status,
      createdByOperatorId: row.created_by_operator_id,
      publishedAt: row.published_at ? new Date(row.published_at) : null,
      lockVersion: 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at ?? row.created_at),
    });
  }
}
