import { invalidArgument } from './errors.js';
import type { PlatformClientPlatform } from './feature-flag.js';
import type { AppVersionInternalId } from './ids.js';

export type AppVersionStatus = 'draft' | 'active' | 'deprecated' | 'blocked';
export type AppVersionUpdatePolicy = 'none' | 'optional' | 'required';

export type AppVersionRecord = Readonly<{
  id: AppVersionInternalId;
  clientPlatform: PlatformClientPlatform;
  version: string;
  buildNumber: number;
  status: AppVersionStatus;
  updatePolicy: AppVersionUpdatePolicy;
  releaseNotes: string | null;
  releasedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}>;

export type AppVersionDecisionReason =
  | 'current'
  | 'newer_version_available'
  | 'deprecated'
  | 'blocked'
  | 'unknown_build'
  | 'draft_build';

export type AppVersionDecision = Readonly<{
  clientPlatform: PlatformClientPlatform;
  currentVersion: string;
  currentBuildNumber: number;
  knownBuild: boolean;
  supported: boolean;
  updateAvailable: boolean;
  updateRequired: boolean;
  currentStatus?: 'active' | 'deprecated' | 'blocked' | undefined;
  updatePolicy?: 'none' | 'optional' | 'required' | undefined;
  latestVersion: string;
  latestBuildNumber: number;
  minimumSupportedVersion?: string | undefined;
  minimumSupportedBuildNumber?: number | undefined;
  latestReleaseNotes?: string | undefined;
  reason: AppVersionDecisionReason;
}>;

export function validateVersionString(version: string): string {
  const trimmed = version?.trim();
  if (!trimmed || trimmed.length > 32) {
    throw invalidArgument('Version string cannot be blank and must be <= 32 characters');
  }
  return trimmed;
}

export function validateBuildNumber(buildNumber: unknown): number {
  if (typeof buildNumber !== 'number' || !Number.isInteger(buildNumber) || buildNumber <= 0) {
    throw invalidArgument('Build number must be a positive integer');
  }
  return buildNumber;
}

export function validateAppVersionStatusPolicy(status: AppVersionStatus, policy: AppVersionUpdatePolicy): void {
  const valid =
    (status === 'draft' && policy === 'none') ||
    (status === 'active' && (policy === 'none' || policy === 'optional')) ||
    (status === 'deprecated' && policy === 'optional') ||
    (status === 'blocked' && policy === 'required');

  if (!valid) {
    throw invalidArgument(`Invalid status/policy combination: status '${status}' cannot have update_policy '${policy}'`);
  }
}
