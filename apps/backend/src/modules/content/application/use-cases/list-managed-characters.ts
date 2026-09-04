import type { ContentRepository, ManagedCharacterView } from '../ports/repositories.js';

export class ListManagedCharactersUseCase {
  constructor(private readonly repository: ContentRepository) {}

  async execute(classification?: string): Promise<{ items: ManagedCharacterView[]; total: number }> {
    const items = await this.repository.listManagedCharacters(classification);
    return { items, total: items.length };
  }
}
