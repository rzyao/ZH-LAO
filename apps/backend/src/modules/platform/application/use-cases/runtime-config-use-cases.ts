import {
  conflict,
  invalidArgument,
  notFound,
  runtimeConfigInvalidValue,
  runtimeConfigKeyUnregistered,
  runtimeConfigRetired,
  runtimeConfigUnavailable,
  validateRuntimeConfigKey,
  validateValueMatchesType,
  type RuntimeConfigDefinition,
  type RuntimeConfigRecord,
  type RuntimeConfigValueType,
} from '../../domain/index.js';
import type { DatabaseExecutor } from '../../../../database/executor.js';
import type { RuntimeConfigRepository } from '../ports/platform-repositories.js';

export class RuntimeConfigRegistry {
  private readonly definitions = new Map<string, RuntimeConfigDefinition<unknown>>();

  register<T>(definition: RuntimeConfigDefinition<T>): void {
    validateRuntimeConfigKey(definition.key);
    this.definitions.set(definition.key, definition as RuntimeConfigDefinition<unknown>);
  }

  get<T = unknown>(key: string): RuntimeConfigDefinition<T> | undefined {
    return this.definitions.get(key) as RuntimeConfigDefinition<T> | undefined;
  }

  has(key: string): boolean {
    return this.definitions.has(key);
  }

  list(): readonly RuntimeConfigDefinition<unknown>[] {
    return [...this.definitions.values()];
  }
}

export const platformDefaultLocaleConfig: RuntimeConfigDefinition<string> = {
  key: 'default_locale',
  valueType: 'string',
  visibility: 'server_only',
  owner: 'platform',
  description: 'Default fallback system locale',
  validate: (v: unknown) => {
    if (typeof v !== 'string' || !v.trim()) throw new Error('Must be non-empty string');
    return v.trim();
  },
  fallback: 'zh-CN',
};

export const platformSupportEmailConfig: RuntimeConfigDefinition<string> = {
  key: 'support_email',
  valueType: 'string',
  visibility: 'server_only',
  owner: 'platform',
  description: 'Official support email contact address',
  validate: (v: unknown) => {
    if (typeof v !== 'string' || !v.includes('@')) throw new Error('Must be valid email');
    return v.trim();
  },
  fallback: 'support@zh-lao.com',
};

export const platformMaintenanceNoticeUrlConfig: RuntimeConfigDefinition<string> = {
  key: 'maintenance_notice_url',
  valueType: 'string',
  visibility: 'server_only',
  owner: 'platform',
  description: 'URL for scheduled maintenance page',
  validate: (v: unknown) => {
    if (typeof v !== 'string' || !v.startsWith('http')) throw new Error('Must be valid HTTP URL');
    return v.trim();
  },
};

export function createDefaultRuntimeConfigRegistry(): RuntimeConfigRegistry {
  const registry = new RuntimeConfigRegistry();
  registry.register(platformDefaultLocaleConfig);
  registry.register(platformSupportEmailConfig);
  registry.register(platformMaintenanceNoticeUrlConfig);
  return registry;
}

export class RuntimeConfigUseCases {
  constructor(
    private readonly configRepo: RuntimeConfigRepository,
    private readonly registry: RuntimeConfigRegistry,
  ) {}

  async getRuntimeConfig<T>(
    executor: DatabaseExecutor,
    definitionOrKey: RuntimeConfigDefinition<T> | string,
  ): Promise<T> {
    const key = typeof definitionOrKey === 'string' ? definitionOrKey : definitionOrKey.key;
    const definition = this.registry.get<T>(key);
    if (!definition) {
      throw runtimeConfigKeyUnregistered(key);
    }

    const record = await this.configRepo.findByKey(executor, key);
    if (!record || record.status === 'retired') {
      if (definition.fallback !== undefined) {
        return definition.fallback;
      }
      throw runtimeConfigUnavailable(key);
    }

    if (record.valueType !== definition.valueType) {
      throw runtimeConfigInvalidValue(
        key,
        `Type mismatch: database has '${record.valueType}', registry expects '${definition.valueType}'`,
      );
    }

    try {
      validateValueMatchesType(definition.valueType, record.value);
      return definition.validate(record.value);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw runtimeConfigInvalidValue(key, message);
    }
  }

