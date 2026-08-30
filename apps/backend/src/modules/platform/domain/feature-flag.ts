import { invalidArgument } from './errors.js';
import type { FeatureFlagInternalId, FeatureFlagOverrideInternalId, RegionInternalId } from './ids.js';

export type PlatformClientPlatform = 'android' | 'ios';
export type FeatureFlagStatus = 'active' | 'inactive' | 'retired';

export type FeatureFlag = Readonly<{
  id: FeatureFlagInternalId;
  key: string;
  name: string;
  description: string | null;
  defaultEnabled: boolean;
  status: FeatureFlagStatus;
  createdAt: Date;
  updatedAt: Date;
}>;

export type FeatureFlagOverride = Readonly<{
  id: FeatureFlagOverrideInternalId;
  featureFlagId: FeatureFlagInternalId;
  regionId: RegionInternalId | null;
  clientPlatform: PlatformClientPlatform | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}>;

export type FeatureFlagDecisionReason =
  | 'flag_not_found'
  | 'flag_inactive'
  | 'flag_retired'
  | 'region_client_override'
  | 'region_override'
  | 'client_override'
  | 'default_enabled';

export type FeatureFlagDecision = Readonly<{
  key: string;
  enabled: boolean;
  reason: FeatureFlagDecisionReason;
}>;

const KEY_REGEX = /^[a-z][a-z0-9_]{0,99}$/;

export function validateFeatureFlagKey(key: string): string {
  if (typeof key !== 'string' || !KEY_REGEX.test(key)) {
    throw invalidArgument(`Invalid feature flag key '${key}'. Must match ^[a-z][a-z0-9_]{0,99}$`);
  }
  return key;
}

export function validateFeatureFlagName(name: string): string {
  const trimmed = name?.trim();
  if (!trimmed || trimmed.length > 120) {
    throw invalidArgument('Feature flag name cannot be blank and must be <= 120 characters');
  }
  return trimmed;
}

export function isPlatformClientPlatform(value: unknown): value is PlatformClientPlatform {
  return value === 'android' || value === 'ios';
}

export function validateClientPlatform(value: unknown): PlatformClientPlatform {
  if (!isPlatformClientPlatform(value)) {
    throw invalidArgument(`Invalid client platform '${String(value)}'. Allowed values: android, ios`);
  }
  return value;
}
