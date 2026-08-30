import { z } from 'zod';

export const learningLanguageSchema = z.enum(['lo', 'zh']);
export type LearningLanguage = z.infer<typeof learningLanguageSchema>;

export const learningDirectionSchema = z.object({
  nativeLanguage: learningLanguageSchema,
  learningLanguage: learningLanguageSchema
}).refine(
  ({ nativeLanguage, learningLanguage }) => nativeLanguage !== learningLanguage,
  { message: 'Learning direction must use lo and zh exactly once' }
);

export type LearningDirection = z.infer<typeof learningDirectionSchema>;
export const createLearningDirection = (nativeLanguage: unknown, learningLanguage: unknown): LearningDirection => learningDirectionSchema.parse({ nativeLanguage, learningLanguage });
export const isValidLearningDirection = (value: unknown): value is LearningDirection => learningDirectionSchema.safeParse(value).success;
