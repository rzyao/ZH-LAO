import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../../../src/bootstrap/build-app.js';
import { registerContentRoutes } from '../../../src/modules/content/http/composition.js';
import type { ContentRepository } from '../../../src/modules/content/application/ports/repositories.js';
import type { StructuredContentRepository } from '../../../src/modules/content/application/ports/structured-content-repository.js';
import type { DatabaseExecutor } from '../../../src/database/executor.js';

const contentRepository = {
  listPublishedCharacters: async () => [{
    id: 'letter-1', unicodeChar: 'ກ', classification: 'consonant', subtype: 'cons_middle',
    ipaPhonetic: 'k', name: 'ko', sortOrder: 1, noAudio: false, audioUrl: null,
  }],
  listManagedCharacters: async () => [{
    id: 'letter-1', unicodeChar: 'ກ', classification: 'consonant', subtype: 'cons_middle',
    ipaPhonetic: 'k', name: 'ko', sortOrder: 1, noAudio: false, status: 'active',
    publishedRevisionId: null, workingRevisionId: null,
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

describe('Content management list route', () => {
  it('returns imported main records without requiring a published revision', async () => {
    const app = buildApp({ logger: pino({ level: 'silent' }), database: {} as DatabaseExecutor });
    await registerContentRoutes(app, {
      contentRepository,
      authentication: { authenticate: async () => ({ subjectId: '00000000-0000-0000-0000-000000000001' as never }) },
      authorizer: { requirePermission: async () => ({ operatorId: 'operator-1', authSubjectId: 'subject-1' }) },
      audit: { recordSuccessfulAction: async () => undefined },
    });

    const response = await app.inject({ method: 'GET', url: '/api/v1/admin/content/letters' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ code: 'OK', data: { total: 1, items: [{ id: 'letter-1', status: 'active' }] } });
    await app.close();
  });
});

describe('中老内容类别管理路由', () => {
  it('九个类别路由逐项使用各自的读取权限', async () => {
    const permissions: string[] = [];
    const structuredContentRepository = {
      list: async () => [],
    } as unknown as StructuredContentRepository;
    const app = buildApp({ logger: pino({ level: 'silent' }), database: {} as DatabaseExecutor });
    await registerContentRoutes(app, {
      contentRepository,
      structuredContentRepository,
      authentication: { authenticate: async () => ({ subjectId: '00000000-0000-4000-8000-000000000001' as never }) },
      authorizer: {
        requirePermission: async (_context, permission) => {
          permissions.push(permission);
          return { operatorId: 'operator-1', authSubjectId: 'subject-1' };
        },
      },
      audit: { recordSuccessfulAction: async () => undefined },
    });

    const routes = [
      'zh/pinyin-elements', 'zh/syllables', 'zh/hanzi', 'zh/words', 'zh/sentences',
      'lo/letters', 'lo/syllables', 'lo/words', 'lo/sentences',
    ];
    for (const route of routes) {
      const response = await app.inject({ method: 'GET', url: `/api/v1/admin/content/${route}` });
      expect(response.json()).toMatchObject({ code: 'OK', data: { total: 0, items: [] } });
    }
    expect(permissions).toEqual([
      'content.zh_pinyin_elements.read', 'content.zh_syllables.read', 'content.zh_hanzi.read',
      'content.zh_words.read', 'content.zh_sentences.read', 'content.lo_letters.read',
      'content.lo_syllables.read', 'content.lo_words.read', 'content.lo_sentences.read',
    ]);
    await app.close();
  });

  it('创建中文拼音元素时使用写入权限并记录成功审计', async () => {
    const permissions: string[] = [];
    const actions: string[] = [];
    const structuredContentRepository = {
      resolveComposition: async () => [],
      saveNew: async () => undefined,
    } as unknown as StructuredContentRepository;
    const app = buildApp({ logger: pino({ level: 'silent' }), database: {} as DatabaseExecutor });
    await registerContentRoutes(app, {
      contentRepository,
      structuredContentRepository,
      authentication: { authenticate: async () => ({ subjectId: '00000000-0000-4000-8000-000000000001' as never }) },
      authorizer: {
        requirePermission: async (_context, permission) => {
          permissions.push(permission);
          return { operatorId: '00000000-0000-4000-8000-000000000002', authSubjectId: 'subject-1' };
        },
      },
      audit: { recordSuccessfulAction: async (input) => { actions.push(input.actionKey); } },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/content/zh/pinyin-elements',
      payload: { snapshot: { fields: { elementType: 'initial', value: 'm', displayForm: 'm' }, composition: [] } },
    });
    expect(response.json()).toMatchObject({ code: 'OK', data: { status: 'draft' } });
    expect(permissions).toEqual(['content.zh_pinyin_elements.write']);
    expect(actions).toEqual(['content.zh_pinyin_elements.create']);
    await app.close();
  });
});
