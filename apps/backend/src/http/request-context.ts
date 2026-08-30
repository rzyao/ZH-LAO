import { AsyncLocalStorage } from 'node:async_hooks';
import type { FastifyInstance } from 'fastify';

export type RequestContext = Readonly<{ requestId: string }>;
const storage = new AsyncLocalStorage<RequestContext>();

export function installRequestContext(app: FastifyInstance): void {
  app.addHook('onRequest', (request, _reply, done) => storage.run({ requestId: request.id }, done));
  app.addHook('onSend', (request, reply, _payload, done) => {
    void reply.header('x-request-id', request.id);
    done();
  });
}
export function currentRequestContext(): RequestContext | undefined { return storage.getStore(); }
