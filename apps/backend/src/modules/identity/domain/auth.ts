import { parsePhoneNumberWithError } from 'libphonenumber-js/min';
import { z } from 'zod';
import { AppError } from '../../../errors/app-error.js';
import type { Brand } from './brand.js';

export const identityAuthProviderSchema = z.enum(['phone', 'facebook']);
export type IdentityAuthProvider = z.infer<typeof identityAuthProviderSchema>;
export const parseIdentityAuthProvider = (value: unknown): IdentityAuthProvider => identityAuthProviderSchema.parse(value);

export type E164PhoneNumber = Brand<string, 'E164PhoneNumber'>;

function invalidPhoneNumber(): never {
  throw new AppError({ code: 'INVALID_PHONE', message: 'Phone number must be a valid E.164 number', httpStatus: 400 });
}

export function normalizePhoneNumber(value: unknown): E164PhoneNumber {
  if (typeof value !== 'string' || value.trim().length === 0) return invalidPhoneNumber();
  try {
    const phone = parsePhoneNumberWithError(value.trim(), { extract: false });
    if (!phone.isValid()) return invalidPhoneNumber();
    return phone.number as E164PhoneNumber;
  } catch {
    return invalidPhoneNumber();
  }
}

export const hasSamePhoneNumber = (left: E164PhoneNumber, right: E164PhoneNumber): boolean => left === right;
