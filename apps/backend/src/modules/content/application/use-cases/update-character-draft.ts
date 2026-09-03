import { z } from 'zod';
import type { ContentRepository } from '../ports/repositories.js';
import type { CharacterRevisionSnapshot } from '../../domain/lao-character-revision.js';
import {
  LaoCharacterClassificationSchema,
  LaoCharacterSubtypeSchema,
} from '../../domain/lao-character.js';

export const UpdateCharacterDraftInputSchema = z.object({
  unicodeChar: z.string().min(1).optional(),
  classification: LaoCharacterClassificationSchema.optional(),
  subtype: LaoCharacterSubtypeSchema.optional(),
  ipaPhonetic: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  lockVersion: z.number().int().default(0),
});
export type UpdateCharacterDraftInput = z.infer<typeof UpdateCharacterDraftInputSchema>;

export class UpdateCharacterDraftUseCase {
  constructor(private readonly repository: ContentRepository) {}

  async execute(
    revisionId: string,
    input: UpdateCharacterDraftInput
  ): Promise<void> {
    const revision = await this.repository.findRevisionById(revisionId);
    if (!revision) {
      throw new Error('Revision not found');
    }

    const patch: Partial<Omit<CharacterRevisionSnapshot, 'audioInputHash'>> = {
      ...(input.unicodeChar !== undefined ? { unicodeChar: input.unicodeChar } : {}),
      ...(input.classification !== undefined ? { classification: input.classification } : {}),
      ...(input.subtype !== undefined ? { subtype: input.subtype } : {}),
      ...(input.ipaPhonetic !== undefined ? { ipaPhonetic: input.ipaPhonetic } : {}),
      ...(input.description !== undefined && input.description !== null ? { description: input.description } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    };

    revision.updateContent(
      patch,
      input.lockVersion
    );

    await this.repository.saveRevision(revision);
  }
}
