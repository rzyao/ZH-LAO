import { isLogicalUuid, parseLogicalUuid, type LogicalUuid } from '../../../ids/uuid.js';
import type { Brand } from './brand.js';

export type AnnouncementPublicId = Brand<LogicalUuid, 'AnnouncementPublicId'>;

type InternalId<Name extends string> = Brand<bigint, Name>;
export type FeatureFlagInternalId = InternalId<'FeatureFlagInternalId'>;
export type FeatureFlagOverrideInternalId = InternalId<'FeatureFlagOverrideInternalId'>;
export type RuntimeConfigInternalId = InternalId<'RuntimeConfigInternalId'>;
export type AppVersionInternalId = InternalId<'AppVersionInternalId'>;
export type AnnouncementInternalId = InternalId<'AnnouncementInternalId'>;
export type RegionInternalId = InternalId<'RegionInternalId'>;
export type MenuInternalId = InternalId<'MenuInternalId'>;

function parseInternalId<Name extends string>(value: unknown): InternalId<Name> {
  if (typeof value !== 'bigint' || value <= 0n) throw new TypeError('Expected a positive internal BIGINT ID');
  return value as InternalId<Name>;
}

export function parseAnnouncementPublicId(value: unknown): AnnouncementPublicId {
  return parseLogicalUuid(value) as AnnouncementPublicId;
}

export function isAnnouncementPublicId(value: unknown): value is AnnouncementPublicId {
  return isLogicalUuid(value);
}

export const parseFeatureFlagInternalId = (value: unknown): FeatureFlagInternalId => parseInternalId<'FeatureFlagInternalId'>(value);
export const parseFeatureFlagOverrideInternalId = (value: unknown): FeatureFlagOverrideInternalId => parseInternalId<'FeatureFlagOverrideInternalId'>(value);
export const parseRuntimeConfigInternalId = (value: unknown): RuntimeConfigInternalId => parseInternalId<'RuntimeConfigInternalId'>(value);
export const parseAppVersionInternalId = (value: unknown): AppVersionInternalId => parseInternalId<'AppVersionInternalId'>(value);
export const parseAnnouncementInternalId = (value: unknown): AnnouncementInternalId => parseInternalId<'AnnouncementInternalId'>(value);
export const parseRegionInternalId = (value: unknown): RegionInternalId => parseInternalId<'RegionInternalId'>(value);
export const parseMenuInternalId = (value: unknown): MenuInternalId => parseInternalId<'MenuInternalId'>(value);
