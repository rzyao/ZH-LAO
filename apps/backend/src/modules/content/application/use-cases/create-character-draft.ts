import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import {
  LaoCharacter,
  LaoCharacterClassificationSchema,
  LaoCharacterSubtypeSchema,
} from '../../domain/lao-character.js';
import { LaoCharacterRevision } from '../../domain/lao-character-revision.js';
import { computeAudioInputHash } from '../../domain/audio-role-policy.js';
import type { ContentRepository } from '../ports/repositories.js';

export const CreateCharacterDraftInputSchema = z.object({
  unicodeChar: z.string().min(1),
  classification: LaoCharacterClassificationSchema,
  subtype: LaoCharacterSubtypeSchema,
  ipaPhonetic: z.string(),
  description: z.string().default(''),
  sortOrder: z.number().int().min(0).default(0),
});
export type CreateCharacterDraftInput = z.infer<typeof CreateCharacterDraftInputSchema>;

export class CreateCharacterDraftUseCase {
  constructor(private readonly repository: ContentRepository) {}

  async execute(input: CreateCharacterDraftInput, operatorId?: string): Promise<{ characterId: string; revisionId: string }> {
    const validated = CreateCharacterDraftInputSchema.parse(input);

    const existing = await this.repository.findCharacterByUnicode(validated.unicodeChar);
    if (existing) {
      throw new Error(`UNICODE_CONFLICT: Character '${validated.unicodeChar}' already exists`);
    }

    const characterId = randomUUID();
    const revisionId = randomUUID();
    const now = new Date();
    const noAudio = validated.classification === 'symbol';
    const audioInputHash = computeAudioInputHash(
      validated.unicodeChar,
      noAudio ? '-' : validated.ipaPhonetic
    );

    const character = new LaoCharacter({
      id: characterId,
      unicodeChar: validated.unicodeChar,
      classification: validated.classification,
      subtype: validated.subtype,
      sortOrder: validated.sortOrder,
      noAudio,
      onlineStatus: 'online',
      publishedRevisionId: null,
      workingRevisionId: revisionId,
      createdAt: now,
      updatedAt: now,
    });

    const revision = new LaoCharacterRevision({
      id: revisionId,
      characterId,
      revisionNo: 1,
      snapshot: {
        unicodeChar: validated.unicodeChar,
        classification: validated.classification,
        subtype: validated.subtype,
        ipaPhonetic: noAudio ? '-' : validated.ipaPhonetic,
        description: validated.description,
        sortOrder: validated.sortOrder,
        noAudio,
        audioInputHash,
      },
      reviewStatus: 'draft',
      createdByOperatorId: operatorId ?? null,
      lockVersion: 0,
      createdAt: now,
      updatedAt: now,
    });

    await this.repository.saveCharacterAndRevision(character, revision);

    return { characterId, revisionId };
  }
}
