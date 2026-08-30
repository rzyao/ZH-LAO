import {
  featureFlagInvalidScope,
  featureFlagRetired,
  invalidArgument,
  notFound,
  validateClientPlatform,
  validateFeatureFlagKey,
  validateFeatureFlagName,
  type FeatureFlag,
  type FeatureFlagDecision,
  type FeatureFlagOverride,
  type FeatureFlagStatus,
  type PlatformClientPlatform,
  type RegionInternalId,
} from '../../domain/index.js';
import type { DatabaseExecutor } from '../../../../database/executor.js';
import type {
  FeatureFlagOverrideRepository,
  FeatureFlagRepository,
  RegionRepository,
} from '../ports/platform-repositories.js';

export type PlatformRuntimeContext = Readonly<{
  regionCode?: string | undefined;
  clientPlatform?: PlatformClientPlatform | undefined;
}>;

export type EvaluatePlatformFeatureInput = Readonly<{
  key: string;
  context?: PlatformRuntimeContext | undefined;
}>;

export class FeatureFlagUseCases {
  constructor(
    private readonly flagRepo: FeatureFlagRepository,
    private readonly overrideRepo: FeatureFlagOverrideRepository,
    private readonly regionRepo: RegionRepository,
  ) {}

  async evaluateFeature(
    executor: DatabaseExecutor,
    input: EvaluatePlatformFeatureInput,
  ): Promise<FeatureFlagDecision> {
    const key = validateFeatureFlagKey(input.key);
    const flag = await this.flagRepo.findByKey(executor, key);

    if (!flag) {
      return { key, enabled: false, reason: 'flag_not_found' };
    }

    if (flag.status === 'inactive') {
      return { key, enabled: false, reason: 'flag_inactive' };
    }

    if (flag.status === 'retired') {
      return { key, enabled: false, reason: 'flag_retired' };
    }

    const context = input.context;
    if (!context || (!context.regionCode && !context.clientPlatform)) {
      return { key, enabled: flag.defaultEnabled, reason: 'default_enabled' };
    }

    let regionId: RegionInternalId | null = null;
    if (context.regionCode) {
      const region = await this.regionRepo.findByCode(executor, context.regionCode);
      if (region) {
        regionId = region.id;
      }
    }

    const clientPlatform = context.clientPlatform ? validateClientPlatform(context.clientPlatform) : null;
    const overrides = await this.overrideRepo.findOverridesForFlags(executor, [flag.id]);

    // 1. region + client
    if (regionId !== null && clientPlatform !== null) {
      const match = overrides.find((o) => o.regionId === regionId && o.clientPlatform === clientPlatform);
      if (match) {
        return { key, enabled: match.enabled, reason: 'region_client_override' };
      }
    }

    // 2. region
    if (regionId !== null) {
      const match = overrides.find((o) => o.regionId === regionId && o.clientPlatform === null);
      if (match) {
        return { key, enabled: match.enabled, reason: 'region_override' };
      }
    }

    // 3. client
    if (clientPlatform !== null) {
      const match = overrides.find((o) => o.regionId === null && o.clientPlatform === clientPlatform);
      if (match) {
        return { key, enabled: match.enabled, reason: 'client_override' };
      }
    }

    // 4. default
    return { key, enabled: flag.defaultEnabled, reason: 'default_enabled' };
  }

