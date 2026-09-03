import { describe, expect, it } from 'vitest';
import { configSummary, loadConfig } from '../../src/config/env.js';

const valid = { DATABASE_URL: 'postgresql://user:secret@localhost:5432/test' };
describe('configuration', () => {
  it('loads immutable typed defaults without exposing credentials', () => {
    const config = loadConfig(valid);
    expect(config.port).toBe(18080);
    expect(Object.isFrozen(config)).toBe(true);
    expect(JSON.stringify(configSummary(config))).not.toContain('secret');
  });
  it('fails fast for missing database URL and invalid port', () => {
    expect(() => loadConfig({})).toThrow();
    expect(() => loadConfig({ ...valid, APP_PORT: '70000' })).toThrow();
  });
});

describe('capability provider configuration (WP-04)', () => {
  const prod = {
    ...valid,
    APP_ENV: 'production',
    OTP_HMAC_SECRET: 'x'.repeat(32),
    JWT_HMAC_SECRET: 'y'.repeat(32),
  };

  it('defaults every capability provider to fail-safe in development, with memory cache', () => {
    const config = loadConfig(valid);
    expect(config.capabilities).toEqual({
      objectStorage: 'unavailable',
      translation: 'unavailable',
      tts: 'unavailable',
      media: 'unavailable',
      cache: 'memory',
    });
    expect(Object.isFrozen(config.capabilities)).toBe(true);
  });

  it('defaults cache to none in production unless explicitly wired', () => {
    const config = loadConfig(prod);
    expect(config.capabilities.cache).toBe('none');
  });

  it('honors explicit dev providers', () => {
    const config = loadConfig({
      ...valid,
      OBJECT_STORAGE_PROVIDER: 'memory',
      TRANSLATION_PROVIDER: 'fake',
      TTS_PROVIDER: 'fake',
      MEDIA_PROCESSING_PROVIDER: 'fake',
      CACHE_PROVIDER: 'none',
    });
    expect(config.capabilities).toEqual({
      objectStorage: 'memory',
      translation: 'fake',
      tts: 'fake',
      media: 'fake',
      cache: 'none',
    });
  });

  it('rejects unknown provider values instead of silently accepting them', () => {
    expect(() => loadConfig({ ...valid, CACHE_PROVIDER: 'redis' })).toThrow();
    expect(() => loadConfig({ ...valid, TTS_PROVIDER: 'aws-polly' })).toThrow();
  });

  it('rejects dev-only memory/fake providers in production (fail-fast guard)', () => {
    expect(() => loadConfig({ ...prod, OBJECT_STORAGE_PROVIDER: 'memory' })).toThrow();
    expect(() => loadConfig({ ...prod, TRANSLATION_PROVIDER: 'fake' })).toThrow();
    expect(() => loadConfig({ ...prod, TTS_PROVIDER: 'fake' })).toThrow();
    expect(() => loadConfig({ ...prod, MEDIA_PROCESSING_PROVIDER: 'fake' })).toThrow();
    expect(() => loadConfig({ ...prod, CACHE_PROVIDER: 'memory' })).toThrow();
  });
});
