export class SubmitCharacterReviewUseCase {
  constructor(private readonly repository: import('../ports/repositories.js').ContentRepository) {}

  async execute(revisionId: string): Promise<void> {
    const revision = await this.repository.findRevisionById(revisionId);
    if (!revision) {
      throw new Error('Revision not found');
    }

    revision.submitForReview();
    await this.repository.saveRevision(revision);
  }
}
