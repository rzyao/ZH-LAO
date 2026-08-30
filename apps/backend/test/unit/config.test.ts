import { describe, expect, it } from 'vitest';
import { configSummary, loadConfig } from '../../src/config/env.js';

const valid = { DATABASE_URL: 'postgresql://user:secret@localhost:5432/test' };
describe('configuration', () => {
  it('loads immutable typed defaults without exposing credentials', () => {
    const config = loadConfig(valid);
    expect(config.port).toBe(3000);
    expect(Object.isFrozen(config)).toBe(true);
    expect(JSON.stringify(configSummary(config))).not.toContain('secret');
  });
  it('fails fast for missing database URL and invalid port', () => {
    expect(() => loadConfig({})).toThrow();
    expect(() => loadConfig({ ...valid, APP_PORT: '70000' })).toThrow();
  });
});
