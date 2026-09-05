import type { DatabaseExecutor } from '../../../database/executor.js';
import type { TransactionManager } from '../../../database/transaction-manager.js';
import type {
  ContentReferenceView,
  ContentIdempotencyRecord,
  ManagedStructuredContentView,
  PublishedDictionaryWordView,
  StructuredRevisionView,
  StructuredContentRepository,
} from '../application/ports/structured-content-repository.js';
import {
  StructuredContent,
  StructuredContentRevision,
  type StructuredContentSnapshot,
} from '../domain/structured-content.js';
import type {
  CompositionItem,
  ContentLanguage,
  StructuredContentType,
} from '../domain/language-structure.js';

type Row = Record<string, unknown>;

export class PostgresStructuredContentRepository implements StructuredContentRepository {
  constructor(
    private readonly db: DatabaseExecutor,
    private readonly transactions?: TransactionManager,
  ) {}

  async list(language: ContentLanguage, contentType: StructuredContentType): Promise<ManagedStructuredContentView[]> {
    const result = await this.db.query<Row>(
      `SELECT c.public_id, c.language, c.content_type, c.status,
              revision.revision_public_id, revision.revision_number,
              revision.status AS revision_status, revision.lock_version, revision.snapshot
         FROM content.contents c
         LEFT JOIN LATERAL (
           SELECT revision_public_id, revision_number, status, lock_version, snapshot
             FROM content.content_revisions
            WHERE entity_type = 'content' AND entity_id = c.public_id
            ORDER BY revision_number DESC
            LIMIT 1
         ) revision ON true
        WHERE c.language = $1 AND c.content_type = $2
        ORDER BY c.updated_at DESC, c.public_id`,
      [language, contentType],
    );
    return result.rows.map((row) => ({
      id: String(row['public_id']),
      language: row['language'] as ContentLanguage,
      contentType: row['content_type'] as StructuredContentType,
      status: String(row['status']),
      revisionId: row['revision_public_id'] ? String(row['revision_public_id']) : null,
      revisionNumber: row['revision_number'] === null || row['revision_number'] === undefined ? null : Number(row['revision_number']),
      revisionStatus: row['revision_status'] ? String(row['revision_status']) : null,
      lockVersion: row['lock_version'] === null || row['lock_version'] === undefined ? null : Number(row['lock_version']),
      snapshot: row['snapshot'] ? this.parseJson(row['snapshot']) : null,
    }));
  }

  async listRevisions(contentId: string): Promise<StructuredRevisionView[]> {
    const result = await this.db.query<Row>(
      `SELECT revision_public_id, revision_number, status, snapshot, review_remark,
              reviewed_at, published_at, created_at
         FROM content.content_revisions
        WHERE entity_type = 'content' AND entity_id = $1
        ORDER BY revision_number DESC`,
      [contentId],
    );
    return result.rows.map((row) => ({
      revisionId: String(row['revision_public_id']),
      revisionNumber: Number(row['revision_number']),
      status: String(row['status']),
      snapshot: this.parseJson(row['snapshot']),
      reviewRemark: row['review_remark'] ? String(row['review_remark']) : null,
      reviewedAt: row['reviewed_at'] ? new Date(String(row['reviewed_at'])) : null,
      publishedAt: row['published_at'] ? new Date(String(row['published_at'])) : null,
      createdAt: new Date(String(row['created_at'])),
    }));
  }

  async listReferences(contentId: string): Promise<ContentReferenceView[]> {
    const result = await this.db.query<Row>(
      `WITH target AS (SELECT id FROM content.contents WHERE public_id = $1), relation_refs AS (
        SELECT syllable_content_id parent_id, position::integer position FROM content.zh_syllable_pinyin_elements WHERE pinyin_element_content_id = (SELECT id FROM target)
        UNION ALL SELECT hanzi_content_id, NULL::integer FROM content.zh_hanzi_syllables WHERE syllable_content_id = (SELECT id FROM target)
        UNION ALL SELECT word_content_id, position::integer FROM content.zh_word_hanzi WHERE hanzi_content_id = (SELECT id FROM target)
        UNION ALL SELECT sentence_content_id, position::integer FROM content.zh_sentence_words WHERE word_content_id = (SELECT id FROM target)
        UNION ALL SELECT syllable_content_id, position::integer FROM content.lo_syllable_letters WHERE letter_content_id = (SELECT id FROM target)
        UNION ALL SELECT word_content_id, position::integer FROM content.lo_word_syllables WHERE syllable_content_id = (SELECT id FROM target)
        UNION ALL SELECT sentence_content_id, position::integer FROM content.lo_sentence_words WHERE word_content_id = (SELECT id FROM target)
      )
      SELECT c.public_id, c.content_type, relation_refs.position
        FROM relation_refs JOIN content.contents c ON c.id = relation_refs.parent_id
       ORDER BY c.content_type, c.public_id, relation_refs.position NULLS FIRST`,
      [contentId],
    );
    return result.rows.map((row) => ({
      contentId: String(row['public_id']),
      contentType: row['content_type'] as StructuredContentType,
      position: row['position'] === null ? null : Number(row['position']),
    }));
  }

