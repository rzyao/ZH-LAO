import type { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { AuthenticationProvider } from '../../../auth/authentication-provider.js';
import { requireAuthentication } from '../../../auth/auth-hook.js';
import { AppError } from '../../../errors/app-error.js';
import { VALIDATION_ERROR } from '../../../errors/business-codes.js';
import type {
  ContentTransactionRunner,
  LaoLetterAdminRepository,
} from '../application/ports/lo-letter-admin-repository.js';
import { ManageLaoLetterSelection } from '../application/use-cases/manage-lo-letter-selection.js';
import type { ManageLaoLetterBatchTasks } from '../application/use-cases/manage-lo-letter-batch-tasks.js';
import { QueryLaoLetterAdminList } from '../application/use-cases/query-lo-letter-admin-list.js';
import type { AudioAdminProjection } from '../application/audio-admin-projection.js';
import { getLaoLetterBatchActionPolicy, type LaoLetterBatchPermission } from '../domain/index.js';
import type { OperationsAuthorizer } from '../../operations/public/index.js';

export type LaoLetterBatchRoutesOptions = Readonly<{
  laoLetterAdminRepository: Pick<LaoLetterAdminRepository, 'list' | 'resolveQuerySelection' | 'resolveExplicitSelection'>;
  contentTransactions: ContentTransactionRunner;
  laoLetterBatchTaskManager?: Pick<ManageLaoLetterBatchTasks,
    'createTask' | 'listOwnedTasks' | 'getOwnedTask' | 'retryFailed'>;
  authentication: AuthenticationProvider;
  authorizer: OperationsAuthorizer;
  audioProjection?: AudioAdminProjection;
}>;

const commaSeparated = z.string()
  .min(1)
  .transform((value) => value.split(','));

const ListQuerySchema = z.object({
  q: z.string().max(128).optional(),
  letter_type: commaSeparated.pipe(z.array(z.enum(['consonant', 'vowel', 'tone_mark', 'other'])).min(1)).optional(),
  letter_class: commaSeparated.pipe(z.array(z.enum(['cons_low', 'cons_middle', 'cons_high'])).min(1)).optional(),
  content_status: commaSeparated.pipe(z.array(z.enum(['active', 'disabled', 'archived'])).min(1)).optional(),
  revision_status: commaSeparated.pipe(z.array(z.enum(['draft', 'pending_review', 'approved', 'rejected', 'none'])).min(1)).optional(),
  sort: z.enum(['sort_order', 'character', 'name', 'romanization', 'updated_at']).default('sort_order'),
  order: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(500).default(50),
}).strict();

const PreviewQuerySchema = z.object({
  q: z.string().max(128).optional(),
  letter_type: z.array(z.enum(['consonant', 'vowel', 'tone_mark', 'other'])).optional(),
  letter_class: z.array(z.enum(['cons_low', 'cons_middle', 'cons_high'])).optional(),
  content_status: z.array(z.enum(['active', 'disabled', 'archived'])).optional(),
  revision_status: z.array(z.enum(['draft', 'pending_review', 'approved', 'rejected', 'none'])).optional(),
  sort: z.enum(['sort_order', 'character', 'name', 'romanization', 'updated_at']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
}).strict();

const PreviewBodySchema = z.object({ query: PreviewQuerySchema }).strict();

const ExplicitSelectionSchema = z.object({
  mode: z.literal('explicit_ids'),
  content_ids: z.array(z.uuid()).min(1),
  expected_count: z.number().int().positive(),
}).strict().superRefine((selection, context) => {
  if (new Set(selection.content_ids).size !== selection.content_ids.length
    || selection.content_ids.length !== selection.expected_count) {
    context.addIssue({ code: 'custom', message: 'Explicit selection/count mismatch' });
  }
});
const QueryAllSelectionSchema = z.object({
  mode: z.literal('query_all'),
  query: PreviewQuerySchema,
  expected_count: z.number().int().positive(),
  selection_hash: z.string().regex(/^[a-f0-9]{64}$/u),
}).strict();
const BatchStartBodySchema = z.object({
  action: z.enum(['submit_review', 'approve', 'reject', 'publish', 'archive']),
  selection: z.discriminatedUnion('mode', [ExplicitSelectionSchema, QueryAllSelectionSchema]),
  reason: z.string().optional(),
}).strict().superRefine((body, context) => {
  const reason = body.reason?.trim();
  const requiresReason = body.action === 'reject' || body.action === 'archive';
  if ((requiresReason && !reason) || (!requiresReason && body.reason !== undefined)) {
    context.addIssue({ code: 'custom', message: 'Invalid reason for action' });
  }
});
const IdempotencyKeySchema = z.string().trim().min(1).max(128);
const TaskListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
}).strict();
const TaskParamsSchema = z.object({ task_id: z.uuid() }).strict();
const TaskDetailQuerySchema = TaskListQuerySchema.extend({
  status: z.enum(['queued', 'running', 'succeeded', 'failed', 'skipped']).optional(),
}).strict();

