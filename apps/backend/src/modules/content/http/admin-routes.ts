import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { CreateCharacterDraftUseCase, type CreateCharacterDraftInput } from '../application/use-cases/create-character-draft.js';
import { DeriveWorkingRevisionUseCase } from '../application/use-cases/derive-working-revision.js';
import { UpdateCharacterDraftUseCase, type UpdateCharacterDraftInput } from '../application/use-cases/update-character-draft.js';
import { SubmitCharacterReviewUseCase } from '../application/use-cases/submit-character-review.js';
import { ReviewCharacterUseCase } from '../application/use-cases/review-character.js';
import { PublishCharacterUseCase } from '../application/use-cases/publish-character.js';
import type { ContentRepository } from '../application/ports/repositories.js';
import type { AudioRequirementSync } from '../application/ports/audio-requirement-sync.js';
import { AppError } from '../../../errors/app-error.js';
import {
  ACTIVE_WORK_CONFLICT,
  ILLEGAL_STATE_TRANSITION,
  INVALID_DATA,
  UNICODE_CONFLICT,
  VALIDATION_ERROR,
} from '../../../errors/business-codes.js';

export interface AdminContentRoutesOptions {
  contentRepository: ContentRepository;
  audioRequirementSync: AudioRequirementSync;
}

export const adminContentRoutes: FastifyPluginAsync<AdminContentRoutesOptions> = async (
  fastify: FastifyInstance,
  options
) => {
  const { contentRepository } = options;

  const createDraftUC = new CreateCharacterDraftUseCase(contentRepository);
  const deriveWorkingUC = new DeriveWorkingRevisionUseCase(contentRepository);
  const updateDraftUC = new UpdateCharacterDraftUseCase(contentRepository);
  const submitReviewUC = new SubmitCharacterReviewUseCase(contentRepository);
  const reviewUC = new ReviewCharacterUseCase(contentRepository);
  const publishUC = new PublishCharacterUseCase(contentRepository, options.audioRequirementSync);

  fastify.post('/letters', async (request, reply) => {
    const body = request.body as CreateCharacterDraftInput;
    try {
      const result = await createDraftUC.execute(body);
      return reply.code(201).send(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('UNICODE_CONFLICT')) {
        throw new AppError({ code: UNICODE_CONFLICT, message, httpStatus: 409, cause: err });
      }
      throw new AppError({ code: VALIDATION_ERROR, message, httpStatus: 400, cause: err });
    }
  });

  fastify.post('/letters/:id/derive-working', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const result = await deriveWorkingUC.execute(id);
      return reply.code(201).send(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('ACTIVE_WORK_CONFLICT')) {
        throw new AppError({ code: ACTIVE_WORK_CONFLICT, message, httpStatus: 409, cause: err });
      }
      throw new AppError({ code: INVALID_DATA, message, httpStatus: 400, cause: err });
    }
  });

  fastify.put('/letters/:id/revisions/:revId', async (request, reply) => {
    const { revId } = request.params as { revId: string };
    const body = request.body as UpdateCharacterDraftInput;
    try {
      await updateDraftUC.execute(revId, body);
      return reply.code(200).send({ success: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new AppError({ code: INVALID_DATA, message, httpStatus: 400, cause: err });
    }
  });

  fastify.post('/letters/:id/revisions/:revId/submit', async (request, reply) => {
    const { revId } = request.params as { revId: string };
    try {
      await submitReviewUC.execute(revId);
      return reply.code(200).send({ success: true, status: 'pending_review' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new AppError({ code: ILLEGAL_STATE_TRANSITION, message, httpStatus: 400, cause: err });
    }
  });

  fastify.post('/letters/:id/revisions/:revId/review', async (request, reply) => {
    const { revId } = request.params as { revId: string };
    const body = request.body as { action: 'approve' | 'reject'; remark?: string };
    try {
      await reviewUC.execute(revId, body.action, 'admin-operator-id', body.remark);
      return reply.code(200).send({ success: true, status: body.action === 'approve' ? 'approved' : 'rejected' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new AppError({ code: ILLEGAL_STATE_TRANSITION, message, httpStatus: 400, cause: err });
    }
  });

  fastify.post('/letters/:id/revisions/:revId/publish', async (request, reply) => {
    const { id, revId } = request.params as { id: string; revId: string };
    try {
      await publishUC.execute(id, revId);
      return reply.code(200).send({ success: true, published_revision_id: revId, status: 'published' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new AppError({ code: ILLEGAL_STATE_TRANSITION, message, httpStatus: 400, cause: err });
    }
  });
};