  async findContent(id: string): Promise<StructuredContent | null> {
    const result = await this.db.query<Row>(
      `SELECT public_id, language, content_type, status, created_at, updated_at
         FROM content.contents WHERE public_id = $1`,
      [id],
    );
    const row = result.rows[0];
    if (!row) return null;
    return new StructuredContent({
      id: String(row['public_id']),
      language: row['language'] as ContentLanguage,
      contentType: row['content_type'] as StructuredContentType,
      status: row['status'] as 'active' | 'disabled' | 'archived',
      createdAt: new Date(String(row['created_at'])),
      updatedAt: new Date(String(row['updated_at'])),
    });
  }

  async findRevision(revisionId: string): Promise<StructuredContentRevision | null> {
    const result = await this.db.query<Row>(
      `${this.revisionSelect()} WHERE r.revision_public_id = $1 AND r.entity_type = 'content'`,
      [revisionId],
    );
    return result.rows[0] ? this.mapRevision(result.rows[0]) : null;
  }

  async findActiveRevision(contentId: string): Promise<StructuredContentRevision | null> {
    const result = await this.db.query<Row>(
      `${this.revisionSelect()}
        WHERE r.entity_id = $1 AND r.entity_type = 'content'
          AND r.status IN ('draft', 'pending_review', 'approved', 'rejected')
        ORDER BY r.revision_number DESC LIMIT 1`,
      [contentId],
    );
    return result.rows[0] ? this.mapRevision(result.rows[0]) : null;
  }

  async findPublishedRevision(contentId: string): Promise<StructuredContentRevision | null> {
    const result = await this.db.query<Row>(
      `${this.revisionSelect()}
        WHERE r.entity_id = $1 AND r.entity_type = 'content' AND r.status = 'published'
        LIMIT 1`,
      [contentId],
    );
    return result.rows[0] ? this.mapRevision(result.rows[0]) : null;
  }

  async resolveComposition(items: readonly { contentId: string; position: number }[]): Promise<CompositionItem[]> {
    if (items.length === 0) return [];
    const ids = items.map((item) => item.contentId);
    const result = await this.db.query<Row>(
      `SELECT c.public_id, c.content_type, published.revision_public_id
         FROM content.contents c
         LEFT JOIN LATERAL (
           SELECT revision_public_id FROM content.content_revisions
            WHERE entity_type = 'content' AND entity_id = c.public_id AND status = 'published'
            LIMIT 1
         ) published ON true
        WHERE c.public_id = ANY($1::uuid[])`,
      [ids],
    );
    const byId = new Map(result.rows.map((row) => [String(row['public_id']), row]));
    return items.map((item) => {
      const row = byId.get(item.contentId);
      if (!row) throw new Error(`引用内容不存在：${item.contentId}`);
      return {
        contentId: item.contentId,
        contentType: row['content_type'] as StructuredContentType,
        position: item.position,
        publishedRevisionId: row['revision_public_id'] ? String(row['revision_public_id']) : null,
      };
    });
  }

  async findPublishedDictionaryWord(language: ContentLanguage, query: string): Promise<PublishedDictionaryWordView | null> {
    const result = await this.db.query<Row>(
      "SELECT c.public_id, c.language, r.revision_public_id, " +
      "CASE WHEN c.language = 'zh' THEN zw.simplified ELSE lw.text END AS display, " +
      "CASE WHEN c.language = 'zh' THEN zw.pinyin_text ELSE lw.romanization END AS romanization " +
      "FROM content.contents c " +
      "JOIN content.content_revisions r ON r.entity_id = c.public_id AND r.entity_type = 'content' AND r.status = 'published' " +
      "LEFT JOIN content.zh_words zw ON zw.content_id = c.id LEFT JOIN content.lo_words lw ON lw.content_id = c.id " +
      "WHERE c.status = 'active' AND c.language = $1 AND ((c.language = 'zh' AND c.content_type = 'zh_word' " +
      "AND (zw.simplified = $2 OR zw.traditional = $2 OR zw.pinyin_text = $2)) OR " +
      "(c.language = 'lo' AND c.content_type = 'lo_word' AND (lw.text = $2 OR lw.romanization = $2))) " +
      "ORDER BY display, c.public_id LIMIT 1",
      [language, query],
    );
    return result.rows[0] ? this.mapDictionaryWord(result.rows[0]) : null;
  }

