import type { FastifyInstance, FastifyRequest } from 'fastify';
import { AppError } from '../errors/app-error.js';
import type { AuthContext } from './auth-context.js';
import type { AuthenticationProvider } from './authentication-provider.js';

declare module 'fastify' { interface FastifyRequest { authContext: AuthContext | null; } }

export function installAuthContext(app: FastifyInstance): void {
  app.decorateRequest('authContext', null);
}

export function requireAuthentication(provider?: AuthenticationProvider) {
  return async (request: FastifyRequest): Promise<void> => {
    if (!provider) throw new AppError({ code: 'AUTHENTICATION_UNAVAILABLE', message: 'Authentication is unavailable', httpStatus: 503, expose: false });
    const context = await provider.authenticate(request);
    if (!context) throw new AppError({ code: 'UNAUTHENTICATED', message: 'Authentication required', httpStatus: 401 });
    request.authContext = context;
  };
}