  async resolveFeatures(
    executor: DatabaseExecutor,
    input: Readonly<{
      keys: readonly string[];
      context?: PlatformRuntimeContext;
    }>,
  ): Promise<readonly FeatureFlagDecision[]> {
    if (input.keys.length === 0) return [];
    if (input.keys.length > 100) {
      throw invalidArgument('Cannot resolve more than 100 feature flag keys at once');
    }

    const validatedKeys = input.keys.map(validateFeatureFlagKey);
    const uniqueKeys = [...new Set(validatedKeys)];

    const flags = await this.flagRepo.findMultipleByKeys(executor, uniqueKeys);
    const flagMap = new Map<string, FeatureFlag>(flags.map((f) => [f.key, f]));

    let regionId: RegionInternalId | null = null;
    if (input.context?.regionCode) {
      const region = await this.regionRepo.findByCode(executor, input.context.regionCode);
      if (region) regionId = region.id;
    }

    const clientPlatform = input.context?.clientPlatform ? validateClientPlatform(input.context.clientPlatform) : null;
    const activeFlags = flags.filter((f) => f.status === 'active');
    const overrides = activeFlags.length > 0
      ? await this.overrideRepo.findOverridesForFlags(executor, activeFlags.map((f) => f.id))
      : [];

    const overrideMap = new Map<bigint, FeatureFlagOverride[]>();
    for (const ov of overrides) {
      const list = overrideMap.get(ov.featureFlagId) ?? [];
      list.push(ov);
      overrideMap.set(ov.featureFlagId, list);
    }

    const decisions = new Map<string, FeatureFlagDecision>();
    for (const key of uniqueKeys) {
      const flag = flagMap.get(key);
      if (!flag) {
        decisions.set(key, { key, enabled: false, reason: 'flag_not_found' });
        continue;
      }
      if (flag.status === 'inactive') {
        decisions.set(key, { key, enabled: false, reason: 'flag_inactive' });
        continue;
      }
      if (flag.status === 'retired') {
        decisions.set(key, { key, enabled: false, reason: 'flag_retired' });
        continue;
      }

      const flagOverrides = overrideMap.get(flag.id) ?? [];
      let decided: FeatureFlagDecision | null = null;

      if (regionId !== null && clientPlatform !== null) {
        const match = flagOverrides.find((o) => o.regionId === regionId && o.clientPlatform === clientPlatform);
        if (match) {
          decided = { key, enabled: match.enabled, reason: 'region_client_override' };
        }
      }
      if (!decided && regionId !== null) {
        const match = flagOverrides.find((o) => o.regionId === regionId && o.clientPlatform === null);
        if (match) {
          decided = { key, enabled: match.enabled, reason: 'region_override' };
        }
      }
      if (!decided && clientPlatform !== null) {
        const match = flagOverrides.find((o) => o.regionId === null && o.clientPlatform === clientPlatform);
        if (match) {
          decided = { key, enabled: match.enabled, reason: 'client_override' };
        }
      }
      if (!decided) {
        decided = { key, enabled: flag.defaultEnabled, reason: 'default_enabled' };
      }
      decisions.set(key, decided);
    }

    return validatedKeys.map((key) => decisions.get(key)!);
  }

  // Management Commands
  async createFeatureFlag(
    executor: DatabaseExecutor,
    input: Readonly<{
      key: string;
      name: string;
      description?: string | null;
      defaultEnabled?: boolean;
    }>,
  ): Promise<FeatureFlag> {
    const key = validateFeatureFlagKey(input.key);
    const name = validateFeatureFlagName(input.name);
    return this.flagRepo.create(executor, {
      key,
      name,
      description: input.description ?? null,
      defaultEnabled: input.defaultEnabled ?? false,
      status: 'active',
    });
  }

  async updateFeatureFlag(
    executor: DatabaseExecutor,
    key: string,
    input: Readonly<{
      name?: string;
      description?: string | null;
      defaultEnabled?: boolean;
      status?: 'active' | 'inactive';
    }>,
  ): Promise<FeatureFlag> {
    const validKey = validateFeatureFlagKey(key);
    const flag = await this.flagRepo.findByKey(executor, validKey, true);
    if (!flag) {
      throw notFound(`Feature flag '${validKey}' not found`);
    }
    if (flag.status === 'retired') {
      throw featureFlagRetired(validKey);
    }

    const name = input.name !== undefined ? validateFeatureFlagName(input.name) : undefined;
    let defaultEnabled = input.defaultEnabled;
    const targetStatus = input.status ?? flag.status;

    if (targetStatus === 'inactive') {
      defaultEnabled = false;
    } else if (targetStatus === 'active' && defaultEnabled === undefined) {
      defaultEnabled = flag.defaultEnabled;
    }

    const updateData: {
      name?: string;
      description?: string | null;
      defaultEnabled?: boolean;
      status?: FeatureFlagStatus;
    } = {};
    if (name !== undefined) updateData.name = name;
    if (input.description !== undefined) updateData.description = input.description;
    if (defaultEnabled !== undefined) updateData.defaultEnabled = defaultEnabled;
    if (targetStatus !== undefined) updateData.status = targetStatus as FeatureFlagStatus;

    return this.flagRepo.update(executor, flag.id, updateData);
  }

