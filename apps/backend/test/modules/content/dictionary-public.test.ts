import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../../../src/bootstrap/build-app.js';
import { registerContentRoutes } from '../../../src/modules/content/http/composition.js';
import type { ContentRepository } from '../../../src/modules/content/application/ports/repositories.js';
import type { StructuredContentRepository } from '../../../src/modules/content/application/ports/structured-content-repository.js';
import type { DatabaseExecutor } from '../../../src/database/executor.js';

describe('Public dictionary queries', () => {
  it('returns only published public projections and uses an opaque cursor', async () => {
    let searchCalls = 0;
    const app = buildApp({ logger: pino({ level: 'silent' }), database: {} as DatabaseExecutor });
    await registerContentRoutes(app, {
      contentRepository: {} as ContentRepository,
      structuredContentRepository: {
        findPublishedDictionaryWord: async (_language: 'zh' | 'lo', query: string) => query === 'missing' ? null : ({
          id: '00000000-0000-4000-8000-000000000031', language: 'zh',
          revisionId: '00000000-0000-4000-8000-000000000032', display: '你好', romanization: 'ni3 hao3',
        }),
        findPublishedDictionaryWordById: async () => ({
          id: '00000000-0000-4000-8000-000000000031', language: 'zh',
          revisionId: '00000000-0000-4000-8000-000000000032', display: '你好', romanization: 'ni3 hao3',
          meanings: [{ language: 'lo', wordClass: null, definition: 'ສະບາຍດີ', senseOrder: 1 }],
          examples: [{ sentenceId: '00000000-0000-4000-8000-000000000033', display: '你好！', romanization: 'ni3 hao3', sortOrder: 1 }],
          equivalents: [{ targetContentId: '00000000-0000-4000-8000-000000000034', display: 'ສະບາຍດີ', romanization: 'sabaidi', relationType: 'translation', confidence: 100, isPrimary: true }],
          relations: [{ targetContentId: '00000000-0000-4000-8000-000000000035', display: '问候', romanization: 'wen4 hou4', relationType: 'related', sortOrder: 1 }],
          tags: [{ code: 'greeting', name: '问候' }],
        }),
        searchPublishedDictionaryWords: async (_language: 'zh' | 'lo', query: string) => { searchCalls += 1; return query === 'none' ? [] : [{
          id: '00000000-0000-4000-8000-000000000031', language: 'zh',
          revisionId: '00000000-0000-4000-8000-000000000032', display: '你好', romanization: 'ni3 hao3',
        }]; },
      } as unknown as StructuredContentRepository,
      authentication: { authenticate: async () => null },
      authorizer: { requirePermission: async () => ({ operatorId: 'operator-1', authSubjectId: 'subject-1' }) },
      audit: { recordSuccessfulAction: async () => undefined },
    });

    const lookup = await app.inject({ method: 'GET', url: '/api/v1/content/dictionary/lookup?language=zh&query=%E4%BD%A0%E5%A5%BD' });
    expect(lookup.json()).toMatchObject({ code: 'OK', data: { id: '00000000-0000-4000-8000-000000000031' } });
    expect(JSON.stringify(lookup.json())).not.toMatch(/"id"\s*:\s*\d+/);
    const missing = await app.inject({ method: 'GET', url: '/api/v1/content/dictionary/lookup?language=zh&query=missing' });
    expect(missing.json()).toMatchObject({ code: 'NOT_FOUND' });

    const detail = await app.inject({ method: 'GET', url: '/api/v1/content/dictionary/00000000-0000-4000-8000-000000000031' });
    expect(detail.json()).toMatchObject({ code: 'OK', data: { display: '你好', meanings: [{ definition: 'ສະບາຍດີ', senseOrder: 1 }], examples: [{ sentenceId: '00000000-0000-4000-8000-000000000033' }], equivalents: [{ targetContentId: '00000000-0000-4000-8000-000000000034' }], relations: [{ targetContentId: '00000000-0000-4000-8000-000000000035' }], tags: [{ code: 'greeting' }] } });
    expect(JSON.stringify(detail.json())).not.toMatch(/"id"\s*:\s*\d+/);

    const search = await app.inject({ method: 'GET', url: '/api/v1/content/dictionary/search?language=zh&query=ni&limit=20' });
    expect(search.json()).toMatchObject({ code: 'OK', data: { items: [{ display: '你好' }], nextCursor: null } });
    const empty = await app.inject({ method: 'GET', url: '/api/v1/content/dictionary/search?language=zh&query=none' });
    expect(empty.json()).toMatchObject({ code: 'OK', data: { items: [], nextCursor: null } });

    const invalid = await app.inject({ method: 'GET', url: '/api/v1/content/dictionary/search?language=zh&query=ni&cursor=not-a-cursor' });
    expect(invalid.json()).toMatchObject({ code: 'INVALID_ARGUMENT' });
    const invalidLimit = await app.inject({ method: 'GET', url: '/api/v1/content/dictionary/search?language=zh&query=ni&limit=51' });
    const invalidLanguage = await app.inject({ method: 'GET', url: '/api/v1/content/dictionary/search?language=en&query=ni' });
    expect(invalidLimit.json()).toMatchObject({ code: 'INVALID_ARGUMENT' });
    expect(invalidLanguage.json()).toMatchObject({ code: 'INVALID_ARGUMENT' });
    expect(searchCalls).toBe(2);
    await app.close();
  });
});
