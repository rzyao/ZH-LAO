import type { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';
import { CreateCharacterDraftUseCase, type CreateCharacterDraftInput } from '../application/use-cases/create-character-draft.js';
import { DeriveWorkingRevisionUseCase } from '../application/use-cases/derive-working-revision.js';
import { UpdateCharacterDraftUseCase, type UpdateCharacterDraftInput } from '../application/use-cases/update-character-draft.js';
import { SubmitCharacterReviewUseCase } from '../application/use-cases/submit-character-review.js';
import { ReviewCharacterUseCase } from '../application/use-cases/review-character.js';
import { PublishCharacterUseCase } from '../application/use-cases/publish-character.js';
import type { ContentRepository } from '../application/ports/repositories.js';
import { AppError } from '../../../errors/app-error.js';
import {
  ACTIVE_WORK_CONFLICT,
  ILLEGAL_STATE_TRANSITION,
  INVALID_DATA,
  UNICODE_CONFLICT,
  VALIDATION_ERROR,
} from '../../../errors/business-codes.js';
import { requireAuthentication } from '../../../auth/auth-hook.js';
import type { AuthenticationProvider } from '../../../auth/authentication-provider.js';
import type { OperationsAuditRecorder, OperationsAuthorizer } from '../../operations/public/index.js';

export interface AdminContentRoutesOptions {
  contentRepository: ContentRepository;
  authentication: AuthenticationProvider;
  authorizer: OperationsAuthorizer;
  audit: OperationsAuditRecorder;
}

export const adminContentRoutes: FastifyPluginAsync<AdminContentRoutesOptions> = async (
  fastify: FastifyInstance,
  options
) => {
  const { contentRepository, authentication, authorizer, audit } = options;

  const createDraftUC = new CreateCharacterDraftUseCase(contentRepository);
  const deriveWorkingUC = new DeriveWorkingRevisionUseCase(contentRepository);
  const updateDraftUC = new UpdateCharacterDraftUseCase(contentRepository);
  const submitReviewUC = new SubmitCharacterReviewUseCase(contentRepository);
  const reviewUC = new ReviewCharacterUseCase(contentRepository);
  const publishUC = new PublishCharacterUseCase(contentRepository);
  const authenticated = requireAuthentication(authentication);
  const actor = (request: FastifyRequest, permission: 'content.letters.write' | 'content.letters.review' | 'content.letters.publish') => authorizer.requirePermission(request.authContext!, permission);
  const requestContext = (request: FastifyRequest) => ({ requestId: request.id, ipAddress: request.ip });
  const record = (request: FastifyRequest, operator: Awaited<ReturnType<typeof actor>>, actionKey: string, id: string | undefined, details: Record<string, unknown>) => audit.recordSuccessfulAction({ operator, actionKey, target: { domain: 'content', type: 'letter', id }, requestContext: requestContext(request), details });

  fastify.post('/letters', { preHandler: authenticated }, async (request, reply) => {
    const body = request.body as CreateCharacterDraftInput;
    try {
      const operator = await actor(request, 'content.letters.write');
      const result = await createDraftUC.execute(body, operator.operatorId);
      await record(request, operator, 'content.letters.create', result.characterId, { command: 'create_draft', revision_id: result.revisionId });
      return reply.code(201).send(result);
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('UNICODE_CONFLICT')) {
        throw new AppError({ code: UNICODE_CONFLICT, message, httpStatus: 409, cause: err });
      }
      throw new AppError({ code: VALIDATION_ERROR, message, httpStatus: 400, cause: err });
    }
  });

  fastify.post('/letters/:id/derive-working', { preHandler: authenticated }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const operator = await actor(request, 'content.letters.write');
      const result = await deriveWorkingUC.execute(id, operator.operatorId);
      await record(request, operator, 'content.letters.derive_working', id, { command: 'derive_working', revision_id: result.revisionId });
      return reply.code(201).send(result);
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('ACTIVE_WORK_CONFLICT')) {
        throw new AppError({ code: ACTIVE_WORK_CONFLICT, message, httpStatus: 409, cause: err });
      }
      throw new AppError({ code: INVALID_DATA, message, httpStatus: 400, cause: err });
    }
  });

  fastify.put('/letters/:id/revisions/:revId', { preHandler: authenticated }, async (request, reply) => {
    const { id, revId } = request.params as { id: string; revId: string };
    const body = request.body as UpdateCharacterDraftInput;
    try {
      const operator = await actor(request, 'content.letters.write');
      await updateDraftUC.execute(revId, body);
      await record(request, operator, 'content.letters.update', id, { command: 'update_draft', revision_id: revId });
      return reply.code(200).send({ success: true });
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      throw new AppError({ code: INVALID_DATA, message, httpStatus: 400, cause: err });
    }
  });

  fastify.post('/letters/:id/revisions/:revId/submit', { preHandler: authenticated }, async (request, reply) => {
    const { id, revId } = request.params as { id: string; revId: string };
    try {
      const operator = await actor(request, 'content.letters.write');
      await submitReviewUC.execute(revId);
      await record(request, operator, 'content.letters.submit_review', id, { command: 'submit_review', revision_id: revId });
      return reply.code(200).send({ success: true, status: 'pending_review' });
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      throw new AppError({ code: ILLEGAL_STATE_TRANSITION, message, httpStatus: 400, cause: err });
    }
  });

  fastify.post('/letters/:id/revisions/:revId/review', { preHandler: authenticated }, async (request, reply) => {
    const { id, revId } = request.params as { id: string; revId: string };
    const body = request.body as { action: 'approve' | 'reject'; remark?: string };
    try {
      const operator = await actor(request, 'content.letters.review');
      await reviewUC.execute(revId, body.action, operator.operatorId, body.remark);
      await record(request, operator, 'content.letters.review', id, { command: 'review', revision_id: revId, action: body.action });
      return reply.code(200).send({ success: true, status: body.action === 'approve' ? 'approved' : 'rejected' });
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      throw new AppError({ code: ILLEGAL_STATE_TRANSITION, message, httpStatus: 400, cause: err });
    }
  });

  fastify.post('/letters/:id/revisions/:revId/publish', { preHandler: authenticated }, async (request, reply) => {
    const { id, revId } = request.params as { id: string; revId: string };
    try {
      const operator = await actor(request, 'content.letters.publish');
      await publishUC.execute(id, revId);
      await record(request, operator, 'content.letters.publish', id, { command: 'publish', revision_id: revId });
      return reply.code(200).send({ success: true, published_revision_id: revId, status: 'published' });
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      throw new AppError({ code: ILLEGAL_STATE_TRANSITION, message, httpStatus: 400, cause: err });
    }
  });
};
