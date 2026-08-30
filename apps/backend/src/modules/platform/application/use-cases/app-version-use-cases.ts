import {
  appVersionInvalidTransition,
  appVersionMismatch,
  appVersionPolicyUnavailable,
  conflict,
  invalidArgument,
  notFound,
  validateAppVersionStatusPolicy,
  validateBuildNumber,
  validateClientPlatform,
  validateVersionString,
  type AppVersionDecision,
  type AppVersionRecord,
  type AppVersionUpdatePolicy,
  type PlatformClientPlatform,
} from '../../domain/index.js';
import type { DatabaseExecutor } from '../../../../database/executor.js';
import type { AppVersionRepository } from '../ports/platform-repositories.js';

export type CheckPlatformAppVersionInput = Readonly<{
  clientPlatform: PlatformClientPlatform;
  currentVersion: string;
  buildNumber: number;
}>;

export class AppVersionUseCases {
  constructor(private readonly appVersionRepo: AppVersionRepository) {}

  async checkAppVersion(
    executor: DatabaseExecutor,
    input: CheckPlatformAppVersionInput,
  ): Promise<AppVersionDecision> {
    const platform = validateClientPlatform(input.clientPlatform);
    const version = validateVersionString(input.currentVersion);
    const buildNumber = validateBuildNumber(input.buildNumber);

    const versions = await this.appVersionRepo.listByPlatform(executor, platform);
    const exactRecord = versions.find((v) => v.buildNumber === buildNumber);

    if (exactRecord && exactRecord.version !== version) {
      throw appVersionMismatch(exactRecord.version, version, buildNumber);
    }

    const released = versions.filter((v) => v.status !== 'draft' && v.releasedAt && v.releasedAt <= new Date());
    const activeReleased = released.filter((v) => v.status === 'active');
    const supportedReleased = released.filter((v) => v.status === 'active' || v.status === 'deprecated');

    const latestActive = activeReleased.length > 0
      ? activeReleased.reduce((prev, curr) => (curr.buildNumber > prev.buildNumber ? curr : prev))
      : null;

    const minimumSupported = supportedReleased.length > 0
      ? supportedReleased.reduce((prev, curr) => (curr.buildNumber < prev.buildNumber ? curr : prev))
      : null;

    // Unknown build
    if (!exactRecord) {
      if (!latestActive) {
        throw appVersionPolicyUnavailable(platform);
      }
      return {
        clientPlatform: platform,
        currentVersion: version,
        currentBuildNumber: buildNumber,
        knownBuild: false,
        supported: false,
        updateAvailable: latestActive.buildNumber > buildNumber,
        updateRequired: true,
        latestVersion: latestActive.version,
        latestBuildNumber: latestActive.buildNumber,
        minimumSupportedVersion: minimumSupported ? minimumSupported.version : undefined,
        minimumSupportedBuildNumber: minimumSupported ? minimumSupported.buildNumber : undefined,
        latestReleaseNotes: latestActive.releaseNotes ?? undefined,
        reason: 'unknown_build',
      };
    }

    // Draft build
    if (exactRecord.status === 'draft') {
      if (!latestActive) {
        throw appVersionPolicyUnavailable(platform);
      }
      return {
        clientPlatform: platform,
        currentVersion: exactRecord.version,
        currentBuildNumber: exactRecord.buildNumber,
        knownBuild: true,
        supported: false,
        updateAvailable: latestActive.buildNumber > exactRecord.buildNumber,
        updateRequired: true,
        latestVersion: latestActive.version,
        latestBuildNumber: latestActive.buildNumber,
        minimumSupportedVersion: minimumSupported ? minimumSupported.version : undefined,
        minimumSupportedBuildNumber: minimumSupported ? minimumSupported.buildNumber : undefined,
        latestReleaseNotes: latestActive.releaseNotes ?? undefined,
        reason: 'draft_build',
      };
    }

    if (!latestActive) {
      throw appVersionPolicyUnavailable(platform);
    }

    const updateAvailable = latestActive.buildNumber > exactRecord.buildNumber;
    const updateRequired = exactRecord.status === 'blocked' || exactRecord.updatePolicy === 'required';
    const supported = exactRecord.status === 'active' || exactRecord.status === 'deprecated';

    let reason: AppVersionDecision['reason'] = 'current';
    if (exactRecord.status === 'blocked') {
      reason = 'blocked';
    } else if (exactRecord.status === 'deprecated') {
      reason = 'deprecated';
    } else if (updateAvailable) {
      reason = 'newer_version_available';
    }

    return {
      clientPlatform: platform,
      currentVersion: exactRecord.version,
      currentBuildNumber: exactRecord.buildNumber,
      knownBuild: true,
      supported,
      updateAvailable,
      updateRequired,
      currentStatus: exactRecord.status,
      updatePolicy: exactRecord.updatePolicy,
      latestVersion: latestActive.version,
      latestBuildNumber: latestActive.buildNumber,
      minimumSupportedVersion: minimumSupported ? minimumSupported.version : undefined,
      minimumSupportedBuildNumber: minimumSupported ? minimumSupported.buildNumber : undefined,
      latestReleaseNotes: latestActive.releaseNotes ?? undefined,
      reason,
    };
  }

  // Management Commands
  async createAppVersionDraft(
    executor: DatabaseExecutor,
    input: Readonly<{
      clientPlatform: PlatformClientPlatform;
      version: string;
      buildNumber: number;
      releaseNotes?: string | null;
    }>,
  ): Promise<AppVersionRecord> {
    const platform = validateClientPlatform(input.clientPlatform);
    const version = validateVersionString(input.version);
    const buildNumber = validateBuildNumber(input.buildNumber);

    const existing = await this.appVersionRepo.findByPlatformAndBuild(executor, platform, buildNumber);
    if (existing) {
      throw conflict(`App version with build ${buildNumber} already exists for platform '${platform}'`);
    }

    return this.appVersionRepo.create(executor, {
      clientPlatform: platform,
      version,
      buildNumber,
      releaseNotes: input.releaseNotes ?? null,
      status: 'draft',
      updatePolicy: 'none',
      releasedAt: null,
    });
  }

