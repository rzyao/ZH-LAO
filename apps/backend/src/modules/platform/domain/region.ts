import { invalidArgument, regionInvalid } from './errors.js';
import type { RegionInternalId } from './ids.js';

export type RegionStatus = 'active' | 'inactive' | 'retired';

export type Region = Readonly<{
  id: RegionInternalId;
  code: string;
  name: string;
  defaultLocale: string;
  timezone: string;
  status: RegionStatus;
  createdAt: Date;
  updatedAt: Date;
}>;

const REGION_CODE_REGEX = /^[A-Z][A-Z0-9_]{1,7}$/;

export function validateRegionCode(code: string): string {
  if (typeof code !== 'string' || !REGION_CODE_REGEX.test(code)) {
    throw invalidArgument(`Invalid region code '${code}'. Must match ^[A-Z][A-Z0-9_]{1,7}$`);
  }
  return code;
}

export function validateRegionName(name: string): string {
  const trimmed = name?.trim();
  if (!trimmed || trimmed.length > 100) {
    throw invalidArgument('Region name cannot be blank and must be <= 100 characters');
  }
  return trimmed;
}

export function validateLocale(locale: string): string {
  const trimmed = locale?.trim();
  if (!trimmed || trimmed.length > 16) {
    throw regionInvalid('Region default_locale cannot be blank and must be <= 16 characters');
  }
  try {
    const canonical = Intl.getCanonicalLocales(trimmed);
    if (!canonical.length) {
      throw new Error();
    }
  } catch {
    throw regionInvalid(`Invalid BCP 47 language tag: '${trimmed}'`);
  }
  return trimmed;
}

export function validateTimezone(timezone: string): string {
  const trimmed = timezone?.trim();
  if (!trimmed || trimmed.length > 64) {
    throw regionInvalid('Region timezone cannot be blank and must be <= 64 characters');
  }
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: trimmed });
  } catch {
    throw regionInvalid(`Invalid IANA timezone: '${trimmed}'`);
  }
  return trimmed;
}
