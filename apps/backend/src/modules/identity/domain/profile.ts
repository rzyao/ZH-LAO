import { z } from 'zod';

export const identityGenderSchema = z.enum(['male', 'female', 'other', 'unspecified']);
export type IdentityGender = z.infer<typeof identityGenderSchema>;
export const parseIdentityGender = (value: unknown): IdentityGender => identityGenderSchema.parse(value);
