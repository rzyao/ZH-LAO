import { invalidArgument } from './errors.js';
import type { RuntimeConfigInternalId } from './ids.js';

export type RuntimeConfigValueType = 'string' | 'integer' | 'number' | 'boolean' | 'json';
export type RuntimeConfigStatus = 'active' | 'retired';
export type RuntimeConfigVisibility = 'server_only' | 'client_public';

export type RuntimeConfigRecord = Readonly<{
  id: RuntimeConfigInternalId;
  key: string;
  valueType: RuntimeConfigValueType;
  value: unknown;
  description: string | null;
  status: RuntimeConfigStatus;
  createdAt: Date;
  updatedAt: Date;
}>;

export type RuntimeConfigDefinition<T = unknown> = Readonly<{
  key: string;
  valueType: RuntimeConfigValueType;
  visibility: RuntimeConfigVisibility;
  owner: 'platform';
  description: string;
  validate: (value: unknown) => T;
  fallback?: T;
}>;

const KEY_REGEX = /^[a-z][a-z0-9_]{0,99}$/;

export function validateRuntimeConfigKey(key: string): string {
  if (typeof key !== 'string' || !KEY_REGEX.test(key)) {
    throw invalidArgument(`Invalid runtime config key '${key}'. Must match ^[a-z][a-z0-9_]{0,99}$`);
  }
  return key;
}

export function validateValueMatchesType(valueType: RuntimeConfigValueType, value: unknown): void {
  if (value === null || value === undefined) {
    throw invalidArgument(`Runtime config value cannot be null or undefined for type '${valueType}'`);
  }
  switch (valueType) {
    case 'string':
      if (typeof value !== 'string') throw invalidArgument(`Expected string value, got ${typeof value}`);
      break;
    case 'integer':
      if (typeof value !== 'number' || !Number.isInteger(value)) {
        throw invalidArgument(`Expected integer value, got ${typeof value}`);
      }
      break;
    case 'number':
      if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
        throw invalidArgument(`Expected finite number value, got ${typeof value}`);
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') throw invalidArgument(`Expected boolean value, got ${typeof value}`);
      break;
    case 'json':
      if (typeof value !== 'object') {
        throw invalidArgument('Expected object or array for json value_type');
      }
      break;
  }
}
