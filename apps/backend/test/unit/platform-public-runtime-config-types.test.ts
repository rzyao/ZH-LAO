import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  platformDefaultLocaleConfig,
  platformMaintenanceNoticeUrlConfig,
  platformSupportEmailConfig,
  type PlatformRuntimeConfigHandle,
  type PlatformRuntimeConfigReader,
} from '../../src/modules/platform/public/index.js';

// Public runtime-config handles are intentionally opaque. A consumer cannot
// manufacture a handle for a registered key while choosing a different T.
// @ts-expect-error missing the module-private brand
const forgedDefaultLocale: PlatformRuntimeConfigHandle<number> = { key: 'default_locale' };

describe('PlatformRuntimeConfigReader public typing', () => {
  it('preserves the canonical value type carried by Platform-owned handles', () => {
    const reader = {
      getRuntimeConfig: (_handle: unknown) => Promise.resolve(''),
    } as unknown as PlatformRuntimeConfigReader;

    expectTypeOf(reader.getRuntimeConfig(platformDefaultLocaleConfig)).toEqualTypeOf<Promise<string>>();
    expectTypeOf(reader.getRuntimeConfig(platformSupportEmailConfig)).toEqualTypeOf<Promise<string>>();
    expectTypeOf(reader.getRuntimeConfig(platformMaintenanceNoticeUrlConfig)).toEqualTypeOf<Promise<string>>();
  });

  it('keeps canonical handle keys stable at runtime', () => {
    expect(platformDefaultLocaleConfig.key).toBe('default_locale');
    expect(platformSupportEmailConfig.key).toBe('support_email');
    expect(platformMaintenanceNoticeUrlConfig.key).toBe('maintenance_notice_url');
    expect(forgedDefaultLocale.key).toBe('default_locale');
  });
});
