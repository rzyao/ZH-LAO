import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { migrate } from './migrate.mjs';
import { collectAudit } from './audit.mjs';
import { writeReport } from './report.mjs';
import { quoteIdentifier, requireDatabaseUrl, withClient } from './db.mjs';

async function createValidationDatabase(adminUrl) {
  const name = `zh_lao_v2_validation_${new Date().toISOString().replaceAll(/[-:.TZ]/g, '').slice(0, 14)}_${randomUUID().replaceAll('-', '').slice(0, 8)}`;
  await withClient(adminUrl, (client) => client.query(`CREATE DATABASE ${quoteIdentifier(name)} TEMPLATE template0`));
  const url = new URL(adminUrl);
  url.pathname = `/${name}`;
  return { name, connectionString: url.toString() };
}

async function dropValidationDatabase(adminUrl, name) {
  await withClient(adminUrl, (client) => client.query(`DROP DATABASE ${quoteIdentifier(name)} WITH (FORCE)`));
}

async function expectRejected(client, name, sql, params = []) {
  await client.query(`SAVEPOINT ${quoteIdentifier(name)}`);
  try {
    await client.query(sql, params);
  } catch {
    await client.query(`ROLLBACK TO SAVEPOINT ${quoteIdentifier(name)}`);
    await client.query(`RELEASE SAVEPOINT ${quoteIdentifier(name)}`);
    return;
  }
  throw new Error(`Smoke test expected rejection: ${name}`);
}

