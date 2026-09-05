import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { GetPublishedAlphabetUseCase } from '../application/use-cases/get-published-alphabet.js';
import type { ContentRepository } from '../application/ports/repositories.js';
import type { StructuredContentRepository } from '../application/ports/structured-content-repository.js';
import { AppError } from '../../../errors/app-error.js';
import { INTERNAL_ERROR, INVALID_ARGUMENT, NOT_FOUND } from '../../../errors/business-codes.js';
import { z } from 'zod';

import type { CurriculumRepository } from '../application/ports/curriculum-repository.js';

export interface PublicContentRoutesOptions {
  contentRepository: ContentRepository;
  curriculumRepository?: CurriculumRepository;
  structuredContentRepository?: StructuredContentRepository;
}

export const publicContentRoutes: FastifyPluginAsync<PublicContentRoutesOptions> = async (
  fastify: FastifyInstance,
  options
) => {
  const { contentRepository } = options;
  const getPublishedAlphabetUC = new GetPublishedAlphabetUseCase(contentRepository);

  fastify.get('/letters', async (request, reply) => {
    const { classification } = request.query as { classification?: string };
    try {
      const result = await getPublishedAlphabetUC.execute(classification);
      return reply.code(200).send(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new AppError({ code: INTERNAL_ERROR, message, httpStatus: 500, expose: false, cause: err });
    }
  });

  if (options.curriculumRepository) {
    const curriculum = options.curriculumRepository;
    fastify.get('/courses', async (request, reply) => {
      const { learningLanguage } = request.query as { learningLanguage?: 'zh' | 'lo' };
      const items = await curriculum.listPublishedCourses(learningLanguage);
      return reply.code(200).send({ items: items.map((course) => ({
        id: course.id,
        revisionId: course.revisionId,
        title: course.snapshot.title,
        subtitle: course.snapshot.subtitle ?? null,
        sortOrder: course.snapshot.sortOrder,
      })) });
    });

    fastify.get('/courses/:courseId', async (request, reply) => {
      const { courseId } = request.params as { courseId: string };
      const course = await curriculum.findPublishedCourse(courseId);
      if (!course) throw new AppError({ code: NOT_FOUND, message: '课程不存在或未发布', httpStatus: 404 });
      return reply.code(200).send({
        id: course.id,
        revisionId: course.revisionId,
        title: course.snapshot.title,
        subtitle: course.snapshot.subtitle ?? null,
        description: course.snapshot.description ?? null,
        sortOrder: course.snapshot.sortOrder,
      });
    });

    fastify.get('/courses/:courseId/structure', async (request, reply) => {
      const { courseId } = request.params as { courseId: string };
      const course = await curriculum.findPublishedCourse(courseId);
      if (!course) throw new AppError({ code: NOT_FOUND, message: '课程不存在或未发布', httpStatus: 404 });
      return reply.code(200).send({
        course: { id: course.id, revisionId: course.revisionId, title: course.snapshot.title },
        units: course.snapshot.units.map((unit) => ({
          title: unit.title,
          description: unit.description ?? null,
          position: unit.sortOrder,
          lessons: unit.lessons.map((lesson) => ({
            id: lesson.lessonId,
            revisionId: lesson.revisionId,
            title: lesson.title,
            position: lesson.sortOrder,
            status: 'published',
          })),
        })),
      });
    });

    fastify.get('/lessons/:lessonId/content', async (request, reply) => {
      const { lessonId } = request.params as { lessonId: string };
      const lesson = await curriculum.findPublishedLesson(lessonId);
      if (!lesson) throw new AppError({ code: NOT_FOUND, message: '课节不存在或未发布', httpStatus: 404 });
      return reply.code(200).send({
        id: lesson.id,
        revisionId: lesson.revisionId,
        sections: lesson.snapshot.sections.map((section) => ({
          type: section.sectionType,
          title: section.title ?? null,
          description: section.description ?? null,
          position: section.sortOrder,
          items: section.items.map((item) => ({
            type: item.itemType,
            entityId: item.entityId,
            revisionId: item.revisionId,
            position: item.sortOrder,
          })),
        })),
      });
    });
  }
  const dictionaryQuery = z.object({
    language: z.enum(['zh', 'lo']),
    query: z.string().trim().min(1).max(128),
  }).strict();

  fastify.get('/dictionary/lookup', async (request, reply) => {
    const query = parseDictionary(dictionaryQuery, request.query);
    const repository = options.structuredContentRepository;
    if (!repository) throw new AppError({ code: INTERNAL_ERROR, message: 'Dictionary query is unavailable', httpStatus: 500 });
    const item = await repository.findPublishedDictionaryWord(query.language, query.query);
    if (!item) throw new AppError({ code: NOT_FOUND, message: 'Dictionary entry not found', httpStatus: 404 });
    return reply.code(200).send(item);
  });

  fastify.get('/dictionary/:contentId', async (request, reply) => {
    const { contentId } = parseDictionary(z.object({ contentId: z.uuid() }).strict(), request.params);
    const repository = options.structuredContentRepository;
    if (!repository) throw new AppError({ code: INTERNAL_ERROR, message: 'Dictionary query is unavailable', httpStatus: 500 });
    const item = await repository.findPublishedDictionaryWordById(contentId);
    if (!item) throw new AppError({ code: NOT_FOUND, message: 'Dictionary entry not found', httpStatus: 404 });
    return reply.code(200).send(item);
  });

  fastify.get('/dictionary/search', async (request, reply) => {
    const parsed = parseDictionary(z.object({
      language: z.enum(['zh', 'lo']),
      query: z.string().trim().min(1).max(128),
      limit: z.coerce.number().int().min(1).max(50).default(20),
      cursor: z.string().optional(),
    }).strict(), request.query);
    const repository = options.structuredContentRepository;
    if (!repository) throw new AppError({ code: INTERNAL_ERROR, message: 'Dictionary query is unavailable', httpStatus: 500 });
    const after = parseCursor(parsed.cursor, parsed.language, parsed.query);
    const items = await repository.searchPublishedDictionaryWords(parsed.language, parsed.query, parsed.limit + 1, after);
    const page = items.slice(0, parsed.limit).map(publicDictionaryWord);
    const last = page.at(-1);
    return reply.code(200).send({
      items: page,
      nextCursor: items.length > parsed.limit && last && items[page.length - 1]?.searchOrder
        ? Buffer.from(JSON.stringify({ language: parsed.language, query: parsed.query, tier: items[page.length - 1]!.searchOrder!.tier, similarity: items[page.length - 1]!.searchOrder!.similarity, display: last.display, id: last.id })).toString('base64url')
        : null,
    });
  });
};

function publicDictionaryWord<T extends { searchOrder?: unknown }>(item: T): Omit<T, 'searchOrder'> {
  const publicItem = { ...item };
  delete publicItem.searchOrder;
  return publicItem;
}

function parseCursor(cursor: string | undefined, language: 'zh' | 'lo', query: string): { tier: number; similarity: number; display: string; id: string } | undefined {
  if (!cursor) return undefined;
  try {
    const parsed = z.object({
      language: z.enum(['zh', 'lo']), query: z.string(), tier: z.number().int().min(0).max(2),
      similarity: z.number().finite().min(0), display: z.string(), id: z.uuid(),
    }).strict().parse(JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')));
    if (parsed.language !== language || parsed.query !== query) throw new Error('cursor filters differ');
    return { tier: parsed.tier, similarity: parsed.similarity, display: parsed.display, id: parsed.id };
  } catch (cause) {
    throw new AppError({ code: INVALID_ARGUMENT, message: 'Invalid dictionary cursor', httpStatus: 400, cause });
  }
}

function parseDictionary<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (parsed.success) return parsed.data;
  throw new AppError({ code: INVALID_ARGUMENT, message: 'Invalid dictionary query', httpStatus: 400, details: parsed.error.issues });
}
