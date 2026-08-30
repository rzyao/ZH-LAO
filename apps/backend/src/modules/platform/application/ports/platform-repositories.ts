import type { DatabaseExecutor } from '../../../../database/executor.js';
import type {
  AnnouncementInternalId,
  AnnouncementPublicId,
  AnnouncementRecord,
  AnnouncementStatus,
  AppVersionInternalId,
  AppVersionRecord,
  AppVersionStatus,
  AppVersionUpdatePolicy,
  FeatureFlag,
  FeatureFlagDecisionReason,
  FeatureFlagInternalId,
  FeatureFlagOverride,
  FeatureFlagStatus,
  PlatformClientPlatform,
  Region,
  RegionInternalId,
  RegionStatus,
  RuntimeConfigRecord,
  RuntimeConfigStatus,
  RuntimeConfigValueType,
} from '../../domain/index.js';

export type FeatureFlagEvaluationRow = Readonly<{
  key: string;
  enabled: boolean;
  reason: FeatureFlagDecisionReason;
}>;

export interface FeatureFlagRepository {
  findByKey(executor: DatabaseExecutor, key: string, forUpdate?: boolean): Promise<FeatureFlag | null>;
  findMultipleByKeys(executor: DatabaseExecutor, keys: readonly string[]): Promise<readonly FeatureFlag[]>;
  create(
    executor: DatabaseExecutor,
    input: Readonly<{
      key: string;
      name: string;
      description: string | null;
      defaultEnabled: boolean;
      status?: FeatureFlagStatus;
    }>,
  ): Promise<FeatureFlag>;
  update(
    executor: DatabaseExecutor,
    id: FeatureFlagInternalId,
    input: Readonly<{
      name?: string;
      description?: string | null;
      defaultEnabled?: boolean;
      status?: FeatureFlagStatus;
    }>,
  ): Promise<FeatureFlag>;
  listForManagement(executor: DatabaseExecutor): Promise<readonly FeatureFlag[]>;
}

export interface FeatureFlagOverrideRepository {
  findOverridesForFlags(
    executor: DatabaseExecutor,
    flagIds: readonly FeatureFlagInternalId[],
  ): Promise<readonly FeatureFlagOverride[]>;
  findSpecificOverride(
    executor: DatabaseExecutor,
    flagId: FeatureFlagInternalId,
    regionId: RegionInternalId | null,
    clientPlatform: PlatformClientPlatform | null,
    forUpdate?: boolean,
  ): Promise<FeatureFlagOverride | null>;
  upsert(
    executor: DatabaseExecutor,
    input: Readonly<{
      featureFlagId: FeatureFlagInternalId;
      regionId: RegionInternalId | null;
      clientPlatform: PlatformClientPlatform | null;
      enabled: boolean;
    }>,
  ): Promise<FeatureFlagOverride>;
  deleteByScope(
    executor: DatabaseExecutor,
    featureFlagId: FeatureFlagInternalId,
    regionId: RegionInternalId | null,
    clientPlatform: PlatformClientPlatform | null,
  ): Promise<boolean>;
  deleteByFlagId(executor: DatabaseExecutor, featureFlagId: FeatureFlagInternalId): Promise<number>;
}

export interface RuntimeConfigRepository {
  findByKey(executor: DatabaseExecutor, key: string, forUpdate?: boolean): Promise<RuntimeConfigRecord | null>;
  findMultipleByKeys(executor: DatabaseExecutor, keys: readonly string[]): Promise<readonly RuntimeConfigRecord[]>;
  upsert(
    executor: DatabaseExecutor,
    input: Readonly<{
      key: string;
      valueType: RuntimeConfigValueType;
      value: unknown;
      description: string | null;
      status?: RuntimeConfigStatus;
    }>,
  ): Promise<RuntimeConfigRecord>;
  retire(executor: DatabaseExecutor, key: string): Promise<RuntimeConfigRecord | null>;
  listForManagement(executor: DatabaseExecutor): Promise<readonly RuntimeConfigRecord[]>;
}

export interface AppVersionRepository {
  findByPlatformAndBuild(
    executor: DatabaseExecutor,
    clientPlatform: PlatformClientPlatform,
    buildNumber: number,
    forUpdate?: boolean,
  ): Promise<AppVersionRecord | null>;
  listByPlatform(
    executor: DatabaseExecutor,
    clientPlatform: PlatformClientPlatform,
  ): Promise<readonly AppVersionRecord[]>;
  create(
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
  ): Promise<AppVersionRecord>;
  update(
    executor: DatabaseExecutor,
    id: AppVersionInternalId,
    input: Readonly<{
      version?: string;
      releaseNotes?: string | null;
      status?: AppVersionStatus;
      updatePolicy?: AppVersionUpdatePolicy;
      releasedAt?: Date | null;
    }>,
  ): Promise<AppVersionRecord>;
  deleteDraft(
    executor: DatabaseExecutor,
    id: AppVersionInternalId,
  ): Promise<boolean>;
  listForManagement(
    executor: DatabaseExecutor,
    clientPlatform?: PlatformClientPlatform,
  ): Promise<readonly AppVersionRecord[]>;
  acquirePlatformAdvisoryLock(executor: DatabaseExecutor, clientPlatform: PlatformClientPlatform): Promise<void>;
}

export interface AnnouncementRepository {
  findByPublicId(
    executor: DatabaseExecutor,
    publicId: AnnouncementPublicId,
    forUpdate?: boolean,
  ): Promise<AnnouncementRecord | null>;
  findActiveAnnouncements(
    executor: DatabaseExecutor,
    context: Readonly<{
      regionId: RegionInternalId | null;
      clientPlatform: PlatformClientPlatform | null;
      now?: Date;
    }>,
  ): Promise<readonly AnnouncementRecord[]>;
  create(
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
  ): Promise<AnnouncementRecord>;
  update(
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
  ): Promise<AnnouncementRecord>;
  deleteDraft(
    executor: DatabaseExecutor,
    id: AnnouncementInternalId,
  ): Promise<boolean>;
  listForManagement(executor: DatabaseExecutor): Promise<readonly AnnouncementRecord[]>;
}

export interface RegionRepository {
  findByCode(executor: DatabaseExecutor, code: string, forUpdate?: boolean): Promise<Region | null>;
  findById(executor: DatabaseExecutor, id: RegionInternalId): Promise<Region | null>;
  listActive(executor: DatabaseExecutor): Promise<readonly Region[]>;
  listForManagement(executor: DatabaseExecutor): Promise<readonly Region[]>;
  create(
    executor: DatabaseExecutor,
    input: Readonly<{
      code: string;
      name: string;
      defaultLocale: string;
      timezone: string;
      status?: RegionStatus;
    }>,
  ): Promise<Region>;
  update(
    executor: DatabaseExecutor,
    id: RegionInternalId,
    input: Readonly<{
      name?: string;
      defaultLocale?: string;
      timezone?: string;
      status?: RegionStatus;
    }>,
  ): Promise<Region>;
}