async function runSmokeTests(connectionString) {
  return withClient(connectionString, async (client) => {
    await client.query('BEGIN');
    try {
      await expectRejected(client, 'identity_status', `
        INSERT INTO identity.users(public_id, status) VALUES (gen_random_uuid(), 'invalid')
      `);
      await expectRejected(client, 'identity_domain_fk', `
        INSERT INTO identity.auth_identities(user_id, provider, provider_subject)
        VALUES (999999999, 'phone', '+85600000000')
      `);
      await expectRejected(client, 'reward_program_status', `
        INSERT INTO rewards.reward_programs(program_key, name, status)
        VALUES ('INVALID', 'Invalid', 'UNKNOWN')
      `);

      const profile = await client.query(`
        INSERT INTO social.social_profiles(user_id, display_name)
        VALUES (gen_random_uuid(), 'Smoke') RETURNING id
      `);
      await client.query(`
        INSERT INTO social.social_profile_photos(profile_id, media_id, position)
        VALUES ($1, gen_random_uuid(), 1)
      `, [profile.rows[0].id]);
      await expectRejected(client, 'social_active_photo_position', `
        INSERT INTO social.social_profile_photos(profile_id, media_id, position)
        VALUES ($1, gen_random_uuid(), 1)
      `, [profile.rows[0].id]);

      const slotId = '00000000-0000-4000-8000-000000000001';
      await client.query(`
        INSERT INTO audio.audio_slots(
          id, source_domain, content_entity_type, content_entity_id,
          language_code, audio_role, required_content_revision_id, required_audio_input_hash
        ) VALUES ($1, 'content', 'word', gen_random_uuid(), 'zh', 'pronunciation', gen_random_uuid(), 'hash')
      `, [slotId]);
      await client.query(`
        INSERT INTO audio.audio_tasks(
          id, slot_id, production_method, status, content_revision_id, text_snapshot,
          audio_input_hash, tts_preset_key, created_by_operator_id, client_idempotency_key
        ) VALUES (gen_random_uuid(), $1, 'tts', 'pending_assignment', gen_random_uuid(), 'text',
          'hash', 'preset', gen_random_uuid(), 'smoke-1')
      `, [slotId]);
      await expectRejected(client, 'audio_one_active_task', `
        INSERT INTO audio.audio_tasks(
          id, slot_id, production_method, status, content_revision_id, text_snapshot,
          audio_input_hash, tts_preset_key, created_by_operator_id, client_idempotency_key
        ) VALUES (gen_random_uuid(), $1, 'tts', 'approved', gen_random_uuid(), 'text',
          'hash2', 'preset', gen_random_uuid(), 'smoke-2')
      `, [slotId]);

      await client.query('CREATE TABLE identity.__audit_fk_source(id integer PRIMARY KEY, target_id integer)');
      await client.query('CREATE TABLE content.__audit_fk_target(id integer PRIMARY KEY)');
      await client.query(`ALTER TABLE identity.__audit_fk_source ADD CONSTRAINT __audit_illegal_fk
        FOREIGN KEY(target_id) REFERENCES content.__audit_fk_target(id)`);
      const detector = await client.query(`
        SELECT count(*)::integer AS count
        FROM pg_constraint con
        JOIN pg_class src ON src.oid = con.conrelid
        JOIN pg_namespace src_ns ON src_ns.oid = src.relnamespace
        JOIN pg_class dst ON dst.oid = con.confrelid
        JOIN pg_namespace dst_ns ON dst_ns.oid = dst.relnamespace
        WHERE con.contype = 'f' AND src_ns.nspname <> dst_ns.nspname
          AND src_ns.nspname = ANY($1::text[]) AND dst_ns.nspname = ANY($1::text[])
      `, [['identity', 'content', 'learning', 'social', 'chat', 'audio', 'commerce', 'rewards', 'trust', 'operations', 'platform']]);
      if (detector.rows[0].count !== 1) {
        throw new Error('Cross-domain FK detector did not identify the injected violation');
      }
      await client.query('ROLLBACK');
      return {
        invalidCheckRejected: true,
        domainFkRejected: true,
        partialUniqueRejected: true,
        activeTaskUniqueRejected: true,
        crossDomainFkDetectorVerified: true,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}

export async function validate(options = {}) {
  const operations = {
    migrate: options.operations?.migrate ?? migrate,
    runSmokeTests: options.operations?.runSmokeTests ?? runSmokeTests,
    collectAudit: options.operations?.collectAudit ?? collectAudit,
    writeReport: options.operations?.writeReport ?? writeReport,
  };
  const requestedDatabaseUrl = Object.hasOwn(options, 'databaseUrl') ? options.databaseUrl : process.env.DATABASE_URL;
  const adminUrl = options.adminDatabaseUrl ?? process.env.ADMIN_DATABASE_URL;
  const keepValidationDatabase = options.keepValidationDatabase ?? process.env.KEEP_VALIDATION_DATABASE === '1';
  let connectionString = requestedDatabaseUrl;
  let databaseName;
  let ownedDatabase;
  if (!connectionString) {
    if (!adminUrl) requireDatabaseUrl('ADMIN_DATABASE_URL');
    const created = await createValidationDatabase(adminUrl);
    connectionString = created.connectionString;
    databaseName = created.name;
    ownedDatabase = created.name;
  } else {
    databaseName = new URL(connectionString).pathname.slice(1);
  }

  try {
    const firstRun = await operations.migrate(connectionString);
    const secondRun = await operations.migrate(connectionString);
    if (secondRun.executed.length !== 0) throw new Error('Second migration run was not a no-op');
    const smokeTests = await operations.runSmokeTests(connectionString);
    const audit = await operations.collectAudit(connectionString);
    if (!audit.databaseAuditPassed) {
      throw new Error(`Database audit failed: ${JSON.stringify(audit.violations)}`);
    }
    const report = options.writeReport === false ? null : await operations.writeReport(connectionString);
    return {
      databaseName,
      firstRun,
      secondRun,
      smokeTests,
      status: audit.finalStatus,
      report: report?.markdownPath ?? null,
    };
  } finally {
    if (ownedDatabase && !keepValidationDatabase) {
      await dropValidationDatabase(adminUrl, ownedDatabase);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await validate();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