  async retireFeatureFlag(executor: DatabaseExecutor, key: string): Promise<FeatureFlag> {
    const validKey = validateFeatureFlagKey(key);
    const flag = await this.flagRepo.findByKey(executor, validKey, true);
    if (!flag) {
      throw notFound(`Feature flag '${validKey}' not found`);
    }
    if (flag.status === 'retired') {
      return flag;
    }

    return this.flagRepo.update(executor, flag.id, {
      defaultEnabled: false,
      status: 'retired',
    });
  }

  async setFeatureFlagOverride(
    executor: DatabaseExecutor,
    input: Readonly<{
      key: string;
      regionCode?: string | null;
      clientPlatform?: PlatformClientPlatform | null;
      enabled: boolean;
    }>,
  ): Promise<FeatureFlagOverride> {
    const key = validateFeatureFlagKey(input.key);
    if (!input.regionCode && !input.clientPlatform) {
      throw featureFlagInvalidScope();
    }

    const flag = await this.flagRepo.findByKey(executor, key, true);
    if (!flag) {
      throw notFound(`Feature flag '${key}' not found`);
    }
    if (flag.status === 'retired') {
      throw featureFlagRetired(key);
    }

    let regionId: RegionInternalId | null = null;
    if (input.regionCode) {
      const region = await this.regionRepo.findByCode(executor, input.regionCode);
      if (!region) {
        throw notFound(`Region '${input.regionCode}' not found`);
      }
      if (region.status === 'retired') {
        throw invalidArgument(`Cannot create override for retired region '${input.regionCode}'`);
      }
      regionId = region.id;
    }

    const clientPlatform = input.clientPlatform ? validateClientPlatform(input.clientPlatform) : null;

    return this.overrideRepo.upsert(executor, {
      featureFlagId: flag.id,
      regionId,
      clientPlatform,
      enabled: input.enabled,
    });
  }

  async removeFeatureFlagOverride(
    executor: DatabaseExecutor,
    input: Readonly<{
      key: string;
      regionCode?: string | null;
      clientPlatform?: PlatformClientPlatform | null;
    }>,
  ): Promise<boolean> {
    const key = validateFeatureFlagKey(input.key);
    if (!input.regionCode && !input.clientPlatform) {
      throw featureFlagInvalidScope();
    }

    const flag = await this.flagRepo.findByKey(executor, key);
    if (!flag) {
      return false;
    }

    let regionId: RegionInternalId | null = null;
    if (input.regionCode) {
      const region = await this.regionRepo.findByCode(executor, input.regionCode);
      if (!region) {
        return false;
      }
      regionId = region.id;
    }

    const clientPlatform = input.clientPlatform ? validateClientPlatform(input.clientPlatform) : null;

    return this.overrideRepo.deleteByScope(executor, flag.id, regionId, clientPlatform);
  }

  async listFeatureFlagsForManagement(
    executor: DatabaseExecutor,
  ): Promise<readonly (FeatureFlag & { overrides: readonly FeatureFlagOverride[] })[]> {
    const flags = await this.flagRepo.listForManagement(executor);
    if (flags.length === 0) return [];

    const overrides = await this.overrideRepo.findOverridesForFlags(
      executor,
      flags.map((f) => f.id),
    );

    const overrideMap = new Map<bigint, FeatureFlagOverride[]>();
    for (const ov of overrides) {
      const list = overrideMap.get(ov.featureFlagId) ?? [];
      list.push(ov);
      overrideMap.set(ov.featureFlagId, list);
    }

    return flags.map((flag) => ({
      ...flag,
      overrides: overrideMap.get(flag.id) ?? [],
    }));
  }
}
