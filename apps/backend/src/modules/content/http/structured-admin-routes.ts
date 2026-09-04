import type { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ManageStructuredContentUseCases } from '../application/use-cases/manage-structured-content.js';
import type { StructuredContentRepository } from '../application/ports/structured-content-repository.js';
import {
  getContentCategoryDefinition,
  type ContentLanguage,
  type StructuredContentType,
} from '../domain/language-structure.js';
import { requireAuthentication } from '../../../auth/auth-hook.js';
import type { AuthenticationProvider } from '../../../auth/authentication-provider.js';
import { AppError } from '../../../errors/app-error.js';
import {
  ACTIVE_WORK_CONFLICT,
  ILLEGAL_STATE_TRANSITION,
  INVALID_ARGUMENT,
  INVALID_DATA,
  NOT_FOUND,
  STALE_VERSION_CONFLICT,
} from '../../../errors/business-codes.js';
import {
  assertOperatorPermissionKey,
  type AuthorizedOperatorContext,
  type OperationsAuditRecorder,
  type OperationsAuthorizer,
} from '../../operations/public/index.js';

export interface StructuredAdminRoutesOptions {
  structuredContentRepository: StructuredContentRepository;
  authentication: AuthenticationProvider;
  authorizer: OperationsAuthorizer;
  audit: OperationsAuditRecorder;
}

const routeContentTypes: Readonly<Record<string, StructuredContentType>> = {
  'zh/pinyin-elements': 'zh_pinyin_element',
  'zh/syllables': 'zh_syllable',
  'zh/hanzi': 'zh_hanzi',
  'zh/words': 'zh_word',
  'zh/sentences': 'zh_sentence',
  'lo/letters': 'lo_letter',
  'lo/syllables': 'lo_syllable',
  'lo/words': 'lo_word',
  'lo/sentences': 'lo_sentence',
};

const UpdateBodySchema = z.object({
  snapshot: z.unknown(),
  expectedLockVersion: z.number().int().min(0),
}).strict();
const ReviewBodySchema = z.object({
  action: z.enum(['approve', 'reject']),
  remark: z.string().optional(),
}).strict();

