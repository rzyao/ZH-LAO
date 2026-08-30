import { describe, expect, it } from 'vitest';
import {
  parseAnnouncementInternalId,
  parseAnnouncementPublicId,
  parseAppVersionInternalId,
  parseFeatureFlagInternalId,
  parseRegionInternalId,
  parseRuntimeConfigInternalId,
  validateAnnouncementContent,
  validateAnnouncementTimeWindow,
  validateAnnouncementTitle,
  validateAppVersionStatusPolicy,
  validateBuildNumber,
  validateClientPlatform,
  validateFeatureFlagKey,
  validateFeatureFlagName,
  validateLocale,
  validateRegionCode,
  validateRegionName,
  validateRuntimeConfigKey,
  validateTimezone,
  validateValueMatchesType,
  validateVersionString,
} from '../../src/modules/platform/domain/index.js';
import { newLogicalUuid } from '../../src/ids/uuid.js';

describe('Platform domain types and validation', () => {
  it('validates internal IDs and public UUIDs', () => {
    expect(parseFeatureFlagInternalId(1n)).toBe(1n);
    expect(parseRegionInternalId(2n)).toBe(2n);
    expect(parseRuntimeConfigInternalId(3n)).toBe(3n);
    expect(parseAppVersionInternalId(4n)).toBe(4n);
    expect(parseAnnouncementInternalId(5n)).toBe(5n);

    expect(() => parseFeatureFlagInternalId(0n)).toThrow('positive internal BIGINT ID');
    expect(() => parseFeatureFlagInternalId(-1n)).toThrow('positive internal BIGINT ID');
    expect(() => parseFeatureFlagInternalId('123')).toThrow('positive internal BIGINT ID');

    const uuid = newLogicalUuid();
    expect(parseAnnouncementPublicId(uuid)).toBe(uuid);
    expect(() => parseAnnouncementPublicId('invalid-uuid')).toThrow();
  });

  it('validates feature flag keys and names', () => {
    expect(validateFeatureFlagKey('social_discovery')).toBe('social_discovery');
    expect(validateFeatureFlagKey('a')).toBe('a');
    expect(() => validateFeatureFlagKey('123_invalid')).toThrow();
    expect(() => validateFeatureFlagKey('social-discovery')).toThrow();
    expect(() => validateFeatureFlagKey('SocialDiscovery')).toThrow();

    expect(validateFeatureFlagName('Social Discovery')).toBe('Social Discovery');
    expect(() => validateFeatureFlagName('')).toThrow();
    expect(() => validateFeatureFlagName('   ')).toThrow();
  });

  it('validates client platforms', () => {
    expect(validateClientPlatform('android')).toBe('android');
    expect(validateClientPlatform('ios')).toBe('ios');
    expect(() => validateClientPlatform('web')).toThrow();
    expect(() => validateClientPlatform('desktop')).toThrow();
  });

  it('validates region codes, locales, and timezones', () => {
    expect(validateRegionCode('CN')).toBe('CN');
    expect(validateRegionCode('LA')).toBe('LA');
    expect(validateRegionCode('US_CA')).toBe('US_CA');
    expect(() => validateRegionCode('cn')).toThrow();
    expect(() => validateRegionCode('A')).toThrow();

    expect(validateRegionName('Laos')).toBe('Laos');
    expect(() => validateRegionName('')).toThrow();

    expect(validateLocale('zh-CN')).toBe('zh-CN');
    expect(validateLocale('lo-LA')).toBe('lo-LA');
    expect(() => validateLocale('invalid_locale_xyz_123')).toThrow();

    expect(validateTimezone('Asia/Vientiane')).toBe('Asia/Vientiane');
    expect(validateTimezone('Asia/Shanghai')).toBe('Asia/Shanghai');
    expect(() => validateTimezone('Invalid/Timezone')).toThrow();
  });

  it('validates runtime config keys and value types', () => {
    expect(validateRuntimeConfigKey('default_locale')).toBe('default_locale');
    expect(() => validateRuntimeConfigKey('default.locale')).toThrow();

    expect(() => validateValueMatchesType('string', 'hello')).not.toThrow();
    expect(() => validateValueMatchesType('string', 123)).toThrow();

    expect(() => validateValueMatchesType('integer', 42)).not.toThrow();
    expect(() => validateValueMatchesType('integer', 42.5)).toThrow();
    expect(() => validateValueMatchesType('integer', '42')).toThrow();

    expect(() => validateValueMatchesType('number', 3.14)).not.toThrow();
    expect(() => validateValueMatchesType('number', NaN)).toThrow();

    expect(() => validateValueMatchesType('boolean', true)).not.toThrow();
    expect(() => validateValueMatchesType('boolean', 'true')).toThrow();

    expect(() => validateValueMatchesType('json', { a: 1 })).not.toThrow();
    expect(() => validateValueMatchesType('json', [1, 2, 3])).not.toThrow();
    expect(() => validateValueMatchesType('json', 'string')).toThrow();
  });

  it('validates app version version strings, build numbers, and status policies', () => {
    expect(validateVersionString('2.3.0')).toBe('2.3.0');
    expect(() => validateVersionString('')).toThrow();

    expect(validateBuildNumber(23001)).toBe(23001);
    expect(() => validateBuildNumber(0)).toThrow();
    expect(() => validateBuildNumber(-10)).toThrow();
    expect(() => validateBuildNumber('23001')).toThrow();

    expect(() => validateAppVersionStatusPolicy('draft', 'none')).not.toThrow();
    expect(() => validateAppVersionStatusPolicy('active', 'none')).not.toThrow();
    expect(() => validateAppVersionStatusPolicy('active', 'optional')).not.toThrow();
    expect(() => validateAppVersionStatusPolicy('deprecated', 'optional')).not.toThrow();
    expect(() => validateAppVersionStatusPolicy('blocked', 'required')).not.toThrow();

    expect(() => validateAppVersionStatusPolicy('draft', 'required')).toThrow();
    expect(() => validateAppVersionStatusPolicy('deprecated', 'none')).toThrow();
    expect(() => validateAppVersionStatusPolicy('blocked', 'optional')).toThrow();
  });

  it('validates announcements', () => {
    expect(validateAnnouncementTitle('Service maintenance')).toBe('Service maintenance');
    expect(() => validateAnnouncementTitle('')).toThrow();

    expect(validateAnnouncementContent('Notice details...')).toBe('Notice details...');
    expect(() => validateAnnouncementContent('')).toThrow();

    const start = new Date('2026-09-01T00:00:00Z');
    const end = new Date('2026-09-02T00:00:00Z');
    expect(() => validateAnnouncementTimeWindow(start, end)).not.toThrow();
    expect(() => validateAnnouncementTimeWindow(start, null)).not.toThrow();
    expect(() => validateAnnouncementTimeWindow(end, start)).toThrow();
  });
});
