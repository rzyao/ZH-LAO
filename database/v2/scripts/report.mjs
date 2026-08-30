import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { collectAudit } from './audit.mjs';
import { BUSINESS_SCHEMAS, requireDatabaseUrl } from './db.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const reportsDir = path.resolve(here, '..', 'reports');

function cell(value) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function table(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(cell).join(' | ')} |`),
  ].join('\n');
}

export async function writeReport(connectionString = requireDatabaseUrl()) {
  const audit = await collectAudit(connectionString);
  await mkdir(reportsDir, { recursive: true });

  const tableCounts = BUSINESS_SCHEMAS.map((schema) => [
    schema,
    audit.tables.filter((row) => row.schema === schema).length,
    audit.constraintCounts[schema].pk,
    audit.constraintCounts[schema].fk,
    audit.constraintCounts[schema].unique,
    audit.constraintCounts[schema].check,
    audit.constraintCounts[schema].indexes,
  ]);

  const logicalRows = JSON.parse(await (await import('node:fs/promises')).readFile(
    path.resolve(here, '..', 'checks', 'expected-schema.json'), 'utf8',
  )).logicalUuidColumns.map((name) => {
    const column = audit.columns.find((row) => `${row.schema}.${row.table}.${row.column}` === name);
    const violation = audit.logicalUuidViolations.find((row) => row.column === name);
    return [name, column?.type ?? 'missing', violation ? `FAIL: ${violation.issue}` : 'PASS'];
  });

  const sections = [
    '# V2 Database Baseline Report',
    '',
    `Generated from PostgreSQL catalog at: ${audit.generatedAt}`,
    '',
    `Final status: **${audit.finalStatus}**`,
    '',
    '## Runtime and infrastructure',
    '',
    table(['Item', 'Value'], [
      ['Database', audit.server.database],
      ['PostgreSQL', audit.server.version],
      ['Role', audit.server.role],
      ['Business schemas', audit.schemas.join(', ')],
      ['Business tables', `${audit.actualBusinessTableCount} executable / 121 frozen target`],
      ['Extensions', audit.extensions.map((row) => `${row.name} ${row.version}`).join(', ')],
      ['Illegal cross-domain FK', audit.illegalCrossDomainFks.length],
    ]),
    '',
    'Only `pg_trgm` was added by V2. `plpgsql` is built in. The V2 baseline did not install PostGIS, citext, or pgcrypto, and it did not create physical Asset/Media or outbox tables.',
    '',
    '## Migration files',
    '',
    table(['Migration', 'SHA-256', 'Applied at'], audit.migrations.map((row) => [row.filename, row.sha256.trim(), row.applied_at.toISOString()])),
    '',
    '## Domain summary',
    '',
    table(['Schema', 'Tables', 'PK', 'FK', 'UNIQUE constraints', 'CHECK', 'Indexes'], tableCounts),
    '',
    '## Cross-domain FK audit',
    '',
    audit.illegalCrossDomainFks.length === 0
      ? '**PASS: 0 illegal cross-domain FK.**'
      : table(['Source', 'Constraint', 'Target'], audit.illegalCrossDomainFks.map((row) => [`${row.schema}.${row.table}`, row.name, `${row.referenced_schema}.${row.referenced_table}`])),
    '',
    '## Logical UUID audit',
    '',
    table(['Contract column', 'Actual type', 'Result'], logicalRows),
    '',
    '## Document / migration / PostgreSQL differences',
    '',
    '- Content authoritative list is Curriculum 5 + Practice 5 = 31; the higher-level 6 + 4 grouping is treated as a non-blocking categorization mismatch.',
    '- Identity `users.public_id` is UUID and `basic_profiles.avatar_media_id` is UUID without FK, applying ADR-018/D-152 over the older Identity field page.',
    '- The executable target is 117 tables. Four frozen table identities lack a non-conflicting physical contract and are not represented by speculative DDL.',
    '',
    '## Specification blockers',
    '',
    ...audit.blockers.flatMap((blocker) => [
      `- **${blocker.code} — ${blocker.subject}:** ${blocker.detail}`,
    ]),
    '',
    `Blocked tables: ${audit.blockedTables.map((name) => `\`${name}\``).join(', ')}.`,
    '',
    '## Complete PostgreSQL catalog',
    '',
  ];

  for (const schema of BUSINESS_SCHEMAS) {
    sections.push(`### ${schema}`, '');
    for (const tableRow of audit.tables.filter((row) => row.schema === schema)) {
      const name = tableRow.table;
      sections.push(`#### ${schema}.${name}`, '');
      sections.push(table(
        ['Column', 'Type', 'Nullable', 'Default', 'Identity'],
        audit.columns.filter((row) => row.schema === schema && row.table === name)
          .map((row) => [row.column, row.type, row.nullable, row.default, row.identity || '—']),
      ));
      sections.push('', 'Constraints:', '');
      sections.push(table(
        ['Name', 'Type', 'Definition'],
        audit.constraints.filter((row) => row.schema === schema && row.table === name)
          .map((row) => [row.name, row.type, row.definition]),
      ));
      sections.push('', 'Indexes:', '');
      sections.push(table(
        ['Name', 'Unique', 'Predicate', 'Definition'],
        audit.indexes.filter((row) => row.schema === schema && row.table === name)
          .map((row) => [row.name, row.unique, row.predicate, row.definition]),
      ));
      sections.push('');
    }
  }

  const markdownPath = path.join(reportsDir, 'V2_DATABASE_BASELINE_REPORT.md');
  const jsonPath = path.join(reportsDir, 'baseline-audit.json');
  await writeFile(markdownPath, `${sections.join('\n')}\n`, 'utf8');
  await writeFile(jsonPath, `${JSON.stringify(audit, null, 2)}\n`, 'utf8');
  return { audit, markdownPath, jsonPath };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await writeReport();
  process.stdout.write(`${JSON.stringify({
    status: result.audit.finalStatus,
    markdownPath: result.markdownPath,
    jsonPath: result.jsonPath,
  }, null, 2)}\n`);
  if (!result.audit.databaseAuditPassed) process.exitCode = 1;
}
