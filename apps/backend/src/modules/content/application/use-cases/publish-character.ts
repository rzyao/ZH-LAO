import type { ContentRepository } from '../ports/repositories.js';

export class PublishCharacterUseCase {
  constructor(private readonly repository: ContentRepository) {}

  async execute(characterId: string, revisionId: string): Promise<void> {
    const revision = await this.repository.findRevisionById(revisionId);
    if (!revision) {
      throw new Error('Revision not found');
    }

    if (revision.characterId !== characterId) {
      throw new Error('Revision does not belong to the given character');
    }

    const previousPublished = await this.repository.findPublishedRevision(characterId);

    revision.publish();

    await this.repository.publishRevisionAtomic(
      characterId,
      revision,
      previousPublished
    );
  }
}