  async findPublishedDictionaryWordById(contentId: string): Promise<PublishedDictionaryWordView | null> {
    const result = await this.db.query<Row>(
      "SELECT c.public_id, c.language, r.revision_public_id, " +
      "CASE WHEN c.language = 'zh' THEN zw.simplified ELSE lw.text END AS display, " +
      "CASE WHEN c.language = 'zh' THEN zw.pinyin_text ELSE lw.romanization END AS romanization " +
      "FROM content.contents c " +
      "JOIN content.content_revisions r ON r.entity_id = c.public_id AND r.entity_type = 'content' AND r.status = 'published' " +
      "LEFT JOIN content.zh_words zw ON zw.content_id = c.id LEFT JOIN content.lo_words lw ON lw.content_id = c.id " +
      "WHERE c.status = 'active' AND c.public_id = $1 AND c.content_type IN ('zh_word', 'lo_word') LIMIT 1",
      [contentId],
    );
    if (!result.rows[0]) return null;
    const word = this.mapDictionaryWord(result.rows[0]);
    const meanings = await this.db.query<Row>(
      "SELECT m.language, m.word_class, m.definition, m.sense_order FROM content.meanings m JOIN content.contents c ON c.id = m.content_id WHERE c.public_id = $1 AND m.status = 'active' ORDER BY m.language, m.sense_order",
      [contentId],
    );
    const examples = await this.db.query<Row>(
      "SELECT sentence.public_id AS sentence_public_id, CASE WHEN sentence.language = 'zh' THEN zsentence.text ELSE lsentence.text END AS display, " +
      "CASE WHEN sentence.language = 'zh' THEN zsentence.pinyin_text ELSE lsentence.romanization END AS romanization, e.sort_order " +
      "FROM content.examples e JOIN content.contents owner ON owner.id = e.content_id " +
      "JOIN content.contents sentence ON sentence.id = e.sentence_content_id " +
      "JOIN content.content_revisions published_sentence ON published_sentence.entity_id = sentence.public_id AND published_sentence.entity_type = 'content' AND published_sentence.status = 'published' " +
      "LEFT JOIN content.zh_sentences zsentence ON zsentence.content_id = sentence.id LEFT JOIN content.lo_sentences lsentence ON lsentence.content_id = sentence.id " +
      "WHERE owner.public_id = $1 AND sentence.status = 'active' ORDER BY e.sort_order, sentence.public_id",
      [contentId],
    );
    const equivalents = await this.db.query<Row>(
      "SELECT target.public_id AS target_public_id, CASE WHEN target.language = 'zh' THEN zw.simplified ELSE lw.text END AS display, " +
      "CASE WHEN target.language = 'zh' THEN zw.pinyin_text ELSE lw.romanization END AS romanization, e.relation_type, e.confidence, e.is_primary " +
      "FROM content.content_equivalents e JOIN content.contents owner ON owner.id = e.source_content_id " +
      "JOIN content.contents target ON target.id = e.target_content_id " +
      "JOIN content.content_revisions published_target ON published_target.entity_id = target.public_id AND published_target.entity_type = 'content' AND published_target.status = 'published' " +
      "LEFT JOIN content.zh_words zw ON zw.content_id = target.id LEFT JOIN content.lo_words lw ON lw.content_id = target.id " +
      "WHERE owner.public_id = $1 AND target.status = 'active' ORDER BY e.is_primary DESC, target.public_id",
      [contentId],
    );
    const relations = await this.db.query<Row>(
      "SELECT target.public_id AS target_public_id, CASE WHEN target.language = 'zh' THEN zw.simplified ELSE lw.text END AS display, " +
      "CASE WHEN target.language = 'zh' THEN zw.pinyin_text ELSE lw.romanization END AS romanization, r.relation_type, r.sort_order " +
      "FROM content.content_relations r JOIN content.contents owner ON owner.id = r.source_content_id " +
      "JOIN content.contents target ON target.id = r.target_content_id " +
      "JOIN content.content_revisions published_target ON published_target.entity_id = target.public_id AND published_target.entity_type = 'content' AND published_target.status = 'published' " +
      "LEFT JOIN content.zh_words zw ON zw.content_id = target.id LEFT JOIN content.lo_words lw ON lw.content_id = target.id " +
      "WHERE owner.public_id = $1 AND target.status = 'active' ORDER BY r.sort_order, target.public_id",
      [contentId],
    );
    const tags = await this.db.query<Row>(
      "SELECT t.code, t.name FROM content.content_tags ct JOIN content.contents owner ON owner.id = ct.content_id JOIN content.tags t ON t.id = ct.tag_id WHERE owner.public_id = $1 ORDER BY t.code",
      [contentId],
    );
    return {
      ...word,
      meanings: meanings.rows.map((row) => ({
        language: row['language'] as ContentLanguage,
        wordClass: row['word_class'] === null ? null : String(row['word_class']),
        definition: String(row['definition']),
        senseOrder: Number(row['sense_order']),
      })),
      examples: examples.rows.map((row) => ({
        sentenceId: String(row['sentence_public_id']), display: String(row['display']),
        romanization: row['romanization'] === null ? null : String(row['romanization']), sortOrder: Number(row['sort_order']),
      })),
      equivalents: equivalents.rows.map((row) => ({
        targetContentId: String(row['target_public_id']), display: String(row['display']),
        romanization: row['romanization'] === null ? null : String(row['romanization']), relationType: String(row['relation_type']),
        confidence: row['confidence'] === null ? null : Number(row['confidence']), isPrimary: Boolean(row['is_primary']),
      })),
      relations: relations.rows.map((row) => ({
        targetContentId: String(row['target_public_id']), display: String(row['display']),
        romanization: row['romanization'] === null ? null : String(row['romanization']), relationType: String(row['relation_type']), sortOrder: Number(row['sort_order']),
      })),
      tags: tags.rows.map((row) => ({ code: String(row['code']), name: String(row['name']) })),
    };
  }

