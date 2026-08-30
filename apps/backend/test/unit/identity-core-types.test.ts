import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  createLearningDirection,
  hasSamePhoneNumber,
  isInstallationId,
  isUserPublicId,
  normalizePhoneNumber,
  parseAuthIdentityInternalId,
  parseDeviceInternalId,
  parseIdentityAccountStatus,
  parseIdentityAuthProvider,
  parseIdentityGender,
  parseInstallationId,
  parseOtpChallengeStatus,
  parseOtpPurpose,
  parseRawOtpCode,
  parseRawRefreshToken,
  parseRefreshTokenHash,
  parseSessionInternalId,
  parseSessionStatus,
  parseUserInternalId,
  parseUserPublicId,
  parseDevicePlatform
} from '../../src/modules/identity/domain/index.js';
import type { RawRefreshToken, RefreshTokenHash } from '../../src/modules/identity/domain/index.js';
import * as identityPublic from '../../src/modules/identity/public/index.js';

describe('Identity Core Types', () => {
  it('validates public UUID primitives and keeps internal BIGINT IDs separate', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    expect(parseUserPublicId(uuid)).toBe(uuid);
    expect(isUserPublicId(uuid)).toBe(true);
    expect(() => parseUserPublicId('not-a-uuid')).toThrow();
    expect(parseInstallationId(uuid)).toBe(uuid);
    expect(isInstallationId(uuid)).toBe(true);
    expect(() => parseInstallationId(1n)).toThrow();
    expect(parseUserInternalId(1n)).toBe(1n);
    expect(parseAuthIdentityInternalId(2n)).toBe(2n);
    expect(parseDeviceInternalId(3n)).toBe(3n);
    expect(parseSessionInternalId(4n)).toBe(4n);
    expect(() => parseUserInternalId(0n)).toThrow();
  });

  it('matches frozen account, provider, profile, OTP, Session, and Device enums', () => {
    expect(['active', 'disabled', 'closed'].map(parseIdentityAccountStatus)).toEqual(['active', 'disabled', 'closed']);
    expect(() => parseIdentityAccountStatus('suspended')).toThrow();
    expect(['phone', 'facebook'].map(parseIdentityAuthProvider)).toEqual(['phone', 'facebook']);
    expect(() => parseIdentityAuthProvider('google')).toThrow();
    expect(['male', 'female', 'other', 'unspecified'].map(parseIdentityGender)).toEqual(['male', 'female', 'other', 'unspecified']);
    expect(() => parseIdentityGender(null)).toThrow();
    expect(['login', 'bind_phone', 'change_phone'].map(parseOtpPurpose)).toEqual(['login', 'bind_phone', 'change_phone']);
    expect(() => parseOtpPurpose('register')).toThrow();
    expect(['pending', 'verified', 'expired', 'cancelled', 'locked'].map(parseOtpChallengeStatus)).toEqual(['pending', 'verified', 'expired', 'cancelled', 'locked']);
    expect(['active', 'revoked', 'expired'].map(parseSessionStatus)).toEqual(['active', 'revoked', 'expired']);
    expect(['android', 'ios'].map(parseDevicePlatform)).toEqual(['android', 'ios']);
    expect(() => parseDevicePlatform('web')).toThrow();
  });

  it('normalizes valid Laos and China E.164 phone numbers and rejects invalid input', () => {
    const laos = normalizePhoneNumber('+856 20 5555 1234');
    const china = normalizePhoneNumber('+86 138 1234 5678');
    expect(laos).toBe('+8562055551234');
    expect(china).toBe('+8613812345678');
    expect(hasSamePhoneNumber(laos, normalizePhoneNumber('+8562055551234'))).toBe(true);
    expect(() => normalizePhoneNumber('02055551234')).toThrow(/Phone number/);
    expect(() => normalizePhoneNumber('+856 20 1')).toThrow(/Phone number/);
  });

  it('enforces the two frozen learning directions', () => {
    expect(createLearningDirection('lo', 'zh')).toEqual({ nativeLanguage: 'lo', learningLanguage: 'zh' });
    expect(createLearningDirection('zh', 'lo')).toEqual({ nativeLanguage: 'zh', learningLanguage: 'lo' });
    expect(() => createLearningDirection('lo', 'lo')).toThrow();
    expect(() => createLearningDirection('zh', 'zh')).toThrow();
    expect(() => createLearningDirection('en', 'zh')).toThrow();
  });

  it('keeps raw secrets and persisted hashes as distinct parsed boundaries', () => {
    expectTypeOf<RawRefreshToken>().not.toEqualTypeOf<RefreshTokenHash>();
    expect(parseRawOtpCode('123456')).toBe('123456');
    expect(() => parseRawOtpCode('12345')).toThrow();
    expect(parseRawRefreshToken('raw-refresh-token')).toBe('raw-refresh-token');
    expect(parseRefreshTokenHash('stored-token-hash')).toBe('stored-token-hash');
  });

  it('exports only public Identity primitives from the public boundary', () => {
    expect(Object.keys(identityPublic).sort()).toEqual(['IdentityPublicQuery', 'identityAccountStatusSchema', 'isUserPublicId', 'parseIdentityAccountStatus', 'parseUserPublicId']);
  });
});
