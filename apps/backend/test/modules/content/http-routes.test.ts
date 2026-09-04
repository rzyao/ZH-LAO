import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../../../src/bootstrap/build-app.js';
import { registerContentRoutes } from '../../../src/modules/content/http/composition.js';
import type { ContentRepository } from '../../../src/modules/content/application/ports/repositories.js';
import type { DatabaseExecutor } from '../../../src/database/executor.js';

const contentRepository = {
  listPublishedCharacters: async () => [{
    id: 'letter-1', unicodeChar: 'ກ', classification: 'consonant', subtype: 'cons_middle',
    ipaPhonetic: 'k', name: 'ko', sortOrder: 1, noAudio: false, audioUrl: null,
  }],
} as unknown as ContentRepository;

describe('Content HTTP route composition', () => {
  it('mounts the public alphabet route and protects all admin routes', async () => {
    const app = buildApp({ logger: pino({ level: 'silent' }), database: {} as DatabaseExecutor });
    await registerContentRoutes(app, {
      contentRepository,
      authentication: { authenticate: async () => null },
      authorizer: { requirePermission: async () => ({ operatorId: 'operator-1', authSubjectId: 'subject-1' }) },
      audit: { recordSuccessfulAction: async () => undefined },
    });

    const publicResponse = await app.inject({ method: 'GET', url: '/api/v1/content/letters' });
    expect(publicResponse.statusCode).toBe(200);
    expect(publicResponse.json()).toMatchObject({ code: 'OK', data: { items: [{ id: 'letter-1' }] } });

    const adminResponse = await app.inject({ method: 'POST', url: '/api/v1/admin/content/letters', payload: {} });
    expect(adminResponse.statusCode).toBe(200);
    expect(adminResponse.json()).toMatchObject({ code: 'UNAUTHENTICATED' });

    await app.close();
  });
});
