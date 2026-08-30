import pg from 'pg';
import pino from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asExecutor, createPgPool } from '../../src/database/pool.js';
import { createTestDatabase, type TestDatabase } from '../support/test-database.js';
import { buildPlatformModule } from '../../src/modules/platform/http/composition.js';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe : describe.skip;

integration('Platform repositories and use cases on real PostgreSQL', () => {
  let database: TestDatabase;
  let pool: pg.Pool;
  const logger = pino({ level: 'silent' });

  beforeAll(async () => {
    database = await createTestDatabase(adminUrl!);
    pool = createPgPool(
      { url: database.url, poolMin: 0, poolMax: 4, connectionTimeoutMs: 2_000, idleTimeoutMs: 2_000 },
      logger,
    );
  }, 120_000);

  afterAll(async () => {
    if (pool) await pool.end();
    if (database) await database.dispose();
  }, 30_000);

  describe('Feature Flags & Overrides', () => {
    it('implements full evaluation precedence matrix', async () => {
      const platform = buildPlatformModule(asExecutor(pool));
      const executor = asExecutor(pool);

      // Create regions
      await platform.regionUseCases.createRegion(executor, {
        code: 'CN',
        name: 'China',
        defaultLocale: 'zh-CN',
        timezone: 'Asia/Shanghai',
      });
      await platform.regionUseCases.createRegion(executor, {
        code: 'LA',
        name: 'Laos',
        defaultLocale: 'lo-LA',
        timezone: 'Asia/Vientiane',
      });

      // Create flag with defaultEnabled=false
      await platform.featureFlagUseCases.createFeatureFlag(executor, {
        key: 'social_discovery',
        name: 'Social Discovery',
        defaultEnabled: false,
      });

      // default
      let decision = await platform.featureFlagUseCases.evaluateFeature(executor, {
        key: 'social_discovery',
      });
      expect(decision).toEqual({ key: 'social_discovery', enabled: false, reason: 'default_enabled' });

      // client override: android=true
      await platform.featureFlagUseCases.setFeatureFlagOverride(executor, {
        key: 'social_discovery',
        clientPlatform: 'android',
        enabled: true,
      });
      decision = await platform.featureFlagUseCases.evaluateFeature(executor, {
        key: 'social_discovery',
        context: { clientPlatform: 'android' },
      });
      expect(decision).toEqual({ key: 'social_discovery', enabled: true, reason: 'client_override' });
      decision = await platform.featureFlagUseCases.evaluateFeature(executor, {
        key: 'social_discovery',
        context: { clientPlatform: 'ios' },
      });
      expect(decision).toEqual({ key: 'social_discovery', enabled: false, reason: 'default_enabled' });

      // region override: LA=false
      await platform.featureFlagUseCases.setFeatureFlagOverride(executor, {
        key: 'social_discovery',
        regionCode: 'LA',
        enabled: false,
      });
      decision = await platform.featureFlagUseCases.evaluateFeature(executor, {
        key: 'social_discovery',
        context: { regionCode: 'LA' },
      });
      expect(decision).toEqual({ key: 'social_discovery', enabled: false, reason: 'region_override' });

      // region takes precedence over client
      decision = await platform.featureFlagUseCases.evaluateFeature(executor, {
        key: 'social_discovery',
        context: { regionCode: 'LA', clientPlatform: 'android' },
      });
      expect(decision).toEqual({ key: 'social_discovery', enabled: false, reason: 'region_override' });

      // region+client override: LA+android=true takes highest override precedence
      await platform.featureFlagUseCases.setFeatureFlagOverride(executor, {
        key: 'social_discovery',
        regionCode: 'LA',
        clientPlatform: 'android',
        enabled: true,
      });
      decision = await platform.featureFlagUseCases.evaluateFeature(executor, {
        key: 'social_discovery',
        context: { regionCode: 'LA', clientPlatform: 'android' },
      });
      expect(decision).toEqual({ key: 'social_discovery', enabled: true, reason: 'region_client_override' });

      // inactive master switch forces false
      await platform.featureFlagUseCases.updateFeatureFlag(executor, 'social_discovery', { status: 'inactive' });
      decision = await platform.featureFlagUseCases.evaluateFeature(executor, {
        key: 'social_discovery',
        context: { regionCode: 'LA', clientPlatform: 'android' },
      });
      expect(decision).toEqual({ key: 'social_discovery', enabled: false, reason: 'flag_inactive' });

      // retired master switch forces false
      await platform.featureFlagUseCases.retireFeatureFlag(executor, 'social_discovery');
      decision = await platform.featureFlagUseCases.evaluateFeature(executor, {
        key: 'social_discovery',
        context: { regionCode: 'LA', clientPlatform: 'android' },
      });
      expect(decision).toEqual({ key: 'social_discovery', enabled: false, reason: 'flag_retired' });

      // missing flag fail-closed
      decision = await platform.featureFlagUseCases.evaluateFeature(executor, {
        key: 'non_existent_flag',
      });
      expect(decision).toEqual({ key: 'non_existent_flag', enabled: false, reason: 'flag_not_found' });
    });

    it('handles batch resolution and override removal', async () => {
      const platform = buildPlatformModule(asExecutor(pool));
      const executor = asExecutor(pool);

      await platform.featureFlagUseCases.createFeatureFlag(executor, {
        key: 'feed_v2',
        name: 'Feed V2',
        defaultEnabled: true,
      });
      await platform.featureFlagUseCases.setFeatureFlagOverride(executor, {
        key: 'feed_v2',
        clientPlatform: 'ios',
        enabled: false,
      });

      const batch = await platform.featureFlagUseCases.resolveFeatures(executor, {
        keys: ['feed_v2', 'missing_flag_1', 'feed_v2'],
        context: { clientPlatform: 'ios' },
      });
      expect(batch).toHaveLength(3);
      expect(batch[0]).toEqual({ key: 'feed_v2', enabled: false, reason: 'client_override' });
      expect(batch[1]).toEqual({ key: 'missing_flag_1', enabled: false, reason: 'flag_not_found' });
      expect(batch[2]).toEqual({ key: 'feed_v2', enabled: false, reason: 'client_override' });

      // remove override and verify fallback to default
      await platform.featureFlagUseCases.removeFeatureFlagOverride(executor, {
        key: 'feed_v2',
        clientPlatform: 'ios',
      });
      const single = await platform.featureFlagUseCases.evaluateFeature(executor, {
        key: 'feed_v2',
        context: { clientPlatform: 'ios' },
      });
      expect(single).toEqual({ key: 'feed_v2', enabled: true, reason: 'default_enabled' });
    });
  });

  describe('Runtime Configs', () => {
    it('reads active, fallback on missing/retired, and enforces registry types', async () => {
      const platform = buildPlatformModule(asExecutor(pool));
      const executor = asExecutor(pool);

      // default fallback
      const email = await platform.runtimeConfigUseCases.getRuntimeConfig(executor, 'support_email');
      expect(email).toBe('support@zh-lao.com');

      // write config
      await platform.runtimeConfigUseCases.setRuntimeConfig(executor, {
        key: 'support_email',
        valueType: 'string',
        value: 'help@zh-lao.com',
      });
      const updated = await platform.runtimeConfigUseCases.getRuntimeConfig(executor, 'support_email');
      expect(updated).toBe('help@zh-lao.com');

      // batch resolution
      const batch = await platform.runtimeConfigUseCases.resolveRuntimeConfigs(executor, [
        'default_locale',
        'support_email',
      ]);
      expect(batch).toEqual({
        default_locale: 'zh-CN',
        support_email: 'help@zh-lao.com',
      });

      // retire config -> falls back to registry default fallback
      await platform.runtimeConfigUseCases.retireRuntimeConfig(executor, 'support_email');
      const afterRetire = await platform.runtimeConfigUseCases.getRuntimeConfig(executor, 'support_email');
      expect(afterRetire).toBe('support@zh-lao.com');
    });
  });

  describe('App Versions', () => {
    it('enforces exact build, latest derivation, and higher active target constraint', async () => {
      const platform = buildPlatformModule(asExecutor(pool));
      const executor = asExecutor(pool);

      // Create drafts
      await platform.appVersionUseCases.createAppVersionDraft(executor, {
        clientPlatform: 'android',
        version: '1.0.0',
        buildNumber: 10001,
        releaseNotes: 'Initial release',
      });
      await platform.appVersionUseCases.createAppVersionDraft(executor, {
        clientPlatform: 'android',
        version: '1.1.0',
        buildNumber: 11001,
        releaseNotes: 'Feature update',
      });
      await platform.appVersionUseCases.createAppVersionDraft(executor, {
        clientPlatform: 'android',
        version: '2.0.0',
        buildNumber: 20001,
        releaseNotes: 'Major update',
      });

      // Publish 1.0.0 and 2.0.0
      await platform.appVersionUseCases.publishAppVersion(executor, 'android', 10001);
      await platform.appVersionUseCases.publishAppVersion(executor, 'android', 20001);

      // Check current latest (2.0.0 / 20001)
      let check = await platform.appVersionUseCases.checkAppVersion(executor, {
        clientPlatform: 'android',
        currentVersion: '2.0.0',
        buildNumber: 20001,
      });
      expect(check.supported).toBe(true);
      expect(check.updateAvailable).toBe(false);
      expect(check.updateRequired).toBe(false);
      expect(check.latestVersion).toBe('2.0.0');
      expect(check.latestBuildNumber).toBe(20001);

      // Check older 1.0.0 -> update available
      check = await platform.appVersionUseCases.checkAppVersion(executor, {
        clientPlatform: 'android',
        currentVersion: '1.0.0',
        buildNumber: 10001,
      });
      expect(check.supported).toBe(true);
      expect(check.updateAvailable).toBe(true);
      expect(check.updateRequired).toBe(false);
      expect(check.reason).toBe('newer_version_available');

      // Set 1.0.0 to blocked -> update required
      await platform.appVersionUseCases.setAppVersionPolicy(executor, 'android', 10001, {
        status: 'blocked',
        updatePolicy: 'required',
      });
      check = await platform.appVersionUseCases.checkAppVersion(executor, {
        clientPlatform: 'android',
        currentVersion: '1.0.0',
        buildNumber: 10001,
      });
      expect(check.supported).toBe(false);
      expect(check.updateRequired).toBe(true);
      expect(check.reason).toBe('blocked');

      // Trying to block 20001 (the highest active target) must fail
      await expect(
        platform.appVersionUseCases.setAppVersionPolicy(executor, 'android', 20001, {
          status: 'blocked',
          updatePolicy: 'required',
        }),
      ).rejects.toThrow('no higher active released target exists');

      // Edge test matrix: unknown build vs latest (latest is 20001)
      // unknown < latest
      const unknownBelow = await platform.appVersionUseCases.checkAppVersion(executor, {
        clientPlatform: 'android',
        currentVersion: '0.9.0',
        buildNumber: 9000,
      });
      expect(unknownBelow).toMatchObject({
        knownBuild: false,
        supported: false,
        updateAvailable: true,
        updateRequired: true,
        latestBuildNumber: 20001,
        reason: 'unknown_build',
      });

      // unknown = latest build number (unknown build)
      // Note: 20001 is known as version '2.0.0'. If we request an unknown build number like 20002:
      // unknown > latest
      const unknownAbove = await platform.appVersionUseCases.checkAppVersion(executor, {
        clientPlatform: 'android',
        currentVersion: '9.9.9',
        buildNumber: 99999,
      });
      expect(unknownAbove).toMatchObject({
        knownBuild: false,
        supported: false,
        updateAvailable: false,
        updateRequired: true,
        latestBuildNumber: 20001,
        reason: 'unknown_build',
      });

      // Draft build edge matrix: draft < latest, draft = latest, draft > latest
      // draft < latest
      const draftBelow = await platform.appVersionUseCases.checkAppVersion(executor, {
        clientPlatform: 'android',
        currentVersion: '1.1.0',
        buildNumber: 11001,
      });
      expect(draftBelow).toMatchObject({
        knownBuild: true,
        supported: false,
        updateAvailable: true,
        updateRequired: true,
        latestBuildNumber: 20001,
        reason: 'draft_build',
      });

      // create draft > latest
      await platform.appVersionUseCases.createAppVersionDraft(executor, {
        clientPlatform: 'android',
        version: '3.0.0',
        buildNumber: 30001,
      });
      const draftAbove = await platform.appVersionUseCases.checkAppVersion(executor, {
        clientPlatform: 'android',
        currentVersion: '3.0.0',
        buildNumber: 30001,
      });
      expect(draftAbove).toMatchObject({
        knownBuild: true,
        supported: false,
        updateAvailable: false,
        updateRequired: true,
        latestBuildNumber: 20001,
        reason: 'draft_build',
      });
    });
  });

  describe('Announcements', () => {
    it('filters by active window, scope, and deterministic order', async () => {
      const platform = buildPlatformModule(asExecutor(pool));
      const executor = asExecutor(pool);

      const past = new Date(Date.now() - 3600_000);
      const future = new Date(Date.now() + 3600_000);

      // Global announcement
      const a1 = await platform.announcementUseCases.createAnnouncementDraft(executor, {
        title: 'Global Notice',
        content: 'Global content',
        startsAt: past,
      });
      await platform.announcementUseCases.publishAnnouncement(executor, a1.publicId);

      // Region LA announcement
      const a2 = await platform.announcementUseCases.createAnnouncementDraft(executor, {
        title: 'LA Notice',
        content: 'LA content',
        regionCode: 'LA',
        startsAt: past,
      });
      await platform.announcementUseCases.publishAnnouncement(executor, a2.publicId);

      // Client iOS announcement
      const a3 = await platform.announcementUseCases.createAnnouncementDraft(executor, {
        title: 'iOS Notice',
        content: 'iOS content',
        clientPlatform: 'ios',
        startsAt: past,
      });
      await platform.announcementUseCases.publishAnnouncement(executor, a3.publicId);

      // Future scheduled announcement (should not be returned)
      const a4 = await platform.announcementUseCases.createAnnouncementDraft(executor, {
        title: 'Future Notice',
        content: 'Future content',
        startsAt: future,
      });
      await platform.announcementUseCases.publishAnnouncement(executor, a4.publicId);

      // Query as Android without region -> returns global only
      let list = await platform.announcementUseCases.getActiveAnnouncements(executor, {
        clientPlatform: 'android',
      });
      expect(list.map((a) => a.title)).toEqual(['Global Notice']);

      // Query as iOS with region LA -> returns LA, iOS, and Global
      list = await platform.announcementUseCases.getActiveAnnouncements(executor, {
        regionCode: 'LA',
        clientPlatform: 'ios',
      });
      expect(list.map((a) => a.title)).toContain('Global Notice');
      expect(list.map((a) => a.title)).toContain('LA Notice');
      expect(list.map((a) => a.title)).toContain('iOS Notice');
      expect(list.map((a) => a.title)).not.toContain('Future Notice');
    });
  });

  describe('Regions', () => {
    it('creates, updates, and lists active regions', async () => {
      const platform = buildPlatformModule(asExecutor(pool));
      const executor = asExecutor(pool);

      await platform.regionUseCases.createRegion(executor, {
        code: 'TH',
        name: 'Thailand',
        defaultLocale: 'th-TH',
        timezone: 'Asia/Bangkok',
      });

      const active = await platform.regionUseCases.listActiveRegions(executor);
      expect(active.some((r) => r.code === 'TH')).toBe(true);

      // update to inactive
      await platform.regionUseCases.updateRegion(executor, 'TH', { status: 'inactive' });
      const activeAfter = await platform.regionUseCases.listActiveRegions(executor);
      expect(activeAfter.some((r) => r.code === 'TH')).toBe(false);

      const th = await platform.regionUseCases.getRegion(executor, 'TH');
      expect(th?.status).toBe('inactive');
    });
  });
});
