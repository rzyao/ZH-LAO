import type { ContentRepository } from '../ports/repositories.js';
import type { AudioRequirementSync } from '../ports/audio-requirement-sync.js';

export class PublishCharacterUseCase {
  constructor(private readonly repository: ContentRepository, private readonly audioRequirementSync: AudioRequirementSync) {}

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
    if (!revision.snapshot.noAudio) await this.audioRequirementSync.syncRequirement({ sourceDomain: 'content', entityType: 'lo_letter', entityId: characterId, revisionId, languageCode: 'lo', audioRole: 'pronunciation' });
  }
}