  async resolveRuntimeConfigs(
    executor: DatabaseExecutor,
    definitionsOrKeys: readonly (RuntimeConfigDefinition<unknown> | string)[],
  ): Promise<Readonly<Record<string, unknown>>> {
    if (definitionsOrKeys.length === 0) return {};
    const keys = definitionsOrKeys.map((item) => (typeof item === 'string' ? item : item.key));
    for (const key of keys) {
      if (!this.registry.has(key)) {
        throw runtimeConfigKeyUnregistered(key);
      }
    }

    const records = await this.configRepo.findMultipleByKeys(executor, keys);
    const recordMap = new Map<string, RuntimeConfigRecord>(records.map((r) => [r.key, r]));

    const result: Record<string, unknown> = {};
    for (const key of keys) {
      const def = this.registry.get(key)!;
      const record = recordMap.get(key);

      if (!record || record.status === 'retired') {
        if (def.fallback !== undefined) {
          result[key] = def.fallback;
          continue;
        }
        throw runtimeConfigUnavailable(key);
      }

      if (record.valueType !== def.valueType) {
        throw runtimeConfigInvalidValue(
          key,
          `Type mismatch: database has '${record.valueType}', registry expects '${def.valueType}'`,
        );
      }

      try {
        validateValueMatchesType(def.valueType, record.value);
        result[key] = def.validate(record.value);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw runtimeConfigInvalidValue(key, message);
      }
    }

    return result;
  }

  // Management Commands
  async setRuntimeConfig(
    executor: DatabaseExecutor,
    input: Readonly<{
      key: string;
      valueType: RuntimeConfigValueType;
      value: unknown;
      description?: string | null;
      expectedUpdatedAt?: Date;
    }>,
  ): Promise<RuntimeConfigRecord> {
    const key = validateRuntimeConfigKey(input.key);
    const def = this.registry.get(key);
    if (!def) {
      throw runtimeConfigKeyUnregistered(key);
    }
    if (def.valueType !== input.valueType) {
      throw invalidArgument(`value_type '${input.valueType}' does not match registered type '${def.valueType}' for key '${key}'`);
    }

    validateValueMatchesType(input.valueType, input.value);
    try {
      def.validate(input.value);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw runtimeConfigInvalidValue(key, msg);
    }

    const existing = await this.configRepo.findByKey(executor, key, true);
    if (existing) {
      if (existing.status === 'retired') {
        throw runtimeConfigRetired(key);
      }
      if (existing.valueType !== input.valueType) {
        throw invalidArgument(`Cannot change value_type of existing config key '${key}'`);
      }
      if (input.expectedUpdatedAt && existing.updatedAt.getTime() !== input.expectedUpdatedAt.getTime()) {
        throw conflict(`Config '${key}' has been updated concurrently`);
      }
    }

    return this.configRepo.upsert(executor, {
      key,
      valueType: input.valueType,
      value: input.value,
      description: input.description ?? existing?.description ?? def.description,
      status: 'active',
    });
  }

  async retireRuntimeConfig(executor: DatabaseExecutor, key: string): Promise<RuntimeConfigRecord> {
    const validKey = validateRuntimeConfigKey(key);
    const def = this.registry.get(validKey);
    if (!def) {
      throw runtimeConfigKeyUnregistered(validKey);
    }

    const record = await this.configRepo.findByKey(executor, validKey, true);
    if (!record) {
      throw notFound(`Runtime config '${validKey}' not found`);
    }
    if (record.status === 'retired') {
      return record;
    }

    const updated = await this.configRepo.retire(executor, validKey);
    return updated!;
  }

  async listRuntimeConfigsForManagement(executor: DatabaseExecutor): Promise<readonly RuntimeConfigRecord[]> {
    return this.configRepo.listForManagement(executor);
  }
}