  async updateAppVersionDraft(
    executor: DatabaseExecutor,
    clientPlatform: PlatformClientPlatform,
    buildNumber: number,
    input: Readonly<{
      version?: string;
      releaseNotes?: string | null;
    }>,
  ): Promise<AppVersionRecord> {
    const platform = validateClientPlatform(clientPlatform);
    const build = validateBuildNumber(buildNumber);

    const record = await this.appVersionRepo.findByPlatformAndBuild(executor, platform, build, true);
    if (!record) {
      throw notFound(`App version draft not found for platform '${platform}' build ${build}`);
    }
    if (record.status !== 'draft') {
      throw appVersionInvalidTransition(`Cannot edit non-draft version. Status is '${record.status}'`);
    }

    const version = input.version ? validateVersionString(input.version) : undefined;
    const updateData: { version?: string; releaseNotes?: string | null } = {};
    if (version !== undefined) updateData.version = version;
    if (input.releaseNotes !== undefined) updateData.releaseNotes = input.releaseNotes;

    return this.appVersionRepo.update(executor, record.id, updateData);
  }

  async publishAppVersion(
    executor: DatabaseExecutor,
    clientPlatform: PlatformClientPlatform,
    buildNumber: number,
  ): Promise<AppVersionRecord> {
    const platform = validateClientPlatform(clientPlatform);
    const build = validateBuildNumber(buildNumber);

    await this.appVersionRepo.acquirePlatformAdvisoryLock(executor, platform);

    const record = await this.appVersionRepo.findByPlatformAndBuild(executor, platform, build, true);
    if (!record) {
      throw notFound(`App version not found for platform '${platform}' build ${build}`);
    }
    if (record.status === 'active' && record.releasedAt) {
      return record; // idempotent publish
    }
    if (record.status !== 'draft') {
      throw appVersionInvalidTransition(`Only draft versions can be published. Current status: '${record.status}'`);
    }

    return this.appVersionRepo.update(executor, record.id, {
      status: 'active',
      updatePolicy: 'none',
      releasedAt: new Date(),
    });
  }

  async setAppVersionPolicy(
    executor: DatabaseExecutor,
    clientPlatform: PlatformClientPlatform,
    buildNumber: number,
    input: Readonly<{
      status: 'active' | 'deprecated' | 'blocked';
      updatePolicy: AppVersionUpdatePolicy;
      expectedUpdatedAt?: Date;
    }>,
  ): Promise<AppVersionRecord> {
    const platform = validateClientPlatform(clientPlatform);
    const build = validateBuildNumber(buildNumber);

    validateAppVersionStatusPolicy(input.status, input.updatePolicy);
    await this.appVersionRepo.acquirePlatformAdvisoryLock(executor, platform);

    const record = await this.appVersionRepo.findByPlatformAndBuild(executor, platform, build, true);
    if (!record) {
      throw notFound(`App version not found for platform '${platform}' build ${build}`);
    }
    if (record.status === 'draft') {
      throw appVersionInvalidTransition('Cannot change policy of a draft version. Publish it first.');
    }
    if (record.status === 'blocked') {
      if (input.status !== 'blocked') {
        throw appVersionInvalidTransition('Blocked status is terminal in V1 and cannot be unblocked');
      }
      return record; // idempotent
    }

    if (input.expectedUpdatedAt && record.updatedAt.getTime() !== input.expectedUpdatedAt.getTime()) {
      throw conflict('App version record was modified concurrently');
    }

    // If setting to optional (deprecated/active optional) or required (blocked), ensure higher active released target exists
    if (input.updatePolicy === 'optional' || input.updatePolicy === 'required' || input.status === 'blocked' || input.status === 'deprecated') {
      const all = await this.appVersionRepo.listByPlatform(executor, platform);
      const higherActive = all.filter(
        (v) => v.id !== record.id && v.buildNumber > record.buildNumber && v.status === 'active' && v.releasedAt && v.releasedAt <= new Date(),
      );
      if (higherActive.length === 0) {
        throw invalidArgument(
          `Cannot set status '${input.status}' / policy '${input.updatePolicy}' on build ${build}: no higher active released target exists for platform '${platform}'`,
        );
      }
    }

    return this.appVersionRepo.update(executor, record.id, {
      status: input.status,
      updatePolicy: input.updatePolicy,
    });
  }

  async deleteAppVersionDraft(
    executor: DatabaseExecutor,
    clientPlatform: PlatformClientPlatform,
    buildNumber: number,
  ): Promise<boolean> {
    const platform = validateClientPlatform(clientPlatform);
    const build = validateBuildNumber(buildNumber);

    const record = await this.appVersionRepo.findByPlatformAndBuild(executor, platform, build, true);
    if (!record) {
      return false;
    }
    if (record.status !== 'draft') {
      throw appVersionInvalidTransition(`Cannot delete non-draft version (status: '${record.status}')`);
    }

    return this.appVersionRepo.deleteDraft(executor, record.id);
  }

  async listAppVersionsForManagement(
    executor: DatabaseExecutor,
    clientPlatform?: PlatformClientPlatform,
  ): Promise<readonly AppVersionRecord[]> {
    const platform = clientPlatform ? validateClientPlatform(clientPlatform) : undefined;
    return this.appVersionRepo.listForManagement(executor, platform);
  }
}
