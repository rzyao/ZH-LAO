import mysql from 'mysql2/promise';

export function legacyMysqlConfig(env = process.env) {
  const required = ['LEGACY_MYSQL_HOST', 'LEGACY_MYSQL_USER', 'LEGACY_MYSQL_PASSWORD', 'LEGACY_MYSQL_DATABASE'];
  for (const key of required) if (!env[key]) throw new Error(`${key} is required`);
  return { host: env.LEGACY_MYSQL_HOST, port: Number(env.LEGACY_MYSQL_PORT ?? 3306), user: env.LEGACY_MYSQL_USER, password: env.LEGACY_MYSQL_PASSWORD, database: env.LEGACY_MYSQL_DATABASE, charset: 'utf8mb4' };
}

export async function withLegacySource(fn, config = legacyMysqlConfig()) {
  const connection = await mysql.createConnection(config);
  try { return await fn(connection); } finally { await connection.end(); }
}

const sourceKinds = [
  ['syllable', 'app_syllable', 'lao_syllable_revision', 'lao_syllable_revision_letter', 'letter_id'],
  ['word', 'lao_word', 'lao_word_revision', 'lao_word_revision_syllable', 'syllable_id'],
  ['sentence', 'lao_sentence', 'lao_sentence_revision', 'lao_sentence_revision_word', 'word_id'],
];

export async function loadLegacyLaoContent(config = legacyMysqlConfig()) {
  return withLegacySource(async (connection) => {
    const result = [];
    for (const [type, entityTable, revisionTable, relationTable, childColumn] of sourceKinds) {
      const [rows] = await connection.query(`SELECT e.id, r.id AS revision_id, r.display_text AS text, r.pronunciation_text AS romanization,
        e.chinese, r.content_payload, av.processed_url AS audio_url
        FROM ${entityTable} e JOIN ${revisionTable} r ON r.id=e.published_revision_id
        JOIN ${revisionTable}_audio ra ON ra.revision_id=r.id AND ra.validity='valid'
        JOIN audio_asset_version av ON av.id=ra.audio_asset_version_id AND av.review_status='approved'
        WHERE e.deleted_time IS NULL AND e.online_status='online' ORDER BY e.id`);
      for (const row of rows) {
        const [relations] = await connection.query(`SELECT ${childColumn} AS child_id, sort_no FROM ${relationTable} WHERE revision_id=? ORDER BY sort_no, id`, [row.revision_id]);
        result.push({ id: String(row.id), type, text: row.text, romanization: row.romanization, chinese: row.chinese, payload: row.content_payload, audioUrl: row.audio_url, childIds: relations.map((relation) => String(relation.child_id)) });
      }
    }
    return result;
  }, config);
}
