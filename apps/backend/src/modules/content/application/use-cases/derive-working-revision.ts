import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { LaoCharacterRevision } from '../../domain/lao-character-revision.js';
import type { ContentRepository } from '../ports/repositories.js';

export class DeriveWorkingRevisionUseCase {
  constructor(private readonly repository: ContentRepository) {}

  async execute(characterId: string, operatorId?: string): Promise<{ revisionId: string }> {
    const character = await this.repository.findCharacterById(characterId);
    if (!character) {
      throw new Error('Character not found');
    }

    const activeWork = await this.repository.findActiveWorkingRevision(characterId);
    if (activeWork) {
      throw new Error(`ACTIVE_WORK_CONFLICT: Revision ${activeWork.id} is already in active status '${activeWork.reviewStatus}'`);
    }

    const published = await this.repository.findPublishedRevision(characterId);
    if (!published) {
      throw new Error('Cannot derive working revision from an unpublished character without existing revision');
    }

    const newRevisionId = randomUUID();
    const now = new Date();

    const newRevision = new LaoCharacterRevision({
      id: newRevisionId,
      characterId,
      revisionNo: published.revisionNo + 1,
      snapshot: { ...published.snapshot },
      reviewStatus: 'draft',
      createdByOperatorId: operatorId ?? null,
      supersedesRevisionId: published.id,
      lockVersion: 0,
      createdAt: now,
      updatedAt: now,
    });

    await this.repository.saveRevision(newRevision);

    return { revisionId: newRevisionId };
  }
}
