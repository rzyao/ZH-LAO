import { describe, expect, it } from 'vitest';
import {
  createDefaultRuntimeConfigRegistry,
  RuntimeConfigRegistry,
} from '../../src/modules/platform/application/use-cases/runtime-config-use-cases.js';
import type { RuntimeConfigDefinition } from '../../src/modules/platform/domain/index.js';

describe('RuntimeConfigRegistry', () => {
  it('registers and retrieves definitions', () => {
    const registry = new RuntimeConfigRegistry();
    const def: RuntimeConfigDefinition<number> = {
      key: 'max_upload_size',
      valueType: 'integer',
      visibility: 'server_only',
      owner: 'platform',
      description: 'Max upload size in MB',
      validate: (v: unknown) => {
        if (typeof v !== 'number' || v <= 0) throw new Error('Must be positive');
        return v;
      },
      fallback: 10,
    };

    registry.register(def);
    expect(registry.has('max_upload_size')).toBe(true);
    expect(registry.get('max_upload_size')).toBe(def);
    expect(registry.get('unknown_key')).toBeUndefined();
    expect(registry.list()).toHaveLength(1);
  });

  it('rejects invalid key formats during registration', () => {
    const registry = new RuntimeConfigRegistry();
    expect(() =>
      registry.register({
        key: 'invalid.key',
        valueType: 'string',
        visibility: 'server_only',
        owner: 'platform',
        description: 'test',
        validate: (v) => String(v),
      }),
    ).toThrow();
  });

  it('default registry includes standard platform configs', () => {
    const defaultRegistry = createDefaultRuntimeConfigRegistry();
    expect(defaultRegistry.has('default_locale')).toBe(true);
    expect(defaultRegistry.has('support_email')).toBe(true);
    expect(defaultRegistry.has('maintenance_notice_url')).toBe(true);
  });
});
