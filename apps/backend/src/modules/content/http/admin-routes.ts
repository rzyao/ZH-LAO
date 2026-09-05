import type { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';
import { CreateCharacterDraftUseCase, type CreateCharacterDraftInput } from '../application/use-cases/create-character-draft.js';
import { DeriveWorkingRevisionUseCase } from '../application/use-cases/derive-working-revision.js';
import { UpdateCharacterDraftUseCase, type UpdateCharacterDraftInput } from '../application/use-cases/update-character-draft.js';
import { SubmitCharacterReviewUseCase } from '../application/use-cases/submit-character-review.js';
import { ReviewCharacterUseCase } from '../application/use-cases/review-character.js';
import { PublishCharacterUseCase } from '../application/use-cases/publish-character.js';
import { ListManagedCharactersUseCase } from '../application/use-cases/list-managed-characters.js';
import type { ContentRepository } from '../application/ports/repositories.js';
import type { CurriculumRepository } from '../application/ports/curriculum-repository.js';
import { CreateCourseDraftUseCase, CreateLessonDraftUseCase, DeriveCourseWorkingUseCase, DeriveLessonWorkingUseCase, PublishCourseRevisionUseCase, PublishLessonRevisionUseCase, ReplaceCourseStructureUseCase, ReplaceLessonStructureUseCase, ReviewCourseRevisionUseCase, ReviewLessonRevisionUseCase, SubmitCourseRevisionUseCase, SubmitLessonRevisionUseCase } from '../application/use-cases/publish-course-revision.js';
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
import type { OperationsAuditRecorder, OperationsAuthorizer, OperationsTransactionalAuditBoundary } from '../../operations/public/index.js';

export interface AdminContentRoutesOptions {
  contentRepository: ContentRepository;
  authentication: AuthenticationProvider;
  authorizer: OperationsAuthorizer;
  audit: OperationsAuditRecorder;
  curriculumRepository?: CurriculumRepository;
  transactionalAudit?: OperationsTransactionalAuditBoundary;
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
  const listManagedUC = new ListManagedCharactersUseCase(contentRepository);
  const publishCourseUC = options.curriculumRepository
    ? new PublishCourseRevisionUseCase(options.curriculumRepository)
    : undefined;
  const createCourseUC = options.curriculumRepository
    ? new CreateCourseDraftUseCase(options.curriculumRepository)
    : undefined;
  const createLessonUC = options.curriculumRepository
    ? new CreateLessonDraftUseCase(options.curriculumRepository)
    : undefined;
  const replaceCourseStructureUC = options.curriculumRepository
    ? new ReplaceCourseStructureUseCase(options.curriculumRepository)
    : undefined;
  const deriveCourseWorkingUC = options.curriculumRepository
    ? new DeriveCourseWorkingUseCase(options.curriculumRepository)
    : undefined;
  const deriveLessonWorkingUC = options.curriculumRepository
    ? new DeriveLessonWorkingUseCase(options.curriculumRepository)
    : undefined;
  const replaceLessonStructureUC = options.curriculumRepository
    ? new ReplaceLessonStructureUseCase(options.curriculumRepository)
    : undefined;
  const submitCourseUC = options.curriculumRepository
    ? new SubmitCourseRevisionUseCase(options.curriculumRepository)
    : undefined;
  const reviewCourseUC = options.curriculumRepository
    ? new ReviewCourseRevisionUseCase(options.curriculumRepository)
    : undefined;
  const submitLessonUC = options.curriculumRepository
    ? new SubmitLessonRevisionUseCase(options.curriculumRepository)
    : undefined;
  const reviewLessonUC = options.curriculumRepository
    ? new ReviewLessonRevisionUseCase(options.curriculumRepository)
    : undefined;
  const publishLessonUC = options.curriculumRepository
    ? new PublishLessonRevisionUseCase(options.curriculumRepository)
    : undefined;
  const authenticated = requireAuthentication(authentication);
  const actor = (request: FastifyRequest, permission: 'content.lo_letters.write' | 'content.lo_letters.review' | 'content.lo_letters.publish' | 'content.curriculum.read' | 'content.curriculum.write' | 'content.curriculum.publish') => authorizer.requirePermission(request.authContext!, permission);
  const lifecycleKey = (request: FastifyRequest): string => {
    const value = request.headers['idempotency-key'];
    if (typeof value !== 'string' || !value.trim() || value.length > 128) throw new AppError({ code: VALIDATION_ERROR, message: 'Idempotency-Key 必须是 1 到 128 个字符', httpStatus: 400 });
    return value.trim();
  };
  const requestContext = (request: FastifyRequest) => ({ requestId: request.id, ipAddress: request.ip });
  const record = (request: FastifyRequest, operator: Awaited<ReturnType<typeof actor>>, actionKey: string, id: string | undefined, details: Record<string, unknown>) => audit.recordSuccessfulAction({ operator, actionKey, target: { domain: 'content', type: 'letter', id }, requestContext: requestContext(request), details });

  fastify.get('/letters', { preHandler: authenticated }, async (request, reply) => {
    await actor(request, 'content.lo_letters.write');
    const { classification } = request.query as { classification?: string };
    return reply.code(200).send(await listManagedUC.execute(classification));
  });

  fastify.post('/letters', { preHandler: authenticated }, async (request, reply) => {
    const body = request.body as CreateCharacterDraftInput;
    try {
      const operator = await actor(request, 'content.lo_letters.write');
      const result = await createDraftUC.execute(body, operator.operatorId);
      await record(request, operator, 'content.lo_letters.create', result.characterId, { command: 'create_draft', revision_id: result.revisionId });
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
      const operator = await actor(request, 'content.lo_letters.write');
      const result = await deriveWorkingUC.execute(id, operator.operatorId);
      await record(request, operator, 'content.lo_letters.derive_working', id, { command: 'derive_working', revision_id: result.revisionId });
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
      const operator = await actor(request, 'content.lo_letters.write');
      await updateDraftUC.execute(revId, body);
      await record(request, operator, 'content.lo_letters.update', id, { command: 'update_draft', revision_id: revId });
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
      const operator = await actor(request, 'content.lo_letters.write');
      await submitReviewUC.execute(revId);
      await record(request, operator, 'content.lo_letters.submit_review', id, { command: 'submit_review', revision_id: revId });
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
      const operator = await actor(request, 'content.lo_letters.review');
      await reviewUC.execute(revId, body.action, operator.operatorId, body.remark);
      await record(request, operator, 'content.lo_letters.review', id, { command: 'review', revision_id: revId, action: body.action });
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
      const operator = await actor(request, 'content.lo_letters.publish');
      await publishUC.execute(id, revId);
      await record(request, operator, 'content.lo_letters.publish', id, { command: 'publish', revision_id: revId });
      return reply.code(200).send({ success: true, published_revision_id: revId, status: 'published' });
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      throw new AppError({ code: ILLEGAL_STATE_TRANSITION, message, httpStatus: 400, cause: err });
    }
  });

  if (publishCourseUC && createCourseUC && createLessonUC && replaceCourseStructureUC && deriveCourseWorkingUC && deriveLessonWorkingUC && replaceLessonStructureUC && submitCourseUC && reviewCourseUC && submitLessonUC && reviewLessonUC && publishLessonUC && options.transactionalAudit) {
    const transactionalAudit = options.transactionalAudit;
    fastify.get('/courses', { preHandler: authenticated }, async (request, reply) => {
      const { learningLanguage } = request.query as { learningLanguage?: 'zh' | 'lo' };
      if (learningLanguage !== undefined && learningLanguage !== 'zh' && learningLanguage !== 'lo') throw new AppError({ code: VALIDATION_ERROR, message: 'learningLanguage 无效', httpStatus: 400 });
      await actor(request, 'content.curriculum.read');
      return reply.code(200).send(await options.curriculumRepository!.listManagedCourses(learningLanguage));
    });
    fastify.get('/courses/:courseId', { preHandler: authenticated }, async (request, reply) => {
      await actor(request, 'content.curriculum.read');
      const { courseId } = request.params as { courseId: string };
      const detail = await options.curriculumRepository!.getManagedCourseDetail?.(courseId);
      if (!detail) throw new AppError({ code: 'NOT_FOUND', message: '课程不存在', httpStatus: 404 });
      return reply.code(200).send(detail);
    });
    fastify.post('/courses', { preHandler: authenticated }, async (request, reply) => {
      const body = request.body as { learningLanguage?: 'zh' | 'lo'; snapshot?: unknown };
      if ((body.learningLanguage !== 'zh' && body.learningLanguage !== 'lo') || !body.snapshot) throw new AppError({ code: VALIDATION_ERROR, message: 'learningLanguage 和课程文档为必填项', httpStatus: 400 });
      try {
        const operator = await actor(request, 'content.curriculum.write');
        const result = await createCourseUC.execute({ learningLanguage: body.learningLanguage, snapshot: body.snapshot as never, operatorId: operator.operatorId, audit: transactionalAudit, requestId: request.id, ipAddress: request.ip });
        return reply.code(201).send(result);
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
        const message = err instanceof Error ? err.message : String(err);
        throw new AppError({ code: VALIDATION_ERROR, message, httpStatus: 400, cause: err });
      }
    });
    fastify.post('/courses/:courseId/revisions/:revisionId/re-edit', { preHandler: authenticated }, async (request, reply) => {
      const { courseId, revisionId } = request.params as { courseId: string; revisionId: string };
      const { expectedUpdatedAt } = request.body as { expectedUpdatedAt?: string };
      if (!expectedUpdatedAt) throw new AppError({ code: VALIDATION_ERROR, message: 'expectedUpdatedAt 为必填项', httpStatus: 400 });
      try {
        const operator = await actor(request, 'content.curriculum.write');
        const detail = await options.curriculumRepository!.getManagedCourseDetail?.(courseId);
        if (!detail || detail.publishedRevisionId !== revisionId) throw new AppError({ code: INVALID_DATA, message: '仅当前已发布版本可以派生工作版本', httpStatus: 400 });
        return reply.code(201).send(await deriveCourseWorkingUC.execute({ courseId, expectedUpdatedAt, operatorId: operator.operatorId, audit: transactionalAudit, requestId: request.id, ipAddress: request.ip }));
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
        throw new AppError({ code: INVALID_DATA, message: err instanceof Error ? err.message : String(err), httpStatus: 400, cause: err });
      }
    });

    fastify.post('/lessons', { preHandler: authenticated }, async (request, reply) => {
      const body = request.body as { courseId?: string; unitSortOrder?: unknown; title?: string; description?: string; sortOrder?: unknown; snapshot?: unknown };
      if (!body.courseId || !body.title?.trim() || !Number.isInteger(body.unitSortOrder) || Number(body.unitSortOrder) <= 0 || !Number.isInteger(body.sortOrder) || Number(body.sortOrder) <= 0 || !body.snapshot) throw new AppError({ code: VALIDATION_ERROR, message: '课节归属、名称、排序和课节文档为必填项', httpStatus: 400 });
      try {
        const operator = await actor(request, 'content.curriculum.write');
        const result = await createLessonUC.execute({ courseId: body.courseId, unitSortOrder: Number(body.unitSortOrder), title: body.title.trim(), description: body.description, sortOrder: Number(body.sortOrder), snapshot: body.snapshot as never, operatorId: operator.operatorId, audit: transactionalAudit, requestId: request.id, ipAddress: request.ip });
        return reply.code(201).send(result);
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
        const message = err instanceof Error ? err.message : String(err);
        throw new AppError({ code: VALIDATION_ERROR, message, httpStatus: 400, cause: err });
      }
    });

    fastify.get('/lessons/:lessonId', { preHandler: authenticated }, async (request, reply) => {
      await actor(request, 'content.curriculum.read');
      const { lessonId } = request.params as { lessonId: string };
      const detail = await options.curriculumRepository!.getManagedLessonDetail?.(lessonId);
      if (!detail) throw new AppError({ code: 'NOT_FOUND', message: '课节不存在', httpStatus: 404 });
      return reply.code(200).send(detail);
    });

    fastify.put('/lessons/:lessonId/structure', { preHandler: authenticated }, async (request, reply) => {
      const { lessonId } = request.params as { lessonId: string };
      const body = request.body as { revisionId?: string; expectedLockVersion?: unknown; expectedUpdatedAt?: string; snapshot?: unknown };
      if (!body.revisionId || !body.expectedUpdatedAt || !Number.isInteger(body.expectedLockVersion) || Number(body.expectedLockVersion) < 0 || !body.snapshot) throw new AppError({ code: VALIDATION_ERROR, message: 'revisionId、expectedLockVersion、expectedUpdatedAt 和课节文档为必填项', httpStatus: 400 });
      try {
        const operator = await actor(request, 'content.curriculum.write');
        return reply.code(200).send(await replaceLessonStructureUC.execute({ lessonId, revisionId: body.revisionId, expectedLockVersion: Number(body.expectedLockVersion), expectedUpdatedAt: body.expectedUpdatedAt, snapshot: body.snapshot as never, operatorId: operator.operatorId, audit: transactionalAudit, requestId: request.id, ipAddress: request.ip }));
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
        throw new AppError({ code: INVALID_DATA, message: err instanceof Error ? err.message : String(err), httpStatus: 400, cause: err });
      }
    });

    fastify.post('/lessons/:lessonId/revisions/:revisionId/re-edit', { preHandler: authenticated }, async (request, reply) => {
      const { lessonId, revisionId } = request.params as { lessonId: string; revisionId: string };
      const { expectedUpdatedAt } = request.body as { expectedUpdatedAt?: string };
      if (!expectedUpdatedAt) throw new AppError({ code: VALIDATION_ERROR, message: 'expectedUpdatedAt 为必填项', httpStatus: 400 });
      try {
        const operator = await actor(request, 'content.curriculum.write');
        const detail = await options.curriculumRepository!.getManagedLessonDetail?.(lessonId);
        if (!detail || detail.publishedRevisionId !== revisionId) throw new AppError({ code: INVALID_DATA, message: '仅当前已发布版本可以派生工作版本', httpStatus: 400 });
        return reply.code(201).send(await deriveLessonWorkingUC.execute({ lessonId, expectedUpdatedAt, operatorId: operator.operatorId, audit: transactionalAudit, requestId: request.id, ipAddress: request.ip }));
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
        throw new AppError({ code: INVALID_DATA, message: err instanceof Error ? err.message : String(err), httpStatus: 400, cause: err });
      }
    });

    fastify.put('/courses/:courseId/structure', { preHandler: authenticated }, async (request, reply) => {
      const { courseId } = request.params as { courseId: string };
      const body = request.body as { revisionId?: string; expectedLockVersion?: unknown; expectedUpdatedAt?: string; snapshot?: unknown };
      if (!body.revisionId || !body.expectedUpdatedAt || !Number.isInteger(body.expectedLockVersion) || Number(body.expectedLockVersion) < 0 || !body.snapshot) throw new AppError({ code: VALIDATION_ERROR, message: 'revisionId、expectedLockVersion、expectedUpdatedAt 和课程文档为必填项', httpStatus: 400 });
      try {
        const operator = await actor(request, 'content.curriculum.write');
        const result = await replaceCourseStructureUC.execute({ courseId, revisionId: body.revisionId, expectedLockVersion: Number(body.expectedLockVersion), expectedUpdatedAt: body.expectedUpdatedAt, snapshot: body.snapshot as never, operatorId: operator.operatorId, audit: transactionalAudit, requestId: request.id, ipAddress: request.ip });
        return reply.code(200).send(result);
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
        throw new AppError({ code: INVALID_DATA, message: err instanceof Error ? err.message : String(err), httpStatus: 400, cause: err });
      }
    });

    fastify.post('/lessons/:lessonId/revisions/:revisionId/submit', { preHandler: authenticated }, async (request, reply) => {
      const { lessonId, revisionId } = request.params as { lessonId: string; revisionId: string };
      const { expectedLockVersion } = request.body as { expectedLockVersion?: unknown };
      if (!Number.isInteger(expectedLockVersion) || Number(expectedLockVersion) < 0) throw new AppError({ code: VALIDATION_ERROR, message: 'expectedLockVersion 必须是非负整数', httpStatus: 400 });
      try {
        const operator = await actor(request, 'content.curriculum.write');
        await submitLessonUC.execute({ lessonId, revisionId, expectedLockVersion: Number(expectedLockVersion), operatorId: operator.operatorId, audit: transactionalAudit, requestId: request.id, ipAddress: request.ip, idempotencyKey: lifecycleKey(request) });
        return reply.code(200).send({ success: true, status: 'pending_review' });
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
        throw new AppError({ code: ILLEGAL_STATE_TRANSITION, message: err instanceof Error ? err.message : String(err), httpStatus: 400, cause: err });
      }
    });

    fastify.post('/lessons/:lessonId/revisions/:revisionId/review', { preHandler: authenticated }, async (request, reply) => {
      const { lessonId, revisionId } = request.params as { lessonId: string; revisionId: string };
      const body = request.body as { expectedLockVersion?: unknown; action?: 'approve' | 'reject'; remark?: string };
      if (!Number.isInteger(body.expectedLockVersion) || Number(body.expectedLockVersion) < 0 || (body.action !== 'approve' && body.action !== 'reject') || (body.action === 'reject' && !body.remark?.trim())) throw new AppError({ code: VALIDATION_ERROR, message: 'action、驳回原因或 expectedLockVersion 无效', httpStatus: 400 });
      try {
        const operator = await actor(request, 'content.curriculum.publish');
        await reviewLessonUC.execute({ lessonId, revisionId, expectedLockVersion: Number(body.expectedLockVersion), action: body.action, remark: body.remark, operatorId: operator.operatorId, audit: transactionalAudit, requestId: request.id, ipAddress: request.ip, idempotencyKey: lifecycleKey(request) });
        return reply.code(200).send({ success: true, status: body.action === 'approve' ? 'approved' : 'rejected' });
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
        throw new AppError({ code: ILLEGAL_STATE_TRANSITION, message: err instanceof Error ? err.message : String(err), httpStatus: 400, cause: err });
      }
    });

    fastify.post('/lessons/:lessonId/revisions/:revisionId/publish', { preHandler: authenticated }, async (request, reply) => {
      const { lessonId, revisionId } = request.params as { lessonId: string; revisionId: string };
      const { expectedLockVersion } = request.body as { expectedLockVersion?: unknown };
      if (!Number.isInteger(expectedLockVersion) || Number(expectedLockVersion) < 0) throw new AppError({ code: VALIDATION_ERROR, message: 'expectedLockVersion 必须是非负整数', httpStatus: 400 });
      try {
        const operator = await actor(request, 'content.curriculum.publish');
        await publishLessonUC.execute({ lessonId, revisionId, expectedLockVersion: Number(expectedLockVersion), operatorId: operator.operatorId, audit: transactionalAudit, requestId: request.id, ipAddress: request.ip, idempotencyKey: lifecycleKey(request) });
        return reply.code(200).send({ success: true, published_revision_id: revisionId, status: 'published' });
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
        throw new AppError({ code: ILLEGAL_STATE_TRANSITION, message: err instanceof Error ? err.message : String(err), httpStatus: 400, cause: err });
      }
    });

    fastify.post('/courses/:courseId/revisions/:revisionId/submit', { preHandler: authenticated }, async (request, reply) => {
      const { courseId, revisionId } = request.params as { courseId: string; revisionId: string };
      const { expectedLockVersion } = request.body as { expectedLockVersion?: unknown };
      if (!Number.isInteger(expectedLockVersion) || Number(expectedLockVersion) < 0) throw new AppError({ code: VALIDATION_ERROR, message: 'expectedLockVersion 必须是非负整数', httpStatus: 400 });
      try {
        const operator = await actor(request, 'content.curriculum.write');
        await submitCourseUC.execute({ courseId, revisionId, expectedLockVersion: Number(expectedLockVersion), operatorId: operator.operatorId, audit: transactionalAudit, requestId: request.id, ipAddress: request.ip, idempotencyKey: lifecycleKey(request) });
        return reply.code(200).send({ success: true, status: 'pending_review' });
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
        const message = err instanceof Error ? err.message : String(err);
        throw new AppError({ code: ILLEGAL_STATE_TRANSITION, message, httpStatus: 400, cause: err });
      }
    });

    fastify.post('/courses/:courseId/revisions/:revisionId/review', { preHandler: authenticated }, async (request, reply) => {
      const { courseId, revisionId } = request.params as { courseId: string; revisionId: string };
      const body = request.body as { expectedLockVersion?: unknown; action?: 'approve' | 'reject'; remark?: string };
      if (!Number.isInteger(body.expectedLockVersion) || Number(body.expectedLockVersion) < 0 || (body.action !== 'approve' && body.action !== 'reject') || (body.action === 'reject' && !body.remark?.trim())) throw new AppError({ code: VALIDATION_ERROR, message: 'action、驳回原因或 expectedLockVersion 无效', httpStatus: 400 });
      try {
        const operator = await actor(request, 'content.curriculum.publish');
        await reviewCourseUC.execute({ courseId, revisionId, expectedLockVersion: Number(body.expectedLockVersion), action: body.action, remark: body.remark, operatorId: operator.operatorId, audit: transactionalAudit, requestId: request.id, ipAddress: request.ip, idempotencyKey: lifecycleKey(request) });
        return reply.code(200).send({ success: true, status: body.action === 'approve' ? 'approved' : 'rejected' });
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
        const message = err instanceof Error ? err.message : String(err);
        throw new AppError({ code: ILLEGAL_STATE_TRANSITION, message, httpStatus: 400, cause: err });
      }
    });
    fastify.post('/courses/:courseId/revisions/:revisionId/publish', { preHandler: authenticated }, async (request, reply) => {
      const { courseId, revisionId } = request.params as { courseId: string; revisionId: string };
      const { expectedLockVersion } = request.body as { expectedLockVersion?: unknown };
      if (!Number.isInteger(expectedLockVersion) || Number(expectedLockVersion) < 0) {
        throw new AppError({ code: VALIDATION_ERROR, message: 'expectedLockVersion 必须是非负整数', httpStatus: 400 });
      }
      try {
        const operator = await actor(request, 'content.curriculum.publish');
        await publishCourseUC.execute({
          courseId,
          revisionId,
          expectedLockVersion: Number(expectedLockVersion),
          operatorId: operator.operatorId,
          audit: transactionalAudit,
          requestId: request.id,
          ipAddress: request.ip,
          idempotencyKey: lifecycleKey(request),
        });
        return reply.code(200).send({ success: true, published_revision_id: revisionId, status: 'published' });
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
        const message = err instanceof Error ? err.message : String(err);
        throw new AppError({ code: ILLEGAL_STATE_TRANSITION, message, httpStatus: 400, cause: err });
      }
    });
  }
};