const actionPermissions: readonly LaoLetterBatchPermission[] = [
  'content.lo_letters.write',
  'content.lo_letters.review',
  'content.lo_letters.publish',
];

function parseQuery(value: unknown): z.infer<typeof ListQuerySchema> {
  const parsed = ListQuerySchema.safeParse(value);
  if (!parsed.success) {
    throw new AppError({
      code: VALIDATION_ERROR,
      message: 'Request validation failed',
      httpStatus: 400,
    });
  }
  return parsed.data;
}

function parsePreviewBody(value: unknown): z.infer<typeof PreviewBodySchema> {
  const parsed = PreviewBodySchema.safeParse(value);
  if (!parsed.success) {
    throw new AppError({
      code: VALIDATION_ERROR,
      message: 'Request validation failed',
      httpStatus: 400,
    });
  }
  return parsed.data;
}

function parseBatchStart(
  body: unknown,
  idempotencyKey: unknown,
): { body: z.infer<typeof BatchStartBodySchema>; idempotencyKey: string } {
  const parsedBody = BatchStartBodySchema.safeParse(body);
  const parsedKey = IdempotencyKeySchema.safeParse(idempotencyKey);
  if (!parsedBody.success || !parsedKey.success) {
    throw new AppError({ code: VALIDATION_ERROR, message: 'Request validation failed', httpStatus: 400 });
  }
  return { body: parsedBody.data, idempotencyKey: parsedKey.data };
}

function itemDto(item: Awaited<ReturnType<QueryLaoLetterAdminList['execute']>>['items'][number]) {
  return {
    content_id: item.contentId,
    character: item.character,
    letter_type: item.letterType,
    letter_class: item.letterClass,
    name: item.name,
    romanization: item.romanization,
    sort_order: item.sortOrder,
    content_status: item.contentStatus,
    working_revision_id: item.workingRevisionId,
    working_revision_status: item.workingRevisionStatus,
    lock_version: item.lockVersion,
    updated_at: item.updatedAt.toISOString(),
    available_actions: item.availableActions,
  };
}

async function permittedActions(
  request: FastifyRequest,
  authorizer: OperationsAuthorizer,
): Promise<readonly string[]> {
  const permissions: string[] = [];
  for (const permission of actionPermissions) {
    try {
      await authorizer.requirePermission(request.authContext!, permission);
      permissions.push(permission);
    } catch (error: unknown) {
      if (!(error instanceof AppError) || error.code !== 'FORBIDDEN') throw error;
    }
  }
  return permissions;
}

