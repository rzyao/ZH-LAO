import { describe, expect, it } from 'vitest';
import { defaultOtpPolicy } from '../../../src/modules/identity/application/use-cases/request-phone-otp.js';

describe('US1 OTP limits and policy specification', () => {
  it('enforces 60-second resend cooldown and 5-minute TTL', () => {
    expect(defaultOtpPolicy.resendCooldownMs).toBe(60_000);
    expect(defaultOtpPolicy.ttlMs).toBe(300_000);
  });

  it('enforces 5 attempts maximum before locking', () => {
    expect(defaultOtpPolicy.maxAttempts).toBe(5);
  });

  it('enforces 5 requests per 30 minutes and 10 per 24 hours per phone', () => {
    expect(defaultOtpPolicy.phoneWindowLimit).toBe(5);
    expect(defaultOtpPolicy.phoneWindowMs).toBe(1_800_000);
    expect(defaultOtpPolicy.phoneDailyLimit).toBe(10);
    expect(defaultOtpPolicy.phoneDailyMs).toBe(86_400_000);
  });

  it('enforces 20 requests per 30 minutes per IP', () => {
    expect(defaultOtpPolicy.ipLimit).toBe(20);
    expect(defaultOtpPolicy.ipWindowMs).toBe(1_800_000);
  });
});
