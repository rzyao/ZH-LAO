import { z } from 'zod';
import type { Brand } from './brand.js';

export const otpPurposeSchema = z.enum(['login', 'bind_phone', 'change_phone']);
export type OtpPurpose = z.infer<typeof otpPurposeSchema>;
export const parseOtpPurpose = (value: unknown): OtpPurpose => otpPurposeSchema.parse(value);

export const otpChallengeStatusSchema = z.enum(['pending', 'verified', 'expired', 'cancelled', 'locked']);
export type OtpChallengeStatus = z.infer<typeof otpChallengeStatusSchema>;
export const parseOtpChallengeStatus = (value: unknown): OtpChallengeStatus => otpChallengeStatusSchema.parse(value);

export type RawOtpCode = Brand<string, 'RawOtpCode'>;
export type OtpCodeHash = Brand<string, 'OtpCodeHash'>;

const rawOtpCodeSchema = z.string().regex(/^\d{6}$/);
const otpCodeHashSchema = z.string().min(1);

export const parseRawOtpCode = (value: unknown): RawOtpCode => rawOtpCodeSchema.parse(value) as RawOtpCode;
export const parseOtpCodeHash = (value: unknown): OtpCodeHash => otpCodeHashSchema.parse(value) as OtpCodeHash;
