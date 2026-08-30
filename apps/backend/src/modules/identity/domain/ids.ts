import { isLogicalUuid, parseLogicalUuid, type LogicalUuid } from '../../../ids/uuid.js';
import type { Brand } from './brand.js';

export type UserPublicId = Brand<LogicalUuid, 'UserPublicId'>;
export type InstallationId = Brand<LogicalUuid, 'InstallationId'>;
export type AvatarMediaId = LogicalUuid;

type InternalId<Name extends string> = Brand<bigint, Name>;
export type UserInternalId = InternalId<'UserInternalId'>;
export type AuthIdentityInternalId = InternalId<'AuthIdentityInternalId'>;
export type OtpChallengeInternalId = InternalId<'OtpChallengeInternalId'>;
export type DeviceInternalId = InternalId<'DeviceInternalId'>;
export type SessionInternalId = InternalId<'SessionInternalId'>;

function parseInternalId<Name extends string>(value: unknown): InternalId<Name> {
  if (typeof value !== 'bigint' || value <= 0n) throw new TypeError('Expected a positive internal BIGINT ID');
  return value as InternalId<Name>;
}

export function parseUserPublicId(value: unknown): UserPublicId {
  return parseLogicalUuid(value) as UserPublicId;
}

export function isUserPublicId(value: unknown): value is UserPublicId {
  return isLogicalUuid(value);
}

export function parseInstallationId(value: unknown): InstallationId {
  return parseLogicalUuid(value) as InstallationId;
}

export function isInstallationId(value: unknown): value is InstallationId {
  return isLogicalUuid(value);
}

export const parseUserInternalId = (value: unknown): UserInternalId => parseInternalId<'UserInternalId'>(value);
export const parseAuthIdentityInternalId = (value: unknown): AuthIdentityInternalId => parseInternalId<'AuthIdentityInternalId'>(value);
export const parseOtpChallengeInternalId = (value: unknown): OtpChallengeInternalId => parseInternalId<'OtpChallengeInternalId'>(value);
export const parseDeviceInternalId = (value: unknown): DeviceInternalId => parseInternalId<'DeviceInternalId'>(value);
export const parseSessionInternalId = (value: unknown): SessionInternalId => parseInternalId<'SessionInternalId'>(value);
