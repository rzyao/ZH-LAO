import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { GetPublishedAlphabetUseCase } from '../application/use-cases/get-published-alphabet.js';
import type { ContentRepository } from '../application/ports/repositories.js';
import { AppError } from '../../../errors/app-error.js';
import { INTERNAL_ERROR, NOT_FOUND } from '../../../errors/business-codes.js';
import type { CurriculumRepository } from '../application/ports/curriculum-repository.js';

export interface PublicContentRoutesOptions {
  contentRepository: ContentRepository;
  curriculumRepository?: CurriculumRepository;
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
};
