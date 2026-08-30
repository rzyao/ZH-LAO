import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { AppError } from '../../../../errors/app-error.js';
import type { E164PhoneNumber, OtpCodeHash, OtpPurpose, RawOtpCode } from '../../domain/index.js';

export interface OtpGenerator { generate(): RawOtpCode }
export class CryptoOtpGenerator implements OtpGenerator { generate(): RawOtpCode { return randomInt(0, 1_000_000).toString().padStart(6, '0') as RawOtpCode; } }
export interface OtpHasher { hash(input: { code: RawOtpCode; phone: E164PhoneNumber; purpose: OtpPurpose }): OtpCodeHash; verify(input: { code: RawOtpCode; phone: E164PhoneNumber; purpose: OtpPurpose; hash: OtpCodeHash }): boolean }
export class HmacOtpHasher implements OtpHasher {
  constructor(private readonly secret: string) { if (secret.length < 32) throw new AppError({ code: 'OTP_SECRET_INVALID', message: 'OTP service is unavailable', httpStatus: 500, expose: false }); }
  hash(input: { code: RawOtpCode; phone: E164PhoneNumber; purpose: OtpPurpose }): OtpCodeHash { return createHmac('sha256', this.secret).update(`${input.phone}\u0000${input.purpose}\u0000${input.code}`).digest('base64url') as OtpCodeHash; }
  verify(input: { code: RawOtpCode; phone: E164PhoneNumber; purpose: OtpPurpose; hash: OtpCodeHash }): boolean { const expected = Buffer.from(this.hash(input)); const received = Buffer.from(input.hash); return expected.length === received.length && timingSafeEqual(expected, received); }
}
export type OtpDelivery = Readonly<{ phone: E164PhoneNumber; purpose: OtpPurpose; code: RawOtpCode; expiresAt: Date }>;
export interface OtpDeliveryProvider { sendOtp(delivery: OtpDelivery): Promise<void> }
export class FakeOtpDeliveryProvider implements OtpDeliveryProvider { readonly deliveries: OtpDelivery[] = []; async sendOtp(delivery: OtpDelivery): Promise<void> { this.deliveries.push(delivery); } }
export class UnavailableOtpDeliveryProvider implements OtpDeliveryProvider { async sendOtp(): Promise<void> { throw new AppError({ code: 'PROVIDER_UNAVAILABLE', message: 'OTP delivery is unavailable', httpStatus: 503 }); } }
