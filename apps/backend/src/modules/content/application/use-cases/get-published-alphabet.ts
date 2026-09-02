import type { ContentRepository, PublishedCharacterView } from '../ports/repositories.js';

export class GetPublishedAlphabetUseCase {
  constructor(private readonly repository: ContentRepository) {}

  async execute(classification?: string): Promise<{ items: PublishedCharacterView[]; total: number }> {
    const items = await this.repository.listPublishedCharacters(classification);
    return {
      items,
      total: items.length,
    };
  }
}