export const structuredAdminRoutes: FastifyPluginAsync<StructuredAdminRoutesOptions> = async (
  fastify: FastifyInstance,
  options,
) => {
  const service = new ManageStructuredContentUseCases(options.structuredContentRepository);
  const authenticated = requireAuthentication(options.authentication);

  const resolve = (request: FastifyRequest): { language: ContentLanguage; contentType: StructuredContentType } => {
    const params = request.params as { language: string; category: string };
    const contentType = routeContentTypes[`${params.language}/${params.category}`];
    if (!contentType) throw appError(INVALID_ARGUMENT, '不存在该语言类别');
    return { language: params.language as ContentLanguage, contentType };
  };

  const authorize = async (
    request: FastifyRequest,
    contentType: StructuredContentType,
    action: 'read' | 'write' | 'review' | 'publish',
  ): Promise<AuthorizedOperatorContext> => {
    const resource = getContentCategoryDefinition(contentType).permissionResource;
    return options.authorizer.requirePermission(
      request.authContext!,
      assertOperatorPermissionKey(`content.${resource}.${action}`),
    );
  };

  const audit = async (
    request: FastifyRequest,
    operator: AuthorizedOperatorContext,
    contentType: StructuredContentType,
    action: string,
    id: string | undefined,
    details: Record<string, unknown>,
  ): Promise<void> => {
    await options.audit.recordSuccessfulAction({
      operator,
      actionKey: `content.${getContentCategoryDefinition(contentType).permissionResource}.${action}`,
      target: { domain: 'content', type: contentType, id },
      requestContext: { requestId: request.id, ipAddress: request.ip },
      details,
    });
  };

  fastify.get('/:language/:category', { preHandler: authenticated }, async (request, reply) => {
    const resolved = resolve(request);
    await authorize(request, resolved.contentType, 'read');
    return reply.code(200).send(await service.list(resolved.language, resolved.contentType));
  });

  fastify.get('/:language/:category/:id/history', { preHandler: authenticated }, async (request, reply) => {
    const resolved = resolve(request);
    const { id } = request.params as { id: string };
    await authorize(request, resolved.contentType, 'read');
    return reply.code(200).send(await handle(() => service.history(resolved.language, resolved.contentType, id)));
  });

  fastify.get('/:language/:category/:id/references', { preHandler: authenticated }, async (request, reply) => {
    const resolved = resolve(request);
    const { id } = request.params as { id: string };
    await authorize(request, resolved.contentType, 'read');
    return reply.code(200).send(await handle(() => service.references(resolved.language, resolved.contentType, id)));
  });

  fastify.post('/:language/:category', { preHandler: authenticated }, async (request, reply) => {
    const resolved = resolve(request);
    const operator = await authorize(request, resolved.contentType, 'write');
    const body = z.object({ snapshot: z.unknown() }).strict().parse(request.body);
    const result = await handle(() => service.create(resolved.language, resolved.contentType, body.snapshot, operator.operatorId));
    await audit(request, operator, resolved.contentType, 'create', result.contentId, { revision_id: result.revisionId });
    return reply.code(201).send(result);
  });

  fastify.post('/:language/:category/:id/derive-working', { preHandler: authenticated }, async (request, reply) => {
    const resolved = resolve(request);
    const { id } = request.params as { id: string };
    const operator = await authorize(request, resolved.contentType, 'write');
    const result = await handle(() => service.derive(id, operator.operatorId));
    await audit(request, operator, resolved.contentType, 'derive_working', id, { revision_id: result.revisionId });
    return reply.code(201).send(result);
  });

  fastify.put('/:language/:category/:id/revisions/:revisionId', { preHandler: authenticated }, async (request, reply) => {
    const resolved = resolve(request);
    const { id, revisionId } = request.params as { id: string; revisionId: string };
    const operator = await authorize(request, resolved.contentType, 'write');
    const body = UpdateBodySchema.parse(request.body);
    const result = await handle(() => service.update(id, revisionId, body.snapshot, body.expectedLockVersion));
    await audit(request, operator, resolved.contentType, 'update', id, { revision_id: revisionId, lock_version: result.lockVersion });
    return reply.code(200).send(result);
  });

  fastify.post('/:language/:category/:id/revisions/:revisionId/submit', { preHandler: authenticated }, async (request, reply) => {
    const resolved = resolve(request);
    const { id, revisionId } = request.params as { id: string; revisionId: string };
    const operator = await authorize(request, resolved.contentType, 'write');
    const result = await handle(() => service.submit(id, revisionId));
    await audit(request, operator, resolved.contentType, 'submit_review', id, { revision_id: revisionId });
    return reply.code(200).send(result);
  });

  fastify.post('/:language/:category/:id/revisions/:revisionId/review', { preHandler: authenticated }, async (request, reply) => {
    const resolved = resolve(request);
    const { id, revisionId } = request.params as { id: string; revisionId: string };
    const operator = await authorize(request, resolved.contentType, 'review');
    const body = ReviewBodySchema.parse(request.body);
    const result = await handle(() => service.review(id, revisionId, body.action, operator.operatorId, body.remark));
    await audit(request, operator, resolved.contentType, 'review', id, { revision_id: revisionId, action: body.action });
    return reply.code(200).send(result);
  });

  fastify.post('/:language/:category/:id/revisions/:revisionId/re-edit', { preHandler: authenticated }, async (request, reply) => {
    const resolved = resolve(request);
    const { id, revisionId } = request.params as { id: string; revisionId: string };
    const operator = await authorize(request, resolved.contentType, 'write');
    const result = await handle(() => service.reEdit(id, revisionId));
    await audit(request, operator, resolved.contentType, 're_edit', id, { revision_id: revisionId });
    return reply.code(200).send(result);
  });

  fastify.post('/:language/:category/:id/revisions/:revisionId/publish', { preHandler: authenticated }, async (request, reply) => {
    const resolved = resolve(request);
    const { id, revisionId } = request.params as { id: string; revisionId: string };
    const operator = await authorize(request, resolved.contentType, 'publish');
    const result = await handle(() => service.publish(id, revisionId));
    await audit(request, operator, resolved.contentType, 'publish', id, { revision_id: revisionId });
    return reply.code(200).send(result);
  });
};

async function handle<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    if (error instanceof AppError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('不存在')) throw appError(NOT_FOUND, message, error);
    if (message.includes('活动工作版本')) throw appError(ACTIVE_WORK_CONFLICT, message, error);
    if (message.includes('其他操作更新')) throw appError(STALE_VERSION_CONFLICT, message, error);
    if (message.includes('状态变更') || message.includes('只有草稿')) {
      throw appError(ILLEGAL_STATE_TRANSITION, message, error);
    }
    throw appError(INVALID_DATA, message, error);
  }
}

function appError(code: typeof INVALID_ARGUMENT | typeof NOT_FOUND | typeof ACTIVE_WORK_CONFLICT | typeof STALE_VERSION_CONFLICT | typeof ILLEGAL_STATE_TRANSITION | typeof INVALID_DATA, message: string, cause?: unknown): AppError;
function appError(code: typeof INVALID_ARGUMENT | typeof NOT_FOUND | typeof ACTIVE_WORK_CONFLICT | typeof STALE_VERSION_CONFLICT | typeof ILLEGAL_STATE_TRANSITION | typeof INVALID_DATA, message: string, cause?: unknown): AppError {
  return new AppError({ code, message, httpStatus: 400, cause });
}
