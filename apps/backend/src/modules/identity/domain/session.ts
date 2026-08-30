import { z } from 'zod';
import type { Brand } from './brand.js';

export const sessionStatusSchema = z.enum(['active', 'revoked', 'expired']);
export type SessionStatus = z.infer<typeof sessionStatusSchema>;
export const parseSessionStatus = (value: unknown): SessionStatus => sessionStatusSchema.parse(value);

export type RawAccessToken = Brand<string, 'RawAccessToken'>;
export type RawRefreshToken = Brand<string, 'RawRefreshToken'>;
export type RefreshTokenHash = Brand<string, 'RefreshTokenHash'>;

const secretSchema = z.string().min(1);

export const parseRawAccessToken = (value: unknown): RawAccessToken => secretSchema.parse(value) as RawAccessToken;
export const parseRawRefreshToken = (value: unknown): RawRefreshToken => secretSchema.parse(value) as RawRefreshToken;
export const parseRefreshTokenHash = (value: unknown): RefreshTokenHash => secretSchema.parse(value) as RefreshTokenHash;
