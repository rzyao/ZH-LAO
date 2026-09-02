import type { ContentRepository } from '../ports/repositories.js';

export class ReviewCharacterUseCase {
  constructor(private readonly repository: ContentRepository) {}

  async execute(
    revisionId: string,
    action: 'approve' | 'reject',
    reviewerId: string,
    remark?: string
  ): Promise<void> {
    const revision = await this.repository.findRevisionById(revisionId);
    if (!revision) {
      throw new Error('Revision not found');
    }

    if (action === 'approve') {
      revision.approve(reviewerId);
    } else {
      revision.reject(reviewerId, remark ?? 'Rejected by reviewer');
    }

    await this.repository.saveRevision(revision);
  }
}
