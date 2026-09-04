import type { DatabaseExecutor } from '../../../database/executor.js';
import type { TransactionManager } from '../../../database/transaction-manager.js';
import {
  LaoCharacter,
} from '../domain/lao-character.js';
import {
  LaoCharacterRevision,
} from '../domain/lao-character-revision.js';
import type {
  ContentRepository,
  ManagedCharacterView,
  PublishedCharacterView,
} from '../application/ports/repositories.js';

export class PostgresContentRepository implements ContentRepository {
  constructor(
    private readonly db: DatabaseExecutor,
    private readonly transactions?: TransactionManager,
  ) {}

  async findCharacterById(id: string): Promise<LaoCharacter | null> {
    const res = await this.db.query(
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

    const first = res.rows[0];
    if (!first) return null;
    return this.mapCharacterRow(first as Record<string, unknown>);
  }

  async findCharacterByUnicode(unicodeChar: string): Promise<LaoCharacter | null> {
    const res = await this.db.query(
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

    const first = res.rows[0];
    if (!first) return null;
    return this.mapCharacterRow(first as Record<string, unknown>);
  }

  async findRevisionById(revisionId: string): Promise<LaoCharacterRevision | null> {
    const res = await this.db.query(
      `SELECT revision_public_id as id, entity_id as character_id, revision_number as revision_no,
              status as review_status, snapshot, created_by_operator_id, reviewed_by_operator_id,
              review_remark, reviewed_at, published_at, lock_version, created_at, updated_at
       FROM content.content_revisions
       WHERE revision_public_id = $1 AND entity_type = 'content'`,
      [revisionId]
    );

    const first = res.rows[0];
    if (!first) return null;
    return this.mapRevisionRow(first as Record<string, unknown>);
  }

  async findActiveWorkingRevision(characterId: string): Promise<LaoCharacterRevision | null> {
    const res = await this.db.query(
      `SELECT revision_public_id as id, entity_id as character_id, revision_number as revision_no,
              status as review_status, snapshot, created_by_operator_id, reviewed_by_operator_id,
              review_remark, reviewed_at, published_at, lock_version, created_at, updated_at
       FROM content.content_revisions
       WHERE entity_id = $1 AND entity_type = 'content'
         AND status IN ('draft', 'pending_review', 'approved', 'rejected')
       ORDER BY revision_number DESC LIMIT 1`,
      [characterId]
    );

    const first = res.rows[0];
    if (!first) return null;
    return this.mapRevisionRow(first as Record<string, unknown>);
  }

  async findPublishedRevision(characterId: string): Promise<LaoCharacterRevision | null> {
    const res = await this.db.query(
      `SELECT revision_public_id as id, entity_id as character_id, revision_number as revision_no,
              status as review_status, snapshot, created_by_operator_id, reviewed_by_operator_id,
              review_remark, reviewed_at, published_at, lock_version, created_at, updated_at
       FROM content.content_revisions
       WHERE entity_id = $1 AND entity_type = 'content' AND status = 'published'
       LIMIT 1`,
      [characterId]
    );

    const first = res.rows[0];
    if (!first) return null;
    return this.mapRevisionRow(first as Record<string, unknown>);
  }

  async saveCharacterAndRevision(
    character: LaoCharacter,
    revision: LaoCharacterRevision
  ): Promise<void> {
    const runInTx = async (exec: DatabaseExecutor) => {
      const contentRes = await exec.query<{ id: string }>(
        `INSERT INTO content.contents (public_id, language, content_type, status, created_at, updated_at)
         VALUES ($1, 'lo', 'lo_letter', $2, $3, $4)
         RETURNING id`,
        [character.id, character.onlineStatus === 'online' ? 'active' : 'disabled', character.createdAt, character.updatedAt]
      );

      const contentDbId = contentRes.rows[0]?.id;

      await exec.query(
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

      await exec.query(
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
        await exec.query(
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
    };

    if (this.transactions) {
      await this.transactions.run(runInTx);
    } else {
      await runInTx(this.db);
    }
  }

  async saveRevision(revision: LaoCharacterRevision): Promise<void> {
    const saved = await this.db.query(
      `INSERT INTO content.content_revisions (
         revision_public_id, entity_type, entity_id, revision_number,
         status, snapshot, created_by_operator_id, reviewed_by_operator_id,
         review_remark, reviewed_at, published_at, lock_version, created_at, updated_at
       ) VALUES ($1, 'content', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (revision_public_id)
       DO UPDATE SET status = EXCLUDED.status,
                     snapshot = EXCLUDED.snapshot,
                     reviewed_by_operator_id = EXCLUDED.reviewed_by_operator_id,
                     review_remark = EXCLUDED.review_remark,
                     reviewed_at = EXCLUDED.reviewed_at,
                     published_at = EXCLUDED.published_at,
                     lock_version = EXCLUDED.lock_version,
                     updated_at = EXCLUDED.updated_at
        WHERE content.content_revisions.lock_version = EXCLUDED.lock_version - 1`,
      [
        revision.id,
        revision.characterId,
        revision.revisionNo,
        revision.reviewStatus,
        JSON.stringify(revision.snapshot),
        revision.createdByOperatorId,
        revision.reviewedByOperatorId,
        revision.reviewRemark,
        revision.reviewedAt,
        revision.publishedAt,
        revision.lockVersion,
        revision.createdAt,
        new Date(),
      ]
    );
    if (saved.rowCount !== 1) throw new Error('STALE_VERSION_CONFLICT: Revision changed concurrently');
  }

  async publishRevisionAtomic(
    characterId: string,
    targetRevision: LaoCharacterRevision,
    previousPublishedRevision: LaoCharacterRevision | null
  ): Promise<void> {
    const runInTx = async (exec: DatabaseExecutor) => {
      if (previousPublishedRevision) {
        await exec.query(
          `UPDATE content.content_revisions
           SET status = 'superseded'
           WHERE revision_public_id = $1`,
          [previousPublishedRevision.id]
        );
      }

      const published = await exec.query(
        `UPDATE content.content_revisions
         SET status = 'published', published_at = $1, lock_version = $2, updated_at = now()
         WHERE revision_public_id = $3 AND lock_version = $2 - 1`,
        [targetRevision.publishedAt ?? new Date(), targetRevision.lockVersion, targetRevision.id]
      );
      if (published.rowCount !== 1) throw new Error('STALE_VERSION_CONFLICT: Revision changed concurrently');

      // Update physical read model
      await exec.query(
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
    };

    if (this.transactions) {
      await this.transactions.run(runInTx);
    } else {
      await runInTx(this.db);
    }
  }

  async listPublishedCharacters(classification?: string): Promise<PublishedCharacterView[]> {
    let query = `
      SELECT c.public_id as id, l.character as unicode_char, l.letter_type as classification,
             l.letter_class as subtype, l.romanization as ipa_phonetic, l.name,
             l.sort_order,
             CASE WHEN l.letter_type IN ('tone_mark', 'other') THEN true ELSE false END as no_audio,
             NULL as audio_url
      FROM content.contents c
      JOIN content.lo_letters l ON l.content_id = c.id
      JOIN content.content_revisions cr ON cr.entity_id = c.public_id AND cr.status = 'published'
      WHERE c.status = 'active' AND c.content_type = 'lo_letter'
    `;
    const params: unknown[] = [];

    if (classification) {
      params.push(classification);
      query += ` AND l.letter_type = $${params.length}`;
    }

    query += ` ORDER BY CASE l.letter_type
                  WHEN 'consonant' THEN 1
                  WHEN 'vowel' THEN 2
                  WHEN 'tone_mark' THEN 3
                  WHEN 'other' THEN 4
                  ELSE 5 END, l.sort_order ASC`;

    const res = await this.db.query<PublishedCharacterView & {
      unicode_char: string;
      ipa_phonetic: string | null;
      sort_order: number;
      no_audio: boolean;
      audio_url: string | null;
    }>(query, params);
    return res.rows.map(r => ({
      id: r.id,
      unicodeChar: r.unicode_char,
      classification: r.classification,
      subtype: r.subtype,
      ipaPhonetic: r.ipa_phonetic ?? '',
      name: r.name,
      sortOrder: r.sort_order,
      noAudio: r.no_audio,
      audioUrl: r.audio_url ?? null,
    }));
  }

  async listManagedCharacters(classification?: string): Promise<ManagedCharacterView[]> {
    let query = `
      SELECT c.public_id AS id, l.character AS unicode_char, l.letter_type AS classification,
             l.letter_class AS subtype, l.romanization AS ipa_phonetic, l.name,
             l.sort_order, c.status,
             CASE WHEN l.letter_type IN ('tone_mark', 'other') THEN true ELSE false END AS no_audio,
             published.revision_public_id AS published_revision_id,
             working.revision_public_id AS working_revision_id
      FROM content.contents c
      JOIN content.lo_letters l ON l.content_id = c.id
      LEFT JOIN LATERAL (
        SELECT revision_public_id FROM content.content_revisions
        WHERE entity_id = c.public_id AND entity_type = 'content' AND status = 'published'
        LIMIT 1
      ) published ON true
      LEFT JOIN LATERAL (
        SELECT revision_public_id FROM content.content_revisions
        WHERE entity_id = c.public_id AND entity_type = 'content'
          AND status IN ('draft', 'pending_review', 'approved', 'rejected')
        ORDER BY revision_number DESC LIMIT 1
      ) working ON true
      WHERE c.content_type = 'lo_letter'
    `;
    const params: unknown[] = [];
    if (classification) {
      params.push(classification);
      query += ` AND l.letter_type = $${params.length}`;
    }
    query += ` ORDER BY CASE l.letter_type
                  WHEN 'consonant' THEN 1 WHEN 'vowel' THEN 2
                  WHEN 'tone_mark' THEN 3 WHEN 'other' THEN 4 ELSE 5 END,
                l.sort_order ASC`;
    const res = await this.db.query<{
      id: string; unicode_char: string; classification: string; subtype: string;
      ipa_phonetic: string | null; name: string | null; sort_order: number;
      no_audio: boolean; status: string; published_revision_id: string | null; working_revision_id: string | null;
    }>(query, params);
    return res.rows.map((row) => ({
      id: row.id, unicodeChar: row.unicode_char, classification: row.classification,
      subtype: row.subtype, ipaPhonetic: row.ipa_phonetic ?? '', name: row.name ?? '',
      sortOrder: row.sort_order, noAudio: row.no_audio, status: row.status,
      publishedRevisionId: row.published_revision_id, workingRevisionId: row.working_revision_id,
    }));
  }

  private mapCharacterRow(row: Record<string, unknown>): LaoCharacter {
    return new LaoCharacter({
      id: String(row['id']),
      unicodeChar: String(row['unicode_char']),
      classification: row['classification'] as never,
      subtype: row['subtype'] as never,
      sortOrder: typeof row['sort_order'] === 'number' ? row['sort_order'] : 0,
      noAudio: row['classification'] === 'tone_mark' || row['classification'] === 'other',
      onlineStatus: row['online_status'] === 'active' ? 'online' : 'offline',
      publishedRevisionId: (row['published_revision_id'] as string) ?? null,
      workingRevisionId: (row['working_revision_id'] as string) ?? null,
      createdAt: new Date(String(row['created_at'])),
      updatedAt: new Date(String(row['updated_at'])),
    });
  }

  private mapRevisionRow(row: Record<string, unknown>): LaoCharacterRevision {
    const rawSnap = row['snapshot'];
    const snap = typeof rawSnap === 'string' ? JSON.parse(rawSnap) : rawSnap;
    return new LaoCharacterRevision({
      id: String(row['id']),
      characterId: String(row['character_id']),
      revisionNo: Number(row['revision_no']),
      snapshot: snap,
      reviewStatus: row['review_status'] as never,
      createdByOperatorId: row['created_by_operator_id'] ? String(row['created_by_operator_id']) : null,
      reviewedByOperatorId: row['reviewed_by_operator_id'] ? String(row['reviewed_by_operator_id']) : null,
      reviewRemark: row['review_remark'] ? String(row['review_remark']) : null,
      reviewedAt: row['reviewed_at'] ? new Date(String(row['reviewed_at'])) : null,
      publishedAt: row['published_at'] ? new Date(String(row['published_at'])) : null,
      lockVersion: Number(row['lock_version']),
      createdAt: new Date(String(row['created_at'])),
      updatedAt: new Date(String(row['updated_at'] ?? row['created_at'])),
    });
  }
}