export const loLetterBatchRoutes: FastifyPluginAsync<LaoLetterBatchRoutesOptions> = async (
  fastify: FastifyInstance,
  options,
) => {
  const authenticated = requireAuthentication(options.authentication);
  const queryLetters = new QueryLaoLetterAdminList(options.laoLetterAdminRepository);
  const manageSelection = new ManageLaoLetterSelection(
    options.laoLetterAdminRepository,
    options.contentTransactions,
  );

  fastify.get('/lo/letters', { preHandler: authenticated }, async (request, reply) => {
    await options.authorizer.requirePermission(request.authContext!, 'content.lo_letters.read');
    const query = parseQuery(request.query);
    const result = await queryLetters.execute({
      query: {
        ...(query.q === undefined ? {} : { q: query.q }),
        ...(query.letter_type === undefined ? {} : { letterType: query.letter_type }),
        ...(query.letter_class === undefined ? {} : { letterClass: query.letter_class }),
        ...(query.content_status === undefined ? {} : { contentStatus: query.content_status }),
        ...(query.revision_status === undefined ? {} : { revisionStatus: query.revision_status }),
        sort: query.sort,
        order: query.order,
      },
      page: query.page,
      pageSize: query.page_size,
      permissions: await permittedActions(request, options.authorizer),
    });

    const audioByContentId = options.audioProjection
      ? await options.audioProjection.resolveMany(result.items.map((item) => ({ contentType: 'lo_letter', contentId: item.contentId })))
      : new Map();
    return reply.code(200).send({
      items: result.items.map((item) => ({
        ...itemDto(item),
        audio: item.letterType === 'tone_mark' || item.letterType === 'other'
          ? { status: 'no_audio' }
          : audioByContentId.get(item.contentId) ?? { status: 'unavailable' },
      })),
      page: result.page,
      page_size: result.pageSize,
      total: result.total,
      batch_actions: result.batchActions,
    });
  });

  fastify.post('/lo/letters/selection-preview', { preHandler: authenticated }, async (request, reply) => {
    await options.authorizer.requirePermission(request.authContext!, 'content.lo_letters.read');
    const { query } = parsePreviewBody(request.body);
    const result = await manageSelection.previewQuery({
      ...(query.q === undefined ? {} : { q: query.q }),
      ...(query.letter_type === undefined ? {} : { letterType: query.letter_type }),
      ...(query.letter_class === undefined ? {} : { letterClass: query.letter_class }),
      ...(query.content_status === undefined ? {} : { contentStatus: query.content_status }),
      ...(query.revision_status === undefined ? {} : { revisionStatus: query.revision_status }),
      ...(query.sort === undefined ? {} : { sort: query.sort }),
      ...(query.order === undefined ? {} : { order: query.order }),
    });

    return reply.code(200).send({
      query: {
        q: result.query.q,
        letter_type: result.query.letterType,
        letter_class: result.query.letterClass,
        content_status: result.query.contentStatus,
        revision_status: result.query.revisionStatus,
        sort: result.query.sort,
        order: result.query.order,
      },
      expected_count: result.expectedCount,
      selection_hash: result.selectionHash,
    });
  });

  if (options.laoLetterBatchTaskManager) {
    const batchTaskManager = options.laoLetterBatchTaskManager;
    fastify.post('/lo/letters/batch-tasks', { preHandler: authenticated }, async (request, reply) => {
      const parsed = parseBatchStart(request.body, request.headers['idempotency-key']);
      const policy = getLaoLetterBatchActionPolicy(parsed.body.action);
      const operator = await options.authorizer.requirePermission(request.authContext!, policy.permission);
      const selection = parsed.body.selection.mode === 'explicit_ids'
        ? {
            mode: 'explicit_ids' as const,
            contentIds: parsed.body.selection.content_ids,
            expectedCount: parsed.body.selection.expected_count,
          }
        : {
            mode: 'query_all' as const,
            query: fromPreviewQuery(parsed.body.selection.query),
            expectedCount: parsed.body.selection.expected_count,
            selectionHash: parsed.body.selection.selection_hash,
          };
      const task = await batchTaskManager.createTask({
        operatorId: operator.operatorId,
        idempotencyKey: parsed.idempotencyKey,
        action: parsed.body.action,
        selection,
        ...(parsed.body.reason === undefined ? {} : { reason: parsed.body.reason.trim() }),
      });
      return reply.code(200).send(taskDto(task));
    });

    fastify.get('/lo/letters/batch-tasks', { preHandler: authenticated }, async (request, reply) => {
      const operator = await options.authorizer.requirePermission(request.authContext!, 'content.lo_letters.read');
      const query = parse(TaskListQuerySchema, request.query);
      const result = await batchTaskManager.listOwnedTasks({
        operatorId: operator.operatorId,
        page: query.page,
        pageSize: query.page_size,
      });
      return reply.code(200).send({
        items: result.items.map(taskDto),
        page: result.page,
        page_size: result.pageSize,
        total: result.total,
      });
    });

    fastify.get('/lo/letters/batch-tasks/:task_id', { preHandler: authenticated }, async (request, reply) => {
      const operator = await options.authorizer.requirePermission(request.authContext!, 'content.lo_letters.read');
      const params = parse(TaskParamsSchema, request.params);
      const query = parse(TaskDetailQuerySchema, request.query);
      const result = await batchTaskManager.getOwnedTask({
        operatorId: operator.operatorId,
        taskId: params.task_id,
        page: query.page,
        pageSize: query.page_size,
        ...(query.status === undefined ? {} : { status: query.status }),
      });
      return reply.code(200).send({
        task: taskDto(result.task),
        items: result.results.items.map(itemResultDto),
        page: result.results.page,
        page_size: result.results.pageSize,
        total: result.results.total,
      });
    });

    fastify.post('/lo/letters/batch-tasks/:task_id/retry-failed', { preHandler: authenticated }, async (request, reply) => {
      const operator = await options.authorizer.requirePermission(request.authContext!, 'content.lo_letters.read');
      const params = parse(TaskParamsSchema, request.params);
      if (!IdempotencyKeySchema.safeParse(request.headers['idempotency-key']).success) {
        throw new AppError({ code: VALIDATION_ERROR, message: 'Request validation failed', httpStatus: 400 });
      }
      const task = await batchTaskManager.retryFailed({ operatorId: operator.operatorId, taskId: params.task_id });
      return reply.code(200).send(taskDto(task));
    });
  }
};