  async searchPublishedDictionaryWords(
    language: ContentLanguage, query: string, limit: number,
    after?: { tier: number; similarity: number; display: string; id: string },
  ): Promise<PublishedDictionaryWordView[]> {
    const params: unknown[] = [language, query, '%' + query + '%'];
    const afterClause = after
      ? ' WHERE (match_tier > $4 OR (match_tier = $4 AND (similarity_score < $5 OR (similarity_score = $5 AND (display, public_id) > ($6, $7::uuid)))))'
      : '';
    if (after) params.push(after.tier, after.similarity, after.display, after.id);
    params.push(limit);
    const result = await this.db.query<Row>(
      "WITH candidates AS (SELECT c.public_id, c.language, r.revision_public_id, " +
      "CASE WHEN c.language = 'zh' THEN zw.simplified ELSE lw.text END AS display, " +
      "CASE WHEN c.language = 'zh' THEN zw.pinyin_text ELSE lw.romanization END AS romanization, " +
      "CASE WHEN (c.language = 'zh' AND (zw.simplified = $2 OR zw.traditional = $2 OR zw.pinyin_text = $2)) OR (c.language = 'lo' AND (lw.text = $2 OR lw.romanization = $2)) THEN 0 " +
      "WHEN (c.language = 'zh' AND (zw.simplified ILIKE $2 || '%' OR zw.traditional ILIKE $2 || '%' OR zw.pinyin_text ILIKE $2 || '%')) OR (c.language = 'lo' AND (lw.text ILIKE $2 || '%' OR lw.romanization ILIKE $2 || '%')) THEN 1 ELSE 2 END AS match_tier, " +
      "GREATEST(similarity(COALESCE(zw.simplified, ''), $2), similarity(COALESCE(zw.traditional, ''), $2), similarity(COALESCE(zw.pinyin_text, ''), $2), similarity(COALESCE(lw.text, ''), $2), similarity(COALESCE(lw.romanization, ''), $2)) AS similarity_score " +
      "FROM content.contents c " +
      "JOIN content.content_revisions r ON r.entity_id = c.public_id AND r.entity_type = 'content' AND r.status = 'published' " +
      "LEFT JOIN content.zh_words zw ON zw.content_id = c.id LEFT JOIN content.lo_words lw ON lw.content_id = c.id " +
      "WHERE c.status = 'active' AND c.language = $1 AND ((c.language = 'zh' AND c.content_type = 'zh_word' " +
      "AND (zw.simplified ILIKE $3 OR zw.traditional ILIKE $3 OR zw.pinyin_text ILIKE $3)) OR " +
      "(c.language = 'lo' AND c.content_type = 'lo_word' AND (lw.text ILIKE $3 OR lw.romanization ILIKE $3)))) " +
      "SELECT * FROM candidates" + afterClause + " ORDER BY match_tier, similarity_score DESC, display, public_id LIMIT $" + params.length,
      params,
    );
    return result.rows.map((row) => this.mapDictionaryWord(row));
  }

  async findIdempotencyRecord(operatorId: string, idempotencyKey: string): Promise<ContentIdempotencyRecord | null> {
    const result = await this.db.query<Row>(
      'SELECT request_hash, response_payload FROM content.idempotency_records WHERE operator_id = $1 AND idempotency_key = $2',
      [operatorId, idempotencyKey],
    );
    const row = result.rows[0];
    return row ? { requestHash: String(row['request_hash']), response: this.parseJson(row['response_payload']) } : null;
  }

