import { z } from 'zod';

export const identityAccountStatusSchema = z.enum(['active', 'disabled', 'closed']);
export type IdentityAccountStatus = z.infer<typeof identityAccountStatusSchema>;

export const parseIdentityAccountStatus = (value: unknown): IdentityAccountStatus => identityAccountStatusSchema.parse(value);