function parse<Schema extends z.ZodType>(schema: Schema, input: unknown): z.output<Schema> {
  const result = schema.safeParse(input);
  if (!result.success) throw new AppError({ code: VALIDATION_ERROR, message: 'Request validation failed', httpStatus: 400 });
  return result.data;
}

function fromPreviewQuery(query: z.infer<typeof PreviewQuerySchema>) {
  return {
    ...(query.q === undefined ? {} : { q: query.q }),
    ...(query.letter_type === undefined ? {} : { letterType: query.letter_type }),
    ...(query.letter_class === undefined ? {} : { letterClass: query.letter_class }),
    ...(query.content_status === undefined ? {} : { contentStatus: query.content_status }),
    ...(query.revision_status === undefined ? {} : { revisionStatus: query.revision_status }),
    ...(query.sort === undefined ? {} : { sort: query.sort }),
    ...(query.order === undefined ? {} : { order: query.order }),
  };
}

function taskDto(task: Awaited<ReturnType<ManageLaoLetterBatchTasks['createTask']>>) {
  return {
    task_id: task.taskId,
    action: task.action,
    selection_mode: task.selectionMode,
    status: task.status,
    target_count: task.targetCount,
    processed_count: task.processedCount,
    succeeded_count: task.succeededCount,
    failed_count: task.failedCount,
    skipped_count: task.skippedCount,
    last_error_code: task.lastErrorCode,
    created_at: task.createdAt.toISOString(),
    started_at: task.startedAt?.toISOString() ?? null,
    completed_at: task.completedAt?.toISOString() ?? null,
  };
}

function itemResultDto(item: Awaited<ReturnType<ManageLaoLetterBatchTasks['getOwnedTask']>>['results']['items'][number]) {
  return {
    item_no: item.itemNo,
    content_id: item.contentId,
    revision_id: item.revisionId,
    status: item.status,
    error_code: item.errorCode,
    error_message: item.errorMessage,
    retry_count: item.retryCount,
    completed_at: item.completedAt?.toISOString() ?? null,
  };
}
