import { __setHttpTransportForTests } from '../src/api/client/httpClient';
import { courseApi } from '../src/features/courses/api/courseApi';

describe('courseApi', () => {
  const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;
  beforeEach(() => { process.env.EXPO_PUBLIC_API_URL = 'http://api.test'; });
  afterAll(() => { process.env.EXPO_PUBLIC_API_URL = originalApiUrl; });
  afterEach(() => __setHttpTransportForTests(null));

  it('reads published catalog, structure and lesson content through UUID routes', async () => {
    const request = jest.fn().mockResolvedValue({
      status: 200,
      headers: {},
      data: { code: 'OK', data: { items: [] }, request_id: 'course-api-test' },
    });
    __setHttpTransportForTests({ request } as unknown as Parameters<typeof __setHttpTransportForTests>[0]);
    await courseApi.getCatalog('zh');
    await courseApi.getStructure('00000000-0000-4000-8000-000000000001');
    await courseApi.getLessonContent('00000000-0000-4000-8000-000000000002');
    expect(request.mock.calls.map(([config]) => config.url)).toEqual([
      'http://api.test/api/v1/content/courses?learningLanguage=zh',
      'http://api.test/api/v1/content/courses/00000000-0000-4000-8000-000000000001/structure',
      'http://api.test/api/v1/content/lessons/00000000-0000-4000-8000-000000000002/content',
    ]);
  });
});
