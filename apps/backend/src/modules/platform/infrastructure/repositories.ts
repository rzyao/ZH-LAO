import type { DatabaseExecutor } from '../../../database/executor.js';
import {
  parseAnnouncementInternalId,
  parseAnnouncementPublicId,
  parseAppVersionInternalId,
  parseFeatureFlagInternalId,
  parseFeatureFlagOverrideInternalId,
  parseRegionInternalId,
  parseRuntimeConfigInternalId,
  type AnnouncementInternalId,
  type AnnouncementPublicId,
  type AnnouncementRecord,
  type AnnouncementStatus,
  type AppVersionInternalId,
  type AppVersionRecord,
  type AppVersionStatus,
  type AppVersionUpdatePolicy,
  type FeatureFlag,
  type FeatureFlagInternalId,
  type FeatureFlagOverride,
  type FeatureFlagStatus,
  type PlatformClientPlatform,
  type Region,
  type RegionInternalId,
  type RegionStatus,
  type RuntimeConfigRecord,
  type RuntimeConfigStatus,
  type RuntimeConfigValueType,
} from '../domain/index.js';
import type {
  AnnouncementRepository,
  AppVersionRepository,
  FeatureFlagOverrideRepository,
  FeatureFlagRepository,
  RegionRepository,
  RuntimeConfigRepository,
} from '../application/ports/platform-repositories.js';

type FlagRow = {
  id: string | number | bigint;
  key: string;
  name: string;
  description: string | null;
  default_enabled: boolean;
  status: FeatureFlagStatus;
  created_at: Date;
  updated_at: Date;
};

