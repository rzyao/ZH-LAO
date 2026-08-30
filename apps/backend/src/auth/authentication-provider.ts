import type { FastifyRequest } from 'fastify';
import type { AuthContext } from './auth-context.js';

export interface AuthenticationProvider { authenticate(request: FastifyRequest): Promise<AuthContext | null>; }
