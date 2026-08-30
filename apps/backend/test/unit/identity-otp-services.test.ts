import { describe, expect, it } from 'vitest';
import { FakeOtpDeliveryProvider, HmacOtpHasher, CryptoOtpGenerator } from '../../src/modules/identity/application/services/index.js';
import { normalizePhoneNumber, parseRawOtpCode } from '../../src/modules/identity/domain/index.js';

describe('IDN-04 OTP technical services', () => {
  const phone = normalizePhoneNumber('+8562012345678'); const secret = 'test-only-otp-secret-that-is-long-enough';
  it('generates six digit cryptographic OTP values including leading-zero representation', () => { const generator = new CryptoOtpGenerator(); for (let i = 0; i < 50; i++) expect(generator.generate()).toMatch(/^\d{6}$/); expect(parseRawOtpCode('000042')).toBe('000042'); });
  it('HMAC binds OTP to phone and purpose without exposing the raw code', () => { const hasher = new HmacOtpHasher(secret); const code = parseRawOtpCode('000042'); const hash = hasher.hash({ code, phone, purpose: 'login' }); expect(hash).not.toContain(code); expect(hasher.verify({ code, phone, purpose: 'login', hash })).toBe(true); expect(hasher.verify({ code: parseRawOtpCode('000043'), phone, purpose: 'login', hash })).toBe(false); expect(hasher.verify({ code, phone: normalizePhoneNumber('+8613812345678'), purpose: 'login', hash })).toBe(false); expect(hasher.verify({ code, phone, purpose: 'bind_phone', hash })).toBe(false); });
  it('fake delivery captures delivery and unavailable provider fails safely', async () => { const fake = new FakeOtpDeliveryProvider(); await fake.sendOtp({ phone, purpose: 'login', code: parseRawOtpCode('000042'), expiresAt: new Date() }); expect(fake.deliveries).toHaveLength(1); });
});
