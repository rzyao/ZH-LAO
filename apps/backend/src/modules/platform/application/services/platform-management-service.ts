import type { DatabaseExecutor } from '../../../../database/executor.js';
import type { TransactionManager } from '../../../../database/transaction-manager.js';
import type {
  AnnouncementRecord,
  AppVersionRecord,
  AppVersionUpdatePolicy,
  FeatureFlag,
  FeatureFlagOverride,
  MenuInternalId,
  MenuItem,
  MenuTreeNode,
  PlatformClientPlatform,
  Region,
  RuntimeConfigRecord,
  RuntimeConfigValueType,
} from '../../domain/index.js';
import type {
  AnnouncementUseCases,
  AppVersionUseCases,
  FeatureFlagUseCases,
  MenuCreateInput,
  MenuReorderInput,
  MenuUpdateInput,
  MenuUseCases,
  RegionUseCases,
  RuntimeConfigUseCases,
} from '../use-cases/index.js';

export class PlatformManagementService {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly featureFlagUseCases: FeatureFlagUseCases,
    private readonly runtimeConfigUseCases: RuntimeConfigUseCases,
    private readonly appVersionUseCases: AppVersionUseCases,
    private readonly announcementUseCases: AnnouncementUseCases,
    private readonly regionUseCases: RegionUseCases,
    private readonly menuUseCases: MenuUseCases,
  ) {}

  // Feature Flags
  async createFeatureFlag(input: Readonly<{
    key: string;
    name: string;
    description?: string | null;
    defaultEnabled?: boolean;
  }>): Promise<FeatureFlag> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.featureFlagUseCases.createFeatureFlag(tx, input);
    });
  }

  async updateFeatureFlag(
    key: string,
    input: Readonly<{
      name?: string;
      description?: string | null;
      defaultEnabled?: boolean;
      status?: 'active' | 'inactive';
    }>,
  ): Promise<FeatureFlag> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.featureFlagUseCases.updateFeatureFlag(tx, key, input);
    });
  }

  async retireFeatureFlag(key: string): Promise<FeatureFlag> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.featureFlagUseCases.retireFeatureFlag(tx, key);
    });
  }

  async setFeatureFlagOverride(input: Readonly<{
    key: string;
    regionCode?: string | null;
    clientPlatform?: PlatformClientPlatform | null;
    enabled: boolean;
  }>): Promise<FeatureFlagOverride> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.featureFlagUseCases.setFeatureFlagOverride(tx, input);
    });
  }

  async removeFeatureFlagOverride(input: Readonly<{
    key: string;
    regionCode?: string | null;
    clientPlatform?: PlatformClientPlatform | null;
  }>): Promise<boolean> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.featureFlagUseCases.removeFeatureFlagOverride(tx, input);
    });
  }

  // Runtime Config
  async setRuntimeConfig(input: Readonly<{
    key: string;
    valueType: RuntimeConfigValueType;
    value: unknown;
    description?: string | null;
    expectedUpdatedAt?: Date;
  }>): Promise<RuntimeConfigRecord> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.runtimeConfigUseCases.setRuntimeConfig(tx, input);
    });
  }

  async retireRuntimeConfig(key: string): Promise<RuntimeConfigRecord> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.runtimeConfigUseCases.retireRuntimeConfig(tx, key);
    });
  }

  // App Versions
  async createAppVersionDraft(input: Readonly<{
    clientPlatform: PlatformClientPlatform;
    version: string;
    buildNumber: number;
    releaseNotes?: string | null;
  }>): Promise<AppVersionRecord> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.appVersionUseCases.createAppVersionDraft(tx, input);
    });
  }

  async updateAppVersionDraft(
    clientPlatform: PlatformClientPlatform,
    buildNumber: number,
    input: Readonly<{
      version?: string;
      releaseNotes?: string | null;
    }>,
  ): Promise<AppVersionRecord> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.appVersionUseCases.updateAppVersionDraft(tx, clientPlatform, buildNumber, input);
    });
  }

  async publishAppVersion(
    clientPlatform: PlatformClientPlatform,
    buildNumber: number,
  ): Promise<AppVersionRecord> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.appVersionUseCases.publishAppVersion(tx, clientPlatform, buildNumber);
    });
  }

  async setAppVersionPolicy(
    clientPlatform: PlatformClientPlatform,
    buildNumber: number,
    input: Readonly<{
      status: 'active' | 'deprecated' | 'blocked';
      updatePolicy: AppVersionUpdatePolicy;
      expectedUpdatedAt?: Date;
    }>,
  ): Promise<AppVersionRecord> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.appVersionUseCases.setAppVersionPolicy(tx, clientPlatform, buildNumber, input);
    });
  }

  async deleteAppVersionDraft(
    clientPlatform: PlatformClientPlatform,
    buildNumber: number,
  ): Promise<boolean> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.appVersionUseCases.deleteAppVersionDraft(tx, clientPlatform, buildNumber);
    });
  }

  // Announcements
  async createAnnouncementDraft(input: Readonly<{
    title: string;
    content: string;
    regionCode?: string | null;
    clientPlatform?: PlatformClientPlatform | null;
    startsAt?: Date | null;
    endsAt?: Date | null;
  }>): Promise<AnnouncementRecord> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.announcementUseCases.createAnnouncementDraft(tx, input);
    });
  }

  async updateAnnouncement(
    publicIdString: string,
    input: Readonly<{
      title?: string;
      content?: string;
      regionCode?: string | null;
      clientPlatform?: PlatformClientPlatform | null;
      startsAt?: Date | null;
      endsAt?: Date | null;
    }>,
  ): Promise<AnnouncementRecord> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.announcementUseCases.updateAnnouncement(tx, publicIdString, input);
    });
  }

  async publishAnnouncement(publicIdString: string): Promise<AnnouncementRecord> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.announcementUseCases.publishAnnouncement(tx, publicIdString);
    });
  }

  async retireAnnouncement(publicIdString: string): Promise<AnnouncementRecord> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.announcementUseCases.retireAnnouncement(tx, publicIdString);
    });
  }

  async deleteAnnouncementDraft(publicIdString: string): Promise<boolean> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.announcementUseCases.deleteAnnouncementDraft(tx, publicIdString);
    });
  }

  // Regions
  async createRegion(input: Readonly<{
    code: string;
    name: string;
    defaultLocale: string;
    timezone: string;
  }>): Promise<Region> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.regionUseCases.createRegion(tx, input);
    });
  }

  async updateRegion(
    code: string,
    input: Readonly<{
      name?: string;
      defaultLocale?: string;
      timezone?: string;
      status?: 'active' | 'inactive';
    }>,
  ): Promise<Region> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.regionUseCases.updateRegion(tx, code, input);
    });
  }

  async retireRegion(code: string): Promise<Region> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.regionUseCases.retireRegion(tx, code);
    });
  }

  // Menu (ADR-022)
  async listMenus(): Promise<readonly MenuTreeNode[]> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.menuUseCases.listTree(tx);
    });
  }

  async createMenu(input: MenuCreateInput): Promise<MenuItem> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.menuUseCases.create(tx, input);
    });
  }

  async updateMenu(id: MenuInternalId, input: MenuUpdateInput): Promise<MenuItem> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.menuUseCases.update(tx, id, input);
    });
  }

  async removeMenu(id: MenuInternalId, expectedUpdatedAt?: Date): Promise<MenuItem> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.menuUseCases.remove(tx, id, expectedUpdatedAt);
    });
  }

  async reorderMenus(parentId: MenuInternalId | null, input: MenuReorderInput): Promise<readonly MenuInternalId[]> {
    return this.transactionManager.run(async (tx: DatabaseExecutor) => {
      return this.menuUseCases.reorder(tx, parentId, input);
    });
  }
}
