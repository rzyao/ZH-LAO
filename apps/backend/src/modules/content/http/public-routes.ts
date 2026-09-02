import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { GetPublishedAlphabetUseCase } from '../application/use-cases/get-published-alphabet.js';
import type { ContentRepository } from '../application/ports/repositories.js';

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
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(500).send({ error: 'INTERNAL_ERROR', message: err.message });
    }
  });
};
