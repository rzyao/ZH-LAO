import { z } from 'zod';
import type { ContentRepository } from '../ports/repositories.js';
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

    revision.updateContent(
      {
        unicodeChar: input.unicodeChar,
        classification: input.classification,
        subtype: input.subtype,
        ipaPhonetic: input.ipaPhonetic,
        description: input.description,
        sortOrder: input.sortOrder,
      },
      input.lockVersion
    );

    await this.repository.saveRevision(revision);
  }
}