  async saveIdempotencyRecord(operatorId: string, idempotencyKey: string, requestHash: string, response: Record<string, unknown>): Promise<void> {
    const result = await this.db.query(
      `INSERT INTO content.idempotency_records (operator_id, idempotency_key, request_hash, response_payload)
       VALUES ($1, $2, $3, $4::jsonb) ON CONFLICT (operator_id, idempotency_key) DO NOTHING`,
      [operatorId, idempotencyKey, requestHash, JSON.stringify(response)],
    );
    if (result.rowCount === 0) {
      const existing = await this.findIdempotencyRecord(operatorId, idempotencyKey);
      if (!existing || existing.requestHash !== requestHash) throw new Error('Idempotency-Key 已用于不同请求');
    }
  }

  async saveNew(content: StructuredContent, revision: StructuredContentRevision): Promise<void> {
    await this.inTransaction(async (executor) => {
      await executor.query(
        `INSERT INTO content.contents (public_id, language, content_type, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [content.id, content.language, content.contentType, content.status, content.createdAt, content.updatedAt],
      );
      await this.insertRevision(executor, revision);
    });
  }

  async saveRevision(revision: StructuredContentRevision): Promise<void> {
    const result = await this.db.query(
      `INSERT INTO content.content_revisions (
         revision_public_id, entity_type, entity_id, revision_number, status, snapshot,
         created_by_operator_id, reviewed_by_operator_id, review_remark, reviewed_at,
         published_at, lock_version, created_at, updated_at
       ) VALUES ($1, 'content', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (revision_public_id) DO UPDATE SET
         status = EXCLUDED.status,
         snapshot = EXCLUDED.snapshot,
         reviewed_by_operator_id = EXCLUDED.reviewed_by_operator_id,
         review_remark = EXCLUDED.review_remark,
         reviewed_at = EXCLUDED.reviewed_at,
         published_at = EXCLUDED.published_at,
         lock_version = EXCLUDED.lock_version,
         updated_at = EXCLUDED.updated_at
       WHERE content.content_revisions.lock_version = EXCLUDED.lock_version - 1`,
      this.revisionValues(revision),
    );
    if (result.rowCount !== 1) throw new Error('版本已被其他操作更新');
  }

  async publishAtomic(
    content: StructuredContent,
    targetRevision: StructuredContentRevision,
    previousPublishedRevision: StructuredContentRevision | null,
  ): Promise<void> {
    await this.inTransaction(async (executor) => {
      if (previousPublishedRevision) {
        const superseded = await executor.query(
          `UPDATE content.content_revisions
              SET status = 'superseded', published_at = NULL, lock_version = $2, updated_at = $3
            WHERE revision_public_id = $1 AND status = 'published' AND lock_version = $2 - 1`,
          [previousPublishedRevision.id, previousPublishedRevision.lockVersion, previousPublishedRevision.updatedAt],
        );
        if (superseded.rowCount !== 1) throw new Error('版本已被其他操作更新');
      }

      const published = await executor.query(
        `UPDATE content.content_revisions
            SET status = 'published', published_at = $2, lock_version = $3, updated_at = $4
          WHERE revision_public_id = $1 AND status = 'approved' AND lock_version = $3 - 1`,
        [targetRevision.id, targetRevision.publishedAt, targetRevision.lockVersion, targetRevision.updatedAt],
      );
      if (published.rowCount !== 1) throw new Error('版本已被其他操作更新');

      await this.materialize(executor, content, targetRevision.snapshot);
      await executor.query('UPDATE content.contents SET status = \'active\', updated_at = now() WHERE public_id = $1', [content.id]);
    });
  }

  private revisionSelect(): string {
    return `SELECT r.revision_public_id, r.entity_id, r.revision_number, r.status,
                   r.snapshot, r.created_by_operator_id, r.reviewed_by_operator_id,
                   r.review_remark, r.reviewed_at, r.published_at, r.lock_version,
                   r.created_at, r.updated_at, c.content_type
              FROM content.content_revisions r
              JOIN content.contents c ON c.public_id = r.entity_id`;
  }

  private mapRevision(row: Row): StructuredContentRevision {
    return new StructuredContentRevision({
      id: String(row['revision_public_id']),
      contentId: String(row['entity_id']),
      revisionNumber: Number(row['revision_number']),
      contentType: row['content_type'] as StructuredContentType,
      snapshot: this.parseJson(row['snapshot']) as unknown as StructuredContentSnapshot,
      status: row['status'] as never,
      createdByOperatorId: row['created_by_operator_id'] ? String(row['created_by_operator_id']) : null,
      reviewedByOperatorId: row['reviewed_by_operator_id'] ? String(row['reviewed_by_operator_id']) : null,
      reviewRemark: row['review_remark'] ? String(row['review_remark']) : null,
      reviewedAt: row['reviewed_at'] ? new Date(String(row['reviewed_at'])) : null,
      publishedAt: row['published_at'] ? new Date(String(row['published_at'])) : null,
      lockVersion: Number(row['lock_version']),
      createdAt: new Date(String(row['created_at'])),
      updatedAt: new Date(String(row['updated_at'])),
    });
  }

  private async insertRevision(executor: DatabaseExecutor, revision: StructuredContentRevision): Promise<void> {
    await executor.query(
      `INSERT INTO content.content_revisions (
         revision_public_id, entity_type, entity_id, revision_number, status, snapshot,
         created_by_operator_id, reviewed_by_operator_id, review_remark, reviewed_at,
         published_at, lock_version, created_at, updated_at
       ) VALUES ($1, 'content', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      this.revisionValues(revision),
    );
  }

  private revisionValues(revision: StructuredContentRevision): readonly unknown[] {
    return [
      revision.id, revision.contentId, revision.revisionNumber, revision.status,
      JSON.stringify(revision.snapshot), revision.createdByOperatorId,
      revision.reviewedByOperatorId, revision.reviewRemark, revision.reviewedAt,
      revision.publishedAt, revision.lockVersion, revision.createdAt, revision.updatedAt,
    ];
  }

  private async materialize(
    executor: DatabaseExecutor,
    content: StructuredContent,
    snapshot: StructuredContentSnapshot,
  ): Promise<void> {
    const contentIdResult = await executor.query<{ id: string }>(
      'SELECT id FROM content.contents WHERE public_id = $1 AND content_type = $2',
      [content.id, content.contentType],
    );
    const contentDbId = contentIdResult.rows[0]?.id;
    if (!contentDbId) throw new Error('内容主记录不存在');
    const fields = snapshot.fields;

    switch (content.contentType) {
      case 'zh_pinyin_element':
        await executor.query(`INSERT INTO content.zh_pinyin_elements (content_id, element_type, value, display_form, sort_order)
          VALUES ($1,$2,$3,$4,$5) ON CONFLICT (content_id) DO UPDATE SET element_type=$2,value=$3,display_form=$4,sort_order=$5`,
        [contentDbId, fields['elementType'], fields['value'], fields['displayForm'], fields['sortOrder'] ?? null]);
        break;
      case 'zh_syllable':
        await executor.query(`INSERT INTO content.zh_syllables (content_id, base_form, tone, display_form)
          VALUES ($1,$2,$3,$4) ON CONFLICT (content_id) DO UPDATE SET base_form=$2,tone=$3,display_form=$4`,
        [contentDbId, fields['baseForm'], fields['tone'], fields['displayForm']]);
        break;
      case 'zh_hanzi':
        await executor.query(`INSERT INTO content.zh_hanzi (content_id, character, traditional_character, stroke_count, radical)
          VALUES ($1,$2,$3,$4,$5) ON CONFLICT (content_id) DO UPDATE SET character=$2,traditional_character=$3,stroke_count=$4,radical=$5`,
        [contentDbId, fields['character'], fields['traditionalCharacter'] ?? null, fields['strokeCount'] ?? null, fields['radical'] ?? null]);
        break;
      case 'zh_word':
        await executor.query(`INSERT INTO content.zh_words (content_id, simplified, traditional, pinyin_text, word_class, difficulty_level)
          VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (content_id) DO UPDATE SET simplified=$2,traditional=$3,pinyin_text=$4,word_class=$5,difficulty_level=$6`,
        [contentDbId, fields['simplified'], fields['traditional'] ?? null, fields['pinyinText'] ?? null, fields['wordClass'] ?? null, fields['difficultyLevel'] ?? null]);
        break;
      case 'zh_sentence':
        await executor.query(`INSERT INTO content.zh_sentences (content_id, text, pinyin_text, difficulty_level)
          VALUES ($1,$2,$3,$4) ON CONFLICT (content_id) DO UPDATE SET text=$2,pinyin_text=$3,difficulty_level=$4`,
        [contentDbId, fields['text'], fields['pinyinText'] ?? null, fields['difficultyLevel'] ?? null]);
        break;
      case 'lo_letter':
        await executor.query(`INSERT INTO content.lo_letters (content_id, character, letter_type, letter_class, name, romanization, sort_order)
          VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (content_id) DO UPDATE SET character=$2,letter_type=$3,letter_class=$4,name=$5,romanization=$6,sort_order=$7`,
        [contentDbId, fields['character'], fields['letterType'], fields['letterClass'] ?? null, fields['name'] ?? null, fields['romanization'] ?? null, fields['sortOrder'] ?? null]);
        break;
      case 'lo_syllable':
        await executor.query(`INSERT INTO content.lo_syllables (content_id, text, romanization, tone, pronunciation_key, difficulty_level)
          VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (content_id) DO UPDATE SET text=$2,romanization=$3,tone=$4,pronunciation_key=$5,difficulty_level=$6`,
        [contentDbId, fields['text'], fields['romanization'] ?? null, fields['tone'] ?? null, fields['pronunciationKey'] ?? null, fields['difficultyLevel'] ?? null]);
        break;
      case 'lo_word':
        await executor.query(`INSERT INTO content.lo_words (content_id, text, romanization, word_class, difficulty_level)
          VALUES ($1,$2,$3,$4,$5) ON CONFLICT (content_id) DO UPDATE SET text=$2,romanization=$3,word_class=$4,difficulty_level=$5`,
        [contentDbId, fields['text'], fields['romanization'] ?? null, fields['wordClass'] ?? null, fields['difficultyLevel'] ?? null]);
        break;
      case 'lo_sentence':
        await executor.query(`INSERT INTO content.lo_sentences (content_id, text, romanization, difficulty_level)
          VALUES ($1,$2,$3,$4) ON CONFLICT (content_id) DO UPDATE SET text=$2,romanization=$3,difficulty_level=$4`,
        [contentDbId, fields['text'], fields['romanization'] ?? null, fields['difficultyLevel'] ?? null]);
        break;
    }
    await this.replaceComposition(executor, content.contentType, contentDbId, snapshot);
    if (content.contentType === 'zh_word' || content.contentType === 'lo_word') {
      await this.replaceDictionaryMaterialization(executor, contentDbId, snapshot);
    }
  }

  private async replaceDictionaryMaterialization(
    executor: DatabaseExecutor,
    parentId: string,
    snapshot: StructuredContentSnapshot,
  ): Promise<void> {
    const dictionary = snapshot.dictionary ?? { meanings: [], examples: [], equivalents: [], relations: [], tags: [] };
    await executor.query('DELETE FROM content.examples WHERE content_id = $1', [parentId]);
    await executor.query('DELETE FROM content.meanings WHERE content_id = $1', [parentId]);
    await executor.query('DELETE FROM content.content_equivalents WHERE source_content_id = $1', [parentId]);
    await executor.query('DELETE FROM content.content_relations WHERE source_content_id = $1', [parentId]);
    await executor.query('DELETE FROM content.content_tags WHERE content_id = $1', [parentId]);

    const meanings = new Map<string, string>();
    for (const meaning of dictionary.meanings) {
      const inserted = await executor.query<{ id: string }>(
        'INSERT INTO content.meanings (content_id, language, word_class, definition, sense_order) VALUES ($1,$2,$3,$4,$5) RETURNING id',
        [parentId, meaning.language, meaning.wordClass ?? null, meaning.definition, meaning.senseOrder],
      );
      meanings.set(meaning.language + ':' + meaning.senseOrder, inserted.rows[0]!.id);
    }
    for (const example of dictionary.examples) {
      const sentenceId = await this.resolveContentDbId(executor, example.sentenceContentId);
      const meaningId = example.meaningLanguage
        ? meanings.get(example.meaningLanguage + ':' + example.meaningSenseOrder)
        : null;
      if (example.meaningLanguage && !meaningId) throw new Error('例句引用的释义不存在');
      await executor.query(
        'INSERT INTO content.examples (content_id, meaning_id, sentence_content_id, sort_order) VALUES ($1,$2,$3,$4)',
        [parentId, meaningId, sentenceId, example.sortOrder],
      );
    }
    for (const equivalent of dictionary.equivalents) {
      await executor.query(
        'INSERT INTO content.content_equivalents (source_content_id, target_content_id, relation_type, confidence, is_primary) VALUES ($1,$2,$3,$4,$5)',
        [parentId, await this.resolveContentDbId(executor, equivalent.targetContentId), equivalent.relationType,
          equivalent.confidence ?? null, equivalent.isPrimary ?? false],
      );
    }
    for (const relation of dictionary.relations) {
      await executor.query(
        'INSERT INTO content.content_relations (source_content_id, target_content_id, relation_type, sort_order) VALUES ($1,$2,$3,$4)',
        [parentId, await this.resolveContentDbId(executor, relation.targetContentId), relation.relationType, relation.sortOrder],
      );
    }
    for (const tag of dictionary.tags) {
      const tagResult = await executor.query<{ id: string }>(
        'INSERT INTO content.tags (code, name) VALUES ($1,$2) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id',
        [tag.code, tag.name],
      );
      await executor.query('INSERT INTO content.content_tags (content_id, tag_id) VALUES ($1,$2)', [parentId, tagResult.rows[0]!.id]);
    }
  }

  private async resolveContentDbId(executor: DatabaseExecutor, publicId: string): Promise<string> {
    const result = await executor.query<{ id: string }>('SELECT id FROM content.contents WHERE public_id = $1', [publicId]);
    const id = result.rows[0]?.id;
    if (!id) throw new Error('词典目标不存在');
    return id;
  }

  private async replaceComposition(
    executor: DatabaseExecutor,
    contentType: StructuredContentType,
    parentId: string,
    snapshot: StructuredContentSnapshot,
  ): Promise<void> {
    const relation = this.relationConfig(contentType);
    if (!relation) return;
    await executor.query(`DELETE FROM ${relation.table} WHERE ${relation.parentColumn} = $1`, [parentId]);
    for (const item of snapshot.composition) {
      const child = await executor.query<{ id: string }>(
        'SELECT id FROM content.contents WHERE public_id = $1 AND content_type = $2',
        [item.contentId, relation.childType],
      );
      const childId = child.rows[0]?.id;
      if (!childId) throw new Error(`引用内容不存在：${item.contentId}`);
      if (contentType === 'zh_hanzi') {
        await executor.query(
          'INSERT INTO content.zh_hanzi_syllables (hanzi_content_id, syllable_content_id, is_primary, usage_note) VALUES ($1,$2,$3,$4)',
          [parentId, childId, item.position === 1, item.surfaceForm ?? null],
        );
      } else if (contentType === 'zh_syllable' || contentType === 'lo_syllable') {
        await executor.query(
          `INSERT INTO ${relation.table} (${relation.parentColumn}, ${relation.childColumn}, position, role) VALUES ($1,$2,$3,$4)`,
          [parentId, childId, item.position, item.role ?? null],
        );
      } else if (contentType === 'zh_sentence' || contentType === 'lo_sentence') {
        await executor.query(
          `INSERT INTO ${relation.table} (${relation.parentColumn}, ${relation.childColumn}, position, surface_form) VALUES ($1,$2,$3,$4)`,
          [parentId, childId, item.position, item.surfaceForm ?? null],
        );
      } else {
        await executor.query(
          `INSERT INTO ${relation.table} (${relation.parentColumn}, ${relation.childColumn}, position) VALUES ($1,$2,$3)`,
          [parentId, childId, item.position],
        );
      }
    }
  }

  private relationConfig(contentType: StructuredContentType): {
    table: string; parentColumn: string; childColumn: string; childType: StructuredContentType;
  } | null {
    const relations: Partial<Record<StructuredContentType, { table: string; parentColumn: string; childColumn: string; childType: StructuredContentType }>> = {
      zh_syllable: { table: 'content.zh_syllable_pinyin_elements', parentColumn: 'syllable_content_id', childColumn: 'pinyin_element_content_id', childType: 'zh_pinyin_element' },
      zh_hanzi: { table: 'content.zh_hanzi_syllables', parentColumn: 'hanzi_content_id', childColumn: 'syllable_content_id', childType: 'zh_syllable' },
      zh_word: { table: 'content.zh_word_hanzi', parentColumn: 'word_content_id', childColumn: 'hanzi_content_id', childType: 'zh_hanzi' },
      zh_sentence: { table: 'content.zh_sentence_words', parentColumn: 'sentence_content_id', childColumn: 'word_content_id', childType: 'zh_word' },
      lo_syllable: { table: 'content.lo_syllable_letters', parentColumn: 'syllable_content_id', childColumn: 'letter_content_id', childType: 'lo_letter' },
      lo_word: { table: 'content.lo_word_syllables', parentColumn: 'word_content_id', childColumn: 'syllable_content_id', childType: 'lo_syllable' },
      lo_sentence: { table: 'content.lo_sentence_words', parentColumn: 'sentence_content_id', childColumn: 'word_content_id', childType: 'lo_word' },
    };
    return relations[contentType] ?? null;
  }

  private parseJson(value: unknown): Record<string, unknown> {
    if (typeof value === 'string') return JSON.parse(value) as Record<string, unknown>;
    return value as Record<string, unknown>;
  }

  private mapDictionaryWord(row: Row): PublishedDictionaryWordView {
    const searchOrder = row['match_tier'] === undefined ? undefined : {
      tier: Number(row['match_tier']), similarity: Number(row['similarity_score']),
    };
    return {
      id: String(row['public_id']),
      language: row['language'] as ContentLanguage,
      revisionId: String(row['revision_public_id']),
      display: String(row['display']),
      romanization: row['romanization'] === null || row['romanization'] === undefined ? null : String(row['romanization']),
      ...(searchOrder ? { searchOrder } : {}),
    };
  }

  private async inTransaction<T>(callback: (executor: DatabaseExecutor) => Promise<T>): Promise<T> {
    return this.transactions ? this.transactions.run(callback) : callback(this.db);
  }
}
