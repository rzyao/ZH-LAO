import { resolveApiBaseUrl, validateAppConfig, type AppConfig } from '../src/config/env';

const VALID = 'https://api.example.com/';

describe('App config', () => {
  it('normalises an explicit base URL and wins over every fallback', () => {
    expect(resolveApiBaseUrl(VALID, 'native')).toEqual({
      value: 'https://api.example.com',
      issue: null,
    });
  });

  it('rejects non-http schemes', () => {
    const { value, issue } = resolveApiBaseUrl('ftp://files.example.com', 'native');
    expect(value).toBeNull();
    expect(issue?.code).toBe('INVALID_API_BASE_URL');
  });

  it('falls back to the page origin on web only', () => {
    // No window in the jest node/jsdom-less environment of this test file.
    const { value, issue } = resolveApiBaseUrl(null, 'native');
    expect(value).toBeNull();
    expect(issue?.code).toBe('MISSING_API_BASE_URL');
  });

  it('validateAppConfig reports a missing base URL', () => {
    const config = { apiBaseUrl: '', appEnv: 'development' } as unknown as AppConfig;
    const issues = validateAppConfig(config);
    expect(issues).toHaveLength(1);
    expect(issues[0]!.code).toBe('MISSING_API_BASE_URL');

    const ok = { apiBaseUrl: 'https://api.example.com', appEnv: 'development' } as unknown as AppConfig;
    expect(validateAppConfig(ok)).toHaveLength(0);
  });
});