function mapFlagRow(row: FlagRow): FeatureFlag {
  return {
    id: parseFeatureFlagInternalId(BigInt(row.id)),
    key: row.key,
    name: row.name,
    description: row.description,
    defaultEnabled: row.default_enabled,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type OverrideRow = {
  id: string | number | bigint;
  feature_flag_id: string | number | bigint;
  region_id: string | number | bigint | null;
  client_platform: PlatformClientPlatform | null;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
};

function mapOverrideRow(row: OverrideRow): FeatureFlagOverride {
  return {
    id: parseFeatureFlagOverrideInternalId(BigInt(row.id)),
    featureFlagId: parseFeatureFlagInternalId(BigInt(row.feature_flag_id)),
    regionId: row.region_id !== null ? parseRegionInternalId(BigInt(row.region_id)) : null,
    clientPlatform: row.client_platform,
    enabled: row.enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PostgresFeatureFlagRepository implements FeatureFlagRepository {
  async findByKey(executor: DatabaseExecutor, key: string, forUpdate = false): Promise<FeatureFlag | null> {
    const lock = forUpdate ? ' FOR UPDATE' : '';
    const result = await executor.query<FlagRow>(
      `SELECT id, key, name, description, default_enabled, status, created_at, updated_at
       FROM platform.feature_flags
       WHERE key = $1${lock}`,
      [key],
    );
    return result.rows[0] ? mapFlagRow(result.rows[0]) : null;
  }

  async findMultipleByKeys(executor: DatabaseExecutor, keys: readonly string[]): Promise<readonly FeatureFlag[]> {
    if (keys.length === 0) return [];
    const result = await executor.query<FlagRow>(
      `SELECT id, key, name, description, default_enabled, status, created_at, updated_at
       FROM platform.feature_flags
       WHERE key = ANY($1::varchar[])`,
      [keys as string[]],
    );
    return result.rows.map(mapFlagRow);
  }

  async create(
    executor: DatabaseExecutor,
    input: Readonly<{
      key: string;
      name: string;
      description: string | null;
      defaultEnabled: boolean;
      status?: FeatureFlagStatus;
    }>,
  ): Promise<FeatureFlag> {
    const status = input.status ?? 'active';
    const result = await executor.query<FlagRow>(
      `INSERT INTO platform.feature_flags (key, name, description, default_enabled, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, key, name, description, default_enabled, status, created_at, updated_at`,
      [input.key, input.name, input.description, input.defaultEnabled, status],
    );
    return mapFlagRow(result.rows[0]!);
  }

  async update(
    executor: DatabaseExecutor,
    id: FeatureFlagInternalId,
    input: Readonly<{
      name?: string;
      description?: string | null;
      defaultEnabled?: boolean;
      status?: FeatureFlagStatus;
    }>,
  ): Promise<FeatureFlag> {
    const updates: string[] = [];
    const params: unknown[] = [id];
    let idx = 2;

    if (input.name !== undefined) {
      updates.push(`name = $${idx++}`);
      params.push(input.name);
    }
    if (input.description !== undefined) {
      updates.push(`description = $${idx++}`);
      params.push(input.description);
    }
    if (input.defaultEnabled !== undefined) {
      updates.push(`default_enabled = $${idx++}`);
      params.push(input.defaultEnabled);
    }
    if (input.status !== undefined) {
      updates.push(`status = $${idx++}`);
      params.push(input.status);
    }

    updates.push('updated_at = now()');

    const result = await executor.query<FlagRow>(
      `UPDATE platform.feature_flags
       SET ${updates.join(', ')}
       WHERE id = $1
       RETURNING id, key, name, description, default_enabled, status, created_at, updated_at`,
      params,
    );
    return mapFlagRow(result.rows[0]!);
  }

  async listForManagement(executor: DatabaseExecutor): Promise<readonly FeatureFlag[]> {
    const result = await executor.query<FlagRow>(
      `SELECT id, key, name, description, default_enabled, status, created_at, updated_at
       FROM platform.feature_flags
       ORDER BY key ASC`,
    );
    return result.rows.map(mapFlagRow);
  }
}

export class PostgresFeatureFlagOverrideRepository implements FeatureFlagOverrideRepository {
  async findOverridesForFlags(
    executor: DatabaseExecutor,
    flagIds: readonly FeatureFlagInternalId[],
  ): Promise<readonly FeatureFlagOverride[]> {
    if (flagIds.length === 0) return [];
    const result = await executor.query<OverrideRow>(
      `SELECT id, feature_flag_id, region_id, client_platform, enabled, created_at, updated_at
       FROM platform.feature_flag_overrides
       WHERE feature_flag_id = ANY($1::bigint[])`,
      [flagIds as unknown as bigint[]],
    );
    return result.rows.map(mapOverrideRow);
  }

  async findSpecificOverride(
    executor: DatabaseExecutor,
    flagId: FeatureFlagInternalId,
    regionId: RegionInternalId | null,
    clientPlatform: PlatformClientPlatform | null,
    forUpdate = false,
  ): Promise<FeatureFlagOverride | null> {
    const lock = forUpdate ? ' FOR UPDATE' : '';
    let condition = 'feature_flag_id = $1';
    const params: unknown[] = [flagId];
    let idx = 2;

    if (regionId !== null) {
      condition += ` AND region_id = $${idx++}`;
      params.push(regionId);
    } else {
      condition += ' AND region_id IS NULL';
    }

    if (clientPlatform !== null) {
      condition += ` AND client_platform = $${idx++}`;
      params.push(clientPlatform);
    } else {
      condition += ' AND client_platform IS NULL';
    }

    const result = await executor.query<OverrideRow>(
      `SELECT id, feature_flag_id, region_id, client_platform, enabled, created_at, updated_at
       FROM platform.feature_flag_overrides
       WHERE ${condition}${lock}`,
      params,
    );
    return result.rows[0] ? mapOverrideRow(result.rows[0]) : null;
  }

  async upsert(
    executor: DatabaseExecutor,
    input: Readonly<{
      featureFlagId: FeatureFlagInternalId;
      regionId: RegionInternalId | null;
      clientPlatform: PlatformClientPlatform | null;
      enabled: boolean;
    }>,
  ): Promise<FeatureFlagOverride> {
    let conflictTarget = '';
    if (input.regionId !== null && input.clientPlatform === null) {
      conflictTarget = '(feature_flag_id, region_id) WHERE region_id IS NOT NULL AND client_platform IS NULL';
    } else if (input.regionId === null && input.clientPlatform !== null) {
      conflictTarget = '(feature_flag_id, client_platform) WHERE region_id IS NULL AND client_platform IS NOT NULL';
    } else if (input.regionId !== null && input.clientPlatform !== null) {
      conflictTarget = '(feature_flag_id, region_id, client_platform) WHERE region_id IS NOT NULL AND client_platform IS NOT NULL';
    }

    const query = `
      INSERT INTO platform.feature_flag_overrides (feature_flag_id, region_id, client_platform, enabled)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT ${conflictTarget}
      DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = now()
      RETURNING id, feature_flag_id, region_id, client_platform, enabled, created_at, updated_at
    `;

    const result = await executor.query<OverrideRow>(query, [
      input.featureFlagId,
      input.regionId,
      input.clientPlatform,
      input.enabled,
    ]);
    return mapOverrideRow(result.rows[0]!);
  }

  async deleteByScope(
    executor: DatabaseExecutor,
    featureFlagId: FeatureFlagInternalId,
    regionId: RegionInternalId | null,
    clientPlatform: PlatformClientPlatform | null,
  ): Promise<boolean> {
    let condition = 'feature_flag_id = $1';
    const params: unknown[] = [featureFlagId];
    let idx = 2;

    if (regionId !== null) {
      condition += ` AND region_id = $${idx++}`;
      params.push(regionId);
    } else {
      condition += ' AND region_id IS NULL';
    }

    if (clientPlatform !== null) {
      condition += ` AND client_platform = $${idx++}`;
      params.push(clientPlatform);
    } else {
      condition += ' AND client_platform IS NULL';
    }

    const result = await executor.query(`DELETE FROM platform.feature_flag_overrides WHERE ${condition}`, params);
    return (result.rowCount ?? 0) > 0;
  }

  async deleteByFlagId(executor: DatabaseExecutor, featureFlagId: FeatureFlagInternalId): Promise<number> {
    const result = await executor.query('DELETE FROM platform.feature_flag_overrides WHERE feature_flag_id = $1', [
      featureFlagId,
    ]);
    return result.rowCount ?? 0;
  }
}

type ConfigRow = {
  id: string | number | bigint;
  key: string;
  value_type: RuntimeConfigValueType;
  value: unknown;
  description: string | null;
  status: RuntimeConfigStatus;
  created_at: Date;
  updated_at: Date;
};

function mapConfigRow(row: ConfigRow): RuntimeConfigRecord {
  return {
    id: parseRuntimeConfigInternalId(BigInt(row.id)),
    key: row.key,
    valueType: row.value_type,
    value: row.value,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PostgresRuntimeConfigRepository implements RuntimeConfigRepository {
  async findByKey(executor: DatabaseExecutor, key: string, forUpdate = false): Promise<RuntimeConfigRecord | null> {
    const lock = forUpdate ? ' FOR UPDATE' : '';
    const result = await executor.query<ConfigRow>(
      `SELECT id, key, value_type, value, description, status, created_at, updated_at
       FROM platform.runtime_configs
       WHERE key = $1${lock}`,
      [key],
    );
    return result.rows[0] ? mapConfigRow(result.rows[0]) : null;
  }

  async findMultipleByKeys(executor: DatabaseExecutor, keys: readonly string[]): Promise<readonly RuntimeConfigRecord[]> {
    if (keys.length === 0) return [];
    const result = await executor.query<ConfigRow>(
      `SELECT id, key, value_type, value, description, status, created_at, updated_at
       FROM platform.runtime_configs
       WHERE key = ANY($1::varchar[])`,
      [keys as string[]],
    );
    return result.rows.map(mapConfigRow);
  }

  async upsert(
    executor: DatabaseExecutor,
    input: Readonly<{
      key: string;
      valueType: RuntimeConfigValueType;
      value: unknown;
      description: string | null;
      status?: RuntimeConfigStatus;
    }>,
  ): Promise<RuntimeConfigRecord> {
    const status = input.status ?? 'active';
    const result = await executor.query<ConfigRow>(
      `INSERT INTO platform.runtime_configs (key, value_type, value, description, status)
       VALUES ($1, $2, $3::jsonb, $4, $5)
       ON CONFLICT (key)
       DO UPDATE SET
         value = EXCLUDED.value,
         description = EXCLUDED.description,
         status = EXCLUDED.status,
         updated_at = now()
       RETURNING id, key, value_type, value, description, status, created_at, updated_at`,
      [input.key, input.valueType, JSON.stringify(input.value), input.description, status],
    );
    return mapConfigRow(result.rows[0]!);
  }

  async retire(executor: DatabaseExecutor, key: string): Promise<RuntimeConfigRecord | null> {
    const result = await executor.query<ConfigRow>(
      `UPDATE platform.runtime_configs
       SET status = 'retired', updated_at = now()
       WHERE key = $1
       RETURNING id, key, value_type, value, description, status, created_at, updated_at`,
      [key],
    );
    return result.rows[0] ? mapConfigRow(result.rows[0]) : null;
  }

  async listForManagement(executor: DatabaseExecutor): Promise<readonly RuntimeConfigRecord[]> {
    const result = await executor.query<ConfigRow>(
      `SELECT id, key, value_type, value, description, status, created_at, updated_at
       FROM platform.runtime_configs
       ORDER BY key ASC`,
    );
    return result.rows.map(mapConfigRow);
  }
}

type VersionRow = {
  id: string | number | bigint;
  client_platform: PlatformClientPlatform;
  version: string;
  build_number: string | number | bigint;
  status: AppVersionStatus;
  update_policy: AppVersionUpdatePolicy;
  release_notes: string | null;
  released_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

function mapVersionRow(row: VersionRow): AppVersionRecord {
  return {
    id: parseAppVersionInternalId(BigInt(row.id)),
    clientPlatform: row.client_platform,
    version: row.version,
    buildNumber: Number(row.build_number),
    status: row.status,
    updatePolicy: row.update_policy,
    releaseNotes: row.release_notes,
    releasedAt: row.released_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PostgresAppVersionRepository implements AppVersionRepository {
  async findByPlatformAndBuild(
    executor: DatabaseExecutor,
    clientPlatform: PlatformClientPlatform,
    buildNumber: number,
    forUpdate = false,
  ): Promise<AppVersionRecord | null> {
    const lock = forUpdate ? ' FOR UPDATE' : '';
    const result = await executor.query<VersionRow>(
      `SELECT id, client_platform, version, build_number, status, update_policy, release_notes, released_at, created_at, updated_at
       FROM platform.app_versions
       WHERE client_platform = $1 AND build_number = $2${lock}`,
      [clientPlatform, buildNumber],
    );
    return result.rows[0] ? mapVersionRow(result.rows[0]) : null;
  }

  async listByPlatform(
    executor: DatabaseExecutor,
    clientPlatform: PlatformClientPlatform,
  ): Promise<readonly AppVersionRecord[]> {
    const result = await executor.query<VersionRow>(
      `SELECT id, client_platform, version, build_number, status, update_policy, release_notes, released_at, created_at, updated_at
       FROM platform.app_versions
       WHERE client_platform = $1
       ORDER BY build_number DESC`,
      [clientPlatform],
    );
    return result.rows.map(mapVersionRow);
  }

  async create(
    executor: DatabaseExecutor,
    input: Readonly<{
      clientPlatform: PlatformClientPlatform;
      version: string;
      buildNumber: number;
      releaseNotes: string | null;
      status?: AppVersionStatus;
      updatePolicy?: AppVersionUpdatePolicy;
      releasedAt?: Date | null;
    }>,
  ): Promise<AppVersionRecord> {
    const status = input.status ?? 'draft';
    const policy = input.updatePolicy ?? 'none';
    const result = await executor.query<VersionRow>(
      `INSERT INTO platform.app_versions (client_platform, version, build_number, status, update_policy, release_notes, released_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, client_platform, version, build_number, status, update_policy, release_notes, released_at, created_at, updated_at`,
      [input.clientPlatform, input.version, input.buildNumber, status, policy, input.releaseNotes, input.releasedAt ?? null],
    );
    return mapVersionRow(result.rows[0]!);
  }

  async update(
    executor: DatabaseExecutor,
    id: AppVersionInternalId,
    input: Readonly<{
      version?: string;
      releaseNotes?: string | null;
      status?: AppVersionStatus;
      updatePolicy?: AppVersionUpdatePolicy;
      releasedAt?: Date | null;
    }>,
  ): Promise<AppVersionRecord> {
    const updates: string[] = [];
    const params: unknown[] = [id];
    let idx = 2;

    if (input.version !== undefined) {
      updates.push(`version = $${idx++}`);
      params.push(input.version);
    }
    if (input.releaseNotes !== undefined) {
      updates.push(`release_notes = $${idx++}`);
      params.push(input.releaseNotes);
    }
    if (input.status !== undefined) {
      updates.push(`status = $${idx++}`);
      params.push(input.status);
    }
    if (input.updatePolicy !== undefined) {
      updates.push(`update_policy = $${idx++}`);
      params.push(input.updatePolicy);
    }
    if (input.releasedAt !== undefined) {
      updates.push(`released_at = $${idx++}`);
      params.push(input.releasedAt);
    }

    updates.push('updated_at = now()');

    const result = await executor.query<VersionRow>(
      `UPDATE platform.app_versions
       SET ${updates.join(', ')}
       WHERE id = $1
       RETURNING id, client_platform, version, build_number, status, update_policy, release_notes, released_at, created_at, updated_at`,
      params,
    );
    return mapVersionRow(result.rows[0]!);
  }

  async deleteDraft(executor: DatabaseExecutor, id: AppVersionInternalId): Promise<boolean> {
    const result = await executor.query(
      `DELETE FROM platform.app_versions
       WHERE id = $1 AND status = 'draft'`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async listForManagement(
    executor: DatabaseExecutor,
    clientPlatform?: PlatformClientPlatform,
  ): Promise<readonly AppVersionRecord[]> {
    let query = `
      SELECT id, client_platform, version, build_number, status, update_policy, release_notes, released_at, created_at, updated_at
      FROM platform.app_versions
    `;
    const params: unknown[] = [];
    if (clientPlatform) {
      query += ' WHERE client_platform = $1';
      params.push(clientPlatform);
    }
    query += ' ORDER BY client_platform ASC, build_number DESC';

    const result = await executor.query<VersionRow>(query, params);
    return result.rows.map(mapVersionRow);
  }

  async acquirePlatformAdvisoryLock(executor: DatabaseExecutor, clientPlatform: PlatformClientPlatform): Promise<void> {
    const platformKey = clientPlatform === 'android' ? 3001 : 3002;
    await executor.query('SELECT pg_advisory_xact_lock($1)', [platformKey]);
  }
}

type AnnouncementRow = {
  id: string | number | bigint;
  public_id: string;
  title: string;
  content: string;
  region_id: string | number | bigint | null;
  client_platform: PlatformClientPlatform | null;
  status: AnnouncementStatus;
  starts_at: Date | null;
  ends_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

function mapAnnouncementRow(row: AnnouncementRow): AnnouncementRecord {
  return {
    id: parseAnnouncementInternalId(BigInt(row.id)),
    publicId: parseAnnouncementPublicId(row.public_id),
    title: row.title,
    content: row.content,
    regionId: row.region_id !== null ? parseRegionInternalId(BigInt(row.region_id)) : null,
    clientPlatform: row.client_platform,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PostgresAnnouncementRepository implements AnnouncementRepository {
  async findByPublicId(
    executor: DatabaseExecutor,
    publicId: AnnouncementPublicId,
    forUpdate = false,
  ): Promise<AnnouncementRecord | null> {
    const lock = forUpdate ? ' FOR UPDATE' : '';
    const result = await executor.query<AnnouncementRow>(
      `SELECT id, public_id, title, content, region_id, client_platform, status, starts_at, ends_at, created_at, updated_at
       FROM platform.announcements
       WHERE public_id = $1${lock}`,
      [publicId],
    );
    return result.rows[0] ? mapAnnouncementRow(result.rows[0]) : null;
  }

  async findActiveAnnouncements(
    executor: DatabaseExecutor,
    context: Readonly<{
      regionId: RegionInternalId | null;
      clientPlatform: PlatformClientPlatform | null;
      now?: Date;
    }>,
  ): Promise<readonly AnnouncementRecord[]> {
    const now = context.now ?? new Date();
    let scopeCondition = '(region_id IS NULL AND client_platform IS NULL)';
    const params: unknown[] = [now];
    let idx = 2;

    if (context.regionId !== null) {
      scopeCondition += ` OR (region_id = $${idx++} AND client_platform IS NULL)`;
      params.push(context.regionId);
    }
    if (context.clientPlatform !== null) {
      scopeCondition += ` OR (region_id IS NULL AND client_platform = $${idx++})`;
      params.push(context.clientPlatform);
    }
    if (context.regionId !== null && context.clientPlatform !== null) {
      scopeCondition += ` OR (region_id = $${params.indexOf(context.regionId) + 1} AND client_platform = $${params.indexOf(context.clientPlatform) + 1})`;
    }

    const query = `
      SELECT id, public_id, title, content, region_id, client_platform, status, starts_at, ends_at, created_at, updated_at
      FROM platform.announcements
      WHERE status = 'published'
        AND starts_at <= $1
        AND (ends_at IS NULL OR ends_at > $1)
        AND (${scopeCondition})
      ORDER BY starts_at DESC, created_at DESC, public_id ASC
      LIMIT 50
    `;

    const result = await executor.query<AnnouncementRow>(query, params);
    return result.rows.map(mapAnnouncementRow);
  }

  async create(
    executor: DatabaseExecutor,
    input: Readonly<{
      publicId?: AnnouncementPublicId;
      title: string;
      content: string;
      regionId: RegionInternalId | null;
      clientPlatform: PlatformClientPlatform | null;
      status?: AnnouncementStatus;
      startsAt: Date | null;
      endsAt: Date | null;
    }>,
  ): Promise<AnnouncementRecord> {
    const status = input.status ?? 'draft';
    let query: string;
    let params: unknown[];

    if (input.publicId) {
      query = `
        INSERT INTO platform.announcements (public_id, title, content, region_id, client_platform, status, starts_at, ends_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, public_id, title, content, region_id, client_platform, status, starts_at, ends_at, created_at, updated_at
      `;
      params = [input.publicId, input.title, input.content, input.regionId, input.clientPlatform, status, input.startsAt, input.endsAt];
    } else {
      query = `
        INSERT INTO platform.announcements (title, content, region_id, client_platform, status, starts_at, ends_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, public_id, title, content, region_id, client_platform, status, starts_at, ends_at, created_at, updated_at
      `;
      params = [input.title, input.content, input.regionId, input.clientPlatform, status, input.startsAt, input.endsAt];
    }

    const result = await executor.query<AnnouncementRow>(query, params);
    return mapAnnouncementRow(result.rows[0]!);
  }

  async update(
    executor: DatabaseExecutor,
    id: AnnouncementInternalId,
    input: Readonly<{
      title?: string;
      content?: string;
      regionId?: RegionInternalId | null;
      clientPlatform?: PlatformClientPlatform | null;
      status?: AnnouncementStatus;
      startsAt?: Date | null;
      endsAt?: Date | null;
    }>,
  ): Promise<AnnouncementRecord> {
    const updates: string[] = [];
    const params: unknown[] = [id];
    let idx = 2;

    if (input.title !== undefined) {
      updates.push(`title = $${idx++}`);
      params.push(input.title);
    }
    if (input.content !== undefined) {
      updates.push(`content = $${idx++}`);
      params.push(input.content);
    }
    if (input.regionId !== undefined) {
      updates.push(`region_id = $${idx++}`);
      params.push(input.regionId);
    }
    if (input.clientPlatform !== undefined) {
      updates.push(`client_platform = $${idx++}`);
      params.push(input.clientPlatform);
    }
    if (input.status !== undefined) {
      updates.push(`status = $${idx++}`);
      params.push(input.status);
    }
    if (input.startsAt !== undefined) {
      updates.push(`starts_at = $${idx++}`);
      params.push(input.startsAt);
    }
    if (input.endsAt !== undefined) {
      updates.push(`ends_at = $${idx++}`);
      params.push(input.endsAt);
    }

    updates.push('updated_at = now()');

    const result = await executor.query<AnnouncementRow>(
      `UPDATE platform.announcements
       SET ${updates.join(', ')}
       WHERE id = $1
       RETURNING id, public_id, title, content, region_id, client_platform, status, starts_at, ends_at, created_at, updated_at`,
      params,
    );
    return mapAnnouncementRow(result.rows[0]!);
  }

  async deleteDraft(executor: DatabaseExecutor, id: AnnouncementInternalId): Promise<boolean> {
    const result = await executor.query(
      `DELETE FROM platform.announcements
       WHERE id = $1 AND status = 'draft'`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async listForManagement(executor: DatabaseExecutor): Promise<readonly AnnouncementRecord[]> {
    const result = await executor.query<AnnouncementRow>(
      `SELECT id, public_id, title, content, region_id, client_platform, status, starts_at, ends_at, created_at, updated_at
       FROM platform.announcements
       ORDER BY created_at DESC, public_id ASC`,
    );
    return result.rows.map(mapAnnouncementRow);
  }
}

type RegionRow = {
  id: string | number | bigint;
  code: string;
  name: string;
  default_locale: string;
  timezone: string;
  status: RegionStatus;
  created_at: Date;
  updated_at: Date;
};

function mapRegionRow(row: RegionRow): Region {
  return {
    id: parseRegionInternalId(BigInt(row.id)),
    code: row.code,
    name: row.name,
    defaultLocale: row.default_locale,
    timezone: row.timezone,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PostgresRegionRepository implements RegionRepository {
  async findByCode(executor: DatabaseExecutor, code: string, forUpdate = false): Promise<Region | null> {
    const lock = forUpdate ? ' FOR UPDATE' : '';
    const result = await executor.query<RegionRow>(
      `SELECT id, code, name, default_locale, timezone, status, created_at, updated_at
       FROM platform.regions
       WHERE code = $1${lock}`,
      [code],
    );
    return result.rows[0] ? mapRegionRow(result.rows[0]) : null;
  }

  async findById(executor: DatabaseExecutor, id: RegionInternalId): Promise<Region | null> {
    const result = await executor.query<RegionRow>(
      `SELECT id, code, name, default_locale, timezone, status, created_at, updated_at
       FROM platform.regions
       WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? mapRegionRow(result.rows[0]) : null;
  }

  async listActive(executor: DatabaseExecutor): Promise<readonly Region[]> {
    const result = await executor.query<RegionRow>(
      `SELECT id, code, name, default_locale, timezone, status, created_at, updated_at
       FROM platform.regions
       WHERE status = 'active'
       ORDER BY code ASC`,
    );
    return result.rows.map(mapRegionRow);
  }

  async listForManagement(executor: DatabaseExecutor): Promise<readonly Region[]> {
    const result = await executor.query<RegionRow>(
      `SELECT id, code, name, default_locale, timezone, status, created_at, updated_at
       FROM platform.regions
       ORDER BY code ASC`,
    );
    return result.rows.map(mapRegionRow);
  }

  async create(
    executor: DatabaseExecutor,
    input: Readonly<{
      code: string;
      name: string;
      defaultLocale: string;
      timezone: string;
      status?: RegionStatus;
    }>,
  ): Promise<Region> {
    const status = input.status ?? 'active';
    const result = await executor.query<RegionRow>(
      `INSERT INTO platform.regions (code, name, default_locale, timezone, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, code, name, default_locale, timezone, status, created_at, updated_at`,
      [input.code, input.name, input.defaultLocale, input.timezone, status],
    );
    return mapRegionRow(result.rows[0]!);
  }

  async update(
    executor: DatabaseExecutor,
    id: RegionInternalId,
    input: Readonly<{
      name?: string;
      defaultLocale?: string;
      timezone?: string;
      status?: RegionStatus;
    }>,
  ): Promise<Region> {
    const updates: string[] = [];
    const params: unknown[] = [id];
    let idx = 2;

    if (input.name !== undefined) {
      updates.push(`name = $${idx++}`);
      params.push(input.name);
    }
    if (input.defaultLocale !== undefined) {
      updates.push(`default_locale = $${idx++}`);
      params.push(input.defaultLocale);
    }
    if (input.timezone !== undefined) {
      updates.push(`timezone = $${idx++}`);
      params.push(input.timezone);
    }
    if (input.status !== undefined) {
      updates.push(`status = $${idx++}`);
      params.push(input.status);
    }

    updates.push('updated_at = now()');

    const result = await executor.query<RegionRow>(
      `UPDATE platform.regions
       SET ${updates.join(', ')}
       WHERE id = $1
       RETURNING id, code, name, default_locale, timezone, status, created_at, updated_at`,
      params,
    );
    return mapRegionRow(result.rows[0]!);
  }
}
