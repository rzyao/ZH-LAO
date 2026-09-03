import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { GetPublishedAlphabetUseCase } from '../application/use-cases/get-published-alphabet.js';
import type { ContentRepository } from '../application/ports/repositories.js';
import { AppError } from '../../../errors/app-error.js';
import { INTERNAL_ERROR } from '../../../errors/business-codes.js';

export interface PublicContentRoutesOptions {
  contentRepository: ContentRepository;
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
};
