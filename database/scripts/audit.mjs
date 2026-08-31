import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { AUDIT_SCHEMAS, BUSINESS_SCHEMAS, INFRASTRUCTURE_SCHEMAS, requireDatabaseUrl, withClient } from './db.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const expectedPath = path.resolve(here, '..', 'checks', 'expected-schema.json');

async function loadExpected() {
  return JSON.parse(await readFile(expectedPath, 'utf8'));
}

export async function collectAudit(connectionString = requireDatabaseUrl()) {
  const expected = await loadExpected();
  return withClient(connectionString, async (client) => {
    const schemaParams = AUDIT_SCHEMAS;
    const server = await client.query(`SELECT current_database() AS database, current_user AS role,
        current_setting('server_version') AS version,
        current_setting('server_version_num')::integer AS version_num`);
    const extensions = await client.query(`SELECT extname AS name, extversion AS version
        FROM pg_extension ORDER BY extname`);
    const schemas = await client.query(`SELECT nspname AS schema
        FROM pg_namespace WHERE nspname = ANY($1::text[]) ORDER BY nspname`, [schemaParams]);
    const tables = await client.query(`SELECT schemaname AS schema, tablename AS table
        FROM pg_tables WHERE schemaname = ANY($1::text[]) ORDER BY schemaname, tablename`, [schemaParams]);
    const columns = await client.query(`SELECT n.nspname AS schema, c.relname AS table, a.attnum AS ordinal,
          a.attname AS column, pg_catalog.format_type(a.atttypid, a.atttypmod) AS type,
          NOT a.attnotnull AS nullable, pg_get_expr(d.adbin, d.adrelid) AS default,
          a.attidentity AS identity
        FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
        WHERE n.nspname = ANY($1::text[]) AND c.relkind IN ('r','p')
          AND a.attnum > 0 AND NOT a.attisdropped
        ORDER BY n.nspname, c.relname, a.attnum`, [schemaParams]);
    const constraints = await client.query(`SELECT ns.nspname AS schema, cls.relname AS table, con.conname AS name,
          con.contype AS type, pg_get_constraintdef(con.oid, true) AS definition,
          rns.nspname AS referenced_schema, rcls.relname AS referenced_table
        FROM pg_constraint con
        JOIN pg_class cls ON cls.oid = con.conrelid
        JOIN pg_namespace ns ON ns.oid = cls.relnamespace
        LEFT JOIN pg_class rcls ON rcls.oid = con.confrelid
        LEFT JOIN pg_namespace rns ON rns.oid = rcls.relnamespace
        WHERE ns.nspname = ANY($1::text[])
        ORDER BY ns.nspname, cls.relname, con.contype, con.conname`, [schemaParams]);
    const indexes = await client.query(`SELECT ns.nspname AS schema, tbl.relname AS table, idx.relname AS name,
          i.indisunique AS unique, i.indisprimary AS primary,
          pg_get_indexdef(i.indexrelid) AS definition,
          pg_get_expr(i.indpred, i.indrelid) AS predicate
        FROM pg_index i
        JOIN pg_class tbl ON tbl.oid = i.indrelid
        JOIN pg_class idx ON idx.oid = i.indexrelid
        JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
        WHERE ns.nspname = ANY($1::text[])
        ORDER BY ns.nspname, tbl.relname, idx.relname`, [schemaParams]);
    const migrations = await client.query(`SELECT filename, sha256, applied_at
        FROM public.v2_schema_migrations ORDER BY filename`);

    const actualSchemaSet = new Set(schemas.rows.map((row) => row.schema));
    const actualTableSet = new Set(tables.rows.map((row) => `${row.schema}.${row.table}`));
    const expectedTables = Object.entries(expected.schemas)
      .flatMap(([schema, names]) => names.map((name) => `${schema}.${name}`));
    const expectedBusinessTables = BUSINESS_SCHEMAS.flatMap((schema) =>
      (expected.schemas[schema] ?? []).map((name) => `${schema}.${name}`));
    const expectedInfrastructureTables = INFRASTRUCTURE_SCHEMAS.flatMap((schema) =>
      (expected.schemas[schema] ?? []).map((name) => `${schema}.${name}`));
    const expectedTableSet = new Set(expectedTables);
    const missingSchemas = BUSINESS_SCHEMAS.filter((schema) => !actualSchemaSet.has(schema));
    const missingInfrastructureSchemas = INFRASTRUCTURE_SCHEMAS.filter((schema) => !actualSchemaSet.has(schema));
    const missingTables = expectedTables.filter((table) => !actualTableSet.has(table));
    const unexpectedTables = [...actualTableSet].filter((table) => !expectedTableSet.has(table));

    const illegalCrossDomainFks = constraints.rows.filter((row) =>
      row.type === 'f' && row.referenced_schema && row.schema !== row.referenced_schema,
    );
    const pkTables = new Set(constraints.rows
      .filter((row) => row.type === 'p')
      .map((row) => `${row.schema}.${row.table}`));
    const tablesWithoutPk = [...actualTableSet].filter((table) => !pkTables.has(table));
    const timestampWithoutTimezone = columns.rows
      .filter((row) => row.type === 'timestamp without time zone')
      .map((row) => `${row.schema}.${row.table}.${row.column}`);

    const columnMap = new Map(columns.rows.map((row) => [`${row.schema}.${row.table}.${row.column}`, row]));
    const fkSourceColumns = new Set();
    const fkColumnResult = await client.query(`
      SELECT ns.nspname AS schema, cls.relname AS table, att.attname AS column
      FROM pg_constraint con
      JOIN pg_class cls ON cls.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cls.relnamespace
      CROSS JOIN LATERAL unnest(con.conkey) AS key(attnum)
      JOIN pg_attribute att ON att.attrelid = cls.oid AND att.attnum = key.attnum
      WHERE con.contype = 'f' AND ns.nspname = ANY($1::text[])
    `, [schemaParams]);
    for (const row of fkColumnResult.rows) {
      fkSourceColumns.add(`${row.schema}.${row.table}.${row.column}`);
    }
    const logicalUuidViolations = expected.logicalUuidColumns.flatMap((name) => {
      const column = columnMap.get(name);
      if (!column) return [{ column: name, issue: 'missing column' }];
      if (column.type !== 'uuid') return [{ column: name, issue: `expected uuid, found ${column.type}` }];
      if (fkSourceColumns.has(name)) return [{ column: name, issue: 'logical reference has a physical FK' }];
      return [];
    });

    const extensionNames = new Set(extensions.rows.map((row) => row.name));
    const missingExtensions = expected.extensions.filter((name) => !extensionNames.has(name));
    const forbiddenExtensions = ['citext', 'pgcrypto', 'postgis'].filter((name) => extensionNames.has(name));
    const major = Math.floor(server.rows[0].version_num / 10000);

    const constraintCounts = {};
    for (const schema of AUDIT_SCHEMAS) {
      const rows = constraints.rows.filter((row) => row.schema === schema);
      constraintCounts[schema] = {
        pk: rows.filter((row) => row.type === 'p').length,
        fk: rows.filter((row) => row.type === 'f').length,
        unique: rows.filter((row) => row.type === 'u').length,
        check: rows.filter((row) => row.type === 'c').length,
        indexes: indexes.rows.filter((row) => row.schema === schema).length,
      };
    }

    const violations = [
      ...missingSchemas.map((schema) => ({ check: 'schema', detail: `missing ${schema}` })),
      ...missingInfrastructureSchemas.map((schema) => ({ check: 'infrastructure_schema', detail: `missing ${schema}` })),
      ...missingTables.map((table) => ({ check: 'table', detail: `missing ${table}` })),
      ...unexpectedTables.map((table) => ({ check: 'table', detail: `unexpected ${table}` })),
      ...tablesWithoutPk.map((table) => ({ check: 'primary_key', detail: `${table} has no primary key` })),
      ...illegalCrossDomainFks.map((fk) => ({ check: 'cross_domain_fk', detail: `${fk.schema}.${fk.table}.${fk.name} -> ${fk.referenced_schema}.${fk.referenced_table}` })),
      ...logicalUuidViolations.map((item) => ({ check: 'logical_uuid', detail: `${item.column}: ${item.issue}` })),
      ...missingExtensions.map((name) => ({ check: 'extension', detail: `missing ${name}` })),
      ...forbiddenExtensions.map((name) => ({ check: 'extension', detail: `unneeded extension installed: ${name}` })),
      ...(major === expected.postgresMajor ? [] : [{ check: 'server_version', detail: `expected PostgreSQL ${expected.postgresMajor}, found ${major}` }]),
    ];

    return {
      generatedAt: new Date().toISOString(),
      server: server.rows[0],
      extensions: extensions.rows,
      schemas: schemas.rows.map((row) => row.schema),
      tables: tables.rows,
      columns: columns.rows,
      constraints: constraints.rows,
      indexes: indexes.rows,
      migrations: migrations.rows,
      constraintCounts,
      missingSchemas,
      missingInfrastructureSchemas,
      missingTables,
      unexpectedTables,
      tablesWithoutPk,
      timestampWithoutTimezone,
      illegalCrossDomainFks,
      logicalUuidViolations,
      blockers: expected.blockers,
      blockedTables: expected.blockedTables,
      expectedBusinessTableCount: expectedBusinessTables.length,
      actualBusinessTableCount: [...actualTableSet].filter((name) => name.split('.')[0] !== 'infrastructure').length,
      expectedInfrastructureTableCount: expectedInfrastructureTables.length,
      actualInfrastructureTableCount: [...actualTableSet].filter((name) => name.split('.')[0] === 'infrastructure').length,
      violations,
      databaseAuditPassed: violations.length === 0,
      finalStatus: violations.length === 0 && expected.blockers.length > 0 ? 'PASS_WITH_BLOCKERS' : violations.length === 0 ? 'PASS' : 'FAIL',
    };
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const audit = await collectAudit();
  process.stdout.write(`${JSON.stringify(audit, null, 2)}\n`);
  if (!audit.databaseAuditPassed) process.exitCode = 1;
}
